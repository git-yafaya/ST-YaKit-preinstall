(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountSettings = function mountSettings(controller, root, { run, notify }) {
    const $ = id => root.querySelector(`#${id}`);
    const fields = { designApi: 'design-api', secondarySource: 'secondary-source', secondaryProfileId: 'secondary-profile', secondaryUrl: 'secondary-url', secondaryModel: 'secondary-model', secondaryKey: 'secondary-key' };
    const theme = workbench.mountTheme(controller);
    let savedKey = '', profileKey = '', profileEdited = false;
    function showFields() {
      $('secondary-settings').hidden = $('design-api').value !== 'secondary';
      $('profile-settings').hidden = $('secondary-source').value !== 'profile';
      $('custom-settings').hidden = $('secondary-source').value !== 'custom';
      $('secondary-profile').disabled = $('secondary-settings').hidden || $('profile-settings').hidden;
      ['secondary-url', 'secondary-model', 'secondary-key'].forEach(id => {
        $(id).disabled = $('secondary-settings').hidden || $('custom-settings').hidden;
      });
    }
    ['design-api', 'secondary-source'].forEach(id => $(id).addEventListener('change', showFields));
    $('secondary-profile').addEventListener('change', () => { profileEdited = true; });
    $('theme').addEventListener('change', () => run(() => controller.update({ theme: $('theme').value })));
    $('settings-form').addEventListener('submit', event => {
      event.preventDefault();
      run(async () => {
        await controller.update(Object.fromEntries(Object.entries(fields).map(([name, id]) => [name, $(id).value])));
        if (!controller.getState().error) notify('设置已保存。');
      });
    });
    function render(state) {
      const nextProfiles = JSON.stringify(state.profiles || []);
      if (profileKey !== nextProfiles) {
        profileKey = nextProfiles;
        const selected = profileEdited ? $('secondary-profile').value : state.secondaryProfileId;
        $('secondary-profile').replaceChildren(new Option('选择连接配置', ''), ...(state.profiles || []).map(profile => new Option(profile.name, profile.id)));
        $('secondary-profile').value = selected;
      }
      const nextSaved = JSON.stringify(Object.keys(fields).map(name => state[name]));
      if (savedKey !== nextSaved) {
        savedKey = nextSaved; profileEdited = false;
        Object.entries(fields).forEach(([name, id]) => { $(id).value = state[name] || ''; });
        showFields();
      }
      $('theme').value = state.theme || 'st';
      $('main-api-label').textContent = state.mainApiLabel || '当前主 API';
      $('save-settings').disabled = Boolean(state.busy);
      theme.sync();
    }
    return { render, dispose: () => theme.dispose() };
  };
})();
