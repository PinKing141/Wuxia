"use strict";

import { addMemory } from "../entities/memory.js";
import { aliveFigs } from "../observer/selectors.js";
import { STATE, newId } from "../state.js";
import { chance, clamp, ri } from "../utils/random.js";

export const INJURY_TYPES = {
  meridian_backlash:{label:"Meridian backlash", deathRisk:0.006},
  foundation_crack:{label:"Cracked foundation", deathRisk:0.002},
  qi_deviation:{label:"Qi deviation", deathRisk:0.01},
  heart_demon:{label:"Heart demon wound", deathRisk:0.004},
  battle_wound:{label:"Battle wound", deathRisk:0.004}
};

export function addInjury(figure, type, severity=1, source="unknown"){
  figure.injuries ||= [];
  const def = INJURY_TYPES[type] || {label:type, deathRisk:0};
  const injury = {
    id:newId(),
    type,
    label:def.label,
    severity:clamp(Math.round(severity), 1, 10),
    source,
    year:STATE.year,
    recovery:0
  };
  figure.injuries.push(injury);
  if(figure.injuries.length > 8) figure.injuries.shift();
  return injury;
}

export function injuryBurden(figure){
  return (figure.injuries || []).reduce((total, injury)=>total + (injury.severity || 1), 0);
}

export function tickInjuries(){
  for(const figure of aliveFigs()){
    if(!figure.injuries?.length) continue;
    for(const injury of [...figure.injuries]){
      const healing = healingPower(figure);
      injury.recovery = clamp((injury.recovery || 0) + healing + ri(0, 2), 0, 100);
      if(injury.recovery >= 18 + injury.severity * 8){
        injury.severity -= 1;
        injury.recovery = 0;
      }
      if(injury.severity <= 0){
        figure.injuries = figure.injuries.filter(item=>item !== injury);
        if(chance(.18)){
          addMemory(figure, {
            type:"injury_healed",
            emotionalWeight:8,
            publicKnown:false,
            text:`Recovered from ${injury.label}.`
          });
        }
      }
    }
  }
}

export function injuryDeathPressure(figure){
  return (figure.injuries || []).reduce((total, injury)=>{
    const def = INJURY_TYPES[injury.type] || {deathRisk:0};
    return total + def.deathRisk * (injury.severity || 1);
  }, 0);
}

function healingPower(figure){
  let healing = 1;
  if(figure.path === "medicine") healing += 2;
  if(figure.qiType === "spiritual" || figure.qiType === "yang") healing += 1;
  if((figure.resources || 0) > 55) healing += 1;
  if(figure.sect?.paths?.includes("medicine")) healing += 1;
  if((figure.pillToxicity || 0) > 50) healing -= 1;
  return clamp(healing, 0, 6);
}
