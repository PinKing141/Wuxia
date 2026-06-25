"use strict";

import { STATE, newId } from "../state.js";
import { ALIGNMENT_DEFAULT_PROFILES } from "../data/path-profiles.js";
import { defaultTechniqueCounters, defaultTechniqueRisks, gradeForTier, techniqueTypeFor } from "../data/techniques.js";
import { makeTechniqueName } from "../generators/names.js";
import { clamp, pick, ri } from "../utils/random.js";

export function makeTechnique(align, opts={}){
  const nm = opts.name ? {en:opts.name, recordName:opts.recordName || opts.name, roman:opts.roman || opts.name} : makeTechniqueName();
  const profile = ALIGNMENT_DEFAULT_PROFILES[align];
  const path = opts.path || pick(profile.paths);
  const qiType = opts.qiType || pick(profile.qiTypes);
  const tier = opts.tier ?? ri(2,6);
  const corruption = opts.corruption ?? (align === "abyssal" ? ri(65,95) : align === "heretical" ? ri(35,70) : align === "rogue" ? ri(15,40) : ri(0,12));
  const completeness = opts.completeness ?? clamp(100 - Math.floor(corruption / 4) - (opts.damaged ? ri(12,28) : 0), 35, 100);
  const type = opts.type || techniqueTypeFor({path, qiType, name:nm.en});
  return {
    id:newId(), kind:"art",
    name:nm.en, recordName:nm.recordName, roman:nm.roman,
    type,
    grade:opts.grade || gradeForTier(tier),
    tier,
    align, path, qiType,
    weakness:opts.weakness || profile.weakness,
    corruption,
    creatorId:opts.creatorId || null,
    originFactionId:opts.originFactionId || null,
    currentHolderIds:[],
    pastHolderIds:[],
    publicKnown:opts.publicKnown ?? true,
    forbidden:opts.forbidden ?? (["heretical","abyssal"].includes(align) || ["blood","resentment","abyssal"].includes(qiType) || corruption > 55),
    damaged:Boolean(opts.damaged),
    complete:opts.complete ?? completeness >= 90,
    completeness,
    compatibilityRequirements:opts.compatibilityRequirements || {
      paths:[path],
      qiTypes:[qiType],
      minRealm:Math.max(0, Math.floor(tier / 2) - 1)
    },
    risks:opts.risks || defaultTechniqueRisks({align, qiType, corruption, completeness}),
    counters:opts.counters || defaultTechniqueCounters({path, qiType}),
    parentTechniqueIds:[...(opts.parentTechniqueIds || [])],
    childTechniqueIds:[],
    derivedTechniqueIds:[],
    originalTechniqueId:opts.originalTechniqueId || null,
    version:opts.version || 1,
    history:[],
    lost:false, dormant:false,
    holders:0, origin:STATE.year, createdYear:STATE.year, modifiedYear:null, lostYear:null,
    lostHolder:null
  };
}

export function registerTechniqueHolder(technique, person, opts={}){
  if(!technique || !person) return null;
  technique.currentHolderIds ||= [];
  technique.pastHolderIds ||= [];
  const alreadyHolding = technique.currentHolderIds.includes(person.id);
  if(!alreadyHolding) technique.currentHolderIds.push(person.id);
  if(!technique.pastHolderIds.includes(person.id)) technique.pastHolderIds.push(person.id);
  technique.holders = technique.currentHolderIds.length;
  if(!person.art) person.art = technique;
  if(alreadyHolding && opts.type === "holder_sync") return technique;
  recordTechniqueEvent(technique, {
    type:opts.type || "inherited",
    personId:person.id,
    factionId:opts.factionId || person.sect?.id || null,
    eventId:opts.eventId || null,
    year:opts.year || STATE.year,
    note:opts.note || `${person.name} became a holder.`
  });
  return technique;
}

export function unregisterTechniqueHolder(technique, person, opts={}){
  if(!technique || !person) return null;
  technique.currentHolderIds ||= [];
  technique.pastHolderIds ||= [];
  technique.currentHolderIds = technique.currentHolderIds.filter(id=>id !== person.id);
  if(!technique.pastHolderIds.includes(person.id)) technique.pastHolderIds.push(person.id);
  technique.holders = technique.currentHolderIds.length;
  recordTechniqueEvent(technique, {
    type:opts.type || "holder_lost",
    personId:person.id,
    factionId:opts.factionId || person.sect?.id || null,
    eventId:opts.eventId || null,
    year:opts.year || STATE.year,
    note:opts.note || `${person.name} stopped carrying the technique.`
  });
  return technique;
}

export function recordTechniqueEvent(technique, entry={}){
  if(!technique) return null;
  technique.history ||= [];
  const event = {
    year:entry.year || STATE.year,
    type:entry.type || "notable",
    personId:entry.personId || null,
    factionId:entry.factionId || null,
    relatedTechniqueId:entry.relatedTechniqueId || null,
    eventId:entry.eventId || null,
    note:entry.note || "Technique history changed."
  };
  technique.history.push(event);
  if(technique.history.length > 80) technique.history.shift();
  return event;
}

export function deriveTechnique(parent, creator, opts={}){
  if(!parent) return null;
  const branchName = opts.name || branchTechniqueName(parent, creator, opts);
  const child = makeTechnique(opts.align || parent.align, {
    name:branchName,
    recordName:branchName,
    path:opts.path || parent.path,
    qiType:opts.qiType || parent.qiType,
    tier:clamp((opts.tier ?? parent.tier + ri(-1,1)), 1, 9),
    corruption:clamp((opts.corruption ?? parent.corruption + ri(-8,12)), 0, 100),
    completeness:clamp((opts.completeness ?? parent.completeness + ri(-18,10)), 25, 100),
    creatorId:creator?.id || null,
    originFactionId:creator?.sect?.id || parent.originFactionId || null,
    parentTechniqueIds:[parent.id],
    originalTechniqueId:parent.originalTechniqueId || parent.id,
    publicKnown:opts.publicKnown ?? false,
    damaged:opts.damaged ?? parent.damaged,
    forbidden:opts.forbidden ?? parent.forbidden
  });
  child.version = (parent.version || 1) + 1;
  parent.childTechniqueIds ||= [];
  parent.derivedTechniqueIds ||= [];
  if(!parent.childTechniqueIds.includes(child.id)) parent.childTechniqueIds.push(child.id);
  if(!parent.derivedTechniqueIds.includes(child.id)) parent.derivedTechniqueIds.push(child.id);
  recordTechniqueEvent(parent, {
    type:"branched",
    personId:creator?.id || null,
    relatedTechniqueId:child.id,
    note:`A branch version was created: ${child.name}.`
  });
  recordTechniqueEvent(child, {
    type:"created",
    personId:creator?.id || null,
    relatedTechniqueId:parent.id,
    note:`Derived from ${parent.name}.`
  });
  return child;
}

export function syncTechniqueHolders(technique, figures=STATE.figures){
  if(!technique) return technique;
  technique.currentHolderIds = figures.filter(person=>person.alive && person.art?.id === technique.id).map(person=>person.id);
  technique.pastHolderIds ||= [];
  for(const id of technique.currentHolderIds){
    if(!technique.pastHolderIds.includes(id)) technique.pastHolderIds.push(id);
  }
  technique.holders = technique.currentHolderIds.length;
  return technique;
}

function branchTechniqueName(parent, creator, opts){
  const prefix = opts.prefix || (creator?.personalityTraits?.includes("ruthless") ? "Killing" : creator?.path === "poison" ? "Venom" : creator?.path === "sword" ? "Falling" : "Revised");
  return `${prefix} ${parent.name}`;
}
