/**
 * 古堡黑杰克 - Core Engine
 * Deck, scoring, AI, sigil/relic effects
 */

const Engine = {

  /* ---- Deck Management ---- */
  createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        deck.push({ suit, value, color: getSuitColor(suit) });
      }
    }
    return deck;
  },

  shuffleDeck(deck) {
    const d = [...deck];
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  },

  drawCard(state) {
    if (state.deck.length === 0) {
      state.deck = Engine.shuffleDeck(Engine.createDeck());
    }
    return state.deck.pop();
  },

  /* ---- Score Calculation ---- */
  calcScore(hand, sigils = [], relics = []) {
    let score = 0;
    let aces = 0;
    const hasAceEleven = sigils.some(s => s.id === 'dual_coin');

    for (const card of hand) {
      const v = getCardNumericValue(card.value);
      if (card.value === 'A') {
        aces++;
        score += 11;
      } else {
        score += v;
      }
    }

    // Reduce aces from 11 to 1 if over bust threshold (unless dual_coin)
    if (!hasAceEleven) {
      while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
      }
    }

    return score;
  },

  getBustThreshold(sigils = [], relics = []) {
    let threshold = 21;
    // Relic: tough_armor +1
    if (relics.some(r => r.id === 'tough_armor')) threshold += 1;
    // Sigil: unyielding sets to 23
    const unyielding = sigils.find(s => s.id === 'unyielding');
    if (unyielding) threshold = Math.max(threshold, 23);
    return threshold;
  },

  isBust(score, sigils = [], relics = []) {
    return score > Engine.getBustThreshold(sigils, relics);
  },

  isBlackjack(hand) {
    return hand.length === 2 && Engine.calcScore(hand) === 21;
  },

  /* ---- Apostle AI ---- */
  shouldApostleHit(strategy, dealerScore, playerVisibleScore, round) {
    switch (strategy) {
      case 'aggressive':
        // Hits until 18
        return dealerScore < 18;
      case 'conservative':
        // Standard dealer: hits until 17
        return dealerScore < 17;
      case 'calculated':
        // Tries to beat player's visible score, but won't risk over 19
        if (dealerScore >= 19) return false;
        if (dealerScore > playerVisibleScore) return false;
        return dealerScore < 18;
      case 'chaotic':
        // Unpredictable
        if (dealerScore >= 20) return false;
        if (dealerScore <= 11) return true;
        return Math.random() < 0.55;
      case 'adaptive':
        // Boss: adapts based on player score
        if (dealerScore >= 20) return false;
        if (dealerScore <= playerVisibleScore && dealerScore < 19) return true;
        if (dealerScore < 17) return true;
        return false;
      default:
        return dealerScore < 17;
    }
  },

  /* ---- Relic: binding_chain effect ---- */
  applyBindingChain(state, card) {
    const relics = state.relics || state.equippedRelics || [];
    const hasChain = relics.some(r => r.id === 'binding_chain');
    if (hasChain && !state.chainUsedThisRound && Math.random() < 0.3) {
      state.chainUsedThisRound = true;
      // Replace card with a low card (2 of a random suit)
      return { suit: SUITS[Math.floor(Math.random() * 4)], value: '2', color: 'black' };
    }
    return card;
  },

  /* ---- Sigil: chaos_mark effect ---- */
  applyChaosEffect(dealerScore) {
    const delta = Math.floor(Math.random() * 3) + 1;
    const direction = Math.random() < 0.5 ? 1 : -1;
    return dealerScore + (delta * direction);
  },

  /* ---- Special Victory Conditions ---- */
  checkSpecialCondition(room, battleState) {
    const cond = room.specialCondition;
    switch (cond.type) {
      case 'blackjack':
        // Win the decisive round with natural blackjack
        return Engine.isBlackjack(battleState.playerHand);
      case 'five_cards':
        // Win a round with 5+ cards
        return battleState.playerHand.length >= 5 &&
               !Engine.isBust(Engine.calcScore(battleState.playerHand), battleState.sigils, battleState.relics);
      case 'margin_one': {
        // Win by exactly 1 point
        const ps = Engine.calcScore(battleState.playerHand, battleState.sigils, battleState.relics);
        const ds = Engine.calcScore(battleState.dealerHand);
        return (ps - ds) === 1;
      }
      case 'clean_sweep':
        // Win 2-0 in best of 3
        return battleState.playerRoundWins >= 2 && battleState.dealerRoundWins === 0;
      default:
        return false;
    }
  },

  /* ---- Determine Round Winner ---- */
  determineWinner(playerScore, dealerScore, playerBust, dealerBust) {
    if (playerBust && dealerBust) return 'draw';
    if (playerBust) return 'dealer';
    if (dealerBust) return 'player';
    if (playerScore > dealerScore) return 'player';
    if (dealerScore > playerScore) return 'dealer';
    return 'draw';
  },

  /* ---- Save/Load ---- */
  saveProgress(meta) {
    try {
      localStorage.setItem('castle_blackjack_meta', JSON.stringify(meta));
    } catch (e) { /* silently fail */ }
  },

  loadProgress() {
    try {
      const data = localStorage.getItem('castle_blackjack_meta');
      if (data) return JSON.parse(data);
    } catch (e) { /* silently fail */ }
    return {
      totalRuns: 0,
      normalEndingSeen: false,
      trueEndingSeen: false,
      experience: 0,
      unlockedRelics: []
    };
  }
};
