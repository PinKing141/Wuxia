"use strict";

import { REGION_ALIASES, REGION_BLUEPRINTS } from "../data/regions.js";
import { makeRegion } from "../entities/region.js";
import { STATE, newId } from "../state.js";
import { pick } from "../utils/random.js";

export function createMapState(){
  const regions = [];
  const landmarks = [];
  for(const blueprint of REGION_BLUEPRINTS){
    const made = makeRegion(blueprint);
    regions.push(made.region);
    landmarks.push(...made.landmarks);
  }
  return {regions, landmarks};
}

export function regionKeyForName(name){
  return REGION_ALIASES[name] || REGION_BLUEPRINTS.find(region=>region.name === name)?.key || null;
}

export function regionForSeed(seedPower){
  if(!STATE.regions?.length) return null;
  const key = seedPower.regionKey || regionKeyForName(seedPower.region);
  return STATE.regions.find(region=>region.key === key) || null;
}

export function pickWorldRegion(){
  const regions = STATE.regions || [];
  return regions.length ? pick(regions) : null;
}

export function addFactionSeat(faction){
  const region = STATE.regions.find(item=>item.id === faction.regionId) || pickWorldRegion();
  if(!region) return null;
  const landmark = {
    id:newId(),
    kind:"landmark",
    regionId:region.id,
    type:"Faction Seat",
    name:`${faction.name} Seat`,
    danger:Math.max(10, Math.round(region.danger * 0.6)),
    status:"active",
    controllerFactionId:faction.id
  };
  faction.regionId = region.id;
  faction.region = region.name;
  faction.seatId = landmark.id;
  region.landmarkIds.push(landmark.id);
  if(!region.dominantFactionId || faction.prestige > ((STATE.sects.find(s=>s.id === region.dominantFactionId)?.prestige) || 0)){
    region.dominantFactionId = faction.id;
  }
  STATE.landmarks.push(landmark);
  return landmark;
}
