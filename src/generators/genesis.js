"use strict";

import { FIXED_POWERS, INSTITUTION_HEAD_TITLES } from "../data/factions.js";
import { makeFigure, rankForFigure, updatePublicIdentity } from "../entities/figure.js";
import { addMemory } from "../entities/memory.js";
import { upsertRelationshipPair } from "../entities/relationship.js";
import { makeSect } from "../entities/faction.js";
import { makeTechnique, recordTechniqueEvent, registerTechniqueHolder } from "../entities/technique.js";
import { addFactionSeat, createMapState } from "./regions.js";
import { benefit, cause, effect } from "../observer/causality.js";
import { aref, chron, ref, sref } from "../observer/chronicle.js";
import { setState, STATE } from "../state.js";
import { initializeEraState } from "../simulation/era-system.js";
import { maybeName } from "../simulation/identity.js";
import { pick, ri, seedRng } from "../utils/random.js";

export function genesis(seed){
  seedRng(seed >>> 0);
  setState({
    idc:1, year:1, season:0, seasonNames:["Spring","Summer","Autumn","Winter"],
    figures:[], sects:[], arts:[], regions:[], landmarks:[], families:[], memories:[], relationships:[], rumours:[],
    log:[], logc:1, rumourc:1, warc:1, calamityc:1, dirtyLog:true, dirtyPanels:true,
    activeWars:[], wars:[], era:null, eraHistory:[], worldTension:null, calamities:[], threatActive:false, seed
  });
  const mapState = createMapState();
  STATE.regions.push(...mapState.regions);
  STATE.landmarks.push(...mapState.landmarks);

  const nArt = ri(10,13);
  for(let i = 0; i < nArt; i++){
    STATE.arts.push(makeTechnique(pick(["righteous","righteous","clan","imperial","academy","temple","rogue","heretical","abyssal","hidden"])));
  }

  const powerSeeds = [...FIXED_POWERS];
  const nSect = ri(4,6);
  for(let i = 0; i < nSect; i++) powerSeeds.push({});

  for(const seedPower of powerSeeds){
    const s = makeSect(seedPower);
    STATE.sects.push(s);
    addFactionSeat(s);
    const cand = STATE.arts.filter(a=>!a.lost && a.align === s.align && (s.paths.includes(a.path) || s.qiTypes.includes(a.qiType)));
    if(!cand.length){
      STATE.arts.push(makeTechnique(s.align, {path:pick(s.paths), qiType:pick(s.qiTypes), weakness:s.weakness}));
    }
    const matched = STATE.arts.filter(a=>!a.lost && a.align === s.align && (s.paths.includes(a.path) || s.qiTypes.includes(a.qiType)));
    s.signatureArt = matched.length ? pick(matched) : pick(STATE.arts);
    s.signatureArt.originFactionId ||= s.id;
    recordTechniqueEvent(s.signatureArt, {type:"adopted_by_faction", factionId:s.id, note:`Adopted as signature technique of ${s.name}.`});

    for(let j = 0; j < ri(3,5); j++){
      const f = makeFigure({align:s.align, sect:s, art:s.signatureArt, realm:ri(2,4), age:ri(28,55)});
      s.members.push(f.id);
      STATE.figures.push(f);
      registerTechniqueHolder(s.signatureArt, f, {type:"founding_holder", factionId:s.id, note:`Founding holder of ${s.name}.`});
    }

    const head = INSTITUTION_HEAD_TITLES[s.type] || "Sect Leader";
    const founder = makeFigure({align:s.align, sect:s, art:s.signatureArt, realm:ri(4,6), age:ri(48,70), talent:ri(55,90), rankInFaction:head});
    maybeName(founder, true);
    s.leaderId = founder.id;
    s.members.push(founder.id);
    STATE.figures.push(founder);
    s.signatureArt.creatorId ||= founder.id;
    registerTechniqueHolder(s.signatureArt, founder, {type:"founder_holder", factionId:s.id, note:`Founder safeguarded ${s.signatureArt.name}.`});
    for(const disciple of s.members.map(id=>STATE.figures.find(f=>f.id === id)).filter(f=>f && f !== founder)){
      disciple.master = founder.id;
      disciple.rankInFaction = rankForFigure(s, disciple.realm);
      updatePublicIdentity(disciple);
      if(!founder.discipleIds.includes(disciple.id)) founder.discipleIds.push(disciple.id);
      upsertRelationshipPair(founder, disciple, "master", {respect:18, loyalty:10, trust:8}, {respect:26, loyalty:18, admiration:16}, {
        publicKnown:true,
        note:"Founding master-disciple bond."
      });
      addMemory(disciple, {
        type:"founding_disciple",
        relatedPersonId:founder.id,
        relatedFactionId:s.id,
        emotionalWeight:18,
        publicKnown:true,
        text:`Entered ${s.recordName} under ${founder.name}.`
      });
    }
    const possibleSuccessors = s.members
      .map(id=>STATE.figures.find(f=>f.id === id))
      .filter(f=>f && f !== founder)
      .sort((a, b)=>(b.realm - a.realm) || (b.fame - a.fame) || (b.comprehension - a.comprehension));
    s.successorId = possibleSuccessors[0]?.id || null;
    chron(
      "c-found",
      `${sref(s)} enters the World Chronicle in ${s.region} under ${ref(founder)}, ${head} of the ${s.type}, who safeguards ${aref(s.signatureArt)}.`,
      "major",
      {
        trueRecord:`The public founding hides a fragile dependence on ${ref(founder)} and ${aref(s.signatureArt)}. Its institution type is ${s.type}, its core path is ${s.paths[0]}, its dominant qi is ${s.qiTypes[0]}, and its weakness remains ${s.weakness}. Prestige ${Math.round(s.prestige)} is reputation, not destiny.`,
        knownBy:"True Record; founding elders",
        causalType:"inheritance",
        regionId:s.regionId,
        locationId:s.seatId,
        causes:[
          cause("Lineage", "Founding pillar", `${ref(founder)} binds personal realm and reputation to ${sref(s)}.`),
          cause("Technique", "Signature inheritance", `${aref(s.signatureArt)} gives the faction a coherent ${s.signatureArt.path} path.`),
          cause("Region", s.region, `${sref(s)} controls a seat in ${s.region}.`),
          cause("Weakness", "Known fracture", s.weakness)
        ],
        effects:[
          effect("Institution", "Faction enters the ledger", `${sref(s)} can now recruit, war, decline, and pass down grudges.`)
        ],
        beneficiaries:[
          benefit(sref(s), "Receives a public founding, disciples, and legitimacy.", s.weakness),
          benefit(ref(founder), "Becomes the named pillar of a formal power.", "Their fall would endanger the institution.")
        ]
      }
    );
  }

  for(let i = 0; i < ri(3,6); i++){
    const f = makeFigure({align:pick(["hidden","rogue","righteous","academy","clan"]), realm:ri(1,3), age:ri(20,40)});
    STATE.figures.push(f);
  }

  initializeEraState();

  chron(
    "c-peace",
    `The World Chronicle opens. ${STATE.sects.length} dynasties, academies, sects, clans, temples, and hidden powers move beneath Heaven; the public ink records only what can be admitted.`,
    "epic",
    {
      trueRecord:`Beneath the opening ledger are ${STATE.figures.length} living cultivators, ${STATE.arts.length} manuals, and first-class records for paths, qi types, weaknesses, oaths, debts, and buried techniques.`,
      knownBy:"True Record",
      causalType:"world-seed",
      causes:[
        cause("World", "Opening state", `${STATE.sects.length} powers, ${STATE.regions.length} regions, ${STATE.landmarks.length} landmarks, and ${STATE.arts.length} manuals define the first pressures beneath Heaven.`)
      ],
      effects:[
        effect("History", "Causality begins", "Future wars, inheritances, betrayals, and calamities will trace back to these initial bonds.")
      ],
      beneficiaries:[
        benefit("The observer", "Can read more truth than any actor inside the Jianghu.", "Knowledge does not grant control.")
      ]
    }
  );
}
