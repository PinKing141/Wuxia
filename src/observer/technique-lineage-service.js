"use strict";

import { STATE } from "../state.js";
import { figById } from "./selectors.js";

export function techniqueLineageReport(technique){
  if(!technique) return null;
  return {
    id:technique.id,
    name:technique.name,
    recordName:technique.recordName,
    type:technique.type,
    grade:technique.grade,
    path:technique.path,
    qiType:technique.qiType,
    creator:personName(technique.creatorId),
    originFaction:STATE.sects.find(faction=>faction.id === technique.originFactionId)?.name || null,
    currentHolders:(technique.currentHolderIds || []).map(personName).filter(Boolean),
    pastHolders:(technique.pastHolderIds || []).map(personName).filter(Boolean),
    parentTechniques:(technique.parentTechniqueIds || []).map(techniqueName).filter(Boolean),
    childTechniques:(technique.childTechniqueIds || []).map(techniqueName).filter(Boolean),
    risks:[...(technique.risks || [])],
    counters:[...(technique.counters || [])],
    completeness:technique.completeness,
    forbidden:technique.forbidden,
    damaged:technique.damaged,
    publicKnown:technique.publicKnown,
    lost:technique.lost,
    dormant:technique.dormant,
    history:[...(technique.history || [])].slice(-20).map(entry=>({
      ...entry,
      person:personName(entry.personId),
      faction:STATE.sects.find(faction=>faction.id === entry.factionId)?.name || null,
      relatedTechnique:techniqueName(entry.relatedTechniqueId)
    }))
  };
}

export function techniqueLineageTree(technique){
  if(!technique) return [];
  const rootId = technique.originalTechniqueId || technique.id;
  const root = STATE.arts.find(art=>art.id === rootId) || technique;
  const rows = [];
  visit(root, 0, rows, new Set());
  return rows;
}

function visit(technique, depth, rows, seen){
  if(!technique || seen.has(technique.id)) return;
  seen.add(technique.id);
  rows.push({id:technique.id, name:technique.name, grade:technique.grade, type:technique.type, depth});
  for(const childId of technique.childTechniqueIds || []){
    visit(STATE.arts.find(art=>art.id === childId), depth + 1, rows, seen);
  }
}

function personName(id){
  return figById(id)?.name || null;
}

function techniqueName(id){
  return STATE.arts.find(art=>art.id === id)?.name || null;
}
