"use strict";

export const TECHNIQUE_PREFIXES = [
  ["Pure Yang","Pure Yang"],["Taiji","Taiji"],["Plum Blossom","Plum Blossom"],["Vajra","Vajra"],
  ["Arhat","Arhat"],["Rainstorm Pear Blossom","Rainstorm Pear Blossom"],["Seven-Step Heartbreak","Seven-Step Heartbreak"],
  ["Thousand Venom","Thousand Venom"],["Blood Demon","Blood Demon"],["Soul-Devouring","Soul-Devouring"],
  ["Black Sun","Black Sun"],["Heaven-Splitting","Heaven-Splitting"],["Frost Phoenix","Frost Phoenix"],
  ["Azure Lamp","Azure Lamp"],["Jade Marrow","Jade Marrow"],["Death Qi","Death Qi"],
  ["Cloud-Piercing","Cloud-Piercing"],["Nine Rivers","Nine Rivers"],["Star-Reading","Star-Reading"],
  ["Yellow Talisman","Yellow Talisman"],["Ghost Lantern","Ghost Lantern"],["Corpse Bell","Corpse Bell"],
  ["White Tiger","White Tiger"],["Azure Luan","Azure Luan"],["Spirit Fox","Spirit Fox"]
];

export const TECHNIQUE_SUFFIXES = [
  ["Scripture","Scripture"],["Sword Art","Sword Art"],["Saber Art","Saber Art"],
  ["Palm Art","Palm Art"],["Fist Art","Fist Art"],["Hidden Weapon Manual","Hidden Weapon Manual"],
  ["Poison Canon","Poison Canon"],["Movement Art","Movement Art"],["Formation Manual","Formation Manual"],
  ["Alchemy Canon","Alchemy Canon"],["Forbidden Art","Forbidden Art"],["Talisman Scripture","Talisman Scripture"],
  ["Corpse Refining Manual","Corpse Refining Manual"],["Beast-Taming Canon","Beast-Taming Canon"]
];

export const TECHNIQUE_TYPES = [
  "Cultivation Method",
  "Sword Art",
  "Saber Art",
  "Palm Art",
  "Fist Art",
  "Movement Art",
  "Body Refinement Art",
  "Poison Art",
  "Hidden Weapon Art",
  "Buddhist Art",
  "Daoist Art",
  "Demonic Art",
  "Blood Art",
  "Soul Art",
  "Formation Art",
  "Talisman Art",
  "Alchemy Method",
  "Beast-Taming Method",
  "Artifact Method"
];

export const TECHNIQUE_GRADES = ["Common","Refined","Profound","Earth","Heaven","Saint","Immortal"];

export function gradeForTier(tier){
  if(tier >= 9) return "Immortal";
  if(tier >= 8) return "Saint";
  if(tier >= 7) return "Heaven";
  if(tier >= 5) return "Earth";
  if(tier >= 4) return "Profound";
  if(tier >= 3) return "Refined";
  return "Common";
}

export function techniqueTypeFor({path="", qiType="", name=""}={}){
  const lowerName = String(name).toLowerCase();
  if(path === "sword" || lowerName.includes("sword")) return "Sword Art";
  if(path === "saber" || lowerName.includes("saber")) return "Saber Art";
  if(path === "poison" || qiType === "poison" || lowerName.includes("venom")) return "Poison Art";
  if(path === "assassin" || lowerName.includes("hidden weapon")) return "Hidden Weapon Art";
  if(path === "buddhist" || lowerName.includes("vajra") || lowerName.includes("arhat")) return "Buddhist Art";
  if(path === "daoist" || lowerName.includes("taiji")) return "Daoist Art";
  if(path === "formation") return "Formation Art";
  if(path === "talisman" || lowerName.includes("talisman")) return "Talisman Art";
  if(path === "medicine" || lowerName.includes("alchemy")) return "Alchemy Method";
  if(path === "ghost" || lowerName.includes("corpse") || lowerName.includes("soul")) return "Soul Art";
  if(path === "beast") return "Beast-Taming Method";
  if(path === "artifact") return "Artifact Method";
  if(path === "heretical" || path === "abyssal" || ["blood","resentment","abyssal"].includes(qiType)) return qiType === "blood" ? "Blood Art" : "Demonic Art";
  if(lowerName.includes("movement")) return "Movement Art";
  if(lowerName.includes("fist")) return "Fist Art";
  if(lowerName.includes("palm")) return "Palm Art";
  return "Cultivation Method";
}

export function defaultTechniqueRisks({align="", qiType="", corruption=0, completeness=100}={}){
  const risks = [];
  if(["heretical","abyssal"].includes(align) || ["blood","resentment","abyssal"].includes(qiType)) risks.push("inner demon growth");
  if(qiType === "poison") risks.push("poisoned meridians");
  if(corruption > 45) risks.push("qi deviation");
  if(completeness < 70) risks.push("incomplete circulation");
  if(!risks.length) risks.push("foundation strain");
  return risks;
}

export function defaultTechniqueCounters({path="", qiType=""}={}){
  const counters = [];
  if(path === "sword") counters.push("body refinement defense", "formation traps");
  if(path === "poison" || qiType === "poison") counters.push("Poison Cleansing Pill", "yang purification");
  if(["blood","resentment","abyssal"].includes(qiType)) counters.push("Buddhist suppression", "heart-calming scripture");
  if(path === "formation") counters.push("formation-breaking talismans");
  if(path === "beast") counters.push("soul pressure", "contract disruption");
  if(!counters.length) counters.push("superior realm pressure");
  return counters;
}
