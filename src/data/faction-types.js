"use strict";

export const FACTION_TYPE_PROFILES = {
  Sect:{
    ideology:"orthodox inheritance and martial prestige",
    goals:["recruit_disciples","protect_manual","win_tournament","expand_influence"],
    recruitment:{min:4, max:16, chance:.34, talent:[18,78]},
    wealthBias:0,
    militaryBias:4,
    stabilityBias:2,
    forbiddenRisk:0.05
  },
  Clan:{
    ideology:"bloodline continuity, family honour, and branch control",
    goals:["secure_successor","arrange_marriage","protect_bloodline","avenge_grudge"],
    recruitment:{min:5, max:18, chance:.28, talent:[16,76]},
    wealthBias:8,
    militaryBias:2,
    stabilityBias:-3,
    forbiddenRisk:0.08
  },
  Temple:{
    ideology:"discipline, doctrine, compassion, and demon suppression",
    goals:["suppress_demons","preserve_doctrine","shelter_children","protect_reputation"],
    recruitment:{min:4, max:14, chance:.25, talent:[18,72]},
    wealthBias:-4,
    militaryBias:0,
    stabilityBias:8,
    forbiddenRisk:0.02
  },
  Monastery:{
    ideology:"seclusion, doctrine, discipline, and moral authority",
    goals:["preserve_doctrine","suppress_demons","protect_reputation"],
    recruitment:{min:3, max:12, chance:.22, talent:[16,70]},
    wealthBias:-5,
    militaryBias:-1,
    stabilityBias:8,
    forbiddenRisk:0.02
  },
  Academy:{
    ideology:"scholarship, examinations, formations, and state service",
    goals:["win_exams","advise_court","collect_commentaries","expand_influence"],
    recruitment:{min:5, max:18, chance:.32, talent:[20,82]},
    wealthBias:6,
    militaryBias:-2,
    stabilityBias:4,
    forbiddenRisk:0.04
  },
  Dynasty:{
    ideology:"law, armies, taxes, borders, and imperial legitimacy",
    goals:["secure_borders","collect_tax","control_sects","appoint_officials"],
    recruitment:{min:6, max:22, chance:.38, talent:[15,74]},
    wealthBias:14,
    militaryBias:12,
    stabilityBias:2,
    forbiddenRisk:0.06
  },
  Valley:{
    ideology:"medicine, alchemy, healing, and guarded neutrality",
    goals:["grow_herbs","sell_pills","heal_elites","preserve_neutrality"],
    recruitment:{min:4, max:14, chance:.26, talent:[18,78]},
    wealthBias:5,
    militaryBias:-4,
    stabilityBias:5,
    forbiddenRisk:0.04
  },
  Workshop:{
    ideology:"craft, mechanisms, contracts, and material control",
    goals:["forge_artifacts","secure_materials","sell_mechanisms","expand_trade"],
    recruitment:{min:4, max:15, chance:.3, talent:[16,76]},
    wealthBias:10,
    militaryBias:0,
    stabilityBias:1,
    forbiddenRisk:0.06
  },
  Alliance:{
    ideology:"loose oaths, shared survival, and practical leverage",
    goals:["broker_alliance","protect_members","expand_influence","avenge_grudge"],
    recruitment:{min:5, max:20, chance:.42, talent:[12,72]},
    wealthBias:0,
    militaryBias:5,
    stabilityBias:-6,
    forbiddenRisk:0.08
  },
  Cult:{
    ideology:"forbidden rites, fear, secrecy, and rapid advancement",
    goals:["spread_fear","steal_manual","hide_rites","corrupt_elites"],
    recruitment:{min:4, max:18, chance:.36, talent:[14,80]},
    wealthBias:-2,
    militaryBias:7,
    stabilityBias:-12,
    forbiddenRisk:0.45
  },
  Tower:{
    ideology:"specialist knowledge, contracts, secrecy, and leverage",
    goals:["sell_services","collect_secrets","secure_materials","expand_influence"],
    recruitment:{min:3, max:13, chance:.28, talent:[18,78]},
    wealthBias:6,
    militaryBias:0,
    stabilityBias:0,
    forbiddenRisk:0.12
  },
  Manor:{
    ideology:"local control, patronage, reputation, and hidden debts",
    goals:["control_region","arrange_marriage","collect_tax","protect_reputation"],
    recruitment:{min:4, max:16, chance:.3, talent:[14,74]},
    wealthBias:7,
    militaryBias:3,
    stabilityBias:-2,
    forbiddenRisk:0.08
  },
  Palace:{
    ideology:"courtly hierarchy, elite rites, and political leverage",
    goals:["control_region","appoint_officials","protect_reputation","expand_influence"],
    recruitment:{min:5, max:18, chance:.32, talent:[18,78]},
    wealthBias:8,
    militaryBias:4,
    stabilityBias:0,
    forbiddenRisk:0.09
  },
  "Hidden Lineage":{
    ideology:"secret inheritance, patient transmission, and survival through obscurity",
    goals:["hide_lineage","find_heir","protect_manual","avoid_court"],
    recruitment:{min:2, max:9, chance:.18, talent:[24,88]},
    wealthBias:-8,
    militaryBias:-5,
    stabilityBias:4,
    forbiddenRisk:0.18
  }
};

export function factionTypeProfile(type){
  return FACTION_TYPE_PROFILES[type] || FACTION_TYPE_PROFILES.Sect;
}
