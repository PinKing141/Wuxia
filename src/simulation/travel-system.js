"use strict";

import { aliveFigs } from "../observer/selectors.js";
import { randomRegion } from "../observer/map-state.js";
import { chance } from "../utils/random.js";

export function tickTravel(){
  for(const figure of aliveFigs()){
    if(figure.sect){
      if(!figure.currentRegionId) figure.currentRegionId = figure.sect.regionId;
      if(chance(.04)) figure.currentRegionId = figure.sect.regionId || figure.currentRegionId;
      continue;
    }
    if(!figure.currentRegionId || chance(.08)){
      const destination = randomRegion();
      if(destination) figure.currentRegionId = destination.id;
    }
  }
}
