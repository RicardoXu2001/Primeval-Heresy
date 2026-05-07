/**
 * 古堡黑杰克 - Game State & Flow
 */
const Game = {
  meta: null,
  run: null,
  battle: null,

  init() {
    UI.init();
    this.meta = Engine.loadProgress();
    
    // Add escape key listener for pause
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay && pauseOverlay.classList.contains('active')) {
          this.resumeGame();
        } else if (this.battle || this.currentRoom) {
          // Only allow pause if we are in game
          const titleScreen = document.getElementById('screen-title');
          if (!titleScreen.classList.contains('active')) {
            this.pauseGame();
          }
        }
      }
    });
    
    this.showTitle();
  },

  setMenuVisible(visible) {
    const btn = document.getElementById('menu-btn');
    if (btn) {
      if (visible) btn.classList.add('visible');
      else btn.classList.remove('visible');
    }
  },

  pauseGame() {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) pauseOverlay.classList.add('active');
  },

  resumeGame() {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) pauseOverlay.classList.remove('active');
  },

  quitToTitle() {
    this.resumeGame();
    // End current run and return to title without saving it as a complete failure run
    // (We just let them exit)
    this.run = null;
    this.battle = null;
    this.currentRoom = null;
    this.showTitle();
  },

  showTitle() {
    this.setMenuVisible(false);
    UI.showScreen('title');
    const rc = document.getElementById('run-count');
    const intro = document.getElementById('title-intro');
    if (this.meta.totalRuns === 0) {
      intro.textContent = META_DIALOGUE.title_first;
    } else if (this.meta.trueEndingSeen) {
      intro.textContent = META_DIALOGUE.title_after_true;
    } else if (this.meta.totalRuns > 5) {
      intro.textContent = META_DIALOGUE.title_many;
    } else {
      intro.textContent = META_DIALOGUE.title_return;
    }
    rc.textContent = this.meta.totalRuns > 0 ? `第 ${this.meta.totalRuns + 1} 次轮回` : '';
  },

  showRelicSelect() {
    UI.showScreen('relics');
    const exp = document.getElementById('exp-display');
    exp.textContent = `经验值: ${this.meta.experience}`;
    this.run = {
      roomsCleared: [], truePath: true, trueOrder: 0,
      equippedRelics: [], activeSigils: [], specialMet: false
    };
    UI.renderRelics(RELICS, this.meta.unlockedRelics, this.run.equippedRelics, (r) => this.toggleRelic(r));
    this.renderUnlockButtons();
  },

  renderUnlockButtons() {
    const container = document.getElementById('unlock-btns');
    container.innerHTML = '';
    RELICS.forEach(r => {
      if (this.meta.unlockedRelics.includes(r.id)) return;
      const btn = document.createElement('button');
      btn.className = 'btn btn-small';
      btn.textContent = `${r.icon} ${r.name} (${r.cost}经验)`;
      btn.disabled = this.meta.experience < r.cost;
      btn.onclick = () => {
        if (this.unlockRelic(r.id)) {
          this.showRelicSelect();
        }
      };
      container.appendChild(btn);
    });
  },

  toggleRelic(relic) {
    const idx = this.run.equippedRelics.findIndex(r => r.id === relic.id);
    if (idx >= 0) this.run.equippedRelics.splice(idx, 1);
    else if (this.run.equippedRelics.length < 3) this.run.equippedRelics.push(relic);
    UI.renderRelics(RELICS, this.meta.unlockedRelics, this.run.equippedRelics, (r) => this.toggleRelic(r));
  },

  unlockRelic(relicId) {
    const relic = RELICS.find(r => r.id === relicId);
    if (!relic || this.meta.unlockedRelics.includes(relicId)) return false;
    if (this.meta.experience >= relic.cost) {
      this.meta.experience -= relic.cost;
      this.meta.unlockedRelics.push(relicId);
      Engine.saveProgress(this.meta);
      return true;
    }
    return false;
  },

  startRun() {
    if (!this.run) this.run = {
      roomsCleared: [], truePath: true, trueOrder: 0,
      equippedRelics: [], activeSigils: [], specialMet: false
    };
    this.showHall();
  },

  showHall() {
    this.setMenuVisible(true);
    UI.showScreen('hall');
    const remaining = ROOMS.filter(r => !this.run.roomsCleared.includes(r.id));
    if (remaining.length === 0) {
      this.enterBoss();
      return;
    }
    // Determine true path hint
    let trueHint = null;
    if (this.run.truePath) {
      const nextOrder = this.run.trueOrder;
      const nextRoom = ROOMS.find(r => r.order === nextOrder);
      if (nextRoom && !this.run.roomsCleared.includes(nextRoom.id)) trueHint = nextRoom.id;
    }
    const hallDesc = document.getElementById('hall-desc');
    hallDesc.textContent = `已征服 ${this.run.roomsCleared.length}/4 个房间`;
    UI.renderRoomDoors(ROOMS, this.run.roomsCleared, trueHint);
    UI.renderSigilBar(this.run.activeSigils);
  },

  enterRoom(room) {
    this.currentRoom = room;
    UI.showScreen('roomIntro');
    document.getElementById('room-title').textContent = room.name;
    document.getElementById('room-era').textContent = room.era;
    document.getElementById('room-desc').textContent = room.description;
    document.getElementById('apostle-name').textContent = room.apostle.name;
    document.getElementById('apostle-title').textContent = room.apostle.title;
    document.getElementById('room-hint').textContent = room.specialCondition.hint;
    UI.setDialogue(room.apostle.name.split('·')[0].trim(), room.apostle.dialogue.intro);
  },

  enterBoss() {
    this.currentRoom = BOSS;
    UI.showScreen('roomIntro');
    document.getElementById('room-title').textContent = BOSS.name;
    document.getElementById('room-era').textContent = BOSS.era;
    document.getElementById('room-desc').textContent = BOSS.description;
    document.getElementById('apostle-name').textContent = BOSS.apostle.name;
    document.getElementById('apostle-title').textContent = BOSS.apostle.title;
    document.getElementById('room-hint').textContent = this.run.truePath ? '✦ 你感受到了规则的裂缝...' : '';
    const introKey = this.run.truePath ? 'intro_true' : 'intro_normal';
    UI.setDialogue('???', BOSS.apostle.dialogue[introKey]);
  },

  startBattle() {
    const room = this.currentRoom;
    const isBoss = room.id === 'rule_chamber';
    this.battle = {
      deck: Engine.shuffleDeck(Engine.createDeck()),
      playerHand: [], dealerHand: [],
      playerRoundWins: 0, dealerRoundWins: 0,
      roundNum: 1, maxRounds: isBoss ? 5 : 3,
      winsNeeded: isBoss ? 3 : 2,
      phase: 'idle',
      sigils: [...this.run.activeSigils],
      relics: [...this.run.equippedRelics],
      usedAbilities: {},
      chainUsedThisRound: false,
      shieldUsed: false,
      prevHand: null,
      specialConditionMet: false,
      isBoss
    };
    UI.showScreen('battle');
    document.getElementById('battle-opponent-name').textContent = room.apostle.name;
    this.startRound();
  },

  startRound() {
    const b = this.battle;
    b.playerHand = [];
    b.dealerHand = [];
    b.phase = 'player_turn';
    b.usedAbilities = {};
    b.chainUsedThisRound = false;
    b.prevHand = null;

    // Deal initial cards
    b.playerHand.push(Engine.drawCard(b));
    b.dealerHand.push(Engine.drawCard(b));
    b.playerHand.push(Engine.drawCard(b));
    b.dealerHand.push(Engine.drawCard(b));

    // Relic: extra start card
    if (b.relics.some(r => r.id === 'sharp_blade')) {
      b.playerHand.push(Engine.drawCard(b));
    }

    this.updateBattleUI();
    this.setActionButtons(true);
    document.getElementById('round-display').textContent =
      `第 ${b.roundNum} 局 | 你 ${b.playerRoundWins} - ${b.dealerRoundWins} 对手`;
  },

  updateBattleUI() {
    const b = this.battle;
    const revealDealer = b.phase !== 'player_turn' || b.sigils.some(s => s.id === 'peek_eye');
    UI.renderHand('player-cards', b.playerHand);
    UI.renderHand('dealer-cards', b.dealerHand, !revealDealer);

    const ps = Engine.calcScore(b.playerHand, b.sigils, b.relics);
    const pBust = Engine.isBust(ps, b.sigils, b.relics);
    UI.updateScore('player-score', ps, pBust, Engine.isBlackjack(b.playerHand));

    if (revealDealer) {
      const ds = Engine.calcScore(b.dealerHand);
      UI.updateScore('dealer-score', ds, ds > 21, Engine.isBlackjack(b.dealerHand));
    } else {
      UI.updateScore('dealer-score', '?', false, false);
    }

    // Update sigils bar in battle screen
    const bar = document.getElementById('sigils-bar-battle');
    if (bar) {
      bar.innerHTML = '';
      b.sigils.forEach(s => {
        const badge = document.createElement('span');
        badge.className = 'sigil-badge';
        badge.innerHTML = `${s.icon} ${s.name}`;
        bar.appendChild(badge);
      });
    }
    UI.updateAbilityButtons(b.sigils, b.relics, b.usedAbilities);

    // Next card peek
    if (b.relics.some(r => r.id === 'insight_eye') && b.deck.length > 0) {
      UI.updateNextCardPeek(b.deck[b.deck.length - 1]);
    } else {
      UI.updateNextCardPeek(null);
    }
  },

  setActionButtons(enabled) {
    document.getElementById('btn-hit').disabled = !enabled;
    document.getElementById('btn-stand').disabled = !enabled;
    document.getElementById('btn-double').disabled = !enabled || this.battle.playerHand.length > 2;
  },

  hit() {
    const b = this.battle;
    if (b.phase !== 'player_turn') return;
    b.prevHand = [...b.playerHand];
    const card = Engine.drawCard(b);
    b.playerHand.push(card);
    const score = Engine.calcScore(b.playerHand, b.sigils, b.relics);

    if (Engine.isBust(score, b.sigils, b.relics)) {
      // Check shadow shield
      if (b.sigils.some(s => s.id === 'shadow_shield') && !b.shieldUsed) {
        b.shieldUsed = true;
        b.playerHand.pop(); // Remove the bust card
        this.updateBattleUI();
        return;
      }
      this.updateBattleUI();
      this.setActionButtons(false);
      setTimeout(() => this.endRound(), 800);
      return;
    }
    this.updateBattleUI();
  },

  stand() {
    if (this.battle.phase !== 'player_turn') return;
    this.battle.phase = 'dealer_turn';
    this.setActionButtons(false);
    this.dealerPlay();
  },

  double() {
    const b = this.battle;
    if (b.phase !== 'player_turn' || b.playerHand.length > 2) return;
    b.prevHand = [...b.playerHand];
    b.playerHand.push(Engine.drawCard(b));
    b.phase = 'dealer_turn';
    this.setActionButtons(false);
    this.updateBattleUI();
    setTimeout(() => this.dealerPlay(), 600);
  },

  dealerPlay() {
    const b = this.battle;
    const room = this.currentRoom;
    const strategy = room.apostle.strategy;
    const playerScore = Engine.calcScore(b.playerHand, b.sigils, b.relics);

    const dealerTurn = () => {
      let dealerScore = Engine.calcScore(b.dealerHand);
      if (Engine.shouldApostleHit(strategy, dealerScore, playerScore, b.roundNum)) {
        let card = Engine.drawCard(b);
        card = Engine.applyBindingChain(b, card);
        b.dealerHand.push(card);
        this.updateBattleUI();
        setTimeout(dealerTurn, 700);
      } else {
        this.updateBattleUI();
        setTimeout(() => this.endRound(), 500);
      }
    };

    this.updateBattleUI();
    setTimeout(dealerTurn, 600);
  },

  endRound() {
    const b = this.battle;
    let ps = Engine.calcScore(b.playerHand, b.sigils, b.relics);
    let ds = Engine.calcScore(b.dealerHand);
    const pBust = Engine.isBust(ps, b.sigils, b.relics);
    const dBust = ds > 21;

    // Relic: bonus vs high
    if (b.relics.some(r => r.id === 'assassin_heart') && ds >= 17 && !pBust) {
      ps += 2;
    }
    // Sigil: chaos mark
    if (b.sigils.some(s => s.id === 'chaos_mark') && !dBust) {
      ds = Engine.applyChaosEffect(ds);
    }

    b.phase = 'result';
    this.updateBattleUI();

    const winner = Engine.determineWinner(ps, ds, pBust, dBust);
    if (winner === 'player') {
      b.playerRoundWins++;
      // Check special condition
      const room = this.currentRoom;
      if (room.specialCondition && !b.isBoss) {
        const condMet = Engine.checkSpecialCondition(room, b);
        if (condMet) b.specialConditionMet = true;
      }
    } else if (winner === 'dealer') {
      b.dealerRoundWins++;
    }

    // Check battle end
    if (b.playerRoundWins >= b.winsNeeded) {
      setTimeout(() => this.endBattle('player'), 1000);
    } else if (b.dealerRoundWins >= b.winsNeeded) {
      setTimeout(() => this.endBattle('dealer'), 1000);
    } else if (b.roundNum >= b.maxRounds) {
      const bw = b.playerRoundWins > b.dealerRoundWins ? 'player' : 'dealer';
      setTimeout(() => this.endBattle(bw), 1000);
    } else {
      const titles = { player: '本局胜利', dealer: '本局失败', draw: '平局' };
      const cls = { player: 'win', dealer: 'lose', draw: '' };
      UI.showResult(titles[winner], `比分: ${b.playerRoundWins} - ${b.dealerRoundWins}`, cls[winner], '下一局', () => {
        b.roundNum++;
        this.startRound();
      });
    }
  },

  endBattle(winner) {
    const room = this.currentRoom;
    const b = this.battle;
    if (winner === 'player') {
      this.meta.experience += b.isBoss ? 5 : 2;
      if (b.isBoss) {
        this.endGame(this.run.truePath);
        return;
      }
      // Room cleared
      this.run.roomsCleared.push(room.id);
      // Check true path
      if (b.specialConditionMet && room.order === this.run.trueOrder) {
        this.run.trueOrder++;
      } else {
        this.run.truePath = false;
      }

      const title = b.specialConditionMet ? '✦ 特殊胜利 ✦' : '胜利';
      const cls = b.specialConditionMet ? 'special' : 'win';
      const desc = b.specialConditionMet
        ? room.apostle.dialogue.special
        : room.apostle.dialogue.lose;

      UI.showResult(title, desc, cls, '继续', () => {
        // Sigil selection if won
        if (b.sigils.some(s => s.id === 'greedy_touch')) {
          this.showSigilSelect(() => this.showSigilSelect(() => this.showHall()));
        } else {
          this.showSigilSelect(() => this.showHall());
        }
      });
    } else {
      // Defeat
      const desc = room.apostle.dialogue.win || '"你还不够强..."';
      UI.showResult('败北', desc, 'lose', '返回大厅', () => {
        if (b.isBoss) this.endGame(false);
        else this.showHall();
      });
    }
    Engine.saveProgress(this.meta);
  },

  showSigilSelect(onDone) {
    UI.showScreen('sigil');
    // Pick 3 random sigils not already owned
    const owned = this.run.activeSigils.map(s => s.id);
    const available = SIGILS.filter(s => !owned.includes(s.id));
    const choices = [];
    const pool = [...available];
    while (choices.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      choices.push(pool.splice(idx, 1)[0]);
    }
    if (choices.length === 0) { onDone(); return; }
    UI.renderSigilChoices(choices, (sigil) => {
      this.run.activeSigils.push(sigil);
      onDone();
    });
  },

  endGame(trueEnding) {
    this.meta.totalRuns++;
    if (trueEnding) {
      this.meta.trueEndingSeen = true;
      this.meta.experience += 10;
    } else {
      this.meta.normalEndingSeen = true;
    }
    Engine.saveProgress(this.meta);

    UI.showScreen('ending');
    const et = document.getElementById('ending-title');
    const etxt = document.getElementById('ending-text');
    const ebtn = document.getElementById('ending-btn');

    if (trueEnding) {
      et.textContent = '真·结局';
      et.className = 'ending-title true-end';
      etxt.textContent = '你打破了规则的束缚。古堡的大门在你身后崩塌，' +
        '阳光——久违的阳光照在你的脸上。你终于自由了。' +
        '但在风中，你似乎听到了一个低语："在规则之外，还有更深的深渊在等待..."';
    } else {
      const tauntIdx = Math.min(this.meta.totalRuns - 1, META_DIALOGUE.boss_taunt.length - 1);
      et.textContent = '轮回继续...';
      et.className = 'ending-title normal';
      etxt.textContent = META_DIALOGUE.boss_taunt[tauntIdx] +
        '\n\n你被送回了古堡大厅。一切重新开始...但你隐约记得一些什么。';
    }
    ebtn.onclick = () => this.showTitle();
  },

  useAbility(id) {
    const b = this.battle;
    if (b.phase !== 'player_turn') return;
    if (id === 'fate_hand' && !b.usedAbilities.fate_hand && b.playerHand.length > 2) {
      b.usedAbilities.fate_hand = true;
      b.playerHand.pop();
      b.playerHand.push(Engine.drawCard(b));
      this.updateBattleUI();
    }
    if ((id === 'time_rewind' || id === 'life_spring') && b.prevHand && !b.usedAbilities[id]) {
      b.usedAbilities[id] = true;
      b.playerHand = [...b.prevHand];
      b.prevHand = null;
      this.updateBattleUI();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
