"use strict";

import { memoryById } from "../entities/memory.js";
import { relationshipById, relationshipLabel } from "../entities/relationship.js";
import { figById } from "./selectors.js";

export function relationshipReportFor(person){
  if(!person) return [];
  return (person.relationships || [])
    .map(id=>relationshipById(id))
    .filter(Boolean)
    .map(relationship=>{
      const other = figById(relationship.toId);
      const relatedMemories = (person.memories || [])
        .map(memoryById)
        .filter(memory=>memory && memory.relatedPersonId === relationship.toId)
        .slice(-5);
      return {
        id:relationship.id,
        type:relationshipLabel(relationship),
        personId:person.id,
        otherId:relationship.toId,
        otherName:other?.name || "unknown",
        publicKnown:relationship.publicKnown,
        hidden:relationship.hidden,
        feelings:{...relationship.feelings},
        note:relationship.note,
        since:relationship.since,
        lastEscalatedYear:relationship.lastEscalatedYear || null,
        memories:relatedMemories.map(memory=>({
          id:memory.id,
          type:memory.type,
          year:memory.year,
          emotionalWeight:memory.emotionalWeight,
          hidden:memory.hidden,
          text:memory.text
        }))
      };
    })
    .sort((a, b)=>relationshipHeat(b) - relationshipHeat(a));
}

export function relationshipHeat(report){
  const feelings = report.feelings || {};
  const memoryHeat = (report.memories || []).reduce((total, memory)=>total + Math.abs(memory.emotionalWeight || 0) / 2, 0);
  return memoryHeat + Math.abs(feelings.hatred || 0) + Math.abs(feelings.resentment || 0) + Math.abs(feelings.love || 0) + Math.abs(feelings.debt || 0);
}
