"use strict";

import { APEX, REALMS } from "../data/cultivation.js";
import { STATE } from "../state.js";
import { chance, clamp, rand, ri } from "../utils/random.js";
import { normalizeCultivationState, useBreakthroughResources } from "./cultivation-system.js";

export const BREAKTHROUGH_OUTCOMES = {
  success:{label:"Success", success:true},
  flawed_success:{label:"Flawed success", success:true, flawed:true},
  failure:{label:"Failure"},
  severe_backlash:{label:"Severe backlash", injuryType:"meridian_backlash"},
  foundation_damage:{label:"Foundation damage", injuryType:"foundation_crack"},
  qi_deviation:{label:"Qi deviation", injuryType:"qi_deviation"},
  inner_demon:{label:"Inner demon", injuryType:"heart_demon"},
  death:{label:"Death"}
};

export function resolveBreakthroughAttempt(figure){
  normalizeCultivationState(figure);
  const nextRealm = Math.min(APEX, figure.realm + 1);
  const resources = useBreakthroughResources(figure);
  const difficulty = breakthroughDifficulty(figure, nextRealm);
  const support = breakthroughSupport(figure, resources);
  const probability = clamp(0.72 + (support - difficulty) / 125, minChanceFor(figure), maxChanceFor(figure));
  const margin = support - difficulty;
  const type = chance(probability) ? successType(figure, margin, resources) : failureType(figure, difficulty, support);
  return buildOutcome(type, figure, nextRealm, support, difficulty, probability, resources);
}

export function applyBreakthroughOutcome(figure, outcome){
  normalizeCultivationState(figure);
  figure.breakthroughHistory.push({
    year:STATE.year,
    fromRealm:figure.realm,
    toRealm:outcome.nextRealm,
    type:outcome.type,
    support:Math.round(outcome.support),
    difficulty:Math.round(outcome.difficulty),
    probability:Math.round(outcome.probability * 100)
  });
  if(figure.breakthroughHistory.length > 12) figure.breakthroughHistory.shift();

  switch(outcome.type){
    case "success":
      figure.realm = outcome.nextRealm;
      figure.progress = 0;
      figure.foundationQuality = clamp((figure.foundationQuality || 50) + ri(0, 2), 1, 100);
      figure.qiPurity = clamp((figure.qiPurity || 50) + ri(1, 4), 1, 100);
      figure.mentalState = clamp((figure.mentalState || 50) - ri(1, 4), 1, 100);
      break;
    case "flawed_success":
      figure.realm = outcome.nextRealm;
      figure.progress = 0;
      figure.foundationQuality = clamp((figure.foundationQuality || 50) - ri(3, 8), 1, 100);
      figure.qiPurity = clamp((figure.qiPurity || 50) - ri(2, 7), 1, 100);
      figure.mentalState = clamp((figure.mentalState || 50) - ri(4, 10), 1, 100);
      figure.pillToxicity = clamp((figure.pillToxicity || 0) + ri(0, 4), 0, 100);
      break;
    case "failure":
      figure.progress = ri(55, 85);
      figure.mentalState = clamp((figure.mentalState || 50) - ri(4, 9), 1, 100);
      break;
    case "foundation_damage":
      figure.progress = ri(42, 76);
      figure.foundationQuality = clamp((figure.foundationQuality || 50) - ri(7, 14), 1, 100);
      figure.qiPurity = clamp((figure.qiPurity || 50) - ri(2, 6), 1, 100);
      figure.mentalState = clamp((figure.mentalState || 50) - ri(5, 12), 1, 100);
      break;
    case "qi_deviation":
      figure.progress = ri(28, 64);
      figure.qiPurity = clamp((figure.qiPurity || 50) - ri(10, 20), 1, 100);
      figure.mentalState = clamp((figure.mentalState || 50) - ri(6, 14), 1, 100);
      figure.innerDemon = clamp((figure.innerDemon || 0) + ri(4, 12), 0, 100);
      break;
    case "inner_demon":
      figure.progress = ri(34, 70);
      figure.mentalState = clamp((figure.mentalState || 50) - ri(14, 24), 1, 100);
      figure.daoHeart = clamp((figure.daoHeart || 50) - ri(2, 7), 1, 100);
      figure.innerDemon = clamp((figure.innerDemon || 0) + ri(14, 26), 0, 100);
      figure.alignmentDrift = clamp((figure.alignmentDrift || 0) + ri(1, 5), 0, 100);
      break;
    case "severe_backlash":
      figure.progress = ri(20, 56);
      figure.foundationQuality = clamp((figure.foundationQuality || 50) - ri(5, 12), 1, 100);
      figure.qiPurity = clamp((figure.qiPurity || 50) - ri(5, 12), 1, 100);
      figure.mentalState = clamp((figure.mentalState || 50) - ri(8, 18), 1, 100);
      break;
    case "death":
      figure.progress = 100;
      break;
  }
  return outcome;
}

export function breakthroughOutcomeLabel(type){
  return BREAKTHROUGH_OUTCOMES[type]?.label || type;
}

export function isBreakthroughSuccess(outcome){
  return !!BREAKTHROUGH_OUTCOMES[outcome.type]?.success;
}

function buildOutcome(type, figure, nextRealm, support, difficulty, probability, resources){
  const meta = BREAKTHROUGH_OUTCOMES[type] || BREAKTHROUGH_OUTCOMES.failure;
  const severity = type === "severe_backlash" ? ri(4, 7) : type === "qi_deviation" || type === "inner_demon" ? ri(3, 6) : type === "foundation_damage" ? ri(2, 5) : 0;
  return {
    type,
    label:meta.label,
    success:!!meta.success,
    flawed:!!meta.flawed,
    injuryType:meta.injuryType || null,
    injurySeverity:severity,
    nextRealm,
    nextRealmName:REALMS[nextRealm],
    support,
    difficulty,
    probability,
    resources
  };
}

function breakthroughDifficulty(figure, nextRealm){
  let difficulty = 36 + nextRealm * 6.5;
  if(nextRealm >= 5) difficulty += (nextRealm - 4) * 5;
  if(nextRealm >= 8) difficulty += (nextRealm - 7) * 10;
  if(figure.align === "abyssal") difficulty += 10;
  if(figure.align === "heretical") difficulty += 5;
  if((figure.pillToxicity || 0) > 35) difficulty += 6;
  return difficulty;
}

function breakthroughSupport(figure, resources){
  let support = 0;
  support += (figure.cultivationTalent ?? figure.talent) * 0.8;
  support += (figure.comprehension || 50) * 0.42;
  support += (figure.foundationQuality || 50) * 0.72;
  support += (figure.qiPurity || 50) * 0.48;
  support += (figure.mentalState || 50) * 0.42;
  support += (figure.daoHeart || 50) * 0.38;
  support += (figure.willpower || 50) * 0.34;
  support += (figure.luck || 50) * 0.26;
  support += (figure.techniqueCompatibility || 50) * 0.36;
  support += (figure.masterGuidance || 0) * 0.24;
  support += (figure.resources || 0) * 0.16;
  if(resources.pillShortcut) support += 8;
  support -= (figure.pillToxicity || 0) * 0.32;
  support -= (figure.innerDemon || 0) * 0.38;
  support -= (figure.injuries?.length || 0) * 6;
  return support / 4.4;
}

function minChanceFor(figure){
  if(figure.realm <= 2) return 0.78;
  if(figure.realm <= 4) return 0.52;
  if(figure.realm <= 7) return 0.22;
  return 0.06;
}

function maxChanceFor(figure){
  if(figure.realm <= 2) return 0.98;
  if(figure.realm <= 5) return 0.9;
  if(figure.realm <= 8) return 0.72;
  return 0.48;
}

function successType(figure, margin, resources){
  let flawedRisk = 0.03;
  flawedRisk += margin < 8 ? 0.12 : 0;
  flawedRisk += resources.pillShortcut ? 0.11 : 0;
  flawedRisk += (figure.pillToxicity || 0) / 430;
  flawedRisk += (figure.innerDemon || 0) / 500;
  flawedRisk += figure.foundationQuality < 45 ? 0.08 : 0;
  return chance(clamp(flawedRisk, 0.02, 0.42)) ? "flawed_success" : "success";
}

function failureType(figure, difficulty, support){
  const risk = clamp((difficulty - support) + (figure.pillToxicity || 0) * 0.4 + (figure.innerDemon || 0) * 0.5 + (100 - (figure.mentalState || 50)) * 0.2, 0, 100);
  const roll = rand();
  if(figure.realm >= 7 && risk > 38 && roll < 0.035) return "death";
  if((figure.innerDemon || 0) > 45 || (figure.mentalState || 50) < 34 || figure.fears?.includes("inner_demons")){
    if(roll < 0.22 + risk / 360) return "inner_demon";
  }
  if((figure.qiPurity || 50) < 42 || (figure.pillToxicity || 0) > 32 || figure.fears?.includes("qi_deviation")){
    if(roll < 0.3 + risk / 320) return "qi_deviation";
  }
  if(risk > 42 && roll < 0.44) return "severe_backlash";
  if((figure.foundationQuality || 50) < 50 || risk > 24){
    if(roll < 0.62) return "foundation_damage";
  }
  return "failure";
}
