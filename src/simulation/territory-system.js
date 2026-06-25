"use strict";

import { aliveSects, sectMight } from "../observer/selectors.js";
import { STATE } from "../state.js";
import { clamp } from "../utils/random.js";

export function tickTerritory(){
  for(const region of STATE.regions || []){
    const powers = aliveSects().filter(faction=>faction.regionId === region.id);
    const dominant = powers.sort((a, b)=>sectMight(b) - sectMight(a))[0] || null;
    region.dominantFactionId = dominant?.id || region.dominantFactionId || null;

    const warsHere = STATE.activeWars.filter(war=>{
      const a = STATE.sects.find(faction=>faction.id === war.a);
      const b = STATE.sects.find(faction=>faction.id === war.b);
      return war.regionId === region.id || a?.regionId === region.id || b?.regionId === region.id;
    }).length;

    region.stability = clamp(region.stability + (dominant ? 0.35 : -0.2) - warsHere * 3, 0, 100);
    region.danger = clamp(region.danger + warsHere * 2 + (region.demonicActivity > 55 ? 0.35 : -0.1), 0, 100);
    region.wealth = clamp(region.wealth + (region.stability - 50) / 80 - warsHere * 0.8, 0, 100);
    region.populationPressure = clamp(region.populationPressure + (region.wealth - region.danger) / 150, 0, 100);
  }
}
