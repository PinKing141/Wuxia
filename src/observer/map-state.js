"use strict";

import { STATE } from "../state.js";
import { pick } from "../utils/random.js";

export function regionById(id){
  return STATE.regions?.find(region=>region.id === id) || null;
}

export function landmarkById(id){
  return STATE.landmarks?.find(landmark=>landmark.id === id) || null;
}

export function regionName(id){
  return regionById(id)?.name || "an unrecorded region";
}

export function landmarkName(id){
  const landmark = landmarkById(id);
  if(!landmark) return "";
  const region = regionById(landmark.regionId);
  return region ? `${landmark.name}, ${region.name}` : landmark.name;
}

export function locationName({regionId=null, locationId=null}={}){
  if(locationId) return landmarkName(locationId);
  if(regionId) return regionName(regionId);
  return "";
}

export function randomRegion(){
  const regions = STATE.regions || [];
  return regions.length ? pick(regions) : null;
}

export function randomLandmark(regionId=null, type=null){
  let landmarks = STATE.landmarks || [];
  if(regionId) landmarks = landmarks.filter(landmark=>landmark.regionId === regionId);
  if(type) landmarks = landmarks.filter(landmark=>landmark.type === type);
  return landmarks.length ? pick(landmarks) : null;
}

export function factionRegion(faction){
  return regionById(faction?.regionId) || null;
}

export function figureRegion(figure){
  return regionById(figure?.currentRegionId || figure?.birthplaceRegionId) || null;
}

export function noteRegionEvent(regionId, eventId, text){
  const region = regionById(regionId);
  if(!region) return;
  region.recentEvents.push({eventId, text});
  if(region.recentEvents.length > 8) region.recentEvents.shift();
}
