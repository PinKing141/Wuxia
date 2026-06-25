"use strict";

import { INSTITUTION_HEAD_TITLES } from "../data/factions.js";
import { addMemory, rememberEvent } from "../entities/memory.js";
import { upsertRelationshipPair } from "../entities/relationship.js";
import { benefit, cause, effect } from "../observer/causality.js";
import { chron, ref, sref } from "../observer/chronicle.js";
import { aliveSects, figById } from "../observer/selectors.js";
import { STATE } from "../state.js";
import { chance, clamp, pick } from "../utils/random.js";

export function tickSuccessionSystem(){
  for(const faction of aliveSects()){
    updateLeaderAndSuccessor(faction);
    maybeSuccessionDispute(faction);
  }
}

function updateLeaderAndSuccessor(faction){
  const leader = figById(faction.leaderId);
  const members = faction.members.map(figById).filter(person=>person?.alive);
  if(!members.length) return;
  if(!leader || !leader.alive){
    const successor = figById(faction.successorId);
    const nextLeader = successor?.alive ? successor : bestLeaderCandidate(faction, members);
    const previousName = leader?.name || "the previous leader";
    faction.leaderId = nextLeader.id;
    nextLeader.rankInFaction = INSTITUTION_HEAD_TITLES[faction.type] || "Faction Leader";
    faction.internalStability = clamp((faction.internalStability || 50) - 8, 0, 100);
    const shouldRecord = faction.prestige >= 65 || faction.internalStability < 35 || chance(.28);
    if(shouldRecord){
      const event = chron(
        "c-sect",
        `${ref(nextLeader)} succeeds ${previousName} as leader of ${sref(faction)}.`,
        faction.prestige >= 65 ? "major" : "normal",
        {
          trueRecord:`Succession resolved because the faction needed continuity. Stability ${Math.round(faction.internalStability)}, successor ${nextLeader.name}, cultivation strength ${Math.round(faction.cultivationStrength || 0)}, and public reputation ${Math.round(faction.publicReputation || 0)} shaped the transition.`,
          knownBy:"True Record; faction elders",
          causalType:"succession",
          regionId:faction.regionId,
          locationId:faction.seatId,
          causes:[
            cause("Leadership", "Vacant seat", `${previousName} could no longer lead ${sref(faction)}.`),
            cause("Successor", nextLeader.name, `${ref(nextLeader)} had enough standing to inherit the seat.`),
            cause("Stability", "Faction continuity", `Internal stability stands at ${Math.round(faction.internalStability)}.`)
          ],
          effects:[
            effect("Faction", "Leadership changes", `${sref(faction)} now follows ${ref(nextLeader)}.`)
          ],
          beneficiaries:[
            benefit(sref(faction), "Avoids immediate collapse through succession.", "Rivals may test the new leader.")
          ]
        }
      );
      rememberEvent(nextLeader, event, {type:"became_faction_leader", relatedFactionId:faction.id, emotionalWeight:40, publicKnown:true});
    } else {
      addMemory(nextLeader, {
        type:"became_faction_leader",
        relatedFactionId:faction.id,
        emotionalWeight:32,
        publicKnown:false,
        text:`Quietly succeeded ${previousName} as leader of ${faction.name}.`
      });
    }
  }

  const updatedMembers = faction.members.map(figById).filter(person=>person?.alive && person.id !== faction.leaderId);
  const nextSuccessor = bestLeaderCandidate(faction, updatedMembers);
  faction.successorId = nextSuccessor?.id || null;
}

function maybeSuccessionDispute(faction){
  if((faction.internalStability || 100) > 42 || !faction.successorId || !chance(.025)) return;
  if(faction.lastSuccessionDisputeYear && faction.lastSuccessionDisputeYear + 12 > STATE.year) return;
  const members = faction.members.map(figById).filter(person=>person?.alive && person.id !== faction.leaderId && person.id !== faction.successorId);
  if(!members.length) return;
  const successor = figById(faction.successorId);
  const challenger = pick(members.sort((a, b)=>(b.power - a.power) || (b.fame - a.fame)).slice(0, 3));
  if(!successor || !challenger) return;
  faction.internalStability = clamp(faction.internalStability - 5, 0, 100);
  faction.lastSuccessionDisputeYear = STATE.year;
  faction.grudges.push({year:faction.founded, type:"succession_dispute", fromId:challenger.id, toId:successor.id});
  const event = chron(
    "c-lineage",
    `${ref(challenger)} quietly contests ${ref(successor)} as successor of ${sref(faction)}.`,
    "normal",
    {
      trueRecord:`The dispute comes from low internal stability ${Math.round(faction.internalStability)}, ambition, rank pressure, and the absence of uncontested succession.`,
      knownBy:"True Record; inner elders",
      causalType:"succession",
      regionId:faction.regionId,
      locationId:faction.seatId,
      causes:[
        cause("Stability", "Internal fracture", `${sref(faction)} has stability ${Math.round(faction.internalStability)}.`),
        cause("Ambition", challenger.ambitions?.[0] || "unknown", `${ref(challenger)} has reason to reject the current heir.`),
        cause("Successor", successor.name, `${ref(successor)} is named but not uncontested.`)
      ],
      effects:[
        effect("Relationship", "Succession rivalry", "The challenger and successor gain a durable rivalry.")
      ],
      beneficiaries:[
        benefit("Faction rivals", "Can exploit a divided succession.", "Interference may unite the faction against them.")
      ]
    }
  );
  upsertRelationshipPair(challenger, successor, "rival", {envy:24, resentment:24, hatred:6}, {resentment:12, fear:6}, {
    sourceEventId:event.id,
    hidden:true,
    note:"Succession dispute."
  });
  addMemory(challenger, {type:"succession_dispute", relatedPersonId:successor.id, relatedFactionId:faction.id, relatedEventId:event.id, emotionalWeight:-28, hidden:true, text:`Contested ${successor.name} for succession in ${faction.name}.`});
  addMemory(successor, {type:"succession_dispute", relatedPersonId:challenger.id, relatedFactionId:faction.id, relatedEventId:event.id, emotionalWeight:-20, hidden:true, text:`Faced a succession challenge from ${challenger.name}.`});
}

function bestLeaderCandidate(faction, members){
  return [...members].sort((a, b)=>{
    const aScore = a.power + (a.fame || 0) * 5 + (a.reputation?.score || 0) + (a.familyId && faction.type === "Clan" ? 40 : 0);
    const bScore = b.power + (b.fame || 0) * 5 + (b.reputation?.score || 0) + (b.familyId && faction.type === "Clan" ? 40 : 0);
    return bScore - aScore;
  })[0] || null;
}
