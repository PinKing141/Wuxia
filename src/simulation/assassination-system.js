"use strict";

export function prefersAssassination(actor){
  return actor?.path === "assassin" ||
    actor?.path === "poison" ||
    actor?.personalityTraits?.some(key=>["ruthless","cautious","cowardly"].includes(key)) ||
    ["heretical","abyssal"].includes(actor?.align);
}

export function assassinationConflictRecord({actor, target, success=false, score=0, eventId=null}={}){
  return {
    type:"assassination",
    actorId:actor?.id || null,
    targetId:target?.id || null,
    success,
    score:Math.round(score),
    eventId
  };
}
