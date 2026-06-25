"use strict";

import { CLAN_SURNAMES, EPITHET_PREFIXES, EPITHET_SUFFIXES, GIVEN, SURNAMES } from "../data/names.js";
import { INSTITUTION_TYPES_BY_ALIGN, SECT_PREFIXES } from "../data/factions.js";
import { TECHNIQUE_PREFIXES, TECHNIQUE_SUFFIXES } from "../data/techniques.js";
import { chance, pick } from "../utils/random.js";

export function makeName(){
  if(chance(.22)) return pick(CLAN_SURNAMES) + " " + pick(GIVEN);
  return pick(SURNAMES) + " " + pick(GIVEN);
}

export function makeEpithet(){
  const p = pick(EPITHET_PREFIXES);
  const s = pick(EPITHET_SUFFIXES);
  return { roman: p[0] + s[0], recordName: p[1] + " " + s[1], en: "the " + p[1] + " " + s[1] };
}

export function makeSectName(align){
  const p = pick(SECT_PREFIXES);
  const pool = INSTITUTION_TYPES_BY_ALIGN[align] || INSTITUTION_TYPES_BY_ALIGN.righteous;
  const s = align === "heretical" && chance(.5) ? ["Cult","Cult"] : pick(pool);
  return { roman: p[0] + " " + s[0], recordName: p[1] + " " + s[1], en: p[1] + " " + s[1], type:s[1] };
}

export function makeTechniqueName(){
  const p = pick(TECHNIQUE_PREFIXES);
  const s = pick(TECHNIQUE_SUFFIXES);
  return { roman: p[0] + " " + s[0], recordName: p[1] + " " + s[1], en: p[1] + " " + s[1] };
}
