export function fail(status, message) {
    throw Object.assign(new Error(message), { status });
}

export function configured(env, ...names) {
    if (names.some(name => !env[name]?.trim())) fail(503, '创意工坊服务尚未配置完成。');
}

export function allowedOrigin(origin, env) {
    try {
        const url = new URL(origin);
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) return false;
        const origins = (env.ALLOWED_ORIGINS || '').split(',').map(item => item.trim());
        return origins.includes('*') || origins.includes(origin);
    } catch { return false; }
}

export function cors(response, request, env) {
    const headers = new Headers(response.headers);
    const origin = request.headers.get('Origin');
    if (allowedOrigin(origin, env)) headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    headers.set('Cache-Control', 'no-store');
    return new Response(response.body, { status: response.status, headers });
}

export async function readJson(request) {
    if (!request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase().endsWith('/json')) {
        fail(415, '请使用 JSON 格式提交作品。');
    }
    // 按实际收到的字节限制正文，不能只信任请求头。
    const reader = request.body?.getReader();
    const chunks = [];
    let size = 0;
    if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 512 * 1024) {
                await reader.cancel();
                fail(413, '发布内容超过 512 KiB，请缩短正文或介绍。');
            }
            chunks.push(value);
        }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { fail(400, '提交内容不是有效的 UTF-8 JSON。'); }
}

export const json = value => Response.json(value);

export const encode64 = bytes => {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    }
    return btoa(binary);
};
export const decode64 = text => Uint8Array.from(atob(text), char => char.charCodeAt(0));

export function githubHeaders(token) {
    return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'User-Agent': 'YaKit-Workshop', 'X-GitHub-Api-Version': '2022-11-28' };
}
