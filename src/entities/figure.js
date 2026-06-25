"use strict";

import { STATE, newId } from "../state.js";
import { AMBITIONS, FEARS, GENDERS, PERSONALITY_TRAITS, RANKS_BY_INSTITUTION, REPUTATION_LABELS, SECRET_TYPES } from "../data/character-life.js";
import { subStageIndex } from "../data/cultivation.js";
import { ALIGNMENT_DEFAULT_PROFILES } from "../data/path-profiles.js";
import { attachFamily } from "./family.js";
import { addMemory } from "./memory.js";
import { upsertRelationshipPair } from "./relationship.js";
import { makeName } from "../generators/names.js";
import { chance, clamp, pick, rand, ri } from "../utils/random.js";

export function makeFigure(opts={}){
  const align = opts.align || pick(["righteous","righteous","rogue","heretical","hidden"]);
  const talent = opts.talent != null ? opts.talent : ri(20,80);
  const profile = ALIGNMENT_DEFAULT_PROFILES[align];
  const path = opts.path || opts.art?.path || opts.sect?.paths?.[0] || pick(profile.paths);
  const qiType = opts.qiType || opts.art?.qiType || opts.sect?.qiTypes?.[0] || pick(profile.qiTypes);
  const progress = opts.progress != null ? opts.progress : rand() * 40;
  const birthplaceRegionId = opts.birthplaceRegionId || opts.sect?.regionId || pick(STATE.regions || [])?.id || null;
  const currentRegionId = opts.currentRegionId || opts.sect?.regionId || birthplaceRegionId;
  const hiddenStats = makeHiddenStats(talent, opts, align);
  const personalityTraits = opts.personalityTraits || pickUnique(PERSONALITY_TRAITS.map(t=>t.key), ri(2,3), traitBias(align, path));
  const ambitions = opts.ambitions || pickAmbitions({align, path, sect:opts.sect, traits:personalityTraits});
  const fears = opts.fears || pickFears({align, path, sect:opts.sect, traits:personalityTraits});
  const secrets = opts.secrets || pickSecrets({align, path, qiType});
  const f = {
    id:newId(), kind:"fig",
    name:opts.name || makeName(),
    gender:opts.gender || pick(GENDERS).key,
    epithet:null,
    align, talent:hiddenStats.cultivationTalent,
    cultivationTalent:hiddenStats.cultivationTalent,
    comprehension:hiddenStats.comprehension,
    combatInstinct:hiddenStats.combatInstinct,
    daoHeart:hiddenStats.daoHeart,
    willpower:hiddenStats.willpower,
    luck:hiddenStats.luck,
    foundationQuality:hiddenStats.foundationQuality,
    qiPurity:hiddenStats.qiPurity,
    mentalState:hiddenStats.mentalState,
    resources:opts.resources ?? (opts.sect ? clamp(30 + (opts.sect.prestige || 0) / 2 + ri(-8,8), 0, 100) : ri(8,45)),
    techniqueCompatibility:opts.techniqueCompatibility ?? 50,
    masterGuidance:opts.masterGuidance ?? (opts.master ? 35 : opts.sect ? 12 : 0),
    pillToxicity:opts.pillToxicity ?? 0,
    innerDemon:opts.innerDemon ?? (["heretical","abyssal"].includes(align) ? ri(8,28) : ri(0,8)),
    breakthroughHistory:[],
    path, qiType,
    realm:opts.realm != null ? opts.realm : 0,
    progress,
    stage:opts.stage != null ? opts.stage : subStageIndex(progress),
    age:opts.age != null ? opts.age : ri(14,22),
    lifespan:0, power:0,
    fame:opts.fame || ri(0,8),
    alignmentDrift:align === "abyssal" ? ri(65,88) : align === "heretical" ? ri(40,65) : align === "rogue" ? ri(20,40) : ri(0,15),
    sect:opts.sect || null,
    birthplaceRegionId,
    currentRegionId,
    familyId:opts.familyId || null,
    rankInFaction:opts.rankInFaction || rankForFigure(opts.sect, opts.realm != null ? opts.realm : 0),
    art:opts.art || null,
    master:opts.master || null,
    discipleIds:[...(opts.discipleIds || [])],
    lineage:opts.lineage || null,
    personalityTraits,
    ambitions,
    fears,
    memories:[],
    relationships:[],
    secrets,
    reputation:{score:opts.reputationScore || 0, label:"obscure"},
    publicIdentity:null,
    hiddenIdentity:null,
    injuries:[],
    causeOfDeath:null,
    lifeGoals:ambitions.map(key=>({ambitionKey:key, status:"active", progress:0})),
    alive:true, born:STATE.year,
    isThreat:false, namedAt:null,
    grudges:[]
  };
  const family = attachFamily(f, {familyId:opts.familyId, regionId:birthplaceRegionId, factionId:opts.sect?.id || null});
  f.publicIdentity = publicIdentityFor(f);
  f.hiddenIdentity = hiddenIdentityFor(f);
  updateReputation(f);
  addMemory(f, {
    type:"origin",
    relatedFactionId:f.sect?.id || null,
    emotionalWeight:12,
    publicKnown:true,
    text:`Born into ${family ? family.name : "an unrecorded family"} with a desire to ${ambitionLabel(ambitions[0]).toLowerCase()}.`
  });
  bindMasterDisciple(f);
  recomputeLife(f);
  recomputePower(f);
  return f;
}

export function updateStage(f){
  f.stage = subStageIndex(f.progress);
  return f.stage;
}

export function recomputeLife(f){
  let base = 58 + f.realm * 22 + Math.floor((f.cultivationTalent ?? f.talent) / 5);
  base += Math.floor((f.foundationQuality || 50) / 12);
  base += Math.floor((f.willpower || 50) / 18);
  if(f.qiType === "spiritual") base += 8;
  if(f.qiType === "yang") base += 6;
  if(f.qiType === "blood") base -= 8;
  if(f.qiType === "abyssal") base -= 15;
  if((f.qiPurity || 50) >= 75) base += 6;
  if((f.pillToxicity || 0) >= 45) base -= 8;
  if((f.innerDemon || 0) >= 55) base -= 10;
  if(f.align === "abyssal") base -= 28;
  if(f.align === "heretical") base -= 18;
  if(f.align === "hidden") base += 30;
  if(f.injuries?.length) base -= Math.min(20, f.injuries.reduce((total, injury)=>total + (injury.severity || 1), 0));
  f.lifespan = base;
}

export function recomputePower(f){
  let p = f.realm * 100 + f.progress + (f.cultivationTalent ?? f.talent) * 1.15;
  p += (f.combatInstinct || 50) * 0.32;
  p += (f.foundationQuality || 50) * 0.22;
  p += (f.qiPurity || 50) * 0.18;
  p += (f.techniqueCompatibility || 50) * 0.12;
  p += (f.willpower || 50) * 0.12;
  if(f.art) p += f.art.tier * 30;
  if(f.art && f.art.path === f.path) p += 18;
  if(f.art && f.art.qiType === f.qiType) p += 12;
  if(f.injuries?.length) p -= Math.min(80, f.injuries.reduce((total, injury)=>total + (injury.severity || 1) * 7, 0));
  p -= Math.min(55, (f.innerDemon || 0) * 0.35 + (f.pillToxicity || 0) * 0.25);
  f.power = Math.round(p);
}

export function updateReputation(f){
  const score = Math.round((f.fame || 0) + (f.realm || 0) * 5 + (f.isThreat ? 80 : 0));
  f.reputation = {
    score,
    label:REPUTATION_LABELS.find(item=>score >= item.min)?.label || "obscure"
  };
  return f.reputation;
}

export function updatePublicIdentity(f){
  f.publicIdentity = publicIdentityFor(f);
  f.hiddenIdentity = hiddenIdentityFor(f);
  updateReputation(f);
  return f.publicIdentity;
}

export function rankForFigure(sect, realm){
  if(!sect) return "Wanderer";
  const key = String(sect.type || "Sect").replace(/\s+/g, "_");
  const ranks = RANKS_BY_INSTITUTION[key] || RANKS_BY_INSTITUTION.Sect;
  if(realm >= 6) return ranks[4];
  if(realm >= 5) return ranks[3];
  if(realm >= 3) return ranks[2];
  if(realm >= 1) return ranks[1];
  return ranks[0];
}

export function ambitionLabel(key){
  return AMBITIONS.find(item=>item.key === key)?.label || key || "live quietly";
}

export function fearLabel(key){
  return FEARS.find(item=>item.key === key)?.label || key || "the unknown";
}

export function traitLabel(key){
  return PERSONALITY_TRAITS.find(item=>item.key === key)?.label || key || "Unknown";
}

function makeHiddenStats(talent, opts, align){
  const cultivationTalent = clamp(Math.round(opts.cultivationTalent ?? talent), 1, 100);
  const base = clamp(cultivationTalent + ri(-16,16), 5, 100);
  const daoPenalty = ["heretical","abyssal"].includes(align) ? ri(5,14) : 0;
  const foundationPenalty = ["heretical","abyssal"].includes(align) ? ri(0,8) : 0;
  return {
    cultivationTalent,
    comprehension:clamp(Math.round(opts.comprehension ?? base + ri(-20,20)), 1, 100),
    combatInstinct:clamp(Math.round(opts.combatInstinct ?? base + ri(-18,22)), 1, 100),
    daoHeart:clamp(Math.round(opts.daoHeart ?? base + ri(-18,18) - daoPenalty), 1, 100),
    willpower:clamp(Math.round(opts.willpower ?? base + ri(-16,20)), 1, 100),
    luck:clamp(Math.round(opts.luck ?? ri(8,92)), 1, 100),
    foundationQuality:clamp(Math.round(opts.foundationQuality ?? base + ri(-14,16) - foundationPenalty), 1, 100),
    qiPurity:clamp(Math.round(opts.qiPurity ?? base + ri(-16,18) - foundationPenalty), 1, 100),
    mentalState:clamp(Math.round(opts.mentalState ?? base + ri(-18,18) - daoPenalty), 1, 100)
  };
}

function pickUnique(pool, count, preferred=[]){
  const result = [];
  const weighted = [...preferred.filter(item=>pool.includes(item)), ...pool];
  let guard = 0;
  while(result.length < count && guard++ < 60){
    const value = pick(weighted);
    if(!result.includes(value)) result.push(value);
  }
  return result;
}

function traitBias(align, path){
  const bias = [];
  if(["righteous","temple"].includes(align)) bias.push("honourable","loyal","merciful");
  if(["clan","imperial","academy"].includes(align)) bias.push("ambitious","patient","studious");
  if(["heretical","abyssal"].includes(align)) bias.push("ruthless","obsessive","vengeful");
  if(align === "rogue") bias.push("cautious","reckless","proud");
  if(path === "sword") bias.push("proud","honourable");
  if(path === "medicine") bias.push("patient","merciful");
  if(path === "poison" || path === "assassin") bias.push("cautious","patient");
  return bias;
}

function pickAmbitions({align, path, sect, traits}){
  const pool = AMBITIONS.map(item=>item.key).filter(key=>{
    if(key === "hide_demonic_cultivation") return ["heretical","abyssal"].includes(align);
    if(key === "escape_marriage") return sect?.align === "clan" || chance(.12);
    return true;
  });
  const preferred = [];
  if(sect) preferred.push("become_faction_leader","protect_master","prove_talent");
  if(path === "medicine") preferred.push("find_cure");
  if(["heretical","abyssal"].includes(align)) preferred.push("hide_demonic_cultivation","destroy_rival_faction");
  if(traits.includes("vengeful")) preferred.push("avenge_family","destroy_rival_faction");
  if(traits.includes("studious")) preferred.push("recover_lost_manual","prove_talent");
  if(traits.includes("cowardly")) preferred.push("live_peacefully");
  return pickUnique(pool, chance(.25) ? 2 : 1, preferred);
}

function pickFears({align, path, sect, traits}){
  const pool = FEARS.map(item=>item.key);
  const preferred = [];
  if(sect) preferred.push("master_disappointment","losing_status","public_disgrace");
  if(["heretical","abyssal"].includes(align)) preferred.push("inner_demons","qi_deviation");
  if(path === "poison" || path === "medicine") preferred.push("manual_theft","death");
  if(traits.includes("proud") || traits.includes("arrogant")) preferred.push("public_disgrace","ordinary");
  if(traits.includes("loyal")) preferred.push("betrayal","clan_extinction");
  return pickUnique(pool, chance(.25) ? 2 : 1, preferred);
}

function pickSecrets({align, path, qiType}){
  if(chance(["heretical","abyssal"].includes(align) ? .55 : .15)){
    const pool = SECRET_TYPES.filter(item=>{
      if(item.key === "none") return false;
      if(item.key === "forbidden_cultivation") return ["heretical","abyssal"].includes(align) || ["blood","resentment","abyssal"].includes(qiType);
      if(item.key === "poisoned_foundation") return path === "poison" || qiType === "poison";
      return true;
    });
    return [pick(pool)];
  }
  return [];
}

function publicIdentityFor(f){
  if(f.sect) return `${f.rankInFaction} of ${f.sect.recordName || f.sect.name}`;
  return f.realm >= 3 ? "Known wandering cultivator" : "Unattached wanderer";
}

function hiddenIdentityFor(f){
  if(f.secrets?.length) return f.secrets[0].label;
  if(f.align === "hidden") return "Unregistered inheritance";
  return "No hidden identity recorded";
}

function bindMasterDisciple(f){
  if(!f.master) return;
  const master = STATE.figures?.find(person=>person.id === f.master);
  if(!master) return;
  if(!master.discipleIds) master.discipleIds = [];
  if(!master.discipleIds.includes(f.id)) master.discipleIds.push(f.id);
  upsertRelationshipPair(master, f, "master", {respect:20, trust:10, loyalty:12}, {respect:28, loyalty:20, admiration:18}, {
    publicKnown:true,
    note:"Formal master-disciple bond."
  });
  addMemory(f, {
    type:"accepted_disciple",
    relatedPersonId:master.id,
    emotionalWeight:24,
    publicKnown:true,
    text:`Accepted as a disciple beneath ${master.name}.`
  });
  addMemory(master, {
    type:"accepted_disciple",
    relatedPersonId:f.id,
    emotionalWeight:14,
    publicKnown:true,
    text:`Accepted ${f.name} as a disciple.`
  });
}
