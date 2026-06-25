"use strict";

import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { chron } from "../observer/chronicle.js";
import { randomLandmark, randomRegion } from "../observer/map-state.js";
import { clamp, chance, pick, ri } from "../utils/random.js";

export function tickRegionalEvents(){
  if(!chance(.22)) return;
  const region = randomRegion();
  if(!region) return;
  const event = pick([
    herbMatures,
    tradeRoadStrained,
    forbiddenZoneStirs,
    ancientRuinShifts,
    spiritualTide
  ])(region);
  chron(event.cls, event.publicRecord, event.level, {
    trueRecord:event.trueRecord,
    knownBy:event.knownBy,
    causalType:"regional",
    regionId:region.id,
    locationId:event.landmark?.id || null,
    causes:event.causes,
    effects:event.effects,
    beneficiaries:event.beneficiaries,
    rumour:event.rumour
  });
}

function herbMatures(region){
  const landmark = randomLandmark(region.id, "Cultivation Site") || randomLandmark(region.id);
  region.wealth = clamp(region.wealth + ri(1,4), 0, 100);
  region.danger = clamp(region.danger + ri(0,3), 0, 100);
  return {
    cls:"c-found2",
    level:"normal",
    landmark,
    publicRecord:`In ${landmark?.name || region.name}, a rare spirit herb matures; healers, thieves, and wandering cultivators begin moving quietly.`,
    trueRecord:`The herb matured because ${region.name}'s spiritual density stands at ${Math.round(region.spiritualDensity)} while local danger stands at ${Math.round(region.danger)}. Treasure will draw both medicine and knives.`,
    knownBy:"True Record; local herb gatherers",
    causes:[
      cause("Spiritual Density", region.name, `${Math.round(region.spiritualDensity)} spiritual density feeds rare growth.`),
      cause("Location", landmark?.type || "Region", landmark?.name || region.name)
    ],
    effects:[
      effect("Region", "Treasure pressure rises", `${region.name} grows wealthier and more dangerous.`)
    ],
    beneficiaries:[
      benefit("Medicine seekers", "Gain a possible healing or breakthrough material.", "The harvest site may become a battlefield.")
    ]
  };
}

function tradeRoadStrained(region){
  const landmark = randomLandmark(region.id, "Trade Route") || randomLandmark(region.id, "River") || randomLandmark(region.id);
  region.stability = clamp(region.stability - ri(2,5), 0, 100);
  region.wealth = clamp(region.wealth - ri(1,3), 0, 100);
  return {
    cls:"c-war",
    level:"normal",
    landmark,
    publicRecord:`Merchants along ${landmark?.name || region.name} report missing caravans. Local powers blame bandits, taxes, and each other.`,
    trueRecord:`The road trouble is a symptom of regional pressure: wealth ${Math.round(region.wealth)}, stability ${Math.round(region.stability)}, and population pressure ${Math.round(region.populationPressure)} have fallen out of balance.`,
    knownBy:"True Record; caravan accountants",
    causes:[
      cause("Wealth", "Trade temptation", `${region.name} still carries wealth ${Math.round(region.wealth)}.`),
      cause("Stability", "Weak patrols", `Stability has slipped to ${Math.round(region.stability)}.`)
    ],
    effects:[
      effect("Faction", "Accusations spread", "Nearby powers gain excuses to inspect, tax, or threaten travellers.")
    ],
    beneficiaries:[
      benefit("Rogue cultivators", "Can hide movement inside caravan disorder.", "Imperial scrutiny may follow.")
    ],
    rumour:rumour("Unverified", "roadside storytellers", "Bandit stories may hide faction scouts or a local official's scheme.")
  };
}

function forbiddenZoneStirs(region){
  const landmark = randomLandmark(region.id, "Forbidden Zone") || randomLandmark(region.id);
  region.demonicActivity = clamp(region.demonicActivity + ri(3,7), 0, 100);
  region.danger = clamp(region.danger + ri(2,6), 0, 100);
  return {
    cls:"c-corrupt",
    level:region.demonicActivity > 65 ? "major" : "normal",
    landmark,
    publicRecord:`Uneasy lights rise above ${landmark?.name || region.name}. Villagers shut their doors before sunset.`,
    trueRecord:`The omen comes from ${region.name}'s hidden pressure: demonic activity has climbed to ${Math.round(region.demonicActivity)}, and a forbidden site is answering old resentment.`,
    knownBy:"True Record; frightened locals",
    causes:[
      cause("Demonic Activity", region.name, `${Math.round(region.demonicActivity)} corruption pressure.`),
      cause("Forbidden Zone", landmark?.name || region.name, "Old seals are weakening.")
    ],
    effects:[
      effect("Region", "Danger rises", `${region.name} becomes less safe for travel and secluded cultivation.`)
    ],
    beneficiaries:[
      benefit("Heretical wanderers", "Can use the disturbance as cover.", "Righteous patrols may be drawn in.")
    ]
  };
}

function ancientRuinShifts(region){
  const landmark = randomLandmark(region.id, "Ancient Ruin") || randomLandmark(region.id);
  region.spiritualDensity = clamp(region.spiritualDensity + ri(1,4), 0, 100);
  region.stability = clamp(region.stability - ri(1,4), 0, 100);
  return {
    cls:"c-art",
    level:"normal",
    landmark,
    publicRecord:`Stone doors shift within ${landmark?.name || region.name}. No one admits entering, but fresh footprints surround the ruin.`,
    trueRecord:`The ruin shifted because old spiritual veins under ${region.name} are moving. Spiritual density now stands at ${Math.round(region.spiritualDensity)}.`,
    knownBy:"True Record; ruin watchers",
    causes:[
      cause("Spiritual Vein", "Regional movement", `${region.name} has spiritual density ${Math.round(region.spiritualDensity)}.`),
      cause("Ruin", landmark?.name || region.name, "Ancient formations moved without visible hands.")
    ],
    effects:[
      effect("Inheritance", "Exploration pressure", "Manuals, bones, or traps may surface later.")
    ],
    beneficiaries:[
      benefit("Hidden witnesses", "Learn the ruin moved before public factions organize.", "")
    ]
  };
}

function spiritualTide(region){
  const landmark = randomLandmark(region.id, "Mountain") || randomLandmark(region.id, "River") || randomLandmark(region.id);
  region.spiritualDensity = clamp(region.spiritualDensity + ri(2,5), 0, 100);
  region.populationPressure = clamp(region.populationPressure + ri(1,3), 0, 100);
  return {
    cls:"c-peace",
    level:"normal",
    landmark,
    publicRecord:`A clean tide of spiritual qi passes through ${landmark?.name || region.name}; secluded cultivators report easier breathing and clearer dreams.`,
    trueRecord:`The tide improves cultivation conditions but will also draw migration. ${region.name} now has spiritual density ${Math.round(region.spiritualDensity)} and population pressure ${Math.round(region.populationPressure)}.`,
    knownBy:"True Record; local omen readers",
    causes:[
      cause("Spiritual Tide", region.name, "Heaven-earth qi moved through the region."),
      cause("Landmark", landmark?.type || "Region", landmark?.name || region.name)
    ],
    effects:[
      effect("Cultivation", "Regional opportunity", "More cultivators may travel here for secluded practice.")
    ],
    beneficiaries:[
      benefit("Local cultivators", "Gain a temporary cultivation environment.", "The opportunity may attract outsiders.")
    ]
  };
}
