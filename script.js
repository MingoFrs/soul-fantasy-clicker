// ══════════════════════════════════════════════════════════
//  SOUL HARVEST v5 — script.js
//  Optimised: single RAF loop, batched DOM, BigNumber-safe fmt
// ══════════════════════════════════════════════════════════

// ── AUDIO ──────────────────────────────────────────────────
let _actx=null;
function ac(){if(!_actx)_actx=new(window.AudioContext||window.webkitAudioContext)();return _actx;}
function tone(f,t='sine',d=.08,v=.055,dec=.05){
  try{const a=ac(),o=a.createOscillator(),g=a.createGain();
    o.connect(g);g.connect(a.destination);o.type=t;o.frequency.value=f;
    g.gain.setValueAtTime(v,a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);
    o.start();o.stop(a.currentTime+d+dec);}catch(e){}
}
const sfx={
  click:()=>tone(220,'triangle',.06,.04),
  buy:()=>{tone(330,'sine',.1,.06);setTimeout(()=>tone(440,'sine',.08,.04),80);},
  upgrade:()=>[330,440,550,660].forEach((f,i)=>setTimeout(()=>tone(f,'sine',.1,.055),i*55)),
  prestige:()=>[110,220,330,220,110].forEach((f,i)=>setTimeout(()=>tone(f,'sawtooth',.18,.07),i*110)),
  event:()=>[180,120,90].forEach((f,i)=>setTimeout(()=>tone(f,'square',.14,.055),i*90)),
  milestone:()=>[440,550,660,880].forEach((f,i)=>setTimeout(()=>tone(f,'sine',.17,.09),i*85)),
  dc:()=>{tone(660,'sine',.11,.07);setTimeout(()=>tone(440,'sine',.09,.05),90);},
  demon:()=>tone(150,'sawtooth',.07,.06),
  boss:()=>[200,150,100].forEach((f,i)=>setTimeout(()=>tone(f,'sawtooth',.15,.07),i*80)),
  ascend:()=>[55,110,220,440,880].forEach((f,i)=>setTimeout(()=>tone(f,'sine',.22,.08),i*130)),
};

// ── NUMBER FORMAT (handles up to 1e300 without Infinity display) ──
function fmt(n){
  if(n>=1e15)return(n/1e15).toFixed(2)+' Qa';
  if(n>=1e12)return(n/1e12).toFixed(2)+' T';
  if(n>=1e9)return(n/1e9).toFixed(2)+' B';
  if(n>=1e6)return(n/1e6).toFixed(2)+' M';
  if(n>=1e3)return(n/1e3).toFixed(1)+' k';
  return Math.floor(n).toLocaleString();
}

// ── DATA ───────────────────────────────────────────────────
const BUILDINGS=[
  {id:'cultist', icon:'🕯️',name:'Cultiste',         desc:'Prières obscures',           base:15,    sps:.1},
  {id:'tomb',    icon:'⚰️',name:'Tombeau',            desc:'Les morts travaillent',       base:120,   sps:.6},
  {id:'altar',   icon:'🔮',name:'Autel Noir',          desc:'Rituel d\'invocation',        base:650,   sps:2.5},
  {id:'crypt',   icon:'🏚️',name:'Crypte Ancienne',    desc:'Dort depuis des siècles',     base:2800,  sps:9},
  {id:'lich',    icon:'💀',name:'Liche',              desc:'Nécromancien immortel',        base:10000, sps:30},
  {id:'portal',  icon:'🌀',name:'Portail Démoniaque', desc:'Fissure vers l\'Au-delà',     base:40000, sps:100},
  {id:'void',    icon:'🕳️',name:'Fragment du Néant',  desc:'Le vide absorbe tout',        base:200000,sps:400},
  {id:'titan',   icon:'👁️',name:'Titan Primordial',   desc:'Entité antérieure à la mort', base:1200000,sps:1800},
  {id:'abyss',   icon:'🌑',name:'Gouffre Abyssal',    desc:'Requiert Pacte de Sang',      base:5000000,sps:8000,prestigeReq:1},
  {id:'nexus',   icon:'🔱',name:'Nexus Abyssal',      desc:'Requiert Ascension',          base:50000000,sps:40000,ascensionReq:1},
];

const UPGRADES=[
  {id:'c1',icon:'🗡️',name:'Lames Maudites',    desc:'+1 clic/rang',          cost:80,    maxRank:5,type:'click',      add:1,   req:()=>true,                      vfx:'none'},
  {id:'c2',icon:'🔥',name:'Flammes de l\'Âme', desc:'×1.5 clic/rang',        cost:600,   maxRank:4,type:'click_mult', mult:1.5,req:()=>gs.totalSouls>=300,        vfx:'fire'},
  {id:'c3',icon:'⚡',name:'Foudre Noire',       desc:'+5 clic/rang',          cost:5000,  maxRank:5,type:'click',      add:5,   req:()=>gs.totalSouls>=1500,       vfx:'lightning'},
  {id:'c4',icon:'🌑',name:'Éclipse Totale',     desc:'×2 clic/rang',          cost:40000, maxRank:3,type:'click_mult', mult:2,  req:()=>gs.totalSouls>=20000,      vfx:'none'},
  {id:'b1',icon:'📜',name:'Grimoire Sanglant',  desc:'Cultistes ×2/rang',     cost:300,   maxRank:4,type:'building',   target:'cultist',mult:2,req:()=>gs.owned.cultist>=5,  vfx:'none'},
  {id:'b2',icon:'🦴',name:'Os des Anciens',     desc:'Tombeaux ×2/rang',      cost:2000,  maxRank:4,type:'building',   target:'tomb',   mult:2,req:()=>gs.owned.tomb>=3,     vfx:'none'},
  {id:'b3',icon:'💫',name:'Étoile Mourante',    desc:'Autels ×2/rang',        cost:9000,  maxRank:4,type:'building',   target:'altar',  mult:2,req:()=>gs.owned.altar>=5,    vfx:'none'},
  {id:'b4',icon:'🕸️',name:'Toile de l\'Oubli', desc:'Cryptes ×2/rang',       cost:35000, maxRank:3,type:'building',   target:'crypt',  mult:2,req:()=>gs.owned.crypt>=5,    vfx:'none'},
  {id:'b5',icon:'🧿',name:'Œil du Liche',       desc:'Liches ×2/rang',        cost:140000,maxRank:3,type:'building',   target:'lich',   mult:2,req:()=>gs.owned.lich>=3,     vfx:'none'},
  {id:'b6',icon:'🌀',name:'Vortex Abyssal',     desc:'Portails ×2/rang',      cost:600000,maxRank:3,type:'building',   target:'portal', mult:2,req:()=>gs.owned.portal>=3,   vfx:'none'},
  {id:'g1',icon:'🌙',name:'Lune de Sang',       desc:'Prod ×1.3/rang',        cost:25000, maxRank:5,type:'global',     mult:1.3,req:()=>gs.totalSouls>=12000,      vfx:'none'},
  {id:'g2',icon:'🌑',name:'Soleil Noir',         desc:'Prod ×1.5/rang',        cost:200000,maxRank:4,type:'global',     mult:1.5,req:()=>gs.totalSouls>=100000,     vfx:'none'},
  {id:'g3',icon:'✨',name:'Convergence',         desc:'Clic = 1% prod/sec',    cost:8000,  maxRank:1,type:'synergy',             req:()=>gs.totalSouls>=4000,       vfx:'convergence'},
  {id:'a1',icon:'⚙️',name:'Rituel Autonome',    desc:'Auto-clic 0.5/s/rang',  cost:2500,  maxRank:5,type:'auto',       cps:.5,  req:()=>gs.owned.cultist>=3,        vfx:'none'},
  {id:'a2',icon:'🤖',name:'Golem de Pierre',    desc:'Auto-clic 1/s/rang',    cost:18000, maxRank:4,type:'auto',       cps:1,   req:()=>gs.totalSouls>=6000,       vfx:'none'},
  {id:'v1',icon:'🕳️',name:'Fractures du Néant', desc:'Voids ×2/rang',         cost:1500000,maxRank:3,type:'building',  target:'void',   mult:2,req:()=>gs.owned.void>=2,      vfx:'void'},
  {id:'v2',icon:'👁️',name:'Regard du Titan',    desc:'Titans ×2/rang',        cost:8000000,maxRank:3,type:'building',  target:'titan',  mult:2,req:()=>gs.owned.titan>=1,     vfx:'none'},
];

const PRESTIGE_UPS=[
  {id:'p1',icon:'🩸',name:'Soif de Sang',       desc:'+12% prod/rang',          cost:2, maxRank:10,type:'global_mult',  mult:1.12},
  {id:'p2',icon:'💔',name:'Cœur Brisé',         desc:'+50% clic/rang',          cost:4, maxRank:5, type:'click_pmult',  mult:1.5},
  {id:'p3',icon:'⚰️',name:'Mémoire des Morts',  desc:'Garder 5% âmes/rang',     cost:6, maxRank:4, type:'keep_pct',     mult:.05},
  {id:'p4',icon:'🌹',name:'Rose Maudite',        desc:'Bâtiments -8% coût/rang', cost:5, maxRank:5, type:'cost_reduce',  mult:.92},
  {id:'p5',icon:'👑',name:'Couronne d\'Ombre',   desc:'×2.5 prod global',        cost:20,maxRank:3, type:'global_mult',  mult:2.5},
  {id:'m1',icon:'💥',name:'Frappe Explosive',   desc:'1% chance clic ×100/rang',cost:8, maxRank:3, type:'mech_crit',    critChance:.01,critMult:100},
  {id:'m2',icon:'🔄',name:'Résonance Sombre',   desc:'Achat = clics ×3 (5s)',   cost:10,maxRank:1, type:'mech_resonance'},
  {id:'m3',icon:'🌀',name:'Vortex Temporel',    desc:'Eclipse double DC bonus', cost:12,maxRank:1, type:'mech_eclipse_dc'},
  {id:'m4',icon:'👿',name:'Maître des Démons',  desc:'+10 démons max/rang',     cost:8, maxRank:3, type:'mech_demon_cap',add:10},
  {id:'m5',icon:'⭐',name:'Étoile Mourante',    desc:'Milestones +10% prod/rang',cost:15,maxRank:5,type:'mech_milestone_boost',mult:.10},
];

// SKILL TREE — post-prestige
const SKILL_TREE={
  passive:{
    title:'🌙 Voie Passive',color:'#b080d8',
    nodes:[
      {id:'s_p1',icon:'🌕',name:'Cycle Lunaire',   desc:'SPS +20%/rang',   cost:1,maxRank:5, effect:'global_sps',mult:.2},
      {id:'s_p2',icon:'⚰️',name:'Légion des Morts',desc:'Tous bâtiments +5%/rang',cost:2,maxRank:5,effect:'all_build',mult:0.05},
      {id:'s_p3',icon:'🌑',name:'Nuit Éternelle',  desc:'SPS ×2 la nuit',  cost:3,maxRank:1, effect:'night_bonus'},
      {id:'s_p4',icon:'🌌',name:'Abyssal Passif',  desc:'Abyss ×3/rang',   cost:4,maxRank:3, effect:'abyss_mult',mult:3},
    ]
  },
  active:{
    title:'⚔ Voie Active',color:'#e06060',
    nodes:[
      {id:'s_a1',icon:'🗡️',name:'Maîtrise du Clic',desc:'Clic +2/rang',    cost:1,maxRank:5, effect:'click_add',add:2},
      {id:'s_a2',icon:'💥',name:'Combo Maître',     desc:'Combo max +5/rang',cost:2,maxRank:4, effect:'combo_cap',add:5},
      {id:'s_a3',icon:'🔥',name:'Ardeur de Sang',   desc:'Combo dure +2s/rang',cost:2,maxRank:3,effect:'combo_dur',add:2},
      {id:'s_a4',icon:'⚡',name:'Décharge Totale',  desc:'Clic ×5 post-combo',cost:5,maxRank:1,effect:'combo_burst'},
    ]
  },
  hybrid:{
    title:'✨ Voie Hybride',color:'#60d080',
    nodes:[
      {id:'s_h1',icon:'⚖️',name:'Équilibre',        desc:'Clic ajoute 0.5% sps/rang',cost:2,maxRank:4,effect:'click_to_sps',mult:.005},
      {id:'s_h2',icon:'🔮',name:'Synergie Noire',   desc:'SPS boost clic +2%/rang', cost:3,maxRank:4,effect:'sps_to_click',mult:.02},
      {id:'s_h3',icon:'🌀',name:'Vortex Hybride',   desc:'Events durent -20%',       cost:4,maxRank:1,effect:'event_short'},
      {id:'s_h4',icon:'♾️',name:'Cycle Infini',     desc:'Reset combo = bonus sps 10s',cost:5,maxRank:1,effect:'combo_sps'},
    ]
  },
  chaos:{
    title:'🌑 Voie du Chaos',color:'#9060ff',
    nodes:[
      {id:'s_c1',icon:'🎲',name:'Destin Brisé',     desc:'10% chance ×10 gain/rang',cost:2,maxRank:3,effect:'chaos_chance',mult:.1},
      {id:'s_c2',icon:'👁️',name:'Œil du Chaos',     desc:'Boss HP -15%/rang',        cost:3,maxRank:3,effect:'boss_weak',mult:.15},
      {id:'s_c3',icon:'🌪️',name:'Tempête Intérieure',desc:'Events bonus ×1.5/rang',  cost:4,maxRank:2,effect:'event_boost',mult:1.5},
      {id:'s_c4',icon:'🔱',name:'Trident Abyssal',  desc:'Reliques +25% effet/rang', cost:6,maxRank:3,effect:'relic_boost',mult:.25},
    ]
  },
};

// RELICS
const RELICS=[
  {id:'r1',icon:'💀',name:'Crâne du Liche',     desc:'Chaque mort en invasion = +1% prod permanent (max 100%)'},
  {id:'r2',icon:'🌙',name:'Éclat Lunaire',      desc:'La lune de sang dure 2× plus longtemps'},
  {id:'r3',icon:'⚔️',name:'Lame de l\'Abysse',  desc:'Clics pendant boss comptent ×3'},
  {id:'r4',icon:'🔮',name:'Orbe de Cristal',    desc:'Coût des upgrades -25% permanent'},
  {id:'r5',icon:'👁️',name:'Regard Éternel',     desc:'Auto-clic +5/s permanent'},
  {id:'r6',icon:'🌀',name:'Fragment Temporel',  desc:'Tous les événements déclenchent un bonus DC'},
  {id:'r7',icon:'🩸',name:'Sang Primordial',    desc:'Points de sang valent ×2 en upgrades prestige'},
  {id:'r8',icon:'🌑',name:'Noirceur Absolue',   desc:'SPS ×10 pendant 30s à chaque milestone'},
];

// ACHIEVEMENTS
const ACHIEVEMENTS=[
  {id:'a_first',icon:'🌑',name:'Première Âme',   desc:'Récolter 1 âme',          req:()=>gs.totalSouls>=1,         bonus:'Clic +1',effect:()=>{}},
  {id:'a_100',  icon:'💀',name:'Centurie',        desc:'Récolter 100 âmes',       req:()=>gs.totalSouls>=100,       bonus:'+5% prod', effect:()=>{}},
  {id:'a_1k',   icon:'🕯️',name:'Culte Naissant',  desc:'Récolter 1 000 âmes',     req:()=>gs.totalSouls>=1000,      bonus:'+10% prod',effect:()=>{}},
  {id:'a_10k',  icon:'⚰️',name:'Armée des Morts', desc:'Récolter 10 000 âmes',    req:()=>gs.totalSouls>=10000,     bonus:'Clic ×1.5',effect:()=>{}},
  {id:'a_100k', icon:'🔮',name:'Maître Rituel',   desc:'Récolter 100 000 âmes',   req:()=>gs.totalSouls>=100000,    bonus:'+25% prod',effect:()=>{}},
  {id:'a_1m',   icon:'👑',name:'Seigneur Âmes',   desc:'Récolter 1 M âmes',       req:()=>gs.totalSouls>=1e6,       bonus:'SPS ×2',   effect:()=>{}},
  {id:'a_clicks100',icon:'🗡️',name:'100 Invocations',desc:'Cliquer 100 fois',    req:()=>gs.totalClicks>=100,      bonus:'Clic +2',  effect:()=>{}},
  {id:'a_clicks1k',icon:'⚡',name:'Frappe Incessante',desc:'Cliquer 1000 fois',  req:()=>gs.totalClicks>=1000,     bonus:'Clic ×1.2',effect:()=>{}},
  {id:'a_combo10',icon:'🔥',name:'Combo x10',     desc:'Atteindre combo ×10',     req:()=>gs.maxComboReached>=10,   bonus:'Combo dure +1s',effect:()=>{}},
  {id:'a_prestige1',icon:'🩸',name:'Premier Pacte',desc:'Premier prestige',       req:()=>gs.prestigeCount>=1,      bonus:'Prod ×1.3',effect:()=>{}},
  {id:'a_boss1',icon:'⚔️',name:'Chasseur',        desc:'Vaincre 1 boss',          req:()=>gs.bossesDefeated>=1,     bonus:'Boss HP -10%',effect:()=>{}},
  {id:'a_boss5',icon:'🏆',name:'Tueur de Titans', desc:'Vaincre 5 boss',          req:()=>gs.bossesDefeated>=5,     bonus:'Boss drop ×2',effect:()=>{}},
  {id:'a_quest10',icon:'📜',name:'Quêteur',        desc:'Compléter 10 quêtes',     req:()=>gs.questsCompleted>=10,   bonus:'+15% prod',effect:()=>{}},
  {id:'a_demons50',icon:'👿',name:'Exterminateur',desc:'Tuer 50 démons',          req:()=>gs.totalDemonsKilled>=50, bonus:'Démons ×1.5',effect:()=>{}},
  {id:'a_ascend1',icon:'🌑',name:'Transcendant',  desc:'Première Ascension Abyssale',req:()=>gs.ascensionCount>=1, bonus:'Tout ×5',   effect:()=>{}},
  {id:'a_relic3',icon:'💎',name:'Collectionneur',  desc:'Posséder 3 reliques',     req:()=>(gs.relics||[]).length>=3,bonus:'Reliques +20%',effect:()=>{}},
];

// QUESTS pool
const QUEST_POOL=[
  {id:'q_souls',icon:'💰',name:'Collecte d\'Urgence',  gen:(s)=>({target:Math.max(500,s*5),  type:'souls',   time:60, reward_mult:3,   desc:'Récoltez '+fmt(Math.max(500,s*5))+' âmes en 60s'})},
  {id:'q_click',icon:'⚔️',name:'Frappe Rituelle',       gen:(s)=>({target:50+Math.floor(s/100),type:'clicks',  time:30, reward_mult:2.5, desc:'Cliquez '+(50+Math.floor(s/100))+' fois en 30s'})},
  {id:'q_idle', icon:'⏳',name:'Patience du Liche',     gen:(s)=>({target:Math.max(300,s*2), type:'idle_sps', time:45, reward_mult:4,   desc:'Accumulez '+fmt(Math.max(300,s*2))+' âmes passives en 45s'})},
  {id:'q_combo',icon:'🔥',name:'Frénésie Maudite',      gen:(s)=>({target:5,                 type:'combo',   time:20, reward_mult:3.5, desc:'Maintenir combo ×5 pendant 20s'})},
];

// EVENTS pool
const EVENTS_POOL=[
  {id:'eclipse', name:'ÉCLIPSE DE SANG',       sub:'Le soleil saigne sur le monde',       duration:40, spsM:2,  clickM:.5},
  {id:'invasion',name:'INVASION DÉMONIAQUE',   sub:'Des légions surgissent de l\'Au-delà',duration:40, spsM:.3, clickM:3},
  {id:'harvest', name:'MOISSON DES ÂMES',      sub:'L\'énergie des ténèbres se concentre',duration:28, spsM:4,  clickM:2},
  {id:'storm',   name:'TEMPÊTE DE L\'OUBLI',   sub:'Le néant dévore tout sur son passage', duration:30, spsM:.5, clickM:5},
  {id:'pact',    name:'PACTE DÉMONIAQUE',       sub:'Un démon vous propose son aide…',     duration:25, spsM:6,  clickM:1, special:'pact'},
  {id:'titan',   name:'RÉSURRECTION DU TITAN', sub:'Un Titan Primordial s\'éveille',       duration:35, spsM:3,  clickM:3, special:'titan_bonus'},
];

// BOSS pool
const BOSS_POOL=[
  {id:'b_lich',   name:'Archonte Liche',     icon:'💀', hpBase:500,   reward:'prod ×3 (60s)',  spsBonus:3,  bonusDur:60},
  {id:'b_demon',  name:'Seigneur Démon',     icon:'👿', hpBase:1200,  reward:'clics ×5 (30s)', clickBonus:5,bonusDur:30},
  {id:'b_void',   name:'Dévoreur du Néant',  icon:'🕳️', hpBase:3000,  reward:'prod ×6 (45s)',  spsBonus:6,  bonusDur:45},
  {id:'b_titan',  name:'Titan Primordial',   icon:'👁️', hpBase:8000,  reward:'tout ×4 (30s)',  spsBonus:4,  clickBonus:4,bonusDur:30},
  {id:'b_abyss',  name:'Abyssal Éternel',    icon:'🌑', hpBase:25000, reward:'prod ×10 (60s)', spsBonus:10, bonusDur:60},
];

// MILESTONES
const MILESTONES_DATA=[
  {souls:1000,    name:'L\'Éveil',           tier:1, color:'#e8c880'},
  {souls:10000,   name:'Porte des Ombres',   tier:2, color:'#e8a860'},
  {souls:100000,  name:'Sang & Pierre',      tier:2, color:'#e09040'},
  {souls:500000,  name:'Communion Noire',    tier:3, color:'#e05050', boss:'b_lich'},
  {souls:1000000, name:'Seigneur des Âmes',  tier:3, color:'#c04040'},
  {souls:10000000,name:'Archonte Maudit',    tier:4, color:'#b060ff', boss:'b_demon'},
  {souls:100000000,name:'Titan des Ténèbres',tier:4, color:'#8040ff', boss:'b_void'},
  {souls:1e9,     name:'Néant Incarné',      tier:5, color:'#ffffff', boss:'b_titan'},
  {souls:1e12,    name:'LE VIDE ABSOLU',     tier:5, color:'#ffffff', boss:'b_abyss'},
];

// ── STATE ──────────────────────────────────────────────────
const DS=()=>({
  souls:0, totalSouls:0, sps:0, clickPower:1,
  owned:{}, upRank:{}, prestigeRank:{}, skillRank:{},
  prestigeCount:0, bloodPoints:0, totalBP:0, autoCps:0,
  ascensionCount:0, voidEssence:0, totalVE:0,
  relics:[], activeRelicEffects:{},
  spsMultBuff:1, clickMultBuff:1, buffTimer:0,
  activeEvent:null, eventTimer:0,
  vfxFlags:{},
  milestonesReached:new Set(),
  currentTier:0,
  // combo
  comboVal:0, comboTimer:0, maxComboReached:0,
  // resonance
  resonanceTimer:0, resonanceActive:false,
  // boss
  activeBoss:null, bossHp:0, bossMaxHp:0,
  bossesDefeated:0,
  // quest
  activeQuest:null, questProgress:0, questTimer:0, questsCompleted:0,
  questClicksThisTick:0,
  // invasion
  invasionDemonsMax:20, invasionDemonsLeft:0, invasionKills:0,
  // achievements
  unlockedAch:new Set(),
  // stats
  totalClicks:0, totalPurchases:0, totalDemonsKilled:0,
  playTime:0, sessionStart:Date.now(),
  // prestige mechanic state
  lichSkullBonus:0,
  // next event timer
  _nextEvent:45+Math.random()*60,
  _nextDC:25+Math.random()*45,
});
let gs=DS();
[...BUILDINGS,...UPGRADES,...PRESTIGE_UPS].forEach(x=>{ gs.owned[x.id]=0; gs.upRank[x.id]=0; gs.prestigeRank[x.id]=0; });
Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>gs.skillRank[n.id]=0));

// ── SAVE/LOAD ──────────────────────────────────────────────
const SK='soul_harvest_v5';
function toSave(){
  return JSON.stringify({v:5,
    souls:gs.souls, totalSouls:gs.totalSouls,
    owned:gs.owned, upRank:gs.upRank, prestigeRank:gs.prestigeRank, skillRank:gs.skillRank,
    prestigeCount:gs.prestigeCount, bloodPoints:gs.bloodPoints, totalBP:gs.totalBP,
    ascensionCount:gs.ascensionCount, voidEssence:gs.voidEssence, totalVE:gs.totalVE,
    relics:gs.relics,
    milestonesReached:Array.from(gs.milestonesReached||[]),
    currentTier:gs.currentTier||0,
    invasionDemonsMax:gs.invasionDemonsMax||20,
    totalClicks:gs.totalClicks||0, totalPurchases:gs.totalPurchases||0,
    totalDemonsKilled:gs.totalDemonsKilled||0,
    playTime:(gs.playTime||0)+((Date.now()-gs.sessionStart)/1000),
    bossesDefeated:gs.bossesDefeated||0,
    questsCompleted:gs.questsCompleted||0,
    unlockedAch:Array.from(gs.unlockedAch||[]),
    maxComboReached:gs.maxComboReached||0,
    lichSkullBonus:gs.lichSkullBonus||0,
  });
}
function fromSave(raw){
  const d=JSON.parse(raw);
  const s=DS();
  BUILDINGS.forEach(b=>s.owned[b.id]=0);
  UPGRADES.forEach(u=>{s.upRank[u.id]=0;});
  PRESTIGE_UPS.forEach(u=>s.prestigeRank[u.id]=0);
  Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>s.skillRank[n.id]=0));
  s.souls=d.souls||0; s.totalSouls=d.totalSouls||0;
  Object.assign(s.owned,d.owned||{}); Object.assign(s.upRank,d.upRank||{});
  Object.assign(s.prestigeRank,d.prestigeRank||{}); Object.assign(s.skillRank,d.skillRank||{});
  s.prestigeCount=d.prestigeCount||0; s.bloodPoints=d.bloodPoints||0; s.totalBP=d.totalBP||0;
  s.ascensionCount=d.ascensionCount||0; s.voidEssence=d.voidEssence||0; s.totalVE=d.totalVE||0;
  s.relics=d.relics||[];
  s.milestonesReached=new Set(d.milestonesReached||[]);
  s.currentTier=d.currentTier||0;
  s.invasionDemonsMax=d.invasionDemonsMax||20;
  s.totalClicks=d.totalClicks||0; s.totalPurchases=d.totalPurchases||0;
  s.totalDemonsKilled=d.totalDemonsKilled||0;
  s.playTime=d.playTime||0; s.sessionStart=Date.now();
  s.bossesDefeated=d.bossesDefeated||0; s.questsCompleted=d.questsCompleted||0;
  s.unlockedAch=new Set(d.unlockedAch||[]);
  s.maxComboReached=d.maxComboReached||0;
  s.lichSkullBonus=d.lichSkullBonus||0;
  return s;
}
function saveGame(silent=false){
  try{ localStorage.setItem(SK,toSave());
    if(!silent){ const i=document.getElementById('save-indicator');
      if(i){i.textContent='✓ Sauvegardé';i.classList.add('saving');setTimeout(()=>{i.textContent='';i.classList.remove('saving');},1800);}}
  }catch(e){}
}
function loadGame(){
  try{
    const raw=localStorage.getItem(SK); if(!raw){showToast('Aucune sauvegarde','red');return false;}
    gs=fromSave(raw); recalcAll(); restoreVfx(); updateOrbTier();
    fullRender(); showToast('📂 Partie chargée','green');
    addLog('La mémoire des ténèbres revient…','ev-green'); return true;
  }catch(e){ showToast('Erreur de chargement','red'); console.error(e); return false; }
}
function manualSave(){ saveGame(false); sfx.buy(); }
function confirmReset(){
  if(confirm('⚠ Effacer toute la progression ?')){
    localStorage.removeItem(SK); gs=DS();
    BUILDINGS.forEach(b=>gs.owned[b.id]=0);
    UPGRADES.forEach(u=>gs.upRank[u.id]=0);
    PRESTIGE_UPS.forEach(u=>gs.prestigeRank[u.id]=0);
    Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>gs.skillRank[n.id]=0));
    cleanVfx(); recalcAll(); updateOrbTier(); fullRender();
    showToast('Reset effectué','red');
  }
}

// ── CACHE: avoid recalcAll every tick ─────────────────────
let _cache={ sps:0, click:1, auto:0, dirty:true };
function markDirty(){ _cache.dirty=true; }
function recalcAll(){
  // CLICK
  let cp=1;
  UPGRADES.filter(u=>u.type==='click').forEach(u=>{cp+=(u.add||0)*(gs.upRank[u.id]||0);});
  UPGRADES.filter(u=>u.type==='click_mult').forEach(u=>{cp*=Math.pow(u.mult,gs.upRank[u.id]||0);});
  PRESTIGE_UPS.filter(u=>u.type==='click_pmult').forEach(u=>{cp*=Math.pow(u.mult,gs.prestigeRank[u.id]||0);});
  // skill: click_add
  Object.values(SKILL_TREE).forEach(b=>b.nodes.filter(n=>n.effect==='click_add').forEach(n=>{cp+=(n.add||0)*(gs.skillRank[n.id]||0);}));
  if(gs.resonanceActive)cp*=3;

  // synergy
  let synFactor=0; if((gs.upRank['g3']||0)>0)synFactor=0.01;

  // SPS
  let totalSps=0;
  BUILDINGS.forEach(b=>{
    if(b.prestigeReq&&gs.prestigeCount<b.prestigeReq)return;
    if(b.ascensionReq&&gs.ascensionCount<b.ascensionReq)return;
    let bsps=b.sps*(gs.owned[b.id]||0);
    UPGRADES.filter(u=>u.type==='building'&&u.target===b.id).forEach(u=>{bsps*=Math.pow(u.mult,gs.upRank[u.id]||0);});
    totalSps+=bsps;
  });
  // global mult
  let gm=1;
  UPGRADES.filter(u=>u.type==='global').forEach(u=>{gm*=Math.pow(u.mult,gs.upRank[u.id]||0);});
  PRESTIGE_UPS.filter(u=>u.type==='global_mult').forEach(u=>{gm*=Math.pow(u.mult,gs.prestigeRank[u.id]||0);});
  // milestone boost (mech_milestone_boost)
  const mmb=PRESTIGE_UPS.find(u=>u.type==='mech_milestone_boost');
  if(mmb){ const r=gs.prestigeRank[mmb.id]||0; if(r>0)gm*=1+(gs.currentTier||0)*r*(mmb.mult||0); }
  // skill: global_sps
  Object.values(SKILL_TREE).forEach(b=>b.nodes.filter(n=>n.effect==='global_sps').forEach(n=>{gm*=1+(n.mult||0)*(gs.skillRank[n.id]||0);}));
  // achievement bonuses (cached via achBonus)
  gm*=getAchBonus();
  // relic: skull
  if(gs.lichSkullBonus>0)gm*=(1+Math.min(1,gs.lichSkullBonus));
  // relic: crystal orb -25% cost (applied in getBuildingCost, not here)
  totalSps*=gm;

  // synergy: click = X% sps
  if(synFactor>0)cp+=totalSps*synFactor;
  // skill: sps_to_click
  Object.values(SKILL_TREE).forEach(b=>b.nodes.filter(n=>n.effect==='sps_to_click').forEach(n=>{cp+=totalSps*(n.mult||0)*(gs.skillRank[n.id]||0);}));

  // auto
  let autoCps=0;
  UPGRADES.filter(u=>u.type==='auto').forEach(u=>{autoCps+=(u.cps||0)*(gs.upRank[u.id]||0);});
  // relic: eternal gaze
  if(gs.relics.includes('r5'))autoCps+=5;

  _cache.sps=totalSps; _cache.click=Math.max(1,Math.round(cp)); _cache.auto=autoCps; _cache.dirty=false;
  gs.clickPower=_cache.click; gs.sps=_cache.sps; gs.autoCps=_cache.auto;
}

// ── ACHIEVEMENT BONUS (multiplicative) ────────────────────
const ACH_BONUS_MAP={
  'a_100':1.05,'a_1k':1.1,'a_10k':1.0,'a_100k':1.25,'a_1m':2,
  'a_clicks100':1.0,'a_clicks1k':1.0,'a_prestige1':1.3,
  'a_boss1':1.0,'a_boss5':1.0,'a_quest10':1.15,'a_demons50':1.0,
  'a_ascend1':5,'a_relic3':1.0,
};
function getAchBonus(){
  let m=1;
  (gs.unlockedAch||new Set()).forEach(id=>{ if(ACH_BONUS_MAP[id])m*=ACH_BONUS_MAP[id]; });
  return m;
}

function getCostReduce(){
  let r=1;
  PRESTIGE_UPS.filter(u=>u.type==='cost_reduce').forEach(u=>r*=Math.pow(u.mult,gs.prestigeRank[u.id]||0));
  if(gs.relics.includes('r4'))r*=0.75;
  return r;
}
function getBuildingCost(b){ return Math.ceil(b.base*Math.pow(1.15,gs.owned[b.id]||0)*getCostReduce()); }
function getUpgradeCost(u){ return Math.ceil(u.cost*Math.pow(3,gs.upRank[u.id]||0)); }
function getPrestigeCost(u){ const r=gs.prestigeRank[u.id]||0; return Math.ceil(u.cost*Math.pow(r+1,2)*2*(gs.relics.includes('r7')?.5:1)); }
function calcBP(){ return gs.totalSouls<500000?0:Math.floor(Math.sqrt(gs.totalSouls/50000)); }
function calcVE(){ return gs.totalBP<10?0:Math.floor(Math.sqrt(gs.totalBP/10)); }

function getEffSps(){
  let s=gs.sps;
  if(gs.activeEvent)s*=gs.activeEvent.spsM;
  s*=gs.spsMultBuff;
  // night bonus skill (simplified: always active for balance)
  if((gs.skillRank['s_p3']||0)>0)s*=1.5;
  // chaos chance skill
  if((gs.skillRank['s_c1']||0)>0&&Math.random()<(gs.skillRank['s_c1']||0)*.1) s*=10;
  // event boost skill
  if(gs.activeEvent&&(gs.skillRank['s_c3']||0)>0) s*=Math.pow(1.5,gs.skillRank['s_c3']);
  return s;
}
function getEffClick(){
  let c=gs.clickPower;
  if(gs.activeEvent)c=Math.round(c*gs.activeEvent.clickM);
  c=Math.round(c*gs.clickMultBuff);
  // combo mult
  if(gs.comboVal>1)c=Math.round(c*gs.comboVal);
  // crit
  const crit=PRESTIGE_UPS.find(u=>u.type==='mech_crit');
  if(crit){ const r=gs.prestigeRank[crit.id]||0;
    if(r>0&&Math.random()<crit.critChance*r){ c=Math.round(c*crit.critMult); gs._lastCrit=true; }
    else gs._lastCrit=false;
  } else gs._lastCrit=false;
  // boss relic ×3
  if(gs.activeBoss&&gs.relics.includes('r3'))c*=3;
  return Math.max(1,c);
}

// ── COMBO ──────────────────────────────────────────────────
function getComboMax(){ return 10+(gs.skillRank['s_a2']||0)*5; }
function getComboDur(){ return 3+(gs.skillRank['s_a3']||0)*2+((gs.unlockedAch.has('a_combo10'))?1:0); }
function tickCombo(dt){
  if(gs.comboTimer>0){
    gs.comboTimer-=dt;
    if(gs.comboTimer<=0){
      // combo reset
      if((gs.skillRank['s_h4']||0)>0&&gs.comboVal>5){
        // combo_sps: boost sps for 10s
        gs.spsMultBuff=Math.max(gs.spsMultBuff,2);
        gs.buffTimer=Math.max(gs.buffTimer,10);
        addLog('♾️ Cycle Infini — SPS ×2 (10s)','ev-purple');
      }
      gs.comboVal=0; gs.comboTimer=0;
      updateComboDisplay();
    }
  }
}
function registerClick(){
  const cmax=getComboMax();
  const cdur=getComboDur();
  gs.comboVal=Math.min(cmax,gs.comboVal+.5);
  gs.comboTimer=cdur;
  if(gs.comboVal>gs.maxComboReached) gs.maxComboReached=gs.comboVal;
  updateComboDisplay();
}
function updateComboDisplay(){
  const el=document.getElementById('combo-display');
  if(!el)return;
  if(gs.comboVal<1.5){ el.classList.remove('show'); return; }
  el.classList.add('show');
  const v=document.getElementById('combo-val');
  const m=document.getElementById('combo-mult');
  if(v)v.textContent='×'+gs.comboVal.toFixed(1);
  if(m)m.textContent='COMBO';
  // color
  const hue=gs.comboVal>8?'#ffdd44':gs.comboVal>5?'#ff9940':'#e06060';
  el.style.color=hue;
}

// ── SCREENSHAKE ─────────────────────────────────────────────
function shake(heavy=false){
  const r=document.getElementById('screenshake-root');
  if(!r)return;
  r.classList.remove('shake','shake-heavy');void r.offsetWidth;
  r.classList.add(heavy?'shake-heavy':'shake');
  setTimeout(()=>r.classList.remove('shake','shake-heavy'),600);
}

// ── UI HELPERS ─────────────────────────────────────────────
const logQ=[];let _logRaf=null;
function addLog(msg,cls=''){
  logQ.push({msg,cls});
  if(!_logRaf)_logRaf=requestAnimationFrame(flushLog);
}
function flushLog(){
  _logRaf=null;
  const lb=document.getElementById('log-box'); if(!lb)return;
  logQ.splice(0).forEach(({msg,cls})=>{
    const el=document.createElement('div');el.className='log-entry '+(cls||'');el.textContent='⬥ '+msg;
    lb.prepend(el);
  });
  while(lb.children.length>5)lb.removeChild(lb.lastChild);
}

let _toastTimer=null;
function showToast(msg,type=''){
  const old=document.querySelector('.toast');if(old)old.remove();
  if(_toastTimer)clearTimeout(_toastTimer);
  const t=document.createElement('div');t.className='toast '+(type?type+'-toast':'');t.textContent=msg;
  document.body.appendChild(t);_toastTimer=setTimeout(()=>t.remove(),2400);
}
function spawnFloater(x,y,text,cls=''){
  const f=document.createElement('div');f.className='floater '+(cls||'');
  f.textContent=text;f.style.left=(x-20)+'px';f.style.top=(y-20)+'px';
  const fl=document.getElementById('floaters'); if(fl){fl.appendChild(f);setTimeout(()=>f.remove(),1150);}
}
function burstEl(el,cls='just-bought'){
  el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),480);
}
function openOverlay(id){ document.getElementById(id)&&document.getElementById(id).classList.add('open'); }
function closeOverlay(id){ document.getElementById(id)&&document.getElementById(id).classList.remove('open'); }

// ── VFX ───────────────────────────────────────────────────
const activeVfx=new Set();
function updateOrbAura(){
  const aura=document.getElementById('orb-aura'); if(!aura)return;
  if(gs.activeEvent){aura.className='';return;}
  const sorted=['void','fire','lightning'].filter(v=>activeVfx.has(v)).slice(0,2);
  aura.className=sorted.map(v=>'vfx-'+v).join(' ');
}
function applyUpgradeVfx(vfx,rank,silent=false){
  if(!vfx||vfx==='none')return;
  switch(vfx){
    case 'fire': activeVfx.add('fire'); break;
    case 'lightning':
      activeVfx.add('lightning');
      if(!gs.vfxFlags.lInterval) gs.vfxFlags.lInterval=setInterval(spawnLightning,2800);
      break;
    case 'convergence':
      document.getElementById('convergence-ring')?.classList.add('active');
      buildConvergence(); break;
    case 'void':
      activeVfx.add('void');
      document.getElementById('void-cracks')?.classList.add('active');
      buildVoidCracks(rank); break;
  }
  updateOrbAura();
  if(!silent){
    ['ring1','ring2','ring3'].forEach((id,i)=>{
      const r=document.getElementById(id);if(!r)return;
      r.style.borderColor='rgba(200,160,80,.9)';
      setTimeout(()=>r.style.borderColor='',500+i*100);
    });
  }
}
function cleanVfx(){
  activeVfx.clear();
  const aura=document.getElementById('orb-aura');if(aura)aura.className='';
  document.getElementById('main-orb')?.classList.remove('eclipse-orb','invasion-orb','boss-orb','surge');
  document.getElementById('void-cracks')?.classList.remove('active');
  document.getElementById('convergence-ring')?.classList.remove('active');
  if(gs.vfxFlags?.lInterval){ clearInterval(gs.vfxFlags.lInterval); gs.vfxFlags.lInterval=null; }
  document.body.classList.remove('eclipse-active','invasion-active');
}
function restoreVfx(){
  UPGRADES.forEach(u=>{ const r=gs.upRank[u.id]||0; if(r>0&&u.vfx&&u.vfx!=='none')applyUpgradeVfx(u.vfx,r,true); });
}
function buildConvergence(){
  const ring=document.getElementById('convergence-ring');if(!ring)return;
  ring.innerHTML='';
  'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'.split('').forEach((r,i)=>{
    const s=document.createElement('span');s.className='cring-rune';
    s.textContent=r;s.style.animationDuration=(8+i*.4)+'s';s.style.animationDelay=(i*(8/12))+'s';
    ring.appendChild(s);
  });
}
function buildVoidCracks(rank){
  const vc=document.getElementById('void-cracks');if(!vc)return;vc.innerHTML='';
  const n=Math.min(10,4+rank*2);
  for(let i=0;i<n;i++){
    const c=document.createElement('div');c.className='vcrack';
    c.style.cssText=`left:${Math.random()*92}%;top:${Math.random()*92}%;width:${55+Math.random()*95}px;height:${1+Math.random()*.8}px;transform:rotate(${Math.random()*360}deg);animation-delay:${Math.random()*4}s;`;
    vc.appendChild(c);
  }
}
let _lCount=0;
function spawnLightning(){
  if(_lCount>=4)return; _lCount++;
  const ll=document.getElementById('lightning-layer');if(!ll)return;
  const b=document.createElement('div');b.className='lightning-bolt';
  b.style.left=Math.random()*100+'%';b.style.height=(75+Math.random()*110)+'px';
  ll.appendChild(b);setTimeout(()=>{b.remove();_lCount--;},200);
}

// ── CANVAS PARTICLES ───────────────────────────────────────
let pCanvas,pCtx;
const PP=[];
function initCanvas(){
  pCanvas=document.getElementById('particle-canvas');if(!pCanvas)return;
  pCanvas.width=window.innerWidth;pCanvas.height=window.innerHeight;
  pCtx=pCanvas.getContext('2d');
  window.addEventListener('resize',()=>{if(pCanvas){pCanvas.width=innerWidth;pCanvas.height=innerHeight;}});
}
function emitBurst(x,y,n,col){
  // Cap total particles for performance
  if(PP.length>150)return;
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,sp=1+Math.random()*3;
    PP.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:1,col:col||'rgba(200,160,50,.8)',sz:2+Math.random()*2.5});
  }
}
function tickCanvas(dt){
  if(!pCtx)return;
  pCtx.clearRect(0,0,pCanvas.width,pCanvas.height);
  for(let i=PP.length-1;i>=0;i--){
    const p=PP[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.life-=dt*1.3;
    if(p.life<=0){PP.splice(i,1);continue;}
    pCtx.globalAlpha=p.life;pCtx.fillStyle=p.col;
    pCtx.beginPath();pCtx.arc(p.x,p.y,p.sz,0,Math.PI*2);pCtx.fill();
  }
  pCtx.globalAlpha=1;
}

// ── MILESTONES ─────────────────────────────────────────────
function checkMilestones(){
  MILESTONES_DATA.forEach(m=>{
    if(gs.totalSouls>=m.souls&&!gs.milestonesReached.has(m.souls)){
      gs.milestonesReached.add(m.souls);
      triggerMilestone(m);
    }
  });
}
function triggerMilestone(m){
  sfx.milestone(); shake(true);
  gs.currentTier=Math.max(gs.currentTier||0,m.tier);
  updateOrbTier();
  const pop=document.getElementById('milestone-popup');
  if(pop){ pop.style.color=m.color;pop.textContent='✦ '+m.name.toUpperCase()+' ✦';
    pop.classList.remove('show');void pop.offsetWidth;pop.classList.add('show');
    setTimeout(()=>pop.classList.remove('show'),3500); }
  showToast('✦ '+m.name+' ✦','milestone');
  addLog('✦ Seuil : '+m.name,'ev-gold');
  const orb=document.getElementById('main-orb');
  if(orb){ const r=orb.getBoundingClientRect();
    emitBurst(r.left+r.width/2,r.top+r.height/2,20,'rgba(200,160,50,.8)'); }
  // Relic: noirceur absolue
  if(gs.relics.includes('r8')){ gs.spsMultBuff=Math.max(gs.spsMultBuff,10); gs.buffTimer=Math.max(gs.buffTimer,30); addLog('🌑 Noirceur Absolue — SPS ×10 (30s)','ev-purple'); }
  // Boss trigger
  if(m.boss) spawnBoss(m.boss);
  markDirty();
}
function updateOrbTier(){
  const tier=gs.currentTier||0;
  document.body.className=document.body.className.replace(/\btier-\d\b/g,'').trim();
  if(tier>0)document.body.classList.add('tier-'+tier);
  const sc=document.getElementById('soul-count');
  if(sc){ sc.className='soul-count'; if(tier>0)sc.classList.add('tier-'+tier); }
}

// ── BOSS ───────────────────────────────────────────────────
function spawnBoss(bossId){
  if(gs.activeBoss)return;
  const def=BOSS_POOL.find(b=>b.id===bossId); if(!def)return;
  // HP scales with prestige + skill reduction
  let hp=def.hpBase*Math.pow(2,gs.prestigeCount);
  const bw=PRESTIGE_UPS.find(u=>u.type==='mech_crit'); // reuse crit rank for demo
  if((gs.skillRank['s_c2']||0)>0) hp*=1-Math.min(.6,(gs.skillRank['s_c2']||0)*.15);
  if(gs.unlockedAch.has('a_boss1'))hp*=.9;
  gs.activeBoss=def; gs.bossHp=Math.ceil(hp); gs.bossMaxHp=Math.ceil(hp);
  sfx.boss();
  const bw2=document.getElementById('boss-bar-wrap');
  const bl=document.getElementById('boss-label');
  if(bw2)bw2.classList.add('show');
  if(bl)bl.textContent=def.icon+' '+def.name+' — '+def.reward;
  updateBossBar();
  document.getElementById('main-orb')?.classList.add('boss-orb');
  addLog('⚔ '+def.name+' est apparu ! Cliquez pour le vaincre !','ev-gold');
  showToast('⚔ '+def.name+' — '+def.reward,'gold');
}
function damageBoss(dmg){
  if(!gs.activeBoss)return;
  gs.bossHp=Math.max(0,gs.bossHp-dmg);
  updateBossBar();
  if(gs.bossHp<=0)defeatBoss();
}
function updateBossBar(){
  const pct=gs.bossMaxHp>0?(gs.bossHp/gs.bossMaxHp)*100:0;
  const f=document.getElementById('boss-fill');if(f)f.style.width=pct+'%';
  const ht=document.getElementById('boss-hp-text');if(ht)ht.textContent=fmt(gs.bossHp)+' / '+fmt(gs.bossMaxHp)+' HP';
}
function defeatBoss(){
  const def=gs.activeBoss; if(!def)return;
  sfx.milestone(); shake(true);
  gs.bossesDefeated++;
  // Apply reward
  if(def.spsBonus){ gs.spsMultBuff=Math.max(gs.spsMultBuff,def.spsBonus); gs.buffTimer=Math.max(gs.buffTimer,def.bonusDur); }
  if(def.clickBonus){ gs.clickMultBuff=Math.max(gs.clickMultBuff,def.clickBonus); gs.buffTimer=Math.max(gs.buffTimer,def.bonusDur); }
  // Relic drop if unlockedAch boss5 → double
  const dropBonusMult=gs.unlockedAch.has('a_boss5')?2:1;
  const bonusSouls=Math.ceil(gs.sps*30*dropBonusMult);
  gs.souls+=bonusSouls; gs.totalSouls+=bonusSouls;
  // Lich skull relic: invasion kills contribute
  if(gs.relics.includes('r1')) gs.lichSkullBonus=Math.min(1,gs.lichSkullBonus+.01);
  addLog('⚔ '+def.name+' vaincu ! +'+fmt(bonusSouls)+' âmes','ev-gold');
  showToast('⚔ '+def.name+' vaincu ! '+def.reward,'gold');
  emitBurst(window.innerWidth/2,window.innerHeight/2,25,'rgba(220,180,50,.8)');
  gs.activeBoss=null; gs.bossHp=0; gs.bossMaxHp=0;
  document.getElementById('boss-bar-wrap')?.classList.remove('show');
  document.getElementById('main-orb')?.classList.remove('boss-orb');
  checkAchievements(); markDirty();
}

// ── QUESTS ─────────────────────────────────────────────────
let _nextQuestIn=30+Math.random()*60;
function trySpawnQuest(){
  if(gs.activeQuest||gs.sps<1)return;
  const pool=QUEST_POOL;
  const def=pool[Math.floor(Math.random()*pool.length)];
  const q=def.gen(gs.sps);
  gs.activeQuest={...def,...q}; gs.questProgress=0; gs.questTimer=q.time;
  gs.questClicksThisTick=0;
  updateQuestBar();
  const qw=document.getElementById('quest-bar-wrap');if(qw)qw.classList.add('show');
  addLog('📜 Quête : '+def.name,'ev-gold');
}
function tickQuest(dt){
  if(!gs.activeQuest)return;
  gs.questTimer-=dt;
  // quest type: idle_sps tracks sps gained passively
  if(gs.activeQuest.type==='idle_sps') gs.questProgress+=getEffSps()*dt;
  if(gs.questTimer<=0){ failQuest(); return; }
  updateQuestBar();
  if(gs.questProgress>=gs.activeQuest.target) completeQuest();
}
function registerQuestClick(){
  if(!gs.activeQuest)return;
  if(gs.activeQuest.type==='clicks') gs.questProgress++;
  if(gs.activeQuest.type==='combo'&&gs.comboVal>=5) gs.questProgress=gs.questTimer>0?gs.activeQuest.target:0; // track below
}
function tickQuestCombo(dt){
  if(!gs.activeQuest||gs.activeQuest.type!=='combo')return;
  if(gs.comboVal>=5) gs.questProgress+=dt; else gs.questProgress=Math.max(0,gs.questProgress-.5*dt);
}
function completeQuest(){
  const q=gs.activeQuest; if(!q)return;
  gs.questsCompleted++;
  const reward=Math.ceil(gs.sps*q.reward_mult*20);
  gs.souls+=reward; gs.totalSouls+=reward;
  sfx.milestone();
  showToast('📜 Quête accomplie ! +'+fmt(reward)+' âmes','gold');
  addLog('📜 '+q.name+' — +'+fmt(reward)+' âmes','ev-gold');
  gs.activeQuest=null;
  document.getElementById('quest-bar-wrap')?.classList.remove('show');
  _nextQuestIn=40+Math.random()*80;
  checkAchievements(); markDirty();
}
function failQuest(){
  addLog('📜 Quête échouée…','ev-red');
  gs.activeQuest=null;
  document.getElementById('quest-bar-wrap')?.classList.remove('show');
  _nextQuestIn=30+Math.random()*50;
}
function updateQuestBar(){
  const q=gs.activeQuest; if(!q)return;
  const pct=Math.min(100,(gs.questProgress/q.target)*100);
  const f=document.getElementById('quest-fill');if(f)f.style.width=pct.toFixed(1)+'%';
  const nm=document.getElementById('quest-name');if(nm)nm.textContent=q.icon+' '+q.name+' — '+q.desc;
  const ti=document.getElementById('quest-timer');if(ti)ti.textContent=Math.ceil(gs.questTimer)+'s restantes';
}

// ── EVENTS ─────────────────────────────────────────────────
let _demonInterval=null,_eclipseLightLoop=null;
function startEvent(ev){
  if(gs.activeEvent)return;
  // Shorten event if skill
  let dur=ev.duration;
  if((gs.skillRank['s_h3']||0)>0)dur*=.8;
  gs.activeEvent={...ev,duration:dur}; gs.eventTimer=dur;
  const bn=document.getElementById('event-banner'),bar=document.getElementById('event-timer-bar'),fill=document.getElementById('event-timer-fill');
  document.getElementById('eb-main').textContent=ev.name;
  document.getElementById('eb-sub').textContent=ev.sub;
  if(bn){bn.className='show '+ev.id;}
  if(bar)bar.className='show';
  if(fill)fill.className=ev.id; fill&&(fill.style.width='100%');
  const orb=document.getElementById('main-orb');
  sfx.event(); shake();
  if(ev.id==='eclipse'){
    orb?.classList.add('eclipse-orb'); document.body.classList.add('eclipse-active');
    document.getElementById('soul-count')?.classList.add('event-red');
    document.getElementById('event-overlay').style.background='rgba(80,10,10,.07)';
    document.body.style.background='#100505';
    document.getElementById('click-hint').textContent='— cherchez les présences cachées —';
    document.getElementById('eclipse-hint')?.classList.add('show');
    gs._eclipseHiddenClicks=0; gs._eclipseNextHidden=3+Math.floor(Math.random()*5);
    gs._nextDC=Math.min(gs._nextDC,6+Math.random()*8);
    _eclipseLightLoop=setInterval(()=>{ if(!gs.activeEvent||gs.activeEvent.id!=='eclipse'){clearInterval(_eclipseLightLoop);_eclipseLightLoop=null;return;} for(let i=0;i<3;i++)setTimeout(spawnLightning,i*90); },1600);
    addLog('🩸 Éclipse de Sang — cherchez les bonus cachés !','ev-red');
    showToast('🩸 ÉCLIPSE DE SANG','red');
  } else if(ev.id==='invasion'){
    orb?.classList.add('invasion-orb'); document.body.classList.add('invasion-active');
    document.getElementById('soul-count')?.classList.add('event-demon');
    document.getElementById('event-overlay').style.background='rgba(40,10,80,.07)';
    document.body.style.background='#080512';
    document.getElementById('click-hint').textContent='— tuez les démons —';
    const cap=(gs.invasionDemonsMax||20)+((gs.prestigeRank['m4']||0)*10);
    gs.invasionDemonsLeft=cap; gs.invasionKills=0;
    document.getElementById('invasion-bar-wrap')?.classList.add('show');
    updateInvasionBar(); startDemonRunes();
    addLog('👿 Invasion — tuez les démons pour des bonus !','ev-purple');
    showToast('👿 INVASION DÉMONIAQUE','purple');
  } else if(ev.id==='pact'){
    // Pact: big SPS boost, but player must keep clicking every 3s or it ends early
    document.getElementById('event-overlay').style.background='rgba(60,10,60,.07)';
    document.body.style.background='#0e0512';
    document.getElementById('click-hint').textContent='— maintenez le pacte en cliquant —';
    gs._pactLastClick=Date.now();
    addLog('🔮 Pacte Démoniaque — prod ×'+ev.spsM+' maintenez le clic !','ev-purple');
    showToast('🔮 PACTE DÉMONIAQUE','purple');
  } else if(ev.id==='titan'){
    document.getElementById('event-overlay').style.background='rgba(10,40,10,.07)';
    document.body.style.background='#050c05';
    const bonusSouls=Math.ceil(gs.sps*60); gs.souls+=bonusSouls; gs.totalSouls+=bonusSouls;
    addLog('👁 Titan Primordial — +'+fmt(bonusSouls)+' âmes !','ev-gold');
    showToast('👁 RÉSURRECTION DU TITAN ! +'+fmt(bonusSouls)+' âmes','gold');
  } else {
    addLog('⚡ '+ev.name,'ev-gold');
    showToast('⚡ '+ev.name,'gold');
  }
  updateOrbAura();
}
function tickEvents(dt){
  if(gs.activeEvent){
    gs.eventTimer-=dt;
    // Pact: check click liveness
    if(gs.activeEvent.id==='pact'&&gs._pactLastClick){
      if((Date.now()-gs._pactLastClick)>3500){ addLog('🔮 Pacte brisé — inactivité','ev-red'); endEvent(); return; }
    }
    const pct=Math.max(0,gs.eventTimer/gs.activeEvent.duration)*100;
    const fill=document.getElementById('event-timer-fill');if(fill)fill.style.width=pct.toFixed(1)+'%';
    if(gs.eventTimer<=0)endEvent();
    return;
  }
  gs._nextEvent-=dt;
  if(gs._nextEvent<=0){
    gs._nextEvent=50+Math.random()*85;
    startEvent(EVENTS_POOL[Math.floor(Math.random()*EVENTS_POOL.length)]);
  }
}
function endEvent(){
  const ev=gs.activeEvent; gs.activeEvent=null; gs.eventTimer=0;
  const bn=document.getElementById('event-banner'),bar=document.getElementById('event-timer-bar');
  document.getElementById('eb-main').textContent='Événement terminé';
  document.getElementById('eb-sub').textContent=ev?.name||'';
  if(bn)bn.className='show ended'; if(bar)bar.className='show';
  setTimeout(()=>{if(bn)bn.className='';if(bar)bar.className='';},2800);
  document.getElementById('main-orb')?.classList.remove('eclipse-orb','invasion-orb');
  document.body.classList.remove('eclipse-active','invasion-active');
  document.getElementById('soul-count')?.classList.remove('event-red','event-demon');
  document.getElementById('event-overlay').style.background='transparent';
  document.body.style.background='var(--bg)';
  document.getElementById('click-hint').textContent='— invoquer les âmes —';
  document.getElementById('eclipse-hint')?.classList.remove('show');
  document.getElementById('invasion-bar-wrap')?.classList.remove('show');
  if(_demonInterval){clearInterval(_demonInterval);_demonInterval=null;}
  if(_eclipseLightLoop){clearInterval(_eclipseLightLoop);_eclipseLightLoop=null;}
  document.querySelectorAll('.demon-rune').forEach(r=>r.remove());
  updateOrbAura();
  addLog('Le calme revient…');
}

function updateInvasionBar(){
  const max=(gs.invasionDemonsLeft||0)+(gs.invasionKills||0);
  const pct=max>0?(gs.invasionDemonsLeft/max)*100:0;
  const f=document.getElementById('invasion-fill');if(f)f.style.width=pct+'%';
  const c=document.getElementById('invasion-count');if(c)c.textContent=(gs.invasionDemonsLeft)+' restants — '+(gs.invasionKills)+' tués';
}
function startDemonRunes(){
  if(_demonInterval)clearInterval(_demonInterval);
  const runes='👿💀🔱⛧👹😈🗡️⚔️'.split('');
  _demonInterval=setInterval(()=>{
    if(!gs.activeEvent||gs.activeEvent.id!=='invasion'){clearInterval(_demonInterval);_demonInterval=null;return;}
    if((gs.invasionDemonsLeft||0)<=0)return;
    const r=document.createElement('div');r.className='demon-rune';
    r.textContent=runes[Math.floor(Math.random()*runes.length)];
    r.style.left=(8+Math.random()*82)+'%'; r.style.top=(15+Math.random()*65)+'%';
    const d=2.5+Math.random()*2; r.style.animationDuration=d+'s';
    document.body.appendChild(r);
    r.addEventListener('click',e=>{
      e.stopPropagation();
      if(!gs.activeEvent||gs.activeEvent.id!=='invasion'||(gs.invasionDemonsLeft||0)<=0)return;
      sfx.demon(); gs.invasionDemonsLeft--; gs.invasionKills++; gs.totalDemonsKilled++;
      // Lich skull relic
      if(gs.relics.includes('r1'))gs.lichSkullBonus=Math.min(1,(gs.lichSkullBonus||0)+.005);
      const bonus=Math.max(50,gs.sps*2+gs.clickPower*3);
      gs.souls+=bonus; gs.totalSouls+=bonus;
      spawnFloater(e.clientX,e.clientY,'+'+fmt(bonus)+'👿','demon');
      r.style.animation='none';r.style.opacity='0'; setTimeout(()=>r.remove(),250);
      updateInvasionBar();
      if((gs.invasionDemonsLeft||0)<=0){
        const big=Math.max(1000,gs.sps*30);gs.souls+=big;gs.totalSouls+=big;
        showToast('👿 Invasion repoussée ! +'+fmt(big),'purple');
        gs.eventTimer=Math.min(gs.eventTimer,4);
        checkAchievements();
      }
      markDirty();
    });
    setTimeout(()=>{if(r.parentNode)r.remove();},d*1000+150);
  },550);
}
function handleEclipseClick(x,y){
  if(!gs.activeEvent||gs.activeEvent.id!=='eclipse')return;
  gs._eclipseHiddenClicks=(gs._eclipseHiddenClicks||0)+1;
  if(gs._eclipseHiddenClicks>=(gs._eclipseNextHidden||5)){
    gs._eclipseHiddenClicks=0; gs._eclipseNextHidden=3+Math.floor(Math.random()*6);
    const hasMech=(gs.prestigeRank['m3']||0)>0;
    if(hasMech){ spawnDC(true); }
    else { const b=Math.max(200,gs.sps*10); gs.souls+=b; gs.totalSouls+=b; spawnFloater(x,y,'☽ +'+fmt(b),'big'); }
  }
}
// Pact: keep-alive on click
function handlePactClick(){ if(gs.activeEvent?.id==='pact')gs._pactLastClick=Date.now(); }

// ── DARK COOKIES ───────────────────────────────────────────
const DC_POOL=[
  {type:'bonus',icon:'☽', name:'Faveur Lunaire',   effect:'sps_mult',  value:3, duration:30,cls:'type-bonus',lblcls:'bonus'},
  {type:'bonus',icon:'💎', name:'Pierre d\'Âme',    effect:'souls_flat',value_fn:()=>Math.max(100,gs.sps*20),duration:0,cls:'type-bonus',lblcls:'bonus'},
  {type:'bonus',icon:'⚔️', name:'Frappe Maudite',   effect:'click_mult',value:5, duration:20,cls:'type-bonus',lblcls:'bonus'},
  {type:'bonus',icon:'🌟', name:'Éclat Céleste',    effect:'sps_mult',  value:5, duration:15,cls:'type-bonus',lblcls:'bonus'},
  {type:'bonus',icon:'🩸', name:'Pluie de Sang',    effect:'souls_flat',value_fn:()=>Math.max(500,gs.sps*60),duration:0,cls:'type-bonus',lblcls:'bonus'},
  {type:'malus',icon:'💀', name:'Malédiction',      effect:'sps_mult',  value:.1,duration:20,cls:'type-malus',lblcls:'malus'},
  {type:'malus',icon:'🕷️', name:'Poison',            effect:'click_mult',value:.2,duration:25,cls:'type-malus',lblcls:'malus'},
  {type:'malus',icon:'🌑', name:'Nuit Sans Fin',    effect:'sps_mult',  value:0, duration:15,cls:'type-malus',lblcls:'malus'},
  {type:'event',icon:'🌀', name:'Vortex Temporel',  effect:'sps_mult',  value:10,duration:12,cls:'type-event',lblcls:'event'},
  {type:'event',icon:'🔮', name:'Vision',           effect:'souls_flat',value_fn:()=>Math.max(1000,gs.totalSouls*.05),duration:0,cls:'type-event',lblcls:'event'},
];
let dcActive=null,_dcTimeout=null;
function tickDC(dt){
  if(dcActive)return;
  gs._nextDC-=dt;
  if(gs._nextDC<=0)spawnDC();
}
function spawnDC(forceBonus=false){
  if(dcActive)return;
  let def=forceBonus?DC_POOL.filter(d=>d.type==='bonus')[Math.floor(Math.random()*5)]:DC_POOL[Math.floor(Math.random()*DC_POOL.length)];
  const x=80+Math.random()*(innerWidth-200),y=80+Math.random()*(innerHeight-180);
  const el=document.createElement('div');el.id='dark-cookie';el.className=def.cls;el.textContent=def.icon;
  el.style.left=x+'px';el.style.top=y+'px';el.style.animationDuration=(10+Math.random()*8)+'s';
  const lbl=document.createElement('div');lbl.className='dc-label '+def.lblcls;lbl.textContent=def.name;
  lbl.style.left=x+'px';lbl.style.top=(y+54)+'px';lbl.id='dc-lbl';
  document.body.appendChild(el);document.body.appendChild(lbl);
  dcActive=def;
  el.addEventListener('click',()=>collectDC(def,x,y));
  const w=gs.activeEvent?.id==='eclipse'?10:16;
  _dcTimeout=setTimeout(()=>removeDC(false),w*1000);
  // Titan relic: every event triggers a DC
  if(gs.relics.includes('r6')&&gs.activeEvent&&!forceBonus){ setTimeout(()=>spawnDC(true),2000); }
}
function collectDC(def,x,y){
  if(!dcActive)return; sfx.dc();
  const el=document.getElementById('dark-cookie');
  if(el){el.classList.add('vanish');setTimeout(()=>removeDC(true),280);} else removeDC(true);
  const eclBoost=(gs.prestigeRank['m3']||0)>0&&gs.activeEvent?.id==='eclipse'?2:1;
  if(def.effect==='sps_mult'){ const v=def.value*eclBoost; gs.spsMultBuff=v;gs.clickMultBuff=1;gs.buffTimer=def.duration; spawnFloater(x,y,'×'+v+' prod',def.type==='malus'?'red big':'big'); showToast(def.icon+' '+def.name+' ×'+v,def.type==='malus'?'red':def.type==='event'?'purple':'gold'); addLog(def.icon+' '+def.name+' — prod ×'+v,def.type==='malus'?'ev-red':def.type==='event'?'ev-purple':'ev-gold'); }
  else if(def.effect==='click_mult'){ gs.clickMultBuff=def.value;gs.spsMultBuff=1;gs.buffTimer=def.duration; spawnFloater(x,y,'×'+def.value+' clic',def.type==='malus'?'red big':'big'); showToast(def.icon+' '+def.name+' clics ×'+def.value,def.type==='malus'?'red':'gold'); addLog(def.icon+' '+def.name+' — clics ×'+def.value,def.type==='malus'?'ev-red':'ev-gold'); markDirty(); }
  else if(def.effect==='souls_flat'){ const v=(def.value_fn?def.value_fn():def.value)*eclBoost; gs.souls+=v;gs.totalSouls+=v; spawnFloater(x,y,'+'+fmt(v),'big'); showToast(def.icon+' +'+fmt(v)+' âmes','gold'); addLog(def.icon+' '+def.name+' +'+fmt(v)+' âmes','ev-gold'); }
}
function removeDC(collected=false){
  clearTimeout(_dcTimeout);dcActive=null;
  document.getElementById('dark-cookie')?.remove();
  document.getElementById('dc-lbl')?.remove();
  if(!collected)addLog('Une présence s\'évanouit…');
  const base=collected?32:18, eclipse=gs.activeEvent?.id==='eclipse'?.4:1;
  gs._nextDC=(base+Math.random()*38)*eclipse;
}

// ── BUFF TICK ───────────────────────────────────────────────
function tickBuffs(dt){
  if(gs.buffTimer>0){ gs.buffTimer-=dt; if(gs.buffTimer<=0){gs.buffTimer=0;gs.spsMultBuff=1;gs.clickMultBuff=1;} }
}
function tickResonance(dt){
  if(gs.resonanceActive){ gs.resonanceTimer-=dt; if(gs.resonanceTimer<=0){gs.resonanceActive=false;gs.resonanceTimer=0;addLog('Résonance estompée…');markDirty();} }
}
function triggerResonance(){
  if((gs.prestigeRank['m2']||0)>0){ gs.resonanceActive=true;gs.resonanceTimer=5;
    document.getElementById('main-orb')?.classList.add('surge');setTimeout(()=>document.getElementById('main-orb')?.classList.remove('surge'),600);
    addLog('🔄 Résonance — clics ×3 (5s)','ev-purple'); markDirty(); }
}

// ── ACHIEVEMENTS ───────────────────────────────────────────
let _achDirty=true;
function checkAchievements(){
  let gained=false;
  ACHIEVEMENTS.forEach(a=>{
    if(gs.unlockedAch.has(a.id))return;
    if(a.req()){ gs.unlockedAch.add(a.id); gained=true;
      showToast('⚔ Trophée : '+a.name,'gold');
      addLog('⚔ Trophée débloqué : '+a.name,'ev-gold');
      sfx.milestone(); markDirty(); _achDirty=true; }
  });
  return gained;
}

// ── PRESTIGE ───────────────────────────────────────────────
function openPrestigeModal(){
  const bp=calcBP();
  const kp=PRESTIGE_UPS.find(u=>u.type==='keep_pct');
  const kPct=(kp?(gs.prestigeRank[kp.id]||0)*kp.mult:0)*100;
  const kS=Math.floor(gs.souls*kPct/100);
  document.getElementById('pm-stats').innerHTML=`
    <div class="pm-stat"><span class="label">Âmes</span><span class="val">${fmt(gs.souls)}</span></div>
    <div class="pm-stat"><span class="label">Total accumulé</span><span class="val">${fmt(gs.totalSouls)}</span></div>
    <div class="pm-stat"><span class="label">Points de Sang gagnés</span><span class="val">🩸 +${bp}</span></div>
    <div class="pm-stat"><span class="label">Total après</span><span class="val">🩸 ${gs.bloodPoints+bp}</span></div>
    ${kPct>0?`<div class="pm-stat"><span class="label">Âmes conservées (${kPct.toFixed(0)}%)</span><span class="val">${fmt(kS)}</span></div>`:''}`;
  const bd=document.getElementById('pm-buffs');bd.innerHTML='';
  PRESTIGE_UPS.forEach(u=>{ const r=gs.prestigeRank[u.id]||0; if(r>0){const c=document.createElement('div');c.className='pbuff';c.textContent=u.icon+' '+u.name+' ×'+r;bd.appendChild(c);}});
  const ul=document.getElementById('pm-unlocks');ul.innerHTML='';
  if(gs.prestigeCount===0) ul.innerHTML='<div class="pm-unlock"><span>🌑</span> Gouffre Abyssal débloqué</div><div class="pm-unlock"><span>💥</span> Mécaniques de prestige activées</div>';
  openOverlay('prestige-overlay');
}
document.getElementById('btn-cancel-prestige').addEventListener('click',()=>closeOverlay('prestige-overlay'));
document.getElementById('btn-do-prestige').addEventListener('click',()=>{
  sfx.prestige(); shake(true);
  const bp=calcBP();
  const kp=PRESTIGE_UPS.find(u=>u.type==='keep_pct');
  const kS=Math.floor(gs.souls*(kp?(gs.prestigeRank[kp.id]||0)*kp.mult:0));
  const pr={...gs.prestigeRank},sk={...gs.skillRank},pc=gs.prestigeCount+1;
  const bp2=gs.bloodPoints+bp,tbp=gs.totalBP+bp;
  const prevTier=gs.currentTier,prevM=new Set(gs.milestonesReached);
  const prevStats={totalClicks:gs.totalClicks,totalPurchases:gs.totalPurchases,totalDemonsKilled:gs.totalDemonsKilled,playTime:(gs.playTime||0)+((Date.now()-gs.sessionStart)/1000),bossesDefeated:gs.bossesDefeated,questsCompleted:gs.questsCompleted,maxComboReached:gs.maxComboReached,lichSkullBonus:gs.lichSkullBonus,unlockedAch:new Set(gs.unlockedAch),ascensionCount:gs.ascensionCount,voidEssence:gs.voidEssence,totalVE:gs.totalVE,relics:[...gs.relics],invasionDemonsMax:gs.invasionDemonsMax};
  cleanVfx();if(_demonInterval)clearInterval(_demonInterval);if(_eclipseLightLoop)clearInterval(_eclipseLightLoop);
  gs=DS();
  BUILDINGS.forEach(b=>gs.owned[b.id]=0);UPGRADES.forEach(u=>gs.upRank[u.id]=0);PRESTIGE_UPS.forEach(u=>gs.prestigeRank[u.id]=0);Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>gs.skillRank[n.id]=0));
  gs.prestigeRank=pr;gs.skillRank=sk;gs.prestigeCount=pc;gs.bloodPoints=bp2;gs.totalBP=tbp;
  gs.souls=kS;gs.totalSouls=kS;gs.currentTier=prevTier;gs.milestonesReached=prevM;
  Object.assign(gs,prevStats);
  // earn 1 skill point per prestige
  gs._skillPoints=(gs._skillPoints||0)+1;
  closeOverlay('prestige-overlay');
  showToast('🩸 Pacte scellé ! +'+bp+' pts de sang','red');
  addLog('🩸 Renaissance n°'+pc,'ev-red');
  document.getElementById('event-overlay').style.background='rgba(120,10,10,.2)';
  emitBurst(innerWidth/2,innerHeight/2,28,'rgba(180,30,30,.75)');
  setTimeout(()=>document.getElementById('event-overlay').style.background='transparent',2200);
  recalcAll();updateOrbTier();fullRender();saveGame(true);
});

// ── ASCENSION ──────────────────────────────────────────────
function openAscensionModal(){
  const ve=calcVE();
  const nextRelic=RELICS[Math.min(gs.relics.length,RELICS.length-1)];
  document.getElementById('asc-stats').innerHTML=`
    <div class="pm-stat"><span class="label">Prestiges effectués</span><span class="val">× ${gs.prestigeCount}</span></div>
    <div class="pm-stat"><span class="label">Points de Sang total</span><span class="val">🩸 ${gs.totalBP}</span></div>
    <div class="pm-stat"><span class="label">Essence du Vide gagnée</span><span class="val">🌑 +${ve}</span></div>
    <div class="pm-stat"><span class="label">Total Essence</span><span class="val">🌑 ${gs.voidEssence+ve}</span></div>`;
  const rp=document.getElementById('asc-relic-preview');
  rp.innerHTML='<div class="sec-title" style="margin-top:8px">Relique obtenue</div>';
  if(nextRelic){
    const ri=document.createElement('div');ri.className='relic-item';
    ri.innerHTML=`<div class="relic-icon">${nextRelic.icon}</div><div><div class="relic-name">${nextRelic.name}</div><div class="relic-desc">${nextRelic.desc}</div></div>`;
    rp.appendChild(ri);
  }
  openOverlay('ascension-overlay');
}
document.getElementById('btn-cancel-ascension').addEventListener('click',()=>closeOverlay('ascension-overlay'));
document.getElementById('btn-do-ascension').addEventListener('click',()=>{
  if(gs.prestigeCount<3){showToast('Requiert 3 prestiges minimum','red');return;}
  sfx.ascend(); shake(true);
  const ve=calcVE();
  const relicIdx=Math.min(gs.relics.length,RELICS.length-1);
  const newRelic=RELICS[relicIdx];
  // Full reset except ascension count, voidEssence, relics
  const prevAsc=gs.ascensionCount+1, prevVE=gs.voidEssence+ve, prevTVE=gs.totalVE+ve;
  const prevRelics=[...gs.relics,newRelic.id];
  const prevAch=new Set(gs.unlockedAch);
  const prevPT=(gs.playTime||0)+((Date.now()-gs.sessionStart)/1000);
  cleanVfx();if(_demonInterval)clearInterval(_demonInterval);if(_eclipseLightLoop)clearInterval(_eclipseLightLoop);
  gs=DS();
  BUILDINGS.forEach(b=>gs.owned[b.id]=0);UPGRADES.forEach(u=>gs.upRank[u.id]=0);PRESTIGE_UPS.forEach(u=>gs.prestigeRank[u.id]=0);Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>gs.skillRank[n.id]=0));
  gs.ascensionCount=prevAsc;gs.voidEssence=prevVE;gs.totalVE=prevTVE;gs.relics=prevRelics;gs.unlockedAch=prevAch;gs.playTime=prevPT;gs.sessionStart=Date.now();
  closeOverlay('ascension-overlay');
  showToast('🌑 ASCENSION ABYSSALE — '+newRelic.name,'purple');
  addLog('🌑 Ascension n°'+prevAsc+' — Relique : '+newRelic.name,'ev-purple');
  document.getElementById('event-overlay').style.background='rgba(50,10,120,.25)';
  emitBurst(innerWidth/2,innerHeight/2,40,'rgba(100,40,200,.75)');
  setTimeout(()=>document.getElementById('event-overlay').style.background='transparent',2800);
  recalcAll();updateOrbTier();fullRender();saveGame(true);
  checkAchievements();
});

// ── SKILL TREE ─────────────────────────────────────────────
function openSkillTree(){
  renderSkillTree();
  openOverlay('skilltree-overlay');
}
function renderSkillTree(){
  const pts=gs._skillPoints||0;
  document.getElementById('st-pts').textContent=pts;
  const bc=document.getElementById('st-branches');bc.innerHTML='';
  Object.entries(SKILL_TREE).forEach(([key,branch])=>{
    const div=document.createElement('div');div.className='st-branch';
    div.innerHTML=`<div class="st-branch-title" style="color:${branch.color}">${branch.title}</div>`;
    branch.nodes.forEach(n=>{
      const rank=gs.skillRank[n.id]||0;const maxed=rank>=n.maxRank;const canAfford=pts>=n.cost&&!maxed;
      const nd=document.createElement('div');nd.className='st-node'+(maxed?' maxed':'')+((!canAfford&&!maxed)?' locked':'');
      nd.innerHTML=`<span class="st-node-icon">${n.icon}</span><div class="st-node-info"><div class="st-node-name">${n.name}</div><div class="st-node-desc">${n.desc}</div></div><div class="st-node-rank">${maxed?'MAX':rank+'/'+n.maxRank+' ('+n.cost+'pt)'}</div>`;
      if(canAfford) nd.addEventListener('click',()=>{ gs.skillRank[n.id]=(gs.skillRank[n.id]||0)+1; gs._skillPoints=(gs._skillPoints||0)-n.cost; sfx.upgrade(); markDirty(); renderSkillTree(); showToast('🌳 '+n.name+' rang '+(gs.skillRank[n.id]),'gold'); });
      div.appendChild(nd);
    });
    bc.appendChild(div);
  });
}
document.getElementById('btn-close-st').addEventListener('click',()=>closeOverlay('skilltree-overlay'));

// ── ACHIEVEMENTS UI ─────────────────────────────────────────
function renderAchievements(){
  const grid=document.getElementById('ach-grid');if(!grid)return;
  grid.innerHTML='';
  ACHIEVEMENTS.forEach(a=>{
    const unlocked=gs.unlockedAch.has(a.id);
    const div=document.createElement('div');div.className='ach-item '+(unlocked?'unlocked':'locked');
    div.innerHTML=`<div class="ach-icon">${unlocked?a.icon:'🔒'}</div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div>${unlocked?'<div class="ach-bonus">'+a.bonus+'</div>':''}`;
    grid.appendChild(div);
  });
}
document.getElementById('btn-close-ach').addEventListener('click',()=>closeOverlay('achievements-overlay'));
// Patch openOverlay for achievements to auto-render
const _origOpenOverlay=openOverlay;
window.openOverlay=(id)=>{
  if(id==='achievements-overlay')renderAchievements();
  document.getElementById(id)?.classList.add('open');
};

// ── STATS ──────────────────────────────────────────────────
function renderStats(){
  const g=document.getElementById('stats-grid');if(!g)return;
  const pt=(gs.playTime||0)+((Date.now()-gs.sessionStart)/1000);
  const rows=[
    ['Temps joué',formatTime(pt)],
    ['Total âmes',fmt(gs.totalSouls)],
    ['Total clics',fmt(gs.totalClicks||0)],
    ['Meilleur combo','×'+(gs.maxComboReached||0).toFixed(1)],
    ['Prestiges',gs.prestigeCount],
    ['Ascensions',gs.ascensionCount],
    ['Boss vaincus',gs.bossesDefeated||0],
    ['Quêtes finies',gs.questsCompleted||0],
    ['Démons tués',gs.totalDemonsKilled||0],
    ['Trophées',(gs.unlockedAch?.size||0)+'/'+ACHIEVEMENTS.length],
    ['Reliques',((gs.relics||[]).length)+'/'+RELICS.length],
    ['Essence du Vide',fmt(gs.voidEssence||0)],
  ];
  g.innerHTML=rows.map(([l,v])=>`<div class="stat-row"><div class="stat-label">${l}</div><div class="stat-val">${v}</div></div>`).join('');
}
function formatTime(s){ const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60); return h>0?h+'h '+m+'m':m+'m '+sec+'s'; }
document.getElementById('btn-close-stats').addEventListener('click',()=>closeOverlay('stats-overlay'));

// ── RENDER ─────────────────────────────────────────────────
// HUD: only update changed values (track prev)
let _prev={souls:'',sps:'',total:''};
function renderHUD(){
  const sc=fmt(gs.souls); if(sc!==_prev.souls){ document.getElementById('soul-count').textContent=sc; _prev.souls=sc; }
  const tot=fmt(gs.totalSouls)+' âmes'; if(tot!==_prev.total){ document.getElementById('hdr-total').textContent=tot; _prev.total=tot; }
  const effS=getEffSps();
  const spsStr=fmt(effS)+'/s · +'+fmt(getEffectiveClickDisplay())+'/clic'+(gs.spsMultBuff!==1?' (×'+gs.spsMultBuff+')':'');
  if(spsStr!==_prev.sps){ document.getElementById('hdr-sps').textContent=spsStr; _prev.sps=spsStr; }
  if(gs.prestigeCount>0&&!_prev.prestige){ document.getElementById('prestige-count-badge').innerHTML=`<span class="prestige-badge">🩸 ×${gs.prestigeCount}</span>`; _prev.prestige=gs.prestigeCount; }
  if(gs.resonanceActive){ const cpd=document.getElementById('click-power-display');if(cpd)cpd.textContent='⚡ RÉSONANCE ×3'; }
  else { const cpd=document.getElementById('click-power-display');if(cpd&&cpd.textContent)cpd.textContent=''; }
}
function getEffectiveClickDisplay(){ return gs.comboVal>1?Math.round(gs.clickPower*gs.comboVal):gs.clickPower; }

function renderMilestone(){
  const all=MILESTONES_DATA.map(m=>m.souls);
  const next=all.find(m=>m>gs.totalSouls)||all[all.length-1];
  const prevIdx=all.indexOf(next)-1; const prev=prevIdx>=0?all[prevIdx]:0;
  const pct=Math.min(100,((gs.totalSouls-prev)/(next-prev))*100);
  const fill=document.getElementById('ml-fill');if(fill)fill.style.width=pct.toFixed(1)+'%';
  document.getElementById('ml-label').textContent='Seuil: '+fmt(next);
  document.getElementById('ml-pct').textContent=pct.toFixed(0)+'%';
  const mdata=MILESTONES_DATA.find(m=>m.souls===next);
  const mn=document.getElementById('ml-name');if(mn&&mdata)mn.textContent=mdata.name;
}
const GLYPHS=['☽','⚔','🔥','💀','⭐','🌀','👁','∞'];
function updateOrbGlyph(){ const t=Object.values(gs.owned).reduce((a,b)=>a+b,0); document.getElementById('orb-glyph').textContent=GLYPHS[Math.min(GLYPHS.length-1,Math.floor(t/20))]; }

// Buildings: minimal DOM update each tick
function renderBuildings(){
  const list=document.getElementById('tab-gen');if(!list)return;
  if(!list.querySelector('.sec-title')){ const t=document.createElement('div');t.className='sec-title';t.textContent='Invocateurs d\'âmes';list.prepend(t); }
  const ex={};list.querySelectorAll('.building[data-id]').forEach(el=>ex[el.dataset.id]=el);
  BUILDINGS.forEach(b=>{
    const locked=(b.prestigeReq&&gs.prestigeCount<b.prestigeReq)||(b.ascensionReq&&gs.ascensionCount<b.ascensionReq);
    const cost=getBuildingCost(b); const canAfford=!locked&&gs.souls>=cost;
    let el=ex[b.id];
    if(!el){ el=document.createElement('div');el.dataset.id=b.id;list.appendChild(el);
      el.addEventListener('click',()=>buyBuilding(b,el)); }
    el.className='building'+(canAfford?' can-afford':'')+(locked?' locked':'')+(b.prestigeReq?' prestige-unlocked':'')+(b.ascensionReq?' abyss-unlocked':'');
    el.innerHTML=`<div class="b-icon">${b.icon}</div><div class="b-info"><div class="b-name">${b.name}</div><div class="b-desc">${locked?'🔒 Requiert '+(b.prestigeReq?'prestige':'ascension'):b.desc}</div></div><div class="b-right"><span class="b-owned">${gs.owned[b.id]||0}</span><div class="b-cost">${locked?'🔒':fmt(cost)}</div></div>`;
  });
}

function renderUpgrades(){
  const list=document.getElementById('tab-upg');if(!list)return;
  list.innerHTML='';
  const sec=(title,arr)=>{ if(!arr.length)return; const s=document.createElement('div');s.className='sec-title';s.textContent=title;list.appendChild(s); const g=document.createElement('div');g.className='up-grid';arr.forEach(u=>g.appendChild(makeUpEl(u,false)));list.appendChild(g); };
  sec('Pouvoir du Clic',UPGRADES.filter(u=>['click','click_mult','synergy'].includes(u.type)));
  sec('Rituels des Bâtiments',UPGRADES.filter(u=>u.type==='building'));
  sec('Malédictions Globales',UPGRADES.filter(u=>u.type==='global'));
  sec('Automatisation',UPGRADES.filter(u=>u.type==='auto'));
}
function makeUpEl(u,isP){
  const rank=isP?(gs.prestigeRank[u.id]||0):(gs.upRank[u.id]||0);
  const maxed=rank>=u.maxRank; const unlocked=isP?true:u.req(); const cost=isP?getPrestigeCost(u):getUpgradeCost(u);
  const isMech=isP&&u.type?.startsWith('mech_');
  const el=document.createElement('div');
  el.className='upgrade'+(isP?' up-blood':'')+(isMech?' up-prestige-mechanic':'')+(u.type?.includes('abyss')?' up-abyss':'')+(!unlocked?' locked':'')+(maxed?' maxed':'');
  el.innerHTML=`<div class="up-head"><span class="up-icon">${u.icon}</span><span class="up-name">${u.name}</span></div><div class="up-desc">${u.desc}</div><div class="up-footer"><span class="up-cost">${maxed?'MAX':((isP?'🩸 ':'')+fmt(cost))}</span><span class="up-rank ${maxed?'full':''}">${rank}/${u.maxRank}</span></div>`;
  if(unlocked&&!maxed) el.addEventListener('click',()=>isP?buyPrestigeUp(u,el):buyUpgrade(u,el));
  return el;
}

function renderPrestigeTab(){
  const tab=document.getElementById('tab-blood');if(!tab)return;tab.innerHTML='';
  const bp=calcBP(),req=500000;
  const ib=document.createElement('div');ib.className='prestige-info-box';
  ib.innerHTML=`<div class="pi-row"><span>Points de Sang</span><span class="pi-val">🩸 ${gs.bloodPoints}</span></div><div class="pi-row"><span>Prochains</span><span class="pi-val">🩸 +${bp}</span></div><div class="pi-row"><span>Prestiges</span><span class="pi-val">× ${gs.prestigeCount}</span></div><div class="pi-row"><span>Points skill</span><span class="pi-val">⭐ ${gs._skillPoints||0}</span></div>`;
  tab.appendChild(ib);
  if(gs.totalSouls<req){ const r=document.createElement('div');r.className='prestige-req';r.textContent='Requiert '+fmt(req)+' âmes ('+fmt(gs.totalSouls)+' / '+fmt(req)+')';tab.appendChild(r); }
  const btn=document.createElement('button');btn.className='btn-open-prestige';btn.innerHTML=bp>0?'🩸 Pacte de Sang (+'+bp+' pts)':'🩸 Pacte (indisponible)';btn.disabled=gs.totalSouls<req||bp<1;btn.addEventListener('click',openPrestigeModal);tab.appendChild(btn);
  const t1=document.createElement('div');t1.className='sec-title';t1.textContent='Multiplicateurs';tab.appendChild(t1);
  const g1=document.createElement('div');g1.className='up-grid';PRESTIGE_UPS.filter(u=>!u.type.startsWith('mech_')).forEach(u=>g1.appendChild(makeUpEl(u,true)));tab.appendChild(g1);
  const t2=document.createElement('div');t2.className='sec-title';t2.textContent='Mécaniques Uniques';tab.appendChild(t2);
  const ms=document.createElement('div');ms.className='prestige-mechanic-section';
  const md=document.createElement('div');md.className='pm-mechanic-desc';md.textContent='Ces améliorations transforment le jeu.';ms.appendChild(md);
  const g2=document.createElement('div');g2.className='up-grid';PRESTIGE_UPS.filter(u=>u.type.startsWith('mech_')).forEach(u=>g2.appendChild(makeUpEl(u,true)));ms.appendChild(g2);tab.appendChild(ms);
  // Relics
  if(gs.relics.length>0){
    const t3=document.createElement('div');t3.className='sec-title';t3.textContent='Reliques Actives';tab.appendChild(t3);
    gs.relics.forEach(rid=>{ const r=RELICS.find(x=>x.id===rid);if(!r)return; const ri=document.createElement('div');ri.className='relic-item';ri.innerHTML=`<div class="relic-icon">${r.icon}</div><div><div class="relic-name">${r.name}</div><div class="relic-desc">${r.desc}</div></div>`;tab.appendChild(ri); });
  }
}

function renderAbyssTab(){
  const tab=document.getElementById('tab-abyss');if(!tab)return;tab.innerHTML='';
  const ve=calcVE();
  const ib=document.createElement('div');ib.className='abyss-info-box prestige-info-box';
  ib.innerHTML=`<div class="pi-row"><span>Essence du Vide</span><span class="pi-val">🌑 ${gs.voidEssence}</span></div><div class="pi-row"><span>Prochaine ascension</span><span class="pi-val">🌑 +${ve}</span></div><div class="pi-row"><span>Ascensions</span><span class="pi-val">× ${gs.ascensionCount}</span></div><div class="pi-row"><span>Reliques</span><span class="pi-val">💎 ${gs.relics.length}/${RELICS.length}</span></div>`;
  tab.appendChild(ib);
  const req=3;
  if(gs.prestigeCount<req){ const r=document.createElement('div');r.className='prestige-req';r.textContent='Requiert '+req+' prestiges minimum ('+gs.prestigeCount+'/'+req+')';tab.appendChild(r); }
  const btn=document.createElement('button');btn.className='btn-open-prestige btn-open-asc';btn.innerHTML=gs.prestigeCount>=req?'🌑 Ascension Abyssale (+'+ve+' Essence)':'🌑 Ascension indisponible';btn.disabled=gs.prestigeCount<req;btn.addEventListener('click',openAscensionModal);tab.appendChild(btn);
  if(gs.relics.length===0){ const empty=document.createElement('div');empty.className='prestige-req';empty.textContent='Aucune relique — effectuez votre première Ascension.';tab.appendChild(empty);return; }
  const t=document.createElement('div');t.className='sec-title';t.textContent='Reliques';tab.appendChild(t);
  gs.relics.forEach(rid=>{ const r=RELICS.find(x=>x.id===rid);if(!r)return; const ri=document.createElement('div');ri.className='relic-item';ri.innerHTML=`<div class="relic-icon">${r.icon}</div><div><div class="relic-name">${r.name}</div><div class="relic-desc">${r.desc}</div></div>`;tab.appendChild(ri); });
}

function fullRender(){
  renderHUD();renderMilestone();renderBuildings();renderUpgrades();renderPrestigeTab();renderAbyssTab();updateOrbGlyph();
  _prev.prestige=null;
}

// ── BUY ACTIONS ────────────────────────────────────────────
function buyBuilding(b,el){
  if((b.prestigeReq&&gs.prestigeCount<b.prestigeReq)||(b.ascensionReq&&gs.ascensionCount<b.ascensionReq))return;
  const cost=getBuildingCost(b);if(gs.souls<cost)return;
  sfx.buy(); gs.souls-=cost; gs.owned[b.id]=(gs.owned[b.id]||0)+1; gs.totalPurchases++;
  markDirty(); burstEl(el);
  document.getElementById('main-orb')?.classList.add('surge');setTimeout(()=>document.getElementById('main-orb')?.classList.remove('surge'),580);
  const rect=el.getBoundingClientRect();emitBurst(rect.left+rect.width/2,rect.top,7,'rgba(200,160,50,.75)');
  addLog(b.icon+' '+b.name+' ×'+(gs.owned[b.id]));
  updateOrbGlyph(); triggerResonance(); renderBuildings(); renderPrestigeTab();
}
function buyUpgrade(u,el){
  const rank=gs.upRank[u.id]||0;if(rank>=u.maxRank)return;
  const cost=getUpgradeCost(u);if(gs.souls<cost)return;
  sfx.upgrade(); gs.souls-=cost; gs.upRank[u.id]=rank+1; gs.totalPurchases++;
  markDirty(); burstEl(el);
  applyUpgradeVfx(u.vfx,gs.upRank[u.id]);
  const rect=el.getBoundingClientRect();emitBurst(rect.left+rect.width/2,rect.top,10,'rgba(160,80,220,.75)');
  showToast(u.icon+' '+u.name+' rang '+gs.upRank[u.id],'gold');
  addLog(u.icon+' '+u.name+' rang '+gs.upRank[u.id]+'/'+u.maxRank);
  triggerResonance(); renderUpgrades();
}
function buyPrestigeUp(u,el){
  const rank=gs.prestigeRank[u.id]||0;if(rank>=u.maxRank)return;
  const cost=getPrestigeCost(u);if(gs.bloodPoints<cost)return;
  sfx.upgrade(); gs.bloodPoints-=cost; gs.prestigeRank[u.id]=rank+1;
  markDirty(); burstEl(el);
  const rect=el.getBoundingClientRect();emitBurst(rect.left+rect.width/2,rect.top,9,'rgba(200,50,50,.75)');
  showToast('🩸 '+u.name+' rang '+gs.prestigeRank[u.id],'red');
  addLog('🩸 '+u.name+' rang '+gs.prestigeRank[u.id]); renderPrestigeTab();
}

// ── MAIN LOOP ──────────────────────────────────────────────
let lastTick=performance.now();
// Throttle full DOM renders
let _renderTick=0;
function gameLoop(now){
  const dt=Math.min((now-lastTick)/1000,.1);lastTick=now;

  // Production
  const effSps=getEffSps();
  const effAuto=gs.autoCps*gs.clickPower;
  const gain=(effSps+effAuto)*dt;
  if(gain>0){ gs.souls+=gain; gs.totalSouls+=gain; }
  // Quest souls tracking
  if(gs.activeQuest?.type==='souls') gs.questProgress+=gain;

  // Stats
  gs.playTime=(gs.playTime||0)+dt;

  // Sub-systems
  tickEvents(dt);
  tickBuffs(dt);
  tickDC(dt);
  tickCombo(dt);
  tickResonance(dt);
  tickQuestCombo(dt);
  tickCanvas(dt);

  // Check quest
  if(gs.activeQuest)tickQuest(dt);
  else { _nextQuestIn-=dt; if(_nextQuestIn<=0)trySpawnQuest(); }

  // Recalc only when dirty
  if(_cache.dirty)recalcAll();

  // Milestones every 2s
  _renderTick+=dt;
  if(_renderTick>=0.5){ _renderTick=0; checkMilestones(); checkAchievements(); }

  // HUD every frame (cheap)
  renderHUD(); renderMilestone();

  // Cheap building affordability update
  document.querySelectorAll('.building[data-id]').forEach(el=>{
    const b=BUILDINGS.find(x=>x.id===el.dataset.id);if(!b)return;
    if((b.prestigeReq&&gs.prestigeCount<b.prestigeReq)||(b.ascensionReq&&gs.ascensionCount<b.ascensionReq))return;
    const cost=getBuildingCost(b);const can=gs.souls>=cost;
    el.classList.toggle('can-afford',can);
  });

  requestAnimationFrame(gameLoop);
}

// ── ORB CLICK ──────────────────────────────────────────────
document.getElementById('main-orb').addEventListener('click',function(e){
  sfx.click(); gs.totalClicks++;
  registerClick();
  registerQuestClick();
  handleEclipseClick(e.clientX,e.clientY);
  handlePactClick();
  if(gs.activeBoss){ damageBoss(Math.max(1,gs.clickPower)); }
  const gain=getEffClick();
  gs.souls+=gain; gs.totalSouls+=gain;
  if(gs.activeQuest?.type==='souls')gs.questProgress+=gain;
  const isCrit=gs._lastCrit;
  const cls=isCrit?'crit':(gs.activeEvent?.id==='eclipse'?'red':(gs.activeEvent?.id==='invasion'?'purple':''));
  spawnFloater(e.clientX,e.clientY,(isCrit?'💥':'+')+(isCrit?'CRIT! ':'')+fmt(gain),cls);
  emitBurst(e.clientX,e.clientY,5,gs.activeEvent?.id==='eclipse'?'rgba(200,50,50,.65)':gs.activeEvent?.id==='invasion'?'rgba(120,50,200,.65)':'rgba(200,160,50,.55)');
  this.classList.remove('surge');void this.offsetWidth;this.classList.add('surge');
  setTimeout(()=>this.classList.remove('surge'),480);
});

// ── TABS ───────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click',function(){
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active-tab'));
    this.classList.add('active');
    document.getElementById('tab-'+this.dataset.tab).classList.add('active-tab');
    if(this.dataset.tab==='blood')renderPrestigeTab();
    if(this.dataset.tab==='abyss')renderAbyssTab();
    if(this.dataset.tab==='upg')renderUpgrades();
  });
});

// Close overlays on background click
['prestige-overlay','ascension-overlay','achievements-overlay','skilltree-overlay','stats-overlay'].forEach(id=>{
  document.getElementById(id)?.addEventListener('click',function(e){ if(e.target===this)closeOverlay(id); });
});

// ── BG PARTICLES ───────────────────────────────────────────
function spawnBgParticles(){
  const colors=['rgba(180,120,50,.45)','rgba(120,50,160,.35)','rgba(80,20,20,.45)','rgba(200,160,80,.25)','rgba(60,20,100,.35)'];
  for(let i=0;i<28;i++){
    const p=document.createElement('div');p.className='particle';
    const sz=Math.random()*2.5+.8;
    p.style.cssText=`width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}%;animation-duration:${8+Math.random()*12}s;animation-delay:${Math.random()*-18}s;`;
    document.getElementById('particles').appendChild(p);
  }
}

// ── INTRO ──────────────────────────────────────────────────
function startGame(load=false){
  const intro=document.getElementById('intro-screen');
  intro.classList.add('fade-out');
  setTimeout(()=>{ intro.style.display='none'; document.getElementById('game-root').style.display=''; },800);
  initCanvas(); spawnBgParticles();
  if(load){ if(!loadGame()){ recalcAll();updateOrbTier();fullRender(); } }
  else { recalcAll();updateOrbTier();fullRender(); }
  setInterval(()=>saveGame(true),30000);
  requestAnimationFrame(gameLoop);
}
document.getElementById('intro-btn').addEventListener('click',()=>startGame(false));
document.getElementById('intro-load-btn').addEventListener('click',()=>startGame(true));