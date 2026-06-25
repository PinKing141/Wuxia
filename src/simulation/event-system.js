"use strict";

const EVENT_TYPE_BY_CLASS = {
  "c-found":"faction_founding",
  "c-peace":"world_state",
  "c-break":"cultivation",
  "c-death":"death",
  "c-threat":"calamity",
  "c-war":"conflict",
  "c-duel":"duel",
  "c-fall":"faction_fall",
  "c-art":"technique",
  "c-lineage":"inheritance",
  "c-lost":"lost_technique",
  "c-rumour":"rumour",
  "c-corrupt":"corruption",
  "c-region":"regional",
  "c-sect":"faction",
  "c-hero":"personal"
};

export function eventTypeFor(cls, causalType=null, publicRecord=""){
  if(causalType) return String(causalType).replace(/\s+/g, "_").toLowerCase();
  if(EVENT_TYPE_BY_CLASS[cls]) return EVENT_TYPE_BY_CLASS[cls];
  const text = stripTags(publicRecord).toLowerCase();
  if(text.includes("war")) return "conflict";
  if(text.includes("rumour") || text.includes("whisper")) return "rumour";
  if(text.includes("manual") || text.includes("art")) return "technique";
  if(text.includes("realm") || text.includes("breakthrough")) return "cultivation";
  return "chronicle";
}

export function importanceFor(level="normal"){
  if(level === "epic") return "epic";
  if(level === "major") return "major";
  return "normal";
}

export function normalizeIdList(value){
  if(value == null) return [];
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map(item=>Number(item?.id ?? item)).filter(Number.isFinite))];
}

export function extractEntityIdsFromRecord(...texts){
  const source = texts.filter(Boolean).join(" ");
  return {
    involvedPersonIds:extractDataIds(source, "person"),
    involvedFactionIds:extractDataIds(source, "faction"),
    involvedTechniqueIds:extractDataIds(source, "technique")
  };
}

export function normalizeEventLinks(variants={}, ...texts){
  const inferred = extractEntityIdsFromRecord(...texts);
  return {
    involvedPersonIds:mergeIds(inferred.involvedPersonIds, variants.involvedPersonIds, variants.personIds, variants.people),
    involvedFactionIds:mergeIds(inferred.involvedFactionIds, variants.involvedFactionIds, variants.factionIds, variants.factions),
    involvedTechniqueIds:mergeIds(inferred.involvedTechniqueIds, variants.involvedTechniqueIds, variants.techniqueIds, variants.techniques),
    knownByPersonIds:mergeIds(variants.knownByPersonIds, variants.witnessPersonIds, variants.witnesses),
    hiddenCauseIds:normalizeIdList(variants.hiddenCauseIds || variants.causeEventIds),
    consequenceIds:normalizeIdList(variants.consequenceIds || variants.effectEventIds)
  };
}

export function tagsForEvent({cls, type, level, causalType, trueRecord, rumour, regionId, locationId}={}){
  const tags = new Set();
  if(cls) tags.add(cls.replace(/^c-/, ""));
  if(type) tags.add(type);
  if(level) tags.add(level);
  if(causalType) tags.add(String(causalType));
  if(trueRecord) tags.add("true-record");
  if(rumour) tags.add("rumour");
  if(regionId) tags.add("regional");
  if(locationId) tags.add("located");
  return [...tags].map(tag=>String(tag).replace(/\s+/g, "-").toLowerCase());
}

export function stripTags(html){
  return String(html || "").replace(/<[^>]*>/g, "");
}

function mergeIds(...groups){
  return [...new Set(groups.flatMap(group=>normalizeIdList(group)))];
}

function extractDataIds(source, kind){
  const ids = [];
  const pattern = new RegExp(`data-${kind}-id=["']?(\\d+)["']?`, "g");
  let match;
  while((match = pattern.exec(source))) ids.push(Number(match[1]));
  return [...new Set(ids)];
}
