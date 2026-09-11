import '../../core/workshop-package.js';
import { configured, decode64, encode64, fail, githubHeaders } from './http.mjs';

const { parseApproval, parseMetadata, parseEntry } = globalThis.YaKitWorkbench.workshopPackage;
const CATALOG_LIMIT = 10 * 1024 * 1024;

function location(env) {
    configured(env, 'GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_CONTENT_TOKEN');
    const root = `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}`;
    const branch = env.GITHUB_BRANCH?.trim() || 'main';
    return { root, branch, file: `${root}/contents/catalog.json` };
}

export async function loadCatalog(env) {
    const { root, branch, file } = location(env);
    const headers = githubHeaders(env.GITHUB_CONTENT_TOKEN);
    const response = await fetch(`${file}?ref=${encodeURIComponent(branch)}`, {
        headers: { ...headers, Accept: 'application/vnd.github.object+json' },
    });
    if (response.status === 404) {
        // 文件不存在与私有仓库无权访问都会返回 404，先确认分支存在。
        const check = await fetch(`${root}/branches/${encodeURIComponent(branch)}`, { headers });
        if (!check.ok) fail(502, '无法读取作品仓库或分支，请检查服务配置。');
        return { sha: null, entries: [] };
    }
    if (!response.ok) fail(502, '读取作品仓库失败，请稍后重试。');
    try {
        let fileData = await response.json();
        const sha = fileData.sha;
        if (fileData.type !== 'file' || typeof sha !== 'string' || !sha || fileData.size > CATALOG_LIMIT) throw new Error();
        if (fileData.encoding === 'none') {
            const blob = await fetch(`${root}/git/blobs/${encodeURIComponent(sha)}`, { headers });
            if (!blob.ok) throw new Error();
            fileData = await blob.json();
        }
        if (fileData.encoding !== 'base64' || typeof fileData.content !== 'string') throw new Error();
        const content = decode64(fileData.content.replace(/\s/g, ''));
        if (content.length > CATALOG_LIMIT) throw new Error();
        const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(content));
        if (data.formatVersion !== 1 || !Array.isArray(data.entries)) throw new Error();
        const entries = data.entries.map(parseEntry);
        if (new Set(entries.map(entry => entry.id)).size !== entries.length) throw new Error();
        return { sha, entries };
    } catch { fail(502, '作品目录格式损坏或超过 10 MiB，请维护者检查仓库。'); }
}

async function saveCatalog(catalog, env) {
    const { file, branch } = location(env);
    const bytes = new TextEncoder().encode(JSON.stringify({ formatVersion: 1, entries: catalog.entries }));
    // ponytail: 单文件目录按全部作品读写；超过 10 MiB 时再拆分存储。
    if (bytes.length > CATALOG_LIMIT) fail(413, '作品目录已达到 10 MiB，请联系维护者扩容。');
    const response = await fetch(file, { method: 'PUT', headers: { ...githubHeaders(env.GITHUB_CONTENT_TOKEN), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '更新创意工坊作品目录', content: encode64(bytes), branch,
            ...(catalog.sha ? { sha: catalog.sha } : {}) }) });
    if (response.status === 409 || response.status === 422) fail(409, '作品目录已发生变化或写入受限，请刷新后重试。');
    if (!response.ok) fail(502, '保存作品失败，请检查仓库写入权限或稍后重试。');
}

function input(parse, value) {
    try { return parse(value); }
    catch (error) { fail(400, error.message); }
}

function owned(entries, id, user) {
    const entry = entries.find(item => item.id === id);
    if (!entry) fail(404, '作品不存在。');
    if (entry.author.id !== user.id) fail(403, '只能修改自己发布的作品。');
    return entry;
}

export async function publish(body, user, env) {
    const approval = input(parseApproval, body?.approval);
    const metadata = input(parseMetadata, body?.metadata);
    if (body.entryId !== undefined && (typeof body.entryId !== 'string' || !body.entryId.trim())) fail(400, '作品标识不正确。');
    const catalog = await loadCatalog(env);
    let entry = body.entryId ? owned(catalog.entries, body.entryId, user) : null;
    // 终审声明来自作者本地；这里只检查完整性，不宣称服务复测过正文。
    for (const candidate of catalog.entries.filter(item => item.author.id === user.id)) {
        const previous = candidate.releases.find(release => release.approval.id === approval.id);
        if (!previous) continue;
        if (previous.approval.content !== approval.content) fail(409, '该终审标识已对应其他正文，请重新终审后发布。');
        if (entry && candidate.id !== entry.id) fail(409, '该终审作品已发布到另一条作品中。');
        if (candidate.withdrawn) {
            candidate.withdrawn = false;
            candidate.updatedAt = new Date().toISOString();
            await saveCatalog(catalog, env);
        }
        return candidate;
    }
    const time = new Date().toISOString();
    if (!entry) {
        entry = { id: crypto.randomUUID(), author: user, createdAt: time, updatedAt: time, withdrawn: false, ...metadata, releases: [] };
        catalog.entries.push(entry);
    }
    Object.assign(entry, metadata, { withdrawn: false, updatedAt: time });
    entry.releases.push({ id: crypto.randomUUID(), number: (entry.releases.at(-1)?.number || 0) + 1, createdAt: time, approval });
    await saveCatalog(catalog, env);
    return entry;
}

export async function editEntry(id, body, user, env, withdraw = false) {
    const metadata = withdraw ? null : input(parseMetadata, body);
    const catalog = await loadCatalog(env);
    const entry = owned(catalog.entries, id, user);
    if (withdraw) entry.withdrawn = true;
    else Object.assign(entry, metadata);
    entry.updatedAt = new Date().toISOString();
    await saveCatalog(catalog, env);
    return entry;
}
