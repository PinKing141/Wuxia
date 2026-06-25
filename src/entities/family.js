"use strict";

import { STATE, newId } from "../state.js";

export function surnameFromName(name="Unknown"){
  return String(name).trim().split(/\s+/)[0] || "Unknown";
}

export function familyById(id){
  return STATE.families?.find(family=>family.id === id) || null;
}

export function getOrCreateFamily({surname, regionId=null, factionId=null}={}){
  if(!STATE.families) STATE.families = [];
  const key = `${surname || "Unknown"}:${regionId || "wandering"}`;
  let family = STATE.families.find(item=>item.key === key);
  if(!family){
    family = {
      id:newId(),
      kind:"family",
      key,
      surname:surname || "Unknown",
      name:`${surname || "Unknown"} Family`,
      regionId,
      memberIds:[],
      factionIds:[],
      prestige:0,
      secrets:[],
      grudges:[]
    };
    STATE.families.push(family);
  }
  if(factionId && !family.factionIds.includes(factionId)) family.factionIds.push(factionId);
  return family;
}

export function attachFamily(person, opts={}){
  const surname = opts.surname || surnameFromName(person.name);
  const family = opts.familyId
    ? familyById(opts.familyId)
    : getOrCreateFamily({surname, regionId:opts.regionId || person.birthplaceRegionId, factionId:opts.factionId || person.sect?.id || null});
  if(!family) return null;
  person.familyId = family.id;
  if(!family.memberIds.includes(person.id)) family.memberIds.push(person.id);
  family.prestige = Math.max(family.prestige, Math.round((person.realm || 0) * 6 + (person.fame || 0)));
  return family;
}

