"use strict";

import { STATE } from "../state.js";
import { normalizeEventLinks } from "../simulation/event-system.js";

const TYPE_BY_VERDICT = [
  [/imperial|edict|court/i, "imperial_propaganda"],
  [/cover|sect/i, "sect_cover_up"],
  [/planted/i, "planted"],
  [/false|lie/i, "false"],
  [/exaggerated/i, "exaggerated"],
  [/half|incomplete|mostly/i, "half_true"],
  [/misunderstood|unverified|uncertain/i, "misunderstood"],
  [/true/i, "true"]
];

export function makeRumour(input={}, event=null){
  const source = normalizeRumourInput(input);
  const links = normalizeEventLinks(source, event?.publicRecord, event?.trueRecord, source.note);
  return {
    id:STATE.rumourc++,
    eventId:event?.id || null,
    year:event?.year ?? STATE.year,
    season:event?.season ?? STATE.season,
    type:source.type || rumourTypeFor(source.verdict, source.note, source.plantedBy),
    verdict:source.verdict,
    source:source.source || source.plantedBy || "Jianghu mouths",
    plantedBy:source.plantedBy || null,
    note:source.note || "",
    publicKnown:source.publicKnown ?? true,
    credibility:source.credibility ?? credibilityFor(source.verdict),
    spread:source.spread ?? 1,
    involvedPersonIds:links.involvedPersonIds,
    involvedFactionIds:links.involvedFactionIds,
    involvedTechniqueIds:links.involvedTechniqueIds,
    tags:[...(source.tags || []), "rumour", source.type || rumourTypeFor(source.verdict, source.note, source.plantedBy)]
  };
}

function normalizeRumourInput(input){
  if(typeof input === "string") return {verdict:input, plantedBy:null, note:""};
  if(!input) return {verdict:"Unverified", plantedBy:null, note:""};
  return {
    ...input,
    verdict:input.verdict || input.type || "Unverified",
    plantedBy:input.plantedBy || input.source || null,
    note:input.note || input.detail || ""
  };
}

function rumourTypeFor(verdict="", note="", plantedBy=""){
  const text = `${verdict} ${note} ${plantedBy}`;
  return TYPE_BY_VERDICT.find(([pattern])=>pattern.test(text))?.[1] || "misunderstood";
}

function credibilityFor(verdict=""){
  const normalized = verdict.toLowerCase();
  if(normalized.includes("true")) return 72;
  if(normalized.includes("half") || normalized.includes("mostly") || normalized.includes("incomplete")) return 52;
  if(normalized.includes("false")) return 18;
  if(normalized.includes("planted")) return 28;
  if(normalized.includes("exaggerated")) return 36;
  return 32;
}
