"use strict";

export const CULTIVATION_PATHS = {
  martial:{label:"Martial", description:"Body, fist, weapon, and inner-force training."},
  sword:{label:"Sword", description:"Sword qi, intent, and clean killing lines."},
  saber:{label:"Saber", description:"Dominating momentum and battlefield cutting force."},
  daoist:{label:"Daoist", description:"Stillness, circulation, talismanic law, and natural qi."},
  buddhist:{label:"Buddhist", description:"Body purification, scripture, restraint, and compassion."},
  scholarly:{label:"Scholarly", description:"Ritual, law, stars, commentary, and disciplined insight."},
  poison:{label:"Poison", description:"Venom, antidotes, concealed weapons, and meridian disruption."},
  medicine:{label:"Medicine", description:"Healing, alchemy, herb lore, and life-preserving qi."},
  formation:{label:"Formation", description:"Arrays, terrain, ritual geometry, and stored spiritual qi."},
  talisman:{label:"Talisman", description:"Written seals, command scripts, warding law, and paper-bound qi."},
  ghost:{label:"Ghost/Corpse", description:"Yin spirits, corpse puppets, ancestral shades, and deathly contracts."},
  beast:{label:"Beast-Taming", description:"Spirit beasts, blood contracts, feeding rites, and wilderness bonds."},
  artifact:{label:"Artifact Refining", description:"Furnaces, mechanisms, weapons, and crafted vessels."},
  assassin:{label:"Assassin", description:"Stealth, timing, weak points, and invisible killing intent."},
  heretical:{label:"Heretical", description:"Blood, soul, resentment, shortcuts, and forbidden scriptures."},
  abyssal:{label:"Abyssal", description:"A forbidden path named for the Abyss title, usually worked through death qi, resentment qi, and contradiction rites."},
  hidden:{label:"Hidden Lineage", description:"Secluded inheritance, secret oaths, and patient transmission."}
};

export const QI_TYPES = {
  inner:{label:"inner qi", nature:"balanced"},
  true:{label:"true qi", nature:"refined"},
  spiritual:{label:"spiritual qi", nature:"heaven-earth"},
  sword:{label:"sword qi", nature:"sharp"},
  blood:{label:"blood qi", nature:"violent"},
  poison:{label:"poison qi", nature:"insidious"},
  yin:{label:"yin qi", nature:"cold"},
  yang:{label:"yang qi", nature:"bright"},
  resentment:{label:"resentment qi", nature:"grudge-bound"},
  abyssal:{label:"death qi", nature:"contradictory"}
};

export const ALIGNMENT_DEFAULT_PROFILES = {
  righteous:{paths:["martial","sword","daoist"], qiTypes:["inner","true","sword"], weakness:"honour-bound responses to provocation"},
  clan:{paths:["martial","poison","medicine"], qiTypes:["inner","poison","true"], weakness:"branch-family succession pressure"},
  imperial:{paths:["scholarly","formation","martial"], qiTypes:["true","spiritual","yang"], weakness:"bureaucracy, politics, and slow public action"},
  academy:{paths:["scholarly","formation","talisman"], qiTypes:["spiritual","true","yang"], weakness:"overreliance on doctrine and examination rank"},
  temple:{paths:["buddhist","martial","medicine"], qiTypes:["yang","inner","spiritual"], weakness:"vows that enemies can exploit"},
  rogue:{paths:["martial","artifact","assassin","beast"], qiTypes:["inner","yin","true"], weakness:"thin inheritance and unstable alliances"},
  heretical:{paths:["heretical","assassin","poison","ghost"], qiTypes:["blood","resentment","yin"], weakness:"corruption, betrayal, and unstable foundations"},
  abyssal:{paths:["abyssal","heretical","hidden","ghost"], qiTypes:["abyssal","resentment","yin"], weakness:"Heaven's law rejects their cultivation"},
  hidden:{paths:["hidden","daoist","medicine","beast","talisman"], qiTypes:["spiritual","yin","true"], weakness:"small numbers and secrecy that slows intervention"}
};

export const FACTION_PROFILES = {
  "Great Xia Dynasty":{paths:["martial","formation","scholarly"], qiTypes:["true","yang","spiritual"], weakness:"imperial legitimacy depends on keeping provincial powers balanced", trainingCulture:"court armies, legal rites, and state formations"},
  "Imperial Academy":{paths:["scholarly","formation","talisman"], qiTypes:["spiritual","true","yang"], weakness:"scholars trust rankings and commentaries even when fate moves outside the syllabus", trainingCulture:"examinations, observatory meditation, talisman seals, and imperial commentaries"},
  "Divine Hall":{paths:["buddhist","martial","medicine"], qiTypes:["yang","spiritual","inner"], weakness:"public vows force the Hall to answer crises even when traps are obvious", trainingCulture:"purification rites, scripture recitation, and staff discipline"},
  "Wudang Sect":{paths:["daoist","sword","martial"], qiTypes:["inner","true","yang"], weakness:"slow consensus among elders", trainingCulture:"Taiji circulation, stillness, and sword intent"},
  "Shaolin Temple":{paths:["buddhist","martial","medicine"], qiTypes:["inner","yang","spiritual"], weakness:"compassion can spare enemies who return sharper", trainingCulture:"body-tempering halls, scripture, and staff forms"},
  "Tang Clan of Shu":{paths:["poison","assassin","medicine"], qiTypes:["poison","yin","inner"], weakness:"branch rivalries and antidote monopolies", trainingCulture:"hidden weapons, poison meridians, and family trials"},
  "Mount Hua Sword Sect":{paths:["sword","martial","daoist"], qiTypes:["sword","true","yang"], weakness:"pride in direct sword challenges", trainingCulture:"cliff duels, sword scripture, and pure intent"},
  "Medicine King Valley":{paths:["medicine","daoist","beast"], qiTypes:["spiritual","inner","yang"], weakness:"neutrality attracts desperate petitioners and kidnappers", trainingCulture:"alchemy, herb mountains, spirit-beast tending, and pulse diagnosis"},
  "Thousand Mechanism Workshop":{paths:["artifact","formation","martial"], qiTypes:["spiritual","true","inner"], weakness:"rare materials and furnace accidents", trainingCulture:"mechanism arrays, artifact furnaces, and contract work"},
  "Beggar Sect":{paths:["martial","hidden","saber"], qiTypes:["inner","true","yang"], weakness:"loose hierarchy and uneven discipline", trainingCulture:"street intelligence, staff forms, and public hardship"},
  "Black Sun Cult":{paths:["heretical","assassin","ghost"], qiTypes:["blood","resentment","yin"], weakness:"ambition and cult cells turning on each other", trainingCulture:"blood oaths, corpse rites, resentment rites, and forbidden scriptures"},
  "Abyssal Remnant":{paths:["abyssal","hidden","ghost"], qiTypes:["abyssal","resentment","yin"], weakness:"every advance draws Heaven's rejection closer", trainingCulture:"moonless inheritances, death qi contracts, resentment rites, contradiction rites, and buried lineages"}
};
