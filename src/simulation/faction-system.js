"use strict";

import { factionTypeProfile } from "../data/faction-types.js";
import { benefit, cause, effect } from "../observer/causality.js";
import { chron, aref, ref, sref } from "../observer/chronicle.js";
import { regionById } from "../observer/map-state.js";
import { aliveSects, figById, topMember } from "../observer/selectors.js";
import { clamp, pick, ri, chance } from "../utils/random.js";

export function tickFactionSystem(){
  for(const faction of aliveSects()){
    normalizeFaction(faction);
    updateFactionStrength(faction);
    updateFactionGoals(faction);
    applyTypeBehavior(faction);
  }
}

export function normalizeFaction(faction){
  const profile = factionTypeProfile(faction.type);
  faction.ideology ||= profile.ideology;
  faction.wealth = clamp(faction.wealth ?? 40, 0, 100);
  faction.militaryStrength = clamp(faction.militaryStrength ?? 35, 0, 120);
  faction.cultivationStrength = clamp(faction.cultivationStrength ?? 35, 0, 120);
  faction.publicReputation = clamp(faction.publicReputation ?? faction.prestige ?? 40, 0, 100);
  faction.internalStability = clamp(faction.internalStability ?? 55, 0, 100);
  faction.allies ||= [];
  faction.enemies ||= [];
  faction.vassals ||= [];
  faction.grudges ||= [];
  faction.forbiddenTechniques ||= [];
  faction.secrets ||= [];
  faction.currentGoals ||= [];
  faction.atWarWith ||= [];
  if(faction.signatureArt && isForbiddenTechnique(faction, faction.signatureArt) && !faction.forbiddenTechniques.includes(faction.signatureArt.id)){
    faction.forbiddenTechniques.push(faction.signatureArt.id);
  }
  refreshFactionSecrets(faction);
}

export function recruitmentPlanFor(faction){
  return factionTypeProfile(faction.type).recruitment;
}

function updateFactionStrength(faction){
  const members = faction.members.map(figById).filter(person=>person?.alive);
  const top = [...members].sort((a, b)=>b.power - a.power).slice(0, 6);
  const region = regionById(faction.regionId);
  const warPenalty = faction.atWarWith.length * 4;
  faction.cultivationStrength = clamp(Math.round(top.reduce((sum, person)=>sum + person.power, 0) / 24), 0, 140);
  faction.militaryStrength = clamp(Math.round(members.length * 4 + faction.wealth * 0.25 + faction.prestige * 0.18 + warPenalty), 0, 140);
  faction.publicReputation = clamp(Math.round((faction.prestige || 0) * 0.7 + faction.cultivationStrength * 0.16 + (region?.stability || 50) * 0.12 - faction.forbiddenTechniques.length * 4), 0, 100);
  const leader = figById(faction.leaderId);
  const successor = figById(faction.successorId);
  const leaderBonus = leader?.alive ? 8 : -18;
  const successorBonus = successor?.alive ? 5 : -8;
  faction.internalStability = clamp(Math.round((faction.internalStability || 50) + leaderBonus * 0.03 + successorBonus * 0.04 + (faction.wealth - 50) * 0.015 - faction.atWarWith.length * 1.2 - faction.secrets.length * 0.25), 0, 100);
  faction.wealth = clamp(Math.round((faction.wealth || 40) + ((region?.wealth || 50) - 50) * 0.02 + factionTypeProfile(faction.type).wealthBias * 0.015 - faction.atWarWith.length * 0.6), 0, 100);
}

function updateFactionGoals(faction){
  const profile = factionTypeProfile(faction.type);
  if(!faction.currentGoals.length || chance(.08)){
    const pool = [...profile.goals];
    if(faction.internalStability < 38) pool.push("restore_stability","secure_successor");
    if(faction.wealth < 32) pool.push("secure_resources","expand_trade");
    if(faction.enemies.length) pool.push("weaken_enemy","avenge_grudge");
    if(faction.forbiddenTechniques.length) pool.push("hide_forbidden_art");
    faction.currentGoals = pickUnique(pool, 2).map(key=>({key, label:goalLabel(key), progress:0}));
  }
  for(const goal of faction.currentGoals){
    goal.progress = goalProgress(faction, goal.key);
  }
}

function applyTypeBehavior(faction){
  const region = regionById(faction.regionId);
  switch(faction.type){
    case "Temple":
    case "Monastery":
      if(region) region.demonicActivity = clamp(region.demonicActivity - 0.08, 0, 100);
      faction.internalStability = clamp(faction.internalStability + 0.04, 0, 100);
      break;
    case "Clan":
      faction.wealth = clamp(faction.wealth + 0.05, 0, 100);
      if(faction.internalStability < 42 && chance(.03)) faction.grudges.push({year:faction.founded, type:"branch_dispute", note:"Branch families contest succession."});
      break;
    case "Academy":
      faction.publicReputation = clamp(faction.publicReputation + 0.06, 0, 100);
      faction.wealth = clamp(faction.wealth + 0.04, 0, 100);
      break;
    case "Dynasty":
      faction.militaryStrength = clamp(faction.militaryStrength + 0.08, 0, 140);
      faction.wealth = clamp(faction.wealth + 0.06, 0, 100);
      break;
    case "Valley":
      faction.publicReputation = clamp(faction.publicReputation + 0.04, 0, 100);
      if(region) region.wealth = clamp(region.wealth + 0.03, 0, 100);
      break;
    case "Workshop":
      faction.wealth = clamp(faction.wealth + 0.08, 0, 100);
      break;
    case "Cult":
      faction.cultivationStrength = clamp(faction.cultivationStrength + 0.12, 0, 140);
      faction.internalStability = clamp(faction.internalStability - 0.12, 0, 100);
      break;
    case "Hidden Lineage":
      faction.publicReputation = clamp(faction.publicReputation - 0.02, 0, 100);
      faction.internalStability = clamp(faction.internalStability + 0.04, 0, 100);
      break;
  }
  maybeRecordGoalMilestone(faction);
}

function maybeRecordGoalMilestone(faction){
  const finished = faction.currentGoals.find(goal=>goal.progress >= 100 && !goal.recorded);
  if(!finished || !chance(.18)) return;
  finished.recorded = true;
  const leader = figById(faction.leaderId) || topMember(faction);
  chron(
    "c-sect",
    `${sref(faction)} advances its goal to ${finished.label.toLowerCase()}, strengthening its ${faction.type} identity.`,
    "normal",
    {
      trueRecord:`Faction goal progress came from type behaviour: ideology ${faction.ideology}, wealth ${Math.round(faction.wealth)}, military ${Math.round(faction.militaryStrength)}, cultivation ${Math.round(faction.cultivationStrength)}, stability ${Math.round(faction.internalStability)}.`,
      knownBy:"True Record; faction elders",
      causalType:"faction",
      regionId:faction.regionId,
      locationId:faction.seatId,
      causes:[
        cause("Goal", finished.label, `${sref(faction)} is acting according to its institution type.`),
        cause("Ideology", faction.type, faction.ideology),
        cause("Leader", leader ? leader.name : "uncertain", leader ? `${ref(leader)} anchors the policy.` : "No clear leader anchors the policy.")
      ],
      effects:[
        effect("Faction", "Goal matures", `${finished.label} becomes visible in faction behaviour.`)
      ],
      beneficiaries:[
        benefit(sref(faction), `Converts ${faction.type} identity into long-term advantage.`, faction.weakness)
      ]
    }
  );
}

function refreshFactionSecrets(faction){
  const secrets = [];
  if(faction.internalStability < 36) secrets.push({type:"succession_crisis", label:"Succession crisis", hidden:true});
  if(faction.forbiddenTechniques.length) secrets.push({type:"forbidden_art", label:"Forbidden technique archive", hidden:true});
  if(["Cult","Hidden Lineage"].includes(faction.type) || ["heretical","abyssal"].includes(faction.align)) secrets.push({type:"hidden_rites", label:"Hidden rites", hidden:true});
  if(faction.enemies.length >= 3) secrets.push({type:"diplomatic_encirclement", label:"Diplomatic encirclement", hidden:true});
  faction.secrets = secrets;
}

function isForbiddenTechnique(faction, art){
  return ["heretical","abyssal"].includes(faction.align) || ["blood","resentment","abyssal"].includes(art.qiType) || (art.corruption || 0) > 55 || chance(factionTypeProfile(faction.type).forbiddenRisk);
}

function goalProgress(faction, key){
  switch(key){
    case "recruit_disciples":
    case "find_heir":
      return clamp(faction.members.length * 8, 0, 100);
    case "secure_successor":
      return faction.successorId ? clamp(65 + faction.internalStability / 3, 0, 100) : 20;
    case "protect_manual":
    case "preserve_doctrine":
      return clamp((faction.signatureArt ? 55 : 15) + faction.internalStability / 2, 0, 100);
    case "expand_influence":
    case "control_region":
      return clamp(faction.publicReputation + faction.militaryStrength / 4, 0, 100);
    case "secure_resources":
    case "expand_trade":
    case "sell_pills":
    case "sell_mechanisms":
    case "collect_tax":
      return clamp(faction.wealth + faction.publicReputation / 5, 0, 100);
    case "suppress_demons":
      return clamp(100 - (regionById(faction.regionId)?.demonicActivity || 50), 0, 100);
    case "hide_forbidden_art":
    case "hide_rites":
    case "hide_lineage":
    case "avoid_court":
      return clamp(faction.internalStability + (100 - faction.publicReputation) / 3, 0, 100);
    case "weaken_enemy":
    case "avenge_grudge":
    case "spread_fear":
    case "steal_manual":
    case "corrupt_elites":
      return clamp(faction.cultivationStrength / 2 + faction.militaryStrength / 3 + faction.enemies.length * 8, 0, 100);
    default:
      return clamp((faction.prestige || 0) + faction.internalStability / 4, 0, 100);
  }
}

function goalLabel(key){
  return key.replace(/_/g, " ").replace(/\b\w/g, char=>char.toUpperCase());
}

function pickUnique(pool, count){
  const result = [];
  let guard = 0;
  while(result.length < count && guard++ < 30){
    const value = pick(pool);
    if(!result.includes(value)) result.push(value);
  }
  return result;
}
