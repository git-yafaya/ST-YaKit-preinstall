(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountWorkshop = function(controller, root, { run, openPage }) {
    const $ = id => root.querySelector(`#yakit-wb-workshop-${id}`);
    const document = root.ownerDocument;
    const publisher = workbench.mountWorkshopPublish(controller, root, { run });
    let selectedId = '', tab = 'browse', urlEditing = false, openedUrl = '', listKey = '', tagKey = '', configInitialized = false;
    const available = state => (state.workshopEntries || []).filter(entry => !entry.withdrawn && entry.releases?.length)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const current = state => available(state).find(entry => entry.id === selectedId);
    function open() {
      const state = controller.getState();
      // 仅首次进入已配置的工坊时请求，订阅重绘和普通输入均不联网。
      if (state.workshopUrl && openedUrl !== state.workshopUrl && !state.busy) {
        openedUrl = state.workshopUrl;
        return run(() => controller.refreshWorkshop());
      }
    }
    function render(state) {
      const busy = Boolean(state.busy), configured = Boolean(state.workshopUrl);
      if (!urlEditing) $('url').value = state.workshopUrl || '';
      if (!configInitialized) { $('config').open = !configured; configInitialized = true; }
      $('config-save').disabled = busy; $('url').disabled = busy;
      $('login').hidden = Boolean(state.workshopUser); $('login').disabled = busy || !configured;
      $('logout').hidden = !state.workshopUser; $('logout').disabled = busy;
      $('refresh').disabled = busy || !configured;
      $('user').textContent = state.workshopUser ? `已登录 · ${state.workshopUser.login}` : '尚未登录';
      $('status').textContent = state.busy === 'workshop-login' ? '请在登录窗口中完成 GitHub 登录…' : state.busy === 'workshop-read' ? '正在加载工坊…' : state.busy === 'workshop-save' ? '正在保存，请稍候…'
        : !configured ? '先展开连接设置，填写工坊地址。' : '社区作品可以直接浏览，发布作品需要登录 GitHub。';
      $('browse').hidden = tab !== 'browse'; $('mine').hidden = tab !== 'mine';
      $('browse-tab').setAttribute('aria-pressed', String(tab === 'browse'));
      $('mine-tab').setAttribute('aria-pressed', String(tab === 'mine'));
      const entries = available(state), tags = [...new Set(entries.flatMap(entry => entry.tags || []))].sort();
      const nextTagKey = JSON.stringify(tags);
      if (tagKey !== nextTagKey) {
        tagKey = nextTagKey;
        const selectedTag = $('tag').value;
        $('tag').replaceChildren(...['', ...tags].map(tag => {
          const option = document.createElement('option'); option.value = tag; option.textContent = tag || '全部标签'; return option;
        }));
        $('tag').value = tags.includes(selectedTag) ? selectedTag : '';
      }
      const search = $('search').value.trim().toLocaleLowerCase(), tag = $('tag').value;
      const filtered = entries.filter(entry => (!tag || entry.tags?.includes(tag))
        && `${entry.title} ${entry.description} ${entry.author?.login || ''}`.toLocaleLowerCase().includes(search));
      if (!filtered.some(entry => entry.id === selectedId)) selectedId = filtered[0]?.id || '';
      $('empty').hidden = Boolean(filtered.length);
      $('empty').textContent = !configured ? '连接工坊后，这里会显示社区作品。' : entries.length ? '没有匹配的作品，请调整搜索或标签。' : '暂无作品，点击刷新获取最新发布。';
      const nextListKey = JSON.stringify([filtered, selectedId]);
      if (listKey !== nextListKey) {
        listKey = nextListKey;
        $('list').replaceChildren(...filtered.map(entry => {
          const button = document.createElement('button'); button.type = 'button'; button.className = 'button button-secondary workshop-entry';
          button.setAttribute('aria-pressed', String(entry.id === selectedId));
          const title = document.createElement('strong'), byline = document.createElement('span');
          title.textContent = entry.title; byline.className = 'page-hint'; byline.textContent = `${entry.author?.login || '作者'} · 作者终审通过`;
          button.append(title, byline);
          button.addEventListener('click', () => { selectedId = entry.id; render(controller.getState()); });
          return button;
        }));
      }
      const entry = current(state), release = entry?.releases.at(-1), approval = release?.approval;
      $('detail').hidden = !entry;
      // 所有社区内容按纯文本展示，不执行作品中的 HTML 或 Markdown。
      $('title').textContent = entry?.title || '';
      $('byline').textContent = entry ? `${entry.author?.login || '作者'} · 第 ${release.number} 版 · 作者终审通过` : '';
      $('description').textContent = entry?.description || '';
      $('tags').textContent = (entry?.tags || []).join(' · ');
      $('usage').textContent = entry?.usage || '作者未填写使用建议。';
      $('review').textContent = approval ? `第 ${approval.review?.round || 1} 轮 · ${approval.review?.sampleCount || 0} 个样本\n${approval.review?.summary || '未附终审摘要'}` : '';
      $('review-goal').textContent = approval?.goal || '作者未记录需求。';
      $('review-scenario').textContent = approval?.scenario || '作者未记录试写场景。';
      $('review-results').textContent = (approval?.review?.results || []).map(result =>
        `样本 ${result.sampleIndex} · ${result.score} 分\n${result.reason || '未附评分理由'}`).join('\n\n');
      $('models').textContent = `记录模型：${approval?.review?.models?.join('、') || '未记录'}`;
      $('content').textContent = approval?.content || '';
      $('download').disabled = busy || !configured || !entry;
      $('imported').textContent = (state.workshopImports || []).some(item => item.entryId === entry?.id && item.releaseId === release?.id
        && (state.versions || []).some(version => version.id === item.versionId)) ? '此版本已下载，可在版本记录中查看。' : '';
      publisher.render(state);
    }
    $('url').addEventListener('input', () => { urlEditing = true; });
    $('config-form').addEventListener('submit', event => {
      event.preventDefault();
      if (controller.getState().busy || !$('config-form').reportValidity()) return;
      const value = $('url').value;
      return run(async () => {
        await controller.configureWorkshop(value);
        if (controller.getState().error) return;
        urlEditing = false; openedUrl = ''; $('config').open = !controller.getState().workshopUrl;
        await open();
      });
    });
    $('login').addEventListener('click', () => {
      if (controller.getState().busy || !controller.getState().workshopUrl) return;
      // run 会立即执行回调，登录弹窗保留本次用户点击的权限。
      return run(() => controller.loginWorkshop());
    });
    $('logout').addEventListener('click', () => run(() => controller.logoutWorkshop()));
    $('refresh').addEventListener('click', () => {
      if (controller.getState().busy || !controller.getState().workshopUrl) return;
      openedUrl = controller.getState().workshopUrl; return run(() => controller.refreshWorkshop());
    });
    for (const name of ['browse', 'mine']) $(`${name}-tab`).addEventListener('click', () => { tab = name; render(controller.getState()); });
    $('search').addEventListener('input', () => render(controller.getState()));
    $('tag').addEventListener('change', () => render(controller.getState()));
    $('versions').addEventListener('click', () => openPage('versions'));
    $('download').addEventListener('click', () => {
      const state = controller.getState(), entry = current(state);
      if (state.busy || !state.workshopUrl || !entry) return;
      return run(() => controller.importWorkshopEntry(entry.id));
    });
    return { render, open };
  };
})();
