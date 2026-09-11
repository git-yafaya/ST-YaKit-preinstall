(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.workshopTemplate = `
    <section id="yakit-wb-workshop-page" class="page panel" aria-label="创意工坊" tabindex="-1" hidden>
      <div class="panel-content workshop-content">
        <p class="page-hint">分享与下载作者终审通过的提示词。下载后可在版本记录中查看和使用。</p>
        <details id="yakit-wb-workshop-config" class="workshop-config">
          <summary class="button button-secondary">工坊连接设置</summary>
          <form id="yakit-wb-workshop-config-form" class="settings-form">
            <div class="field"><label for="yakit-wb-workshop-url">工坊地址</label><input id="yakit-wb-workshop-url" type="url" placeholder="https://workshop.example.com" aria-describedby="yakit-wb-workshop-url-hint"><p id="yakit-wb-workshop-url-hint" class="page-hint">填写工坊维护者提供的地址后保存。</p></div>
            <div class="settings-actions"><button id="yakit-wb-workshop-config-save" type="submit" class="button button-primary">保存地址</button></div>
          </form>
        </details>
        <div class="workshop-actions">
          <span id="yakit-wb-workshop-user" class="page-hint"></span>
          <button id="yakit-wb-workshop-login" type="button" class="button button-secondary">GitHub 登录</button>
          <button id="yakit-wb-workshop-logout" type="button" class="button button-secondary" hidden>退出登录</button>
          <button id="yakit-wb-workshop-refresh" type="button" class="button button-secondary">刷新工坊</button>
        </div>
        <p id="yakit-wb-workshop-status" class="page-hint" role="status"></p>
        <div class="workshop-actions" role="group" aria-label="工坊内容">
          <button id="yakit-wb-workshop-browse-tab" type="button" class="button button-secondary" aria-pressed="true">社区作品</button>
          <button id="yakit-wb-workshop-mine-tab" type="button" class="button button-secondary" aria-pressed="false">我的发布</button>
        </div>
        <div id="yakit-wb-workshop-browse">
          <div class="test-options">
            <div class="field"><label for="yakit-wb-workshop-search">搜索作品</label><input id="yakit-wb-workshop-search" type="search" placeholder="标题、介绍或作者"></div>
            <div class="field"><label for="yakit-wb-workshop-tag">标签</label><select id="yakit-wb-workshop-tag"><option value="">全部标签</option></select></div>
          </div>
          <div class="workshop-columns">
            <div><p id="yakit-wb-workshop-empty" class="page-hint"></p><div id="yakit-wb-workshop-list" class="workshop-list" role="group" aria-label="社区作品列表"></div></div>
            <section id="yakit-wb-workshop-detail" class="workshop-detail" aria-labelledby="yakit-wb-workshop-title" hidden>
              <h3 id="yakit-wb-workshop-title"></h3>
              <p id="yakit-wb-workshop-byline" class="page-hint"></p>
              <p id="yakit-wb-workshop-description" class="workshop-text"></p>
              <p id="yakit-wb-workshop-tags" class="page-hint"></p>
              <h4>使用建议</h4><p id="yakit-wb-workshop-usage" class="workshop-text"></p>
              <details class="message-prompt"><summary class="button button-secondary">作者终审记录</summary><div><p class="page-hint">标签「作者终审通过」来自作者保存的终审记录。</p><p id="yakit-wb-workshop-review" class="workshop-text"></p><p id="yakit-wb-workshop-models" class="page-hint"></p>
                <h4>写作需求</h4><p id="yakit-wb-workshop-review-goal" class="workshop-text"></p>
                <h4>试写场景</h4><p id="yakit-wb-workshop-review-scenario" class="workshop-text"></p>
                <h4>样本终审结果</h4><p id="yakit-wb-workshop-review-results" class="workshop-text"></p>
              </div></details>
              <details class="message-prompt"><summary class="button button-secondary">查看提示词正文</summary><pre id="yakit-wb-workshop-content" class="version-content"></pre></details>
              <div class="workshop-actions"><button id="yakit-wb-workshop-download" type="button" class="button button-primary">下载到版本记录</button><button id="yakit-wb-workshop-versions" type="button" class="button button-secondary">打开版本记录</button></div>
              <p id="yakit-wb-workshop-imported" class="page-hint"></p>
            </section>
          </div>
        </div>
        <section id="yakit-wb-workshop-mine" hidden>
          <p id="yakit-wb-workshop-publish-hint" class="page-hint"></p>
          <div class="field"><label for="yakit-wb-workshop-owned">选择发布</label><select id="yakit-wb-workshop-owned"><option value="">发布新作品</option></select></div>
          <form id="yakit-wb-workshop-publish-form" class="settings-form">
            <div class="field"><label for="yakit-wb-workshop-approval">我的终审条目</label><select id="yakit-wb-workshop-approval"></select><p class="page-hint">只显示人工确认终审通过时保存的条目，可随时回来发布。</p></div>
            <details id="yakit-wb-workshop-snapshot" class="message-prompt"><summary class="button button-secondary">查看所选终审条目</summary><div><p id="yakit-wb-workshop-snapshot-review" class="page-hint"></p><pre id="yakit-wb-workshop-snapshot-content" class="version-content"></pre></div></details>
            <div class="field"><label for="yakit-wb-workshop-edit-title">作品标题</label><input id="yakit-wb-workshop-edit-title" required maxlength="120"></div>
            <div class="field"><label for="yakit-wb-workshop-edit-description">作品介绍</label><textarea id="yakit-wb-workshop-edit-description" rows="3" required maxlength="4000"></textarea></div>
            <div class="field"><label for="yakit-wb-workshop-edit-tags">标签（选填，用逗号分隔）</label><input id="yakit-wb-workshop-edit-tags" placeholder="叙事, 角色表现"></div>
            <div class="field"><label for="yakit-wb-workshop-edit-usage">使用建议（选填）</label><textarea id="yakit-wb-workshop-edit-usage" rows="3" maxlength="4000"></textarea></div>
            <div class="workshop-actions"><button id="yakit-wb-workshop-publish" type="submit" class="button button-primary">发布作品</button><button id="yakit-wb-workshop-edit" type="button" class="button button-secondary" hidden>保存介绍</button><button id="yakit-wb-workshop-withdraw" type="button" class="button button-secondary" hidden>下架作品</button></div>
          </form>
          <div id="yakit-wb-workshop-withdraw-confirmation" class="version-delete-confirmation" hidden>
            <p class="page-hint">下架后社区不再显示此作品，已下载的版本会保留。</p>
            <div class="workshop-actions"><button id="yakit-wb-workshop-withdraw-confirm" type="button" class="button button-primary">确认下架</button><button id="yakit-wb-workshop-withdraw-cancel" type="button" class="button button-secondary">取消</button></div>
          </div>
        </section>
      </div>
    </section>`;
})();
