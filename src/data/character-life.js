"use strict";

export const GENDERS = [
  {key:"female", label:"Female"},
  {key:"male", label:"Male"}
];

export const PERSONALITY_TRAITS = [
  {key:"ambitious", label:"Ambitious"},
  {key:"loyal", label:"Loyal"},
  {key:"proud", label:"Proud"},
  {key:"patient", label:"Patient"},
  {key:"jealous", label:"Jealous"},
  {key:"ruthless", label:"Ruthless"},
  {key:"merciful", label:"Merciful"},
  {key:"cowardly", label:"Cowardly"},
  {key:"obsessive", label:"Obsessive"},
  {key:"honourable", label:"Honourable"},
  {key:"vengeful", label:"Vengeful"},
  {key:"cautious", label:"Cautious"},
  {key:"reckless", label:"Reckless"},
  {key:"studious", label:"Studious"},
  {key:"arrogant", label:"Arrogant"},
  {key:"devout", label:"Devout"}
];

export const AMBITIONS = [
  {key:"become_faction_leader", label:"Become faction leader", drive:"status"},
  {key:"avenge_family", label:"Avenge family", drive:"revenge"},
  {key:"protect_master", label:"Protect master", drive:"loyalty"},
  {key:"surpass_senior", label:"Surpass a senior", drive:"rivalry"},
  {key:"find_cure", label:"Find a cure", drive:"medicine"},
  {key:"recover_lost_manual", label:"Recover a lost manual", drive:"inheritance"},
  {key:"restore_clan", label:"Restore a fallen clan", drive:"family"},
  {key:"escape_marriage", label:"Escape arranged marriage", drive:"freedom"},
  {key:"become_famous", label:"Become famous", drive:"fame"},
  {key:"live_peacefully", label:"Live peacefully", drive:"peace"},
  {key:"destroy_rival_faction", label:"Destroy a rival faction", drive:"war"},
  {key:"prove_talent", label:"Prove talent", drive:"recognition"},
  {key:"hide_demonic_cultivation", label:"Hide forbidden cultivation", drive:"secrecy"}
];

export const FEARS = [
  {key:"ordinary", label:"Being ordinary"},
  {key:"death", label:"Death"},
  {key:"betrayal", label:"Betrayal"},
  {key:"losing_status", label:"Losing status"},
  {key:"inner_demons", label:"Inner demons"},
  {key:"master_disappointment", label:"Master's disappointment"},
  {key:"clan_extinction", label:"Clan extinction"},
  {key:"public_disgrace", label:"Public disgrace"},
  {key:"qi_deviation", label:"Qi deviation"},
  {key:"manual_theft", label:"Manual theft"}
];

export const SECRET_TYPES = [
  {key:"none", label:"No known secret"},
  {key:"hidden_lineage", label:"Hidden lineage"},
  {key:"stolen_manual", label:"Stolen manual fragment"},
  {key:"forbidden_cultivation", label:"Forbidden cultivation"},
  {key:"blood_debt", label:"Unpaid blood debt"},
  {key:"false_identity", label:"False identity"},
  {key:"poisoned_foundation", label:"Poisoned foundation"},
  {key:"imperial_contact", label:"Imperial contact"}
];

export const RANKS_BY_INSTITUTION = {
  Academy:["Outer Student","Inner Student","Lecturer","Senior Scholar","Academy Chancellor"],
  Clan:["Outer Kin","Inner Kin","Branch Elder","Main Elder","Clan Patriarch"],
  Cult:["Outer Disciple","Blood Disciple","Ritual Elder","Dharma Elder","Cult Master"],
  Dynasty:["Junior Officer","Inner Guard","Commandant","Ministerial Elder","Imperial Pillar"],
  Hidden_Lineage:["Outer Heir","Inner Heir","Lineage Keeper","Hidden Elder","Lineage Master"],
  Sect:["Outer Disciple","Inner Disciple","Core Disciple","Elder","Sect Leader"],
  Temple:["Novice","Inner Monk","Discipline Master","Temple Elder","Abbot"],
  Valley:["Herb Disciple","Inner Physician","Pill Elder","Valley Elder","Valley Master"],
  Workshop:["Apprentice","Inner Artisan","Mechanism Master","Forge Elder","Workshop Master"]
};

export const RELATIONSHIP_FEELING_KEYS = [
  "respect",
  "loyalty",
  "fear",
  "love",
  "envy",
  "resentment",
  "debt",
  "trust",
  "hatred",
  "admiration"
];

export const REPUTATION_LABELS = [
  {min:80, label:"revered"},
  {min:50, label:"renowned"},
  {min:25, label:"known"},
  {min:8, label:"noted"},
  {min:0, label:"obscure"}
];

