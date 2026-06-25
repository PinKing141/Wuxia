"use strict";

import { WAR_NAMES } from "../data/factions.js";
import { finishWar, makeWar } from "../entities/war.js";
import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { chron, sref } from "../observer/chronicle.js";
import { aliveSects, sectMight, warExists } from "../observer/selectors.js";
import { STATE } from "../state.js";
import { chance, pick } from "../utils/random.js";

export function startStructuredWar({
  a,
  b,
  name=null,
  recordName=null,
  regionId=null,
  publicJustification=null,
  immediateCause=null,
  deepCause=null,
  hiddenCause=null,
  mainAggressor=null,
  trueMotive=null,
  causeEventId=null,
  hiddenCauseEventId=null,
  sourcePersonIds=[]
}){
  const warName = name && recordName ? [name, recordName] : pick(WAR_NAMES);
  const war = makeWar({
    factionA:a,
    factionB:b,
    name:name || warName[0],
    recordName:recordName || warName[1],
    regionId,
    publicJustification:publicJustification || "an unresolved Jianghu grievance",
    immediateCause,
    deepCause,
    hiddenCause,
    mainAggressor:mainAggressor || a,
    trueMotive,
    causeEventId,
    hiddenCauseEventId,
    sourcePersonIds
  });
  STATE.wars.push(war);
  STATE.activeWars.push(war);
  if(!a.atWarWith.includes(b.id)) a.atWarWith.push(b.id);
  if(!b.atWarWith.includes(a.id)) b.atWarWith.push(a.id);
  return war;
}

export function closeStructuredWar(war, A, B, winner=null, loser=null, aftermath=null){
  STATE.activeWars = STATE.activeWars.filter(active=>active !== war);
  if(A) A.atWarWith = A.atWarWith.filter(id=>!B || id !== B.id);
  if(B) B.atWarWith = B.atWarWith.filter(id=>!A || id !== A.id);
  return finishWar(war, {winner, loser, aftermath});
}

export function warById(id){
  return STATE.wars.find(war=>war.id === id) || null;
}

export function tickConflictPressureSystem(){
  if(chance(.12)) maybeBorderSkirmish();
  if(chance(.08)) maybeResourceDispute();
  if(chance(.045)) maybeDynasticRebellion();
}

function maybeBorderSkirmish(){
  const factions = aliveSects().filter(faction=>faction.atWarWith.length < 2);
  if(factions.length < 2) return;
  const a = pick(factions);
  const rivals = factions.filter(faction=>faction !== a && (faction.regionId === a.regionId || faction.enemies?.includes(a.id) || a.enemies?.includes(faction.id)));
  const b = rivals.length ? pick(rivals) : pick(factions.filter(faction=>faction !== a));
  if(!b || warExists(a, b)) return;
  const regionId = a.regionId || b.regionId || null;
  const event = chron(
    "c-war",
    `A border skirmish breaks out between patrols of ${sref(a)} and ${sref(b)}; both sides call it a misunderstanding and move more disciples to the road.`,
    "normal",
    {
      trueRecord:`The skirmish is a pre-war conflict level, not full mobilization. Military pressure ${Math.round(a.militaryStrength || 0)} to ${Math.round(b.militaryStrength || 0)}, stability ${Math.round(a.internalStability || 0)} to ${Math.round(b.internalStability || 0)}, and existing enemy lists shaped the clash.`,
      knownBy:"True Record; border scouts",
      causalType:"border-skirmish",
      regionId,
      causes:[
        cause("Border", "Patrol overlap", "Armed disciples crossed the same road with permission to test resolve."),
        cause("Faction Face", "No side can publicly retreat", `${sref(a)} and ${sref(b)} both need witnesses to believe they are not weak.`)
      ],
      effects:[
        effect("Conflict", "War pressure rises", "The next insult can cite this skirmish as precedent.")
      ],
      beneficiaries:[
        benefit("War hawks", "Gain a small public grievance.", "Escalation can become expensive.")
      ],
      rumour:rumour("Half-true", "border envoys", "The fight happened, but both halls hide who gave permission.")
    }
  );
  if(chance(.18) && STATE.activeWars.length < 3){
    const war = startStructuredWar({
      a,
      b,
      regionId,
      publicJustification:"a border skirmish that neither side would settle",
      immediateCause:"border skirmish",
      deepCause:"Patrol pressure, faction face, and enemy ledgers made the clash useful.",
      hiddenCause:"The first blood was allowed because elders wanted leverage.",
      causeEventId:event.id,
      hiddenCauseEventId:event.hiddenCauseIds?.[0] || null
    });
    event.warId = war.id;
  }
}

function maybeResourceDispute(){
  const factions = aliveSects().filter(faction=>faction.wealth >= 35 || faction.paths?.includes("medicine") || faction.paths?.includes("artifact"));
  if(factions.length < 2) return;
  const a = pick(factions);
  const b = pick(factions.filter(faction=>faction !== a));
  if(!b || warExists(a, b)) return;
  const regionId = a.regionId || b.regionId || null;
  chron(
    "c-art",
    `${sref(a)} and ${sref(b)} dispute rights to a mine, herb garden, or spirit spring. The public ledger calls it a contract matter; disciples call it a reason to sharpen blades.`,
    "normal",
    {
      trueRecord:`This is a resource dispute conflict level. Wealth ${Math.round(a.wealth || 0)} to ${Math.round(b.wealth || 0)}, cultivation strength ${Math.round(a.cultivationStrength || 0)} to ${Math.round(b.cultivationStrength || 0)}, and regional pressure made the resource politically valuable.`,
      knownBy:"True Record; merchants and storehouse clerks",
      causalType:"resource-dispute",
      regionId,
      causes:[
        cause("Resource", "Cultivation supply", "Herbs, ore, pills, or spring rights can shift future breakthroughs."),
        cause("Wealth", "Faction logistics", `${sref(a)} and ${sref(b)} both need material advantage before rivals do.`)
      ],
      effects:[
        effect("Faction", "Economic grievance", "The dispute can become theft, duel, auction scandal, or war.")
      ],
      beneficiaries:[
        benefit("Merchants and brokers", "Can profit from both sides bidding for leverage.", "If blood spills, trade routes close.")
      ],
      rumour:rumour("Misunderstood", "market brokers", "The public price dispute hides cultivation scarcity.")
    }
  );
}

function maybeDynasticRebellion(){
  const dynasties = aliveSects().filter(faction=>faction.type === "Dynasty" || faction.align === "imperial");
  const rebels = aliveSects().filter(faction=>!dynasties.includes(faction) && faction.internalStability < 65 && faction.prestige >= 25);
  if(!dynasties.length || !rebels.length || STATE.activeWars.length >= 3) return;
  const dynasty = pick(dynasties);
  const rebel = pick(rebels);
  if(warExists(dynasty, rebel)) return;
  const rebellionPressure = (rebel.prestige || 0) + Math.max(0, 70 - (rebel.internalStability || 50)) + Math.max(0, (sectMight(rebel) - sectMight(dynasty)) / 80);
  const event = chron(
    "c-war",
    `${sref(rebel)} refuses an imperial order from ${sref(dynasty)}. Censors call it disobedience; border officers call it the first step toward rebellion.`,
    rebellionPressure >= 70 ? "major" : "normal",
    {
      trueRecord:`The rebellion pressure is ${Math.round(rebellionPressure)}. Public law is the excuse; the hidden calculation is whether ${sref(rebel)} can survive imperial punishment.`,
      knownBy:"True Record; Court Dossier; rebel envoys",
      causalType:"dynastic-rebellion",
      regionId:rebel.regionId || dynasty.regionId || null,
      causes:[
        cause("Imperial Order", "Public trigger", `${sref(dynasty)} issued an order ${sref(rebel)} chose not to obey.`),
        cause("Power", "Rebellion calculation", `${sref(rebel)} believes it has enough prestige, terrain, or allies to resist.`)
      ],
      effects:[
        effect("Dynasty", "Authority tested", "The court must punish, bargain, or expose weakness.")
      ],
      beneficiaries:[
        benefit(sref(rebel), "May convert defiance into autonomy.", "Failure invites purge.")
      ],
      rumour:rumour("Imperial propaganda", "court censors", "The official notice calls it banditry, not politics.")
    }
  );
  if(rebellionPressure >= 82 && chance(.35)){
    const war = startStructuredWar({
      a:dynasty,
      b:rebel,
      regionId:rebel.regionId || dynasty.regionId || null,
      publicJustification:"refusal of imperial order",
      immediateCause:"imperial decree defied",
      deepCause:"Dynastic authority and faction autonomy collided.",
      hiddenCause:`Rebellion pressure ${Math.round(rebellionPressure)} made defiance look survivable.`,
      mainAggressor:dynasty,
      trueMotive:"Restore visible authority before more factions test the throne.",
      causeEventId:event.id,
      hiddenCauseEventId:event.hiddenCauseIds?.[0] || null
    });
    event.warId = war.id;
  }
}
