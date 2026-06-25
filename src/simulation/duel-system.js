"use strict";

export function conflictLevelForDuel(score=0, deathBlow=false){
  if(deathBlow || score >= 96) return "duel";
  if(score >= 62) return "rivalry";
  return "personal_insult";
}

export function duelConflictRecord({actor, target, winner=null, loser=null, score=0, eventId=null, deathBlow=false}={}){
  return {
    type:conflictLevelForDuel(score, deathBlow),
    actorId:actor?.id || null,
    targetId:target?.id || null,
    winnerId:winner?.id || null,
    loserId:loser?.id || null,
    score:Math.round(score),
    eventId,
    deathBlow
  };
}
