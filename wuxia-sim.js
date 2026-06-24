
"use strict";
/* =====================================================================
   THE WUXIA CHRONICLE — 武侠风云录
   A deterministic, no-player Chinese wuxia simulation.
   Layering: seeded core · per-season controller · DOM runner.
   ===================================================================== */

/* ---------- seeded RNG (mulberry32) ---------- */
function makeRNG(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let rng = makeRNG(Date.now() & 0xffffffff);
const rand = ()=>rng();
const ri = (lo,hi)=>Math.floor(rand()*(hi-lo+1))+lo;
const pick = arr=>arr[Math.floor(rand()*arr.length)];
const chance = p=>rand()<p;
const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const cap = s=>s.charAt(0).toUpperCase()+s.slice(1);

/* ---------- Wuxia name & flavour data ---------- */
const { SURNAMES, GIVEN, TITLE_PRE, TITLE_SUF, SECT_PRE, SECT_SUF, ART_PRE, ART_SUF, REGIONS, WAR_NAMES, ALIGN, REALMS, REALM_ZH, PATH_FLAVOR } = window.WuxiaData;
const APEX = REALMS.length - 1;

/* =====================================================================
   STATE & ENTITIES
   ===================================================================== */
let STATE;
function newId(){ return STATE.idc++; }

function makeName(){
  if(chance(.22)) return pick(SURNAMES)+" "+pick(GIVEN);
  return pick(SURNAMES)+" "+pick(GIVEN);
}
function makeTitle(){
  const p=pick(TITLE_PRE), s=pick(TITLE_SUF);
  return { roman: p[0]+s[0], zh: p[1]+s[1], en: "the "+p[2]+" "+s[2] };
}
function makeSectName(align){
  const p=pick(SECT_PRE);
  let s;
  // demonic houses lean toward 教 (Cult).
  if(align==="demonic") s = chance(.5)? ["jiao","教","Cult"] : pick(SECT_SUF);
  else s = pick(SECT_SUF);
  return { roman:p[0]+s[0], zh:p[1]+s[1], en:p[2]+" "+s[2] };
}
function makeArtName(){
  const p=pick(ART_PRE), s=pick(ART_SUF);
  return { roman:p[0]+" "+s[0], zh:p[1]+s[1], en:p[2]+" "+s[2] };
}

function makeArt(align){
  const nm = makeArtName();
  return {
    id:newId(), kind:"art",
    name:nm.en, zh:nm.zh, roman:nm.roman,
    tier: ri(2,6),
    align,
    corruption: align==="demonic"? ri(35,70) : align==="unorthodox"? ri(15,40) : ri(0,12),
    lost:false, dormant:false,
    holders:0, origin:STATE.year, lostYear:null,
    lostHolder:null
  };
}

function makeFigure(opts={}){
  const align = opts.align || pick(["righteous","righteous","unorthodox","demonic","hermit"]);
  const talent = opts.talent!=null?opts.talent:ri(20,80);
  const f={
    id:newId(), kind:"fig",
    name: opts.name||makeName(),
    title:null,
    align, talent,
    realm: opts.realm!=null?opts.realm:0,
    progress: rand()*40,
    age: opts.age!=null?opts.age:ri(14,22),
    lifespan:0, power:0,
    fame: opts.fame||ri(0,8),
    alignmentDrift: align==="demonic"?ri(40,65):align==="unorthodox"?ri(20,40):ri(0,15),
    sect: opts.sect||null,
    art: opts.art||null,
    master: opts.master||null,
    lineage: opts.lineage||null,
    alive:true, born:STATE.year,
    isThreat:false, namedAt:null,
    grudges:[]
  };
  recomputeLife(f); recomputePower(f);
  return f;
}
function recomputeLife(f){
  let base = 58 + f.realm*22 + Math.floor(f.talent/4);
  if(f.align==="demonic") base -= 18;
  if(f.align==="hermit") base += 30;
  f.lifespan = base;
}
function recomputePower(f){
  let p = f.realm*100 + f.progress + f.talent*1.5;
  if(f.art) p += f.art.tier*30;
  f.power = Math.round(p);
}

function makeSect(opts={}){
  const align = opts.align || pick(["righteous","righteous","righteous","unorthodox","demonic","hermit"]);
  const nm = makeSectName(align);
  return {
    id:newId(), kind:"sect",
    name:nm.en, zh:nm.zh, roman:nm.roman,
    align,
    region: opts.region||pick(REGIONS),
    founded:STATE.year,
    prestige: opts.prestige!=null?opts.prestige:ri(25,55),
    members:[],
    signatureArt:null,
    alive:true, deadYear:null,
    atWarWith:[]
  };
}

/* =====================================================================
   CHRONICLE REFERENCES
   ===================================================================== */
function ref(f){
  if(!f) return "an unknown";
  if(f.title && f.namedAt!=null) return `<span class="nm">${cap(f.title.en)} (${f.title.zh})</span>`;
  return `<span class="nm">${f.name}</span>`;
}
function plainRef(f){ return `<span class="nm">${f.name}</span>`; }
function sref(s){ return s? `<span class="sn">${s.name} (${s.zh})</span>` : "a vanished house"; }
function aref(a){ return a? `<em class="art">${a.name} (${a.zh})</em>` : "a forgotten art"; }

function chron(cls, html, level){
  STATE.log.push({year:STATE.year, season:STATE.season, cls, html, level:level||"normal"});
  STATE.dirtyLog=true;
}

/* =====================================================================
   GENESIS
   ===================================================================== */
function genesis(seed){
  rng = makeRNG(seed>>>0);
  STATE = {
    idc:1, year:1, season:0, seasonNames:["Spring","Summer","Autumn","Winter"],
    figures:[], sects:[], arts:[],
    log:[], dirtyLog:true, dirtyPanels:true,
    activeWars:[], threatActive:false, seed
  };

  const nArt = ri(5,7);
  for(let i=0;i<nArt;i++) STATE.arts.push(makeArt(pick(["righteous","righteous","unorthodox","demonic"])));

  const nSect = ri(5,7);
  for(let i=0;i<nSect;i++){
    const s = makeSect();
    STATE.sects.push(s);
    const cand = STATE.arts.filter(a=>!a.lost && a.align===s.align);
    s.signatureArt = cand.length? pick(cand) : pick(STATE.arts);
    s.signatureArt.holders++;
    for(let j=0;j<ri(3,5);j++){
      const f=makeFigure({align:s.align,sect:s,art:s.signatureArt,realm:ri(2,4),age:ri(28,55)});
      s.members.push(f.id); STATE.figures.push(f);
    }
    const founder=makeFigure({align:s.align,sect:s,art:s.signatureArt,realm:ri(4,6),age:ri(48,70),talent:ri(55,90)});
    maybeName(founder, true);
    s.members.push(founder.id); STATE.figures.push(founder);
    const head = s.align==="demonic"?"Cult Master (教主)": s.align==="righteous"?"Sect Master (掌门人)":"Lord";
    chron("c-found", `${sref(s)} is founded in ${s.region} by ${ref(founder)}, ${head} of the house, who wields ${aref(s.signatureArt)}.`, "major");
  }
  for(let i=0;i<ri(3,6);i++){
    const f=makeFigure({align:pick(["hermit","unorthodox","righteous"]),realm:ri(1,3),age:ri(20,40)});
    STATE.figures.push(f);
  }
  chron("c-peace", `The Jianghu stirs awake. ${STATE.sects.length} great houses stand across the Jianghu, and the rivers and lakes brim with ambition.`, "epic");
}

/* =====================================================================
   HELPERS
   ===================================================================== */
const aliveFigs = ()=>STATE.figures.filter(f=>f.alive);
const aliveSects = ()=>STATE.sects.filter(s=>s.alive);
const figById = id=>STATE.figures.find(f=>f.id===id);

function maybeName(f, force){
  if(f.namedAt!=null) return;
  if(force || (f.realm>=3 && f.fame>=14)){
    f.title = makeTitle();
    f.namedAt = STATE.year;
    chron("c-rise", `${plainRef(f)}${f.sect?" of "+f.sect.name+" ("+f.sect.zh+")":""} has won renown across the land, now spoken of as <span class="nm">${cap(f.title.en)} (${f.title.zh})</span>.`, "major");
  }
}

function alignShift(f, amount, reason){
  const before = f.align;
  f.alignmentDrift = clamp(f.alignmentDrift + amount, 0, 100);
  let na;
  if(f.alignmentDrift>=72) na="demonic";
  else if(f.alignmentDrift>=42) na="unorthodox";
  else if(f.alignmentDrift<=10 && f.align!=="hermit") na="righteous";
  else na=f.align;
  if(na!==before && f.align!=="hermit"){
    f.align=na;
    if(na==="demonic"){
      chron("c-corrupt", `${ref(f)} has fallen to the Demonic Path (魔道)${reason?" — "+reason:""}. The energy about them turns cold and ravenous.`, "major");
    } else if(na==="unorthodox" && before==="righteous"){
      chron("c-corrupt", `${ref(f)} forsakes the righteous canon for unorthodox methods${reason?" after "+reason:""}.`, "normal");
    }
    recomputeLife(f);
  }
}

/* =====================================================================
   TICK SYSTEMS — one season per tick, four ticks per year
   ===================================================================== */
function tick(){
  STATE.season++;
  if(STATE.season>3){ STATE.season=0; STATE.year++; }
  const yearTurn = STATE.season===0;

  sysCultivation();
  sysFame();
  if(yearTurn){
    sysAging();
    sysRecruitment();
    sysArtRefinement();
    sysRivalryAndWar();
    sysCorruptionAndThreat();
    sysLostAndFound();
    sysSectFortune();
    sysHeroicArcs();
  }
  STATE.dirtyPanels=true;
}

function sysCultivation(){
  for(const f of aliveFigs()){
    if(f.realm>=APEX){ f.progress=100; continue; }
    let gain = (f.talent/30) + rand()*4;
    if(f.align==="demonic") gain*=1.25;
    if(f.align==="hermit") gain*=0.8;
    if(f.sect) gain*=1.1;
    f.progress += gain;
    if(f.progress>=100){
      f.progress=0; f.realm++;
      recomputeLife(f); recomputePower(f);
      f.fame += 3 + f.realm;
      const fl=PATH_FLAVOR[f.align];
      if(f.realm>=3){
        const lvl = f.realm>=6?"major":"normal";
        chron("c-break", `${ref(f)} ${fl.verb} the realm of <b style="color:var(--gold)">${REALMS[f.realm]} (${REALM_ZH[f.realm]})</b>, ${pick(fl.via)}.`, lvl);
      }
      maybeName(f);
      if(f.realm===APEX){
        chron("c-break", `Heaven itself takes notice: ${ref(f)} has touched the <b style="color:var(--gold-bright)">Unity of Heaven and Man (天人合一)</b>, the apex no mortal is meant to reach.`, "epic");
      }
    }
  }
}

function sysFame(){
  for(const f of aliveFigs()){
    if(chance(.04)){ f.fame += rand()*2; maybeName(f); }
  }
}

function sysAging(){
  for(const f of aliveFigs()){
    f.age++;
    const over = f.age - f.lifespan;
    let deathP = over>0 ? 0.18 + over*0.05 : (f.age>f.lifespan-10? 0.02:0.004);
    if(f.align==="demonic") deathP+=0.01;
    if(chance(deathP)) killFigure(f, "passes from the world, their inner force returning to heaven and earth");
  }
}

function killFigure(f, why){
  f.alive=false; f.diedYear=STATE.year;
  if(f.sect){ f.sect.members=f.sect.members.filter(id=>id!==f.id); }
  if(f.art) f.art.holders=Math.max(0,f.art.holders-1);
  if(f.namedAt!=null || f.realm>=4){
    const lvl = f.realm>=6? "major":"normal";
    chron("c-death", `${ref(f)}${f.sect?" of "+f.sect.name:""} ${why}. ${f.realm>=6?"An age ends with them.":""}`, lvl);
    if(f.isThreat){
      STATE.threatActive=false;
      chron("c-peace", `With the fall of the Heavenly Demon, the Jianghu exhales. Yet ${aref(f.art)} was never recovered...`, "major");
      if(f.art){ f.art.dormant=true; f.art.lostHolder=f.name; }
    }
  }
}

function sysRecruitment(){
  for(const s of aliveSects()){
    const living = s.members.map(figById).filter(x=>x&&x.alive);
    if(living.length<3){
      for(let i=0;i<ri(1,2);i++){
        const f=makeFigure({align:s.align,sect:s,art:s.signatureArt,realm:0,age:ri(13,18),talent:ri(15,70)});
        s.members.push(f.id); STATE.figures.push(f);
        if(s.signatureArt) s.signatureArt.holders++;
      }
    } else if(chance(.35) && living.length<14){
      const master = pick(living.filter(x=>x.realm>=3)) || pick(living);
      const f=makeFigure({align:s.align,sect:s,art:s.signatureArt,realm:0,age:ri(12,17),talent:ri(15,75),master:master?master.id:null});
      s.members.push(f.id); STATE.figures.push(f);
      if(s.signatureArt) s.signatureArt.holders++;
      if(f.talent>=68){
        chron("c-lineage", `A prodigy named ${plainRef(f)} is taken in by ${sref(s)}; the elders whisper of a rare innate root.`, "normal");
      }
    }
  }
}

function sysArtRefinement(){
  for(const a of STATE.arts){
    if(a.lost||a.dormant) continue;
    const masters = aliveFigs().filter(f=>f.art===a && f.realm>=5);
    if(masters.length && chance(.12) && a.tier<9){
      a.tier++;
      const m=pick(masters);
      const ord=["","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth"][a.tier];
      chron("c-art", `${ref(m)} comprehends a higher layer of ${aref(a)}, refining it to its ${ord} stratum.`, a.tier>=7?"major":"normal");
    }
  }
}

function sysRivalryAndWar(){
  const sects=aliveSects();
  for(const w of [...STATE.activeWars]){
    w.years++;
    const A=STATE.sects.find(s=>s.id===w.a), B=STATE.sects.find(s=>s.id===w.b);
    if(!A||!B||!A.alive||!B.alive){ endWar(w,A,B); continue; }
    const pa=sectMight(A), pb=sectMight(B);
    if(chance(.5)) battle(A,B,pa,pb,w);
    if(w.years>=2 && (chance(.3)||Math.abs(pa-pb)>pa*0.6)){
      const winner=pa>=pb?A:B, loser=pa>=pb?B:A;
      endWar(w,A,B,winner,loser);
    }
  }
  if(sects.length>=2 && STATE.activeWars.length<2 && chance(.22)){
    const a=pick(sects); let b=pick(sects); let g=0; while(b===a&&g++<5) b=pick(sects);
    if(a!==b && !warExists(a,b)){
      const enemyPaths=(a.align==="demonic"&&b.align==="righteous")||(a.align==="righteous"&&b.align==="demonic");
      if(enemyPaths || chance(.4)){
        const wn=pick(WAR_NAMES);
        const w={a:a.id,b:b.id,name:wn[0],zh:wn[1],years:0,start:STATE.year};
        STATE.activeWars.push(w);
        a.atWarWith.push(b.id); b.atWarWith.push(a.id);
        const cause = enemyPaths? "the righteous cannot abide the demonic" :
          pick(["a stolen manual","an assassinated elder","a contested mountain","an old blood-debt","a marriage betrayed","a duel gone wrong"]);
        chron("c-war", `${pick(["Banners rise","War drums sound","Blood is sworn"])}: ${sref(a)} and ${sref(b)} fall into open war — ${w.name} (${w.zh}) — over ${cause}.`, "major");
      }
    }
  }
}
function sectMight(s){ return s.members.map(figById).filter(x=>x&&x.alive).reduce((t,f)=>t+f.power,0)+s.prestige*5; }
function warExists(a,b){ return STATE.activeWars.some(w=>(w.a===a.id&&w.b===b.id)||(w.a===b.id&&w.b===a.id)); }
function topMember(s){ const m=s.members.map(figById).filter(x=>x&&x.alive).sort((a,b)=>b.power-a.power); return m[0]||null; }
function battle(A,B,pa,pb,w){
  const winner=pa>=pb?A:B, loser=pa>=pb?B:A;
  const victims=loser.members.map(figById).filter(x=>x&&x.alive);
  if(victims.length>1 && chance(.6)){
    const v=pick(victims.sort((x,y)=>x.power-y.power).slice(0,Math.ceil(victims.length/2)));
    if(v) killFigure(v, `falls in battle during ${w.name} (${w.zh})`);
  }
  const cA=topMember(winner), cB=topMember(loser);
  if(cA&&cB&&chance(.25)){
    chron("c-duel", `At the height of ${w.name}, ${ref(cA)} crosses blades with ${ref(cB)} — ${pick(["a clash that splits the very air","three hundred exchanges beneath a bleeding moon","steel and inner force until the river ran red"])}.`, "normal");
  }
}
function endWar(w,A,B,winner,loser){
  STATE.activeWars=STATE.activeWars.filter(x=>x!==w);
  if(A) A.atWarWith=A.atWarWith.filter(id=>!B||id!==B.id);
  if(B) B.atWarWith=B.atWarWith.filter(id=>!A||id!==A.id);
  if(winner&&loser){
    winner.prestige += ri(8,18); loser.prestige -= ri(15,30);
    chron("c-war", `${w.name} (${w.zh}) ends. ${sref(winner)} stands victorious; ${sref(loser)} is broken and humbled.`, "major");
    if(loser.prestige<=8 || chance(.4)) dissolveSect(loser, `shattered in ${w.name}`);
  }
}
function dissolveSect(s, why){
  if(!s.alive) return;
  s.alive=false; s.deadYear=STATE.year;
  const surv=s.members.map(figById).filter(x=>x&&x.alive);
  for(const f of surv){ f.sect=null; if(chance(.3)&&f.align==="righteous") f.align="unorthodox"; }
  chron("c-fall", `${sref(s)} is ${why}; its disciples scatter into the Jianghu, its halls left to the crows.`, "major");
  if(s.signatureArt && s.signatureArt.holders<=1 && chance(.5)){
    loseArt(s.signatureArt, `buried in the ruin of ${s.name}`);
  }
}

function sysCorruptionAndThreat(){
  for(const f of aliveFigs()){
    if(f.align!=="hermit"){
      let drift=0;
      if(f.art && f.art.corruption>30) drift += rand()*1.5;
      if(f.grudges.length) drift += rand()*1.2;
      if(STATE.activeWars.length) drift += rand()*0.6;
      if(drift>0) alignShift(f, drift);
    }
    if(!STATE.threatActive && f.align==="demonic" && f.realm>=7 && f.alignmentDrift>=85 && chance(.4)){
      f.isThreat=true; STATE.threatActive=true;
      maybeName(f);
      chron("c-threat", `A shadow falls over all under heaven: ${ref(f)} ascends as the <b style="color:var(--blood)">Heavenly Demon (天魔)</b> and declares the old order finished. ${f.lineage?`Heir to ${f.lineage}, `:""}the Jianghu trembles.`, "epic");
    }
  }
  if(STATE.threatActive){
    const threat = aliveFigs().find(f=>f.isThreat);
    if(threat && chance(.35)){
      const heroes = aliveFigs().filter(f=>f.align!=="demonic" && f.realm>=5 && f!==threat);
      if(heroes.length>=2){
        const champ = heroes.sort((a,b)=>b.power-a.power)[0];
        if(champ.power > threat.power*0.85 && chance(.5)){
          killFigure(threat, `is at last cut down by ${champ.title?cap(champ.title.en):champ.name} and the righteous alliance (武林盟)`);
          champ.fame+=20; maybeName(champ);
          chron("c-rise", `${ref(champ)} is hailed across the Jianghu as the hero who slew the Heavenly Demon.`, "major");
        } else {
          killFigure(champ, `is slain confronting the Heavenly Demon`);
        }
      }
    }
  }
}

function sysLostAndFound(){
  for(const a of STATE.arts){
    if(!a.lost && !a.dormant && a.holders<=0 && chance(.5)){
      loseArt(a, "its last practitioner dead, the manual mislaid");
    }
  }
  const lost = STATE.arts.filter(a=>a.lost||a.dormant);
  if(lost.length && chance(.14)){
    const a=pick(lost);
    const arch=pick([
      {n:"a destitute beggar",t:ri(70,95)},
      {n:"an orphaned woodcutter",t:ri(65,90)},
      {n:"a disgraced servant",t:ri(60,88)},
      {n:"a wandering mute child",t:ri(72,96)},
      {n:"a condemned prisoner",t:ri(60,85)}
    ]);
    const f=makeFigure({align: a.dormant?"demonic":(a.align==="demonic"?"unorthodox":a.align), realm:1, age:ri(15,24), talent:arch.t, art:a});
    a.lost=false; a.dormant=false; a.holders=1;
    if(a.lostHolder) f.lineage = a.lostHolder+"'s legacy";
    STATE.figures.push(f);
    chron("c-found2", `In ${pick(REGIONS)}, ${arch.n} named ${plainRef(f)} stumbles upon ${aref(a)}, lost ${STATE.year-(a.lostYear||a.origin)} years. Fate chooses strangely.`, "major");
    if(a.dormant || a.corruption>50){
      chron("c-corrupt", `The manual is steeped in old malice. Those who hear of it fear what ${plainRef(f)} may become.`, "normal");
    }
  }
}
function loseArt(a, why){
  a.lost=true; a.lostYear=STATE.year; a.holders=0;
  chron("c-lost", `${aref(a)} is lost to time — ${why}.`, "normal");
}

function sysSectFortune(){
  for(const s of aliveSects()){
    s.prestige = clamp(s.prestige + (rand()-0.45)*4, 0, 100);
    if(s.prestige<=4 && chance(.5)) dissolveSect(s, "withered into obscurity, its halls left empty");
  }
  if(aliveSects().length<7 && chance(.16)){
    const wanderers = aliveFigs().filter(f=>!f.sect && f.realm>=5);
    if(wanderers.length){
      const founder=pick(wanderers);
      const s=makeSect({align:founder.align, prestige:ri(30,50)});
      s.signatureArt = founder.art || pick(STATE.arts.filter(a=>!a.lost)) || null;
      founder.sect=s; s.members.push(founder.id);
      STATE.sects.push(s);
      maybeName(founder, true);
      chron("c-found", `From the ashes, ${ref(founder)} establishes ${sref(s)} in ${s.region}. A new power rises where the old fell.`, "major");
    }
  }
}

function sysHeroicArcs(){
  if(chance(.18)){
    const figs=aliveFigs().filter(f=>f.realm>=3);
    if(figs.length>=2){
      const a=pick(figs); let b=pick(figs); let g=0; while(b===a&&g++<4) b=pick(figs);
      if(a!==b){
        const ev=pick([
          ()=>`${ref(a)} and ${ref(b)} swear brotherhood beneath the peach blossoms, vowing to share fortune and ruin alike.`,
          ()=>`A bitter duel: ${ref(a)} defeats ${ref(b)} atop ${pick(["Sword-Testing Cliff","the Frozen Pavilion","Lone Goose Peak","the Drunken Bridge"])}, sparing their life — and earning a lifelong grudge.`,
          ()=>{ a.grudges.push(b.id); return `${ref(b)} betrays ${ref(a)}, stealing a page of their manual under the new moon.`; },
          ()=>`${ref(a)} takes ${ref(b)} as a sworn disciple, passing down hard-won insight.`,
          ()=>`Rumour spreads that ${ref(a)} has fallen in love with ${ref(b)} — a romance the sects forbid.`
        ]);
        chron(pick(["c-duel","c-lineage","c-peace"]), ev(), "normal");
      }
    }
  }
}

/* =====================================================================
   RENDER (runner)
   ===================================================================== */
const $=id=>document.getElementById(id);
let autoScroll=true;

function renderLog(){
  if(!STATE.dirtyLog) return;
  STATE.dirtyLog=false;
  const box=$("chron");
  const atBottom = box.scrollHeight-box.scrollTop-box.clientHeight < 80;
  const frag=document.createDocumentFragment();
  box.innerHTML="";
  const entries=STATE.log.slice(-260);
  let lastYear=null;
  for(const e of entries){
    if(e.year!==lastYear){
      lastYear=e.year;
      const ym=document.createElement("div");
      ym.className="yearmark";
      ym.innerHTML=`<span class="y">Year ${e.year}</span><span class="ystat">${aliveSects().length} sects · ${aliveFigs().length} martial artists${STATE.threatActive?` · <span style="color:var(--blood)">a Heavenly Demon walks</span>`:""}</span>`;
      frag.appendChild(ym);
    }
    const d=document.createElement("div");
    d.className=`entry ${e.cls} ${e.level==="major"?"major":""} ${e.level==="epic"?"epic major":""}`;
    d.innerHTML=`<span class="txt"><span class="tag">${STATE.seasonNames[e.season]}</span>${e.html}</span>`;
    frag.appendChild(d);
  }
  box.appendChild(frag);
  if(autoScroll && atBottom) box.scrollTop=box.scrollHeight;
}

function bar(v,max,color){ return `<div class="mini"><i style="width:${clamp(v/max*100,0,100)}%;background:${color}"></i></div>`; }

function renderPanels(){
  if(!STATE.dirtyPanels) return;
  STATE.dirtyPanels=false;

  $("yr").textContent=STATE.year;
  $("season").textContent=STATE.seasonNames[STATE.season];
  $("alive").textContent=aliveFigs().length;

  $("s-fig").textContent=aliveFigs().length;
  $("s-war").textContent=STATE.activeWars.length;
  $("s-art").textContent=STATE.arts.filter(a=>!a.lost&&!a.dormant).length;
  $("s-lost").textContent=STATE.arts.filter(a=>a.lost||a.dormant).length;

  const sl=$("sectlist");
  const sects=[...STATE.sects].sort((a,b)=>(b.alive-a.alive)||(sectMight(b)-sectMight(a)));
  $("sectct").textContent=aliveSects().length;
  sl.innerHTML="";
  for(const s of sects.slice(0,16)){
    const al=ALIGN[s.align];
    const living=s.members.map(figById).filter(x=>x&&x.alive);
    const lead=topMember(s);
    const div=document.createElement("div");
    div.className="sect"+(s.alive?"":" dead");
    div.style.setProperty("--c",al.c);
    const leadName = lead? (lead.title&&lead.namedAt!=null? cap(lead.title.en):lead.name):"";
    div.innerHTML=`
      <div class="sect-head">
        <div class="sect-name">${s.zh}<span class="en">${s.name}</span></div>
        <div class="sect-tier">${al.zh}</div>
      </div>
      <div class="sect-meta">
        <span><b>${living.length}</b> disciples</span>
        <span>${s.region.replace("the ","").replace(/\s*\(.*\)/,"")}</span>
      </div>
      ${lead?`<div class="sect-meta"><span>Head: <b>${leadName}</b> · ${REALM_ZH[lead.realm]}</span></div>`:""}
      <div class="pbar"><i style="width:${clamp(s.prestige,0,100)}%"></i></div>
    `;
    sl.appendChild(div);
  }

  const fl=$("figlist");
  const figs=aliveFigs().sort((a,b)=>(b.isThreat-a.isThreat)||(b.power-a.power)).slice(0,12);
  $("figct").textContent=aliveFigs().length;
  fl.innerHTML="";
  for(const f of figs){
    const al=ALIGN[f.align];
    const div=document.createElement("div");
    div.className="figcard";
    div.style.setProperty("--c",al.c);
    const named=f.title&&f.namedAt!=null;
    div.innerHTML=`
      <div class="fig-name">${named?`<span class="fig-alias">${cap(f.title.en)} · ${f.title.zh}</span>`:f.name}</div>
      <div class="fig-sub">${named?f.name+" · ":""}${al.label}${f.isThreat?` · <span style="color:var(--blood)">天魔 HEAVENLY DEMON</span>`:""}${f.sect?" · "+f.sect.name:" · wanderer"}</div>
      <span class="fig-realm">${REALMS[f.realm]} · ${REALM_ZH[f.realm]}</span>
      <div class="fig-bars">
        <span>内力</span>${bar(f.power,1100,al.c)}
        <span>声望</span>${bar(f.fame,60,"var(--gold)")}
        <span>魔气</span>${bar(f.alignmentDrift,100,"var(--magyo)")}
      </div>
      ${f.art?`<div class="fig-sub" style="margin-top:6px">${f.art.name} (${f.art.zh}) · tier ${f.art.tier}</div>`:""}
    `;
    fl.appendChild(div);
  }
}

/* =====================================================================
   LOOP & CONTROLS
   ===================================================================== */
let timer=null, speed=420, paused=false;
function loop(){
  if(!paused){ tick(); renderLog(); renderPanels(); }
  timer=setTimeout(loop, speed);
}
function start(seed){
  if(timer) clearTimeout(timer);
  genesis(seed);
  renderLog(); renderPanels();
  loop();
}

$("pause").addEventListener("click",e=>{
  paused=!paused;
  e.target.textContent=paused?"▶ Resume":"❚❚ Pause";
});
$("reseed").addEventListener("click",()=>start((Math.random()*0xffffffff)>>>0));
$("speed").addEventListener("click",e=>{
  if(e.target.dataset.s){
    speed=+e.target.dataset.s;
    [...$("speed").children].forEach(b=>b.classList.toggle("on",b===e.target));
  }
});
$("chron").addEventListener("scroll",e=>{
  const box=e.target;
  autoScroll = box.scrollHeight-box.scrollTop-box.clientHeight < 120;
  $("fnote").textContent = autoScroll? "The brush records all. Scroll up to read the past." : "Reading the past — scroll to the bottom to follow the present.";
});

start((Math.random()*0xffffffff)>>>0);
