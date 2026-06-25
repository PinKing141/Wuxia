"use strict";

import { STATE, newId } from "../state.js";
import { factionTypeProfile } from "../data/faction-types.js";
import { REGIONS } from "../data/factions.js";
import { ALIGNMENT_DEFAULT_PROFILES, FACTION_PROFILES } from "../data/path-profiles.js";
import { makeSectName } from "../generators/names.js";
import { pick, ri } from "../utils/random.js";

export function makeSect(opts={}){
  const align = opts.align || pick(["righteous","righteous","righteous","clan","imperial","academy","temple","rogue","heretical","abyssal","hidden"]);
  const nm = opts.name ? {en:opts.name, recordName:opts.name, roman:opts.roman || opts.name, type:opts.type} : makeSectName(align);
  const profile = FACTION_PROFILES[nm.en] || ALIGNMENT_DEFAULT_PROFILES[align];
  const type = opts.type || nm.type || "Sect";
  const typeProfile = factionTypeProfile(type);
  const region = resolveRegion(opts);
  const prestige = opts.prestige != null ? opts.prestige : ri(25,55);
  return {
    id:newId(), kind:"sect", type,
    name:nm.en, recordName:nm.recordName, roman:nm.roman,
    align,
    ideology:opts.ideology || typeProfile.ideology,
    regionId:region?.id || null,
    seatId:null,
    region:opts.region || region?.name || pick(REGIONS),
    paths:opts.paths || [...profile.paths],
    qiTypes:opts.qiTypes || [...profile.qiTypes],
    weakness:opts.weakness || profile.weakness,
    trainingCulture:opts.trainingCulture || profile.trainingCulture || "mixed Jianghu transmission",
    founded:STATE.year,
    prestige,
    wealth:opts.wealth ?? ri(28,58) + typeProfile.wealthBias,
    militaryStrength:opts.militaryStrength ?? ri(20,45) + typeProfile.militaryBias,
    cultivationStrength:opts.cultivationStrength ?? ri(20,45),
    publicReputation:opts.publicReputation ?? prestige,
    internalStability:opts.internalStability ?? ri(42,72) + typeProfile.stabilityBias,
    leaderId:null,
    successorId:null,
    members:[],
    signatureArt:null,
    forbiddenTechniques:[],
    secrets:[],
    currentGoals:[],
    allies:[],
    enemies:[],
    vassals:[],
    grudges:[],
    alive:true, deadYear:null,
    atWarWith:[]
  };
}

function resolveRegion(opts){
  const regions = STATE.regions || [];
  if(!regions.length) return null;
  if(opts.regionId) return regions.find(region=>region.id === opts.regionId) || null;
  if(opts.regionKey) return regions.find(region=>region.key === opts.regionKey) || null;
  if(opts.region) return regions.find(region=>region.name === opts.region) || null;
  return pick(regions);
}
