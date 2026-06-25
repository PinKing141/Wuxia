"use strict";

import { REGION_NAMES } from "./regions.js";

export const SECT_PREFIXES = [
  ["Wudang","Wudang"],["Mount Hua","Mount Hua"],["Kunlun","Kunlun"],["Emei","Emei"],
  ["White Crane","White Crane"],["Cloud-Splitting","Cloud-Splitting"],["Black Sand","Black Sand"],
  ["Azure Lamp","Azure Lamp"],["Iron Seal","Iron Seal"],["Moonwater","Moonwater"],
  ["Red Lotus","Red Lotus"],["Broken Star","Broken Star"],["Frost Phoenix","Frost Phoenix"],
  ["Silent Rain","Silent Rain"],["Seven Killings","Seven Killings"],["Jade Serpent","Jade Serpent"],
  ["Burning Scripture","Burning Scripture"],["Star-Picking","Star-Picking"],["Nine Rivers","Nine Rivers"],
  ["Medicine King","Medicine King"],["Thousand Mechanism","Thousand Mechanism"]
];

export const INSTITUTION_TYPES = [
  ["Sect","Sect"],["Clan","Clan"],["Temple","Temple"],["Monastery","Monastery"],
  ["Academy","Academy"],["Palace","Palace"],["Tower","Tower"],["Valley","Valley"],
  ["Alliance","Alliance"],["Cult","Cult"],["Workshop","Workshop"],["Manor","Manor"],
  ["Dynasty","Dynasty"],["Hidden Lineage","Hidden Lineage"]
];

export const INSTITUTION_TYPES_BY_ALIGN = {
  righteous:[["Sect","Sect"],["Temple","Temple"],["Monastery","Monastery"],["Alliance","Alliance"]],
  clan:[["Clan","Clan"],["Manor","Manor"],["Palace","Palace"]],
  imperial:[["Dynasty","Dynasty"],["Palace","Palace"],["Academy","Academy"],["Alliance","Alliance"]],
  academy:[["Academy","Academy"],["Tower","Tower"],["Palace","Palace"]],
  temple:[["Temple","Temple"],["Monastery","Monastery"],["Palace","Palace"]],
  rogue:[["Alliance","Alliance"],["Workshop","Workshop"],["Tower","Tower"],["Manor","Manor"]],
  heretical:[["Cult","Cult"],["Palace","Palace"],["Manor","Manor"]],
  abyssal:[["Hidden Lineage","Hidden Lineage"],["Cult","Cult"],["Palace","Palace"]],
  hidden:[["Hidden Lineage","Hidden Lineage"],["Valley","Valley"],["Manor","Manor"],["Tower","Tower"]]
};

export const INSTITUTION_HEAD_TITLES = {
  Sect:"Sect Leader",
  Clan:"Patriarch",
  Temple:"Hall Preceptor",
  Monastery:"Abbot",
  Academy:"Chancellor",
  Palace:"Palace Lord",
  Tower:"Tower Master",
  Valley:"Valley Master",
  Alliance:"Alliance Chief",
  Cult:"Cult Lord",
  Workshop:"Master Artisan",
  Manor:"Manor Lord",
  Dynasty:"Imperial Chancellor",
  "Hidden Lineage":"Lineage Keeper"
};

export const FIXED_POWERS = [
  {name:"Great Xia Dynasty", roman:"Great Xia Dynasty", type:"Dynasty", align:"imperial", region:"the Imperial Capital", regionKey:"imperial-capital", prestige:82},
  {name:"Imperial Academy", roman:"Imperial Academy", type:"Academy", align:"academy", region:"Chang'an, the Imperial Capital", regionKey:"imperial-capital", prestige:76},
  {name:"Divine Hall", roman:"Divine Hall", type:"Temple", align:"temple", region:"the Heavenly Capital", regionKey:"central-plains", prestige:80},
  {name:"Wudang Sect", roman:"Wudang Sect", type:"Sect", align:"righteous", region:"Mount Wudang", regionKey:"central-plains", prestige:72},
  {name:"Shaolin Temple", roman:"Shaolin Temple", type:"Temple", align:"righteous", region:"Mount Song", regionKey:"central-plains", prestige:74},
  {name:"Tang Clan of Shu", roman:"Tang Clan of Shu", type:"Clan", align:"clan", region:"the Shu Basin", regionKey:"shu", prestige:70},
  {name:"Mount Hua Sword Sect", roman:"Mount Hua Sword Sect", type:"Sect", align:"righteous", region:"Mount Hua", regionKey:"central-plains", prestige:68},
  {name:"Medicine King Valley", roman:"Medicine King Valley", type:"Valley", align:"hidden", region:"the southern herb mountains", regionKey:"southern-wilderness", prestige:62},
  {name:"Thousand Mechanism Workshop", roman:"Thousand Mechanism Workshop", type:"Workshop", align:"rogue", region:"the furnace cities of Jiangnan", regionKey:"jiangnan", prestige:58},
  {name:"Beggar Sect", roman:"Beggar Sect", type:"Sect", align:"rogue", region:"every city gate under Heaven", regionKey:"central-plains", prestige:64},
  {name:"Black Sun Cult", roman:"Black Sun Cult", type:"Cult", align:"heretical", region:"the Western Wastes", regionKey:"western-borderlands", prestige:56},
  {name:"Abyssal Remnant", roman:"Abyssal Remnant", type:"Hidden Lineage", align:"abyssal", region:"beneath the Moonless Sea", regionKey:"eastern-sea", prestige:52}
];

export const REGIONS = REGION_NAMES;

export const WAR_NAMES = [
  ["the War Annals of Righteous and Heretical Blood","War Annals"],["the Black Sun Rebellion","War Annals"],
  ["the Ten-Year Sect War","War Annals"],["the Struggle Beneath Heaven","War Annals"],
  ["the Abyssal Calamity","Abyssal Record"],["the Jiangnan Succession War","Court Dossier"],
  ["the War of Drawn Sabers","Jianghu Ledger"],["the Schism of the Nine Mountains","Archive of Sects"]
];

export const ALIGNMENTS = {
  righteous:{key:"righteous",label:"Righteous Path",recordLabel:"Righteous",c:"var(--righteous)"},
  clan:{key:"clan",label:"Noble Clan",recordLabel:"Clan",c:"var(--gold)"},
  imperial:{key:"imperial",label:"Imperial Order",recordLabel:"Imperial",c:"var(--azure)"},
  academy:{key:"academy",label:"Academy",recordLabel:"Academy",c:"var(--jade)"},
  temple:{key:"temple",label:"Divine Hall",recordLabel:"Temple",c:"var(--gold-bright)"},
  rogue:{key:"rogue",label:"Rogue Path",recordLabel:"Rogue",c:"var(--rogue)"},
  heretical:{key:"heretical",label:"Heretical Path",recordLabel:"Heretical",c:"var(--heretical)"},
  abyssal:{key:"abyssal",label:"Abyssal Path",recordLabel:"Abyssal",c:"var(--abyss)"},
  hidden:{key:"hidden",label:"Hidden Lineage",recordLabel:"Hidden",c:"var(--hidden)"}
};
