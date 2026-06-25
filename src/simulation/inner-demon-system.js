"use strict";

import { addMemory, rememberEvent } from "../entities/memory.js";
import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { chron, ref } from "../observer/chronicle.js";
import { aliveFigs } from "../observer/selectors.js";
import { chance, clamp, ri } from "../utils/random.js";
import { normalizeCultivationState } from "./cultivation-system.js";
import { addInjury } from "./injury-system.js";

export function tickInnerDemons(){
  for(const figure of aliveFigs()){
    normalizeCultivationState(figure);
    const pressure = innerDemonPressure(figure);
    if(pressure <= 0) continue;
    if(chance(clamp(pressure / 900, 0, 0.16))){
      figure.innerDemon = clamp((figure.innerDemon || 0) + ri(2, 7), 0, 100);
      figure.mentalState = clamp((figure.mentalState || 50) - ri(2, 7), 1, 100);
      addMemory(figure, {
        type:"inner_demon_pressure",
        emotionalWeight:-18,
        hidden:true,
        text:"Felt the heart-demon stir during secluded circulation."
      });
    }
    if((figure.innerDemon || 0) >= 62 && chance(clamp((figure.innerDemon - 55) / 260, 0.02, 0.18))){
      eruptInnerDemon(figure);
    }
  }
}

function eruptInnerDemon(figure){
  figure.innerDemon = clamp((figure.innerDemon || 0) - ri(8, 18), 0, 100);
  figure.mentalState = clamp((figure.mentalState || 50) - ri(8, 16), 1, 100);
  figure.alignmentDrift = clamp((figure.alignmentDrift || 0) + ri(2, 8), 0, 100);
  const injury = addInjury(figure, "heart_demon", ri(2, 5), "inner demon eruption");
  const shouldRecord = figure.realm >= 5 || figure.namedAt != null || figure.isThreat || chance(.18);
  if(!shouldRecord) return;
  const event = chron(
    "c-corrupt",
    `${ref(figure)} leaves seclusion pale and silent; rumours say a heart-demon answered from within.`,
    figure.realm >= 7 ? "major" : "normal",
    {
      trueRecord:`The eruption came from mental state ${Math.round(figure.mentalState || 0)}, inner demon pressure ${Math.round(figure.innerDemon || 0)}, pill toxicity ${Math.round(figure.pillToxicity || 0)}, and alignment drift ${Math.round(figure.alignmentDrift || 0)}. The public sees only a troubled seclusion.`,
      knownBy:"True Record; the cultivator; any hidden attendant",
      causalType:"cultivation",
      regionId:figure.currentRegionId || figure.sect?.regionId || null,
      causes:[
        cause("Mental State", "Heart barrier weakens", `${ref(figure)} could not fully calm the mind during circulation.`),
        cause("Fear", "Inner demons", figure.fears?.includes("inner_demons") ? "The fear was already rooted in their dao heart." : "The pressure formed through accumulated strain."),
        cause("Cultivation", "Unstable pressure", `Qi purity ${Math.round(figure.qiPurity || 0)}, pill toxicity ${Math.round(figure.pillToxicity || 0)}, and injury ${injury.label}.`)
      ],
      effects:[
        effect("Injury", "Heart-demon wound", `${ref(figure)} now carries ${injury.label}.`),
        effect("Future Breakthrough", "Risk increases", "Future gates become more dangerous until the wound is healed.")
      ],
      beneficiaries:[
        benefit("Rivals and spies", "May exploit a hidden cultivation wound.", "If exposed, the faction can retaliate.")
      ],
      rumour:rumour("half-true", "The seclusion did go wrong, but the public does not know how close the cultivator came to deviation.")
    }
  );
  rememberEvent(figure, event, {
    type:"inner_demon_eruption",
    emotionalWeight:-36,
    hidden:true,
    text:"Survived a heart-demon eruption during secluded cultivation."
  });
}

function innerDemonPressure(figure){
  let pressure = 0;
  pressure += (figure.alignmentDrift || 0) * 0.8;
  pressure += (figure.pillToxicity || 0) * 0.6;
  pressure += (figure.innerDemon || 0) * 0.7;
  pressure += Math.max(0, 55 - (figure.mentalState || 50)) * 1.2;
  pressure += Math.max(0, 50 - (figure.qiPurity || 50)) * 0.8;
  pressure += (figure.injuries?.length || 0) * 8;
  if(figure.fears?.includes("inner_demons")) pressure += 16;
  if(["heretical", "abyssal"].includes(figure.align)) pressure += 18;
  if(figure.daoHeart > 70) pressure -= 14;
  if(figure.willpower > 70) pressure -= 10;
  return clamp(pressure, 0, 100);
}
