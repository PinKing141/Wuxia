"use strict";

import { recordWarTechniqueLoss } from "../entities/war.js";

export function warAftermathText(war, winner=null, loser=null){
  if(!war) return "The war leaves no clean aftermath.";
  if(winner && loser){
    return `${winner.name} controls the public story; ${loser.name} carries humiliation, debt, and scattered grudges.`;
  }
  return "The war ends in disorder, leaving causes unresolved and survivors dangerous.";
}

export function recordFactionCollapseAftermath(war, faction, eventId=null){
  if(!war || !faction) return;
  war.territoryChanges.push({
    year:war.endYear || null,
    factionId:faction.id,
    regionId:faction.regionId,
    type:"faction_collapse",
    note:`${faction.name} lost control of its seat after collapse.`,
    eventId
  });
  if(faction.signatureArt){
    recordWarTechniqueLoss(war, faction.signatureArt, `risked loss during the collapse of ${faction.name}`, eventId);
  }
}
