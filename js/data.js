/**
 * 古堡黑杰克 - Game Data
 * Rooms, Sigils, Relics, Apostle AI, Dialogue
 */

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function getSuitColor(suit) {
  return (suit === '♥' || suit === '♦') ? 'red' : 'black';
}

function getCardNumericValue(value) {
  if (value === 'A') return 11;
  if (['K', 'Q', 'J'].includes(value)) return 10;
  return parseInt(value);
}

/* ---------- ROOMS ---------- */
const ROOMS = [
  {
    id: 'ballroom', name: '舞会大厅', era: '1920年代', order: 0,
    description: '华丽的水晶吊灯下，腐朽的乐声仍在回荡。一位身着燕尾服的贵族正等待着你的挑战。',
    ambience: 'warm',
    apostle: {
      name: '堕落的贵族 · 艾德蒙', title: '永恒舞会的主人',
      strategy: 'aggressive',
      dialogue: {
        intro: '"欢迎来到我的舞会，旅者。在这里，只有命运的筹码才有意义。"',
        win: '"哈哈哈...你的运气如同这舞会，终将落幕。"',
        lose: '"不...这不可能...我的舞会..."',
        special: '"21点...完美的数字。你...你是谁？"'
      }
    },
    specialCondition: {
      type: 'blackjack',
      description: '以天然21点（黑杰克）赢得决胜局',
      hint: '✦ 完美的数字承载着命运的重量...'
    }
  },
  {
    id: 'alchemy', name: '炼金工坊', era: '1500年代', order: 1,
    description: '空气中弥漫着硫磺与水银的气味。瓶瓶罐罐中流动着不明液体，一个佝偻的身影在工作台前等待。',
    ambience: 'green',
    apostle: {
      name: '疯狂炼金术士 · 帕拉塞尔斯', title: '永恒之石的追寻者',
      strategy: 'calculated',
      dialogue: {
        intro: '"哦？又一个素材...不，是客人。来，让我们做个实验。"',
        win: '"看！这就是等价交换的结果！"',
        lose: '"我的计算...我的公式...哪里出了错？"',
        special: '"五种元素...完美的融合...你理解了炼金术的真谛！"'
      }
    },
    specialCondition: {
      type: 'five_cards',
      description: '以5张或更多手牌不爆牌获胜',
      hint: '✦ 元素的融合需要耐心与数量...'
    }
  },
  {
    id: 'library', name: '无尽图书馆', era: '1800年代', order: 2,
    description: '无尽的书架延伸到黑暗中。灰尘在空气中飘浮，一个戴着单片眼镜的身影从书堆后站起。',
    ambience: 'blue',
    apostle: {
      name: '沉默的学者 · 莫里亚蒂', title: '禁忌知识的守护者',
      strategy: 'conservative',
      dialogue: {
        intro: '"...（翻过一页书）你来了。坐下。"',
        win: '"概率从不说谎。这个结果...在预料之中。"',
        lose: '"...有趣的数据点。"',
        special: '"恰好一点之差...你在操控概率？这...不在我的书中。"'
      }
    },
    specialCondition: {
      type: 'margin_one',
      description: '以恰好多出对手1点的方式获胜',
      hint: '✦ 知识的力量在于精准...'
    }
  },
  {
    id: 'altar', name: '远古祭坛', era: '远古时代', order: 3,
    description: '石砌的祭坛上刻满了无法辨认的符文。空气凝重得近乎窒息，一个被黑暗笼罩的身影缓缓转身。',
    ambience: 'purple',
    apostle: {
      name: '远古祭司 · 奈亚拉', title: '深渊的代行者',
      strategy: 'chaotic',
      dialogue: {
        intro: '"你...听到了吗？深渊的低语...它说你会输。"',
        win: '"深渊从不欺骗...你的命运早已注定。"',
        lose: '"不...星辰的预言...怎么会...错？"',
        special: '"完美的碾压...你...你不属于这里！"'
      }
    },
    specialCondition: {
      type: 'clean_sweep',
      description: '以完美战绩（2:0不输一局）赢得对决',
      hint: '✦ 绝对的力量不容置疑...'
    }
  }
];

const BOSS = {
  id: 'rule_chamber', name: '规则之房', era: '时间之外',
  description: '空间在这里扭曲，无数的门在你周围旋转。一个没有形体的存在注视着你——它就是规则本身。',
  ambience: 'red',
  apostle: {
    name: '无名古神', title: '规则的编织者',
    strategy: 'adaptive',
    dialogue: {
      intro_normal: '"又一只飞蛾...你以为打败了几个仆从，就能挑战规则本身吗？"',
      intro_true: '"...你。你不一样。你看到了规则的裂缝...来，让我看看你是否有资格...打破它。"',
      win: '"可笑。回到你的起点吧，虫子。（古神的笑声回荡在大厅中）"',
      lose_normal: '"这...不可能...一个凡人...不，这不算数！回去！回去！！！"',
      lose_true: '"你...打破了规则。去吧，自由者。但记住...在规则之外，还有更深的深渊在等待..."',
      taunt_1: '"你已经来过这里很多次了...还不放弃吗？"',
      taunt_2: '"有意思...你开始让我注意了。"',
      taunt_3: '"你...你的灵魂在变化。这不应该发生的..."'
    }
  }
};

/* ---------- SIGILS (本局增益) ---------- */
const SIGILS = [
  {
    id: 'peek_eye', name: '偷窥之眼', icon: '👁',
    description: '可以看到庄家的暗牌',
    effect: 'reveal_dealer'
  },
  {
    id: 'fate_hand', name: '命运之手', icon: '✋',
    description: '每局可重抽最后一张牌',
    effect: 'redraw_last',
    usesPerRound: 1
  },
  {
    id: 'unyielding', name: '不屈意志', icon: '🛡',
    description: '爆牌阈值提高到23点',
    effect: 'bust_threshold',
    value: 23
  },
  {
    id: 'shadow_shield', name: '暗影护盾', icon: '🌑',
    description: '首次爆牌时免死（每场对决一次）',
    effect: 'bust_save',
    usesPerBattle: 1
  },
  {
    id: 'time_rewind', name: '时间回溯', icon: '⏪',
    description: '每局可撤销一次要牌操作',
    effect: 'undo_hit',
    usesPerRound: 1
  },
  {
    id: 'chaos_mark', name: '混沌印记', icon: '🌀',
    description: '对局结算时随机增减对手点数1-3',
    effect: 'chaos_score'
  },
  {
    id: 'greedy_touch', name: '贪婪之触', icon: '💰',
    description: '获胜时额外获得一次印记选择',
    effect: 'extra_sigil'
  },
  {
    id: 'dual_coin', name: '双面硬币', icon: '🪙',
    description: 'A牌始终算11且不会因A牌爆牌',
    effect: 'ace_eleven'
  }
];

/* ---------- RELICS (永久BD) ---------- */
const RELICS = [
  // 攻击流派
  {
    id: 'sharp_blade', name: '锐利之刃', icon: '⚔️',
    category: '攻击', description: '初始手牌多一张（3张起手）',
    effect: 'extra_start_card', cost: 3
  },
  {
    id: 'assassin_heart', name: '暗杀之心', icon: '🗡',
    category: '攻击', description: '对手17点以上时，你的点数+2',
    effect: 'bonus_vs_high', value: 2, threshold: 17, cost: 5
  },
  // 防御流派
  {
    id: 'tough_armor', name: '坚韧之甲', icon: '🛡️',
    category: '防御', description: '爆牌阈值永久+1（22点才爆）',
    effect: 'bust_up', value: 1, cost: 3
  },
  {
    id: 'life_spring', name: '生命之泉', icon: '💧',
    category: '防御', description: '每局多一次撤销要牌的机会',
    effect: 'free_undo', cost: 5
  },
  // 控制流派
  {
    id: 'insight_eye', name: '洞察之眼', icon: '🔮',
    category: '控制', description: '可以看到牌堆顶部的下一张牌',
    effect: 'see_next', cost: 4
  },
  {
    id: 'binding_chain', name: '束缚之链', icon: '⛓',
    category: '控制', description: '对手首次要牌有30%几率拿到最小点数牌',
    effect: 'nerf_draw', chance: 0.3, cost: 6
  }
];

/* ---------- META DIALOGUE ---------- */
const META_DIALOGUE = {
  title_first: '古老的大门在你面前缓缓打开...',
  title_return: '你再次站在了古堡的入口。一切似乎...似曾相识。',
  title_many: '又一次...你已经记不清这是第几次了。但这一次，你隐约感到了什么不同。',
  title_after_true: '大门已经打开。但你依然选择走了进来...为什么？',
  boss_taunt: [
    '"可笑。回到你的起点吧，虫子。"',
    '"你已经来过这里很多次了...还不放弃吗？"',
    '"有意思...你开始让我注意了。"',
    '"你...你的灵魂在变化。这不应该发生的..."'
  ]
};
