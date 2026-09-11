(() => {
  const workbench = globalThis.YaKitWorkbench ??= {};
  workbench.mountJudgement = function(controller, root, { run }) {
    const document = root.ownerDocument;
    const $ = id => root.querySelector(`#yakit-wb-${id}`);
    let rankingKey = '', sampleKey = '';
    function node(tag, text, className = '') {
      const element = document.createElement(tag);
      element.textContent = text;
      element.className = className;
      return element;
    }
    function evidence(id, items, requirements) {
      $(id).replaceChildren(...items.map(item => {
        // 旧评分只有文字，原样保留；新评分的证据也只作为纯文本展示。
        if (typeof item === 'string') return node('li', item);
        const row = node('li', '');
        const requirement = requirements.find(entry => entry.id === item.requirementId);
        row.append(node('p', `对应要求 · ${item.requirementId}${requirement ? `：${requirement.text}` : ''}`, 'evidence-requirement'),
          node('blockquote', item.quote), node('p', item.reason));
        return row;
      }));
      $(id).hidden = !items.length;
      $(`${id}-empty`).hidden = Boolean(items.length);
    }
    function render(task, trial, trials, busy) {
      const judgement = task?.judgement;
      const requirements = judgement?.requirements || [];
      const scores = (judgement?.results || []).filter(result => trials.some(item => item.id === result.trialId));
      const ranked = [...scores].sort((a, b) => b.score - a.score);
      const ranks = new Map(ranked.map(result => [result.trialId,
        `${ranked.filter(item => item.score === result.score).length > 1 ? '并列' : ''}第 ${ranked.findIndex(item => item.score === result.score) + 1} 名`]));
      const nextRankingKey = JSON.stringify([task?.id, judgement, trial?.id, trials.map(item => [item.id, item.sampleIndex]), busy]);
      if (rankingKey !== nextRankingKey) {
        rankingKey = nextRankingKey;
        $('judgement-overview').hidden = !judgement;
        $('judge-requirements').replaceChildren(...requirements.map(item => node('li', `${item.id} · ${item.kind === 'hard' ? '硬性要求' : '表达效果'}：${item.text}`)));
        $('judge-requirements-empty').hidden = Boolean(requirements.length);
        $('judge-ranking').replaceChildren(...ranked.map(result => {
          const sample = trials.find(item => item.id === result.trialId);
          const row = node('li', '');
          const button = node('button', `${ranks.get(result.trialId)} · 样本 ${sample.sampleIndex}${result.label ? `（盲评 ${result.label}）` : ''} · ${result.score} 分`, 'button button-secondary');
          button.type = 'button'; button.disabled = busy;
          button.setAttribute('aria-current', String(result.trialId === trial?.id));
          button.addEventListener('click', () => run(() => controller.selectTrial(result.trialId)));
          row.append(button);
          return row;
        }));
        $('judge-ranking-empty').hidden = Boolean(ranked.length);
      }
      const score = scores.find(item => item.trialId === trial?.id);
      const nextSampleKey = JSON.stringify([task?.id, score, requirements, ranks.get(trial?.id)]);
      if (sampleKey !== nextSampleKey) {
        sampleKey = nextSampleKey;
        $('sample-score').hidden = !score;
        $('score-label').textContent = score ? `AI 盲评 · ${ranks.get(score.trialId)}${score.label ? ` · ${score.label}` : ''} · ${score.score} / 100` : '';
        $('score-reason').textContent = score?.reason || '';
        evidence('score-violations', score?.violations || [], requirements);
        evidence('score-doubts', score?.doubts || [], requirements);
        $('score-doubts-empty').textContent = judgement?.requirements ? '未发现需进一步核对的疑点。' : '这次历史评分未记录独立疑点。';
      }
      return ranks;
    }
    return { render };
  };
})();
