"use strict";

import { QI_TYPES } from "../data/path-profiles.js";
import { regionById } from "../observer/map-state.js";
import { figById } from "../observer/selectors.js";
import { aliveFigs } from "../observer/selectors.js";
import { chance, clamp, rand, ri } from "../utils/random.js";

export function normalizeCultivationState(figure){
  figure.qiPurity ??= clamp(Math.round((figure.foundationQuality || 50) + ri(-10, 12)), 1, 100);
  figure.mentalState ??= clamp(Math.round((figure.daoHeart || 50) + ri(-12, 12)), 1, 100);
  figure.resources ??= initialResourceLevel(figure);
  figure.pillToxicity ??= 0;
  figure.innerDemon ??= ["heretical", "abyssal"].includes(figure.align) ? ri(8, 28) : ri(0, 8);
  figure.breakthroughHistory ||= [];
  figure.techniqueCompatibility = techniqueCompatibilityFor(figure);
  figure.masterGuidance = masterGuidanceFor(figure);
  return figure;
}

export function cultivationGainFor(figure){
  normalizeCultivationState(figure);
  let gain = ((figure.cultivationTalent ?? figure.talent) / 34) + rand() * 3;
  gain *= 0.78 + ((figure.comprehension || 50) / 440) + ((figure.daoHeart || 50) / 760) + ((figure.foundationQuality || 50) / 920);
  gain *= 0.86 + ((figure.qiPurity || 50) / 520) + ((figure.mentalState || 50) / 680);
  gain *= 0.9 + ((figure.resources || 0) / 720) + ((figure.techniqueCompatibility || 50) / 820) + ((figure.masterGuidance || 0) / 950);
  gain *= 1 - clamp((figure.pillToxicity || 0) / 360, 0, 0.28);
  gain *= 1 - clamp((figure.innerDemon || 0) / 420, 0, 0.22);
  return gain;
}

export function tickCultivationRecovery(){
  for(const figure of aliveFigs()){
    normalizeCultivationState(figure);
    const ambient = initialResourceLevel(figure);
    figure.resources = clamp((figure.resources || 0) + (ambient - (figure.resources || 0)) * 0.08 + ri(-1, 2), 0, 100);
    const mentalTarget = clamp((figure.daoHeart || 50) + (figure.willpower || 50) / 8 - (figure.innerDemon || 0) / 5, 1, 100);
    figure.mentalState = clamp((figure.mentalState || 50) + (mentalTarget - (figure.mentalState || 50)) * 0.06 + ri(-1, 1), 1, 100);
    if((figure.pillToxicity || 0) > 0){
      const recovery = figure.path === "medicine" || figure.qiType === "spiritual" ? 2 : 1;
      figure.pillToxicity = clamp(figure.pillToxicity - recovery, 0, 100);
    }
    if((figure.innerDemon || 0) > 0 && (figure.mentalState || 0) > 65 && chance(.18)){
      figure.innerDemon = clamp(figure.innerDemon - 1, 0, 100);
    }
  }
}

export function useBreakthroughResources(figure){
  normalizeCultivationState(figure);
  const spend = clamp(10 + figure.realm * 2, 8, 34);
  const available = figure.resources || 0;
  figure.resources = clamp(available - Math.min(available, spend), 0, 100);
  if(available >= spend && shouldUsePillShortcut(figure)){
    const toxicity = figure.sect ? ri(2, 5) : ri(4, 9);
    figure.pillToxicity = clamp((figure.pillToxicity || 0) + toxicity, 0, 100);
    figure.foundationQuality = clamp((figure.foundationQuality || 50) - ri(0, 2), 1, 100);
    return {spent:spend, pillShortcut:true, toxicity};
  }
  return {spent:Math.min(available, spend), pillShortcut:false, toxicity:0};
}

export function initialResourceLevel(figure){
  const region = regionById(figure.currentRegionId || figure.sect?.regionId);
  let value = figure.sect ? 28 + (figure.sect.prestige || 0) * 0.38 : 14;
  if(region) value += (region.wealth || 50) * 0.14 + (region.spiritualDensity || 50) * 0.22;
  if(figure.path === "medicine") value += 6;
  if(figure.align === "hidden") value -= 5;
  if(figure.align === "abyssal") value -= 8;
  return clamp(Math.round(value + ri(-8, 8)), 0, 100);
}

export function techniqueCompatibilityFor(figure){
  let score = 48;
  if(figure.art){
    score += figure.art.path === figure.path ? 20 : -8;
    score += figure.art.qiType === figure.qiType ? 16 : -6;
    if(figure.art.align === figure.align) score += 6;
    if((figure.art.corruption || 0) > 45) score -= 8;
  }
  if(figure.sect){
    if(figure.sect.paths?.includes(figure.path)) score += 7;
    if(figure.sect.qiTypes?.includes(figure.qiType)) score += 7;
  }
  if(figure.path === "sword" && figure.qiType === "sword") score += 10;
  if(figure.path === "poison" && figure.qiType === "poison") score += 10;
  if(figure.path === "buddhist" && ["blood", "resentment", "abyssal"].includes(figure.qiType)) score -= 18;
  if(figure.path === "heretical" && ["blood", "resentment"].includes(figure.qiType)) score += 8;
  if(!QI_TYPES[figure.qiType]) score -= 10;
  return clamp(Math.round(score), 1, 100);
}

export function masterGuidanceFor(figure){
  const master = figById(figure.master);
  if(!master || !master.alive) return figure.sect ? 8 : 0;
  const realmLead = Math.max(0, master.realm - figure.realm);
  let score = 12 + realmLead * 9 + (master.comprehension || 50) / 8;
  if(master.path === figure.path) score += 8;
  if(master.qiType === figure.qiType) score += 6;
  return clamp(Math.round(score), 0, 100);
}

function shouldUsePillShortcut(figure){
  if((figure.resources || 0) < 55) return false;
  if(figure.path === "medicine" && figure.daoHeart > 55) return chance(.1);
  if(figure.realm <= 4 && figure.sect) return chance(.22);
  if(["rogue", "heretical", "abyssal"].includes(figure.align)) return chance(.3);
  return chance(.14);
}
