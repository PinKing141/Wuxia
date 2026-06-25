"use strict";

import { STATE } from "../state.js";

export function warReport(war){
  if(!war) return null;
  return {
    id:war.id,
    name:war.name,
    recordName:war.recordName,
    status:war.status,
    startYear:war.startYear,
    endYear:war.endYear,
    factions:{
      sideA:war.factionAIds.map(factionName).filter(Boolean),
      sideB:war.factionBIds.map(factionName).filter(Boolean)
    },
    publicJustification:war.publicJustification,
    immediateCause:war.immediateCause,
    deepCause:war.deepCause,
    hiddenCause:war.hiddenCause,
    trueMotive:war.trueMotive,
    mainAggressor:factionName(war.mainAggressorId),
    causeEvent:eventSummary(war.causeEventId),
    hiddenCauseEvent:eventSummary(war.hiddenCauseEventId),
    battles:[...(war.battles || [])],
    casualties:[...(war.casualties || [])],
    territoryChanges:[...(war.territoryChanges || [])],
    techniqueLosses:[...(war.techniqueLosses || [])],
    grudgesCreated:[...(war.grudgesCreated || [])],
    winner:war.winner,
    loser:war.loser,
    aftermath:war.aftermath
  };
}

export function warReports({status="all", limit=50}={}){
  return STATE.wars
    .filter(war=>status === "all" || war.status === status)
    .slice(-limit)
    .map(warReport);
}

function factionName(id){
  const faction = STATE.sects.find(item=>item.id === id);
  return faction ? {id:faction.id, name:faction.name, recordName:faction.recordName, alive:faction.alive} : null;
}

function eventSummary(id){
  const event = STATE.log.find(item=>item.id === id);
  if(!event) return null;
  return {
    id:event.id,
    year:event.year,
    type:event.type,
    publicRecord:event.publicRecord || event.html
  };
}
