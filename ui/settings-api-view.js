(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  /** 连接与模型的异步结果只填写仍在编辑的草稿。 */
  workbench.mountSettingsApi = function(controller, root, onChange) {
    const $ = id => root.querySelector(`#${id}`);
    const inputs = { name: $('api-name'), url: $('api-url'), apiKey: $('api-key'), model: $('api-model') };
    const profile = $('api-profile'), form = $('settings-api-form');
    let editingId = '', revision = 0, profileRequest = 0, modelRequest = 0;
    let loadingProfile = false, profileError = false, usesProfileSecret = false, models = [];
    const fields = () => ({ ...Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value])), profileId: profile.value });
    function syncModels() {
      const values = [...new Set([inputs.model.value.trim(), ...models].filter(Boolean))];
      $('api-model-select').replaceChildren(new Option('请选择模型', ''), ...values.map(model => new Option(model, model)));
      $('api-model-select').value = inputs.model.value.trim();
    }
    function invalidateModels() {
      modelRequest++; models = []; syncModels();
      $('api-fetch-models').disabled = loadingProfile;
      $('api-fetch-models').textContent = '拉取模型';
      $('api-model-status').textContent = '';
    }
    function credentialHint() {
      inputs.url.readOnly = Boolean(profile.value && (loadingProfile || usesProfileSecret));
      inputs.apiKey.placeholder = profile.value ? '复用所选连接的密钥' : '填写 API-Key';
      inputs.url.placeholder = profile.value ? '使用连接默认地址' : 'https://api.example.com/v1';
      $('api-fetch-models').disabled = loadingProfile || profileError;
      onChange();
    }
    function invalidateProfile() {
      profileRequest++; loadingProfile = false; profileError = false;
      $('api-profile-status').textContent = '';
    }
    async function loadProfile(saved = null) {
      invalidateProfile(); invalidateModels(); usesProfileSecret = false;
      if (!profile.value) { credentialHint(); return; }
      const current = profileRequest;
      const initial = { name: inputs.name.value, model: inputs.model.value };
      loadingProfile = true; credentialHint();
      $('api-profile-status').textContent = '正在读取连接配置…';
      try {
        const config = await controller.readApiProfile(profile.value);
        if (current !== profileRequest) return;
        const values = saved ? { ...config, name: saved.name, model: saved.model } : config;
        for (const [key, input] of Object.entries(inputs)) {
          // 读取期间用户改过名称或模型时，保留正在输入的内容。
          if (Object.hasOwn(initial, key) && input.value !== initial[key]) continue;
          input.value = values[key] || '';
        }
        usesProfileSecret = Boolean(config.usesProfileSecret);
        if (!/^https?:\/\//i.test(inputs.url.value)) inputs.url.value = '';
        inputs.name.setCustomValidity(''); syncModels();
        $('api-profile-status').textContent = usesProfileSecret ? '已复用连接密钥；填写自己的 API-Key 后可修改 Base url。' : '已读取连接配置。';
      } catch (error) {
        if (current !== profileRequest) return;
        profileError = true; usesProfileSecret = true;
        inputs.url.value = inputs.apiKey.value = '';
        $('api-profile-status').textContent = error.message || '读取连接配置失败。';
      } finally {
        if (current === profileRequest) { loadingProfile = false; credentialHint(); }
      }
    }
    profile.addEventListener('change', () => loadProfile());
    inputs.name.addEventListener('input', () => inputs.name.setCustomValidity(''));
    inputs.model.addEventListener('input', syncModels);
    for (const input of [inputs.url, inputs.apiKey]) input.addEventListener('input', () => {
      if (profile.value && (loadingProfile || usesProfileSecret) && (input === inputs.url || !input.value)) return;
      // 自己填写地址或密钥后解除连接引用，避免沿用旧请求的结果。
      invalidateProfile(); usesProfileSecret = false; profile.value = '';
      invalidateModels(); credentialHint();
    });
    $('api-model-select').addEventListener('change', () => { inputs.model.value = $('api-model-select').value; });
    $('api-fetch-models').addEventListener('click', async () => {
      const current = ++modelRequest;
      $('api-fetch-models').disabled = true;
      $('api-fetch-models').textContent = '拉取中…';
      $('api-model-status').textContent = '';
      try {
        const result = await controller.fetchApiModels(fields());
        if (current !== modelRequest) return;
        models = result; syncModels();
        $('api-model-status').textContent = `已获取 ${models.length} 个模型`;
      } catch (error) {
        if (current === modelRequest) $('api-model-status').textContent = error.message || '拉取模型失败。';
      } finally {
        if (current === modelRequest) { $('api-fetch-models').disabled = false; $('api-fetch-models').textContent = '拉取模型'; }
      }
    });
    form.addEventListener('submit', event => event.preventDefault());
    return {
      open(config = null) {
        revision++; invalidateProfile();
        editingId = config?.id || ''; usesProfileSecret = false;
        Object.entries(inputs).forEach(([key, input]) => { input.value = config?.[key] || ''; });
        inputs.name.setCustomValidity('');
        const profiles = [...(controller.getState().profiles || [])];
        if (config?.profileId && !profiles.some(item => item.id === config.profileId)) profiles.push({ id: config.profileId, name: '已保存的连接（当前不可用）' });
        profile.replaceChildren(new Option(profiles.length ? '请选择连接配置' : '暂无连接配置，可直接填写接口', ''), ...profiles.map(item => new Option(item.name, item.id)));
        profile.value = config?.profileId || '';
        invalidateModels(); credentialHint(); form.hidden = false;
        if (profile.value) loadProfile(config);
      },
      get canSave() { return !loadingProfile && !profileError; },
      async save() {
        if (loadingProfile || profileError) return false;
        inputs.name.setCustomValidity(inputs.name.value.trim() ? '' : '请填写配置名称');
        if (!form.reportValidity()) return false;
        const current = revision;
        await controller.saveApiConfig(fields(), editingId);
        return current === revision && !controller.getState().error;
      },
      async remove() {
        if (!editingId) return false;
        const current = revision;
        await controller.deleteApiConfig(editingId);
        return current === revision && !controller.getState().error;
      },
      close(keepVisible = false) {
        revision++; invalidateProfile(); invalidateModels(); editingId = '';
        form.hidden = !keepVisible;
        if (!keepVisible) { Object.values(inputs).forEach(input => { input.value = ''; }); profile.value = ''; }
      },
    };
  };
})();
