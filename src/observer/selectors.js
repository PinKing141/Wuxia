"use strict";

import { STATE } from "../state.js";

export const aliveFigs = ()=>STATE.figures.filter(f=>f.alive);
export const aliveSects = ()=>STATE.sects.filter(s=>s.alive);
export const figById = id=>STATE.figures.find(f=>f.id === id);

export function sectMight(s){
  return s.members.map(figById).filter(x=>x && x.alive).reduce((t, f)=>t + f.power, 0) +
    (s.prestige || 0) * 4 +
    (s.militaryStrength || 0) * 8 +
    (s.cultivationStrength || 0) * 10 +
    (s.wealth || 0) * 2;
}

export function warExists(a, b){
  return STATE.activeWars.some(w=>(w.a === a.id && w.b === b.id) || (w.a === b.id && w.b === a.id));
}

export function topMember(s){
  const members = s.members.map(figById).filter(x=>x && x.alive).sort((a, b)=>b.power - a.power);
  return members[0] || null;
}
