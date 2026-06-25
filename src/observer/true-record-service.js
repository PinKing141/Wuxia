"use strict";

import { STATE } from "../state.js";
import { figById } from "./selectors.js";

export function trueRecordFor(event){
  if(!event) return null;
  return {
    id:event.id,
    publicRecord:event.publicRecord || event.html,
    trueRecord:event.trueRecord || null,
    knownBy:event.knownBy || null,
    knownByPeople:(event.knownByPersonIds || []).map(personSummary).filter(Boolean),
    hiddenCauses:(event.hiddenCauseIds || []).map(eventSummary).filter(Boolean),
    consequences:(event.consequenceIds || []).map(eventSummary).filter(Boolean),
    rumourRecords:(event.rumourIds || []).map(rumourById).filter(Boolean),
    causes:[...(event.causes || [])],
    effects:[...(event.effects || [])],
    tags:[...(event.tags || [])]
  };
}

export function trueRecords({limit=100}={}){
  return STATE.log
    .filter(event=>event.trueRecord || event.hiddenCauseIds?.length || event.knownByPersonIds?.length)
    .slice(-limit)
    .map(trueRecordFor);
}

function eventSummary(id){
  const event = STATE.log.find(item=>item.id === id);
  if(!event) return null;
  return {
    id:event.id,
    year:event.year,
    season:event.season,
    type:event.type,
    importance:event.importance,
    publicRecord:event.publicRecord || event.html
  };
}

function personSummary(id){
  const person = figById(id);
  if(!person) return null;
  return {
    id:person.id,
    name:person.name,
    alive:person.alive,
    factionId:person.sect?.id || null
  };
}

function rumourById(id){
  return STATE.rumours?.find(rumour=>rumour.id === id) || null;
}
