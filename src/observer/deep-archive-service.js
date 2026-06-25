"use strict";

import { realmStageName } from "../data/cultivation.js";
import { ambitionLabel, fearLabel, traitLabel } from "../entities/figure.js";
import { familyById } from "../entities/family.js";
import { memoryById } from "../entities/memory.js";
import { relationshipById, relationshipLabel } from "../entities/relationship.js";
import { locationName, regionById, regionName } from "./map-state.js";
import { relationshipHeat, relationshipReportFor } from "./relationship-report-service.js";
import { figById, sectMight } from "./selectors.js";
import { techniqueLineageReport, techniqueLineageTree } from "./technique-lineage-service.js";
import { trueRecordFor } from "./true-record-service.js";
import { warReport } from "./war-report-service.js";
import { STATE } from "../state.js";

export const ARCHIVE_TYPES = [
  {key:"search", label:"Search"},
  {key:"people", label:"People"},
  {key:"factions", label:"Powers"},
  {key:"techniques", label:"Techniques"},
  {key:"wars", label:"Wars"},
  {key:"events", label:"Events"},
  {key:"regions", label:"Map"},
  {key:"relationships", label:"Lineages"},
  {key:"bloodlines", label:"Bloodlines"}
];

export function archiveItems(type="search", query=""){
  const q = normalize(query);
  const groups = {
    people:peopleItems(),
    factions:factionItems(),
    techniques:techniqueItems(),
    wars:warItems(),
    events:eventItems(),
    regions:regionItems(),
    relationships:relationshipItems(),
    bloodlines:bloodlineItems()
  };
  const items = type === "search" ? Object.values(groups).flat() : groups[type] || [];
  return items
    .map(item=>({...item, searchText:normalize(`${item.title} ${item.subtitle} ${item.meta || ""}`)}))
    .filter(item=>!q || item.searchText.includes(q))
    .sort((a, b)=>(b.priority || 0) - (a.priority || 0) || String(a.title).localeCompare(String(b.title)))
    .slice(0, type === "search" ? 80 : 60);
}

export function archiveCount(type="search", query=""){
  return archiveItems(type, query).length;
}

export function archiveDetail(type, id){
  if(type === "people") return personDetail(Number(id));
  if(type === "factions") return factionDetail(Number(id));
  if(type === "techniques") return techniqueDetail(Number(id));
  if(type === "wars") return warDetail(Number(id));
  if(type === "events") return eventDetail(Number(id));
  if(type === "regions") return regionDetail(Number(id));
  if(type === "relationships") return relationshipDetail(Number(id));
  if(type === "bloodlines") return bloodlineDetail(Number(id));
  return null;
}

function peopleItems(){
  return STATE.figures.map(person=>({
    type:"people",
    id:person.id,
    title:displayPerson(person),
    subtitle:`${person.alive ? "Alive" : "Dead"} · ${realmStageName(person.realm, person.progress, true)} · ${person.sect?.name || "Wanderer"}`,
    meta:`${person.path} ${person.qiType} ${person.publicIdentity || ""} ${person.hiddenIdentity || ""}`,
    priority:(person.alive ? 30 : 0) + (person.power || 0) / 20 + (person.fame || 0)
  }));
}

function factionItems(){
  return STATE.sects.map(faction=>({
    type:"factions",
    id:faction.id,
    title:faction.recordName || faction.name,
    subtitle:`${faction.alive ? "Active" : "Fallen"} · ${faction.type} · ${regionName(faction.regionId)}`,
    meta:`${faction.name} ${faction.ideology} ${faction.weakness} ${faction.paths?.join(" ")} ${faction.qiTypes?.join(" ")}`,
    priority:(faction.alive ? 30 : 0) + sectMight(faction) / 120
  }));
}

function techniqueItems(){
  return STATE.arts.map(technique=>({
    type:"techniques",
    id:technique.id,
    title:technique.recordName || technique.name,
    subtitle:`${technique.grade} ${technique.type} · ${technique.lost ? "Lost" : technique.dormant ? "Dormant" : "Living"}`,
    meta:`${technique.name} ${technique.path} ${technique.qiType} ${technique.risks?.join(" ")} ${technique.counters?.join(" ")}`,
    priority:(technique.tier || 0) * 10 + (technique.history?.length || 0) + (technique.childTechniqueIds?.length || 0) * 5
  }));
}

function warItems(){
  return (STATE.wars || []).map(war=>({
    type:"wars",
    id:war.id,
    title:war.recordName || war.name,
    subtitle:`${war.status} · Year ${war.startYear}${war.endYear ? `-${war.endYear}` : ""} · battles ${war.battles?.length || 0}`,
    meta:`${war.name} ${war.publicJustification} ${war.immediateCause} ${war.deepCause} ${war.hiddenCause}`,
    priority:(war.status === "active" ? 100 : 0) + (war.battles?.length || 0) * 6 + (war.casualties?.length || 0)
  }));
}

function eventItems(){
  return STATE.log.map(event=>({
    type:"events",
    id:event.id,
    title:`Year ${event.year} · ${event.type || event.causalType || event.cls}`,
    subtitle:stripTags(event.publicRecord || event.html).slice(0, 110),
    meta:`${event.trueRecord || ""} ${event.knownBy || ""} ${event.tags?.join(" ")}`,
    priority:(event.importance === "epic" ? 120 : event.importance === "major" ? 70 : 0) + (event.hiddenCauseIds?.length || 0) * 4 + event.id / 10000
  }));
}

function regionItems(){
  return STATE.regions.map(region=>({
    type:"regions",
    id:region.id,
    title:region.name,
    subtitle:`${region.type} · danger ${Math.round(region.danger)} · stability ${Math.round(region.stability)}`,
    meta:`${region.knownFor?.join(" ")} ${region.hiddenSecrets?.join(" ")} ${region.recentEvents?.map(item=>item.text).join(" ")}`,
    priority:(region.demonicActivity || 0) + (region.danger || 0) + (region.recentEvents?.length || 0) * 5
  }));
}

function relationshipItems(){
  return STATE.relationships.map(relationship=>{
    const from = figById(relationship.fromId);
    const to = figById(relationship.toId);
    return {
      type:"relationships",
      id:relationship.id,
      title:`${from?.name || "Unknown"} -> ${to?.name || "Unknown"}`,
      subtitle:`${relationshipLabel(relationship)} · heat ${Math.round(relationshipHeat(relationship))}`,
      meta:`${relationship.note || ""} ${Object.entries(relationship.feelings || {}).map(([key, value])=>`${key} ${value}`).join(" ")}`,
      priority:relationshipHeat(relationship)
    };
  });
}

function bloodlineItems(){
  return STATE.families.map(family=>({
    type:"bloodlines",
    id:family.id,
    title:family.name,
    subtitle:`${family.memberIds.length} members · prestige ${Math.round(family.prestige || 0)} · ${regionName(family.regionId)}`,
    meta:`${family.surname} ${family.secrets?.join(" ")} ${family.grudges?.map(item=>item.type).join(" ")}`,
    priority:(family.prestige || 0) + family.memberIds.length
  }));
}

function personDetail(id){
  const person = figById(id);
  if(!person) return null;
  const bonds = relationshipReportFor(person).slice(0, 8);
  const family = familyById(person.familyId);
  return report(displayPerson(person), `${person.alive ? "Alive" : `Dead in Year ${person.diedYear}`} · ${realmStageName(person.realm, person.progress, true)}`, [
    ["Identity", `${person.publicIdentity || "Unrecorded public identity"}\nHidden: ${person.hiddenIdentity || "No hidden identity recorded"}\nFamily: ${family?.name || "Unrecorded"}\nOrigin: ${regionName(person.birthplaceRegionId)}\nLocation: ${regionName(person.currentRegionId)}`],
    ["Cultivation", `${person.path} path · ${person.qiType} qi\nFoundation ${Math.round(person.foundationQuality || 0)} · Qi purity ${Math.round(person.qiPurity || 0)} · Mental state ${Math.round(person.mentalState || 0)}\nTalent ${Math.round(person.cultivationTalent || 0)} · Comprehension ${Math.round(person.comprehension || 0)} · Combat instinct ${Math.round(person.combatInstinct || 0)}`],
    ["Character", `Traits: ${(person.personalityTraits || []).map(traitLabel).join(", ")}\nAmbition: ${(person.ambitions || []).map(ambitionLabel).join(", ")}\nFear: ${(person.fears || []).map(fearLabel).join(", ")}`],
    ["Technique", person.art ? `${person.art.name} (${person.art.recordName})\n${person.art.grade} ${person.art.type} · ${person.art.path} · ${person.art.qiType}` : "No signature technique recorded."],
    ["Relationships", bonds.length ? bonds.map(bond=>`${bond.otherName}: ${bond.type}, heat ${Math.round(relationshipHeat(bond))}`).join("\n") : "No strong bonds recorded."],
    ["Memories", (person.memories || []).slice(-8).map(memoryById).filter(Boolean).map(memory=>`${memory.year || "Year ?"} · ${memory.type}: ${memory.text || memory.note || ""}`).join("\n") || "No memories recorded."],
    ["Likely Future", likelyFutureFor(person)]
  ]);
}

function factionDetail(id){
  const faction = STATE.sects.find(item=>item.id === id);
  if(!faction) return null;
  const leader = figById(faction.leaderId);
  const successor = figById(faction.successorId);
  const members = faction.members.map(figById).filter(Boolean);
  const recent = STATE.log.filter(event=>event.involvedFactionIds?.includes(faction.id) || event.publicRecord?.includes(faction.name)).slice(-8);
  return report(faction.recordName || faction.name, `${faction.alive ? "Active" : `Fallen in Year ${faction.deadYear}`} · ${faction.type} · ${regionName(faction.regionId)}`, [
    ["Identity", `${faction.name}\nIdeology: ${faction.ideology}\nSeat: ${locationName({regionId:faction.regionId, locationId:faction.seatId})}\nWeakness: ${faction.weakness}`],
    ["Leadership", `Leader: ${leader ? displayPerson(leader) : "None"}\nSuccessor: ${successor ? displayPerson(successor) : "None"}\nMembers: ${members.filter(member=>member.alive).length} living / ${members.length} recorded`],
    ["Power", `Might ${Math.round(sectMight(faction))}\nPrestige ${Math.round(faction.prestige || 0)} · Wealth ${Math.round(faction.wealth || 0)} · Military ${Math.round(faction.militaryStrength || 0)} · Cultivation ${Math.round(faction.cultivationStrength || 0)} · Stability ${Math.round(faction.internalStability || 0)}`],
    ["Relations", `Allies ${faction.allies?.length || 0} · Enemies ${faction.enemies?.length || 0} · Vassals ${faction.vassals?.length || 0} · Grudges ${faction.grudges?.length || 0}`],
    ["Techniques", `${faction.signatureArt ? `${faction.signatureArt.name} (${faction.signatureArt.grade})` : "No signature art"}\nForbidden: ${(faction.forbiddenTechniques || []).join(", ") || "None recorded"}`],
    ["Recent Events", recent.map(event=>`Year ${event.year}: ${stripTags(event.publicRecord).slice(0, 130)}`).join("\n") || "No recent public events."],
    ["Long-Term Trend", factionTrend(faction)]
  ]);
}

function techniqueDetail(id){
  const technique = STATE.arts.find(item=>item.id === id);
  if(!technique) return null;
  const lineage = techniqueLineageReport(technique);
  const tree = techniqueLineageTree(technique);
  return report(lineage.recordName || lineage.name, `${lineage.grade} ${lineage.type} · ${lineage.lost ? "Lost" : lineage.dormant ? "Dormant" : "Living"}`, [
    ["Identity", `${lineage.name}\nPath: ${lineage.path} · Qi: ${lineage.qiType}\nCreator: ${lineage.creator || "Unknown"}\nOrigin: ${lineage.originFaction || "Unclaimed"}`],
    ["Holders", `Current: ${lineage.currentHolders.join(", ") || "None"}\nPast: ${lineage.pastHolders.slice(0, 8).join(", ") || "None recorded"}`],
    ["Risks And Counters", `Risks: ${lineage.risks.join(", ") || "None recorded"}\nCounters: ${lineage.counters.join(", ") || "None recorded"}\nCompleteness: ${lineage.completeness}% · Forbidden ${lineage.forbidden ? "yes" : "no"} · Damaged ${lineage.damaged ? "yes" : "no"}`],
    ["Branches", tree.map(row=>`${"  ".repeat(row.depth)}${row.name} · ${row.grade} ${row.type}`).join("\n") || "No branch tree recorded."],
    ["History", lineage.history.slice(-10).map(entry=>`Year ${entry.year || "?"}: ${entry.type} · ${entry.person || entry.faction || entry.relatedTechnique || entry.note || ""}`).join("\n") || "No history recorded."]
  ]);
}

function warDetail(id){
  const war = STATE.wars.find(item=>item.id === id);
  const detail = warReport(war);
  if(!detail) return null;
  return report(detail.recordName || detail.name, `${detail.status} · Year ${detail.startYear}${detail.endYear ? `-${detail.endYear}` : ""}`, [
    ["Why Did This Happen?", `Immediate cause: ${detail.immediateCause || "Unknown"}\nDeep cause: ${detail.deepCause || "Unknown"}\nHidden cause: ${detail.hiddenCause || "None recorded"}\nTrue motive: ${detail.trueMotive || "None recorded"}`],
    ["Sides", `Side A: ${detail.factions.sideA.map(f=>f.recordName || f.name).join(", ")}\nSide B: ${detail.factions.sideB.map(f=>f.recordName || f.name).join(", ")}\nMain aggressor: ${detail.mainAggressor?.recordName || detail.mainAggressor?.name || "Unknown"}`],
    ["War Record", `Battles ${detail.battles.length} · Casualties ${detail.casualties.length} · Grudges created ${detail.grudgesCreated.length}\nWinner: ${detail.winner?.recordName || detail.winner?.name || "None"}\nLoser: ${detail.loser?.recordName || detail.loser?.name || "None"}\nAftermath: ${detail.aftermath || "Unresolved"}`],
    ["Battles", detail.battles.slice(-8).map(battle=>`Year ${battle.year}: ${battle.summary}`).join("\n") || "No battles recorded."],
    ["Losses", `${detail.casualties.slice(-8).map(item=>`Year ${item.year}: ${item.name}`).join("\n") || "No casualties recorded."}\n${detail.techniqueLosses.slice(-5).map(item=>`Technique risk: ${item.name} · ${item.reason}`).join("\n")}`.trim()],
    ["Cause Event", detail.causeEvent ? `Year ${detail.causeEvent.year}: ${stripTags(detail.causeEvent.publicRecord).slice(0, 160)}` : "No cause event linked."]
  ]);
}

function eventDetail(id){
  const event = STATE.log.find(item=>item.id === id);
  if(!event) return null;
  const truth = trueRecordFor(event);
  return report(`Year ${event.year} · ${event.type || event.cls}`, `${event.importance || event.level} · ${STATE.seasonNames[event.season]} · ${event.locationName || "No location"}`, [
    ["Public Record", stripTags(event.publicRecord || event.html)],
    ["True Record", stripTags(event.trueRecord || "No hidden truth recorded.")],
    ["Why Did This Happen?", `Immediate causes:\n${(event.causes || []).map(item=>`${item.kind}: ${item.label} - ${stripTags(item.detail || "")}`).join("\n") || "None visible"}\n\nHidden causes:\n${truth.hiddenCauses.map(item=>`Year ${item.year}: ${stripTags(item.publicRecord).slice(0, 130)}`).join("\n") || "None linked"}\n\nConsequences:\n${truth.consequences.map(item=>`Year ${item.year}: ${stripTags(item.publicRecord).slice(0, 130)}`).join("\n") || "None linked"}`],
    ["Involved", `People ${event.involvedPersonIds?.map(namePerson).filter(Boolean).join(", ") || "None"}\nFactions ${event.involvedFactionIds?.map(nameFaction).filter(Boolean).join(", ") || "None"}\nTechniques ${event.involvedTechniqueIds?.map(nameTechnique).filter(Boolean).join(", ") || "None"}\nKnown witnesses ${truth.knownByPeople.map(person=>person.name).join(", ") || event.knownBy || "None recorded"}`],
    ["Rumours", truth.rumourRecords.map(item=>`${item.verdict}: ${item.note}`).join("\n") || "No rumour entity linked."]
  ]);
}

function regionDetail(id){
  const region = regionById(id);
  if(!region) return null;
  const dominant = STATE.sects.find(faction=>faction.id === region.dominantFactionId);
  const landmarks = STATE.landmarks.filter(landmark=>landmark.regionId === region.id).slice(0, 12);
  return report(region.name, `${region.type} · dominant ${dominant?.recordName || "unclaimed"}`, [
    ["State", `Stability ${Math.round(region.stability)} · Danger ${Math.round(region.danger)} · Wealth ${Math.round(region.wealth)} · Spiritual density ${Math.round(region.spiritualDensity)}\nPopulation pressure ${Math.round(region.populationPressure)} · Demonic activity ${Math.round(region.demonicActivity)}`],
    ["Known For", `${region.knownFor?.join(", ") || "Unrecorded"}\nHidden: ${region.hiddenSecrets?.join(", ") || "No hidden secret recorded"}`],
    ["Landmarks", landmarks.map(landmark=>`${landmark.type}: ${landmark.name}`).join("\n") || "No landmarks recorded."],
    ["Recent Events", (region.recentEvents || []).slice(-8).map(item=>`#${item.eventId}: ${item.text}`).join("\n") || "No recent regional events."]
  ]);
}

function relationshipDetail(id){
  const relationship = relationshipById(id);
  if(!relationship) return null;
  const from = figById(relationship.fromId);
  const to = figById(relationship.toId);
  return report(`${from?.name || "Unknown"} -> ${to?.name || "Unknown"}`, `${relationshipLabel(relationship)} · since Year ${relationship.since}`, [
    ["Bond", `Public: ${relationship.publicKnown ? "yes" : "no"} · Hidden: ${relationship.hidden ? "yes" : "no"}\nSource event: ${relationship.sourceEventId || "None"}\nNote: ${relationship.note || "None"}`],
    ["Feelings", Object.entries(relationship.feelings || {}).filter(([, value])=>value).map(([key, value])=>`${key}: ${Math.round(value)}`).join("\n") || "No strong feelings recorded."],
    ["Pressure", `Heat ${Math.round(relationshipHeat(relationship))}\nThis bond can feed memories, grudges, betrayal, loyalty, rivalry, romance pressure, or faction conflict.`]
  ]);
}

function bloodlineDetail(id){
  const family = familyById(id);
  if(!family) return null;
  const members = family.memberIds.map(figById).filter(Boolean).sort((a, b)=>(b.power || 0) - (a.power || 0));
  return report(family.name, `${members.length} members · ${regionName(family.regionId)}`, [
    ["Bloodline", `Surname: ${family.surname}\nPrestige: ${Math.round(family.prestige || 0)}\nFaction ties: ${family.factionIds.map(nameFaction).filter(Boolean).join(", ") || "None"}`],
    ["Members", members.slice(0, 12).map(member=>`${displayPerson(member)} · ${member.alive ? "alive" : "dead"} · ${realmStageName(member.realm, member.progress, true)}`).join("\n") || "No members recorded."],
    ["Secrets And Grudges", `Secrets: ${family.secrets?.join(", ") || "None recorded"}\nGrudges: ${family.grudges?.map(item=>item.type).join(", ") || "None recorded"}`]
  ]);
}

function likelyFutureFor(person){
  if(!person.alive) return `Their death remains a consequence source: ${person.causeOfDeath || "cause unknown"}.`;
  if(person.isThreat) return "Calamity pressure will draw alliances, assassins, and hidden observers.";
  if((person.innerDemon || 0) > 60) return "High inner-demon pressure makes deviation, corruption, or desperate breakthrough likely.";
  if((person.grudges || []).length) return "Stored grudges make duels, assassinations, or faction pressure likely.";
  if(person.realm >= 6) return "High realm status makes them a political pillar and future succession risk.";
  if(person.ambitions?.includes("live_peacefully")) return "They will resist public conflict unless forced by memory or faction pressure.";
  return "Their ambition and relationships will decide whether they become a founder, rival, heir, or casualty.";
}

function factionTrend(faction){
  if(!faction.alive) return "Fallen powers leave survivors, lost techniques, and revenge chains.";
  if((faction.internalStability || 0) < 30) return "Internal stability is low; succession crisis, betrayal, or collapse risk is high.";
  if(faction.atWarWith?.length) return "Open war is consuming wealth, stability, and future grudges.";
  if((faction.prestige || 0) > 70) return "High prestige gives recruitment strength but attracts challengers.";
  return "The faction is stable enough to pursue goals, recruit, and accumulate rivals.";
}

function report(title, subtitle, sections){
  return {title, subtitle, sections:sections.map(([label, body])=>({label, body}))};
}

function displayPerson(person){
  if(!person) return "Unknown";
  return person.epithet && person.namedAt != null ? `${person.epithet.en} (${person.epithet.recordName})` : person.name;
}

function namePerson(id){
  return figById(id)?.name || null;
}

function nameFaction(id){
  const faction = STATE.sects.find(item=>item.id === id);
  return faction?.recordName || faction?.name || null;
}

function nameTechnique(id){
  const technique = STATE.arts.find(item=>item.id === id);
  return technique?.recordName || technique?.name || null;
}

function normalize(value){
  return String(value || "").trim().toLowerCase();
}

function stripTags(html){
  return String(html || "").replace(/<[^>]*>/g, "");
}
