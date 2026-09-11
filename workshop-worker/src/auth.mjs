import { allowedOrigin, configured, decode64, encode64, fail, githubHeaders } from './http.mjs';

const bytes = text => new TextEncoder().encode(text);
const base64url = value => encode64(value).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const unbase64url = value => decode64(value.replaceAll('-', '+').replaceAll('_', '/'));
const now = () => Math.floor(Date.now() / 1000);

async function key(env) {
    configured(env, 'SESSION_SECRET');
    if (env.SESSION_SECRET.length < 32) fail(503, '会话密钥至少需要 32 个字符。');
    return crypto.subtle.importKey('raw', bytes(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function sign(value, env) {
    const payload = base64url(bytes(JSON.stringify(value)));
    return `${payload}.${base64url(new Uint8Array(await crypto.subtle.sign('HMAC', await key(env), bytes(payload))))}`;
}

export async function verify(token, kind, env) {
    const signingKey = await key(env);
    try {
        if (typeof token !== 'string' || token.length > 8192) throw new Error();
        const parts = token.split('.');
        if (parts.length !== 2 || !await crypto.subtle.verify('HMAC', signingKey, unbase64url(parts[1]), bytes(parts[0]))) throw new Error();
        const data = JSON.parse(new TextDecoder().decode(unbase64url(parts[0])));
        if (data.kind !== kind || !Number.isSafeInteger(data.exp) || data.exp <= now()) throw new Error();
        return data;
    } catch { fail(401, '登录凭证无效或已过期，请重新登录。'); }
}

export async function currentUser(request, env) {
    const token = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
    const session = await verify(token, 'session', env);
    if (typeof session.user?.id !== 'string' || !session.user.id || typeof session.user.login !== 'string' || !session.user.login) {
        fail(401, '登录身份无效，请重新登录。');
    }
    return { id: session.user.id, login: session.user.login };
}

async function verifier(state, env) {
    // 从服务密钥派生 PKCE 校验串，不把它写进公开的 state。
    return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', await key(env), bytes(`pkce:${state}`))));
}

export async function authStart(url, env) {
    configured(env, 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET');
    const origin = url.searchParams.get('origin'), nonce = url.searchParams.get('nonce');
    if (!allowedOrigin(origin, env)) fail(403, '当前酒馆地址不在服务允许的来源中。');
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(nonce || '')) fail(400, '登录随机标识不正确。');
    const state = await sign({ kind: 'oauth', origin, nonce, salt: crypto.randomUUID(), exp: now() + 600 }, env);
    const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes(await verifier(state, env)))));
    const target = new URL('https://github.com/login/oauth/authorize');
    target.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: `${url.origin}/auth/callback`,
        state, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
    return Response.redirect(target.toString(), 302);
}

export async function authCallback(url, env) {
    configured(env, 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET');
    const stateToken = url.searchParams.get('state');
    const state = await verify(stateToken, 'oauth', env);
    if (!allowedOrigin(state.origin, env)) fail(403, '登录来源已不在允许列表中。');
    if (url.searchParams.has('error') || !url.searchParams.get('code')) fail(401, 'GitHub 登录未完成，请关闭窗口后重试。');
    const response = await fetch('https://github.com/login/oauth/access_token', { method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
            code: url.searchParams.get('code'), redirect_uri: `${url.origin}/auth/callback`,
            code_verifier: await verifier(stateToken, env) }) });
    if (!response.ok) fail(502, 'GitHub 登录暂时不可用，请稍后重试。');
    const credentials = await response.json();
    if (!credentials.access_token) fail(401, 'GitHub 登录授权无效，请重新登录。');
    const identity = await fetch('https://api.github.com/user', { headers: githubHeaders(credentials.access_token) });
    if (!identity.ok) fail(502, '无法读取 GitHub 身份，请重新登录。');
    const account = await identity.json();
    if (!Number.isSafeInteger(account.id) || account.id < 1 || typeof account.login !== 'string' || !account.login) {
        fail(502, 'GitHub 返回的身份格式不正确。');
    }
    const user = { id: String(account.id), login: account.login };
    const token = await sign({ kind: 'session', user, exp: now() + 8 * 3600 }, env);
    // 转义脚本结束符；GitHub 凭据只用于本次身份查询，不返回插件。
    const scriptValue = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
    const message = scriptValue({ type: 'yakit-workshop-auth', nonce: state.nonce, token, user });
    const scriptNonce = crypto.randomUUID();
    return new Response(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>创意工坊登录</title><p>登录完成，可以关闭此窗口。</p><script nonce="${scriptNonce}">if(window.opener){window.opener.postMessage(${message},${scriptValue(state.origin)});window.close();}</script></html>`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'no-referrer',
            'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${scriptNonce}'; base-uri 'none'; frame-ancestors 'none'` } });
}
