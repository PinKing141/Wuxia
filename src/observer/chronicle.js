"use strict";

import { makeChronicleEvent } from "../entities/chronicle-event.js";
import { registerChronicleEvent } from "../simulation/chronicle-system.js";
import { registerEventRumour } from "../simulation/rumour-system.js";
import { STATE } from "../state.js";
import { cap, dual } from "../utils/random.js";
import { locationName, noteRegionEvent } from "./map-state.js";

export function ref(f){
  if(!f) return "an unknown";
  if(f.epithet && f.namedAt != null) return `<span class="nm" data-person-id="${f.id}">${dual(cap(f.epithet.en), f.epithet.recordName)}</span>`;
  return `<span class="nm" data-person-id="${f.id}">${f.name}</span>`;
}

export function plainRef(f){
  return `<span class="nm" data-person-id="${f.id}">${f.name}</span>`;
}

export function sref(s){
  return s ? `<span class="sn" data-faction-id="${s.id}">${dual(s.name, s.recordName)}</span>` : "a vanished house";
}

export function aref(a){
  return a ? `<em class="art" data-technique-id="${a.id}">${dual(a.name, a.recordName)}</em>` : "a forgotten art";
}

export function chron(cls, publicRecord, level, variants={}){
  const regionId = variants.regionId || null;
  const locationId = variants.locationId || null;
  const location = variants.locationName || locationName({regionId, locationId}) || null;
  const entry = makeChronicleEvent({
    id:STATE.logc++,
    year:STATE.year,
    season:STATE.season,
    cls,
    publicRecord,
    level:level || "normal",
    regionId,
    locationId,
    locationName:location,
    variants
  });
  registerEventRumour(entry, variants.rumour);
  registerChronicleEvent(entry, variants);
  STATE.log.push(entry);
  if(regionId) noteRegionEvent(regionId, entry.id, publicRecord.replace(/<[^>]*>/g, "").slice(0, 120));
  STATE.dirtyLog = true;
  return entry;
}
