import { authCallback, authStart, currentUser } from './auth.mjs';
import { editEntry, loadCatalog, publish } from './catalog.mjs';
import { allowedOrigin, cors, fail, json, readJson } from './http.mjs';

async function route(request, env) {
    const url = new URL(request.url), path = url.pathname, method = request.method;
    const origin = request.headers.get('Origin');
    if (origin && !allowedOrigin(origin, env)) fail(403, '当前酒馆地址不在服务允许的来源中。');
    if (method === 'OPTIONS') return new Response(null, { status: 204 });
    if (method === 'GET' && path === '/health') return json({ ok: true });
    if (method === 'GET' && path === '/auth/start') return authStart(url, env);
    if (method === 'GET' && path === '/auth/callback') return authCallback(url, env);
    if (method === 'GET' && path === '/entries') {
        return json({ entries: (await loadCatalog(env)).entries.filter(entry => !entry.withdrawn) });
    }
    const entryPath = path.match(/^\/entries\/([^/]+)$/);
    if (!((method === 'GET' && ['/me', '/me/entries'].includes(path)) || (method === 'POST' && path === '/entries')
        || (entryPath && ['PATCH', 'DELETE'].includes(method)))) fail(404, '接口不存在。');
    const user = await currentUser(request, env);
    if (method === 'GET' && path === '/me') return json({ user });
    if (method === 'GET' && path === '/me/entries') {
        return json({ entries: (await loadCatalog(env)).entries.filter(entry => entry.author.id === user.id) });
    }
    if (method === 'POST') return json({ entry: await publish(await readJson(request), user, env) });
    let id;
    try { id = decodeURIComponent(entryPath[1]); }
    catch { fail(400, '作品标识不正确。'); }
    return json({ entry: await editEntry(id, method === 'PATCH' ? await readJson(request) : null, user, env, method === 'DELETE') });
}

export default {
    async fetch(request, env) {
        let response;
        try { response = await route(request, env); }
        catch (error) {
            response = Response.json({ error: error.status ? error.message : '创意工坊服务暂时不可用，请稍后重试。' }, { status: error.status || 502 });
        }
        return cors(response, request, env);
    },
};
