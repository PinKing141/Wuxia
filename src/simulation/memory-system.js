"use strict";

import { addMemory, memoryById } from "../entities/memory.js";
import { upsertRelationshipPair } from "../entities/relationship.js";
import { aliveFigs, figById } from "../observer/selectors.js";
import { clamp } from "../utils/random.js";

const NEGATIVE_MEMORY_TYPES = new Set([
  "lost_duel",
  "betrayal",
  "betrayed_friend",
  "failed_breakthrough",
  "foundation_damage",
  "qi_deviation",
  "inner_demon",
  "severe_backlash",
  "exile",
  "humiliated_by",
  "assassination_attempt"
]);

const POSITIVE_MEMORY_TYPES = new Set([
  "sworn_oath",
  "accepted_disciple",
  "praised_by_master",
  "praised_by_elders",
  "formed_friendship",
  "breakthrough",
  "apex_breakthrough",
  "injury_healed"
]);

export function tickMemorySystem(){
  for(const figure of aliveFigs()){
    for(const memoryId of figure.memories || []){
      const memory = memoryById(memoryId);
      if(!memory || memory.influenceApplied) continue;
      applyMemoryInfluence(figure, memory);
      memory.influenceApplied = true;
    }
  }
}

export function memoryPressureBetween(from, to){
  if(!from || !to) return 0;
  let pressure = 0;
  for(const memoryId of from.memories || []){
    const memory = memoryById(memoryId);
    if(!memory || memory.relatedPersonId !== to.id) continue;
    if(memory.emotionalWeight < 0) pressure += Math.abs(memory.emotionalWeight) * 0.8;
    if(["lost_duel", "betrayal", "humiliated_by", "assassination_attempt"].includes(memory.type)) pressure += 18;
    if(memory.hidden) pressure += 4;
  }
  return clamp(pressure, 0, 120);
}

export function addHumiliationMemory(victim, aggressor, event){
  return addMemory(victim, {
    type:"humiliated_by",
    relatedPersonId:aggressor.id,
    relatedEventId:event?.id || null,
    emotionalWeight:-38,
    publicKnown:true,
    text:`Was humiliated by ${aggressor.name}; the shame now presses on future choices.`
  });
}

function applyMemoryInfluence(figure, memory){
  if(!memory.relatedPersonId) return;
  const other = figById(memory.relatedPersonId);
  if(!other || !other.alive) return;

  if(NEGATIVE_MEMORY_TYPES.has(memory.type) || memory.emotionalWeight <= -28){
    const resentment = clamp(Math.abs(memory.emotionalWeight) / 2, 4, 34);
    upsertRelationshipPair(figure, other, "rival",
      {resentment, envy:memory.type === "lost_duel" ? 10 : 0, hatred:memory.type === "betrayal" ? 18 : 4, trust:-8},
      {respect:2, resentment:4},
      {
        hidden:memory.hidden,
        publicKnown:memory.publicKnown,
        sourceEventId:memory.relatedEventId,
        note:`Memory pressure: ${memory.type}.`
      }
    );
    if(!figure.grudges) figure.grudges = [];
    if(!figure.grudges.includes(other.id)) figure.grudges.push(other.id);
    return;
  }

  if(POSITIVE_MEMORY_TYPES.has(memory.type) || memory.emotionalWeight >= 28){
    upsertRelationshipPair(figure, other, "friend",
      {trust:10, respect:8, loyalty:memory.type === "sworn_oath" ? 18 : 4, admiration:6},
      {trust:6, respect:6},
      {
        hidden:memory.hidden,
        publicKnown:memory.publicKnown,
        sourceEventId:memory.relatedEventId,
        note:`Memory warmth: ${memory.type}.`
      }
    );
  }
}
