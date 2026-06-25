"use strict";

import { STATE } from "../state.js";
import { eventMatchesRecord } from "./records.js";

export function publicRecordFor(event){
  if(!event) return null;
  return {
    id:event.id,
    year:event.year,
    season:event.season,
    type:event.type,
    importance:event.importance,
    publicRecord:event.publicRecord || event.html,
    location:event.locationName || null,
    tags:[...(event.tags || [])],
    involvedPersonIds:[...(event.involvedPersonIds || [])],
    involvedFactionIds:[...(event.involvedFactionIds || [])],
    involvedTechniqueIds:[...(event.involvedTechniqueIds || [])],
    rumourIds:[...(event.rumourIds || [])]
  };
}

export function publicRecords({surface="world", limit=100}={}){
  return STATE.log
    .filter(event=>eventMatchesRecord(event, surface))
    .slice(-limit)
    .map(publicRecordFor);
}
