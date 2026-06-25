"use strict";

import { addMemory, rememberEvent } from "../entities/memory.js";
import { relationshipById, upsertRelationshipPair } from "../entities/relationship.js";
import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { chron, ref, sref } from "../observer/chronicle.js";
import { aliveFigs, figById, warExists } from "../observer/selectors.js";
import { STATE } from "../state.js";
import { chance, clamp, pick, rand, ri } from "../utils/random.js";
import { prefersAssassination, assassinationConflictRecord } from "./assassination-system.js";
import { duelConflictRecord } from "./duel-system.js";
import { addInjury } from "./injury-system.js";
import { addHumiliationMemory, memoryPressureBetween } from "./memory-system.js";
import { startStructuredWar } from "./war-system.js";

export function tickGrudgeSystem({killFigure}={}){
  if(!chance(.32)) return;
  const candidate = pickBestCandidate();
  if(!candidate || candidate.score < 42) return;
  if(candidate.score >= 96 && canStartMemoryWar(candidate) && chance(.18)){
    startMemoryWar(candidate);
    return;
  }
  if(candidate.score >= 78 && prefersAssassination(candidate.actor) && chance(.38)){
    assassinationAttempt(candidate, killFigure);
    return;
  }
  if(candidate.score >= 62 && chance(.55)){
    revengeDuel(candidate, killFigure);
    return;
  }
  publicHumiliation(candidate);
}

function pickBestCandidate(){
  const candidates = [];
  for(const actor of aliveFigs()){
    const targets = new Map();
    for(const targetId of actor.grudges || []){
      const target = figById(targetId);
      if(target?.alive) targets.set(target.id, target);
    }
    for(const relationshipId of actor.relationships || []){
      const relationship = relationshipById(relationshipId);
      const target = figById(relationship?.toId);
      if(target?.alive) targets.set(target.id, target);
    }
    for(const target of targets.values()){
      const score = grudgeScore(actor, target);
      if(score >= 34) candidates.push({actor, target, score});
    }
  }
  candidates.sort((a, b)=>b.score - a.score);
  return candidates[0] || null;
}

function grudgeScore(actor, target){
  let score = memoryPressureBetween(actor, target);
  for(const relationshipId of actor.relationships || []){
    const relationship = relationshipById(relationshipId);
    if(!relationship || relationship.toId !== target.id) continue;
    const feelings = relationship.feelings || {};
    score += (feelings.resentment || 0) * 0.8;
    score += (feelings.hatred || 0) * 1.1;
    score += (feelings.envy || 0) * 0.5;
    score += Math.max(0, -(feelings.trust || 0)) * 0.5;
    if(["enemy", "betrayer", "betrayed", "killer"].includes(relationship.type)) score += 18;
    if(relationship.lastEscalatedYear && STATE.year - relationship.lastEscalatedYear < 8) score -= 25;
  }
  if(actor.personalityTraits?.includes("vengeful")) score += 14;
  if(actor.personalityTraits?.includes("jealous")) score += 8;
  if(actor.personalityTraits?.includes("ruthless")) score += 8;
  if(actor.personalityTraits?.includes("cowardly")) score -= 8;
  if(actor.ambitions?.some(key=>["avenge_family","destroy_rival_faction","surpass_senior","prove_talent"].includes(key))) score += 12;
  if(actor.fears?.includes("public_disgrace")) score += 4;
  if(actor.power > target.power * 0.75) score += 6;
  if(actor.power < target.power * 0.45) score -= 10;
  return clamp(score, 0, 140);
}

function publicHumiliation({actor, target, score}){
  const event = chron(
    "c-duel",
    `${ref(actor)} publicly challenges ${ref(target)}, turning an old private resentment into open humiliation.`,
    "normal",
    {
      trueRecord:`The challenge came from stored memory pressure, not chance: grudge score ${Math.round(score)}, memory pressure ${Math.round(memoryPressureBetween(actor, target))}, ambition ${actor.ambitions?.[0] || "none"}, and temperament ${actor.personalityTraits?.[0] || "unknown"}.`,
      knownBy:"True Record; nearby witnesses",
      causalType:"memory",
      regionId:actor.currentRegionId || target.currentRegionId || actor.sect?.regionId || target.sect?.regionId || null,
      causes:[
        cause("Memory", "Unresolved resentment", `${ref(actor)} has remembered ${ref(target)} too sharply to remain silent.`),
        cause("Relationship", "Public face", "Private pressure has crossed into public reputation."),
        cause("Ambition", actor.ambitions?.[0] || "unknown", "The actor's life goal made silence costly.")
      ],
      effects:[
        effect("Grudge", "Humiliation recorded", `${ref(target)} now has a fresh reason to retaliate.`)
      ],
      beneficiaries:[
        benefit(ref(actor), "Forces the grievance into public view.", "The target may answer with a sharper blade later.")
      ]
    }
  );
  event.conflict = duelConflictRecord({actor, target, score, eventId:event.id});
  addHumiliationMemory(target, actor, event);
  rememberEvent(actor, event, {type:"public_challenge", relatedPersonId:target.id, emotionalWeight:18, publicKnown:true});
  upsertRelationshipPair(actor, target, "rival",
    {resentment:12, hatred:3, respect:-2},
    {resentment:22, hatred:8, trust:-10},
    {sourceEventId:event.id, publicKnown:true, note:"Public humiliation escalated a stored grudge."}
  );
  markEscalated(actor, target);
}

function revengeDuel({actor, target, score}, killFigure){
  const actorScore = actor.power + (actor.combatInstinct || 50) * 1.4 + (actor.luck || 50) * 0.5 + rand() * 80;
  const targetScore = target.power + (target.combatInstinct || 50) * 1.4 + (target.luck || 50) * 0.5 + rand() * 80;
  const winner = actorScore >= targetScore ? actor : target;
  const loser = winner === actor ? target : actor;
  const deathBlow = score >= 100 && chance(.18);
  const injury = deathBlow ? null : addInjury(loser, "battle_wound", ri(2, 6), "memory-driven revenge duel");
  const event = chron(
    "c-duel",
    `${ref(actor)} finally answers an old grudge and duels ${ref(target)}. ${ref(winner)} wins; ${deathBlow ? "blood closes the account" : `${injury.label} keeps the debt alive`}.`,
    deathBlow || score >= 96 ? "major" : "normal",
    {
      trueRecord:`This duel was selected by stored causality: grudge score ${Math.round(score)}, actor memory pressure ${Math.round(memoryPressureBetween(actor, target))}, hatred and resentment across relationship records, and an opportunity created by shared region or reputation overlap.`,
      knownBy:"True Record; duel witnesses",
      causalType:"memory",
      regionId:actor.currentRegionId || target.currentRegionId || null,
      causes:[
        cause("Memory", "Old wound", `${ref(actor)} carried memories linked to ${ref(target)}.`),
        cause("Relationship", "Resentment exceeds restraint", "Emotional weights pushed the pair from archive to action."),
        cause("Opportunity", "Duel opening", "Both were alive, known, and close enough for challenge.")
      ],
      effects:[
        effect("Relationship", "Winner and loser marked", `${ref(winner)} gains face; ${ref(loser)} carries consequence.`),
        deathBlow ? effect("Death", "Revenge completed", `${ref(loser)} may die from the duel.`) : effect("Injury", "Revenge remains open", `${ref(loser)} suffers ${injury.label}.`)
      ],
      beneficiaries:[
        benefit(ref(winner), "Wins reputation and leverage.", "The loser's allies may inherit the grudge.")
      ]
    }
  );
  event.conflict = duelConflictRecord({actor, target, winner, loser, score, eventId:event.id, deathBlow});
  rememberEvent(actor, event, {type:winner === actor ? "avenged_grudge" : "failed_revenge", relatedPersonId:target.id, emotionalWeight:winner === actor ? 30 : -34, publicKnown:true});
  rememberEvent(target, event, {type:winner === target ? "survived_revenge" : "lost_duel", relatedPersonId:actor.id, emotionalWeight:winner === target ? 18 : -32, publicKnown:true});
  upsertRelationshipPair(winner, loser, "rival",
    {respect:8, resentment:8},
    {resentment:26, hatred:12, fear:8},
    {sourceEventId:event.id, publicKnown:true, note:"Memory-driven revenge duel."}
  );
  if(deathBlow && killFigure) killFigure(loser, `dies after a memory-driven revenge duel with ${winner.name}`);
  markEscalated(actor, target);
}

function assassinationAttempt({actor, target, score}, killFigure){
  const assassinScore = actor.power * 0.78 + (actor.combatInstinct || 50) * 2 + (actor.luck || 50) + (actor.path === "assassin" || actor.path === "poison" ? 70 : 0) + rand() * 90;
  const guardScore = target.power * 0.72 + (target.combatInstinct || 50) + (target.luck || 50) + rand() * 90;
  const success = assassinScore > guardScore;
  const event = chron(
    "c-death",
    `An assassination born from old resentment strikes at ${ref(target)}. ${success ? "The blade finds its mark" : "The attempt fails, but the Jianghu hears the whisper"}.`,
    success || score >= 110 ? "major" : "normal",
    {
      trueRecord:`The assassin was ${ref(actor)}. The attempt came from grudge score ${Math.round(score)}, memory pressure ${Math.round(memoryPressureBetween(actor, target))}, path ${actor.path}, qi ${actor.qiType}, and relationship hatred that had passed the threshold for open action.`,
      knownBy:"True Record; assassin; hidden witnesses",
      causalType:"memory",
      regionId:target.currentRegionId || actor.currentRegionId || null,
      causes:[
        cause("Memory", "Stored grievance", `${ref(actor)} had unresolved memories tied to ${ref(target)}.`),
        cause("Method", "Assassination chosen", `${actor.path} path and ${actor.personalityTraits?.[0] || "unknown"} temperament favoured a hidden strike.`),
        cause("Opportunity", "Target exposed", `${ref(target)} was reachable before the relationship cooled.`)
      ],
      effects:[
        success ? effect("Death", "Target may fall", `${ref(target)} is struck by a hidden grudge.`) : effect("Exposure", "Grudge becomes visible", `${ref(target)} now knows someone wants them dead.`),
        effect("Rumour", "Truth obscured", "The public may misread the hand behind the blade.")
      ],
      beneficiaries:[
        benefit(ref(actor), success ? "May close a hated account." : "Tests the target's defenses.", "Exposure creates retaliation risk.")
      ],
      rumour:rumour(success ? "Half-true" : "Unverified", "night market whispers", "The public knows an attempt occurred, but not the full chain of resentment behind it.")
    }
  );
  event.conflict = assassinationConflictRecord({actor, target, success, score, eventId:event.id});
  if(success && killFigure){
    upsertRelationshipPair(actor, target, "killer", {hatred:18, fear:4}, {hatred:40, fear:24}, {sourceEventId:event.id, hidden:true, note:"Memory-driven assassination."});
    rememberEvent(actor, event, {type:"assassination", relatedPersonId:target.id, emotionalWeight:28, hidden:true});
    killFigure(target, `is assassinated after old resentment ripens into a hidden blade`);
  } else {
    addInjury(target, "battle_wound", ri(1, 4), "failed assassination attempt");
    rememberEvent(target, event, {type:"assassination_attempt", relatedPersonId:actor.id, emotionalWeight:-42, hidden:true});
    upsertRelationshipPair(target, actor, "enemy", {hatred:34, fear:10, trust:-30}, {resentment:20, fear:8}, {sourceEventId:event.id, hidden:true, note:"Failed assassination attempt."});
  }
  markEscalated(actor, target);
}

function canStartMemoryWar({actor, target}){
  return actor.sect && target.sect && actor.sect !== target.sect && actor.sect.alive && target.sect.alive && !warExists(actor.sect, target.sect) && STATE.activeWars.length < 3;
}

function startMemoryWar({actor, target, score}){
  const a = actor.sect;
  const b = target.sect;
  const war = startStructuredWar({
    a,
    b,
    regionId:actor.currentRegionId || target.currentRegionId || a.regionId || b.regionId || null,
    publicJustification:"a private grudge neither faction can admit",
    immediateCause:`${actor.name}'s grievance against ${target.name}`,
    deepCause:"Personal memory pressure and faction face converted private resentment into public banners.",
    hiddenCause:`Grudge score ${Math.round(score)} and remembered injuries tied ${actor.name} to ${target.name}.`,
    mainAggressor:a,
    trueMotive:"Turn a private revenge chain into faction legitimacy.",
    sourcePersonIds:[actor.id, target.id]
  });
  const event = chron(
    "c-war",
    `${sref(a)} and ${sref(b)} turn private resentment into open banners: ${war.name} (${war.recordName}) begins from a grudge neither side will admit.`,
    "major",
    {
      trueRecord:`The war is not random faction pressure. It escalated from ${ref(actor)} against ${ref(target)}, grudge score ${Math.round(score)}, remembered injuries, and faction honour converting private memory into public cause.`,
      knownBy:"True Record; faction spies",
      causalType:"memory-war",
      regionId:war.regionId,
      causes:[
        cause("Memory", "Private resentment", `${ref(actor)} carried enough pressure against ${ref(target)} to draw factions behind them.`),
        cause("Faction Face", "Private grievance becomes public", `${sref(a)} and ${sref(b)} could not ignore the insult without losing standing.`),
        cause("Weakness", a.name, a.weakness),
        cause("Weakness", b.name, b.weakness)
      ],
      effects:[
        effect("War", "Relationship becomes conflict", `${war.name} begins as a Phase 4 memory-driven escalation.`)
      ],
      beneficiaries:[
        benefit(sref(a), "Receives a righteous-looking public cause.", a.weakness),
        benefit(sref(b), "Can rally members through grievance.", b.weakness)
      ]
    }
  );
  war.causeEventId = event.id;
  war.hiddenCauseEventId = event.hiddenCauseIds?.[0] || null;
  event.warId = war.id;
  markEscalated(actor, target);
}

function markEscalated(actor, target){
  for(const relationshipId of actor.relationships || []){
    const relationship = relationshipById(relationshipId);
    if(relationship?.toId === target.id) relationship.lastEscalatedYear = STATE.year;
  }
}
