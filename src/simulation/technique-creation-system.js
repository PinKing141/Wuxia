"use strict";

import { makeTechnique, recordTechniqueEvent, registerTechniqueHolder, unregisterTechniqueHolder } from "../entities/technique.js";
import { benefit, cause, effect } from "../observer/causality.js";
import { aref, chron, ref } from "../observer/chronicle.js";
import { aliveFigs } from "../observer/selectors.js";
import { STATE } from "../state.js";
import { chance, clamp, pick, ri } from "../utils/random.js";

export function tickTechniqueCreation(){
  if(!chance(.08)) return;
  const creators = aliveFigs().filter(person=>person.realm >= 5 && person.comprehension >= 64 && (!person.lastTechniqueCreationYear || person.lastTechniqueCreationYear + 25 <= STATE.year));
  if(!creators.length) return;
  const creator = pick(creators);
  const oldArt = creator.art || null;
  const technique = makeTechnique(creator.align, {
    path:creator.path,
    qiType:creator.qiType,
    tier:clamp(Math.floor(creator.realm / 2) + ri(2, 4), 2, 9),
    creatorId:creator.id,
    originFactionId:creator.sect?.id || null,
    publicKnown:creator.fame >= 25,
    completeness:clamp(55 + Math.floor(creator.comprehension / 2) + ri(-12, 10), 45, 100),
    corruption:creator.align === "heretical" || creator.align === "abyssal" ? ri(35, 80) : ri(0, 24)
  });
  STATE.arts.push(technique);
  if(oldArt) unregisterTechniqueHolder(oldArt, creator, {type:"creator_moved_on", note:`${creator.name} created ${technique.name}.`});
  creator.art = technique;
  registerTechniqueHolder(technique, creator, {type:"creator", note:`${creator.name} created the technique.`});
  creator.lastTechniqueCreationYear = STATE.year;
  const event = chron(
    "c-art",
    `${ref(creator)} creates ${aref(technique)}, a new ${technique.type} born from personal cultivation.`,
    technique.grade === "Heaven" || technique.grade === "Saint" || technique.grade === "Immortal" ? "major" : "normal",
    {
      trueRecord:`Creation required realm ${creator.realm}, comprehension ${Math.round(creator.comprehension)}, path ${creator.path}, qi ${creator.qiType}, memories, and pressure from ${oldArt ? "existing inheritance " + aref(oldArt) : "solitary cultivation"}. The technique now has creator and holder records.`,
      knownBy:"True Record; close witnesses",
      causalType:"technique",
      regionId:creator.currentRegionId || creator.sect?.regionId || null,
      causes:[
        cause("Creator", creator.name, `${ref(creator)} has comprehension ${Math.round(creator.comprehension)} and realm ${creator.realm}.`),
        cause("Path", creator.path, `${creator.path} with ${creator.qiType} shaped the manual.`),
        cause("Need", "Personal style", "Existing techniques no longer fully expressed the cultivator's road.")
      ],
      effects:[
        effect("Technique", "New manual enters history", `${aref(technique)} can now be inherited, stolen, damaged, or branched.`)
      ],
      beneficiaries:[
        benefit(ref(creator), "Becomes the founder of a technique lineage.", "Future holders inherit their enemies and flaws.")
      ]
    }
  );
  recordTechniqueEvent(technique, {type:"created", personId:creator.id, eventId:event.id, note:"Created through enlightenment."});
}
