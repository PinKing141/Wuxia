"use strict";

import { STATE } from "../state.js";
import { normalizeIdList } from "./event-system.js";

export function registerChronicleEvent(entry, variants={}){
  entry.hiddenCauseIds = normalizeIdList(entry.hiddenCauseIds);
  entry.consequenceIds = normalizeIdList(entry.consequenceIds);
  if(!entry.hiddenCauseIds.length){
    entry.hiddenCauseIds = inferHiddenCauseIds(entry, variants);
  }
  for(const causeId of entry.hiddenCauseIds){
    const cause = STATE.log.find(event=>event.id === causeId);
    if(cause && !cause.consequenceIds.includes(entry.id)) cause.consequenceIds.push(entry.id);
  }
  for(const consequenceId of entry.consequenceIds){
    const consequence = STATE.log.find(event=>event.id === consequenceId);
    if(consequence && !consequence.hiddenCauseIds.includes(entry.id)) consequence.hiddenCauseIds.push(entry.id);
  }
  return entry;
}

export function tickChronicleSystem(){
  for(const event of STATE.log){
    event.hiddenCauseIds = normalizeIdList(event.hiddenCauseIds);
    event.consequenceIds = normalizeIdList(event.consequenceIds);
    event.rumourIds = normalizeIdList(event.rumourIds);
    event.involvedPersonIds = normalizeIdList(event.involvedPersonIds);
    event.involvedFactionIds = normalizeIdList(event.involvedFactionIds);
    event.involvedTechniqueIds = normalizeIdList(event.involvedTechniqueIds);
    event.knownByPersonIds = normalizeIdList(event.knownByPersonIds);
  }
}

function inferHiddenCauseIds(entry, variants){
  if(variants.disableCauseInference) return [];
  if(!entry.trueRecord && !entry.causes?.length && entry.importance === "normal") return [];
  const recent = STATE.log.slice(-160);
  const scored = recent
    .map(event=>({event, score:relationScore(event, entry)}))
    .filter(item=>item.score >= 4)
    .sort((a, b)=>b.score - a.score || b.event.id - a.event.id)
    .slice(0, entry.importance === "normal" ? 1 : 3)
    .map(item=>item.event.id);
  return scored;
}

function relationScore(a, b){
  let score = 0;
  if(a.causalType && a.causalType === b.causalType) score += 3;
  if(a.type && a.type === b.type) score += 2;
  if(a.regionId && a.regionId === b.regionId) score += 1;
  if(a.locationId && a.locationId === b.locationId) score += 2;
  score += shared(a.involvedPersonIds, b.involvedPersonIds) * 5;
  score += shared(a.involvedFactionIds, b.involvedFactionIds) * 4;
  score += shared(a.involvedTechniqueIds, b.involvedTechniqueIds) * 4;
  if(a.trueRecord && b.trueRecord && a.importance !== "normal") score += 1;
  return score;
}

function shared(left=[], right=[]){
  const rightSet = new Set(right);
  return left.filter(id=>rightSet.has(id)).length;
}
