"use strict";

import { CALAMITY_DEFINITIONS, ERA_DEFINITIONS } from "../data/eras.js";
import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { chron, sref } from "../observer/chronicle.js";
import { randomLandmark, randomRegion, regionName } from "../observer/map-state.js";
import { aliveFigs, aliveSects, sectMight } from "../observer/selectors.js";
import { STATE } from "../state.js";
import { chance, clamp, pick, ri } from "../utils/random.js";

export function initializeEraState(){
  const metrics = computeWorldTension();
  const key = eraKeyForMetrics(metrics);
  STATE.worldTension = metrics;
  STATE.era = {
    key,
    name:ERA_DEFINITIONS[key].name,
    recordName:ERA_DEFINITIONS[key].recordName,
    startYear:STATE.year,
    nextCheckYear:STATE.year + ri(20, 45),
    metricsAtStart:metrics
  };
  STATE.eraHistory = [{
    key,
    name:STATE.era.name,
    startYear:STATE.year,
    endYear:null,
    metrics
  }];
  STATE.calamities = [];
}

export function tickEraSystem(){
  if(!STATE.era) initializeEraState();
  const metrics = computeWorldTension();
  STATE.worldTension = metrics;
  maybeTransitionEra(metrics);
  maybeTriggerCalamity(metrics);
}

export function computeWorldTension(){
  const factions = aliveSects();
  const figures = aliveFigs();
  const wars = STATE.activeWars || [];
  const endedWars = (STATE.wars || []).filter(war=>war.status === "ended");
  const recentEvents = (STATE.log || []).filter(event=>STATE.year - event.year <= 30);
  const recentWars = (STATE.wars || []).filter(war=>STATE.year - war.startYear <= 30);
  const recentFalls = STATE.sects.filter(faction=>!faction.alive && faction.deadYear && STATE.year - faction.deadYear <= 35);
  const highRealm = figures.filter(person=>person.realm >= 6).length;
  const youngHighPotential = figures.filter(person=>person.alive && person.age <= 40 && ((person.cultivationTalent || 0) >= 78 || (person.comprehension || 0) >= 82 || person.realm >= 4)).length;
  const demonicFactions = factions.filter(faction=>["heretical","abyssal"].includes(faction.align)).length;
  const demonicFigures = figures.filter(person=>["heretical","abyssal"].includes(person.align) || (person.alignmentDrift || 0) >= 70).length;
  const imperialMight = factions.filter(faction=>faction.align === "imperial" || faction.type === "Dynasty").reduce((total, faction)=>total + sectMight(faction), 0);
  const totalMight = factions.reduce((total, faction)=>total + sectMight(faction), 1);
  const successionDisputes = recentEvents.filter(event=>event.causalType === "succession").length;
  const hiddenMasters = figures.filter(person=>person.alive && (person.align === "hidden" || !person.sect) && person.realm >= 5).length;
  const avgStability = factions.length ? factions.reduce((total, faction)=>total + (faction.internalStability || 50), 0) / factions.length : 50;
  const regionalDanger = (STATE.regions || []).reduce((total, region)=>total + (region.danger || 0) + (region.demonicActivity || 0), 0) / Math.max(1, (STATE.regions || []).length);
  const lostTechniques = (STATE.arts || []).filter(art=>art.lost || art.dormant).length;
  const livingTechniques = Math.max(1, (STATE.arts || []).length);
  const activeCalamity = Boolean(STATE.threatActive || (STATE.calamities || []).some(item=>item.status === "active"));
  const warPressure = clamp(wars.length * 28 + recentWars.length * 5 + recentEvents.filter(event=>["war","memory-war","border-skirmish","dynastic-rebellion"].includes(event.causalType)).length * 1.4, 0, 100);
  const demonicPressure = clamp(demonicFactions * 9 + demonicFigures * 1.2 + regionalDanger * 0.45 + (STATE.threatActive ? 35 : 0), 0, 100);
  const imperialPressure = clamp((imperialMight / totalMight) * 100 + recentEvents.filter(event=>event.causalType === "dynastic-rebellion").length * 5, 0, 100);
  const collapsePressure = clamp(recentFalls.length * 16 + (100 - avgStability) * 0.9 + wars.length * 12, 0, 100);
  const restorationPressure = clamp(recentFalls.length * 9 + endedWars.length * 1.5 - wars.length * 12 + avgStability * 0.35, 0, 100);
  const hiddenPressure = clamp(hiddenMasters * 8 + lostTechniques / livingTechniques * 35, 0, 100);
  const successionPressure = clamp(successionDisputes * 13 + factions.filter(faction=>(faction.internalStability || 50) < 35).length * 8, 0, 100);
  const heroPressure = clamp(youngHighPotential * 4 + highRealm * 2, 0, 100);
  const techniquePressure = clamp(lostTechniques / livingTechniques * 45 + recentEvents.filter(event=>event.type === "technique" || event.causalType === "technique").length * 1.2, 0, 100);
  const resourcePressure = clamp(recentEvents.filter(event=>event.causalType === "resource-dispute" || event.causalType === "regional").length * 2 + regionalDanger * 0.35, 0, 100);
  const worldTension = clamp(warPressure * 0.28 + demonicPressure * 0.23 + collapsePressure * 0.21 + successionPressure * 0.12 + regionalDanger * 0.16, 0, 100);
  return {
    year:STATE.year,
    worldTension,
    warPressure,
    demonicPressure,
    imperialPressure,
    collapsePressure,
    restorationPressure,
    hiddenPressure,
    successionPressure,
    heroPressure,
    highRealmPressure:clamp(highRealm * 7, 0, 100),
    techniquePressure,
    resourcePressure,
    activeCalamity,
    activeWars:wars.length,
    recentFalls:recentFalls.length,
    highRealmExperts:highRealm,
    lostTechniques
  };
}

function maybeTransitionEra(metrics){
  const current = STATE.era;
  const desiredKey = eraKeyForMetrics(metrics);
  const age = STATE.year - current.startYear;
  const shouldCheck = STATE.year >= current.nextCheckYear;
  const forcedByCalamity = metrics.activeCalamity && current.key !== "calamity";
  const forcedRestoration = !metrics.activeCalamity && current.key === "calamity" && metrics.restorationPressure >= 35;
  if(!forcedByCalamity && !forcedRestoration && (!shouldCheck || desiredKey === current.key || age < 20)) return;
  const nextKey = forcedByCalamity ? "calamity" : forcedRestoration ? "restoration" : desiredKey;
  if(nextKey === current.key) {
    current.nextCheckYear = STATE.year + ri(18, 42);
    return;
  }
  const previousHistory = STATE.eraHistory.at(-1);
  if(previousHistory && previousHistory.endYear == null) previousHistory.endYear = STATE.year;
  const next = ERA_DEFINITIONS[nextKey];
  const old = ERA_DEFINITIONS[current.key];
  STATE.era = {
    key:nextKey,
    name:next.name,
    recordName:next.recordName,
    startYear:STATE.year,
    nextCheckYear:STATE.year + ri(20, 70),
    metricsAtStart:metrics
  };
  STATE.eraHistory.push({key:nextKey, name:next.name, startYear:STATE.year, endYear:null, metrics});
  chron(
    "c-peace",
    `The age turns: ${old.name} gives way to <b style="color:var(--gold-bright)">${next.name}</b>. Chroniclers begin a new chapter beneath Heaven.`,
    "major",
    {
      trueRecord:`Era transition followed metrics: world tension ${Math.round(metrics.worldTension)}, war ${Math.round(metrics.warPressure)}, demonic ${Math.round(metrics.demonicPressure)}, imperial ${Math.round(metrics.imperialPressure)}, collapse ${Math.round(metrics.collapsePressure)}, restoration ${Math.round(metrics.restorationPressure)}, hidden masters ${Math.round(metrics.hiddenPressure)}, succession ${Math.round(metrics.successionPressure)}, heroes ${Math.round(metrics.heroPressure)}.`,
      knownBy:"True Record; era chroniclers",
      causalType:"era-transition",
      causes:eraCauses(metrics),
      effects:[
        effect("Era", next.name, next.description),
        effect("Observer", "History gains chapter shape", `Events after Year ${STATE.year} are read under ${next.recordName}.`)
      ],
      beneficiaries:[
        benefit("The observer", "Can read the long rhythm of history instead of isolated events.", "Era labels are interpretation, not control.")
      ],
      tags:["era", nextKey]
    }
  );
}

function maybeTriggerCalamity(metrics){
  if((STATE.calamities || []).some(item=>item.status === "active")) return;
  if(STATE.threatActive) return;
  if(STATE.year < 35) return;
  if(metrics.worldTension < 42 && metrics.demonicPressure < 55 && metrics.warPressure < 55) return;
  const last = (STATE.calamities || []).at(-1);
  if(last && STATE.year - last.year < 24) return;
  const probability = clamp((metrics.worldTension - 35) / 900 + metrics.collapsePressure / 1800 + metrics.demonicPressure / 2200, 0.006, 0.08);
  if(!chance(probability)) return;
  const key = chooseCalamity(metrics);
  triggerCalamity(key, metrics);
}

function triggerCalamity(key, metrics){
  const definition = CALAMITY_DEFINITIONS[key];
  const region = randomRegion();
  const landmark = region ? randomLandmark(region.id) : null;
  const factions = aliveSects();
  const strongest = factions.sort((a, b)=>sectMight(b) - sectMight(a))[0] || null;
  const event = chron(
    key === "great_sect_war" || key === "imperial_purge" ? "c-war" : key === "forbidden_scripture" || key === "ancient_tomb" ? "c-art" : "c-threat",
    calamityPublicRecord(definition, region, landmark, strongest),
    "epic",
    {
      trueRecord:`${definition.name} surfaced because ${definition.pressure} pressure became unstable. Metrics: world tension ${Math.round(metrics.worldTension)}, war ${Math.round(metrics.warPressure)}, demonic ${Math.round(metrics.demonicPressure)}, collapse ${Math.round(metrics.collapsePressure)}, technique ${Math.round(metrics.techniquePressure)}, resource ${Math.round(metrics.resourcePressure)}.`,
      knownBy:"True Record; calamity watchers",
      causalType:"calamity",
      regionId:region?.id || strongest?.regionId || null,
      locationId:landmark?.id || null,
      causes:[
        cause("Pressure", definition.pressure, definition.description),
        cause("World Tension", "Threshold crossed", `${Math.round(metrics.worldTension)} overall tension made a rare calamity possible.`),
        cause("Era", STATE.era?.name || "Unrecorded era", "The current age shaped what kind of disaster could appear.")
      ],
      effects:applyCalamityEffects(key, region, strongest),
      beneficiaries:[
        benefit("Hidden opportunists", "Can move while orthodox powers answer the disaster.", "If exposed, they become targets of the next era."),
        strongest ? benefit(sref(strongest), "Can claim leadership if it responds decisively.", "Failure damages legitimacy.") : benefit("Local survivors", "Gain warnings before distant powers arrive.", "Warnings may draw predators.")
      ],
      rumour:rumour("Half-true", "calamity brokers", "The public signs are real, but the true pressure ledger is hidden."),
      tags:["calamity", key]
    }
  );
  const record = {
    id:STATE.calamityc++,
    key,
    name:definition.name,
    recordName:definition.recordName,
    year:STATE.year,
    status:"active",
    eventId:event.id,
    regionId:region?.id || null,
    pressure:definition.pressure,
    severity:Math.round(clamp(metrics.worldTension * 0.5 + metrics[`${definition.pressure}Pressure`] * 0.35 || metrics.worldTension, 35, 100)),
    resolvedYear:null
  };
  STATE.calamities.push(record);
  STATE.era.nextCheckYear = Math.min(STATE.era.nextCheckYear, STATE.year + 1);
}

export function tickCalamityResolution(){
  if(!STATE.calamities?.length) return;
  for(const calamity of STATE.calamities.filter(item=>item.status === "active")){
    calamity.severity = clamp(calamity.severity - ri(2, 7) + (STATE.activeWars.length ? 2 : 0), 0, 100);
    if(calamity.severity > 25 && !chance(.22)) continue;
    calamity.status = "resolved";
    calamity.resolvedYear = STATE.year;
    const region = STATE.regions.find(item=>item.id === calamity.regionId);
    if(region){
      region.stability = clamp(region.stability + ri(4, 11), 0, 100);
      region.danger = clamp(region.danger - ri(3, 9), 0, 100);
    }
    chron(
      "c-peace",
      `${calamity.name} recedes. Survivors call it victory; the True Record calls it a temporary restoration.`,
      "major",
      {
        trueRecord:`The calamity resolved at severity ${Math.round(calamity.severity)} after ${STATE.year - calamity.year} years. Resolution does not erase the causes that produced it.`,
        knownBy:"True Record; restoration envoys",
        causalType:"restoration",
        regionId:calamity.regionId,
        hiddenCauseIds:[calamity.eventId],
        causes:[
          cause("Aftermath", calamity.name, "The disaster spent enough force for ordinary order to return."),
          cause("Restoration", region ? region.name : "unrecorded region", "Stability returns unevenly.")
        ],
        effects:[
          effect("Era", "Restoration pressure rises", "The next era check may turn toward rebuilding."),
          effect("Memory", "Survivors remember", "Future factions can cite the disaster as proof of legitimacy or failure.")
        ],
        tags:["restoration", "calamity"]
      }
    );
    if(STATE.era) STATE.era.nextCheckYear = Math.min(STATE.era.nextCheckYear, STATE.year + 1);
  }
}

function eraKeyForMetrics(metrics){
  if(metrics.activeCalamity || metrics.worldTension >= 82) return "calamity";
  const scores = {
    collapse:metrics.collapsePressure + metrics.warPressure * 0.35,
    restoration:metrics.restorationPressure + (metrics.activeWars ? -30 : 10),
    sect_rivalry:metrics.warPressure + metrics.successionPressure * 0.25,
    demonic_growth:metrics.demonicPressure,
    imperial_expansion:metrics.imperialPressure,
    succession_wars:metrics.successionPressure + metrics.warPressure * 0.2,
    hidden_masters:metrics.hiddenPressure,
    rising_heroes:metrics.heroPressure,
    peace:100 - metrics.worldTension
  };
  return Object.entries(scores).sort((a, b)=>b[1] - a[1])[0][0];
}

function chooseCalamity(metrics){
  const weighted = [];
  pushWeighted(weighted, "demonic_unification", metrics.demonicPressure);
  pushWeighted(weighted, "heavenly_tribulation", metrics.highRealmPressure);
  pushWeighted(weighted, "ancient_tomb", metrics.hiddenPressure);
  pushWeighted(weighted, "corpse_plague", metrics.demonicPressure + metrics.collapsePressure * 0.4);
  pushWeighted(weighted, "imperial_purge", metrics.imperialPressure + metrics.warPressure * 0.2);
  pushWeighted(weighted, "great_sect_war", metrics.warPressure);
  pushWeighted(weighted, "poison_catastrophe", metrics.resourcePressure);
  pushWeighted(weighted, "dragon_vein_collapse", metrics.collapsePressure + metrics.resourcePressure * 0.4);
  pushWeighted(weighted, "forbidden_scripture", metrics.techniquePressure + metrics.demonicPressure * 0.25);
  return pick(weighted.length ? weighted : Object.keys(CALAMITY_DEFINITIONS));
}

function pushWeighted(list, key, score){
  const count = Math.max(1, Math.round(score / 16));
  for(let i = 0; i < count; i++) list.push(key);
}

function eraCauses(metrics){
  return [
    cause("World Tension", "Overall pressure", `${Math.round(metrics.worldTension)} / 100.`),
    cause("War", "Conflict pressure", `${Math.round(metrics.warPressure)} / 100 with ${metrics.activeWars} active wars.`),
    cause("Demonic", "Forbidden pressure", `${Math.round(metrics.demonicPressure)} / 100.`),
    cause("Collapse", "Institutional damage", `${Math.round(metrics.collapsePressure)} / 100 with ${metrics.recentFalls} recent fallen powers.`)
  ];
}

function calamityPublicRecord(definition, region, landmark, strongest){
  const place = landmark?.name || region?.name || "an unrecorded place";
  if(definition.pressure === "imperial") return `${definition.name} begins as orders and seals move from ${strongest ? strongest.name : "the court"} toward ${place}.`;
  if(definition.pressure === "technique") return `${definition.name}: a forbidden inheritance resurfaces near ${place}, and every ambitious disciple hears the same whisper.`;
  if(definition.pressure === "war") return `${definition.name} erupts; messengers cross ${region ? region.name : "the Jianghu"} faster than truth can follow.`;
  if(definition.pressure === "demonic") return `${definition.name} stains ${place}; the air tastes of death qi, blood qi, and resentment.`;
  return `${definition.name} unfolds near ${place}; the era bends around a disaster no faction can fully claim.`;
}

function applyCalamityEffects(key, region, strongest){
  if(region){
    if(["corpse_plague","dragon_vein_collapse","poison_catastrophe"].includes(key)){
      region.stability = clamp(region.stability - ri(8, 18), 0, 100);
      region.danger = clamp(region.danger + ri(8, 18), 0, 100);
    }
    if(["demonic_unification","corpse_plague","forbidden_scripture"].includes(key)){
      region.demonicActivity = clamp(region.demonicActivity + ri(8, 18), 0, 100);
    }
    if(key === "dragon_vein_collapse"){
      region.spiritualDensity = clamp(region.spiritualDensity - ri(6, 16), 0, 100);
    }
  }
  if(strongest && key === "imperial_purge"){
    strongest.publicReputation = clamp((strongest.publicReputation || 50) + 4, 0, 100);
    strongest.internalStability = clamp((strongest.internalStability || 50) - 5, 0, 100);
  }
  return [
    effect("World", "Calamity pressure rises", "The era system will check whether history has entered an age of calamity."),
    region ? effect("Region", region.name, `Stability ${Math.round(region.stability)}, danger ${Math.round(region.danger)}, demonic activity ${Math.round(region.demonicActivity)}.`) : effect("Region", "Unlocalized pressure", "The calamity has not yet fixed itself to one map record.")
  ];
}
