"use strict";

import { eventTypeFor, importanceFor, normalizeEventLinks, tagsForEvent } from "../simulation/event-system.js";

export function makeChronicleEvent({
  id,
  year,
  season,
  cls,
  publicRecord,
  level="normal",
  regionId=null,
  locationId=null,
  locationName=null,
  variants={}
}){
  const trueRecord = variants.trueRecord || null;
  const causes = variants.causes || (trueRecord ? [{kind:"True Record", label:"Hidden pressure", detail:trueRecord}] : []);
  const effects = variants.effects || [];
  const beneficiaries = variants.beneficiaries || [];
  const knownBy = variants.knownBy || null;
  const linkText = [
    publicRecord,
    trueRecord,
    knownBy,
    ...causes.map(item=>`${item.kind || ""} ${item.label || ""} ${item.detail || ""}`),
    ...effects.map(item=>`${item.kind || ""} ${item.label || ""} ${item.detail || ""}`),
    ...beneficiaries.map(item=>`${item.who || ""} ${item.gain || ""} ${item.cost || ""}`)
  ];
  const links = normalizeEventLinks(variants, ...linkText);
  if(!links.knownByPersonIds.length && knownBy && links.involvedPersonIds.length && /cultivator|betrayer|assassin|teacher|disciple|founder|witness|champion|survivor/i.test(knownBy)){
    links.knownByPersonIds = links.involvedPersonIds.slice(0, 4);
  }
  const type = variants.type || variants.eventType || eventTypeFor(cls, variants.causalType, publicRecord);
  const importance = variants.importance || importanceFor(level);

  return {
    id,
    year,
    season,
    cls,
    type,
    importance,
    regionId,
    locationId,
    locationName,
    html:publicRecord,
    publicRecord,
    trueRecord,
    knownBy,
    causes,
    effects,
    beneficiaries,
    rumour:null,
    rumourIds:[],
    causalType:variants.causalType || null,
    level,
    involvedPersonIds:links.involvedPersonIds,
    involvedFactionIds:links.involvedFactionIds,
    involvedTechniqueIds:links.involvedTechniqueIds,
    knownByPersonIds:links.knownByPersonIds,
    hiddenCauseIds:links.hiddenCauseIds,
    consequenceIds:links.consequenceIds,
    tags:[...new Set([...(variants.tags || []), ...tagsForEvent({
      cls,
      type,
      level,
      causalType:variants.causalType,
      trueRecord,
      rumour:variants.rumour,
      regionId,
      locationId
    })])]
  };
}
