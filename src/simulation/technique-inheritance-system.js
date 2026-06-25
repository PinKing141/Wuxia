"use strict";

import { addMemory, rememberEvent } from "../entities/memory.js";
import { recordTechniqueEvent, registerTechniqueHolder, syncTechniqueHolders, unregisterTechniqueHolder } from "../entities/technique.js";
import { benefit, cause, effect } from "../observer/causality.js";
import { aref, chron, ref } from "../observer/chronicle.js";
import { aliveFigs } from "../observer/selectors.js";
import { chance, pick } from "../utils/random.js";

export function tickTechniqueInheritance(){
  for(const figure of aliveFigs()){
    if(figure.art) registerTechniqueHolder(figure.art, figure, {type:"holder_sync", note:"Holder sync confirmed."});
  }
  if(chance(.16)) maybeTeacherInheritance();
}

export function inheritTechnique({teacher, student, technique, event=null, reason="direct transmission", publicKnown=false}={}){
  if(!student || !technique) return null;
  if(student.art && student.art.id !== technique.id) unregisterTechniqueHolder(student.art, student, {type:"replaced_by_inheritance", note:`Replaced by ${technique.name}.`});
  student.art = technique;
  registerTechniqueHolder(technique, student, {
    type:"inherited",
    eventId:event?.id || null,
    note:teacher ? `${student.name} inherited from ${teacher.name}: ${reason}.` : `${student.name} inherited the technique: ${reason}.`
  });
  addMemory(student, {
    type:"technique_inherited",
    relatedPersonId:teacher?.id || null,
    relatedEventId:event?.id || null,
    emotionalWeight:26,
    publicKnown,
    hidden:!publicKnown,
    text:`Inherited ${technique.name}${teacher ? " from " + teacher.name : ""}.`
  });
  if(teacher){
    addMemory(teacher, {
      type:"technique_transmitted",
      relatedPersonId:student.id,
      relatedEventId:event?.id || null,
      emotionalWeight:16,
      publicKnown,
      hidden:!publicKnown,
      text:`Transmitted ${technique.name} to ${student.name}.`
    });
  }
  return technique;
}

export function loseTechnique(technique, why, event=null){
  if(!technique) return null;
  technique.lost = true;
  technique.dormant = false;
  technique.lostYear = event?.year || technique.lostYear || null;
  technique.lostHolder ||= "";
  technique.currentHolderIds = [];
  technique.holders = 0;
  recordTechniqueEvent(technique, {
    type:"lost",
    eventId:event?.id || null,
    note:why || "Technique was lost."
  });
  return technique;
}

export function rediscoverTechnique(technique, finder, event=null){
  if(!technique || !finder) return null;
  technique.lost = false;
  technique.dormant = false;
  technique.lostYear = null;
  finder.art = technique;
  registerTechniqueHolder(technique, finder, {
    type:"rediscovered",
    eventId:event?.id || null,
    note:`${finder.name} rediscovered the manual.`
  });
  return technique;
}

export function recordTechniqueDeath(person, event=null){
  if(!person?.art) return;
  const art = person.art;
  unregisterTechniqueHolder(art, person, {type:"holder_died", eventId:event?.id || null, note:`${person.name} died while carrying the technique.`});
  syncTechniqueHolders(art);
}

function maybeTeacherInheritance(){
  const teachers = aliveFigs().filter(person=>person.art && person.discipleIds?.length);
  if(!teachers.length) return;
  const teacher = pick(teachers);
  const students = teacher.discipleIds.map(id=>aliveFigs().find(person=>person.id === id)).filter(person=>person && (!person.art || person.art.id !== teacher.art.id));
  if(!students.length) return;
  const student = pick(students);
  const event = chron(
    "c-lineage",
    `${ref(teacher)} formally transmits ${aref(teacher.art)} to ${ref(student)}.`,
    teacher.realm >= 6 || teacher.art.grade === "Heaven" ? "major" : "normal",
    {
      trueRecord:`The transmission happened because teacher, disciple, technique compatibility, and lineage pressure aligned. ${teacher.art.name} now has explicit holder history instead of only a holder count.`,
      knownBy:"True Record; lineage witnesses",
      causalType:"technique-inheritance",
      regionId:teacher.currentRegionId || student.currentRegionId || null,
      causes:[
        cause("Teacher", teacher.name, `${ref(teacher)} already holds ${aref(teacher.art)}.`),
        cause("Disciple", student.name, `${ref(student)} is connected by master-disciple lineage.`),
        cause("Technique", teacher.art.grade, `${aref(teacher.art)} carries grade ${teacher.art.grade} and type ${teacher.art.type}.`)
      ],
      effects:[
        effect("Lineage", "Holder added", `${ref(student)} becomes a recorded holder.`)
      ],
      beneficiaries:[
        benefit(ref(student), "Receives a formal inheritance.", "Teacher's enemies may now target the disciple.")
      ]
    }
  );
  inheritTechnique({teacher, student, technique:teacher.art, event, reason:"formal master-disciple transmission", publicKnown:event.level === "major"});
  rememberEvent(student, event, {type:"technique_inherited", relatedPersonId:teacher.id, emotionalWeight:30, publicKnown:event.level === "major"});
}
