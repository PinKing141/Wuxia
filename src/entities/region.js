"use strict";

import { newId } from "../state.js";

export function makeRegion(blueprint){
  const regionId = newId();
  const landmarks = blueprint.landmarks.map(landmark=>({
    id:newId(),
    kind:"landmark",
    regionId,
    type:landmark.type,
    name:landmark.name,
    danger:landmark.danger != null ? landmark.danger : blueprint.danger,
    status:"active",
    controllerFactionId:null
  }));

  return {
    region:{
      id:regionId,
      kind:"region",
      key:blueprint.key,
      name:blueprint.name,
      type:blueprint.type,
      knownFor:[...blueprint.knownFor],
      dominantFactionId:null,
      stability:blueprint.stability,
      danger:blueprint.danger,
      wealth:blueprint.wealth,
      spiritualDensity:blueprint.spiritualDensity,
      populationPressure:blueprint.populationPressure,
      demonicActivity:blueprint.demonicActivity,
      recentEvents:[],
      hiddenSecrets:[...blueprint.hiddenSecrets],
      landmarkIds:landmarks.map(landmark=>landmark.id)
    },
    landmarks
  };
}
