"use strict";

export const FACTION_EVENT_TABLES = {
  "Tang Clan of Shu": [
    {
      cls:"c-lineage",
      level:"major",
      publicRecord:"{sect} seals the inner courtyards of Shu. {actor} announces a new generation of hidden-weapon disciples beneath the Rainstorm Pear Blossom lamps.",
      trueRecord:"The training is a succession screen. Branch families are testing which heirs can handle poison qi without exposing the clan's internal fracture.",
      knownBy:"True Record; Tang branch elders",
      effects:{prestige:[2,7], memberFame:[1,4], actorDrift:[0,2]}
    },
    {
      cls:"c-art",
      level:"major",
      publicRecord:"A courier from {sect} delivers a lacquered box to {target}. Inside lies a warning needle and a formal demand for apology.",
      trueRecord:"The box contains three messages: the visible demand, a poison keyed to the recipient's guards, and a bloodless offer to settle an old debt quietly.",
      knownBy:"True Record; Tang poison masters; the receiving steward",
      effects:{prestige:[1,5], artCorruption:[0,2]}
    },
    {
      cls:"c-duel",
      level:"normal",
      publicRecord:"Rumour says {actor} defeated three challengers in a tea house without drawing a blade; only silver glints were seen.",
      trueRecord:"The duel was staged to measure a rival's antidote formula. The challengers survived because Tang witnesses wanted them to report home.",
      knownBy:"True Record; Jianghu rumour brokers",
      effects:{prestige:[0,3], memberFame:[1,3]}
    }
  ],

  "Imperial Academy": [
    {
      cls:"c-lineage",
      level:"major",
      publicRecord:"The Imperial Academy opens the Hall of Vermilion Examinations. {actor} evaluates candidates from every province beneath the Great Xia seal.",
      trueRecord:"The examination questions are a loyalty filter. Scholars with unstable fate-lines are redirected into border service or quiet surveillance.",
      knownBy:"True Record; Court Dossier; Academy censors",
      effects:{prestige:[2,8], memberFame:[1,4]}
    },
    {
      cls:"c-art",
      level:"major",
      publicRecord:"At {sect}, star-readers amend an ancient commentary on ritual, law, and qi. Officials call it an academic triumph.",
      trueRecord:"The commentary hides a formation map for predicting sect rebellions three seasons before banners rise.",
      knownBy:"True Record; Imperial observatory",
      effects:{prestige:[2,6]}
    },
    {
      cls:"c-war",
      level:"normal",
      publicRecord:"A sealed edict from {sect} orders {target} to submit its registries for inspection.",
      trueRecord:"The inspection is not about taxes. The court is counting manuals, heirs, and grudges before deciding whom to sponsor.",
      knownBy:"True Record; Court Dossier",
      effects:{prestige:[-2,4]}
    }
  ],

  "Divine Hall": [
    {
      cls:"c-peace",
      level:"major",
      publicRecord:"Bells ring through the Heavenly Capital as {sect} conducts a purification rite. Pilgrims claim the incense smoke formed lotus sigils.",
      trueRecord:"The rite burned away a minor resentment tide before it could become a regional calamity, but the Hall hid how close the breach came.",
      knownBy:"True Record; Divine Hall preceptors",
      effects:{prestige:[3,8], artCorruption:[-3,-1]}
    },
    {
      cls:"c-corrupt",
      level:"major",
      publicRecord:"{actor} denounces a forbidden altar found near {region}. The Hall vows to cleanse every trace of heretical worship.",
      trueRecord:"The altar answered a prayer before it was destroyed. Someone inside the Hall heard the response and did not confess.",
      knownBy:"True Record; one silent acolyte",
      effects:{prestige:[1,5], actorDrift:[1,4]}
    },
    {
      cls:"c-lineage",
      level:"normal",
      publicRecord:"The Divine Hall adopts orphaned disciples from a famine district, teaching them scripture, staff forms, and breath cultivation.",
      trueRecord:"Three of the children carry unusual fate shadows. The Hall is sheltering them from factions that would carve prophecies into their bones.",
      knownBy:"True Record; temple registrars",
      effects:{prestige:[1,4], memberFame:[0,2]}
    }
  ],

  "Black Sun Cult": [
    {
      cls:"c-corrupt",
      level:"major",
      publicRecord:"Black banners are seen at dusk in the Western Wastes. {sect} proclaims that the orthodox sects have mistaken fear for virtue.",
      trueRecord:"The sermon is a recruitment rite. Each listener who answers the chant gives the Black Sun a thread of resentment qi.",
      knownBy:"True Record; Black Sun inner altar",
      effects:{prestige:[1,6], artCorruption:[2,6], actorDrift:[2,6]}
    },
    {
      cls:"c-art",
      level:"major",
      publicRecord:"{actor} burns a page of {art} before the cult altar and claims to have seen a black sun behind the moon.",
      trueRecord:"The burnt page was copied first. The destruction is theatre; the real manual now circulates among three oath-bound cells.",
      knownBy:"True Record; Black Sun oath-keepers",
      effects:{prestige:[2,6], artCorruption:[2,5], memberFame:[1,4]}
    },
    {
      cls:"c-duel",
      level:"normal",
      publicRecord:"A righteous patrol pursuing {sect} vanishes along a salt road. By dawn only prayer beads and black ash remain.",
      trueRecord:"The patrol captain defected before the ambush. The missing bodies are alive, renamed, and being taught to hate their former masters.",
      knownBy:"True Record; one surviving scout",
      effects:{prestige:[0,4], actorDrift:[1,4]}
    }
  ],

  "Abyssal Remnant": [
    {
      cls:"c-threat",
      level:"major",
      publicRecord:"A moonless tide rises beneath the sea. {sect} is mentioned only in frightened whispers, as if the name itself stains paper.",
      trueRecord:"The Abyssal Remnant did not summon evil. It opened a wound where Heaven's law contradicts itself, and something remembered the path upward.",
      knownBy:"True Record; Abyssal Record",
      effects:{prestige:[1,5], artCorruption:[3,8], actorDrift:[3,8]}
    },
    {
      cls:"c-lost",
      level:"major",
      publicRecord:"An old ruin tied to {sect} sinks below black water. Divers return with bleeding ears and no treasure.",
      trueRecord:"The ruin moved rather than sank. Its corridors now align with a future heir who has not yet been born.",
      knownBy:"True Record; Abyssal Record; drowned witnesses",
      effects:{prestige:[-2,3], artCorruption:[2,6]}
    },
    {
      cls:"c-corrupt",
      level:"normal",
      publicRecord:"A nameless wanderer near {region} repeats a phrase no scripture records: 'Heaven forgot its first mistake.'",
      trueRecord:"The phrase is a key. Anyone who dreams it three times becomes easier for death qi and resentment rites to find.",
      knownBy:"True Record; hidden-lineage dream readers",
      effects:{prestige:[0,3], actorDrift:[2,5]}
    }
  ]
};
