"use strict";

import { makeRumour } from "../entities/rumour.js";
import { STATE } from "../state.js";
import { clamp } from "../utils/random.js";

export function registerEventRumour(entry, rumourInput){
  if(!rumourInput) return null;
  if(!STATE.rumours) STATE.rumours = [];
  if(!STATE.rumourc) STATE.rumourc = 1;
  const rumour = makeRumour(rumourInput, entry);
  STATE.rumours.push(rumour);
  entry.rumour = rumour;
  if(!entry.rumourIds.includes(rumour.id)) entry.rumourIds.push(rumour.id);
  entry.tags = [...new Set([...(entry.tags || []), "rumour", rumour.type])];
  return rumour;
}

export function tickRumourSystem(){
  if(!STATE.rumours) return;
  for(const rumour of STATE.rumours){
    const age = Math.max(0, STATE.year - rumour.year);
    const drift = rumour.type === "planted" ? 2 : rumour.type === "imperial_propaganda" ? 1.5 : 0.75;
    rumour.spread = clamp((rumour.spread || 1) + drift + age * 0.01, 1, 100);
    if(["false","planted","exaggerated"].includes(rumour.type)){
      rumour.credibility = clamp((rumour.credibility || 30) - 0.08, 5, 90);
    } else if(rumour.type === "true"){
      rumour.credibility = clamp((rumour.credibility || 65) + 0.03, 5, 95);
    }
  }
}
