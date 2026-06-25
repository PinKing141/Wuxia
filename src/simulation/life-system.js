"use strict";

import { rankForFigure, updatePublicIdentity } from "../entities/figure.js";
import { addMemory } from "../entities/memory.js";
import { relationshipById, upsertRelationshipPair } from "../entities/relationship.js";
import { aliveFigs, figById } from "../observer/selectors.js";
import { normalizeCultivationState } from "./cultivation-system.js";
import { chance, clamp, pick, rand } from "../utils/random.js";

export function tickCharacterLife(){
  for(const figure of aliveFigs()){
    normalizeLifeFields(figure);
    updateRankAndReputation(figure);
    resolveQuietAmbitionPressure(figure);
    maintainMasterDiscipleBond(figure);
    ensureMajorRelationship(figure);
  }
}

export function normalizeLifeFields(figure){
  figure.personalityTraits ||= [];
  figure.ambitions ||= [];
  figure.fears ||= [];
  figure.memories ||= [];
  figure.relationships ||= [];
  figure.secrets ||= [];
  figure.discipleIds ||= [];
  figure.injuries ||= [];
  figure.lifeGoals ||= figure.ambitions.map(key=>({ambitionKey:key, status:"active", progress:0}));
  figure.reputation ||= {score:figure.fame || 0, label:"obscure"};
  figure.publicIdentity ||= "Unrecorded cultivator";
  figure.hiddenIdentity ||= "No hidden identity recorded";
  normalizeCultivationState(figure);
}

function updateRankAndReputation(figure){
  const nextRank = rankForFigure(figure.sect, figure.realm);
  if(figure.sect && figure.rankInFaction !== nextRank && !isLeaderRank(figure.rankInFaction)){
    figure.rankInFaction = nextRank;
  }
  updatePublicIdentity(figure);
  for(const goal of figure.lifeGoals){
    if(goal.status !== "active") continue;
    goal.progress = goalProgress(figure, goal.ambitionKey);
    if(goal.progress >= 100){
      goal.status = "fulfilled";
      addMemory(figure, {
        type:"ambition_fulfilled",
        emotionalWeight:28,
        publicKnown:figure.fame >= 18,
        text:`Fulfilled the ambition to ${goal.ambitionKey.replace(/_/g, " ")}.`
      });
    }
  }
}

function resolveQuietAmbitionPressure(figure){
  if(figure.ambitions.includes("become_famous") && chance(.035)){
    figure.fame = clamp((figure.fame || 0) + 1, 0, 120);
  }
  if(figure.ambitions.includes("live_peacefully") && figure.alignmentDrift > 0 && chance(.08)){
    figure.alignmentDrift = clamp(figure.alignmentDrift - rand(), 0, 100);
  }
  if(figure.fears.includes("inner_demons") && figure.alignmentDrift > 55 && chance(.04)){
    addMemory(figure, {
      type:"inner_demon_pressure",
      emotionalWeight:-22,
      hidden:true,
      text:"Felt inner demons stir during secluded cultivation."
    });
  }
}

function maintainMasterDiscipleBond(figure){
  if(!figure.master) return;
  const master = figById(figure.master);
  if(!master || !master.alive) return;
  if(!master.discipleIds) master.discipleIds = [];
  if(!master.discipleIds.includes(figure.id)) master.discipleIds.push(figure.id);
  const alreadyBound = (figure.relationships || []).some(id=>{
    const rel = relationshipById(id);
    return rel && rel.toId === master.id && rel.type === "disciple";
  });
  if(alreadyBound) return;
  upsertRelationshipPair(master, figure, "master", {respect:3, loyalty:2, trust:1}, {respect:4, loyalty:3, admiration:2}, {
    publicKnown:true,
    note:"Maintained master-disciple bond."
  });
}

function ensureMajorRelationship(figure){
  if(!isMajorFigure(figure) || figure.relationships?.length) return;
  const candidates = aliveFigs().filter(other=>{
    if(other.id === figure.id) return false;
    if(figure.sect && other.sect === figure.sect) return true;
    if(figure.currentRegionId && other.currentRegionId === figure.currentRegionId) return true;
    return other.realm >= 3;
  });
  if(!candidates.length) return;
  const other = pick(candidates);
  const friendly = figure.sect && other.sect === figure.sect;
  const type = friendly ? "friend" : "rival";
  upsertRelationshipPair(figure, other, type,
    friendly ? {trust:12, respect:10, loyalty:6} : {respect:8, envy:8, resentment:6},
    friendly ? {trust:10, respect:8, loyalty:5} : {respect:8, envy:6, resentment:8},
    {
      hidden:!friendly,
      publicKnown:friendly,
      note:friendly ? "Quiet bond formed through shared faction life." : "Quiet rivalry formed through overlapping reputation."
    }
  );
  addMemory(figure, {
    type:friendly ? "formed_friendship" : "formed_rivalry",
    relatedPersonId:other.id,
    emotionalWeight:friendly ? 16 : -12,
    hidden:!friendly,
    publicKnown:friendly,
    text:friendly ? `Came to trust ${other.name} within shared faction life.` : `Began measuring themself against ${other.name}.`
  });
}

function goalProgress(figure, key){
  switch(key){
    case "become_faction_leader":
      return isLeaderRank(figure.rankInFaction) ? 100 : clamp((figure.realm || 0) * 12 + (figure.fame || 0), 0, 95);
    case "avenge_family":
    case "destroy_rival_faction":
      return clamp((figure.grudges?.length || 0) * 18 + (figure.realm || 0) * 6, 0, 92);
    case "protect_master":
      return figure.master && figById(figure.master)?.alive ? clamp(35 + (figure.realm || 0) * 7, 0, 95) : 100;
    case "surpass_senior":
    case "prove_talent":
      return clamp((figure.realm || 0) * 10 + (figure.fame || 0) + (figure.comprehension || 0) / 4, 0, 98);
    case "find_cure":
      return figure.path === "medicine" ? clamp((figure.realm || 0) * 11 + (figure.comprehension || 0) / 3, 0, 95) : clamp((figure.realm || 0) * 7, 0, 80);
    case "recover_lost_manual":
      return figure.art?.lost ? 20 : clamp((figure.art ? 45 : 0) + (figure.comprehension || 0) / 3, 0, 95);
    case "restore_clan":
      return figure.sect?.align === "clan" ? clamp((figure.sect.prestige || 0) + (figure.realm || 0) * 5, 0, 95) : clamp((figure.realm || 0) * 8, 0, 85);
    case "escape_marriage":
    case "live_peacefully":
      return figure.sect ? clamp(25 + figure.age / 2, 0, 90) : 100;
    case "become_famous":
      return clamp((figure.fame || 0) * 3, 0, 100);
    case "hide_demonic_cultivation":
      return figure.align === "heretical" || figure.align === "abyssal" ? clamp(80 - (figure.fame || 0), 0, 98) : 100;
    default:
      return clamp((figure.fame || 0) + (figure.realm || 0) * 8, 0, 95);
  }
}

function isLeaderRank(rank=""){
  return /Founder|Leader|Patriarch|Abbot|Master|Pillar|Chancellor/.test(rank);
}

function isMajorFigure(figure){
  return figure.realm >= 4 || figure.namedAt != null || figure.fame >= 18 || figure.isThreat;
}
