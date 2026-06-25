"use strict";

import { STATE, newId } from "../state.js";
import { clamp } from "../utils/random.js";

export function memoryById(id){
  return STATE.memories?.find(memory=>memory.id === id) || null;
}

export function addMemory(person, opts={}){
  if(!person) return null;
  if(!STATE.memories) STATE.memories = [];
  if(!person.memories) person.memories = [];
  const memory = {
    id:newId(),
    kind:"memory",
    personId:person.id,
    type:opts.type || "notable_event",
    relatedPersonId:opts.relatedPersonId || null,
    relatedFactionId:opts.relatedFactionId || null,
    relatedEventId:opts.relatedEventId || null,
    emotionalWeight:clamp(opts.emotionalWeight ?? 20, -100, 100),
    year:opts.year || STATE.year,
    publicKnown:Boolean(opts.publicKnown),
    hidden:Boolean(opts.hidden),
    influenceApplied:Boolean(opts.influenceApplied),
    text:opts.text || "A memory without a surviving public description."
  };
  STATE.memories.push(memory);
  person.memories.push(memory.id);
  if(person.memories.length > 18) person.memories.shift();
  return memory;
}

export function rememberEvent(person, event, opts={}){
  if(!event) return addMemory(person, opts);
  return addMemory(person, {
    ...opts,
    relatedEventId:event.id,
    year:event.year,
    text:opts.text || stripTags(event.publicRecord || event.html || "An event marked their path.")
  });
}

function stripTags(value){
  return String(value).replace(/<[^>]*>/g, "");
}
