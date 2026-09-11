(() => {
'use strict';

function workshopUrl(value) {
    if (typeof value !== 'string') throw new Error('社区服务地址必须是文字。');
    if (!value.trim()) return '';
    let url;
    try { url = new URL(value.trim()); } catch { throw new Error('请输入完整的社区服务地址。'); }
    if (!(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
        || url.username || url.password || url.search || url.hash) throw new Error('社区服务须使用 HTTPS；本机开发可使用 HTTP。');
    return url.href.replace(/\/+$/, '');
}

function createWorkshopClient(initialUrl = '') {
    let base = workshopUrl(initialUrl), token = '', user = null;
    const logout = () => { token = ''; user = null; };
    const parseUser = value => {
        if (!value || typeof value.id !== 'string' || !value.id.trim()
            || typeof value.login !== 'string' || !value.login.trim()) throw new Error('社区登录信息不完整。');
        return { id: value.id, login: value.login };
    };
    const requiredBase = () => { if (!base) throw new Error('请先配置社区服务地址。'); return base; };
    return {
        configure(value) { const next = workshopUrl(value); if (next !== base) logout(); base = next; return base; },
        logout,
        getUser: () => user ? { ...user } : null,
        async request(path, { method = 'GET', body, signal, auth = false } = {}) {
            const url = requiredBase(), requestToken = token;
            if (auth && !requestToken) throw new Error('请先使用 GitHub 登录社区。');
            const response = await fetch(`${url}${path}`, { method, signal, credentials: 'omit',
                headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
                    ...(auth ? { Authorization: `Bearer ${requestToken}` } : {}) },
                ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
            const data = await response.json().catch(() => null);
            // 已取消或旧连接的响应不能退出后来建立的新会话。
            if (response.status === 401 && base === url && token === requestToken && !signal?.aborted) logout();
            if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : `社区请求失败（${response.status}）。`);
            if (!data || typeof data !== 'object') throw new Error('社区返回的数据格式不正确。');
            return data;
        },
        login(signal) {
            const url = new URL(`${requiredBase()}/auth/start`), nonce = crypto.randomUUID();
            url.searchParams.set('origin', window.location.origin); url.searchParams.set('nonce', nonce);
            // 在点击事件的同步调用链打开窗口，避免授权窗口被浏览器拦截。
            const popup = window.open(url.href, 'yakit-workshop-login', 'popup,width=620,height=740');
            if (!popup) throw new Error('登录窗口被拦截，请允许此页面打开弹窗后重试。');
            return new Promise((resolve, reject) => {
                let timer, poll;
                const finish = (error, value) => {
                    window.removeEventListener('message', receive); signal?.removeEventListener('abort', abort);
                    clearTimeout(timer); clearInterval(poll); popup.close();
                    if (error) reject(error); else resolve(value);
                };
                const abort = () => finish(new Error('已取消社区登录。'));
                const receive = event => {
                    if (event.origin !== url.origin || event.source !== popup || event.data?.type !== 'yakit-workshop-auth'
                        || event.data.nonce !== nonce) return;
                    try {
                        if (typeof event.data.token !== 'string' || !event.data.token.trim()) throw new Error('社区未返回有效会话。');
                        const next = parseUser(event.data.user);
                        // 会话只存在客户端闭包中，不写进状态、工作记录或导出文件。
                        token = event.data.token; user = next; finish(null, { ...user });
                    } catch (error) { finish(error); }
                };
                window.addEventListener('message', receive); signal?.addEventListener('abort', abort, { once: true });
                timer = setTimeout(() => finish(new Error('社区登录已超时，请重试。')), 300000);
                poll = setInterval(() => { if (popup.closed) finish(new Error('登录窗口已关闭。')); }, 500);
                if (signal?.aborted) abort();
            });
        },
    };
}

Object.assign(globalThis.YaKitWorkbench ||= {}, { workshopUrl, createWorkshopClient });
})();
