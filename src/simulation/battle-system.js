"use strict";

import { recordWarBattle, recordWarCasualty, recordWarGrudge } from "../entities/war.js";

export function recordBattleResult(war, {
  winner,
  loser,
  eventId=null,
  casualty=null,
  regionId=null,
  summary=""
}={}){
  const battle = recordWarBattle(war, {
    eventId,
    winnerFactionId:winner?.id || null,
    loserFactionId:loser?.id || null,
    regionId:regionId || war?.regionId || winner?.regionId || loser?.regionId || null,
    summary
  });
  if(casualty){
    recordWarCasualty(war, {
      personId:casualty.id,
      name:casualty.name,
      factionId:loser?.id || casualty.sect?.id || null,
      battleId:battle?.id || null,
      cause:summary || "battle casualty"
    });
  }
  return battle;
}

export function recordWarRivalry(war, left, right, eventId=null){
  return recordWarGrudge(war, {
    fromPersonId:left?.id || null,
    toPersonId:right?.id || null,
    eventId,
    type:"battle_rivalry"
  });
}
