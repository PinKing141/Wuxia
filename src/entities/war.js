"use strict";

import { STATE } from "../state.js";

export function makeWar({
  factionA,
  factionB,
  name,
  recordName,
  regionId=null,
  publicJustification="an unresolved Jianghu grievance",
  immediateCause=null,
  deepCause=null,
  hiddenCause=null,
  mainAggressor=null,
  trueMotive=null,
  causeEventId=null,
  hiddenCauseEventId=null,
  sourcePersonIds=[]
}){
  const id = STATE.warc++;
  return {
    id,
    kind:"war",
    name,
    recordName,
    startYear:STATE.year,
    endYear:null,
    start:STATE.year,
    years:0,
    status:"active",
    a:factionA.id,
    b:factionB.id,
    factionAIds:[factionA.id],
    factionBIds:[factionB.id],
    regionId,
    publicJustification,
    immediateCause:immediateCause || publicJustification,
    deepCause:deepCause || "Faction reputation, old grudges, and opportunistic pressure accumulated until restraint failed.",
    hiddenCause:hiddenCause || null,
    trueMotive:trueMotive || null,
    mainAggressorId:mainAggressor?.id || factionA.id,
    causeEventId,
    hiddenCauseEventId,
    sourcePersonIds:[...new Set(sourcePersonIds.filter(Boolean))],
    battles:[],
    casualties:[],
    territoryChanges:[],
    techniqueLosses:[],
    grudgesCreated:[],
    winner:null,
    loser:null,
    aftermath:null
  };
}

export function recordWarBattle(war, battle){
  if(!war) return null;
  const entry = {
    id:`${war.id}-battle-${war.battles.length + 1}`,
    year:STATE.year,
    ...battle
  };
  war.battles.push(entry);
  return entry;
}

export function recordWarCasualty(war, casualty){
  if(!war) return null;
  const entry = {
    year:STATE.year,
    ...casualty
  };
  war.casualties.push(entry);
  return entry;
}

export function recordWarTechniqueLoss(war, technique, reason, eventId=null){
  if(!war || !technique) return null;
  const entry = {
    techniqueId:technique.id,
    name:technique.name,
    reason,
    eventId,
    year:STATE.year
  };
  war.techniqueLosses.push(entry);
  return entry;
}

export function recordWarGrudge(war, grudge){
  if(!war) return null;
  const entry = {
    year:STATE.year,
    ...grudge
  };
  war.grudgesCreated.push(entry);
  return entry;
}

export function finishWar(war, {winner=null, loser=null, aftermath=null}={}){
  if(!war) return null;
  war.status = "ended";
  war.endYear = STATE.year;
  war.winner = winner ? {factionId:winner.id, name:winner.name, recordName:winner.recordName} : null;
  war.loser = loser ? {factionId:loser.id, name:loser.name, recordName:loser.recordName} : null;
  war.aftermath = aftermath || war.aftermath || "The war ends without a clean public reckoning.";
  return war;
}
