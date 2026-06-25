"use strict";

import { RELATIONSHIP_FEELING_KEYS } from "../data/character-life.js";
import { STATE, newId } from "../state.js";
import { clamp } from "../utils/random.js";

const RECIPROCAL_TYPES = {
  master:"disciple",
  disciple:"master",
  parent:"child",
  child:"parent",
  sibling:"sibling",
  sworn_sibling:"sworn_sibling",
  friend:"friend",
  rival:"rival",
  enemy:"enemy",
  lover:"lover",
  spouse:"spouse",
  benefactor:"life_debtor",
  life_debtor:"benefactor",
  killer:"victim",
  victim:"killer",
  betrayer:"betrayed",
  betrayed:"betrayer",
  protector:"protected",
  protected:"protector",
  secret_admirer:"admired",
  admired:"secret_admirer",
  political_ally:"political_ally"
};

export function relationshipById(id){
  return STATE.relationships?.find(relationship=>relationship.id === id) || null;
}

export function upsertRelationship(opts={}){
  if(!opts.fromId || !opts.toId || opts.fromId === opts.toId) return null;
  if(!STATE.relationships) STATE.relationships = [];
  const type = opts.type || "known";
  let relationship = STATE.relationships.find(item=>item.fromId === opts.fromId && item.toId === opts.toId && item.type === type);
  if(!relationship){
    relationship = {
      id:newId(),
      kind:"relationship",
      fromId:opts.fromId,
      toId:opts.toId,
      type,
      feelings:emptyFeelings(),
      sourceEventId:opts.sourceEventId || null,
      publicKnown:Boolean(opts.publicKnown),
      hidden:Boolean(opts.hidden),
      note:opts.note || "",
      since:opts.since || STATE.year
    };
    STATE.relationships.push(relationship);
  }
  relationship.feelings = mergeFeelings(relationship.feelings, opts.feelings || {});
  if(opts.sourceEventId) relationship.sourceEventId = opts.sourceEventId;
  if(opts.note) relationship.note = opts.note;
  attachRelationshipId(opts.fromPerson || personById(opts.fromId), relationship.id);
  return relationship;
}

export function upsertRelationshipPair(from, to, type, feelings={}, reverseFeelings={}, opts={}){
  if(!from || !to || from.id === to.id) return [];
  const forward = upsertRelationship({
    ...opts,
    fromId:from.id,
    toId:to.id,
    type,
    feelings,
    fromPerson:from
  });
  const reverseType = opts.reverseType || RECIPROCAL_TYPES[type] || type;
  const reverse = upsertRelationship({
    ...opts,
    fromId:to.id,
    toId:from.id,
    type:reverseType,
    feelings:reverseFeelings,
    fromPerson:to
  });
  return [forward, reverse].filter(Boolean);
}

export function relationshipLabel(relationship){
  if(!relationship) return "";
  return relationship.type.replace(/_/g, " ");
}

function personById(id){
  return STATE.figures?.find(person=>person.id === id) || null;
}

function attachRelationshipId(person, id){
  if(!person) return;
  if(!person.relationships) person.relationships = [];
  if(!person.relationships.includes(id)) person.relationships.push(id);
  if(person.relationships.length > 24) person.relationships.shift();
}

function emptyFeelings(){
  return Object.fromEntries(RELATIONSHIP_FEELING_KEYS.map(key=>[key, 0]));
}

function mergeFeelings(base, next){
  const merged = {...emptyFeelings(), ...base};
  for(const [key, value] of Object.entries(next)){
    if(key in merged) merged[key] = clamp(merged[key] + value, -100, 100);
  }
  return merged;
}

