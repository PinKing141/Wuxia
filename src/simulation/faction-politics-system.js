"use strict";

import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { chron, sref } from "../observer/chronicle.js";
import { aliveSects, sectMight, warExists } from "../observer/selectors.js";
import { chance, clamp, pick } from "../utils/random.js";

export function tickFactionPoliticsSystem(){
  if(chance(.24)) maybeDiplomaticShift();
  if(chance(.08)) maybeVassalPressure();
}

function maybeDiplomaticShift(){
  const factions = aliveSects();
  if(factions.length < 2) return;
  const a = pick(factions);
  let b = pick(factions);
  let guard = 0;
  while(a === b && guard++ < 6) b = pick(factions);
  if(a === b) return;
  const score = diplomaticScore(a, b);
  if(score >= 26){
    addUnique(a.allies, b.id);
    addUnique(b.allies, a.id);
    a.enemies = a.enemies.filter(id=>id !== b.id);
    b.enemies = b.enemies.filter(id=>id !== a.id);
    chron(
      "c-peace",
      `${sref(a)} and ${sref(b)} sign a quiet alliance, each needing the other's leverage.`,
      "normal",
      {
        trueRecord:`The alliance came from diplomatic score ${Math.round(score)}, compatible ideology, shared enemies, and practical pressure. It is not guaranteed to survive a stronger opportunity.`,
        knownBy:"True Record; diplomatic envoys",
        causalType:"faction-politics",
        regionId:a.regionId || b.regionId,
        causes:[
          cause("Ideology", "Compatible pressure", `${a.ideology} can coexist with ${b.ideology}.`),
          cause("Need", "Faction goals", `${sref(a)} pursues ${a.currentGoals?.[0]?.label || "advantage"}; ${sref(b)} pursues ${b.currentGoals?.[0]?.label || "advantage"}.`)
        ],
        effects:[
          effect("Diplomacy", "Alliance formed", "Future wars and faction events can read this alliance.")
        ],
        beneficiaries:[
          benefit(sref(a), "Gains an ally.", "Alliance obligations can drag it into conflict."),
          benefit(sref(b), "Gains an ally.", "Alliance obligations can drag it into conflict.")
        ]
      }
    );
    return;
  }
  if(score <= -26 && !warExists(a, b)){
    addUnique(a.enemies, b.id);
    addUnique(b.enemies, a.id);
    a.allies = a.allies.filter(id=>id !== b.id);
    b.allies = b.allies.filter(id=>id !== a.id);
    a.grudges.push({year:a.founded, type:"diplomatic_enemy", targetId:b.id});
    b.grudges.push({year:b.founded, type:"diplomatic_enemy", targetId:a.id});
    chron(
      "c-war",
      `${sref(a)} and ${sref(b)} name each other enemies after a failed exchange of envoys.`,
      "normal",
      {
        trueRecord:`The enmity came from diplomatic score ${Math.round(score)}, incompatible alignments, regional pressure, and faction weaknesses. This is a stored enemy relation, not yet full war.`,
        knownBy:"True Record; spies",
        causalType:"faction-politics",
        regionId:a.regionId || b.regionId,
        causes:[
          cause("Ideology", "Incompatibility", `${a.ideology} clashes with ${b.ideology}.`),
          cause("Weakness", a.name, a.weakness),
          cause("Weakness", b.name, b.weakness)
        ],
        effects:[
          effect("Diplomacy", "Enemy relation stored", "Future conflicts can escalate from this diplomatic state.")
        ],
        beneficiaries:[
          benefit("War brokers and spies", "Can exploit a declared enemy relation.", "")
        ],
        rumour:rumour("Half-true", "border envoys", "The public dispute is real, but the hidden ledger records older pressure.")
      }
    );
  }
}

function maybeVassalPressure(){
  const factions = aliveSects();
  if(factions.length < 2) return;
  const overlord = pick([...factions].sort((a, b)=>sectMight(b) - sectMight(a)).slice(0, 5));
  const candidates = factions.filter(faction=>faction !== overlord && faction.regionId === overlord.regionId && sectMight(overlord) > sectMight(faction) * 1.8);
  if(!candidates.length) return;
  const vassal = pick(candidates);
  if(overlord.vassals.includes(vassal.id)) return;
  addUnique(overlord.vassals, vassal.id);
  vassal.internalStability = clamp((vassal.internalStability || 50) - 4, 0, 100);
  overlord.publicReputation = clamp((overlord.publicReputation || 50) + 2, 0, 100);
  chron(
    "c-sect",
    `${sref(vassal)} bends to ${sref(overlord)} as a regional vassal power.`,
    "normal",
    {
      trueRecord:`Vassalage followed regional pressure and might ratio: ${Math.round(sectMight(overlord))} to ${Math.round(sectMight(vassal))}. The weaker house survives by yielding autonomy.`,
      knownBy:"True Record; regional envoys",
      causalType:"faction-politics",
      regionId:overlord.regionId,
      causes:[
        cause("Might", "Overlord pressure", `${sref(overlord)} greatly outmatches ${sref(vassal)}.`),
        cause("Region", "Same territory", "Shared territory made neutrality expensive.")
      ],
      effects:[
        effect("Diplomacy", "Vassal relation stored", `${sref(overlord)} gains a subordinate power.`)
      ],
      beneficiaries:[
        benefit(sref(overlord), "Gains regional leverage.", "Vassals can rebel if the overlord weakens."),
        benefit(sref(vassal), "Survives under protection.", "Loses autonomy and face.")
      ]
    }
  );
}

function diplomaticScore(a, b){
  let score = 0;
  if(a.align === b.align) score += 24;
  if(a.type === b.type) score += 8;
  if(a.regionId === b.regionId) score -= 8;
  if(a.enemies?.some(id=>b.enemies?.includes(id))) score += 14;
  if(opposed(a, b)) score -= 36;
  if(a.currentGoals?.some(goal=>["broker_alliance","preserve_neutrality","advise_court"].includes(goal.key))) score += 8;
  if(b.currentGoals?.some(goal=>["broker_alliance","preserve_neutrality","advise_court"].includes(goal.key))) score += 8;
  if(a.currentGoals?.some(goal=>["spread_fear","corrupt_elites","weaken_enemy"].includes(goal.key))) score -= 8;
  if(b.currentGoals?.some(goal=>["spread_fear","corrupt_elites","weaken_enemy"].includes(goal.key))) score -= 8;
  return score;
}

function opposed(a, b){
  return (["righteous","temple"].includes(a.align) && ["heretical","abyssal"].includes(b.align)) ||
    (["righteous","temple"].includes(b.align) && ["heretical","abyssal"].includes(a.align)) ||
    (a.align === "imperial" && b.align === "abyssal") ||
    (b.align === "imperial" && a.align === "abyssal");
}

function addUnique(list, id){
  if(!list.includes(id)) list.push(id);
}
