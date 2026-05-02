// ══════════════════════════════════════════════════════════
//  SOUL HARVEST v5 — script.js (rebuilt, no SyntaxErrors)
// ══════════════════════════════════════════════════════════

// ── AUDIO ──────────────────────────────────────────────────
let _actx=null;
function ac(){if(!_actx)_actx=new(window.AudioContext||window.webkitAudioContext)();return _actx;}
function tone(f,t='sine',d=.08,v=.055,dec=.05){
  try{
    if(localStorage.getItem('sh_sound')==='0')return;
    const a=ac(),o=a.createOscillator(),g=a.createGain();
    const vol=((parseInt(localStorage.getItem('sh_volume')||'60'))/100)*v;
    o.connect(g);g.connect(a.destination);o.type=t;o.frequency.value=f;
    g.gain.setValueAtTime(vol,a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);
    o.start();o.stop(a.currentTime+d+dec);
  }catch(e){}
}
const sfx={
  click:  ()=>tone(220,'triangle',.06,.04),
  buy:    ()=>{tone(330,'sine',.1,.06);setTimeout(()=>tone(440,'sine',.08,.04),80);},
  upgrade:()=>[330,440,550,660].forEach((f,i)=>setTimeout(()=>tone(f,'sine',.1,.055),i*55)),
  prestige:()=>[110,220,330,220,110].forEach((f,i)=>setTimeout(()=>tone(f,'sawtooth',.18,.07),i*110)),
  event:  ()=>[180,120,90].forEach((f,i)=>setTimeout(()=>tone(f,'square',.14,.055),i*90)),
  milestone:()=>[440,550,660,880].forEach((f,i)=>setTimeout(()=>tone(f,'sine',.17,.09),i*85)),
  dc:     ()=>{tone(660,'sine',.11,.07);setTimeout(()=>tone(440,'sine',.09,.05),90);},
  demon:  ()=>tone(150,'sawtooth',.07,.06),
  boss:   ()=>[200,150,100].forEach((f,i)=>setTimeout(()=>tone(f,'sawtooth',.15,.07),i*80)),
  ascend: ()=>[55,110,220,440,880].forEach((f,i)=>setTimeout(()=>tone(f,'sine',.22,.08),i*130)),
};

// ── FORMAT ─────────────────────────────────────────────────
function fmt(n){
  if(n>=1e15)return(n/1e15).toFixed(2)+' Qa';
  if(n>=1e12)return(n/1e12).toFixed(2)+' T';
  if(n>=1e9) return(n/1e9).toFixed(2)+' B';
  if(n>=1e6) return(n/1e6).toFixed(2)+' M';
  if(n>=1e3) return(n/1e3).toFixed(1)+' k';
  return Math.floor(n).toLocaleString();
}
function formatTime(s){
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60);
  return h>0?h+'h '+m+'m':m+'m '+sec+'s';
}

// ══════════════════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════════════════
const BUILDINGS=[
  {id:'cultist',icon:'🕯️',name:'Cultiste',         desc:'Prières obscures',           base:15,      sps:.1},
  {id:'tomb',   icon:'⚰️',name:'Tombeau',            desc:'Les morts travaillent',       base:120,     sps:.6},
  {id:'altar',  icon:'🔮',name:'Autel Noir',          desc:"Rituel d'invocation",         base:650,     sps:2.5},
  {id:'crypt',  icon:'🏚️',name:'Crypte Ancienne',    desc:'Dort depuis des siècles',     base:2800,    sps:9},
  {id:'lich',   icon:'💀',name:'Liche',              desc:'Nécromancien immortel',        base:10000,   sps:30},
  {id:'portal', icon:'🌀',name:'Portail Démoniaque', desc:"Fissure vers l'Au-delà",      base:40000,   sps:100},
  {id:'void',   icon:'🕳️',name:'Fragment du Néant',  desc:'Le vide absorbe tout',        base:200000,  sps:400},
  {id:'titan',  icon:'👁️',name:'Titan Primordial',   desc:'Entité antérieure à la mort', base:1200000, sps:1800},
  {id:'abyss',  icon:'🌑',name:'Gouffre Abyssal',    desc:'Requiert Pacte de Sang',      base:5000000, sps:8000,  prestigeReq:1},
  {id:'nexus',  icon:'🔱',name:'Nexus Abyssal',      desc:'Requiert Ascension',          base:50000000,sps:40000, ascensionReq:1},
];

const UPGRADES=[
  {id:'c1',icon:'🗡️',name:'Lames Maudites',    desc:'+1 clic/rang',         cost:80,     maxRank:5,type:'click',      add:1,   req:()=>true,                     vfx:'none'},
  {id:'c2',icon:'🔥',name:"Flammes de l'Âme",  desc:'×1.5 clic/rang',       cost:600,    maxRank:4,type:'click_mult', mult:1.5,req:()=>gs.totalSouls>=300,       vfx:'fire'},
  {id:'c3',icon:'⚡',name:'Foudre Noire',       desc:'+5 clic/rang',         cost:5000,   maxRank:5,type:'click',      add:5,   req:()=>gs.totalSouls>=1500,      vfx:'lightning'},
  {id:'c4',icon:'🌑',name:'Éclipse Totale',     desc:'×2 clic/rang',         cost:40000,  maxRank:3,type:'click_mult', mult:2,  req:()=>gs.totalSouls>=20000,     vfx:'none'},
  {id:'b1',icon:'📜',name:'Grimoire Sanglant',  desc:'Cultistes ×2/rang',    cost:300,    maxRank:4,type:'building',   target:'cultist',mult:2,req:()=>gs.owned.cultist>=5, vfx:'none'},
  {id:'b2',icon:'🦴',name:'Os des Anciens',     desc:'Tombeaux ×2/rang',     cost:2000,   maxRank:4,type:'building',   target:'tomb',   mult:2,req:()=>gs.owned.tomb>=3,    vfx:'none'},
  {id:'b3',icon:'💫',name:'Étoile Mourante',    desc:'Autels ×2/rang',       cost:9000,   maxRank:4,type:'building',   target:'altar',  mult:2,req:()=>gs.owned.altar>=5,   vfx:'none'},
  {id:'b4',icon:'🕸️',name:"Toile de l'Oubli",  desc:'Cryptes ×2/rang',      cost:35000,  maxRank:3,type:'building',   target:'crypt',  mult:2,req:()=>gs.owned.crypt>=5,   vfx:'none'},
  {id:'b5',icon:'🧿',name:'Œil du Liche',       desc:'Liches ×2/rang',       cost:140000, maxRank:3,type:'building',   target:'lich',   mult:2,req:()=>gs.owned.lich>=3,    vfx:'none'},
  {id:'b6',icon:'🌀',name:'Vortex Abyssal',     desc:'Portails ×2/rang',     cost:600000, maxRank:3,type:'building',   target:'portal', mult:2,req:()=>gs.owned.portal>=3,  vfx:'none'},
  {id:'g1',icon:'🌙',name:'Lune de Sang',       desc:'Prod ×1.3/rang',       cost:25000,  maxRank:5,type:'global',     mult:1.3,req:()=>gs.totalSouls>=12000,     vfx:'none'},
  {id:'g2',icon:'🌑',name:'Soleil Noir',         desc:'Prod ×1.5/rang',       cost:200000, maxRank:4,type:'global',     mult:1.5,req:()=>gs.totalSouls>=100000,    vfx:'none'},
  {id:'g3',icon:'✨',name:'Convergence',         desc:'Clic = 1% prod/sec',   cost:8000,   maxRank:1,type:'synergy',             req:()=>gs.totalSouls>=4000,      vfx:'convergence'},
  {id:'a1',icon:'⚙️',name:'Rituel Autonome',    desc:'Auto-clic 0.5/s/rang', cost:2500,   maxRank:5,type:'auto',       cps:.5,  req:()=>gs.owned.cultist>=3,       vfx:'none'},
  {id:'a2',icon:'🤖',name:'Golem de Pierre',    desc:'Auto-clic 1/s/rang',   cost:18000,  maxRank:4,type:'auto',       cps:1,   req:()=>gs.totalSouls>=6000,      vfx:'none'},
  {id:'v1',icon:'🕳️',name:'Fractures du Néant', desc:'Voids ×2/rang',        cost:1500000,maxRank:3,type:'building',   target:'void',   mult:2,req:()=>gs.owned.void>=2,     vfx:'void'},
  {id:'v2',icon:'👁️',name:'Regard du Titan',    desc:'Titans ×2/rang',       cost:8000000,maxRank:3,type:'building',   target:'titan',  mult:2,req:()=>gs.owned.titan>=1,    vfx:'none'},
];

const PRESTIGE_UPS=[
  {id:'p1',icon:'🩸',name:'Soif de Sang',      desc:'+12% prod/rang',          cost:2, maxRank:10,type:'global_mult',         mult:1.12},
  {id:'p2',icon:'💔',name:'Cœur Brisé',        desc:'+50% clic/rang',          cost:4, maxRank:5, type:'click_pmult',         mult:1.5},
  {id:'p3',icon:'⚰️',name:'Mémoire des Morts', desc:'Garder 5% âmes/rang',     cost:6, maxRank:4, type:'keep_pct',            mult:.05},
  {id:'p4',icon:'🌹',name:'Rose Maudite',       desc:'Bâtiments -8% coût/rang', cost:5, maxRank:5, type:'cost_reduce',         mult:.92},
  {id:'p5',icon:'👑',name:"Couronne d'Ombre",   desc:'×2.5 prod global',        cost:20,maxRank:3, type:'global_mult',         mult:2.5},
  {id:'m1',icon:'💥',name:'Frappe Explosive',   desc:'1% chance clic ×100/rang',cost:8, maxRank:3, type:'mech_crit',           critChance:.01,critMult:100},
  {id:'m2',icon:'🔄',name:'Résonance Sombre',   desc:'Achat = clics ×3 (5s)',   cost:10,maxRank:1, type:'mech_resonance'},
  {id:'m3',icon:'🌀',name:'Vortex Temporel',    desc:'Eclipse double DC bonus', cost:12,maxRank:1, type:'mech_eclipse_dc'},
  {id:'m4',icon:'👿',name:'Maître des Démons',  desc:'+10 démons max/rang',     cost:8, maxRank:3, type:'mech_demon_cap',      add:10},
  {id:'m5',icon:'⭐',name:'Étoile Mourante',    desc:'Milestones +10% prod/rang',cost:15,maxRank:5,type:'mech_milestone_boost',mult:.10},
];

const SKILL_TREE={
  passive:{title:'🌙 Voie Passive',color:'#b080d8',nodes:[
    {id:'s_p1',icon:'🌕',name:'Cycle Lunaire',    desc:'SPS +20%/rang',               cost:1,maxRank:5,effect:'global_sps',  mult:.2},
    {id:'s_p2',icon:'⚰️',name:'Légion des Morts', desc:'Tous bâtiments +5%/rang',     cost:2,maxRank:5,effect:'all_build',   mult:.05},
    {id:'s_p3',icon:'🌑',name:'Nuit Éternelle',   desc:'SPS ×1.5 (passif)',           cost:3,maxRank:1,effect:'night_bonus'},
    {id:'s_p4',icon:'🌌',name:'Abyssal Passif',   desc:'Abyss ×3/rang',               cost:4,maxRank:3,effect:'abyss_mult',  mult:3},
  ]},
  active:{title:'⚔ Voie Active',color:'#e06060',nodes:[
    {id:'s_a1',icon:'🗡️',name:'Maîtrise du Clic', desc:'Clic +2/rang',                cost:1,maxRank:5,effect:'click_add',   add:2},
    {id:'s_a2',icon:'💥',name:'Combo Maître',      desc:'Combo max +3 niveaux/rang',   cost:2,maxRank:4,effect:'combo_cap',   add:3},
    {id:'s_a3',icon:'🔥',name:'Ardeur de Sang',    desc:'Fenêtre combo +0.08s/rang',   cost:2,maxRank:3,effect:'combo_dur',   add:.08},
    {id:'s_a4',icon:'⚡',name:'Décharge Totale',   desc:'Reset combo = clic ×5 (1s)',  cost:5,maxRank:1,effect:'combo_burst'},
  ]},
  hybrid:{title:'✨ Voie Hybride',color:'#60d080',nodes:[
    {id:'s_h1',icon:'⚖️',name:'Équilibre',         desc:'Clic ajoute 0.5% sps/rang',   cost:2,maxRank:4,effect:'click_to_sps',mult:.005},
    {id:'s_h2',icon:'🔮',name:'Synergie Noire',    desc:'SPS boost clic +2%/rang',     cost:3,maxRank:4,effect:'sps_to_click',mult:.02},
    {id:'s_h3',icon:'🌀',name:'Vortex Hybride',    desc:'Events durent -20%',          cost:4,maxRank:1,effect:'event_short'},
    {id:'s_h4',icon:'♾️',name:'Cycle Infini',      desc:'Reset combo = bonus sps 10s', cost:5,maxRank:1,effect:'combo_sps'},
  ]},
  chaos:{title:'🌑 Voie du Chaos',color:'#9060ff',nodes:[
    {id:'s_c1',icon:'🎲',name:'Destin Brisé',      desc:'10% chance ×10 gain/rang',    cost:2,maxRank:3,effect:'chaos_chance',mult:.1},
    {id:'s_c2',icon:'👁️',name:"Œil du Chaos",      desc:'Boss HP -15%/rang',           cost:3,maxRank:3,effect:'boss_weak',   mult:.15},
    {id:'s_c3',icon:'🌪️',name:'Tempête Intérieure',desc:'Events bonus ×1.5/rang',      cost:4,maxRank:2,effect:'event_boost', mult:1.5},
    {id:'s_c4',icon:'🔱',name:'Trident Abyssal',   desc:'Reliques +25% effet/rang',    cost:6,maxRank:3,effect:'relic_boost', mult:.25},
  ]},
};

const RELICS=[
  {id:'r1',icon:'💀',name:'Crâne du Liche',     desc:'Chaque mort en invasion = +1% prod permanent (max 100%)'},
  {id:'r2',icon:'🌙',name:'Éclat Lunaire',      desc:'La lune de sang dure 2× plus longtemps'},
  {id:'r3',icon:'⚔️',name:"Lame de l'Abysse",   desc:'Clics pendant boss comptent ×3'},
  {id:'r4',icon:'🔮',name:'Orbe de Cristal',    desc:'Coût des upgrades -25% permanent'},
  {id:'r5',icon:'👁️',name:'Regard Éternel',     desc:'Auto-clic +5/s permanent'},
  {id:'r6',icon:'🌀',name:'Fragment Temporel',  desc:'Tous les événements déclenchent un bonus DC'},
  {id:'r7',icon:'🩸',name:'Sang Primordial',    desc:'Points de sang valent ×2 en upgrades prestige'},
  {id:'r8',icon:'🌑',name:'Noirceur Absolue',   desc:'SPS ×10 pendant 30s à chaque milestone'},
];

const ORB_SKINS=[
  {id:'default', name:'Orbe Lunaire',     glyph:'☽', unlockSouls:0,        gradient:'radial-gradient(circle at 33% 33%,#2e1428,#150a18 55%,#0b060e)', border:'rgba(160,110,40,.35)'},
  {id:'skull',   name:'Crâne Maudit',     glyph:'💀', unlockSouls:1000,     gradient:'radial-gradient(circle at 33% 33%,#1a0808,#0e0404 55%,#080202)', border:'rgba(180,60,40,.5)'},
  {id:'crystal', name:'Cristal du Néant', glyph:'💎', unlockSouls:100000,   gradient:'radial-gradient(circle at 33% 33%,#0a1a2a,#050e18 55%,#020810)', border:'rgba(80,150,220,.5)'},
  {id:'void',    name:'Œil du Vide',      glyph:'🕳️',unlockSouls:1000000,  gradient:'radial-gradient(circle at 33% 33%,#08020e,#040108 55%,#020106)', border:'rgba(120,40,200,.6)'},
  {id:'blacksun',name:'Soleil Noir',      glyph:'🌑', unlockSouls:10000000, gradient:'radial-gradient(circle at 50% 50%,#1a1a00,#0a0800 55%,#050400)', border:'rgba(200,180,40,.5)'},
  {id:'titan',   name:'Œil du Titan',     glyph:'👁️',unlockSouls:1e9,      gradient:'radial-gradient(circle at 33% 33%,#001a0a,#000e05 55%,#000804)', border:'rgba(40,200,120,.5)'},
];

const DEMON_PACTS=[
  {id:'zar',name:"Zar'thul le Dévoreur",icon:'😈',
   offer:"Je t'offre ×5 prod pendant 60s… mais ta production s'arrêtera 30s après.",
   accept:{spsBonus:5,bonusDur:60,penalty:'stop30'},
   refuse:{spsBonus:1.5,bonusDur:10},
   acceptLabel:'Sceller le pacte',refuseLabel:"Repousser l'abomination"},
  {id:'vel',name:"Vel'zara la Trompeuse",icon:'👿',
   offer:'Je double tes clics (30s)… mais ton prochain dark cookie sera une malédiction.',
   accept:{clickBonus:2,bonusDur:30,penalty:'force_malus'},
   refuse:{soulsFlat:()=>Math.max(500,gs.sps*15)},
   acceptLabel:'Signer le contrat',refuseLabel:'Dénoncer la ruse'},
  {id:'mog',name:"Mog'thurak le Titan",icon:'👹',
   offer:'SPS ×10 pendant 45s… mais un boss surgit immédiatement.',
   accept:{spsBonus:10,bonusDur:45,penalty:'spawn_boss'},
   refuse:{soulsFlat:()=>Math.max(200,gs.sps*5)},
   acceptLabel:'Accepter le pouvoir',refuseLabel:'Chasser le titan'},
  {id:'nyx',name:"Nyx'ara l'Ombre",icon:'🌑',
   offer:'+20% de tes âmes totales… mais tu perds 10% de tes bâtiments achetés.',
   accept:{soulsFlat:()=>gs.totalSouls*.2,penalty:'lose_buildings'},
   refuse:{clickBonus:3,bonusDur:15},
   acceptLabel:'Accepter le trésor',refuseLabel:"Ignorer l'ombre"},
];

const BG_TIERS=[
  {tier:0,css:'radial-gradient(ellipse at 15% 50%,rgba(90,20,20,.12) 0%,transparent 55%),radial-gradient(ellipse at 85% 20%,rgba(50,10,70,.1) 0%,transparent 50%)'},
  {tier:1,css:'radial-gradient(ellipse at 20% 60%,rgba(120,30,20,.18) 0%,transparent 50%),radial-gradient(ellipse at 80% 30%,rgba(80,20,80,.14) 0%,transparent 45%)'},
  {tier:2,css:'radial-gradient(ellipse at 30% 70%,rgba(160,40,10,.22) 0%,transparent 45%),radial-gradient(ellipse at 70% 20%,rgba(120,20,10,.16) 0%,transparent 40%)'},
  {tier:3,css:'radial-gradient(ellipse at 50% 80%,rgba(180,50,10,.26) 0%,transparent 40%),radial-gradient(ellipse at 50% 20%,rgba(140,20,0,.2) 0%,transparent 35%)'},
  {tier:4,css:'radial-gradient(ellipse at 50% 50%,rgba(60,20,120,.32) 0%,transparent 55%),radial-gradient(ellipse at 20% 80%,rgba(20,10,80,.22) 0%,transparent 40%)'},
  {tier:5,css:'radial-gradient(ellipse at 50% 50%,rgba(10,5,30,.42) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(5,2,20,.32) 0%,transparent 40%)'},
];

const ACHIEVEMENTS=[
  {id:'a_first',  icon:'🌑',name:'Première Âme',     desc:'Récolter 1 âme',             req:()=>gs.totalSouls>=1,              bonus:'Clic +1'},
  {id:'a_100',    icon:'💀',name:'Centurie',          desc:'Récolter 100 âmes',          req:()=>gs.totalSouls>=100,            bonus:'+5% prod'},
  {id:'a_1k',     icon:'🕯️',name:'Culte Naissant',   desc:'Récolter 1 000 âmes',        req:()=>gs.totalSouls>=1000,           bonus:'+10% prod'},
  {id:'a_10k',    icon:'⚰️',name:'Armée des Morts',  desc:'Récolter 10 000 âmes',       req:()=>gs.totalSouls>=10000,          bonus:'Clic ×1.5'},
  {id:'a_100k',   icon:'🔮',name:'Maître Rituel',     desc:'Récolter 100 000 âmes',      req:()=>gs.totalSouls>=100000,         bonus:'+25% prod'},
  {id:'a_1m',     icon:'👑',name:'Seigneur Âmes',     desc:'Récolter 1 M âmes',          req:()=>gs.totalSouls>=1e6,            bonus:'SPS ×2'},
  {id:'a_clicks100',icon:'🗡️',name:'100 Invocations',desc:'Cliquer 100 fois',           req:()=>gs.totalClicks>=100,           bonus:'Clic +2'},
  {id:'a_clicks1k',icon:'⚡',name:'Frappe Incessante',desc:'Cliquer 1000 fois',          req:()=>gs.totalClicks>=1000,          bonus:'Clic ×1.2'},
  {id:'a_combo10', icon:'🔥',name:'Combo Max',        desc:'Atteindre le combo maximum', req:()=>(gs.maxComboReached||0)>=getComboMax(),bonus:'Fenêtre +0.05s'},
  {id:'a_prestige1',icon:'🩸',name:'Premier Pacte',   desc:'Premier prestige',           req:()=>gs.prestigeCount>=1,           bonus:'Prod ×1.3'},
  {id:'a_boss1',   icon:'⚔️',name:'Chasseur',         desc:'Vaincre 1 boss',             req:()=>gs.bossesDefeated>=1,          bonus:'Boss HP -10%'},
  {id:'a_boss5',   icon:'🏆',name:'Tueur de Titans',  desc:'Vaincre 5 boss',             req:()=>gs.bossesDefeated>=5,          bonus:'Boss drop ×2'},
  {id:'a_quest10', icon:'📜',name:'Quêteur',           desc:'Compléter 10 quêtes',        req:()=>gs.questsCompleted>=10,        bonus:'+15% prod'},
  {id:'a_demons50',icon:'👿',name:'Exterminateur',    desc:'Tuer 50 démons',             req:()=>gs.totalDemonsKilled>=50,      bonus:'Démons ×1.5'},
  {id:'a_ascend1', icon:'🌑',name:'Transcendant',     desc:'Première Ascension Abyssale',req:()=>gs.ascensionCount>=1,          bonus:'Tout ×5'},
  {id:'a_relic3',  icon:'💎',name:'Collectionneur',   desc:'Posséder 3 reliques',        req:()=>(gs.relics||[]).length>=3,     bonus:'Reliques +20%'},
];

const QUEST_POOL=[
  {id:'q_souls',icon:'💰',name:"Collecte d'Urgence",gen:(s)=>({target:Math.max(500,s*5),  type:'souls', time:60,reward_mult:3,  desc:'Récoltez '+fmt(Math.max(500,s*5))+' âmes en 60s'})},
  {id:'q_click',icon:'⚔️',name:'Frappe Rituelle',    gen:(s)=>({target:50+Math.floor(s/100),type:'clicks',time:30,reward_mult:2.5,desc:'Cliquez '+(50+Math.floor(s/100))+' fois en 30s'})},
  {id:'q_idle', icon:'⏳',name:'Patience du Liche',  gen:(s)=>({target:Math.max(300,s*2), type:'idle_sps',time:45,reward_mult:4, desc:'Accumulez '+fmt(Math.max(300,s*2))+' âmes passives en 45s'})},
  {id:'q_combo',icon:'🔥',name:'Frénésie Maudite',   gen:(s)=>({target:5,                 type:'combo', time:20,reward_mult:3.5,desc:'Maintenir combo LV3+ pendant 5s'})},
];

const EVENTS_POOL=[
  {id:'eclipse', name:'ÉCLIPSE DE SANG',       sub:'Le soleil saigne sur le monde',        duration:40,spsM:2,  clickM:.5},
  {id:'invasion',name:'INVASION DÉMONIAQUE',   sub:"Des légions surgissent de l'Au-delà",  duration:40,spsM:.3, clickM:3},
  {id:'harvest', name:'MOISSON DES ÂMES',      sub:"L'énergie des ténèbres se concentre",  duration:28,spsM:4,  clickM:2},
  {id:'storm',   name:"TEMPÊTE DE L'OUBLI",    sub:'Le néant dévore tout sur son passage',  duration:30,spsM:.5, clickM:5},
  {id:'pact',    name:'PACTE DÉMONIAQUE',       sub:'Un démon vous propose son aide…',      duration:25,spsM:6,  clickM:1},
  {id:'titan',   name:'RÉSURRECTION DU TITAN', sub:"Un Titan Primordial s'éveille",         duration:35,spsM:3,  clickM:3},
];

const BOSS_POOL=[
  {id:'b_lich',  name:'Archonte Liche',    icon:'💀',hpBase:500,   reward:'prod ×3 (60s)',  spsBonus:3,  bonusDur:60},
  {id:'b_demon', name:'Seigneur Démon',    icon:'👿',hpBase:1200,  reward:'clics ×5 (30s)', clickBonus:5,bonusDur:30},
  {id:'b_void',  name:'Dévoreur du Néant', icon:'🕳️',hpBase:3000,  reward:'prod ×6 (45s)',  spsBonus:6,  bonusDur:45},
  {id:'b_titan', name:'Titan Primordial',  icon:'👁️',hpBase:8000,  reward:'tout ×4 (30s)',  spsBonus:4,  clickBonus:4,bonusDur:30},
  {id:'b_abyss', name:'Abyssal Éternel',   icon:'🌑',hpBase:25000, reward:'prod ×10 (60s)', spsBonus:10, bonusDur:60},
];

const MILESTONES_DATA=[
  {souls:1000,    name:"L'Éveil",           tier:1,color:'#e8c880'},
  {souls:10000,   name:'Porte des Ombres',  tier:2,color:'#e8a860'},
  {souls:100000,  name:'Sang & Pierre',     tier:2,color:'#e09040'},
  {souls:500000,  name:'Communion Noire',   tier:3,color:'#e05050',boss:'b_lich'},
  {souls:1000000, name:'Seigneur des Âmes', tier:3,color:'#c04040'},
  {souls:10000000,name:'Archonte Maudit',   tier:4,color:'#b060ff',boss:'b_demon'},
  {souls:100000000,name:'Titan des Ténèbres',tier:4,color:'#8040ff',boss:'b_void'},
  {souls:1e9,     name:'Néant Incarné',     tier:5,color:'#ffffff', boss:'b_titan'},
  {souls:1e12,    name:'LE VIDE ABSOLU',    tier:5,color:'#ffffff', boss:'b_abyss'},
];

// ══════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════
const DS=()=>({
  souls:0,totalSouls:0,sps:0,clickPower:1,
  owned:{},upRank:{},prestigeRank:{},skillRank:{},
  prestigeCount:0,bloodPoints:0,totalBP:0,autoCps:0,
  ascensionCount:0,voidEssence:0,totalVE:0,
  relics:[],activeRelicEffects:{},
  spsMultBuff:1,clickMultBuff:1,buffTimer:0,
  activeEvent:null,eventTimer:0,
  vfxFlags:{},
  milestonesReached:new Set(),
  currentTier:0,
  comboVal:0,comboTimer:0,maxComboReached:0,
  _comboClickStreak:0,_lastClickTime:0,
  resonanceTimer:0,resonanceActive:false,
  activeBoss:null,bossHp:0,bossMaxHp:0,bossesDefeated:0,
  activeQuest:null,questProgress:0,questTimer:0,questsCompleted:0,
  questClicksThisTick:0,
  invasionDemonsMax:20,invasionDemonsLeft:0,invasionKills:0,
  unlockedAch:new Set(),
  totalClicks:0,totalPurchases:0,totalDemonsKilled:0,
  playTime:0,sessionStart:Date.now(),
  lichSkullBonus:0,
  _nextEvent:45+Math.random()*60,
  _nextDC:25+Math.random()*45,
  _skillPoints:0,
  _orbSkinOverride:null,
});

let gs=DS();
[...BUILDINGS,...UPGRADES,...PRESTIGE_UPS].forEach(x=>{
  gs.owned[x.id]=0; gs.upRank[x.id]=0; gs.prestigeRank[x.id]=0;
});
Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>gs.skillRank[n.id]=0));

// ══════════════════════════════════════════════════════════
//  SAVE / LOAD
// ══════════════════════════════════════════════════════════
const SK='soul_harvest_v5';

function toSave(){
  return JSON.stringify({v:5,
    souls:gs.souls,totalSouls:gs.totalSouls,
    owned:gs.owned,upRank:gs.upRank,prestigeRank:gs.prestigeRank,skillRank:gs.skillRank,
    _skillPoints:gs._skillPoints||0,
    prestigeCount:gs.prestigeCount,bloodPoints:gs.bloodPoints,totalBP:gs.totalBP,
    ascensionCount:gs.ascensionCount,voidEssence:gs.voidEssence,totalVE:gs.totalVE,
    relics:gs.relics,
    milestonesReached:Array.from(gs.milestonesReached||[]),
    currentTier:gs.currentTier||0,
    invasionDemonsMax:gs.invasionDemonsMax||20,
    totalClicks:gs.totalClicks||0,totalPurchases:gs.totalPurchases||0,
    totalDemonsKilled:gs.totalDemonsKilled||0,
    playTime:(gs.playTime||0)+((Date.now()-gs.sessionStart)/1000),
    bossesDefeated:gs.bossesDefeated||0,questsCompleted:gs.questsCompleted||0,
    unlockedAch:Array.from(gs.unlockedAch||[]),
    maxComboReached:gs.maxComboReached||0,
    lichSkullBonus:gs.lichSkullBonus||0,
    orbSkinOverride:gs._orbSkinOverride||null,
  });
}

function fromSave(raw){
  const d=JSON.parse(raw);
  const s=DS();
  BUILDINGS.forEach(b=>s.owned[b.id]=0);
  UPGRADES.forEach(u=>s.upRank[u.id]=0);
  PRESTIGE_UPS.forEach(u=>s.prestigeRank[u.id]=0);
  Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>s.skillRank[n.id]=0));
  s.souls=d.souls||0; s.totalSouls=d.totalSouls||0;
  Object.assign(s.owned,d.owned||{});
  Object.assign(s.upRank,d.upRank||{});
  Object.assign(s.prestigeRank,d.prestigeRank||{});
  Object.assign(s.skillRank,d.skillRank||{});
  s._skillPoints=d._skillPoints||0;
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
  s._orbSkinOverride=d.orbSkinOverride||null;
  return s;
}

function saveGame(silent=false){
  try{
    localStorage.setItem(SK,toSave());
    if(!silent){
      const i=document.getElementById('save-indicator');
      if(i){i.textContent='✓ Sauvegardé';i.classList.add('saving');setTimeout(()=>{i.textContent='';i.classList.remove('saving');},1800);}
    }
  }catch(e){console.error('Save error:',e);}
}

function loadGame(){
  try{
    const raw=localStorage.getItem(SK);
    if(!raw){showToast('Aucune sauvegarde','red');return false;}
    gs=fromSave(raw);
    recalcAll(); restoreVfx(); updateOrbTier();
    fullRender();
    showToast('📂 Partie chargée','green');
    addLog('La mémoire des ténèbres revient…','ev-green');
    return true;
  }catch(e){
    showToast('Erreur de chargement','red');
    console.error('Load error:',e);
    return false;
  }
}

window.manualSave=function(){ saveGame(false); sfx.buy(); };
window.confirmReset=function(){
  if(confirm('⚠ Effacer toute la progression ?')){
    localStorage.removeItem(SK);
    gs=DS();
    BUILDINGS.forEach(b=>gs.owned[b.id]=0);
    UPGRADES.forEach(u=>gs.upRank[u.id]=0);
    PRESTIGE_UPS.forEach(u=>gs.prestigeRank[u.id]=0);
    Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>gs.skillRank[n.id]=0));
    cleanVfx(); recalcAll(); updateOrbTier(); fullRender();
    showToast('Reset effectué','red');
  }
};

// ══════════════════════════════════════════════════════════
//  CALC CACHE
// ══════════════════════════════════════════════════════════
let _cache={sps:0,click:1,auto:0,dirty:true};
function markDirty(){_cache.dirty=true; _costDirty=true;}

function recalcAll(){
  let cp=1;
  UPGRADES.filter(u=>u.type==='click').forEach(u=>{cp+=(u.add||0)*(gs.upRank[u.id]||0);});
  UPGRADES.filter(u=>u.type==='click_mult').forEach(u=>{cp*=Math.pow(u.mult,gs.upRank[u.id]||0);});
  PRESTIGE_UPS.filter(u=>u.type==='click_pmult').forEach(u=>{cp*=Math.pow(u.mult,gs.prestigeRank[u.id]||0);});
  Object.values(SKILL_TREE).forEach(b=>b.nodes.filter(n=>n.effect==='click_add').forEach(n=>{cp+=(n.add||0)*(gs.skillRank[n.id]||0);}));
  if(gs.resonanceActive)cp*=3;

  let synFactor=0;
  if((gs.upRank['g3']||0)>0)synFactor=0.01;

  let totalSps=0;
  BUILDINGS.forEach(b=>{
    if(b.prestigeReq&&gs.prestigeCount<b.prestigeReq)return;
    if(b.ascensionReq&&gs.ascensionCount<b.ascensionReq)return;
    let bsps=b.sps*(gs.owned[b.id]||0);
    UPGRADES.filter(u=>u.type==='building'&&u.target===b.id).forEach(u=>{bsps*=Math.pow(u.mult,gs.upRank[u.id]||0);});
    totalSps+=bsps;
  });

  let gm=1;
  UPGRADES.filter(u=>u.type==='global').forEach(u=>{gm*=Math.pow(u.mult,gs.upRank[u.id]||0);});
  PRESTIGE_UPS.filter(u=>u.type==='global_mult').forEach(u=>{gm*=Math.pow(u.mult,gs.prestigeRank[u.id]||0);});
  const mmb=PRESTIGE_UPS.find(u=>u.type==='mech_milestone_boost');
  if(mmb){const r=gs.prestigeRank[mmb.id]||0; if(r>0)gm*=1+(gs.currentTier||0)*r*(mmb.mult||0);}
  Object.values(SKILL_TREE).forEach(b=>b.nodes.filter(n=>n.effect==='global_sps').forEach(n=>{gm*=1+(n.mult||0)*(gs.skillRank[n.id]||0);}));
  gm*=getAchBonus();
  if(gs.lichSkullBonus>0)gm*=(1+Math.min(1,gs.lichSkullBonus));
  totalSps*=gm;

  if(synFactor>0)cp+=totalSps*synFactor;
  Object.values(SKILL_TREE).forEach(b=>b.nodes.filter(n=>n.effect==='sps_to_click').forEach(n=>{cp+=totalSps*(n.mult||0)*(gs.skillRank[n.id]||0);}));

  let autoCps=0;
  UPGRADES.filter(u=>u.type==='auto').forEach(u=>{autoCps+=(u.cps||0)*(gs.upRank[u.id]||0);});
  if(gs.relics.includes('r5'))autoCps+=5;

  _cache.sps=totalSps; _cache.click=Math.max(1,Math.round(cp)); _cache.auto=autoCps; _cache.dirty=false;
  gs.clickPower=_cache.click; gs.sps=_cache.sps; gs.autoCps=_cache.auto;
}

// ── ACHIEVEMENT BONUS ──────────────────────────────────────
const ACH_BONUS_MAP={
  'a_100':1.05,'a_1k':1.1,'a_10k':1.0,'a_100k':1.25,'a_1m':2,
  'a_clicks100':1.0,'a_clicks1k':1.0,'a_prestige1':1.3,
  'a_boss1':1.0,'a_boss5':1.0,'a_quest10':1.15,'a_demons50':1.0,
  'a_ascend1':5,'a_relic3':1.0,
};
function getAchBonus(){
  let m=1;
  (gs.unlockedAch||new Set()).forEach(id=>{if(ACH_BONUS_MAP[id])m*=ACH_BONUS_MAP[id];});
  return m;
}

function getCostReduce(){
  let r=1;
  PRESTIGE_UPS.filter(u=>u.type==='cost_reduce').forEach(u=>r*=Math.pow(u.mult,gs.prestigeRank[u.id]||0));
  if(gs.relics.includes('r4'))r*=0.75;
  return r;
}
function getBuildingCost(b){return Math.ceil(b.base*Math.pow(1.15,gs.owned[b.id]||0)*getCostReduce());}
function getUpgradeCost(u){return Math.ceil(u.cost*Math.pow(3,gs.upRank[u.id]||0));}
function getPrestigeCost(u){const r=gs.prestigeRank[u.id]||0; return Math.ceil(u.cost*Math.pow(r+1,2)*2*(gs.relics.includes('r7')?.5:1));}
function calcBP(){return gs.totalSouls<500000?0:Math.floor(Math.sqrt(gs.totalSouls/50000));}
function calcVE(){return gs.totalBP<10?0:Math.floor(Math.sqrt(gs.totalBP/10));}

function getEffSps(){
  let s=gs.sps;
  if(gs.activeEvent)s*=gs.activeEvent.spsM;
  s*=gs.spsMultBuff;
  if((gs.skillRank['s_p3']||0)>0)s*=1.5;
  if((gs.skillRank['s_c1']||0)>0&&Math.random()<(gs.skillRank['s_c1']||0)*.1)s*=10;
  if(gs.activeEvent&&(gs.skillRank['s_c3']||0)>0)s*=Math.pow(1.5,gs.skillRank['s_c3']);
  return s;
}
function getEffClick(){
  let c=gs.clickPower;
  if(gs.activeEvent)c=Math.round(c*gs.activeEvent.clickM);
  c=Math.round(c*gs.clickMultBuff);
  if((gs.comboVal||0)>=1)c=Math.round(c*getComboMult(gs.comboVal));
  const crit=PRESTIGE_UPS.find(u=>u.type==='mech_crit');
  if(crit){const r=gs.prestigeRank[crit.id]||0;
    if(r>0&&Math.random()<crit.critChance*r){c=Math.round(c*crit.critMult);gs._lastCrit=true;}
    else gs._lastCrit=false;
  } else gs._lastCrit=false;
  if(gs.activeBoss&&gs.relics.includes('r3'))c*=3;
  return Math.max(1,c);
}

// ══════════════════════════════════════════════════════════
//  COMBO v2
// ══════════════════════════════════════════════════════════
function getComboStep(){return Math.max(2,5-Math.floor((gs.skillRank['s_a1']||0)/2));}
function getComboMax(){return 5+(gs.skillRank['s_a2']||0)*3;}
function getComboWindow(){return 0.38+(gs.skillRank['s_a3']||0)*.08+((gs.unlockedAch&&gs.unlockedAch.has('a_combo10'))?0.05:0);}
function getComboMult(level){
  if(level<=0)return 1;
  const base=1+level*0.2;
  const cap=Math.min(3.0,1+(getComboMax()*0.2));
  return Math.min(cap,base);
}

function tickCombo(dt){
  if(gs.comboTimer<=0)return;
  gs.comboTimer=Math.max(0,gs.comboTimer-dt);
  if(gs.comboTimer<=0){
    if((gs.skillRank['s_h4']||0)>0&&gs.comboVal>=3){
      gs.spsMultBuff=Math.max(gs.spsMultBuff,1.8);
      gs.buffTimer=Math.max(gs.buffTimer,10);
      addLog('♾️ Cycle Infini — SPS ×1.8 (10s)','ev-purple');
    }
    resetCombo();
  }
}

function registerClick(){
  const now=performance.now();
  const gap=(now-(gs._lastClickTime||0))/1000;
  gs._lastClickTime=now;
  const win=getComboWindow();
  if(gs.comboVal>0&&gap>win){
    resetCombo();
    gs._comboClickStreak=1;
    gs.comboTimer=win;
    return;
  }
  gs._comboClickStreak=(gs._comboClickStreak||0)+1;
  gs.comboTimer=win;
  const step=getComboStep();
  if(gs._comboClickStreak>=step){
    gs._comboClickStreak=0;
    const newLevel=Math.min(getComboMax(),(gs.comboVal||0)+1);
    if(newLevel>(gs.comboVal||0)){
      gs.comboVal=newLevel;
      tone(330+newLevel*40,'sine',.07,.045);
    }
  }
  if(gs.comboVal>(gs.maxComboReached||0))gs.maxComboReached=gs.comboVal;
}

function resetCombo(){
  if((gs.skillRank['s_a4']||0)>0&&(gs.comboVal||0)>=3){
    gs.clickMultBuff=Math.max(gs.clickMultBuff,5);
    gs.buffTimer=Math.max(gs.buffTimer,1);
    const orb=document.getElementById('main-orb');
    if(orb){orb.classList.remove('surge');void orb.offsetWidth;orb.classList.add('surge');setTimeout(()=>orb.classList.remove('surge'),500);}
  }
  gs.comboVal=0; gs.comboTimer=0; gs._comboClickStreak=0;
}

// ── SCREENSHAKE ─────────────────────────────────────────────
function shake(heavy=false){
  if(localStorage.getItem('sh_shake')==='0')return;
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
  const lb=document.getElementById('log-box');if(!lb)return;
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
  const fl=document.getElementById('floaters');
  if(fl){fl.appendChild(f);setTimeout(()=>f.remove(),1150);}
}
function burstEl(el,cls='just-bought'){
  el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),480);
}
function openOverlay(id){
  if(id==='achievements-overlay')renderAchievements();
  const el=document.getElementById(id);if(el)el.classList.add('open');
}
function closeOverlay(id){const el=document.getElementById(id);if(el)el.classList.remove('open');}
// Expose to HTML onclick attributes
window.openOverlay=openOverlay;
window.openSkillTree=function(){renderSkillTree();openOverlay('skilltree-overlay');};
window.renderStats=renderStats;
window.openSettings=openSettings;
window.loadGame=loadGame;

// ══════════════════════════════════════════════════════════
//  VFX
// ══════════════════════════════════════════════════════════
const activeVfx=new Set();
function updateOrbAura(){
  const aura=document.getElementById('orb-aura');if(!aura)return;
  if(gs.activeEvent){aura.className='';return;}
  const sorted=['void','fire','lightning'].filter(v=>activeVfx.has(v)).slice(0,2);
  aura.className=sorted.map(v=>'vfx-'+v).join(' ');
}
function applyUpgradeVfx(vfx,rank,silent=false){
  if(!vfx||vfx==='none')return;
  switch(vfx){
    case 'fire':activeVfx.add('fire');break;
    case 'lightning':
      activeVfx.add('lightning');
      if(!gs.vfxFlags.lInterval)gs.vfxFlags.lInterval=setInterval(spawnLightning,2800);
      break;
    case 'convergence':
      document.getElementById('convergence-ring')?.classList.add('active');
      buildConvergence();break;
    case 'void':
      activeVfx.add('void');
      document.getElementById('void-cracks')?.classList.add('active');
      buildVoidCracks(rank);break;
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
  if(gs.vfxFlags?.lInterval){clearInterval(gs.vfxFlags.lInterval);gs.vfxFlags.lInterval=null;}
  document.body.classList.remove('eclipse-active','invasion-active');
}
function restoreVfx(){
  UPGRADES.forEach(u=>{const r=gs.upRank[u.id]||0;if(r>0&&u.vfx&&u.vfx!=='none')applyUpgradeVfx(u.vfx,r,true);});
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
  if(_lCount>=4)return;_lCount++;
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
  pCanvas.width=innerWidth;pCanvas.height=innerHeight;
  pCtx=pCanvas.getContext('2d');
  window.addEventListener('resize',()=>{if(pCanvas){pCanvas.width=innerWidth;pCanvas.height=innerHeight;}});
}
function emitBurst(x,y,n,col){
  if(PP.length>150||localStorage.getItem('sh_perf')==='1')return;
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

// ══════════════════════════════════════════════════════════
//  MILESTONES
// ══════════════════════════════════════════════════════════
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
  if(pop){
    pop.style.color=m.color;pop.textContent='✦ '+m.name.toUpperCase()+' ✦';
    pop.classList.remove('show');void pop.offsetWidth;pop.classList.add('show');
    setTimeout(()=>pop.classList.remove('show'),3500);
  }
  showToast('✦ '+m.name+' ✦','milestone');
  addLog('✦ Seuil : '+m.name,'ev-gold');
  const orb=document.getElementById('main-orb');
  if(orb){const r=orb.getBoundingClientRect();emitBurst(r.left+r.width/2,r.top+r.height/2,20,'rgba(200,160,50,.8)');}
  if(gs.relics.includes('r8')){gs.spsMultBuff=Math.max(gs.spsMultBuff,10);gs.buffTimer=Math.max(gs.buffTimer,30);addLog('🌑 Noirceur Absolue — SPS ×10 (30s)','ev-purple');}
  if(m.boss)spawnBoss(m.boss);
  markDirty();
}
function updateOrbTier(){
  const tier=gs.currentTier||0;
  document.body.className=document.body.className.replace(/\btier-\d\b/g,'').trim();
  if(tier>0)document.body.classList.add('tier-'+tier);
  const sc=document.getElementById('soul-count');
  if(sc){sc.className='soul-count';if(tier>0)sc.classList.add('tier-'+tier);}
  updateBgTier();
  updateOrbSkin();
}

// ══════════════════════════════════════════════════════════
//  ORB SKIN
// ══════════════════════════════════════════════════════════
let _activeSkinId='default';
function getActiveSkin(){
  let best=ORB_SKINS[0];
  for(const s of ORB_SKINS){if(gs.totalSouls>=s.unlockSouls)best=s;}
  if(gs._orbSkinOverride){
    const ov=ORB_SKINS.find(s=>s.id===gs._orbSkinOverride);
    if(ov&&gs.totalSouls>=ov.unlockSouls)return ov;
  }
  return best;
}
function applyOrbSkin(skin){
  if(!skin)return;
  _activeSkinId=skin.id;
  const orb=document.getElementById('main-orb');
  if(orb&&!orb.classList.contains('eclipse-orb')&&!orb.classList.contains('invasion-orb')){
    orb.style.background=skin.gradient;
    orb.style.borderColor=skin.border;
  }
  const glyph=document.getElementById('orb-glyph');
  if(glyph)glyph.textContent=skin.glyph;
}
function updateOrbSkin(){
  const skin=getActiveSkin();
  if(skin.id!==_activeSkinId)applyOrbSkin(skin);
}
function updateOrbGlyph(){applyOrbSkin(getActiveSkin());}

// ══════════════════════════════════════════════════════════
//  ANIMATED BACKGROUND
// ══════════════════════════════════════════════════════════
let _prevBgTier=-1;
function updateBgTier(){
  const tier=gs.currentTier||0;
  if(tier===_prevBgTier)return;
  _prevBgTier=tier;
  const bg=BG_TIERS[Math.min(tier,BG_TIERS.length-1)];
  const el=document.getElementById('bg-fx');
  if(el)el.style.background=bg.css;
  if(tier>=4)spawnStarParticles();
}
let _starsSpawned=false;
function spawnStarParticles(){
  if(_starsSpawned)return;_starsSpawned=true;
  const pt=document.getElementById('particles');if(!pt)return;
  for(let i=0;i<15;i++){
    const p=document.createElement('div');p.className='particle';
    const sz=Math.random()*1.5+.5;
    p.style.cssText=`width:${sz}px;height:${sz}px;background:rgba(200,180,255,.7);left:${Math.random()*100}%;animation-duration:${12+Math.random()*20}s;animation-delay:${Math.random()*-25}s;border-radius:50%;`;
    pt.appendChild(p);
  }
}

// ══════════════════════════════════════════════════════════
//  BOSS
// ══════════════════════════════════════════════════════════
function spawnBoss(bossId){
  if(gs.activeBoss)return;
  const def=BOSS_POOL.find(b=>b.id===bossId);if(!def)return;
  let hp=def.hpBase*Math.pow(2,gs.prestigeCount);
  if((gs.skillRank['s_c2']||0)>0)hp*=1-Math.min(.6,(gs.skillRank['s_c2']||0)*.15);
  if(gs.unlockedAch.has('a_boss1'))hp*=.9;
  gs.activeBoss=def;gs.bossHp=Math.ceil(hp);gs.bossMaxHp=Math.ceil(hp);
  sfx.boss();
  const bw=document.getElementById('boss-bar-wrap');
  const bl=document.getElementById('boss-label');
  if(bw)bw.classList.add('show');
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
  const def=gs.activeBoss;if(!def)return;
  sfx.milestone();shake(true);
  gs.bossesDefeated++;
  if(def.spsBonus){gs.spsMultBuff=Math.max(gs.spsMultBuff,def.spsBonus);gs.buffTimer=Math.max(gs.buffTimer,def.bonusDur);}
  if(def.clickBonus){gs.clickMultBuff=Math.max(gs.clickMultBuff,def.clickBonus);gs.buffTimer=Math.max(gs.buffTimer,def.bonusDur);}
  const dropMult=gs.unlockedAch.has('a_boss5')?2:1;
  const bonusSouls=Math.ceil(gs.sps*30*dropMult);
  gs.souls+=bonusSouls;gs.totalSouls+=bonusSouls;
  if(gs.relics.includes('r1'))gs.lichSkullBonus=Math.min(1,gs.lichSkullBonus+.01);
  addLog('⚔ '+def.name+' vaincu ! +'+fmt(bonusSouls)+' âmes','ev-gold');
  showToast('⚔ '+def.name+' vaincu ! '+def.reward,'gold');
  emitBurst(innerWidth/2,innerHeight/2,25,'rgba(220,180,50,.8)');
  gs.activeBoss=null;gs.bossHp=0;gs.bossMaxHp=0;
  document.getElementById('boss-bar-wrap')?.classList.remove('show');
  document.getElementById('main-orb')?.classList.remove('boss-orb');
  checkAchievements();markDirty();
}

// ══════════════════════════════════════════════════════════
//  QUESTS
// ══════════════════════════════════════════════════════════
let _nextQuestIn=30+Math.random()*60;
function trySpawnQuest(){
  if(gs.activeQuest||gs.sps<1)return;
  const def=QUEST_POOL[Math.floor(Math.random()*QUEST_POOL.length)];
  const q=def.gen(gs.sps);
  gs.activeQuest={...def,...q};gs.questProgress=0;gs.questTimer=q.time;gs.questClicksThisTick=0;
  updateQuestBar();
  document.getElementById('quest-bar-wrap')?.classList.add('show');
  addLog('📜 Quête : '+def.name,'ev-gold');
}
function tickQuest(dt){
  if(!gs.activeQuest)return;
  gs.questTimer-=dt;
  if(gs.activeQuest.type==='idle_sps')gs.questProgress+=getEffSps()*dt;
  if(gs.questTimer<=0){failQuest();return;}
  updateQuestBar();
  if(gs.questProgress>=gs.activeQuest.target)completeQuest();
}
function registerQuestClick(){
  if(!gs.activeQuest)return;
  if(gs.activeQuest.type==='clicks')gs.questProgress++;
}
function tickQuestCombo(dt){
  if(!gs.activeQuest||gs.activeQuest.type!=='combo')return;
  if((gs.comboVal||0)>=3)gs.questProgress+=dt; else gs.questProgress=Math.max(0,gs.questProgress-.5*dt);
}
function completeQuest(){
  const q=gs.activeQuest;if(!q)return;
  gs.questsCompleted++;
  const reward=Math.ceil(gs.sps*q.reward_mult*20);
  gs.souls+=reward;gs.totalSouls+=reward;
  sfx.milestone();
  showToast('📜 Quête accomplie ! +'+fmt(reward)+' âmes','gold');
  addLog('📜 '+q.name+' — +'+fmt(reward)+' âmes','ev-gold');
  gs.activeQuest=null;
  document.getElementById('quest-bar-wrap')?.classList.remove('show');
  _nextQuestIn=40+Math.random()*80;
  checkAchievements();markDirty();
}
function failQuest(){
  addLog('📜 Quête échouée…','ev-red');
  gs.activeQuest=null;
  document.getElementById('quest-bar-wrap')?.classList.remove('show');
  _nextQuestIn=30+Math.random()*50;
}
function updateQuestBar(){
  const q=gs.activeQuest;if(!q)return;
  const pct=Math.min(100,(gs.questProgress/q.target)*100);
  const f=document.getElementById('quest-fill');if(f)f.style.width=pct.toFixed(1)+'%';
  const nm=document.getElementById('quest-name');if(nm)nm.textContent=q.icon+' '+q.name+' — '+q.desc;
  const ti=document.getElementById('quest-timer');if(ti)ti.textContent=Math.ceil(gs.questTimer)+'s restantes';
}

// ══════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════
let _demonInterval=null,_eclipseLightLoop=null;
let _pactDialogOpen=false;

function startEvent(ev){
  if(gs.activeEvent)return;
  let dur=ev.duration;
  if((gs.skillRank['s_h3']||0)>0)dur*=.8;
  gs.activeEvent={...ev,duration:dur};gs.eventTimer=dur;
  const bn=document.getElementById('event-banner');
  const bar=document.getElementById('event-timer-bar');
  const fill=document.getElementById('event-timer-fill');
  document.getElementById('eb-main').textContent=ev.name;
  document.getElementById('eb-sub').textContent=ev.sub;
  if(bn)bn.className='show '+ev.id;
  if(bar)bar.className='show';
  if(fill){fill.className=ev.id;fill.style.width='100%';}
  sfx.event();shake();
  const orb=document.getElementById('main-orb');
  if(ev.id==='eclipse'){
    orb?.classList.add('eclipse-orb');document.body.classList.add('eclipse-active');
    document.getElementById('soul-count')?.classList.add('event-red');
    document.getElementById('event-overlay').style.background='rgba(80,10,10,.07)';
    document.body.style.background='#100505';
    document.getElementById('click-hint').textContent='— cherchez les présences cachées —';
    document.getElementById('eclipse-hint')?.classList.add('show');
    gs._eclipseHiddenClicks=0;gs._eclipseNextHidden=3+Math.floor(Math.random()*5);
    gs._nextDC=Math.min(gs._nextDC,6+Math.random()*8);
    _eclipseLightLoop=setInterval(()=>{
      if(!gs.activeEvent||gs.activeEvent.id!=='eclipse'){clearInterval(_eclipseLightLoop);_eclipseLightLoop=null;return;}
      for(let i=0;i<3;i++)setTimeout(spawnLightning,i*90);
    },1600);
    addLog('🩸 Éclipse de Sang — cherchez les bonus cachés !','ev-red');
    showToast('🩸 ÉCLIPSE DE SANG','red');
  } else if(ev.id==='invasion'){
    orb?.classList.add('invasion-orb');document.body.classList.add('invasion-active');
    document.getElementById('soul-count')?.classList.add('event-demon');
    document.getElementById('event-overlay').style.background='rgba(40,10,80,.07)';
    document.body.style.background='#080512';
    document.getElementById('click-hint').textContent='— tuez les démons —';
    const cap=(gs.invasionDemonsMax||20)+((gs.prestigeRank['m4']||0)*10);
    gs.invasionDemonsLeft=cap;gs.invasionKills=0;
    document.getElementById('invasion-bar-wrap')?.classList.add('show');
    updateInvasionBar();startDemonRunes();
    addLog('👿 Invasion — tuez les démons pour des bonus !','ev-purple');
    showToast('👿 INVASION DÉMONIAQUE','purple');
  } else if(ev.id==='pact'){
    document.getElementById('event-overlay').style.background='rgba(60,10,60,.07)';
    document.body.style.background='#0e0512';
    document.getElementById('click-hint').textContent='— maintenez le pacte en cliquant —';
    gs._pactLastClick=Date.now();
    addLog('🔮 Pacte Démoniaque — prod ×'+ev.spsM,'ev-purple');
    showToast('🔮 PACTE DÉMONIAQUE','purple');
  } else if(ev.id==='titan'){
    document.getElementById('event-overlay').style.background='rgba(10,40,10,.07)';
    document.body.style.background='#050c05';
    const bonusSouls=Math.ceil(gs.sps*60);gs.souls+=bonusSouls;gs.totalSouls+=bonusSouls;
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
    if(gs.activeEvent.id==='pact'&&gs._pactLastClick){
      if((Date.now()-gs._pactLastClick)>3500){addLog('🔮 Pacte brisé…','ev-red');endEvent();return;}
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
  const ev=gs.activeEvent;gs.activeEvent=null;gs.eventTimer=0;
  const bn=document.getElementById('event-banner');
  const bar=document.getElementById('event-timer-bar');
  document.getElementById('eb-main').textContent='Événement terminé';
  document.getElementById('eb-sub').textContent=ev?.name||'';
  if(bn)bn.className='show ended';if(bar)bar.className='show';
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
  const c=document.getElementById('invasion-count');if(c)c.textContent=gs.invasionDemonsLeft+' restants — '+gs.invasionKills+' tués';
}

function startDemonRunes(){
  if(_demonInterval)clearInterval(_demonInterval);
  const runes='👿💀🔱⛧👹😈🗡️⚔️'.split('');
  _demonInterval=setInterval(()=>{
    if(!gs.activeEvent||gs.activeEvent.id!=='invasion'){clearInterval(_demonInterval);_demonInterval=null;return;}
    if((gs.invasionDemonsLeft||0)<=0)return;
    if(!_pactDialogOpen&&Math.random()<0.15){showDemonPactDialog();return;}
    const r=document.createElement('div');r.className='demon-rune';
    r.textContent=runes[Math.floor(Math.random()*runes.length)];
    r.style.left=(8+Math.random()*82)+'%';r.style.top=(15+Math.random()*65)+'%';
    const d=2.5+Math.random()*2;r.style.animationDuration=d+'s';
    document.body.appendChild(r);
    r.addEventListener('click',e=>{
      e.stopPropagation();
      if(!gs.activeEvent||gs.activeEvent.id!=='invasion'||(gs.invasionDemonsLeft||0)<=0)return;
      sfx.demon();gs.invasionDemonsLeft--;gs.invasionKills++;gs.totalDemonsKilled++;
      if(gs.relics.includes('r1'))gs.lichSkullBonus=Math.min(1,(gs.lichSkullBonus||0)+.005);
      const bonus=Math.max(50,gs.sps*2+gs.clickPower*3);
      gs.souls+=bonus;gs.totalSouls+=bonus;
      spawnFloater(e.clientX,e.clientY,'+'+fmt(bonus)+'👿','demon');
      const burst=document.createElement('div');burst.className='demon-burst';
      burst.style.left=e.clientX+'px';burst.style.top=e.clientY+'px';
      document.body.appendChild(burst);setTimeout(()=>burst.remove(),520);
      r.classList.add('hit');
      setTimeout(()=>r.remove(),220);
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
    gs._eclipseHiddenClicks=0;gs._eclipseNextHidden=3+Math.floor(Math.random()*6);
    const hasMech=(gs.prestigeRank['m3']||0)>0;
    if(hasMech){spawnDC(true);}
    else{const b=Math.max(200,gs.sps*10);gs.souls+=b;gs.totalSouls+=b;spawnFloater(x,y,'☽ +'+fmt(b),'big');}
  }
}
function handlePactClick(){if(gs.activeEvent?.id==='pact')gs._pactLastClick=Date.now();}

// ══════════════════════════════════════════════════════════
//  DARK COOKIES
// ══════════════════════════════════════════════════════════
const DC_POOL=[
  {type:'bonus',icon:'☽', name:'Faveur Lunaire',  effect:'sps_mult',  value:3,  duration:30,cls:'type-bonus',lblcls:'bonus'},
  {type:'bonus',icon:'💎', name:"Pierre d'Âme",    effect:'souls_flat',value_fn:()=>Math.max(100,gs.sps*20),duration:0,cls:'type-bonus',lblcls:'bonus'},
  {type:'bonus',icon:'⚔️', name:'Frappe Maudite',  effect:'click_mult',value:5,  duration:20,cls:'type-bonus',lblcls:'bonus'},
  {type:'bonus',icon:'🌟', name:'Éclat Céleste',   effect:'sps_mult',  value:5,  duration:15,cls:'type-bonus',lblcls:'bonus'},
  {type:'bonus',icon:'🩸', name:'Pluie de Sang',   effect:'souls_flat',value_fn:()=>Math.max(500,gs.sps*60),duration:0,cls:'type-bonus',lblcls:'bonus'},
  {type:'malus',icon:'💀', name:'Malédiction',     effect:'sps_mult',  value:.1, duration:20,cls:'type-malus',lblcls:'malus'},
  {type:'malus',icon:'🕷️', name:'Poison',           effect:'click_mult',value:.2, duration:25,cls:'type-malus',lblcls:'malus'},
  {type:'malus',icon:'🌑', name:'Nuit Sans Fin',   effect:'sps_mult',  value:0,  duration:15,cls:'type-malus',lblcls:'malus'},
  {type:'event',icon:'🌀', name:'Vortex Temporel', effect:'sps_mult',  value:10, duration:12,cls:'type-event',lblcls:'event'},
  {type:'event',icon:'🔮', name:'Vision',          effect:'souls_flat',value_fn:()=>Math.max(1000,gs.totalSouls*.05),duration:0,cls:'type-event',lblcls:'event'},
];
let dcActive=null,_dcTimeout=null;
function tickDC(dt){
  if(dcActive)return;
  gs._nextDC-=dt;
  if(gs._nextDC<=0)spawnDC();
}
function spawnDC(forceBonus=false){
  if(dcActive)return;
  let def=forceBonus
    ? DC_POOL.filter(d=>d.type==='bonus')[Math.floor(Math.random()*5)]
    : DC_POOL[Math.floor(Math.random()*DC_POOL.length)];
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
  if(gs.relics.includes('r6')&&gs.activeEvent&&!forceBonus)setTimeout(()=>spawnDC(true),2000);
}
function collectDC(def,x,y){
  if(!dcActive)return;sfx.dc();
  const el=document.getElementById('dark-cookie');
  if(el){el.classList.add('vanish');setTimeout(()=>removeDC(true),280);}else removeDC(true);
  const eclBoost=(gs.prestigeRank['m3']||0)>0&&gs.activeEvent?.id==='eclipse'?2:1;
  if(def.effect==='sps_mult'){
    const v=def.value*eclBoost;gs.spsMultBuff=v;gs.clickMultBuff=1;gs.buffTimer=def.duration;
    spawnFloater(x,y,'×'+v+' prod',def.type==='malus'?'red big':'big');
    showToast(def.icon+' '+def.name+' ×'+v,def.type==='malus'?'red':def.type==='event'?'purple':'gold');
    addLog(def.icon+' '+def.name+' — prod ×'+v,def.type==='malus'?'ev-red':def.type==='event'?'ev-purple':'ev-gold');
  } else if(def.effect==='click_mult'){
    gs.clickMultBuff=def.value;gs.spsMultBuff=1;gs.buffTimer=def.duration;
    spawnFloater(x,y,'×'+def.value+' clic',def.type==='malus'?'red big':'big');
    showToast(def.icon+' '+def.name+' clics ×'+def.value,def.type==='malus'?'red':'gold');
    addLog(def.icon+' '+def.name+' — clics ×'+def.value,def.type==='malus'?'ev-red':'ev-gold');
    markDirty();
  } else if(def.effect==='souls_flat'){
    const v=(def.value_fn?def.value_fn():def.value)*eclBoost;
    gs.souls+=v;gs.totalSouls+=v;
    spawnFloater(x,y,'+'+fmt(v),'big');
    showToast(def.icon+' +'+fmt(v)+' âmes','gold');
    addLog(def.icon+' '+def.name+' +'+fmt(v)+' âmes','ev-gold');
  }
}
function removeDC(collected=false){
  clearTimeout(_dcTimeout);dcActive=null;
  document.getElementById('dark-cookie')?.remove();
  document.getElementById('dc-lbl')?.remove();
  if(!collected)addLog("Une présence s'évanouit…");
  const base=collected?32:18,eclipse=gs.activeEvent?.id==='eclipse'?.4:1;
  gs._nextDC=(base+Math.random()*38)*eclipse;
}

// ── BUFF / RESONANCE ────────────────────────────────────────
function tickBuffs(dt){
  if(gs.buffTimer>0){gs.buffTimer-=dt;if(gs.buffTimer<=0){gs.buffTimer=0;gs.spsMultBuff=1;gs.clickMultBuff=1;}}
}
function tickResonance(dt){
  if(gs.resonanceActive){gs.resonanceTimer-=dt;if(gs.resonanceTimer<=0){gs.resonanceActive=false;gs.resonanceTimer=0;addLog('Résonance estompée…');markDirty();}}
}
function triggerResonance(){
  if((gs.prestigeRank['m2']||0)>0){
    gs.resonanceActive=true;gs.resonanceTimer=5;
    document.getElementById('main-orb')?.classList.add('surge');
    setTimeout(()=>document.getElementById('main-orb')?.classList.remove('surge'),600);
    addLog('🔄 Résonance — clics ×3 (5s)','ev-purple');markDirty();
  }
}

// ── ACHIEVEMENTS ────────────────────────────────────────────
function checkAchievements(){
  let gained=false;
  ACHIEVEMENTS.forEach(a=>{
    if(gs.unlockedAch.has(a.id))return;
    if(a.req()){
      gs.unlockedAch.add(a.id);gained=true;
      showToast('⚔ Trophée : '+a.name,'gold');
      addLog('⚔ Trophée débloqué : '+a.name,'ev-gold');
      sfx.milestone();markDirty();
    }
  });
  return gained;
}

// ══════════════════════════════════════════════════════════
//  DEMON PACT DIALOG
// ══════════════════════════════════════════════════════════
function showDemonPactDialog(){
  if(_pactDialogOpen)return;
  const pact=DEMON_PACTS[Math.floor(Math.random()*DEMON_PACTS.length)];
  _pactDialogOpen=true;
  const overlay=document.createElement('div');overlay.id='pact-dialog';
  overlay.style.cssText='position:fixed;inset:0;z-index:250;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML=`<div style="background:linear-gradient(160deg,#120820,#200808);border:1px solid rgba(160,60,160,.4);border-radius:8px;padding:28px 30px;max-width:380px;width:90%;text-align:center;font-family:'Crimson Text',serif;">
    <div style="font-size:40px;margin-bottom:10px;">${pact.icon}</div>
    <div style="font-family:'Cinzel',serif;font-size:16px;font-weight:700;color:#d080c0;letter-spacing:2px;margin-bottom:6px;">${pact.name}</div>
    <div style="font-size:13px;color:rgba(220,180,220,.7);font-style:italic;margin-bottom:20px;line-height:1.6;">"${pact.offer}"</div>
    <div style="display:flex;gap:10px;">
      <button id="pact-accept" style="flex:1;padding:11px;background:rgba(120,20,120,.4);border:1px solid rgba(180,50,180,.5);border-radius:4px;color:#d080c0;font-family:'Cinzel',serif;font-size:11px;letter-spacing:1px;cursor:pointer;">${pact.acceptLabel}</button>
      <button id="pact-refuse" style="flex:1;padding:11px;background:rgba(40,10,40,.3);border:1px solid rgba(120,60,120,.3);border-radius:4px;color:rgba(200,150,200,.6);font-family:'Cinzel',serif;font-size:11px;letter-spacing:1px;cursor:pointer;">${pact.refuseLabel}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#pact-accept').addEventListener('click',()=>{overlay.remove();_pactDialogOpen=false;applyPactAccept(pact);});
  overlay.querySelector('#pact-refuse').addEventListener('click',()=>{overlay.remove();_pactDialogOpen=false;applyPactRefuse(pact);});
}
function applyPactAccept(pact){
  const a=pact.accept;
  if(a.spsBonus){gs.spsMultBuff=a.spsBonus;gs.buffTimer=a.bonusDur;}
  if(a.clickBonus){gs.clickMultBuff=a.clickBonus;gs.buffTimer=a.bonusDur;}
  if(a.soulsFlat){const v=a.soulsFlat();gs.souls+=v;gs.totalSouls+=v;}
  addLog(pact.icon+' Pacte accepté — '+pact.name,'ev-purple');
  showToast(pact.icon+' Pacte scellé !','purple');
  if(a.penalty==='stop30')setTimeout(()=>{gs.spsMultBuff=0;gs.buffTimer=30;setTimeout(()=>{gs.spsMultBuff=1;gs.buffTimer=0;},30000);},a.bonusDur*1000);
  if(a.penalty==='force_malus')gs._forceNextDCMalus=true;
  if(a.penalty==='spawn_boss'){const b=BOSS_POOL[Math.floor(Math.random()*BOSS_POOL.length)];spawnBoss(b.id);}
  if(a.penalty==='lose_buildings'){BUILDINGS.forEach(b=>{gs.owned[b.id]=Math.max(0,Math.floor((gs.owned[b.id]||0)*.9));});markDirty();addLog('💸 Perte de 10% des bâtiments…','ev-red');}
}
function applyPactRefuse(pact){
  const r=pact.refuse;
  if(r.spsBonus){gs.spsMultBuff=r.spsBonus;gs.buffTimer=r.bonusDur;}
  if(r.clickBonus){gs.clickMultBuff=r.clickBonus;gs.buffTimer=r.bonusDur;}
  if(r.soulsFlat){const v=r.soulsFlat();gs.souls+=v;gs.totalSouls+=v;}
  addLog(pact.icon+' '+pact.name+' chassé','ev-gold');
  showToast(pact.icon+' Démon repoussé','gold');
}

// ══════════════════════════════════════════════════════════
//  PRESTIGE / ASCENSION MODALS
// ══════════════════════════════════════════════════════════
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
  PRESTIGE_UPS.forEach(u=>{const r=gs.prestigeRank[u.id]||0;if(r>0){const c=document.createElement('div');c.className='pbuff';c.textContent=u.icon+' '+u.name+' ×'+r;bd.appendChild(c);}});
  const ul=document.getElementById('pm-unlocks');ul.innerHTML='';
  if(gs.prestigeCount===0)ul.innerHTML='<div class="pm-unlock"><span>🌑</span> Gouffre Abyssal débloqué</div><div class="pm-unlock"><span>💥</span> Mécaniques de prestige activées</div>';
  openOverlay('prestige-overlay');
}

function doPrestige(){
  sfx.prestige();shake(true);
  const bp=calcBP();
  const kp=PRESTIGE_UPS.find(u=>u.type==='keep_pct');
  const kS=Math.floor(gs.souls*(kp?(gs.prestigeRank[kp.id]||0)*kp.mult:0));
  const pr={...gs.prestigeRank};
  const sk={...gs.skillRank};
  const skPts=(gs._skillPoints||0)+1;
  const pc=gs.prestigeCount+1;
  const bp2=gs.bloodPoints+bp,tbp=gs.totalBP+bp;
  const prevTier=gs.currentTier,prevM=new Set(gs.milestonesReached);
  const prevStats={
    totalClicks:gs.totalClicks,totalPurchases:gs.totalPurchases,
    totalDemonsKilled:gs.totalDemonsKilled,
    playTime:(gs.playTime||0)+((Date.now()-gs.sessionStart)/1000),
    bossesDefeated:gs.bossesDefeated,questsCompleted:gs.questsCompleted,
    maxComboReached:gs.maxComboReached,lichSkullBonus:gs.lichSkullBonus,
    unlockedAch:new Set(gs.unlockedAch),
    ascensionCount:gs.ascensionCount,voidEssence:gs.voidEssence,totalVE:gs.totalVE,
    relics:[...gs.relics],invasionDemonsMax:gs.invasionDemonsMax,
    _orbSkinOverride:gs._orbSkinOverride||null,
  };
  cleanVfx();
  if(_demonInterval)clearInterval(_demonInterval);
  if(_eclipseLightLoop)clearInterval(_eclipseLightLoop);
  gs=DS();
  BUILDINGS.forEach(b=>gs.owned[b.id]=0);
  UPGRADES.forEach(u=>gs.upRank[u.id]=0);
  PRESTIGE_UPS.forEach(u=>gs.prestigeRank[u.id]=0);
  Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>gs.skillRank[n.id]=0));
  gs.prestigeRank=pr;
  gs.skillRank=sk;
  gs._skillPoints=skPts;
  gs.prestigeCount=pc;gs.bloodPoints=bp2;gs.totalBP=tbp;
  gs.souls=kS;gs.totalSouls=kS;gs.currentTier=prevTier;gs.milestonesReached=prevM;
  Object.assign(gs,prevStats);
  closeOverlay('prestige-overlay');
  showToast('🩸 Pacte scellé ! +'+bp+' pts de sang','red');
  addLog('🩸 Renaissance n°'+pc,'ev-red');
  document.getElementById('event-overlay').style.background='rgba(120,10,10,.2)';
  emitBurst(innerWidth/2,innerHeight/2,28,'rgba(180,30,30,.75)');
  setTimeout(()=>document.getElementById('event-overlay').style.background='transparent',2200);
  recalcAll();updateOrbTier();fullRender();saveGame(true);
}

function openAscensionModal(){
  const ve=calcVE();
  const ownedSet=new Set(gs.relics);
  const available=RELICS.filter(r=>!ownedSet.has(r.id));
  const nextRelic=available.length>0?available[Math.floor(Math.random()*available.length)]:null;
  document.getElementById('asc-stats').innerHTML=`
    <div class="pm-stat"><span class="label">Prestiges effectués</span><span class="val">× ${gs.prestigeCount}</span></div>
    <div class="pm-stat"><span class="label">Points de Sang total</span><span class="val">🩸 ${gs.totalBP}</span></div>
    <div class="pm-stat"><span class="label">Essence du Vide gagnée</span><span class="val">🌑 +${ve}</span></div>
    <div class="pm-stat"><span class="label">Total Essence</span><span class="val">🌑 ${gs.voidEssence+ve}</span></div>
    <div class="pm-stat"><span class="label">Reliques (${gs.relics.length}/${RELICS.length})</span><span class="val">${available.length>0?available.length+' disponibles':'Collection complète !'}</span></div>`;
  const rp=document.getElementById('asc-relic-preview');
  rp.innerHTML='<div class="sec-title" style="margin-top:8px">Relique obtenue (aléatoire)</div>';
  if(nextRelic){
    const ri=document.createElement('div');ri.className='relic-item';
    ri.innerHTML=`<div class="relic-icon">${nextRelic.icon}</div><div><div class="relic-name">${nextRelic.name}</div><div class="relic-desc">${nextRelic.desc}</div></div>`;
    rp.appendChild(ri);
  } else {
    rp.innerHTML+='<div style="font-size:10px;color:rgba(180,140,80,.3);font-style:italic;padding:6px 0;">Toutes les reliques ont été collectées.</div>';
  }
  openOverlay('ascension-overlay');
}

function doAscension(){
  if(gs.prestigeCount<3){showToast('Requiert 3 prestiges minimum','red');return;}
  sfx.ascend();shake(true);
  const ve=calcVE();
  const ownedSet=new Set(gs.relics);
  const available=RELICS.filter(r=>!ownedSet.has(r.id));
  const newRelic=available.length>0?available[Math.floor(Math.random()*available.length)]:null;
  const prevRelics=newRelic?[...gs.relics,newRelic.id]:[...gs.relics];
  const prevAsc=gs.ascensionCount+1;
  const prevVE=gs.voidEssence+ve,prevTVE=gs.totalVE+ve;
  const prevAch=new Set(gs.unlockedAch);
  const prevPT=(gs.playTime||0)+((Date.now()-gs.sessionStart)/1000);
  const sk={...gs.skillRank};
  const skPts=(gs._skillPoints||0)+2;
  cleanVfx();
  if(_demonInterval)clearInterval(_demonInterval);
  if(_eclipseLightLoop)clearInterval(_eclipseLightLoop);
  gs=DS();
  BUILDINGS.forEach(b=>gs.owned[b.id]=0);
  UPGRADES.forEach(u=>gs.upRank[u.id]=0);
  PRESTIGE_UPS.forEach(u=>gs.prestigeRank[u.id]=0);
  Object.values(SKILL_TREE).forEach(b=>b.nodes.forEach(n=>gs.skillRank[n.id]=0));
  gs.ascensionCount=prevAsc;gs.voidEssence=prevVE;gs.totalVE=prevTVE;
  gs.relics=prevRelics;gs.unlockedAch=prevAch;
  gs.playTime=prevPT;gs.sessionStart=Date.now();
  gs.skillRank=sk;gs._skillPoints=skPts;
  closeOverlay('ascension-overlay');
  if(newRelic){showToast('🌑 ASCENSION — Relique : '+newRelic.name,'purple');addLog('🌑 Ascension n°'+prevAsc+' — '+newRelic.name,'ev-purple');}
  else{showToast('🌑 ASCENSION ABYSSALE — Collection complète !','purple');addLog('🌑 Ascension n°'+prevAsc,'ev-purple');}
  document.getElementById('event-overlay').style.background='rgba(50,10,120,.25)';
  emitBurst(innerWidth/2,innerHeight/2,40,'rgba(100,40,200,.75)');
  setTimeout(()=>document.getElementById('event-overlay').style.background='transparent',2800);
  recalcAll();updateOrbTier();fullRender();saveGame(true);checkAchievements();
}

// ══════════════════════════════════════════════════════════
//  SKILL TREE
// ══════════════════════════════════════════════════════════
function openSkillTree(){renderSkillTree();openOverlay('skilltree-overlay');}
function renderSkillTree(){
  const pts=gs._skillPoints||0;
  const sp=document.getElementById('st-pts');if(sp)sp.textContent=pts;
  const bc=document.getElementById('st-branches');if(!bc)return;
  bc.innerHTML='';
  Object.entries(SKILL_TREE).forEach(([key,branch])=>{
    const div=document.createElement('div');div.className='st-branch';
    div.innerHTML=`<div class="st-branch-title" style="color:${branch.color}">${branch.title}</div>`;
    branch.nodes.forEach(n=>{
      const rank=gs.skillRank[n.id]||0;const maxed=rank>=n.maxRank;const canAfford=pts>=n.cost&&!maxed;
      const nd=document.createElement('div');nd.className='st-node'+(maxed?' maxed':'')+((!canAfford&&!maxed)?' locked':'');
      nd.innerHTML=`<span class="st-node-icon">${n.icon}</span><div class="st-node-info"><div class="st-node-name">${n.name}</div><div class="st-node-desc">${n.desc}</div></div><div class="st-node-rank">${maxed?'MAX':rank+'/'+n.maxRank+' ('+n.cost+'pt)'}</div>`;
      if(canAfford)nd.addEventListener('click',()=>{gs.skillRank[n.id]=(gs.skillRank[n.id]||0)+1;gs._skillPoints-=n.cost;sfx.upgrade();markDirty();renderSkillTree();showToast('🌳 '+n.name+' rang '+gs.skillRank[n.id],'gold');});
      div.appendChild(nd);
    });
    bc.appendChild(div);
  });
}

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

// ── STATS ────────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════
function openSettings(){
  let ov=document.getElementById('settings-overlay');
  if(!ov){
    ov=document.createElement('div');ov.id='settings-overlay';
    ov.style.cssText='display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.88);align-items:center;justify-content:center;';
    const C=(k,def)=>(localStorage.getItem(k)||def)==='1';
    ov.innerHTML=`<div style="background:linear-gradient(160deg,#0e0a18,#120810);border:1px solid rgba(140,80,50,.25);border-radius:8px;padding:22px 26px;max-width:420px;width:90%;max-height:88vh;overflow-y:auto;font-family:'Crimson Text',serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid rgba(150,100,50,.18);">
        <h3 style="font-family:'Cinzel',serif;font-size:16px;color:var(--gold);letter-spacing:2px;">⚙ Paramètres</h3>
        <button id="btn-close-settings" style="background:transparent;border:1px solid rgba(150,100,50,.2);border-radius:4px;color:rgba(180,140,80,.5);padding:3px 8px;cursor:pointer;font-family:'Cinzel',serif;font-size:11px;">✕</button>
      </div>
      <div style="margin-bottom:16px;">
        <div style="font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;color:rgba(180,140,80,.32);text-transform:uppercase;padding-bottom:5px;border-bottom:1px solid rgba(150,100,50,.15);margin-bottom:9px;">Son</div>
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(180,140,80,.6);margin-bottom:8px;">Sons activés<input type="checkbox" id="setting-sound" style="width:16px;height:16px;cursor:pointer;" ${C('sh_sound','1')?'checked':''}></label>
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(180,140,80,.6);">Volume<input type="range" id="setting-volume" min="0" max="100" value="${localStorage.getItem('sh_volume')||'60'}" style="width:120px;cursor:pointer;"></label>
      </div>
      <div style="margin-bottom:16px;">
        <div style="font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;color:rgba(180,140,80,.32);text-transform:uppercase;padding-bottom:5px;border-bottom:1px solid rgba(150,100,50,.15);margin-bottom:9px;">Effets visuels</div>
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(180,140,80,.6);margin-bottom:8px;">Particules<input type="checkbox" id="setting-particles" style="width:16px;height:16px;cursor:pointer;" ${C('sh_particles','1')?'checked':''}></label>
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(180,140,80,.6);margin-bottom:8px;">Screenshake<input type="checkbox" id="setting-shake" style="width:16px;height:16px;cursor:pointer;" ${C('sh_shake','1')?'checked':''}></label>
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(180,140,80,.6);">Mode performance<input type="checkbox" id="setting-perf" style="width:16px;height:16px;cursor:pointer;" ${C('sh_perf','0')?'checked':''}></label>
      </div>
      <div style="margin-bottom:16px;">
        <div style="font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;color:rgba(180,140,80,.32);text-transform:uppercase;padding-bottom:5px;border-bottom:1px solid rgba(150,100,50,.15);margin-bottom:9px;">Skin de l'Orbe</div>
        <div id="skin-list"></div>
      </div>
      <div>
        <div style="font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;color:rgba(180,140,80,.32);text-transform:uppercase;padding-bottom:5px;border-bottom:1px solid rgba(150,100,50,.15);margin-bottom:9px;">Crédits</div>
        <div style="font-size:11px;color:rgba(180,140,80,.4);font-style:italic;line-height:1.8;text-align:center;">
          <div style="font-family:'Cinzel',serif;font-size:13px;color:rgba(200,160,80,.6);margin-bottom:4px;">SOUL HARVEST</div>
          Conception & développement<br><span style="color:rgba(200,160,80,.55);">MingoFrs</span><br><br>
          HTML · CSS · JavaScript<br><span style="color:rgba(180,130,60,.35);font-size:10px;">v5.0 — Le Pacte Éternel</span>
        </div>
        <div style="border-top:1px solid rgba(150,100,50,.15);padding-top:10px;margin-top:10px;text-align:center;">
          <div style="font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;color:rgba(180,140,80,.32);text-transform:uppercase;margin-bottom:8px;">Testeur officiel</div>
          <div style="color:rgba(220,180,80,.75);font-family:'Cinzel',serif;font-size:13px;">⚔ Tom</div>
          <div style="font-size:10px;color:rgba(180,140,80,.35);font-style:italic;margin-top:3px;"> — briseur de bugs</div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#btn-close-settings').addEventListener('click',()=>{ov.style.display='none';});
    ov.addEventListener('click',e=>{if(e.target===ov)ov.style.display='none';});
    ov.querySelector('#setting-sound').addEventListener('change',e=>localStorage.setItem('sh_sound',e.target.checked?'1':'0'));
    ov.querySelector('#setting-volume').addEventListener('input',e=>localStorage.setItem('sh_volume',e.target.value));
    ov.querySelector('#setting-particles').addEventListener('change',e=>{localStorage.setItem('sh_particles',e.target.checked?'1':'0');document.getElementById('particles').style.opacity=e.target.checked?'1':'0';});
    ov.querySelector('#setting-shake').addEventListener('change',e=>localStorage.setItem('sh_shake',e.target.checked?'1':'0'));
    ov.querySelector('#setting-perf').addEventListener('change',e=>{localStorage.setItem('sh_perf',e.target.checked?'1':'0');if(e.target.checked){PP.length=0;document.querySelectorAll('.particle').forEach((p,i)=>{if(i>12)p.remove();});}});
  }
  const sl=ov.querySelector('#skin-list');
  sl.innerHTML='';
  ORB_SKINS.forEach(s=>{
    const unlocked=gs.totalSouls>=s.unlockSouls;
    const active=(gs._orbSkinOverride===s.id)||((!gs._orbSkinOverride)&&s.id===getActiveSkin().id);
    const btn=document.createElement('div');
    btn.style.cssText='display:flex;align-items:center;gap:10px;padding:7px 10px;background:rgba(255,255,255,.02);border:1px solid '+(active?'rgba(200,160,50,.5)':'rgba(150,100,50,.12)')+';border-radius:4px;margin-bottom:5px;cursor:'+(unlocked?'pointer':'not-allowed')+';opacity:'+(unlocked?'1':'.4')+';transition:all .15s;';
    btn.innerHTML=`<span style="font-size:20px;">${s.glyph}</span><div style="flex:1;"><div style="font-family:'Cinzel',serif;font-size:10px;color:var(--gold);">${s.name}</div><div style="font-size:9px;color:rgba(180,140,80,.35);font-style:italic;">${unlocked?'Débloqué':'Requiert '+fmt(s.unlockSouls)+' âmes'}</div></div>${active?'<span style="font-size:9px;color:rgba(200,160,50,.6);font-family:Cinzel,serif;">ACTIF</span>':''}`;
    if(unlocked)btn.addEventListener('click',()=>{gs._orbSkinOverride=s.id;applyOrbSkin(s);openSettings();});
    sl.appendChild(btn);
  });
  ov.style.display='flex';
}

// ══════════════════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════════════════
let _el={};
function _cacheEls(){
  ['soul-count','hdr-total','hdr-sps','prestige-count-badge','click-power-display',
   'ml-fill','ml-label','ml-pct','ml-name',
   'combo-display','combo-val','combo-mult','combo-clicks','combo-decay-fill']
  .forEach(id=>{_el[id]=document.getElementById(id);});
}

let _prev={souls:'',sps:'',total:'',prestige:null};
function renderHUD(){
  const sc=fmt(gs.souls);
  if(sc!==_prev.souls){if(_el['soul-count'])_el['soul-count'].textContent=sc;_prev.souls=sc;}
  const tot=fmt(gs.totalSouls)+' âmes';
  if(tot!==_prev.total){if(_el['hdr-total'])_el['hdr-total'].textContent=tot;_prev.total=tot;}
  const effS=getEffSps();
  const spsStr=fmt(effS)+'/s · +'+fmt(getEffectiveClickDisplay())+'/clic'+(gs.spsMultBuff!==1?' (×'+gs.spsMultBuff+')':'');
  if(spsStr!==_prev.sps){if(_el['hdr-sps'])_el['hdr-sps'].textContent=spsStr;_prev.sps=spsStr;}
  if(gs.prestigeCount>0&&gs.prestigeCount!==_prev.prestige){
    if(_el['prestige-count-badge'])_el['prestige-count-badge'].innerHTML=`<span class="prestige-badge">🩸 ×${gs.prestigeCount}</span>`;
    _prev.prestige=gs.prestigeCount;
  }
  const cpd=_el['click-power-display'];
  if(cpd){const txt=gs.resonanceActive?'⚡ RÉSONANCE ×3':'';if(cpd.textContent!==txt)cpd.textContent=txt;}
}
function getEffectiveClickDisplay(){return (gs.comboVal||0)>=1?Math.round(gs.clickPower*getComboMult(gs.comboVal)):gs.clickPower;}

function updateComboDisplay(){
  const el=_el['combo-display']||document.getElementById('combo-display');if(!el)return;
  const level=gs.comboVal||0;
  if(level<1){if(el.classList.contains('show'))el.classList.remove('show','warning','danger');return;}
  if(!el.classList.contains('show'))el.classList.add('show');
  const mult=getComboMult(level);
  const win=getComboWindow();
  const pct=gs.comboTimer>0?Math.min(100,(gs.comboTimer/win)*100):0;
  const streak=gs._comboClickStreak||0;const step=getComboStep();
  const color=level>=getComboMax()?'#ffdd44':level>=3?'#ff9940':'#e06060';
  const v=_el['combo-val'];const m=_el['combo-mult'];const ck=_el['combo-clicks'];const fill=_el['combo-decay-fill'];
  if(v){const t='×'+mult.toFixed(1);if(v.textContent!==t){v.textContent=t;v.style.color=color;}}
  if(m){const t='COMBO LV'+level;if(m.textContent!==t)m.textContent=t;}
  if(ck){const t=streak+'/'+step+' clics';if(ck.textContent!==t)ck.textContent=t;}
  let barColor;
  if(pct>60)barColor='rgba(100,200,80,.8)';
  else if(pct>30)barColor='rgba(220,160,40,.9)';
  else barColor='rgba(220,60,60,.95)';
  if(fill){fill.style.width=pct.toFixed(1)+'%';fill.style.background=barColor;}
  el.classList.toggle('warning',pct<30&&pct>=15);
  el.classList.toggle('danger',pct<15);
}

const _MS_SOULS=MILESTONES_DATA.map(m=>m.souls);
let _prevMsPct=-1;
function renderMilestone(){
  const next=_MS_SOULS.find(m=>m>gs.totalSouls)||_MS_SOULS[_MS_SOULS.length-1];
  const prevIdx=_MS_SOULS.indexOf(next)-1;const prev=prevIdx>=0?_MS_SOULS[prevIdx]:0;
  const pct=Math.min(100,((gs.totalSouls-prev)/(next-prev))*100);
  const pctR=Math.round(pct*10)/10;
  if(pctR===_prevMsPct)return;_prevMsPct=pctR;
  if(_el['ml-fill'])_el['ml-fill'].style.width=pct.toFixed(1)+'%';
  if(_el['ml-label'])_el['ml-label'].textContent='Seuil: '+fmt(next);
  if(_el['ml-pct'])_el['ml-pct'].textContent=pct.toFixed(0)+'%';
  const mdata=MILESTONES_DATA.find(m=>m.souls===next);
  if(_el['ml-name']&&mdata)_el['ml-name'].textContent=mdata.name;
}

function renderBuildings(){
  const list=document.getElementById('tab-gen');if(!list)return;
  if(!list.querySelector('.sec-title')){
    const t=document.createElement('div');t.className='sec-title';t.textContent="Invocateurs d'âmes";list.prepend(t);
  }
  const ex={};list.querySelectorAll('.building[data-id]').forEach(el=>ex[el.dataset.id]=el);
  BUILDINGS.forEach(b=>{
    const locked=(b.prestigeReq&&gs.prestigeCount<b.prestigeReq)||(b.ascensionReq&&gs.ascensionCount<b.ascensionReq);
    const cost=getBuildingCost(b);const canAfford=!locked&&gs.souls>=cost;
    let el=ex[b.id];
    if(!el){
      el=document.createElement('div');el.dataset.id=b.id;list.appendChild(el);
      el.addEventListener('click',()=>buyBuilding(b,el));
    }
    el.className='building'+(canAfford?' can-afford':'')+(locked?' locked':'')+(b.prestigeReq?' prestige-unlocked':'')+(b.ascensionReq?' abyss-unlocked':'');
    el.dataset.id=b.id;
    el.innerHTML=`<div class="b-icon">${b.icon}</div><div class="b-info"><div class="b-name">${b.name}</div><div class="b-desc">${locked?'🔒 Requiert '+(b.prestigeReq?'prestige':'ascension'):b.desc}</div></div><div class="b-right"><span class="b-owned">${gs.owned[b.id]||0}</span><div class="b-cost">${locked?'🔒':fmt(cost)}</div></div>`;
  });
}

function renderUpgrades(){
  const list=document.getElementById('tab-upg');if(!list)return;
  list.innerHTML='';
  const sec=(title,arr)=>{
    if(!arr.length)return;
    const s=document.createElement('div');s.className='sec-title';s.textContent=title;list.appendChild(s);
    const g=document.createElement('div');g.className='up-grid';arr.forEach(u=>g.appendChild(makeUpEl(u,false)));list.appendChild(g);
  };
  sec('Pouvoir du Clic',UPGRADES.filter(u=>['click','click_mult','synergy'].includes(u.type)));
  sec('Rituels des Bâtiments',UPGRADES.filter(u=>u.type==='building'));
  sec('Malédictions Globales',UPGRADES.filter(u=>u.type==='global'));
  sec('Automatisation',UPGRADES.filter(u=>u.type==='auto'));
}

function makeUpEl(u,isP){
  const rank=isP?(gs.prestigeRank[u.id]||0):(gs.upRank[u.id]||0);
  const maxed=rank>=u.maxRank;
  const unlocked=isP?true:u.req();
  const cost=isP?getPrestigeCost(u):getUpgradeCost(u);
  const isMech=isP&&(u.type||'').startsWith('mech_');
  const el=document.createElement('div');
  el.className='upgrade'+(isP?' up-blood':'')+(isMech?' up-prestige-mechanic':'')+(!unlocked?' locked':'')+(maxed?' maxed':'');
  el.innerHTML=`<div class="up-head"><span class="up-icon">${u.icon}</span><span class="up-name">${u.name}</span></div><div class="up-desc">${u.desc}</div><div class="up-footer"><span class="up-cost">${maxed?'MAX':((isP?'🩸 ':'')+fmt(cost))}</span><span class="up-rank ${maxed?'full':''}">${rank}/${u.maxRank}</span></div>`;
  if(unlocked&&!maxed)el.addEventListener('click',()=>isP?buyPrestigeUp(u,el):buyUpgrade(u,el));
  return el;
}

function renderPrestigeTab(){
  const tab=document.getElementById('tab-blood');if(!tab)return;
  tab.innerHTML='';
  const bp=calcBP(),req=500000;
  const ib=document.createElement('div');ib.className='prestige-info-box';
  ib.innerHTML=`<div class="pi-row"><span>Points de Sang</span><span class="pi-val">🩸 ${gs.bloodPoints}</span></div><div class="pi-row"><span>Prochains</span><span class="pi-val">🩸 +${bp}</span></div><div class="pi-row"><span>Prestiges</span><span class="pi-val">× ${gs.prestigeCount}</span></div><div class="pi-row"><span>Points compétence</span><span class="pi-val">⭐ ${gs._skillPoints||0}</span></div>`;
  tab.appendChild(ib);
  if(gs.totalSouls<req){const r=document.createElement('div');r.className='prestige-req';r.textContent='Requiert '+fmt(req)+' âmes ('+fmt(gs.totalSouls)+' / '+fmt(req)+')';tab.appendChild(r);}
  const btn=document.createElement('button');btn.className='btn-open-prestige';
  btn.innerHTML=bp>0?'🩸 Pacte de Sang (+'+bp+' pts)':'🩸 Pacte (indisponible)';
  btn.disabled=gs.totalSouls<req||bp<1;
  btn.addEventListener('click',openPrestigeModal);tab.appendChild(btn);
  const t1=document.createElement('div');t1.className='sec-title';t1.textContent='Multiplicateurs';tab.appendChild(t1);
  const g1=document.createElement('div');g1.className='up-grid';PRESTIGE_UPS.filter(u=>!u.type.startsWith('mech_')).forEach(u=>g1.appendChild(makeUpEl(u,true)));tab.appendChild(g1);
  const t2=document.createElement('div');t2.className='sec-title';t2.textContent='Mécaniques Uniques';tab.appendChild(t2);
  const ms=document.createElement('div');ms.className='prestige-mechanic-section';
  const md=document.createElement('div');md.className='pm-mechanic-desc';md.textContent='Ces améliorations transforment le jeu.';ms.appendChild(md);
  const g2=document.createElement('div');g2.className='up-grid';PRESTIGE_UPS.filter(u=>u.type.startsWith('mech_')).forEach(u=>g2.appendChild(makeUpEl(u,true)));ms.appendChild(g2);tab.appendChild(ms);
  if(gs.relics.length>0){
    const t3=document.createElement('div');t3.className='sec-title';t3.textContent='Reliques Actives';tab.appendChild(t3);
    gs.relics.forEach(rid=>{const r=RELICS.find(x=>x.id===rid);if(!r)return;const ri=document.createElement('div');ri.className='relic-item';ri.innerHTML=`<div class="relic-icon">${r.icon}</div><div><div class="relic-name">${r.name}</div><div class="relic-desc">${r.desc}</div></div>`;tab.appendChild(ri);});
  }
}

function renderAbyssTab(){
  const tab=document.getElementById('tab-abyss');if(!tab)return;
  tab.innerHTML='';
  const ve=calcVE();
  const ib=document.createElement('div');ib.className='prestige-info-box abyss-info-box';
  ib.innerHTML=`<div class="pi-row"><span>Essence du Vide</span><span class="pi-val">🌑 ${gs.voidEssence}</span></div><div class="pi-row"><span>Prochaine ascension</span><span class="pi-val">🌑 +${ve}</span></div><div class="pi-row"><span>Ascensions</span><span class="pi-val">× ${gs.ascensionCount}</span></div><div class="pi-row"><span>Reliques</span><span class="pi-val">💎 ${gs.relics.length}/${RELICS.length}</span></div>`;
  tab.appendChild(ib);
  const req=3;
  if(gs.prestigeCount<req){const r=document.createElement('div');r.className='prestige-req';r.textContent='Requiert '+req+' prestiges ('+gs.prestigeCount+'/'+req+')';tab.appendChild(r);}
  const btn=document.createElement('button');btn.className='btn-open-prestige btn-open-asc';
  btn.innerHTML=gs.prestigeCount>=req?'🌑 Ascension Abyssale (+'+ve+' Essence)':'🌑 Ascension indisponible';
  btn.disabled=gs.prestigeCount<req;btn.addEventListener('click',openAscensionModal);tab.appendChild(btn);
  if(gs.relics.length===0){const empty=document.createElement('div');empty.className='prestige-req';empty.textContent="Aucune relique — effectuez votre première Ascension.";tab.appendChild(empty);return;}
  const t=document.createElement('div');t.className='sec-title';t.textContent='Reliques';tab.appendChild(t);
  gs.relics.forEach(rid=>{const r=RELICS.find(x=>x.id===rid);if(!r)return;const ri=document.createElement('div');ri.className='relic-item';ri.innerHTML=`<div class="relic-icon">${r.icon}</div><div><div class="relic-name">${r.name}</div><div class="relic-desc">${r.desc}</div></div>`;tab.appendChild(ri);});
}

function fullRender(){
  renderHUD();renderMilestone();renderBuildings();renderUpgrades();renderPrestigeTab();renderAbyssTab();updateOrbGlyph();
  _prev.prestige=null;
  _rebuildBldMap();_rebuildCostCache();
}

// ══════════════════════════════════════════════════════════
//  BUY ACTIONS
// ══════════════════════════════════════════════════════════
function buyBuilding(b,el){
  if((b.prestigeReq&&gs.prestigeCount<b.prestigeReq)||(b.ascensionReq&&gs.ascensionCount<b.ascensionReq))return;
  const cost=getBuildingCost(b);if(gs.souls<cost)return;
  sfx.buy();gs.souls-=cost;gs.owned[b.id]=(gs.owned[b.id]||0)+1;gs.totalPurchases++;markDirty();
  burstEl(el);
  document.getElementById('main-orb')?.classList.add('surge');setTimeout(()=>document.getElementById('main-orb')?.classList.remove('surge'),580);
  const rect=el.getBoundingClientRect();emitBurst(rect.left+rect.width/2,rect.top,7,'rgba(200,160,50,.75)');
  addLog(b.icon+' '+b.name+' ×'+(gs.owned[b.id]));
  updateOrbGlyph();triggerResonance();renderBuildings();_rebuildBldMap();_costDirty=true;renderPrestigeTab();
}
function buyUpgrade(u,el){
  const rank=gs.upRank[u.id]||0;if(rank>=u.maxRank)return;
  const cost=getUpgradeCost(u);if(gs.souls<cost)return;
  sfx.upgrade();gs.souls-=cost;gs.upRank[u.id]=rank+1;gs.totalPurchases++;markDirty();
  burstEl(el);applyUpgradeVfx(u.vfx,gs.upRank[u.id]);
  const rect=el.getBoundingClientRect();emitBurst(rect.left+rect.width/2,rect.top,10,'rgba(160,80,220,.75)');
  showToast(u.icon+' '+u.name+' rang '+gs.upRank[u.id],'gold');
  addLog(u.icon+' '+u.name+' rang '+gs.upRank[u.id]+'/'+u.maxRank);
  triggerResonance();renderUpgrades();
}
function buyPrestigeUp(u,el){
  const rank=gs.prestigeRank[u.id]||0;if(rank>=u.maxRank)return;
  const cost=getPrestigeCost(u);if(gs.bloodPoints<cost)return;
  sfx.upgrade();gs.bloodPoints-=cost;gs.prestigeRank[u.id]=rank+1;markDirty();
  burstEl(el);
  const rect=el.getBoundingClientRect();emitBurst(rect.left+rect.width/2,rect.top,9,'rgba(200,50,50,.75)');
  showToast('🩸 '+u.name+' rang '+gs.prestigeRank[u.id],'red');
  addLog('🩸 '+u.name+' rang '+gs.prestigeRank[u.id]);renderPrestigeTab();
}

// ══════════════════════════════════════════════════════════
//  GAME LOOP
// ══════════════════════════════════════════════════════════
let _lastNow=performance.now();
let _uiAcc=0,_slowAcc=0,_affordAcc=0;
const UI_INTERVAL=1/15,SLOW_INTERVAL=0.5,AFFORD_INTERVAL=0.2;

let _bldMap={};
function _rebuildBldMap(){_bldMap={};document.querySelectorAll('.building[data-id]').forEach(el=>{_bldMap[el.dataset.id]=el;});}
let _costCache={},_costDirty=true;
function _rebuildCostCache(){_costDirty=false;BUILDINGS.forEach(b=>{_costCache[b.id]=getBuildingCost(b);});}

let _lateGameVfxReduced=false;
function checkLateGameVfx(){
  if(gs.totalSouls>=1e9&&!_lateGameVfxReduced){
    _lateGameVfxReduced=true;
    const pt=document.getElementById('particles');
    if(pt){const kids=[...pt.children];kids.slice(14).forEach(k=>k.remove());}
    document.querySelectorAll('.cring-rune').forEach(r=>{r.style.animationDuration=parseFloat(r.style.animationDuration||'8')*2+'s';});
    PP.length=0;
  }
}

function gameLoop(now){
  const dt=Math.min((now-_lastNow)/1000,.1);_lastNow=now;
  const effSps=getEffSps();
  const gain=(effSps+gs.autoCps*gs.clickPower)*dt;
  if(gain>0){gs.souls+=gain;gs.totalSouls+=gain;}
  if(gs.activeQuest?.type==='souls')gs.questProgress+=gain;
  gs.playTime=(gs.playTime||0)+dt;
  tickEvents(dt);tickBuffs(dt);tickDC(dt);tickCombo(dt);tickResonance(dt);tickQuestCombo(dt);
  if(gs.activeQuest)tickQuest(dt);
  else{_nextQuestIn-=dt;if(_nextQuestIn<=0)trySpawnQuest();}
  if(_cache.dirty)recalcAll();
  tickCanvas(dt);
  _slowAcc+=dt;
  if(_slowAcc>=SLOW_INTERVAL){_slowAcc=0;checkMilestones();checkAchievements();checkLateGameVfx();updateOrbSkin();updateBgTier();}
  _affordAcc+=dt;
  if(_affordAcc>=AFFORD_INTERVAL){
    _affordAcc=0;
    if(_costDirty)_rebuildCostCache();
    for(const id in _bldMap){
      const el=_bldMap[id];const b=BUILDINGS.find(x=>x.id===id);if(!b)continue;
      if((b.prestigeReq&&gs.prestigeCount<b.prestigeReq)||(b.ascensionReq&&gs.ascensionCount<b.ascensionReq))continue;
      const can=gs.souls>=(_costCache[id]||Infinity);
      const was=el.classList.contains('can-afford');
      if(can!==was)el.classList.toggle('can-afford',can);
    }
  }
  _uiAcc+=dt;
  if(_uiAcc>=UI_INTERVAL){_uiAcc=0;renderHUD();renderMilestone();updateComboDisplay();}
  requestAnimationFrame(gameLoop);
}

// ══════════════════════════════════════════════════════════
//  INIT LISTENERS (called once after DOM is visible)
// ══════════════════════════════════════════════════════════
function initListeners(){
  // Prestige
  document.getElementById('btn-cancel-prestige')?.addEventListener('click',()=>closeOverlay('prestige-overlay'));
  document.getElementById('btn-do-prestige')?.addEventListener('click',doPrestige);
  // Ascension
  document.getElementById('btn-cancel-ascension')?.addEventListener('click',()=>closeOverlay('ascension-overlay'));
  document.getElementById('btn-do-ascension')?.addEventListener('click',doAscension);
  // Overlays close buttons
  document.getElementById('btn-close-st')?.addEventListener('click',()=>closeOverlay('skilltree-overlay'));
  document.getElementById('btn-close-ach')?.addEventListener('click',()=>closeOverlay('achievements-overlay'));
  document.getElementById('btn-close-stats')?.addEventListener('click',()=>closeOverlay('stats-overlay'));
  // Overlay background click to close
  ['prestige-overlay','ascension-overlay','achievements-overlay','skilltree-overlay','stats-overlay'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',function(e){if(e.target===this)closeOverlay(id);});
  });
  // Orb click
  document.getElementById('main-orb')?.addEventListener('click',function(e){
    sfx.click();gs.totalClicks++;
    registerClick();registerQuestClick();
    handleEclipseClick(e.clientX,e.clientY);handlePactClick();
    if(gs.activeBoss)damageBoss(Math.max(1,gs.clickPower));
    const gain=getEffClick();
    gs.souls+=gain;gs.totalSouls+=gain;
    if(gs.activeQuest?.type==='souls')gs.questProgress+=gain;
    const isCrit=gs._lastCrit;
    const cls=isCrit?'crit':(gs.activeEvent?.id==='eclipse'?'red':(gs.activeEvent?.id==='invasion'?'purple':''));
    spawnFloater(e.clientX,e.clientY,(isCrit?'💥':'')+'+'+fmt(gain),cls);
    emitBurst(e.clientX,e.clientY,5,gs.activeEvent?.id==='eclipse'?'rgba(200,50,50,.65)':gs.activeEvent?.id==='invasion'?'rgba(120,50,200,.65)':'rgba(200,160,50,.55)');
    this.classList.remove('surge');void this.offsetWidth;this.classList.add('surge');
    setTimeout(()=>this.classList.remove('surge'),480);
  });
  // Tabs
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click',function(){
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active-tab'));
      this.classList.add('active');
      document.getElementById('tab-'+this.dataset.tab)?.classList.add('active-tab');
      if(this.dataset.tab==='blood')renderPrestigeTab();
      if(this.dataset.tab==='abyss')renderAbyssTab();
      if(this.dataset.tab==='upg')renderUpgrades();
    });
  });
}

// ══════════════════════════════════════════════════════════
//  BG PARTICLES
// ══════════════════════════════════════════════════════════
function spawnBgParticles(){
  const colors=['rgba(180,120,50,.45)','rgba(120,50,160,.35)','rgba(80,20,20,.45)','rgba(200,160,80,.25)','rgba(60,20,100,.35)'];
  const pt=document.getElementById('particles');if(!pt)return;
  for(let i=0;i<28;i++){
    const p=document.createElement('div');p.className='particle';
    const sz=Math.random()*2.5+.8;
    p.style.cssText=`width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}%;animation-duration:${8+Math.random()*12}s;animation-delay:${Math.random()*-18}s;`;
    pt.appendChild(p);
  }
}

// ══════════════════════════════════════════════════════════
//  INIT / INTRO
// ══════════════════════════════════════════════════════════
function startGame(load=false){
  const intro=document.getElementById('intro-screen');
  if(intro){intro.classList.add('fade-out');setTimeout(()=>{intro.style.display='none';const gr=document.getElementById('game-root');if(gr)gr.classList.add('visible');},800);}
  initCanvas();
  spawnBgParticles();
  _cacheEls();
  initListeners();
  if(load){
    if(!loadGame()){recalcAll();updateOrbTier();fullRender();}
  } else {
    recalcAll();updateOrbTier();fullRender();
  }
  setInterval(()=>saveGame(true),30000);
  requestAnimationFrame(gameLoop);
}

// Intro buttons — safe to attach at load time since they're outside #game-root
document.addEventListener('DOMContentLoaded',()=>{
  const ib=document.getElementById('intro-btn');
  const ilb=document.getElementById('intro-load-btn');
  if(ib)ib.addEventListener('click',()=>startGame(false));
  if(ilb)ilb.addEventListener('click',()=>startGame(true));
});

// ══════════════════════════════════════════════════════════
//  ADMIN PANEL — accès via Paramètres, protégé par mot de passe
//  Le déverrouillage est purement en mémoire (non sauvegardé).
// ══════════════════════════════════════════════════════════
let _adminUnlocked = false; // reset à chaque session

const _ADMIN_CSS = `
  #admin-panel-overlay {
    display:none;position:fixed;inset:0;z-index:500;
    background:rgba(0,0,0,.92);align-items:center;justify-content:center;
  }
  #admin-panel-overlay.open { display:flex; }
  #admin-panel-box {
    background:linear-gradient(160deg,#0a0318 0%,#130720 50%,#08020f 100%);
    border:1px solid rgba(160,60,220,.5);border-radius:10px;padding:18px;
    width:330px;max-height:88vh;overflow-y:auto;
    box-shadow:0 0 40px rgba(100,20,160,.55),inset 0 1px 0 rgba(200,120,255,.1);
    scrollbar-width:thin;scrollbar-color:rgba(160,80,200,.4) transparent;
  }
  #admin-panel-box .ap-header {
    display:flex;align-items:center;justify-content:space-between;
    margin-bottom:12px;padding-bottom:8px;
    border-bottom:1px solid rgba(160,60,220,.3);
  }
  #admin-panel-box .ap-title {
    font-family:'Cinzel',serif;font-size:14px;color:#c060f0;letter-spacing:2px;
    text-shadow:0 0 10px rgba(160,60,200,.5);
  }
  #admin-panel-box .ap-close {
    background:transparent;border:1px solid rgba(160,60,220,.3);border-radius:4px;
    color:rgba(180,100,240,.6);padding:3px 8px;cursor:pointer;
    font-family:'Cinzel',serif;font-size:11px;
  }
  #admin-panel-box .ap-close:hover { border-color:rgba(200,80,255,.6);color:#d080f0; }
  #admin-panel-box h4 {
    color:#e0a0ff;font-family:'Cinzel',serif;font-size:11px;
    margin:10px 0 6px;letter-spacing:.12em;text-transform:uppercase;
    border-bottom:1px solid rgba(160,60,220,.2);padding-bottom:4px;
  }
  #admin-panel-box h4:first-of-type { margin-top:0; }
  .ap-row { display:flex;gap:5px;margin-bottom:5px;align-items:center;flex-wrap:wrap; }
  .ap-row label { color:rgba(200,150,240,.7);font-size:10px;font-family:'Crimson Text',serif;flex:0 0 auto;min-width:82px; }
  .ap-input {
    flex:1;min-width:0;background:rgba(255,255,255,.05);
    border:1px solid rgba(160,60,220,.3);color:#e0c0ff;font-size:11px;
    padding:4px 6px;border-radius:4px;outline:none;font-family:monospace;
  }
  .ap-input:focus { border-color:rgba(200,80,255,.6); }
  .ap-btn {
    background:linear-gradient(135deg,#220840,#180630);
    border:1px solid rgba(160,60,220,.4);color:#c060f0;font-size:10px;
    padding:4px 9px;border-radius:4px;cursor:pointer;
    font-family:'Cinzel',serif;letter-spacing:.06em;white-space:nowrap;
    transition:all .15s;flex-shrink:0;
  }
  .ap-btn:hover { background:linear-gradient(135deg,#320a50,#260840);border-color:rgba(210,90,255,.6);box-shadow:0 0 10px rgba(150,50,200,.3); }
  .ap-btn.ap-danger { border-color:rgba(200,60,60,.4);color:#f08080; }
  .ap-btn.ap-danger:hover { background:linear-gradient(135deg,#380a0a,#2a0808);border-color:rgba(220,80,80,.6); }
  .ap-btn.ap-green { border-color:rgba(60,200,100,.4);color:#80f0a0; }
  .ap-btn.ap-green:hover { background:linear-gradient(135deg,#0a2418,#081a10); }
  .ap-grid { display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:5px; }
  .ap-select {
    flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(160,60,220,.3);
    color:#e0c0ff;font-size:10px;padding:4px 5px;border-radius:4px;outline:none;cursor:pointer;
  }
  .ap-select option { background:#130720;color:#e0c0ff; }
  .ap-sep { height:1px;background:rgba(160,60,220,.15);margin:8px 0; }
  #ap-status { color:#80f0a0;font-size:9px;font-family:monospace;margin-top:5px;min-height:14px; }
  /* Bouton discret dans les paramètres */
  #btn-open-admin {
    margin-top:14px;padding-top:10px;border-top:1px solid rgba(150,100,50,.15);
    text-align:center;
  }
  #btn-open-admin button {
    background:transparent;border:1px solid rgba(100,60,140,.2);border-radius:4px;
    color:rgba(120,80,160,.35);font-size:9px;font-family:'Cinzel',serif;
    padding:4px 12px;cursor:pointer;letter-spacing:.1em;transition:all .2s;
  }
  #btn-open-admin button:hover { border-color:rgba(160,80,220,.4);color:rgba(180,100,220,.6); }
`;

function _injectAdminStyles(){
  if(document.getElementById('admin-panel-styles'))return;
  const s=document.createElement('style');s.id='admin-panel-styles';s.textContent=_ADMIN_CSS;
  document.head.appendChild(s);
}

function _buildAdminPanel(){
  if(document.getElementById('admin-panel-overlay'))return;
  _injectAdminStyles();
  const ov=document.createElement('div');
  ov.id='admin-panel-overlay';
  ov.innerHTML=`
    <div id="admin-panel-box">
      <div class="ap-header">
        <span class="ap-title">⚙ Admin Panel</span>
        <button class="ap-close" id="ap-close-btn">✕</button>
      </div>

      <h4>💀 Âmes</h4>
      <div class="ap-row">
        <label>Montant</label>
        <input class="ap-input" id="ap-souls-input" type="number" value="1000000" min="0" step="1000">
      </div>
      <div class="ap-grid">
        <button class="ap-btn" id="ap-add-souls">+ Ajouter</button>
        <button class="ap-btn" id="ap-set-souls">= Fixer</button>
        <button class="ap-btn ap-green" id="ap-souls-x10">× 10 actuelles</button>
        <button class="ap-btn ap-danger" id="ap-souls-zero">Vider</button>
      </div>
      <div class="ap-sep"></div>

      <h4>🌳 Points de Compétence</h4>
      <div class="ap-row">
        <label>Quantité</label>
        <input class="ap-input" id="ap-sp-input" type="number" value="10" min="1">
      </div>
      <div class="ap-grid">
        <button class="ap-btn" id="ap-add-sp">+ Ajouter</button>
        <button class="ap-btn" id="ap-set-sp">= Fixer</button>
      </div>
      <div class="ap-sep"></div>

      <h4>🩸 Points de Sang</h4>
      <div class="ap-row">
        <label>Quantité</label>
        <input class="ap-input" id="ap-bp-input" type="number" value="50" min="1">
      </div>
      <div class="ap-grid">
        <button class="ap-btn" id="ap-add-bp">+ Ajouter</button>
        <button class="ap-btn" id="ap-set-bp">= Fixer</button>
      </div>
      <div class="ap-sep"></div>

      <h4>🌑 Essence du Néant</h4>
      <div class="ap-row">
        <label>Quantité</label>
        <input class="ap-input" id="ap-ve-input" type="number" value="10" min="1">
      </div>
      <div class="ap-grid">
        <button class="ap-btn" id="ap-add-ve">+ Ajouter</button>
        <button class="ap-btn" id="ap-set-ve">= Fixer</button>
      </div>
      <div class="ap-sep"></div>

      <h4>⚡ Déclencher un Événement</h4>
      <div class="ap-row">
        <select class="ap-select" id="ap-event-sel">
          <option value="eclipse">🩸 Éclipse de Sang</option>
          <option value="invasion">👿 Invasion Démoniaque</option>
          <option value="harvest">🌾 Moisson des Âmes</option>
          <option value="storm">🌪️ Tempête de l'Oubli</option>
          <option value="pact">🔮 Pacte Démoniaque</option>
          <option value="titan">👁️ Résurrection du Titan</option>
        </select>
        <button class="ap-btn" id="ap-start-event">Lancer</button>
        <button class="ap-btn ap-danger" id="ap-end-event">Stop</button>
      </div>
      <div class="ap-sep"></div>

      <h4>⚔ Invoquer un Boss</h4>
      <div class="ap-row">
        <select class="ap-select" id="ap-boss-sel">
          <option value="b_lich">💀 Archonte Liche</option>
          <option value="b_demon">👿 Seigneur Démon</option>
          <option value="b_void">🕳️ Dévoreur du Néant</option>
          <option value="b_titan">👁️ Titan Primordial</option>
          <option value="b_abyss">🌑 Abyssal Éternel</option>
        </select>
        <button class="ap-btn" id="ap-spawn-boss">Invoquer</button>
        <button class="ap-btn ap-green" id="ap-kill-boss">Tuer</button>
      </div>
      <div class="ap-sep"></div>

      <h4>🏚️ Bâtiments</h4>
      <div class="ap-row">
        <select class="ap-select" id="ap-bld-sel">
          <option value="cultist">🕯️ Cultiste</option>
          <option value="tomb">⚰️ Tombeau</option>
          <option value="altar">🔮 Autel Noir</option>
          <option value="crypt">🏚️ Crypte</option>
          <option value="lich">💀 Liche</option>
          <option value="portal">🌀 Portail</option>
          <option value="void">🕳️ Fragment du Néant</option>
          <option value="titan">👁️ Titan Primordial</option>
          <option value="abyss">🌑 Gouffre Abyssal</option>
          <option value="nexus">🔱 Nexus Abyssal</option>
        </select>
        <input class="ap-input" id="ap-bld-qty" type="number" value="10" min="1" style="max-width:55px">
        <button class="ap-btn" id="ap-add-bld">+ Add</button>
      </div>
      <button class="ap-btn" id="ap-bld-all" style="width:100%;margin-bottom:5px;">⬆ +10 tous les bâtiments</button>
      <div class="ap-sep"></div>

      <h4>✨ Buffs temporaires</h4>
      <div class="ap-grid">
        <button class="ap-btn ap-green" id="ap-buff-sps">SPS ×10 (60s)</button>
        <button class="ap-btn ap-green" id="ap-buff-click">Clic ×10 (60s)</button>
        <button class="ap-btn ap-green" id="ap-godmode">GOD MODE (5min)</button>
        <button class="ap-btn ap-danger" id="ap-buff-off">Stopper buffs</button>
      </div>
      <div class="ap-sep"></div>

      <h4>🌀 Prestige &amp; Ascension</h4>
      <div class="ap-row">
        <label>Prestige #</label>
        <input class="ap-input" id="ap-prestige-input" type="number" value="1" min="0">
        <button class="ap-btn" id="ap-set-prestige">Fixer</button>
      </div>
      <div class="ap-row">
        <label>Ascension #</label>
        <input class="ap-input" id="ap-asc-input" type="number" value="1" min="0">
        <button class="ap-btn" id="ap-set-asc">Fixer</button>
      </div>
      <div class="ap-sep"></div>

      <h4>💾 Sauvegarde</h4>
      <div class="ap-grid">
        <button class="ap-btn ap-green" id="ap-save">Sauvegarder</button>
        <button class="ap-btn ap-danger" id="ap-nuke">RESET TOTAL</button>
      </div>
      <div id="ap-status"></div>
    </div>
  `;
  document.body.appendChild(ov);

  // Fermeture
  document.getElementById('ap-close-btn').addEventListener('click',()=>ov.classList.remove('open'));
  ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open');});

  // Helpers internes
  function apStatus(msg,color='#80f0a0'){
    const el=document.getElementById('ap-status');if(!el)return;
    el.style.color=color;el.textContent=msg;
    clearTimeout(el._t);el._t=setTimeout(()=>{el.textContent='';},2500);
  }
  function apRefresh(){
    if(typeof recalcAll==='function')recalcAll();
    if(typeof fullRender==='function')fullRender();
    if(typeof markDirty==='function')markDirty();
    if(typeof updateOrbTier==='function')updateOrbTier();
  }
  function apNum(id){return parseFloat(document.getElementById(id)?.value)||0;}

  // Âmes
  document.getElementById('ap-add-souls').addEventListener('click',()=>{const v=apNum('ap-souls-input');gs.souls+=v;gs.totalSouls+=v;apRefresh();apStatus('+'+fmt(v)+' âmes');});
  document.getElementById('ap-set-souls').addEventListener('click',()=>{const v=apNum('ap-souls-input');gs.souls=v;gs.totalSouls=Math.max(gs.totalSouls,v);apRefresh();apStatus('Âmes → '+fmt(v));});
  document.getElementById('ap-souls-x10').addEventListener('click',()=>{gs.totalSouls+=gs.souls*9;gs.souls*=10;apRefresh();apStatus('× 10 → '+fmt(gs.souls));});
  document.getElementById('ap-souls-zero').addEventListener('click',()=>{gs.souls=0;apRefresh();apStatus('Âmes vidées','#f08080');});

  // Skill Points
  document.getElementById('ap-add-sp').addEventListener('click',()=>{const v=apNum('ap-sp-input');gs._skillPoints=(gs._skillPoints||0)+v;apRefresh();const el=document.getElementById('st-pts');if(el)el.textContent=gs._skillPoints;apStatus('+'+v+' pts compétence');});
  document.getElementById('ap-set-sp').addEventListener('click',()=>{const v=apNum('ap-sp-input');gs._skillPoints=v;apRefresh();const el=document.getElementById('st-pts');if(el)el.textContent=gs._skillPoints;apStatus('Pts compétence = '+v);});

  // Blood Points
  document.getElementById('ap-add-bp').addEventListener('click',()=>{const v=apNum('ap-bp-input');gs.bloodPoints=(gs.bloodPoints||0)+v;gs.totalBP=(gs.totalBP||0)+v;apRefresh();apStatus('+'+v+' pts de sang');});
  document.getElementById('ap-set-bp').addEventListener('click',()=>{const v=apNum('ap-bp-input');gs.bloodPoints=v;gs.totalBP=Math.max(gs.totalBP||0,v);apRefresh();apStatus('Pts sang = '+v);});

  // Void Essence
  document.getElementById('ap-add-ve').addEventListener('click',()=>{const v=apNum('ap-ve-input');gs.voidEssence=(gs.voidEssence||0)+v;gs.totalVE=(gs.totalVE||0)+v;apRefresh();apStatus('+'+v+' essence');});
  document.getElementById('ap-set-ve').addEventListener('click',()=>{const v=apNum('ap-ve-input');gs.voidEssence=v;gs.totalVE=Math.max(gs.totalVE||0,v);apRefresh();apStatus('Essence = '+v);});

  // Events
  document.getElementById('ap-start-event').addEventListener('click',()=>{
    if(typeof endEvent==='function'&&gs.activeEvent)endEvent();
    const evId=document.getElementById('ap-event-sel').value;
    const evDef=EVENTS_POOL.find(e=>e.id===evId);if(!evDef)return;
    gs.activeEvent=null;if(typeof startEvent==='function')startEvent(evDef);
    apStatus('⚡ '+evDef.name+' lancé !');
  });
  document.getElementById('ap-end-event').addEventListener('click',()=>{if(typeof endEvent==='function'){endEvent();apStatus('Événement stoppé');}});

  // Boss
  document.getElementById('ap-spawn-boss').addEventListener('click',()=>{
    if(gs.activeBoss){apStatus('Boss déjà actif !','#f08080');return;}
    const bId=document.getElementById('ap-boss-sel').value;
    if(typeof spawnBoss==='function'){spawnBoss(bId);apStatus('⚔ Boss invoqué !');}
  });
  document.getElementById('ap-kill-boss').addEventListener('click',()=>{
    if(!gs.activeBoss){apStatus('Pas de boss actif','#f08080');return;}
    if(typeof defeatBoss==='function'){gs.bossHp=0;defeatBoss();apStatus('✓ Boss éliminé');}
  });

  // Bâtiments
  document.getElementById('ap-add-bld').addEventListener('click',()=>{const id=document.getElementById('ap-bld-sel').value;const qty=apNum('ap-bld-qty');gs.owned[id]=(gs.owned[id]||0)+qty;apRefresh();apStatus('+'+qty+' '+id);});
  document.getElementById('ap-bld-all').addEventListener('click',()=>{BUILDINGS.forEach(b=>{gs.owned[b.id]=(gs.owned[b.id]||0)+10;});apRefresh();apStatus('+10 à tous les bâtiments');});

  // Buffs
  document.getElementById('ap-buff-sps').addEventListener('click',()=>{gs.spsMultBuff=Math.max(gs.spsMultBuff||1,10);gs.buffTimer=Math.max(gs.buffTimer||0,60);apRefresh();apStatus('SPS ×10 (60s)');});
  document.getElementById('ap-buff-click').addEventListener('click',()=>{gs.clickMultBuff=Math.max(gs.clickMultBuff||1,10);gs.buffTimer=Math.max(gs.buffTimer||0,60);apRefresh();apStatus('Clic ×10 (60s)');});
  document.getElementById('ap-godmode').addEventListener('click',()=>{gs.spsMultBuff=Math.max(gs.spsMultBuff||1,100);gs.clickMultBuff=Math.max(gs.clickMultBuff||1,100);gs.buffTimer=Math.max(gs.buffTimer||0,300);apRefresh();apStatus('🌟 GOD MODE (5min)','#ffe080');});
  document.getElementById('ap-buff-off').addEventListener('click',()=>{gs.spsMultBuff=1;gs.clickMultBuff=1;gs.buffTimer=0;apRefresh();apStatus('Buffs arrêtés','#f08080');});

  // Prestige / Ascension
  document.getElementById('ap-set-prestige').addEventListener('click',()=>{const v=Math.floor(apNum('ap-prestige-input'));gs.prestigeCount=v;apRefresh();apStatus('Prestige = '+v);});
  document.getElementById('ap-set-asc').addEventListener('click',()=>{const v=Math.floor(apNum('ap-asc-input'));gs.ascensionCount=v;apRefresh();apStatus('Ascension = '+v);});

  // Save / Reset
  document.getElementById('ap-save').addEventListener('click',()=>{if(typeof manualSave==='function'){manualSave();apStatus('💾 Sauvegardé !');}});
  document.getElementById('ap-nuke').addEventListener('click',()=>{if(confirm('⚠ RESET TOTAL — effacer toute la progression ?'))if(typeof confirmReset==='function')confirmReset();});
}

function openAdminPanel(){
  if(!_adminUnlocked){
    const pwd=prompt('🔐 Accès restreint\nMot de passe requis :');
    if(pwd===null)return; // annulé
    if(pwd!=='Tom le male alpha'){
      if(typeof showToast==='function')showToast('⛔ Mot de passe incorrect','red');
      else alert('⛔ Mot de passe incorrect');
      return;
    }
    _adminUnlocked=true;
  }
  // Ferme les paramètres proprement
  const settingsOv=document.getElementById('settings-overlay');
  if(settingsOv)settingsOv.style.display='none';
  // Construit le panel si pas encore fait, puis ouvre
  _buildAdminPanel();
  document.getElementById('admin-panel-overlay').classList.add('open');
}

// Patch openSettings pour injecter le bouton Admin discret
const _origOpenSettings=openSettings;
window.openSettings=function(){
  _origOpenSettings();
  // Injecte le bouton une seule fois
  const settingsOv=document.getElementById('settings-overlay');
  if(!settingsOv||settingsOv.querySelector('#btn-open-admin'))return;
  const wrap=document.createElement('div');
  wrap.id='btn-open-admin';
  wrap.innerHTML='<button id="ap-trigger-btn">⚙</button>';
  settingsOv.querySelector('div').appendChild(wrap);
  document.getElementById('ap-trigger-btn').addEventListener('click',openAdminPanel);
};
window.openAdminPanel=openAdminPanel;