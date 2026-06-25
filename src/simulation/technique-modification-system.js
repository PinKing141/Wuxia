"use strict";

import { deriveTechnique, recordTechniqueEvent, registerTechniqueHolder, unregisterTechniqueHolder } from "../entities/technique.js";
import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { aref, chron, ref } from "../observer/chronicle.js";
import { aliveFigs } from "../observer/selectors.js";
import { STATE } from "../state.js";
import { chance, clamp, pick, ri } from "../utils/random.js";

export function tickTechniqueModification(){
  if(!chance(.1)) return;
  const modifiers = aliveFigs().filter(person=>person.art && person.realm >= 4 && person.comprehension >= 58 && (!person.lastTechniqueModificationYear || person.lastTechniqueModificationYear + 18 <= STATE.year));
  if(!modifiers.length) return;
  const creator = pick(modifiers);
  const parent = creator.art;
  const injuryPressure = creator.injuries?.length ? 12 : 0;
  const demonicShift = ["heretical","abyssal"].includes(creator.align) || creator.alignmentDrift > 55;
  const child = deriveTechnique(parent, creator, {
    path:creator.path,
    qiType:creator.qiType,
    corruption:clamp(parent.corruption + (demonicShift ? ri(8,22) : ri(-8,8)), 0, 100),
    completeness:clamp(parent.completeness + Math.floor((creator.comprehension - 60) / 4) - injuryPressure + ri(-10,12), 30, 100),
    publicKnown:creator.fame >= 28,
    damaged:injuryPressure > 0 && chance(.35),
    forbidden:demonicShift || parent.forbidden
  });
  STATE.arts.push(child);
  unregisterTechniqueHolder(parent, creator, {type:"branched_away", note:`${creator.name} created ${child.name}.`});
  creator.art = child;
  registerTechniqueHolder(child, creator, {type:"branch_creator", note:`${creator.name} created this branch from ${parent.name}.`});
  creator.lastTechniqueModificationYear = STATE.year;
  const event = chron(
    "c-art",
    `${ref(creator)} modifies ${aref(parent)} into ${aref(child)}, creating a branch lineage.`,
    child.grade === "Heaven" || child.forbidden ? "major" : "normal",
    {
      trueRecord:`The branch came from life history: injuries ${creator.injuries?.length || 0}, personality ${creator.personalityTraits?.[0] || "unknown"}, path ${creator.path}, qi ${creator.qiType}, comprehension ${Math.round(creator.comprehension)}, and parent corruption ${Math.round(parent.corruption)}.`,
      knownBy:"True Record; direct inheritors",
      causalType:"technique",
      regionId:creator.currentRegionId || creator.sect?.regionId || null,
      causes:[
        cause("Parent Technique", parent.name, `${aref(parent)} had grade ${parent.grade}, completeness ${Math.round(parent.completeness)}, and corruption ${Math.round(parent.corruption)}.`),
        cause("Modifier", creator.name, `${ref(creator)} altered the manual through ${creator.personalityTraits?.[0] || "personal"} temperament and ${creator.path} cultivation.`),
        cause("Life History", "Body and memory", injuryPressure ? "Injuries forced practical changes to circulation." : "Accumulated insight made a new route possible.")
      ],
      effects:[
        effect("Lineage", "Branch created", `${aref(parent)} now has child technique ${aref(child)}.`),
        effect("Technique", "New risks", `${aref(child)} carries risks: ${child.risks.join(", ")}.`)
      ],
      beneficiaries:[
        benefit(ref(creator), "Owns a personal technique branch.", "The parent lineage may reject or reclaim it.")
      ],
      rumour:child.forbidden ? rumour("Half-true", "lineage whispers", "The branch is dangerous, but public gossip cannot yet explain why.") : null
    }
  );
  recordTechniqueEvent(parent, {type:"modified", personId:creator.id, relatedTechniqueId:child.id, eventId:event.id, note:`Modified into ${child.name}.`});
  recordTechniqueEvent(child, {type:"branch_recorded", personId:creator.id, relatedTechniqueId:parent.id, eventId:event.id, note:`Branch lineage entered history.`});
}
