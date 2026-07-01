"use strict";

import { realmStageName } from "../data/cultivation.js";
import { ambitionLabel, traitLabel } from "../entities/figure.js";
import { relationshipById, upsertRelationshipPair } from "../entities/relationship.js";
import { addMemory, rememberEvent } from "../entities/memory.js";
import { recordTechniqueEvent } from "../entities/technique.js";
import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { aref, chron, ref, sref } from "../observer/chronicle.js";
import { aliveFigs, figById } from "../observer/selectors.js";
import { chance, clamp, pick, ri } from "../utils/random.js";

export function tickRelationshipSystem(){
  for(const figure of aliveFigs()){
    for(const relationshipId of figure.relationships || []){
      const relationship = relationshipById(relationshipId);
      if(!relationship || relationship.fromId !== figure.id) continue;
      const other = figById(relationship.toId);
      if(!other || !other.alive) continue;
      driftRelationship(figure, other, relationship);
    }
  }
  maybeCreateLifeDebt();
  maybeJealousBetrayal();
  maybeRomanceTension();
  maybeMasterFavoritism();
}

function driftRelationship(figure, other, relationship){
  const feelings = relationship.feelings || {};
  if(["friend", "sworn_sibling", "lover", "master", "disciple", "benefactor", "life_debtor"].includes(relationship.type)){
    feelings.trust = clamp((feelings.trust || 0) + 1, -100, 100);
    feelings.respect = clamp((feelings.respect || 0) + (chance(.35) ? 1 : 0), -100, 100);
    if(figure.sect && figure.sect === other.sect) feelings.loyalty = clamp((feelings.loyalty || 0) + 1, -100, 100);
  }

  if(["rival", "enemy", "betrayer", "betrayed", "killer"].includes(relationship.type)){
    const ambitionPressure = figure.ambitions?.some(key=>["avenge_family","destroy_rival_faction","surpass_senior","prove_talent"].includes(key));
    feelings.resentment = clamp((feelings.resentment || 0) + (ambitionPressure ? 2 : 1), -100, 100);
    if(figure.personalityTraits?.some(key=>["vengeful","jealous","ruthless","arrogant"].includes(key))){
      feelings.hatred = clamp((feelings.hatred || 0) + (chance(.45) ? 1 : 0), -100, 100);
    }
  }
}

function maybeCreateLifeDebt(){
  if(!chance(.08)) return;
  const wounded = aliveFigs().filter(figure=>figure.injuries?.length);
  const healers = aliveFigs().filter(figure=>figure.path === "medicine" || figure.qiType === "spiritual" || figure.sect?.paths?.includes("medicine"));
  if(!wounded.length || !healers.length) return;
  const debtor = pick(wounded);
  let benefactor = pick(healers);
  let guard = 0;
  while(benefactor.id === debtor.id && guard++ < 5) benefactor = pick(healers);
  if(benefactor.id === debtor.id) return;

  const healed = debtor.injuries.splice(0, Math.min(2, debtor.injuries.length));
  upsertRelationshipPair(benefactor, debtor, "benefactor",
    {debt:-4, respect:10, trust:8},
    {debt:28, respect:18, trust:12, loyalty:8},
    {
      publicKnown:false,
      note:"A life debt formed after emergency healing."
    }
  );
  addMemory(debtor, {
    type:"life_debt",
    relatedPersonId:benefactor.id,
    emotionalWeight:34,
    hidden:true,
    text:`Owes a life debt to ${benefactor.name} after emergency healing of ${healed.map(item=>item.label).join(", ")}.`
  });
  addMemory(benefactor, {
    type:"saved_life",
    relatedPersonId:debtor.id,
    emotionalWeight:18,
    hidden:true,
    text:`Saved ${debtor.name} from a cultivation wound.`
  });
  debtor.mentalState = clamp((debtor.mentalState || 50) + ri(3, 8), 1, 100);
}

function maybeJealousBetrayal(){
  if(!chance(.07)) return;
  const candidates = [];
  for(const actor of aliveFigs()){
    for(const relationshipId of actor.relationships || []){
      const relationship = relationshipById(relationshipId);
      const target = figById(relationship?.toId);
      if(!relationship || !target?.alive || actor.id === target.id) continue;
      const feelings = relationship.feelings || {};
      const jealousy = (feelings.envy || 0) + (feelings.resentment || 0) + (actor.personalityTraits?.includes("jealous") ? 18 : 0);
      if(jealousy >= 34 && (target.art || target.realm > actor.realm || target.fame > actor.fame)) candidates.push({actor, target, relationship, jealousy});
    }
  }
  if(!candidates.length) return;
  const {actor, target, jealousy} = pick(candidates);
  const event = chron(
    "c-lineage",
    `${ref(actor)} betrays ${ref(target)} after years of envy, stealing notes from ${target.art ? aref(target.art) : "their private cultivation commentary"}.`,
    jealousy >= 70 ? "major" : "normal",
    {
      trueRecord:`This betrayal was selected from relationship state: envy and resentment ${Math.round(jealousy)}, actor ambition ${ambitionLabel(actor.ambitions?.[0])}, target fame ${Math.round(target.fame || 0)}, and stored bonds that made access possible.`,
      knownBy:"True Record; the betrayer; possible hidden witnesses",
      causalType:"relationship",
      regionId:actor.currentRegionId || target.currentRegionId || null,
      causes:[
        cause("Jealousy", "Relationship pressure", `${ref(actor)} had enough envy and resentment toward ${ref(target)} to act.`),
        cause("Opportunity", "Access through bond", "Betrayal required closeness before it could become theft."),
        cause("Ambition", actor.ambitions?.[0] || "unknown", "The actor's ambition made the shortcut tempting.")
      ],
      effects:[
        effect("Memory", "Victim remembers", `${ref(target)} now carries a betrayal memory.`),
        effect("Grudge", "Relationship poisoned", "Future duels or assassinations can grow from this theft.")
      ],
      beneficiaries:[
        benefit(ref(actor), "May gain insight without earning it.", "Becomes tied to a dangerous revenge chain.")
      ],
      rumour:rumour("Half-true", "sect corridors", "The theft is real, but the public version hides the years of envy that caused it.")
    }
  );
  if(!target.grudges) target.grudges = [];
  if(!target.grudges.includes(actor.id)) target.grudges.push(actor.id);
  if(target.art){
    recordTechniqueEvent(target.art, {
      type:"stolen",
      personId:actor.id,
      eventId:event.id,
      note:`${actor.name} stole notes from ${target.name}.`
    });
  }
  upsertRelationshipPair(actor, target, "betrayer",
    {envy:18, resentment:20, trust:-30},
    {hatred:34, resentment:28, trust:-42},
    {sourceEventId:event.id, hidden:true, note:"Jealousy-driven betrayal."}
  );
  rememberEvent(target, event, {type:"betrayal", relatedPersonId:actor.id, emotionalWeight:-48, hidden:false});
  rememberEvent(actor, event, {type:"betrayed_friend", relatedPersonId:target.id, emotionalWeight:16, hidden:true});
}

function maybeRomanceTension(){
  if(!chance(.05)) return;
  const lovers = [];
  for(const actor of aliveFigs()){
    for(const relationshipId of actor.relationships || []){
      const relationship = relationshipById(relationshipId);
      const target = figById(relationship?.toId);
      if(relationship?.type === "lover" && target?.alive && actor.sect && target.sect && actor.sect !== target.sect){
        lovers.push({actor, target, relationship});
      }
    }
  }
  if(!lovers.length) return;
  const {actor, target} = pick(lovers);
  const event = chron(
    "c-peace",
    `A forbidden romance between ${ref(actor)} and ${ref(target)} becomes faction gossip; ${sref(actor.sect)} and ${sref(target.sect)} both lose face.`,
    "normal",
    {
      trueRecord:`The affection mattered because it crossed faction boundaries. Love, fear, public disgrace, and sect reputation converted a private bond into political pressure.`,
      knownBy:"True Record; rumour brokers; faction attendants",
      causalType:"relationship",
      regionId:actor.currentRegionId || target.currentRegionId || actor.sect.regionId || target.sect.regionId || null,
      causes:[
        cause("Relationship", "Forbidden romance", `${ref(actor)} and ${ref(target)} already had a hidden lover bond.`),
        cause("Faction Face", "Public disgrace", `${sref(actor.sect)} and ${sref(target.sect)} cannot admit the attachment cleanly.`),
        cause("Fear", "Exposure", "Both actors risk punishment or coercion.")
      ],
      effects:[
        effect("Faction Tension", "Private love becomes leverage", "Rivals can use the romance as pressure."),
        effect("Memory", "The lovers remember exposure", "The relationship gains fear as well as affection.")
      ],
      beneficiaries:[
        benefit("Rumour brokers", "Gain a story with political value.", "False versions can trigger retaliation.")
      ],
      rumour:rumour("Exaggerated", "teahouse mouths", "The affection is real, but public gossip exaggerates what each faction knows.")
    }
  );
  actor.sect.prestige = clamp((actor.sect.prestige || 0) - 1, 0, 100);
  target.sect.prestige = clamp((target.sect.prestige || 0) - 1, 0, 100);
  rememberEvent(actor, event, {type:"romance_exposed", relatedPersonId:target.id, emotionalWeight:-16, hidden:true});
  rememberEvent(target, event, {type:"romance_exposed", relatedPersonId:actor.id, emotionalWeight:-16, hidden:true});
  upsertRelationshipPair(actor, target, "lover",
    {love:4, fear:10, trust:2},
    {love:4, fear:10, trust:2},
    {sourceEventId:event.id, hidden:true, note:"Forbidden romance created faction tension."}
  );
}

function maybeMasterFavoritism(){
  if(!chance(.06)) return;
  const masters = aliveFigs().filter(master=>(master.discipleIds || []).map(figById).filter(person=>person?.alive).length >= 2);
  if(!masters.length) return;
  const master = pick(masters);
  const disciples = (master.discipleIds || []).map(figById).filter(person=>person?.alive);
  disciples.sort((a, b)=>(b.realm - a.realm) || (b.fame - a.fame) || (b.comprehension - a.comprehension));
  const favourite = disciples[0];
  const jealous = pick(disciples.slice(1));
  if(!favourite || !jealous) return;
  const event = chron(
    "c-lineage",
    `${ref(master)} praises ${ref(favourite)} before the hall; ${ref(jealous)} lowers their head, but remembers.`,
    "normal",
    {
      trueRecord:`Master favoritism created a succession pressure point. ${ref(favourite)} has reached ${realmStageName(favourite.realm, favourite.progress, true)}, fame ${Math.round(favourite.fame || 0)}, comprehension ${Math.round(favourite.comprehension || 0)}; ${ref(jealous)} carries a ${ambitionLabel(jealous.ambitions?.[0]).toLowerCase()} ambition and a ${traitLabel(jealous.personalityTraits?.[0]).toLowerCase()} temperament.`,
      knownBy:"True Record; inner disciples",
      causalType:"relationship",
      regionId:master.currentRegionId || favourite.currentRegionId || jealous.currentRegionId || null,
      causes:[
        cause("Lineage", "Public praise", `${ref(master)} elevated one disciple before others.`),
        cause("Ambition", jealous.ambitions?.[0] || "unknown", `${ref(jealous)} now has a reason to compare themself against ${ref(favourite)}.`),
        cause("Succession", "Status anxiety", "Praise inside a faction can become future inheritance conflict.")
      ],
      effects:[
        effect("Rivalry", "Disciple resentment grows", `${ref(jealous)} forms a rivalry memory toward ${ref(favourite)}.`)
      ],
      beneficiaries:[
        benefit(ref(favourite), "Receives public legitimacy.", "Becomes a target for jealous peers.")
      ]
    }
  );
  if(!jealous.grudges) jealous.grudges = [];
  if(!jealous.grudges.includes(favourite.id)) jealous.grudges.push(favourite.id);
  upsertRelationshipPair(jealous, favourite, "rival",
    {envy:24, resentment:18, admiration:4},
    {respect:8, resentment:4},
    {sourceEventId:event.id, hidden:true, note:"Master favoritism seeded succession resentment."}
  );
  rememberEvent(jealous, event, {type:"master_favoritism", relatedPersonId:favourite.id, emotionalWeight:-30, hidden:true});
  rememberEvent(favourite, event, {type:"praised_by_master", relatedPersonId:master.id, emotionalWeight:20, publicKnown:true});
}
