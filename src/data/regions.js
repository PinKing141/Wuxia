"use strict";

export const REGION_BLUEPRINTS = [
  {
    key:"central-plains",
    name:"Central Plains",
    type:"Heartland province",
    knownFor:["orthodox sects","trade roads","old battlefields"],
    danger:32,
    stability:68,
    wealth:72,
    spiritualDensity:54,
    populationPressure:66,
    demonicActivity:12,
    hiddenSecrets:[
      "An old battlefield still gathers resentment qi beneath the main trade road.",
      "Several orthodox lineages hide succession debts in the capital registries."
    ],
    landmarks:[
      {type:"City", name:"Luoyang Market City"},
      {type:"River", name:"Yellow Dragon River"},
      {type:"Battlefield", name:"Red Mountain Battlefield"},
      {type:"Cultivation Site", name:"White Crane Terrace"}
    ]
  },
  {
    key:"shu",
    name:"Shu",
    type:"Mountain province",
    knownFor:["poison","hidden weapons","medicine"],
    danger:48,
    stability:61,
    wealth:58,
    spiritualDensity:63,
    populationPressure:47,
    demonicActivity:18,
    hiddenSecrets:[
      "A branch-family succession dispute is buried beneath polite clan rites.",
      "Antidote recipes from three generations ago were never fully recorded."
    ],
    landmarks:[
      {type:"Mountain", name:"Ten-Thousand Venom Peaks"},
      {type:"City", name:"Chengdu Inner Market"},
      {type:"Forbidden Zone", name:"Miasma Needle Gorge"},
      {type:"Ancient Ruin", name:"Broken Antidote Estate"}
    ]
  },
  {
    key:"jiangnan",
    name:"Jiangnan",
    type:"River and furnace province",
    knownFor:["workshops","merchant roads","alchemy furnaces"],
    danger:34,
    stability:65,
    wealth:78,
    spiritualDensity:57,
    populationPressure:72,
    demonicActivity:14,
    hiddenSecrets:[
      "Workshop contracts hide unpaid debts to rogue cultivators.",
      "A submerged ruin moves whenever the river floods."
    ],
    landmarks:[
      {type:"River", name:"Nine Bends River"},
      {type:"City", name:"Jiangnan Furnace City"},
      {type:"Cultivation Site", name:"Purple Cloud Herb Garden"},
      {type:"Ancient Ruin", name:"Sunken Gear Hall"}
    ]
  },
  {
    key:"northern-desert",
    name:"Northern Desert",
    type:"Desert frontier",
    knownFor:["wind qi","old caravans","bone fields"],
    danger:67,
    stability:39,
    wealth:34,
    spiritualDensity:46,
    populationPressure:24,
    demonicActivity:32,
    hiddenSecrets:[
      "A buried caravan bell rings before each sandstorm.",
      "A corpse-refining cave is sealed beneath a dune shrine."
    ],
    landmarks:[
      {type:"Forbidden Zone", name:"White Bone Dune"},
      {type:"Trade Route", name:"North Sand Caravan Road"},
      {type:"Ancient Ruin", name:"Buried Bell Shrine"},
      {type:"Cultivation Site", name:"Wind-Splitting Mesa"}
    ]
  },
  {
    key:"eastern-sea",
    name:"Eastern Sea",
    type:"Island and sea territory",
    knownFor:["sea routes","moon tides","hidden lineages"],
    danger:58,
    stability:44,
    wealth:55,
    spiritualDensity:69,
    populationPressure:28,
    demonicActivity:41,
    hiddenSecrets:[
      "The Moonless Sea remembers a drowned inheritance.",
      "A tidal ruin aligns itself with heirs who have not been born."
    ],
    landmarks:[
      {type:"River", name:"Moon Tide Channel"},
      {type:"Forbidden Zone", name:"Moonless Sea Trench"},
      {type:"Ancient Ruin", name:"Drowned Jade Observatory"},
      {type:"Cultivation Site", name:"Eastern Star Reef"}
    ]
  },
  {
    key:"kunlun-mountains",
    name:"Kunlun Mountains",
    type:"Sacred mountain range",
    knownFor:["hidden masters","snow peaks","ancient scriptures"],
    danger:61,
    stability:52,
    wealth:38,
    spiritualDensity:82,
    populationPressure:18,
    demonicActivity:19,
    hiddenSecrets:[
      "A half-buried scripture hall opens only after heavy snow.",
      "Old sword intent still cuts loose stones from the cliffs."
    ],
    landmarks:[
      {type:"Mountain", name:"Jade Void Peak"},
      {type:"Cultivation Site", name:"Snow Listening Cave"},
      {type:"Ancient Ruin", name:"Fallen Scripture Hall"},
      {type:"Forbidden Zone", name:"Mirror Ice Ravine"}
    ]
  },
  {
    key:"imperial-capital",
    name:"Imperial Capital",
    type:"Capital commandery",
    knownFor:["law","examinations","imperial formations"],
    danger:28,
    stability:74,
    wealth:86,
    spiritualDensity:59,
    populationPressure:88,
    demonicActivity:10,
    hiddenSecrets:[
      "The court registry tracks more grudges than taxes.",
      "Imperial formation stones under the palace are older than the dynasty."
    ],
    landmarks:[
      {type:"City", name:"Great Xia Capital"},
      {type:"Cultivation Site", name:"Vermilion Examination Hall"},
      {type:"River", name:"Jade Belt Canal"},
      {type:"Forbidden Zone", name:"Sealed Ministry Vault"}
    ]
  },
  {
    key:"southern-wilderness",
    name:"Southern Wilderness",
    type:"Jungle and herb frontier",
    knownFor:["spirit herbs","beast-taming","medicine"],
    danger:72,
    stability:36,
    wealth:42,
    spiritualDensity:76,
    populationPressure:22,
    demonicActivity:29,
    hiddenSecrets:[
      "A Blood Jade Lotus blooms only after a beast tide.",
      "Medicine maps omit valleys claimed by spirit beasts."
    ],
    landmarks:[
      {type:"Forbidden Zone", name:"Thousand Beast Ravine"},
      {type:"Cultivation Site", name:"Blood Jade Lotus Marsh"},
      {type:"Mountain", name:"Green Python Ridge"},
      {type:"Ancient Ruin", name:"Old Herb King Terrace"}
    ]
  },
  {
    key:"western-borderlands",
    name:"Western Borderlands",
    type:"Borderland wastes",
    knownFor:["heretical cults","salt roads","black banners"],
    danger:74,
    stability:31,
    wealth:39,
    spiritualDensity:51,
    populationPressure:29,
    demonicActivity:56,
    hiddenSecrets:[
      "Black Sun cells use abandoned wells as oath chambers.",
      "A forbidden scripture was split among three salt-road shrines."
    ],
    landmarks:[
      {type:"Trade Route", name:"Salt Wind Road"},
      {type:"Forbidden Zone", name:"Black Sun Altar Field"},
      {type:"Battlefield", name:"Western Banner Plain"},
      {type:"Ancient Ruin", name:"Cracked Oath Shrine"}
    ]
  },
  {
    key:"frostbound-north",
    name:"Frostbound North",
    type:"Frozen frontier",
    knownFor:["ice qi","exiles","northern beasts"],
    danger:63,
    stability:42,
    wealth:31,
    spiritualDensity:66,
    populationPressure:20,
    demonicActivity:22,
    hiddenSecrets:[
      "Exiled elders maintain a hidden duel register.",
      "A frozen lake preserves the shadows of those who died above it."
    ],
    landmarks:[
      {type:"Mountain", name:"Frost Saber Ridge"},
      {type:"Forbidden Zone", name:"Silent Ice Lake"},
      {type:"Cultivation Site", name:"Cold Moon Flower Field"},
      {type:"Battlefield", name:"Lone Banner Pass"}
    ]
  },
  {
    key:"jade-coast",
    name:"Jade Coast",
    type:"Coastal trade land",
    knownFor:["merchant houses","sea medicine","auction halls"],
    danger:37,
    stability:58,
    wealth:74,
    spiritualDensity:49,
    populationPressure:52,
    demonicActivity:15,
    hiddenSecrets:[
      "Auction houses quietly sell maps to forbidden islands.",
      "A medicine guild keeps a list of cultivators who cannot be cured."
    ],
    landmarks:[
      {type:"City", name:"Jade Coast Auction Port"},
      {type:"River", name:"Pearl Reed Estuary"},
      {type:"Cultivation Site", name:"Sea Wind Pill Pavilion"},
      {type:"Ancient Ruin", name:"Tide-Locked Storehouse"}
    ]
  },
  {
    key:"ten-thousand-peaks",
    name:"Ten-Thousand Peaks",
    type:"Remote peak cluster",
    knownFor:["secluded caves","small lineages","dangerous ascents"],
    danger:69,
    stability:33,
    wealth:27,
    spiritualDensity:79,
    populationPressure:14,
    demonicActivity:24,
    hiddenSecrets:[
      "A nameless cave contains sword marks that rearrange themselves.",
      "Several small lineages share one ancestor without admitting it."
    ],
    landmarks:[
      {type:"Mountain", name:"Lone Goose Peak"},
      {type:"Cultivation Site", name:"Nameless Sword Cave"},
      {type:"Forbidden Zone", name:"Falling Star Ravine"},
      {type:"Ancient Ruin", name:"Nine Mountains Schism Hall"}
    ]
  }
];

export const REGION_ALIASES = {
  "the Central Plains":"central-plains",
  "Central Plains":"central-plains",
  "the Shu Basin":"shu",
  "Shu":"shu",
  "Jiangnan":"jiangnan",
  "the Frostbound North":"frostbound-north",
  "Northern Desert":"northern-desert",
  "the Western Wastes":"western-borderlands",
  "Western Borderlands":"western-borderlands",
  "the Misted East":"eastern-sea",
  "Eastern Sea":"eastern-sea",
  "the Moonless Sea":"eastern-sea",
  "beneath the Moonless Sea":"eastern-sea",
  "the Imperial Capital":"imperial-capital",
  "Chang'an, the Imperial Capital":"imperial-capital",
  "Mount Wudang":"central-plains",
  "Mount Song":"central-plains",
  "Mount Hua":"central-plains",
  "the Heavenly Capital":"central-plains",
  "the southern herb mountains":"southern-wilderness",
  "Southern Wilderness":"southern-wilderness",
  "the furnace cities of Jiangnan":"jiangnan",
  "every city gate under Heaven":"central-plains",
  "the Jade Coast":"jade-coast",
  "the Ten-Thousand Peaks":"ten-thousand-peaks",
  "the Bleak Steppe":"northern-desert",
  "the Southern Marches":"southern-wilderness"
};

export const REGION_NAMES = REGION_BLUEPRINTS.map(region=>region.name);
