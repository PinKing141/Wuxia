"use strict";

export const REALMS = ["Mortal","Body Tempering","Meridian Opening","Qi Refining","Foundation Establishment","Golden Core","Nascent Soul","Soul Formation","Void Refinement","Body Integration","Mahayana","Tribulation Transcendence","Immortal / Ascended"];
export const REALM_RECORD_NAMES = ["Mortal","Body Tempering","Meridian Opening","Qi Refining","Foundation Establishment","Golden Core","Nascent Soul","Soul Formation","Void Refinement","Body Integration","Mahayana","Tribulation","Ascended"];
export const APEX = REALMS.length - 1;
export const SUB_STAGES = ["Early","Middle","Late","Peak","Half-Step"];

export function subStageIndex(progress){
  if(progress >= 90) return 4;
  if(progress >= 70) return 3;
  if(progress >= 45) return 2;
  if(progress >= 20) return 1;
  return 0;
}

export function subStageName(progress){
  return SUB_STAGES[subStageIndex(progress)];
}

export function realmStageName(realm, progress, record=false){
  const realmName = record ? REALM_RECORD_NAMES[realm] : REALMS[realm];
  if(realm <= 0 || realm >= APEX) return realmName;
  return `${subStageName(progress)} ${realmName}`;
}

export function displayRealmStage(realm, progress){
  const publicName = realmStageName(realm, progress);
  const recordName = realmStageName(realm, progress, true);
  return publicName === recordName ? publicName : `${publicName} (${recordName})`;
}

export const PATH_FLAVOR = {
  righteous:{verb:"entered",via:["through disciplined inner qi circulation","by tempering heart and sword beneath Heaven's law","after studying an orthodox scripture","through a decade of clean foundation work"]},
  clan:{verb:"secured",via:["through inherited clan medicines","under the eyes of the branch elders","by protecting the ancestral canon","after a private family trial"]},
  imperial:{verb:"was recorded by the Imperial Register at",via:["after passing a court examination","through battlefield merit","under state-backed formation training","while serving the Great Xia"]},
  academy:{verb:"comprehended",via:["through scholarly meditation","after interpreting an ancient commentary","by aligning ritual, law, and qi","beneath the Academy observatory"]},
  temple:{verb:"purified the body into",via:["through scripture recitation","after a season of fasting and staff practice","beneath temple bells","by suppressing an inner demon"]},
  rogue:{verb:"forced open",via:["through a perilous shortcut","after stealing a rival's true qi","by risking a dubious pill","in a market-town duel"]},
  heretical:{verb:"seized",via:["through blood arts","by practicing a forbidden scripture","at the price of peace of mind","through soul-burning cultivation"]},
  abyssal:{verb:"survived",via:["while death qi rewrote the meridians","by rejecting Heaven's order","beneath a moonless omen","as the Abyss whispered from within"]},
  hidden:{verb:"quietly reached",via:["in a secluded lineage cave","while listening to mountain rain","after a lifetime of stillness","far beyond the public record"]}
};
