"use strict";

export const RECORD_SURFACES = [
  {key:"world", label:"World Chronicle", description:"All public and hidden records in one brush line."},
  {key:"ledger", label:"Jianghu Ledger", description:"Events with beneficiaries, costs, debts, prestige, or faction advantage."},
  {key:"imperial", label:"Imperial Register", description:"Dynasty, imperial office, examinations, state formations, and Great Xia records."},
  {key:"true", label:"True Record", description:"Events with hidden truth, causes, or concealed witnesses."},
  {key:"fate", label:"Fate Record", description:"Events with visible causal traces."},
  {key:"war", label:"War Annals", description:"Wars, duels, faction collapses, and open violence."},
  {key:"court", label:"Court Dossier", description:"Imperial, academy, examination, edict, and policy records."},
  {key:"sects", label:"Archive of Sects", description:"Sect, temple, academy, workshop, valley, and cult affairs."},
  {key:"clans", label:"Register of Clans", description:"Clan affairs, succession pressures, and family inheritances."},
  {key:"rumours", label:"Rumours", description:"Romance, gossip, uncertain public talk, and planted stories."},
  {key:"abyss", label:"Abyssal Record", description:"Calamities, death qi, resentment qi, contradiction rites, and corrupted inheritances."}
];

export function eventMatchesRecord(event, key){
  if(key === "world") return true;
  if(key === "ledger") return Boolean(event.beneficiaries?.length) || includesAny(event, ["Jianghu Ledger", "benefit", "beneficiary", "debt", "cost", "prestige", "territory", "leverage"]);
  if(key === "imperial") return includesAny(event, ["Imperial Register", "Great Xia", "Dynasty", "Imperial Chancellor", "imperial", "state-backed", "court examination", "battlefield merit", "state formation"]);
  if(key === "true") return Boolean(event.trueRecord || event.knownBy || event.hiddenCauseIds?.length || event.knownByPersonIds?.length);
  if(key === "fate") return Boolean(event.causes?.length || event.effects?.length || event.hiddenCauseIds?.length || event.consequenceIds?.length);
  if(key === "war") return ["c-war","c-duel","c-fall","c-death"].includes(event.cls) || ["war","grudge"].includes(event.causalType);
  if(key === "court") return includesAny(event, ["Imperial", "Academy", "Great Xia", "Court Dossier", "edict", "examination", "policy"]);
  if(key === "sects") return includesAny(event, ["Sect", "Temple", "Monastery", "Academy", "Palace", "Tower", "Valley", "Alliance", "Cult", "Workshop", "Manor", "Hidden Lineage", "Archive of Sects"]) || ["c-found","c-fall"].includes(event.cls);
  if(key === "clans") return includesAny(event, ["Clan", "Manor", "Tang Clan", "branch", "family", "patriarch", "Patriarch"]) || event.causalType === "inheritance";
  if(key === "rumours") return Boolean(event.rumour || event.rumourIds?.length) || includesAny(event, ["Rumour", "rumour", "whisper", "gossip", "spoken of"]);
  if(key === "abyss") return event.cls === "c-threat" || event.causalType === "calamity" || includesAny(event, ["Abyss", "abyss", "abyssal", "Son of the Abyss", "Abyssal Record"]);
  return true;
}

function includesAny(event, terms){
  const haystack = [
    event.publicRecord,
    event.trueRecord,
    event.knownBy,
    event.locationName,
    event.causalType,
    ...(event.causes || []).map(item=>`${item.kind} ${item.label} ${item.detail}`),
    ...(event.effects || []).map(item=>`${item.kind} ${item.label} ${item.detail}`),
    ...(event.beneficiaries || []).map(item=>`${item.who} ${item.gain} ${item.cost}`),
    event.rumour ? `${event.rumour.verdict} ${event.rumour.plantedBy} ${event.rumour.note}` : "",
    ...(event.tags || []),
    event.type,
    event.importance
  ].filter(Boolean).join(" ");
  return terms.some(term=>haystack.includes(term));
}
