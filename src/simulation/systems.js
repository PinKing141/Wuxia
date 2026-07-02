"use strict";

import { APEX, PATH_FLAVOR, REALMS, REALM_RECORD_NAMES, SUB_STAGES, displayRealmStage, realmStageName } from "../data/cultivation.js";
import { FACTION_EVENT_TABLES } from "../data/faction-events.js";
import { ambitionLabel, fearLabel, makeFigure, recomputeLife, recomputePower, traitLabel, updatePublicIdentity, updateReputation, updateStage } from "../entities/figure.js";
import { addMemory, rememberEvent } from "../entities/memory.js";
import { upsertRelationshipPair } from "../entities/relationship.js";
import { makeSect } from "../entities/faction.js";
import { gradeForTier } from "../data/techniques.js";
import { recordTechniqueEvent, registerTechniqueHolder, syncTechniqueHolders } from "../entities/technique.js";
import { addFactionSeat } from "../generators/regions.js";
import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { aref, chron, plainRef, ref, sref } from "../observer/chronicle.js";
import { locationName, randomLandmark, randomRegion, regionName } from "../observer/map-state.js";
import { aliveFigs, aliveSects, figById, sectMight, topMember, warExists } from "../observer/selectors.js";
import { STATE } from "../state.js";
import { alignShift, maybeName } from "./identity.js";
import { cap, chance, clamp, dual, pick, rand, ri } from "../utils/random.js";
import { applyBreakthroughOutcome, breakthroughOutcomeLabel, isBreakthroughSuccess, resolveBreakthroughAttempt } from "./breakthrough-system.js";
import { cultivationGainFor, normalizeCultivationState, tickCultivationRecovery } from "./cultivation-system.js";
import { tickInnerDemons } from "./inner-demon-system.js";
import { addInjury, injuryDeathPressure, tickInjuries } from "./injury-system.js";
import { tickGrudgeSystem } from "./grudge-system.js";
import { tickMemorySystem } from "./memory-system.js";
import { tickRelationshipSystem } from "./relationship-system.js";
import { recruitmentPlanFor, tickFactionSystem } from "./faction-system.js";
import { tickFactionPoliticsSystem } from "./faction-politics-system.js";
import { tickSuccessionSystem } from "./succession-system.js";
import { tickChronicleSystem } from "./chronicle-system.js";
import { tickRumourSystem } from "./rumour-system.js";
import { recordFactionCollapseAftermath, warAftermathText } from "./aftermath-system.js";
import { recordBattleResult, recordWarRivalry } from "./battle-system.js";
import { tickTechniqueCreation } from "./technique-creation-system.js";
import { tickTechniqueInheritance, inheritTechnique, loseTechnique, recordTechniqueDeath, rediscoverTechnique } from "./technique-inheritance-system.js";
import { tickTechniqueModification } from "./technique-modification-system.js";
import { closeStructuredWar, startStructuredWar, tickConflictPressureSystem } from "./war-system.js";
import { tickRegionalEvents } from "./regional-event-system.js";
import { tickTerritory } from "./territory-system.js";
import { tickTravel } from "./travel-system.js";
import { tickCharacterLife } from "./life-system.js";
import { tickCalamityResolution, tickEraSystem } from "./era-system.js";

export function tick(){
  STATE.season++;
  if(STATE.season > 3){
    STATE.season = 0;
    STATE.year++;
  }
  const yearTurn = STATE.season === 0;

  sysCultivation();
  sysFame();
  if(yearTurn){
    sysAging();
    tickFactionSystem();
    tickSuccessionSystem();
    tickFactionPoliticsSystem();
    sysRecruitment();
    sysArtRefinement();
    tickTechniqueInheritance();
    tickTechniqueCreation();
    tickTechniqueModification();
    tickConflictPressureSystem();
    sysRivalryAndWar();
    sysCorruptionAndThreat();
    sysLostAndFound();
    sysSectFortune();
    sysFactionEvents();
    sysHeroicArcs();
    tickCharacterLife();
    tickMemorySystem();
    tickRelationshipSystem();
    tickGrudgeSystem({killFigure});
    tickChronicleSystem();
    tickRumourSystem();
    tickCultivationRecovery();
    tickInjuries();
    tickInnerDemons();
    tickTravel();
    tickTerritory();
    tickRegionalEvents();
    tickCalamityResolution();
    tickEraSystem();
  }
  STATE.dirtyPanels = true;
}

function figureRegionId(f){
  return f?.currentRegionId || f?.sect?.regionId || null;
}

function factionRegionPayload(s){
  return {regionId:s?.regionId || null, locationId:s?.seatId || null};
}

function sysCultivation(){
  for(const f of aliveFigs()){
    normalizeCultivationState(f);
    if(f.realm >= APEX){
      f.progress = 100;
      updateStage(f);
      continue;
    }
    const previousStage = f.stage;
    let gain = cultivationGainFor(f);
    if(f.align === "abyssal") gain *= 1.35;
    if(f.align === "heretical") gain *= 1.25;
    if(f.align === "hidden") gain *= 0.8;
    if(f.sect) gain *= 1.1;
    if(f.art && f.art.path === f.path) gain *= 1.08;
    if(f.art && f.art.qiType === f.qiType) gain *= 1.06;
    if(f.sect && !f.sect.paths.includes(f.path)) gain *= 0.92;
    gain *= f.realm < 3 ? 1 : clamp(1 - (f.realm - 2) * 0.12, 0.14, 1);
    if(f.injuries?.length) gain *= clamp(1 - f.injuries.length * 0.04, 0.72, 1);
    if(f.ambitions?.includes("prove_talent") || f.ambitions?.includes("become_famous")) gain *= 1.02;
    if(f.fears?.includes("inner_demons") && f.alignmentDrift > 60) gain *= 0.96;
    f.progress += gain;
    if(f.progress >= 100){
      const outcome = resolveBreakthroughAttempt(f);
      applyBreakthroughOutcome(f, outcome);
      if(outcome.type === "death"){
        killFigure(f, `dies during a failed breakthrough into ${outcome.nextRealmName}, their meridians unable to contain the backlash`);
        continue;
      }
      if(!isBreakthroughSuccess(outcome)){
        recordBreakthroughFailure(f, outcome);
        updateStage(f);
        recomputeLife(f);
        recomputePower(f);
        continue;
      }
      updateStage(f);
      recomputeLife(f);
      recomputePower(f);
      f.fame += 3 + f.realm;
      const flavor = PATH_FLAVOR[f.align];
      if(f.realm >= 3){
        const level = f.realm >= 6 ? "major" : "normal";
        const variants = level === "major" ? {
          trueRecord:`The breakthrough opened at the ${SUB_STAGES[f.stage]} stage as ${breakthroughOutcomeLabel(outcome.type).toLowerCase()}. It was shaped by ${f.art ? aref(f.art) : "personal insight"}, the ${f.path} path, ${f.qiType} cultivation, cultivation talent ${Math.round(f.cultivationTalent ?? f.talent)}, comprehension ${Math.round(f.comprehension || 0)}, foundation ${Math.round(f.foundationQuality || 0)}, qi purity ${Math.round(f.qiPurity || 0)}, mental state ${Math.round(f.mentalState || 0)}, resources ${Math.round(f.resources || 0)}, technique compatibility ${Math.round(f.techniqueCompatibility || 0)}, master guidance ${Math.round(f.masterGuidance || 0)}, and ${f.align === "abyssal" ? "death qi and resentment pressing against Heaven's law" : f.sect ? "the resources of " + sref(f.sect) : "solitary hardship"}.`,
          knownBy:"True Record; senior observers of the realm",
          causalType:"cultivation",
          causes:[
            cause("Talent", "Innate capacity", `${ref(f)} carries cultivation talent ${Math.round(f.cultivationTalent ?? f.talent)}, comprehension ${Math.round(f.comprehension || 0)}, and foundation ${Math.round(f.foundationQuality || 0)}.`),
            cause("Qi State", "Purity and mind", `Qi purity ${Math.round(f.qiPurity || 0)}, mental state ${Math.round(f.mentalState || 0)}, and pill toxicity ${Math.round(f.pillToxicity || 0)} shaped the gate.`),
            cause("Path", "Cultivation method", `${f.path} path with ${f.qiType} shaped the breakthrough.`),
            cause("Technique", "Manual compatibility", f.art ? `${aref(f.art)} ${f.art.path === f.path || f.art.qiType === f.qiType ? "matched" : "strained against"} the cultivator's foundation.` : "No recorded manual guided the final step."),
            cause("Ambition", ambitionLabel(f.ambitions?.[0]), `${ref(f)} wants to ${ambitionLabel(f.ambitions?.[0]).toLowerCase()}.`)
          ],
          effects:[
            effect("Realm", "Power rises", `${ref(f)} reaches ${realmStageName(f.realm, f.progress, true)} and gains public weight.`),
            outcome.flawed ? effect("Foundation", "Flaw remains", "The gate opened, but future breakthroughs will carry hidden instability.") : effect("Foundation", "Stable advance", "The breakthrough does not leave an obvious hidden wound.")
          ]
        } : {};
        const flawText = outcome.flawed ? " The ascent is real, but the foundation trembles beneath the public triumph." : "";
        const breakthroughEvent = chron("c-break", `${ref(f)} ${flavor.verb} the realm of <b style="color:var(--gold)">${displayRealmStage(f.realm, f.progress)}</b>, ${pick(flavor.via)}.${flawText}`, level, {
          ...variants,
          regionId:figureRegionId(f)
        });
        rememberEvent(f, breakthroughEvent, {
          type:outcome.flawed ? "flawed_breakthrough" : "breakthrough",
          emotionalWeight:outcome.flawed ? 18 : 34,
          publicKnown:level === "major",
          text:`Reached ${displayRealmStage(f.realm, f.progress)} through ${breakthroughOutcomeLabel(outcome.type).toLowerCase()} while pursuing ${ambitionLabel(f.ambitions?.[0]).toLowerCase()}.`
        });
      }
      maybeName(f);
      if(f.realm === APEX){
        const apexEvent = chron(
          "c-break",
          `Heaven itself takes notice: ${ref(f)} has touched the <b style="color:var(--gold-bright)">Tribulation Transcendence</b>, the apex no mortal is meant to reach.`,
          "epic",
          {
            trueRecord:`This ascent bends fate around ${ref(f)}. Every faction that fears immortality will either kneel, scheme, or prepare a calamity.`,
            knownBy:"True Record; Heaven's omen-readers",
            causalType:"calamity",
            regionId:figureRegionId(f),
            causes:[
              cause("Realm", "Apex pressure", `${ref(f)} reached ${REALM_RECORD_NAMES[f.realm]}, a height that destabilizes every faction's plans.`),
              cause("Fate", "Heaven notices", "Immortality-level pressure draws omens, fear, schemes, and assassination plans.")
            ],
            effects:[
              effect("Jianghu", "Balance shifts", "Major powers must answer the possibility of an Ascended rival.")
            ]
          }
        );
        rememberEvent(f, apexEvent, {
          type:"apex_breakthrough",
          emotionalWeight:80,
          publicKnown:true,
          text:"Touched Tribulation Transcendence and changed the balance beneath Heaven."
        });
      }
    } else {
      const nextStage = updateStage(f);
      recomputePower(f);
      if(nextStage > previousStage) chronSubStage(f, nextStage);
    }
  }
}

function recordBreakthroughFailure(f, outcome){
  if(outcome.injuryType){
    addInjury(f, outcome.injuryType, outcome.injurySeverity || 1, `${breakthroughOutcomeLabel(outcome.type)} while attempting ${outcome.nextRealmName}`);
  }
  const emotionalWeight = outcome.type === "failure" ? -22 : -36;
  addMemory(f, {
    type:outcome.type === "failure" ? "failed_breakthrough" : outcome.type,
    emotionalWeight,
    hidden:true,
    text:`${breakthroughOutcomeLabel(outcome.type)} while attempting ${outcome.nextRealmName}; foundation ${Math.round(f.foundationQuality || 0)}, qi purity ${Math.round(f.qiPurity || 0)}, mental state ${Math.round(f.mentalState || 0)}.`
  });
  const shouldRecord = outcome.type !== "failure" || f.realm >= 6 || f.namedAt != null || chance(.06);
  if(!shouldRecord) return;
  const failEvent = chron(
    outcome.type === "inner_demon" ? "c-corrupt" : "c-break",
    `${ref(f)} attempts to cross into ${outcome.nextRealmName}, but suffers ${breakthroughOutcomeLabel(outcome.type).toLowerCase()}.`,
    f.realm >= 7 || ["severe_backlash","qi_deviation","inner_demon"].includes(outcome.type) ? "major" : "normal",
    {
      trueRecord:`The failed gate was caused by support ${Math.round(outcome.support)}, difficulty ${Math.round(outcome.difficulty)}, chance ${Math.round(outcome.probability * 100)}%, foundation ${Math.round(f.foundationQuality || 0)}, qi purity ${Math.round(f.qiPurity || 0)}, mental state ${Math.round(f.mentalState || 0)}, resources ${Math.round(f.resources || 0)}, technique compatibility ${Math.round(f.techniqueCompatibility || 0)}, master guidance ${Math.round(f.masterGuidance || 0)}, pill toxicity ${Math.round(f.pillToxicity || 0)}, and inner demon pressure ${Math.round(f.innerDemon || 0)}.`,
      knownBy:"True Record; secluded witnesses",
      causalType:"cultivation",
      regionId:figureRegionId(f),
      causes:[
        cause("Bottleneck", REALMS[f.realm], "Accumulation alone could not open the next gate."),
        cause("Foundation", "Hidden strain", `${ref(f)} carries foundation ${Math.round(f.foundationQuality || 0)} and qi purity ${Math.round(f.qiPurity || 0)}.`),
        cause("Mind", "Dao heart pressure", `Mental state ${Math.round(f.mentalState || 0)} and inner demon pressure ${Math.round(f.innerDemon || 0)} shaped the backlash.`)
      ],
      effects:[
        effect("Cultivation", "Progress set back", `${ref(f)} must rebuild before the next attempt.`),
        outcome.injuryType ? effect("Injury", "Cultivation wound", `${ref(f)} now carries ${breakthroughOutcomeLabel(outcome.type).toLowerCase()}.`) : effect("Memory", "Failure remembered", "The setback becomes part of the cultivator's private history.")
      ],
      beneficiaries:[
        benefit("Rivals and cautious elders", "Gain evidence of a hidden bottleneck.", "If they act too openly, the failure may become a grudge.")
      ]
    }
  );
  rememberEvent(f, failEvent, {type:outcome.type === "failure" ? "failed_breakthrough" : outcome.type, emotionalWeight:emotionalWeight - 8, hidden:true});
}

function chronSubStage(f, stage){
  if(f.realm < 4) return;
  if(!(f.realm >= 6 || f.namedAt != null || f.fame >= 18)) return;
  if(!chance(.08)) return;
  const stageName = SUB_STAGES[stage];
  const event = chron(
    "c-break",
    `${ref(f)} steadies their foundation at the <b style="color:var(--gold)">${stageName} stage of ${REALMS[f.realm]}</b>.`,
    "normal",
    {
      causalType:"cultivation",
      regionId:figureRegionId(f),
      causes:[
        cause("Accumulation", "Sub-stage threshold", `${ref(f)} crossed into ${stageName} ${REALM_RECORD_NAMES[f.realm]} with ${Math.round(f.progress)}% realm accumulation.`),
        cause("Foundation", "Path and qi", `${f.path} practice with ${f.qiType} shaped the internal bottleneck.`)
      ],
      effects:[
        effect("Foundation", "Realm depth increases", `${ref(f)} has not changed realms, but their ${REALM_RECORD_NAMES[f.realm]} foundation has deepened.`)
      ],
      beneficiaries:[
        benefit(ref(f), "Gains steadier power inside the current realm.", "Rivals can now read the pace of their advancement.")
      ]
    }
  );
  rememberEvent(f, event, {
    type:"foundation_deepened",
    emotionalWeight:12,
    publicKnown:f.fame >= 18,
    text:`Deepened foundation at ${stageName} ${REALM_RECORD_NAMES[f.realm]}.`
  });
}

function passesRealmGate(f){
  if(f.realm < 7) return true;
  const score = ((f.foundationQuality || 50) + (f.daoHeart || 50) + (f.willpower || 50) + (f.luck || 50)) / 4;
  let probability = 0.24 + (score - 60) / 140 - (f.realm - 7) * 0.085;
  if(f.art && (f.art.path === f.path || f.art.qiType === f.qiType)) probability += 0.04;
  if(f.sect) probability += 0.04;
  if(f.ambitions?.includes("prove_talent")) probability += 0.02;
  if(f.fears?.includes("qi_deviation") || f.fears?.includes("inner_demons")) probability -= 0.03;
  return chance(clamp(probability, 0.04, 0.55));
}

function sysFame(){
  for(const f of aliveFigs()){
    if(chance(.04)){
      f.fame += rand() * 2;
      updateReputation(f);
      maybeName(f);
    }
  }
}

function sysAging(){
  for(const f of aliveFigs()){
    f.age++;
    const over = f.age - f.lifespan;
    let deathP = over > 0 ? 0.18 + over * 0.05 : (f.age > f.lifespan - 10 ? 0.02 : 0.004);
    deathP += injuryDeathPressure(f);
    if(f.align === "abyssal") deathP += 0.02;
    if(f.align === "heretical") deathP += 0.01;
    if(chance(deathP)) killFigure(f, "passes from the world, their inner qi returning to heaven and earth");
  }
}

export function killFigure(f, why){
  f.alive = false;
  f.diedYear = STATE.year;
  f.causeOfDeath = why;
  let techniqueDeathRecorded = false;
  if(f.sect) f.sect.members = f.sect.members.filter(id=>id !== f.id);
  if(f.namedAt != null || f.realm >= 4){
    const level = f.realm >= 6 ? "major" : "normal";
    const variants = level === "major" ? {
      trueRecord:`Their end followed age ${f.age}, lifespan ${f.lifespan}, realm ${REALM_RECORD_NAMES[f.realm]}, the ${f.path} path, ${f.qiType}, and ${f.art ? "the burden of " + aref(f.art) : "no recorded signature manual"}.`,
      knownBy:"True Record; death registrars and nearby witnesses",
      causalType:"death",
      causes:[
        cause("Mortality", "Lifespan pressure", `${ref(f)} was age ${f.age} against lifespan ${f.lifespan}.`),
        cause("Realm", "Cultivation burden", `${REALM_RECORD_NAMES[f.realm]} power strained a ${f.path} foundation.`),
        cause("Technique", "Inheritance burden", f.art ? `${aref(f.art)} shaped the final years.` : "No signature manual protected the end.")
      ],
      effects:[
        effect("Lineage", "Inheritance weakens", f.sect ? `${sref(f.sect)} loses a major pillar.` : "A wanderer's loose inheritances scatter.")
      ]
    } : {};
    const deathEvent = chron("c-death", `${ref(f)}${f.sect ? " of " + f.sect.name : ""} ${why}. ${f.realm >= 6 ? "An age ends with them." : ""}`, level, {
      ...variants,
      regionId:figureRegionId(f)
    });
    recordTechniqueDeath(f, deathEvent);
    techniqueDeathRecorded = true;
    for(const disciple of (f.discipleIds || []).map(figById).filter(person=>person && person.alive)){
      addMemory(disciple, {
        type:"master_lost",
        relatedPersonId:f.id,
        relatedEventId:deathEvent.id,
        emotionalWeight:-42,
        publicKnown:level === "major",
        text:`Lost master ${f.name}: ${why}.`
      });
    }
    if(f.isThreat){
      STATE.threatActive = false;
      chron(
        "c-peace",
        `With the fall of the Son of the Abyss, the Jianghu exhales. Yet ${aref(f.art)} was never recovered...`,
        "major",
        {
          trueRecord:`The body fell, but the contradiction that empowered the Son of the Abyss returned to dormancy rather than extinction.`,
          knownBy:"True Record; Abyssal Record",
          causalType:"calamity",
          regionId:figureRegionId(f),
          causes:[
            cause("Abyss", "Contradiction survives", "The Son of the Abyss was a vessel, not the source."),
            cause("Technique", "Dormant inheritance", `${aref(f.art)} remains unrecovered.`)
          ],
          effects:[
            effect("Abyssal Record", "Future recurrence", "The same contradiction can reappear through another heir.")
          ]
        }
      );
      if(f.art){
        f.art.dormant = true;
        f.art.lostHolder = f.name;
        recordTechniqueEvent(f.art, {type:"dormant", personId:f.id, note:"Became dormant after the Son of the Abyss fell."});
      }
    }
  }
  if(!techniqueDeathRecorded) recordTechniqueDeath(f, null);
}

function sysRecruitment(){
  for(const s of aliveSects()){
    const plan = recruitmentPlanFor(s);
    const living = s.members.map(figById).filter(x=>x && x.alive);
    if(living.length < plan.min){
      for(let i = 0; i < ri(1,2); i++){
        const master = topMember(s) || pick(living) || null;
        const f = makeFigure({align:s.align, sect:s, art:s.signatureArt, realm:0, age:ri(13,18), talent:ri(plan.talent[0], plan.talent[1]), master:master?.id || null});
        s.members.push(f.id);
        STATE.figures.push(f);
        if(s.signatureArt) registerTechniqueHolder(s.signatureArt, f, {type:"recruited_holder", note:`Recruited into ${s.name}.`});
      }
    } else if(chance(plan.chance) && living.length < plan.max){
      const master = pick(living.filter(x=>x.realm >= 3)) || pick(living);
      const f = makeFigure({align:s.align, sect:s, art:s.signatureArt, realm:0, age:ri(12,17), talent:ri(plan.talent[0], plan.talent[1]), master:master ? master.id : null});
      s.members.push(f.id);
      STATE.figures.push(f);
      if(s.signatureArt) registerTechniqueHolder(s.signatureArt, f, {type:"recruited_holder", note:`Recruited into ${s.name}.`});
      if(f.talent >= 68){
        const event = chron("c-lineage", `A prodigy named ${plainRef(f)} is taken in by ${sref(s)}; the elders whisper of a rare innate root.`, "normal", factionRegionPayload(s));
        rememberEvent(f, event, {
          type:"praised_by_elders",
          emotionalWeight:22,
          publicKnown:true,
          text:`Was praised as a prodigy by ${s.name}.`
        });
      }
    }
  }
}

function sysArtRefinement(){
  for(const a of STATE.arts){
    if(a.lost || a.dormant) continue;
    const masters = aliveFigs().filter(f=>f.art === a && f.realm >= 5);
    if(masters.length && chance(.12) && a.tier < 9){
      a.tier++;
      a.grade = gradeForTier(a.tier);
      a.modifiedYear = STATE.year;
      const m = pick(masters);
      const ord = ["","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth"][a.tier];
      const level = a.tier >= 7 ? "major" : "normal";
      const variants = level === "major" ? {
        trueRecord:`The refinement is not purely scholarly: the manual's ${a.path} path and ${a.qiType} responded to ${a.corruption > 30 ? "corruption within the practitioner's desire" : "years of accumulated insight"}.`,
        knownBy:"True Record; direct inheritors of the technique",
        causalType:"inheritance",
        regionId:figureRegionId(m),
        causes:[
          cause("Technique", "Path resonance", `${aref(a)} follows the ${a.path} path and ${a.qiType}.`),
          cause("Practitioner", "Living master", `${ref(m)} had enough realm depth to expose another stratum.`),
          cause("Risk", "Manual corruption", `Corruption stands at ${Math.round(a.corruption)}.`)
        ],
        effects:[
          effect("Manual", "Technique tier rises", `${aref(a)} reaches tier ${a.tier}.`)
        ]
      } : {};
      const event = chron("c-art", `${ref(m)} comprehends a higher layer of ${aref(a)}, refining it to its ${ord} stratum.`, level, variants);
      recordTechniqueEvent(a, {type:"refined", personId:m.id, eventId:event.id, note:`Refined to tier ${a.tier} and grade ${a.grade}.`});
      rememberEvent(m, event, {
        type:"technique_refined",
        emotionalWeight:26,
        publicKnown:level === "major",
        text:`Refined ${a.name} to its ${ord} stratum through ${traitLabel(m.personalityTraits?.[0]).toLowerCase()} discipline.`
      });
    }
  }
}

function sysRivalryAndWar(){
  const sects = aliveSects();
  for(const w of [...STATE.activeWars]){
    w.years++;
    const A = STATE.sects.find(s=>s.id === w.a);
    const B = STATE.sects.find(s=>s.id === w.b);
    if(!A || !B || !A.alive || !B.alive){
      endWar(w, A, B);
      continue;
    }
    const pa = sectMight(A);
    const pb = sectMight(B);
    if(chance(.5)) battle(A, B, pa, pb, w);
    if(w.years >= 2 && (chance(.3) || Math.abs(pa - pb) > pa * 0.6)){
      const winner = pa >= pb ? A : B;
      const loser = pa >= pb ? B : A;
      endWar(w, A, B, winner, loser);
    }
  }

  if(sects.length >= 2 && STATE.activeWars.length < 2 && chance(.22)){
    const a = pick(sects);
    let b = pick(sects);
    let guard = 0;
    while(b === a && guard++ < 5) b = pick(sects);
    if(a !== b && !warExists(a, b)){
      const enemyPaths = (["heretical","abyssal"].includes(a.align) && b.align === "righteous") || (a.align === "righteous" && ["heretical","abyssal"].includes(b.align));
      if(enemyPaths || chance(.4)){
        const warRegionOptions = [a.regionId, b.regionId].filter(Boolean);
        const warRegionId = warRegionOptions.length ? pick(warRegionOptions) : null;
        const publicCause = enemyPaths ? "the righteous cannot abide the heretical" : pick(["a stolen manual","an assassinated elder","a contested mountain","an old blood-debt","a marriage betrayed","a duel gone wrong"]);
        const w = startStructuredWar({
          a,
          b,
          regionId:warRegionId,
          publicJustification:publicCause,
          immediateCause:publicCause,
          deepCause:`The balance before war was ${Math.round(sectMight(a))} to ${Math.round(sectMight(b))}, with faction weaknesses ready to be exploited.`,
          hiddenCause:enemyPaths ? "Orthodox and heretical legitimacy pressure needed a target." : "Prestige pressure, regional opportunity, and old grudges made the public spark usable.",
          mainAggressor:a,
          trueMotive:"Convert pressure into public permission for violence."
        });
        const warEvent = chron(
          "c-war",
          `${pick(["Banners rise","War drums sound","Blood is sworn"])}: ${sref(a)} and ${sref(b)} fall into open war — ${dual(w.name, w.recordName)} — over ${publicCause}.`,
          "major",
          {
            trueRecord:`The public cause is only the spark. The balance before war was ${Math.round(sectMight(a))} to ${Math.round(sectMight(b))}; ${sref(a)} risks ${a.weakness}, while ${sref(b)} risks ${b.weakness}.`,
            knownBy:"True Record; faction spies; war accountants",
            causalType:"war",
            regionId:warRegionId,
            causes:[
              cause("Public Spark", "Declared grievance", publicCause),
              cause("Power Balance", "Might comparison", `${sref(a)} stood at ${Math.round(sectMight(a))}; ${sref(b)} stood at ${Math.round(sectMight(b))}.`),
              cause("Region", regionName(warRegionId), "The dispute now has a place on the map."),
              cause("Weakness", a.name, a.weakness),
              cause("Weakness", b.name, b.weakness)
            ],
            effects:[
              effect("War", "Open conflict begins", `${w.name} starts in Year ${STATE.year}.`)
            ],
            beneficiaries:[
              benefit(sref(a), "Gains a public justification to strike first.", a.weakness),
              benefit(sref(b), "Can rally disciples around a declared external enemy.", b.weakness)
            ]
          }
        );
        w.causeEventId = warEvent.id;
        w.hiddenCauseEventId = warEvent.hiddenCauseIds?.[0] || null;
        warEvent.warId = w.id;
      }
    }
  }
}

function battle(A, B, pa, pb, w){
  const winner = pa >= pb ? A : B;
  const loser = pa >= pb ? B : A;
  const victims = loser.members.map(figById).filter(x=>x && x.alive);
  let casualty = null;
  if(victims.length > 1 && chance(.6)){
    const v = pick(victims.sort((x, y)=>x.power - y.power).slice(0, Math.ceil(victims.length / 2)));
    if(v){
      casualty = v;
      killFigure(v, `falls in battle during ${dual(w.name, w.recordName)}`);
    }
  }
  const cA = topMember(winner);
  const cB = topMember(loser);
  let duelEventId = null;
  if(cA && cB && chance(.25)){
    const event = chron("c-duel", `At the height of ${w.name}, ${ref(cA)} crosses blades with ${ref(cB)} - ${pick(["a clash that splits the very air","three hundred exchanges beneath a bleeding moon","steel and inner qi until the river ran red"])}.`, "normal", {
      regionId:w.regionId || winner.regionId || loser.regionId || null
    });
    duelEventId = event.id;
    event.warId = w.id;
    upsertRelationshipPair(cA, cB, "rival", {respect:8, resentment:8}, {respect:6, resentment:14, fear:4}, {
      sourceEventId:event.id,
      publicKnown:true,
      note:`Crossed blades during ${w.name}.`
    });
    rememberEvent(cA, event, {type:"battle_duel", relatedPersonId:cB.id, emotionalWeight:18, publicKnown:true});
    rememberEvent(cB, event, {type:"battle_duel", relatedPersonId:cA.id, emotionalWeight:-18, publicKnown:true});
    recordWarRivalry(w, cA, cB, event.id);
  }
  recordBattleResult(w, {
    winner,
    loser,
    eventId:duelEventId,
    casualty,
    regionId:w.regionId || winner.regionId || loser.regionId || null,
    summary:`${winner.name} gained advantage over ${loser.name}${casualty ? `; ${casualty.name} fell` : ""}.`
  });
}

function endWar(w, A, B, winner, loser){
  const aftermath = warAftermathText(w, winner, loser);
  closeStructuredWar(w, A, B, winner, loser, aftermath);
  if(winner && loser){
    winner.prestige += ri(8,18);
    loser.prestige -= ri(15,30);
    const endEvent = chron(
      "c-war",
      `${dual(w.name, w.recordName)} ends. ${sref(winner)} stands victorious; ${sref(loser)} is broken and humbled.`,
      "major",
      {
        trueRecord:`Victory followed accumulated might, surviving elites, and prestige loss more than righteous mandate; ${sref(loser)} now carries debts that will seed future grudges.`,
        knownBy:"True Record; War Annals",
        causalType:"war",
        regionId:w.regionId || winner.regionId || loser.regionId || null,
        causes:[
          cause("War Duration", "Attrition", `${w.name} lasted ${w.years} years.`),
          cause("Might", "Winner's advantage", `${sref(winner)} retained enough elites to force surrender.`),
          cause("Weakness", loser.name, loser.weakness)
        ],
        effects:[
          effect("Prestige", "Winner rises", `${sref(winner)} gains standing.`),
          effect("Grudge", "Loser remembers", `${sref(loser)} carries a debt into future causality.`)
        ],
        beneficiaries:[
          benefit(sref(winner), "Prestige, territory, and narrative control after the war.", "New grudges from surviving enemies."),
          benefit("War chroniclers and spies", "Better knowledge of faction weaknesses.", "")
        ]
      }
    );
    endEvent.warId = w.id;
    if(loser.prestige <= 8 || chance(.4)) dissolveSect(loser, `shattered in ${w.name}`, w);
  }
}

function dissolveSect(s, why, war=null){
  if(!s.alive) return;
  s.alive = false;
  s.deadYear = STATE.year;
  const survivors = s.members.map(figById).filter(x=>x && x.alive);
  for(const f of survivors){
    f.sect = null;
    f.rankInFaction = "Wanderer";
    updatePublicIdentity(f);
    addMemory(f, {
      type:"exile",
      relatedFactionId:s.id,
      emotionalWeight:-36,
      publicKnown:false,
      text:`Survived the fall of ${s.name} and scattered into the Jianghu.`
    });
    if(chance(.3) && f.align === "righteous") f.align = "rogue";
  }
  const fallEvent = chron(
    "c-fall",
    `${sref(s)} is ${why}; its disciples scatter into the Jianghu, its halls left empty.`,
    "major",
    {
      trueRecord:`${survivors.length} survivors escaped the formal record. Some will become wanderers, some resentful heirs, and some future knives in another faction's hand.`,
      knownBy:"True Record; scattered disciples",
      causalType:"inheritance",
      regionId:s.regionId,
      locationId:s.seatId,
      causes:[
        cause("Collapse", "Prestige failure", `${sref(s)} could no longer sustain its halls.`),
        cause("Weakness", "Faction flaw", s.weakness),
        cause("Survivors", "Scattered inheritance", `${survivors.length} disciples survived outside formal control.`)
      ],
      effects:[
        effect("Jianghu", "Wanderers created", "Scattered disciples may become heirs, grudges, or future founders."),
        effect("Technique", "Manual risk", s.signatureArt ? `${aref(s.signatureArt)} may be lost with the ruins.` : "No signature manual remains.")
      ],
      beneficiaries:[
        benefit("Rival factions", `Can recruit or hunt ${survivors.length} scattered survivors.`, "Absorbing survivors may import old grudges.")
      ]
    }
  );
  if(war){
    fallEvent.warId = war.id;
    recordFactionCollapseAftermath(war, s, fallEvent.id);
  }
  if(s.signatureArt && s.signatureArt.holders <= 1 && chance(.5)){
    loseArt(s.signatureArt, `buried in the ruin of ${s.name}`);
  }
}

function sysCorruptionAndThreat(){
  for(const f of aliveFigs()){
    if(f.align !== "hidden"){
      let drift = 0;
      if(f.art && f.art.corruption > 30) drift += rand() * 1.5;
      if(f.grudges.length) drift += rand() * 1.2;
      if(STATE.activeWars.length) drift += rand() * 0.6;
      if(f.personalityTraits?.includes("ruthless") || f.personalityTraits?.includes("obsessive")) drift += rand() * 0.35;
      if(f.personalityTraits?.includes("merciful") || f.personalityTraits?.includes("devout")) drift -= rand() * 0.2;
      if(f.fears?.includes("inner_demons") && f.daoHeart >= 65) drift -= rand() * 0.25;
      if(drift > 0) alignShift(f, drift);
    }
    if(!STATE.threatActive && f.align === "abyssal" && f.realm >= 7 && f.alignmentDrift >= 85 && chance(.4)){
      f.isThreat = true;
      STATE.threatActive = true;
      maybeName(f);
      chron(
        "c-threat",
        `A shadow falls over all under heaven: ${ref(f)} ascends as the <b style="color:var(--blood)">Son of the Abyss</b> and declares the old order finished. ${f.lineage ? `Heir to ${f.lineage}, ` : ""}the Jianghu trembles.`,
        "epic",
        {
          trueRecord:`This calamity was not born in a single night. Alignment drift reached ${Math.round(f.alignmentDrift)}, realm ${REALM_RECORD_NAMES[f.realm]}, and ${f.art ? aref(f.art) : "a nameless abyssal inheritance"} opened the door.`,
          knownBy:"True Record; Abyssal Record",
          causalType:"calamity",
          regionId:figureRegionId(f),
          causes:[
            cause("Alignment Drift", "Abyssal threshold", `${ref(f)} reached drift ${Math.round(f.alignmentDrift)}.`),
            cause("Realm", "Calamity vessel", `${REALM_RECORD_NAMES[f.realm]} power could bear the contradiction.`),
            cause("Technique", "Doorway", f.art ? `${aref(f.art)} opened the route.` : "A nameless abyssal inheritance opened the route.")
          ],
          effects:[
            effect("World", "Son of the Abyss active", "All factions now react to a calamity-level existence.")
          ],
          beneficiaries:[
            benefit("Abyssal Remnant", "Its buried contradiction gains a living vessel.", "Heaven's rejection intensifies."),
            benefit("Fearful factions", "Can use the calamity as a reason to consolidate power.", "")
          ]
        }
      );
    }
  }
  if(STATE.threatActive){
    const threat = aliveFigs().find(f=>f.isThreat);
    if(threat && chance(.35)){
      const heroes = aliveFigs().filter(f=>f.align !== "abyssal" && f.realm >= 5 && f !== threat);
      if(heroes.length >= 2){
        const champ = heroes.sort((a, b)=>b.power - a.power)[0];
        if(champ.power > threat.power * 0.85 && chance(.5)){
          killFigure(threat, `is at last cut down by ${champ.epithet ? cap(champ.epithet.en) : champ.name} and the righteous alliance`);
          champ.fame += 20;
          maybeName(champ);
          chron(
            "c-rise",
            `${ref(champ)} is hailed across the Jianghu as the hero who slew the Son of the Abyss.`,
            "major",
            {
              trueRecord:`The champion survived because their power stood at ${champ.power} against the calamity's ${threat.power}; courage mattered, but the numbers beneath fate mattered too.`,
              knownBy:"True Record; surviving alliance elders",
              causalType:"calamity",
              regionId:figureRegionId(threat) || figureRegionId(champ),
              causes:[
                cause("Power", "Champion threshold", `${ref(champ)} stood at ${champ.power} against ${threat.power}.`),
                cause("Alliance", "Collective pressure", "The righteous alliance created the opening for the final strike.")
              ],
              effects:[
                effect("Fame", "Heroic title", `${ref(champ)} gains renown for ending the calamity.`),
                effect("Abyss", "Dormancy", "The Abyss retreats, but does not vanish.")
              ],
              beneficiaries:[
                benefit(ref(champ), "Heroic legitimacy and fame.", "Enemies now measure themselves against the hero."),
                benefit("Righteous alliance", "Public claim to have saved the Jianghu.", "The Abyssal thread remains unresolved.")
              ]
            }
          );
        } else {
          killFigure(champ, "is slain confronting the Son of the Abyss");
        }
      }
    }
  }
}

function sysLostAndFound(){
  for(const a of STATE.arts){
    syncTechniqueHolders(a);
    if(!a.lost && !a.dormant && a.holders <= 0 && chance(.5)){
      loseArt(a, "its last practitioner dead, the manual mislaid");
    }
  }
  const lost = STATE.arts.filter(a=>a.lost || a.dormant);
  if(lost.length && chance(.14)){
    const a = pick(lost);
    const wasDormant = a.dormant;
    const archetype = pick([
      {n:"a destitute beggar",t:ri(70,95)},
      {n:"an orphaned woodcutter",t:ri(65,90)},
      {n:"a disgraced servant",t:ri(60,88)},
      {n:"a wandering mute child",t:ri(72,96)},
      {n:"a condemned prisoner",t:ri(60,85)}
    ]);
    const f = makeFigure({align:wasDormant ? "abyssal" : (["heretical","abyssal"].includes(a.align) ? "rogue" : a.align), realm:1, age:ri(15,24), talent:archetype.t, art:a});
    const lostDuration = STATE.year - (a.lostYear || a.origin);
    if(a.lostHolder) f.lineage = a.lostHolder + "'s legacy";
    const region = randomRegion();
    const landmark = randomLandmark(region?.id, "Ancient Ruin") || randomLandmark(region?.id, "Cultivation Site") || randomLandmark(region?.id);
    f.birthplaceRegionId = f.birthplaceRegionId || region?.id || null;
    f.currentRegionId = region?.id || f.currentRegionId;
    STATE.figures.push(f);
    const foundEvent = chron(
      "c-found2",
      `In ${landmark ? locationName({locationId:landmark.id}) : regionName(region?.id)}, ${archetype.n} named ${plainRef(f)} stumbles upon ${aref(a)}, lost ${lostDuration} years. Fate chooses strangely.`,
      "major",
      {
        trueRecord:`The manual resurfaced because its last thread of causality had not ended${a.lostHolder ? "; it still remembers " + a.lostHolder : ""}. Talent ${archetype.t} made the new bearer visible to fate.`,
        knownBy:"True Record; hidden witnesses near the inheritance site",
        causalType:"inheritance",
        regionId:region?.id || null,
        locationId:landmark?.id || null,
        causes:[
          cause("Manual", "Unfinished thread", `${aref(a)} still had unresolved holders in fate.`),
          cause("Bearer", "Innate root", `${plainRef(f)} carries talent ${archetype.t}.`),
          cause("Location", "Hidden site", "The inheritance resurfaced away from formal faction control.")
        ],
        effects:[
          effect("Cultivator", "New heir", `${plainRef(f)} becomes a bearer of ${aref(a)}.`),
          effect("Jianghu", "Future disruption", "A lost manual returns outside established succession.")
        ],
        beneficiaries:[
          benefit(plainRef(f), `Receives ${aref(a)} and a path into the Jianghu.`, "The manual's enemies and corruption now follow them."),
          benefit("Hidden witnesses", "Gain knowledge before public factions can respond.", "")
        ]
      }
    );
    rediscoverTechnique(a, f, foundEvent);
    rememberEvent(f, foundEvent, {
      type:"found_forbidden_manual",
      relatedFactionId:a.originFactionId || null,
      emotionalWeight:46,
      hidden:a.corruption > 35,
      publicKnown:false,
      text:`Found ${a.name} in ${landmark ? locationName({locationId:landmark.id}) : regionName(region?.id)}.`
    });
    if(wasDormant || a.corruption > 50){
      const corruptEvent = chron("c-corrupt", `The manual is steeped in old malice. Those who hear of it fear what ${plainRef(f)} may become.`, "normal", {
        regionId:figureRegionId(f)
      });
      rememberEvent(f, corruptEvent, {
        type:"forbidden_pressure",
        emotionalWeight:-30,
        hidden:true,
        text:`Felt the old malice inside ${a.name}.`
      });
    }
  }
}

function loseArt(a, why){
  const event = chron("c-lost", `${aref(a)} is lost to time — ${why}.`, "normal");
  a.lostYear = STATE.year;
  loseTechnique(a, why, event);
}

function sysSectFortune(){
  for(const s of aliveSects()){
    s.prestige = clamp(s.prestige + (rand() - 0.45) * 4, 0, 100);
    if(s.prestige <= 4 && chance(.5)) dissolveSect(s, "withered into obscurity, its halls left empty");
  }
  if(aliveSects().length < 7 && chance(.16)){
    const wanderers = aliveFigs().filter(f=>!f.sect && f.realm >= 5);
    if(wanderers.length){
      const founder = pick(wanderers);
      const s = makeSect({align:founder.align, prestige:ri(30,50), regionId:founder.currentRegionId});
      s.signatureArt = founder.art || pick(STATE.arts.filter(a=>!a.lost)) || null;
      if(s.signatureArt){
        s.signatureArt.originFactionId ||= s.id;
        registerTechniqueHolder(s.signatureArt, founder, {type:"faction_founder_holder", note:`Anchored the founding of ${s.name}.`});
      }
      founder.sect = s;
      founder.rankInFaction = "Founder";
      updatePublicIdentity(founder);
      s.members.push(founder.id);
      STATE.sects.push(s);
      addFactionSeat(s);
      maybeName(founder, true);
      chron(
        "c-found",
        `From the ashes, ${ref(founder)} establishes ${sref(s)} in ${s.region}. A new power rises where the old fell.`,
        "major",
        {
        trueRecord:`The new faction is built around one living pillar: ${ref(founder)}. Its inheritance starts from the ${s.paths[0]} path, ${s.qiTypes[0]}, and the founder's own weakness: if that pillar falls before disciples mature, the house will collapse into the Jianghu again.`,
        knownBy:"True Record; founding witnesses",
        causalType:"inheritance",
        regionId:s.regionId,
        locationId:s.seatId,
        causes:[
          cause("Founder", "Living pillar", `${ref(founder)} carries enough realm and fame to gather disciples.`),
          cause("Technique", "Starting inheritance", s.signatureArt ? `${aref(s.signatureArt)} anchors the house.` : "No stable manual anchors the house."),
          cause("Weakness", "Fragile beginning", s.weakness)
        ],
        effects:[
          effect("Faction", "New power enters Jianghu", `${sref(s)} becomes a living institution.`)
        ],
        beneficiaries:[
          benefit(ref(founder), "Turns personal power into institutional authority.", "The new house depends heavily on one living pillar.")
        ]
      }
      );
    }
  }
}

function sysFactionEvents(){
  for(const s of aliveSects()){
    const table = FACTION_EVENT_TABLES[s.name];
    if(!table || !chance(.24)) continue;

    const living = s.members.map(figById).filter(x=>x && x.alive);
    const actor = topMember(s) || pick(living) || null;
    const target = pick(aliveSects().filter(other=>other !== s)) || null;
    const event = pick(table);
    const context = factionEventContext(s, actor, target);

    applyFactionEventEffects(event.effects || {}, s, actor);
    const factionEvent = chron(
      event.cls,
      interpolateRecord(event.publicRecord, context),
      event.level,
      {
        trueRecord:interpolateRecord(event.trueRecord, context),
        knownBy:event.knownBy,
        causalType:"faction",
        regionId:s.regionId,
        locationId:s.seatId,
        causes:[
          cause("Faction Culture", s.name, s.trainingCulture),
          cause("Weakness", "Institutional pressure", s.weakness),
          cause("Profile", "Path and qi", `${s.paths[0]} path with ${s.qiTypes[0]}.`)
        ],
        effects:[
          effect("Prestige", "Faction event resolves", `${sref(s)} now stands at prestige ${Math.round(s.prestige)}.`)
        ],
        beneficiaries:[
          benefit(sref(s), "Converts faction culture into public leverage.", s.weakness)
        ]
      }
    );
    if(actor){
      rememberEvent(actor, factionEvent, {
        type:"faction_duty",
        relatedFactionId:s.id,
        emotionalWeight:14,
        publicKnown:event.level === "major",
        text:`Acted for ${s.name}: ${interpolateRecord(event.publicRecord, context).replace(/<[^>]*>/g, "")}`
      });
    }
  }
}

function factionEventContext(s, actor, target){
  return {
    sect:sref(s),
    actor:actor ? ref(actor) : "an unnamed elder",
    target:target ? sref(target) : "a distant rival",
    art:s.signatureArt ? aref(s.signatureArt) : "an unnamed inheritance",
    region:s.region
  };
}

function interpolateRecord(template, context){
  return template.replace(/\{(\w+)\}/g, (_, key)=>context[key] || "");
}

function applyFactionEventEffects(effects, s, actor){
  if(effects.prestige){
    s.prestige = clamp(s.prestige + ri(effects.prestige[0], effects.prestige[1]), 0, 100);
  }
  if(actor && effects.memberFame){
    actor.fame += ri(effects.memberFame[0], effects.memberFame[1]);
    updateReputation(actor);
    maybeName(actor);
  }
  if(actor && effects.actorDrift){
    alignShift(actor, ri(effects.actorDrift[0], effects.actorDrift[1]), "faction rites and secret obligations");
  }
  if(s.signatureArt && effects.artCorruption){
    s.signatureArt.corruption = clamp(s.signatureArt.corruption + ri(effects.artCorruption[0], effects.artCorruption[1]), 0, 100);
  }
}

function sysHeroicArcs(){
  if(chance(.18)){
    const figs = aliveFigs().filter(f=>f.realm >= 3);
    if(figs.length >= 2){
      const a = pick(figs);
      let b = pick(figs);
      let guard = 0;
      while(b === a && guard++ < 4) b = pick(figs);
      if(a !== b){
        const ev = pick([
          ()=>({
            html:`${ref(a)} and ${ref(b)} swear brotherhood beneath the peach blossoms, vowing to share fortune and ruin alike.`,
            causalType:"relationship",
            causes:[
              cause("Affinity", "Shared realm pressure", `${ref(a)} and ${ref(b)} both walk dangerous high-realm roads.`),
              cause("Temperament", traitLabel(a.personalityTraits?.[0]), `${ref(a)} is driven by ${ambitionLabel(a.ambitions?.[0]).toLowerCase()} and fears ${fearLabel(a.fears?.[0]).toLowerCase()}.`),
              cause("Temperament", traitLabel(b.personalityTraits?.[0]), `${ref(b)} is driven by ${ambitionLabel(b.ambitions?.[0]).toLowerCase()} and fears ${fearLabel(b.fears?.[0]).toLowerCase()}.`)
            ],
            effects:[effect("Oath", "Mutual bond", "Future victories and betrayals can now pull on this vow.")],
            beneficiaries:[benefit(ref(a) + " and " + ref(b), "Both gain a sworn ally.", "The oath becomes future leverage.")],
            apply(entry){
              upsertRelationshipPair(a, b, "sworn_sibling", {loyalty:28, trust:22, admiration:8}, {loyalty:28, trust:22, admiration:8}, {
                sourceEventId:entry.id,
                publicKnown:true,
                note:"Swore brotherhood beneath peach blossoms."
              });
              rememberEvent(a, entry, {type:"sworn_oath", relatedPersonId:b.id, emotionalWeight:32, publicKnown:true});
              rememberEvent(b, entry, {type:"sworn_oath", relatedPersonId:a.id, emotionalWeight:32, publicKnown:true});
            }
          }),
          ()=>({
            html:`A bitter duel: ${ref(a)} defeats ${ref(b)} atop ${pick(["Sword-Testing Cliff","the Frozen Pavilion","Lone Goose Peak","the Drunken Bridge"])}, sparing their life — and earning a lifelong grudge.`,
            causalType:"grudge",
            causes:[
              cause("Pride", "Public challenge", `${ref(b)} could not ignore ${ref(a)} without losing face.`),
              cause("Power Gap", "Duel result", `${ref(a)} stands at power ${a.power}; ${ref(b)} stands at ${b.power}.`),
              cause("Ambition", ambitionLabel(b.ambitions?.[0]), `${ref(b)} sought ${ambitionLabel(b.ambitions?.[0]).toLowerCase()}.`)
            ],
            effects:[effect("Grudge", "Mercy curdles", `${ref(b)} survives with resentment intact.`)],
            beneficiaries:[benefit(ref(a), "Wins face and reputation by sparing a rival.", `${ref(b)} keeps a reason to return.`)],
            apply(entry){
              if(!b.grudges.includes(a.id)) b.grudges.push(a.id);
              upsertRelationshipPair(a, b, "rival", {respect:10, resentment:6, admiration:4}, {envy:18, resentment:26, hatred:8}, {
                sourceEventId:entry.id,
                publicKnown:true,
                note:"A spared defeat became a grudge."
              });
              rememberEvent(a, entry, {type:"won_duel", relatedPersonId:b.id, emotionalWeight:20, publicKnown:true});
              rememberEvent(b, entry, {type:"lost_duel", relatedPersonId:a.id, emotionalWeight:-36, publicKnown:true});
            }
          }),
          ()=>{
            return {
              html:`${ref(b)} betrays ${ref(a)}, stealing a page of their manual under the new moon.`,
              causalType:"betrayal",
              causes:[
                cause("Desire", "Manual hunger", `${ref(b)} wanted a shortcut through ${a.art ? aref(a.art) : "another cultivator's hard-won insight"}.`),
                cause("Opportunity", "Trust breached", `${ref(a)} allowed enough closeness for theft.`),
                cause("Weakness", "Foundation pressure", b.sect ? b.sect.weakness : "wanderer hunger for inheritance"),
                cause("Ambition", ambitionLabel(b.ambitions?.[0]), `${ref(b)} is trying to ${ambitionLabel(b.ambitions?.[0]).toLowerCase()}.`)
              ],
              effects:[
                effect("Grudge", "Victim remembers", `${ref(a)} now carries ${ref(b)} as an unresolved grudge.`),
                effect("Inheritance", "Manual fragment moves", "A stolen page can seed future cultivation and future violence.")
              ],
              beneficiaries:[
                benefit(ref(b), "Gains a stolen manual fragment and shortcut.", "Becomes tied to a dangerous grudge."),
                benefit("Rumour brokers", "Gain a story that can be sold to rivals.", "")
              ],
              rumour:rumour("Incomplete", ref(b), "The public betrayal story is true, but omits who helped create the opening."),
              apply(entry){
                if(!a.grudges.includes(b.id)) a.grudges.push(b.id);
                if(a.art){
                  recordTechniqueEvent(a.art, {
                    type:"stolen",
                    personId:b.id,
                    eventId:entry.id,
                    note:`${b.name} stole a page from ${a.name}.`
                  });
                }
                upsertRelationshipPair(b, a, "betrayer", {envy:18, resentment:18, debt:-12}, {hatred:36, resentment:30, trust:-40}, {
                  sourceEventId:entry.id,
                  hidden:true,
                  note:"Manual theft under the new moon."
                });
                rememberEvent(a, entry, {type:"betrayal", relatedPersonId:b.id, emotionalWeight:-48, hidden:false});
                rememberEvent(b, entry, {type:"betrayed_friend", relatedPersonId:a.id, emotionalWeight:18, hidden:true});
              }
            };
          },
          ()=>({
            html:`${ref(a)} takes ${ref(b)} as a sworn disciple, passing down hard-won insight.`,
            causalType:"inheritance",
            causes:[
              cause("Lineage", "Transmission need", `${ref(a)} has insight worth preserving.`),
              cause("Potential", "Disciple candidate", `${ref(b)} has cultivation talent ${Math.round(b.cultivationTalent ?? b.talent)} and comprehension ${Math.round(b.comprehension || 0)}.`),
              cause("Ambition", ambitionLabel(b.ambitions?.[0]), `${ref(b)} wants to ${ambitionLabel(b.ambitions?.[0]).toLowerCase()}.`)
            ],
            effects:[effect("Inheritance", "Insight passes on", `${ref(b)} becomes tied to ${ref(a)}'s fate.`)],
            beneficiaries:[benefit(ref(b), "Receives direct transmission.", "Teacher's enemies may now treat the disciple as a target.")],
            apply(entry){
              b.master = a.id;
              if(!a.discipleIds.includes(b.id)) a.discipleIds.push(b.id);
              if(a.art) inheritTechnique({teacher:a, student:b, technique:a.art, event:entry, reason:"sworn disciple transmission", publicKnown:true});
              upsertRelationshipPair(a, b, "master", {respect:18, trust:12, loyalty:8}, {respect:28, loyalty:18, admiration:18}, {
                sourceEventId:entry.id,
                publicKnown:true,
                note:"Sworn disciple transmission."
              });
              rememberEvent(a, entry, {type:"accepted_disciple", relatedPersonId:b.id, emotionalWeight:22, publicKnown:true});
              rememberEvent(b, entry, {type:"praised_by_master", relatedPersonId:a.id, emotionalWeight:34, publicKnown:true});
            }
          }),
          ()=>({
            html:`Rumour spreads that ${ref(a)} has fallen in love with ${ref(b)} — a romance the sects forbid.`,
            causalType:"relationship",
            causes:[
              cause("Affinity", "Forbidden closeness", "Faction boundaries made the attachment politically dangerous."),
              cause("Jianghu Pressure", "Rumour networks", "What cannot be admitted publicly becomes useful gossip."),
              cause("Fear", fearLabel(a.fears?.[0]), `${ref(a)} risks ${fearLabel(a.fears?.[0]).toLowerCase()}.`)
            ],
            effects:[effect("Rumour", "Future leverage", "Enemies may use the romance as a blade.")],
            beneficiaries:[
              benefit("Rival factions", "Gain leverage over two cultivators and their houses.", ""),
              benefit("Rumour brokers", "Gain a story that spreads without proof.", "")
            ],
            rumour:rumour(pick(["Incomplete","Planted","Unverified"]), "unknown Jianghu mouths", "The affection may be real, exaggerated, or planted to test faction reactions."),
            apply(entry){
              upsertRelationshipPair(a, b, "lover", {love:24, trust:12, fear:8}, {love:18, trust:10, fear:10}, {
                sourceEventId:entry.id,
                hidden:true,
                note:"Forbidden affection caught by rumour."
              });
              rememberEvent(a, entry, {type:"forbidden_romance", relatedPersonId:b.id, emotionalWeight:24, hidden:true});
              rememberEvent(b, entry, {type:"forbidden_romance", relatedPersonId:a.id, emotionalWeight:22, hidden:true});
            }
          })
        ]);
        const event = ev();
        const entry = chron(pick(["c-duel","c-lineage","c-peace"]), event.html, "normal", {
          regionId:figureRegionId(a) || figureRegionId(b),
          causalType:event.causalType,
          causes:event.causes,
          effects:event.effects,
          beneficiaries:event.beneficiaries,
          rumour:event.rumour
        });
        if(event.apply) event.apply(entry);
      }
    }
  }
}
