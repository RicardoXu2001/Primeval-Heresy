/**
 * 古堡黑杰克 - UI Rendering
 */
const UI = {
  screens: {},

  init() {
    this.screens = {
      title: document.getElementById('screen-title'),
      relics: document.getElementById('screen-relics'),
      hall: document.getElementById('screen-hall'),
      roomIntro: document.getElementById('screen-room-intro'),
      battle: document.getElementById('screen-battle'),
      sigil: document.getElementById('screen-sigil'),
      ending: document.getElementById('screen-ending')
    };
  },

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    if (this.screens[name]) this.screens[name].classList.add('active');
  },

  renderCard(card, faceDown = false) {
    const div = document.createElement('div');
    div.className = `playing-card ${faceDown ? 'face-down' : ''} new-card`;
    div.innerHTML = `
      <div class="card-front card-${card.color}">
        <div class="card-corner top-left"><span class="card-value">${card.value}</span><span class="card-suit-small">${card.suit}</span></div>
        <div class="card-center-suit">${card.suit}</div>
        <div class="card-corner bottom-right"><span class="card-value">${card.value}</span><span class="card-suit-small">${card.suit}</span></div>
      </div>
      <div class="card-back"></div>`;
    return div;
  },

  renderHand(containerId, hand, hideFirst = false) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    hand.forEach((card, i) => {
      el.appendChild(this.renderCard(card, hideFirst && i === 0));
    });
  },

  updateScore(id, score, bust = false, bj = false) {
    const el = document.getElementById(id);
    el.textContent = score;
    el.className = 'score-display' + (bust ? ' bust' : '') + (bj ? ' blackjack' : '');
  },

  renderSigilChoices(sigils, onPick) {
    const grid = document.getElementById('sigil-grid');
    grid.innerHTML = '';
    sigils.forEach(s => {
      const card = document.createElement('div');
      card.className = 'sigil-card';
      card.innerHTML = `<span class="sigil-icon">${s.icon}</span><div class="sigil-name">${s.name}</div><div class="sigil-desc">${s.description}</div>`;
      card.onclick = () => onPick(s);
      grid.appendChild(card);
    });
  },

  renderRelics(allRelics, unlocked, equipped, onToggle) {
    const grid = document.getElementById('relic-grid');
    grid.innerHTML = '';
    allRelics.forEach(r => {
      const isUnlocked = unlocked.includes(r.id);
      const isEquipped = equipped.some(e => e.id === r.id);
      const card = document.createElement('div');
      card.className = 'relic-card' + (!isUnlocked ? ' locked' : '') + (isEquipped ? ' equipped' : '');
      card.innerHTML = `<div class="relic-category">${r.category}</div><span class="relic-icon">${r.icon}</span><div class="relic-name">${r.name}</div><div class="relic-desc">${r.description}</div>${!isUnlocked ? `<div class="relic-cost">需要 ${r.cost} 经验解锁</div>` : ''}`;
      if (isUnlocked) card.onclick = () => onToggle(r);
      grid.appendChild(card);
    });
  },

  renderRoomDoors(rooms, cleared, trueHint) {
    const grid = document.getElementById('rooms-grid');
    grid.innerHTML = '';
    rooms.forEach(r => {
      const isCleared = cleared.includes(r.id);
      const isTrueHint = trueHint === r.id;
      const door = document.createElement('div');
      door.className = 'room-door' + (isCleared ? ' cleared' : '') + (isTrueHint ? ' true-path' : '');
      door.innerHTML = `<div class="room-name">${r.name}</div><div class="room-era">${r.era}</div>`;
      if (!isCleared) door.onclick = () => Game.enterRoom(r);
      grid.appendChild(door);
    });
  },

  renderSigilBar(sigils) {
    const bar = document.getElementById('sigils-bar');
    if (!bar) return;
    bar.innerHTML = '';
    sigils.forEach(s => {
      const badge = document.createElement('span');
      badge.className = 'sigil-badge';
      badge.innerHTML = `${s.icon} ${s.name}`;
      bar.appendChild(badge);
    });
  },

  showResult(title, desc, cls, btnText, onBtn) {
    const ov = document.getElementById('result-overlay');
    ov.querySelector('.result-title').textContent = title;
    ov.querySelector('.result-title').className = 'result-title ' + cls;
    ov.querySelector('.result-desc').textContent = desc;
    const btn = ov.querySelector('.result-btn');
    btn.textContent = btnText;
    btn.onclick = () => { ov.classList.remove('active'); onBtn(); };
    ov.classList.add('active');
  },

  hideResult() {
    document.getElementById('result-overlay').classList.remove('active');
  },

  setDialogue(speaker, text) {
    const box = document.getElementById('dialogue-box');
    if (!box) return;
    box.querySelector('.dialogue-speaker').textContent = speaker;
    const textEl = box.querySelector('.dialogue-text');
    textEl.textContent = '';
    let i = 0;
    const type = () => {
      if (i < text.length) { textEl.textContent += text[i++]; setTimeout(type, 30); }
    };
    type();
  },

  updateAbilityButtons(sigils, relics, usedAbilities) {
    const container = document.getElementById('ability-buttons');
    if (!container) return;
    container.innerHTML = '';
    const abilities = [];
    if (sigils.some(s => s.id === 'fate_hand') && !usedAbilities.fate_hand)
      abilities.push({ id: 'fate_hand', label: '✋ 命运之手', desc: '重抽最后一张牌' });
    if (sigils.some(s => s.id === 'time_rewind') && !usedAbilities.time_rewind)
      abilities.push({ id: 'time_rewind', label: '⏪ 时间回溯', desc: '撤销上次要牌' });
    if (relics.some(r => r.id === 'life_spring') && !usedAbilities.life_spring)
      abilities.push({ id: 'life_spring', label: '💧 生命之泉', desc: '撤销要牌' });
    abilities.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-ability';
      btn.textContent = a.label;
      btn.title = a.desc;
      btn.onclick = () => Game.useAbility(a.id);
      container.appendChild(btn);
    });
  },

  updateNextCardPeek(card) {
    const el = document.getElementById('next-card-peek');
    if (!el) return;
    if (card) { el.style.display = 'block'; el.textContent = `下一张: ${card.value}${card.suit}`; }
    else { el.style.display = 'none'; }
  }
};
