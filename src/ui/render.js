"use strict";

import { ambitionLabel, fearLabel, traitLabel } from "../entities/figure.js";
import { realmStageName } from "../data/cultivation.js";
import { ALIGNMENTS } from "../data/factions.js";
import { CULTIVATION_PATHS, QI_TYPES } from "../data/path-profiles.js";
import { ARCHIVE_TYPES, archiveDetail, archiveItems } from "../observer/deep-archive-service.js";
import { RECORD_SURFACES, eventMatchesRecord } from "../observer/records.js";
import { relationshipHeat, relationshipReportFor } from "../observer/relationship-report-service.js";
import { techniqueLineageReport } from "../observer/technique-lineage-service.js";
import { trueRecordFor } from "../observer/true-record-service.js";
import { regionName } from "../observer/map-state.js";
import { aliveFigs, aliveSects, figById, sectMight, topMember } from "../observer/selectors.js";
import { STATE } from "../state.js";
import { cap, clamp, dual } from "../utils/random.js";
import { initEntityModal, openEntity, detailSectionsHtml } from "./entity-modal.js";

const $ = id=>document.getElementById(id);
let autoScroll = true;
let selectedEventId = null;
let activeRecord = "world";
let activeArchive = "search";
let archiveQuery = "";
let selectedArchive = null;

export function renderLog(force=false){
  if(!force && !STATE.dirtyLog) return;
  STATE.dirtyLog = false;
  const box = $("chron");
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  const frag = document.createDocumentFragment();
  box.innerHTML = "";
  renderRecordBar();
  const entries = STATE.log.filter(e=>eventMatchesRecord(e, activeRecord)).slice(-260);
  let lastYear = null;

  if(!entries.length){
    const empty = document.createElement("div");
    empty.className = "empty-record";
    empty.textContent = "No records have reached this archive yet.";
    frag.appendChild(empty);
  }

  for(const e of entries){
    if(e.year !== lastYear){
      lastYear = e.year;
      const ym = document.createElement("div");
      ym.className = "yearmark";
      ym.innerHTML = `<span class="y">Year ${e.year}</span><span class="ystat">${aliveSects().length} powers · ${aliveFigs().length} cultivators${STATE.threatActive ? ` · <span style="color:var(--blood)">a Son of the Abyss walks</span>` : ""}</span>`;
      frag.appendChild(ym);
    }
    const d = document.createElement("div");
    d.className = `entry ${e.cls} ${e.level === "major" ? "major" : ""} ${e.level === "epic" ? "epic major" : ""} ${selectedEventId === e.id ? "selected" : ""}`;
    d.dataset.eventId = e.id;
    d.dataset.archiveType = "events";
    d.dataset.archiveId = e.id;
    const trueRecord = e.trueRecord ? `<div class="true-record"><span class="record-label">True Record</span>${e.trueRecord}</div>` : "";
    const location = e.locationName ? `<div class="known-by"><span class="record-label">Location</span>${e.locationName}</div>` : "";
    const knownBy = e.knownBy ? `<div class="known-by"><span class="record-label">Known By</span>${e.knownBy}</div>` : "";
    const structured = e.hiddenCauseIds?.length || e.consequenceIds?.length || e.rumourIds?.length
      ? `<div class="known-by"><span class="record-label">Record Links</span>${e.type} · hidden causes ${e.hiddenCauseIds?.length || 0} · consequences ${e.consequenceIds?.length || 0} · rumours ${e.rumourIds?.length || 0}</div>`
      : "";
    d.innerHTML = `<div class="txt"><span class="tag">${STATE.seasonNames[e.season]}</span>${e.publicRecord || e.html}</div>${trueRecord}${location}${knownBy}${structured}`;
    frag.appendChild(d);
  }

  box.appendChild(frag);
  if(autoScroll && atBottom) box.scrollTop = box.scrollHeight;
  renderFateRecord();
  renderDeepArchive();
}

function bar(v, max, color){
  return `<div class="mini"><i style="width:${clamp(v / max * 100, 0, 100)}%;background:${color}"></i></div>`;
}

export function renderPanels(){
  if(!STATE.dirtyPanels) return;
  STATE.dirtyPanels = false;

  $("era").innerHTML = `Year <b id="yr">${STATE.year}</b> · <span id="season">${STATE.seasonNames[STATE.season]}</span> · <span id="alive">${aliveFigs().length}</span> souls beneath Heaven · <span style="color:var(--gold)">${escapeHtml(STATE.era?.name || "Unrecorded Era")}</span> · tension ${Math.round(STATE.worldTension?.worldTension || 0)}`;

  $("s-fig").textContent = aliveFigs().length;
  $("s-war").textContent = STATE.activeWars.length;
  $("s-art").textContent = STATE.arts.filter(a=>!a.lost && !a.dormant).length;
  $("s-lost").textContent = STATE.arts.filter(a=>a.lost || a.dormant).length;
  renderRegions();
  renderFateRecord();
  renderDeepArchive();

  const sl = $("sectlist");
  const sects = [...STATE.sects].sort((a, b)=>(b.alive - a.alive) || (sectMight(b) - sectMight(a)));
  $("sectct").textContent = aliveSects().length;
  sl.innerHTML = "";

  for(const s of sects.slice(0,16)){
    const al = ALIGNMENTS[s.align];
    const living = s.members.map(figById).filter(x=>x && x.alive);
    const lead = topMember(s);
    const leader = figById(s.leaderId) || lead;
    const successor = figById(s.successorId);
    const goals = (s.currentGoals || []).slice(0,2).map(goal=>`${goal.label} ${Math.round(goal.progress || 0)}%`).join(" · ") || "No formal goal";
    const div = document.createElement("div");
    div.className = "sect" + (s.alive ? "" : " dead");
    div.dataset.archiveType = "factions";
    div.dataset.archiveId = s.id;
    div.style.setProperty("--c", al.c);
    const sameSectName = String(s.recordName).trim().toLowerCase() === String(s.name).trim().toLowerCase();
    div.innerHTML = `
      <div class="sect-head">
        <div class="sect-name">${s.recordName}${sameSectName ? "" : `<span class="en">${s.name}</span>`}</div>
        <div class="sect-tier">${s.type} · ${al.recordLabel}</div>
      </div>
      <div class="sect-meta">
        <span><b>${living.length}</b> disciples</span>
        <span>${regionName(s.regionId)}</span>
      </div>
      <div class="sect-meta"><span>${cap(s.ideology || "mixed Jianghu policy")}</span></div>
      <div class="sect-meta"><span>${s.paths.map(pathLabel).join(", ")} · ${s.qiTypes.map(qiLabel).join(", ")}</span></div>
      <div class="sect-meta"><span>Weakness: <b>${s.weakness ? cap(s.weakness) : "None recorded"}</b></span></div>
      ${leader ? `<div class="sect-meta"><span>Leader: <b>${leader.epithet && leader.namedAt != null ? cap(leader.epithet.en) : leader.name}</b> · ${realmStageName(leader.realm, leader.progress, true)}</span></div>` : ""}
      ${successor ? `<div class="sect-meta"><span>Successor: <b>${successor.epithet && successor.namedAt != null ? cap(successor.epithet.en) : successor.name}</b></span></div>` : ""}
      <div class="sect-meta"><span>Goal: ${goals}</span></div>
      <div class="sect-meta"><span>Wealth ${Math.round(s.wealth || 0)} · Military ${Math.round(s.militaryStrength || 0)} · Cultivation ${Math.round(s.cultivationStrength || 0)} · Stability ${Math.round(s.internalStability || 0)}</span></div>
      <div class="sect-meta"><span>Allies ${s.allies?.length || 0} · Enemies ${s.enemies?.length || 0} · Vassals ${s.vassals?.length || 0} · Secrets ${s.secrets?.length || 0}</span></div>
      <div class="pbar"><i style="width:${clamp(s.prestige, 0, 100)}%"></i></div>
    `;
    sl.appendChild(div);
  }

  const fl = $("figlist");
  const figs = aliveFigs().sort((a, b)=>(b.isThreat - a.isThreat) || (b.power - a.power)).slice(0,12);
  $("figct").textContent = aliveFigs().length;
  fl.innerHTML = "";

  for(const f of figs){
    const al = ALIGNMENTS[f.align];
    const div = document.createElement("div");
    div.className = "figcard";
    div.dataset.archiveType = "people";
    div.dataset.archiveId = f.id;
    div.style.setProperty("--c", al.c);
    const named = f.epithet && f.namedAt != null;
    const traits = (f.personalityTraits || []).slice(0,2).map(traitLabel).join(", ") || "Unrecorded";
    const ambition = ambitionLabel(f.ambitions?.[0]);
    const fear = fearLabel(f.fears?.[0]);
    const gender = f.gender ? f.gender[0].toUpperCase() + f.gender.slice(1) : "Unknown";
    const hotBond = relationshipReportFor(f)[0];
    const artReport = f.art ? techniqueLineageReport(f.art) : null;
    div.innerHTML = `
      <div class="fig-name">${named ? `<span class="fig-alias">${dual(cap(f.epithet.en), f.epithet.recordName)}</span>` : f.name}</div>
      <div class="fig-sub">${named ? f.name + " · " : ""}${al.label}${f.isThreat ? ` · <span style="color:var(--blood)">SON OF THE ABYSS</span>` : ""}${f.sect ? " · " + f.sect.name : " · Wanderer"}</div>
      <div class="fig-sub">${gender} · ${cap(f.publicIdentity || f.rankInFaction || "Unrecorded identity")}</div>
      <div class="fig-sub">${pathLabel(f.path)} · ${qiLabel(f.qiType)} · ${regionName(f.currentRegionId)}</div>
      <div class="fig-sub">Traits: ${traits}</div>
      <div class="fig-sub">Wants: ${ambition} · Fears: ${fear}</div>
      <div class="fig-sub">Foundation ${Math.round(f.foundationQuality || 0)} · Qi ${Math.round(f.qiPurity || 0)} · Mind ${Math.round(f.mentalState || 0)} · Resources ${Math.round(f.resources || 0)}</div>
      <span class="fig-realm">${realmStageName(f.realm, f.progress)} · ${Math.round(f.progress)}%</span>
      <div class="fig-bars">
        <span>Power</span>${bar(f.power, 1100, al.c)}
        <span>Fame</span>${bar(f.fame, 60, "var(--gold)")}
        <span>Abyss</span>${bar(f.alignmentDrift, 100, "var(--heretical)")}
      </div>
      <div class="fig-sub">Reputation: ${cap(f.reputation?.label || "obscure")} · Pill toxicity ${Math.round(f.pillToxicity || 0)} · Inner demon ${Math.round(f.innerDemon || 0)} · Injuries ${f.injuries?.length || 0}</div>
      <div class="fig-sub">Memories ${f.memories?.length || 0} · Bonds ${f.relationships?.length || 0} · Breakthrough records ${f.breakthroughHistory?.length || 0}</div>
      ${hotBond ? `<div class="fig-sub">Strongest bond: ${hotBond.otherName} · ${hotBond.type} · heat ${Math.round(relationshipHeat(hotBond))}</div>` : ""}
      ${f.art ? `<div class="fig-sub" style="margin-top:6px">${dual(f.art.name, f.art.recordName)} · ${f.art.grade} ${f.art.type} · tier ${f.art.tier} · ${pathLabel(f.art.path)} · ${qiLabel(f.art.qiType)}</div>` : ""}
      ${artReport ? `<div class="fig-sub">Technique lineage: holders ${artReport.currentHolders.length} · past ${artReport.pastHolders.length} · branches ${artReport.childTechniques.length} · history ${artReport.history.length}</div>` : ""}
    `;
    fl.appendChild(div);
  }
}

function renderRegions(){
  const list = $("regionlist");
  if(!list) return;
  $("regionct").textContent = STATE.regions.length;
  list.innerHTML = "";
  const regions = [...STATE.regions].sort((a, b)=>(b.demonicActivity + b.danger) - (a.demonicActivity + a.danger)).slice(0,8);
  for(const region of regions){
    const dominant = STATE.sects.find(s=>s.id === region.dominantFactionId);
    const div = document.createElement("div");
    div.className = "region-card";
    div.dataset.archiveType = "regions";
    div.dataset.archiveId = region.id;
    div.innerHTML = `
      <div class="region-head"><b>${region.name}</b><span>${region.type}</span></div>
      <div class="sect-meta"><span>Dominant: <b>${dominant ? dominant.recordName : "Unclaimed"}</b></span></div>
      <div class="sect-meta"><span>Known for: ${region.knownFor.slice(0,3).map(cap).join(", ")}</span></div>
      <div class="region-bars">
        <span>Stable</span>${bar(region.stability, 100, "var(--jade)")}
        <span>Danger</span>${bar(region.danger, 100, "var(--blood)")}
        <span>Spirit</span>${bar(region.spiritualDensity, 100, "var(--azure)")}
        <span>Demonic</span>${bar(region.demonicActivity, 100, "var(--heretical)")}
      </div>
    `;
    list.appendChild(div);
  }
}

function renderDeepArchive(){
  const tabs = $("archiveTabs");
  const list = $("archiveList");
  const detailBox = $("archiveDetail");
  const count = $("archivect");
  if(!tabs || !list || !detailBox || !count || !STATE) return;

  const items = archiveItems(activeArchive, archiveQuery);
  count.textContent = items.length;
  tabs.innerHTML = ARCHIVE_TYPES.map(type=>{
    const tabCount = archiveItems(type.key, archiveQuery).length;
    return `<button class="archive-tab ${activeArchive === type.key ? "on" : ""}" data-archive-tab="${type.key}">${escapeHtml(type.label)}<span> ${tabCount}</span></button>`;
  }).join("");

  if(!selectedArchive || (activeArchive !== "search" && selectedArchive.type !== activeArchive) || !items.some(item=>item.type === selectedArchive.type && item.id === selectedArchive.id)){
    selectedArchive = items[0] ? {type:items[0].type, id:items[0].id} : null;
  }

  list.innerHTML = items.length ? items.slice(0, 36).map(item=>`
    <div class="archive-row ${selectedArchive?.type === item.type && selectedArchive?.id === item.id ? "on" : ""}" data-archive-type="${item.type}" data-archive-id="${item.id}">
      <span class="archive-type">${escapeHtml(labelForArchiveType(item.type))}</span>
      <b>${escapeHtml(item.title)}</b>
      <span>${escapeHtml(item.subtitle || "")}</span>
    </div>
  `).join("") : `<div class="empty-record" style="padding:10px 0">No archive records match.</div>`;

  const detail = selectedArchive ? archiveDetail(selectedArchive.type, selectedArchive.id) : null;
  detailBox.innerHTML = detail ? renderArchiveDetail(detail) : `<div class="fate-head">No archive item selected.</div>`;
}

function renderArchiveDetail(detail){
  return detailSectionsHtml(detail);
}

function bindDeepArchive(){
  const input = $("archiveSearch");
  const tabs = $("archiveTabs");
  const list = $("archiveList");
  if(input && !input.dataset.bound){
    input.dataset.bound = "1";
    input.addEventListener("input", e=>{
      archiveQuery = e.target.value || "";
      selectedArchive = null;
      renderDeepArchive();
    });
  }
  if(tabs && !tabs.dataset.bound){
    tabs.dataset.bound = "1";
    tabs.addEventListener("click", e=>{
      const button = e.target.closest("[data-archive-tab]");
      if(!button) return;
      activeArchive = button.dataset.archiveTab;
      selectedArchive = null;
      renderDeepArchive();
    });
  }
  if(list && !list.dataset.bound){
    list.dataset.bound = "1";
    list.addEventListener("click", e=>{
      const row = e.target.closest("[data-archive-type][data-archive-id]");
      if(!row) return;
      openEntity(row.dataset.archiveType, Number(row.dataset.archiveId));
    });
  }
}

function bindArchiveEntityClicks(root){
  if(root.dataset.archiveBound) return;
  root.dataset.archiveBound = "1";
  root.addEventListener("click", e=>{
    if(e.target.closest("#archiveList,#archiveTabs,#archiveSearch")) return;
    const direct = e.target.closest("[data-person-id],[data-faction-id],[data-technique-id],[data-archive-type][data-archive-id]");
    if(!direct) return;
    if(direct.dataset.personId) openEntity("people", Number(direct.dataset.personId));
    else if(direct.dataset.factionId) openEntity("factions", Number(direct.dataset.factionId));
    else if(direct.dataset.techniqueId) openEntity("techniques", Number(direct.dataset.techniqueId));
    else if(direct.dataset.archiveType && direct.dataset.archiveId) openEntity(direct.dataset.archiveType, Number(direct.dataset.archiveId));
  });
}

function selectArchiveItem(type, id){
  openEntity(type, Number(id));
}

// Keeps the sidebar archive + Fate Record + chronicle highlight in step with
// whatever the modal is currently showing (fired on open and on cross-nav).
function syncDetailSelection(type, id){
  selectedArchive = {type, id};
  if(type === "events"){
    selectedEventId = id;
    const chron = $("chron");
    if(chron) [...chron.querySelectorAll(".entry")].forEach(node=>node.classList.toggle("selected", Number(node.dataset.eventId) === id));
  }
  renderFateRecord();
  renderDeepArchive();
}

function labelForArchiveType(type){
  return ARCHIVE_TYPES.find(item=>item.key === type)?.label || type;
}

function pathLabel(path){
  return CULTIVATION_PATHS[path]?.label || path;
}

function qiLabel(qiType){
  return QI_TYPES[qiType]?.label || qiType;
}

export function bindChronicleScroll(){
  const chron = $("chron");
  initEntityModal({onNavigate:syncDetailSelection});
  bindDeepArchive();
  bindArchiveEntityClicks(document.body);
  chron.addEventListener("scroll", e=>{
    const box = e.target;
    autoScroll = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    $("fnote").textContent = autoScroll ? "The brush records all. Scroll up to read the past." : "Reading the past — scroll to the bottom to follow the present.";
  });
}

function renderRecordBar(){
  const bar = $("recordbar");
  if(!bar || !STATE) return;
  bar.innerHTML = RECORD_SURFACES.map(record=>{
    const count = STATE.log.filter(e=>eventMatchesRecord(e, record.key)).length;
    return `<button class="record-tab ${activeRecord === record.key ? "on" : ""}" data-record="${record.key}" title="${record.description}">${record.label}<span>${count}</span></button>`;
  }).join("");
  if(bar.dataset.bound) return;
  bar.dataset.bound = "1";
  bar.addEventListener("click", e=>{
    const button = e.target.closest("[data-record]");
    if(!button) return;
    activeRecord = button.dataset.record;
    renderLog(true);
  });
}

function renderFateRecord(){
  const box = $("fatebox");
  if(!box) return;

  const traced = STATE.log.filter(e=>e.causes?.length || e.effects?.length);
  $("fatect").textContent = traced.length;
  if(!traced.length){
    box.innerHTML = `<div class="fate-head">The ink is still settling.</div>`;
    return;
  }

  const selected = STATE.log.find(e=>e.id === selectedEventId && (e.causes?.length || e.effects?.length));
  const event = selected || traced.at(-1);
  selectedEventId = event.id;

  const causes = event.causes?.length ? event.causes : [{kind:"Record", label:"No visible cause", detail:"The True Record has not yet exposed this thread."}];
  const effects = event.effects || [];
  const beneficiaries = event.beneficiaries || [];
  const rumour = event.rumour;
  const trueLayer = trueRecordFor(event);
  box.innerHTML = `
    <div class="fate-head">${stripTags(event.publicRecord || event.html).slice(0, 90)}</div>
    <div class="fate-sub">${event.type || event.causalType || "record"} · ${event.importance || event.level} · Year ${event.year} · ${STATE.seasonNames[event.season]}${event.locationName ? ` · ${stripTags(event.locationName)}` : ""}</div>
    <div class="fate-list">
      ${rumour ? renderRumour(rumour) : ""}
      ${causes.map(renderFateItem).join("")}
      ${effects.map(item=>renderFateItem({...item, kind:`Effect · ${item.kind}`})).join("")}
      ${beneficiaries.map(renderBenefit).join("")}
      ${trueLayer?.knownByPeople?.length ? renderStructuredNames("Known Witnesses", trueLayer.knownByPeople.map(person=>person.name)) : ""}
      ${trueLayer?.hiddenCauses?.length ? trueLayer.hiddenCauses.map(item=>renderLinkedEvent("Hidden Cause", item)).join("") : ""}
      ${trueLayer?.consequences?.length ? trueLayer.consequences.map(item=>renderLinkedEvent("Consequence", item)).join("") : ""}
    </div>
  `;
}

function renderFateItem(item){
  return `<div class="fate-item"><b>${item.kind}</b><span>${item.label}</span>${item.detail ? `<div>${item.detail}</div>` : ""}</div>`;
}

function renderBenefit(item){
  return `<div class="fate-item benefit"><b>Beneficiary</b><span>${item.who}</span><div>${item.gain}${item.cost ? ` Cost: ${item.cost}` : ""}</div></div>`;
}

function renderRumour(item){
  const spread = item.spread != null ? ` Spread ${Math.round(item.spread)}.` : "";
  const credibility = item.credibility != null ? ` Credibility ${Math.round(item.credibility)}.` : "";
  return `<div class="fate-item rumour-verdict"><b>Rumour Verdict</b><span>${item.verdict}</span><div>${item.note}${item.plantedBy ? ` Planted by: ${item.plantedBy}.` : ""}${spread}${credibility}</div></div>`;
}

function renderLinkedEvent(label, item){
  return `<div class="fate-item linked-record"><b>${label}</b><span>Year ${item.year} · ${item.type}</span><div>${stripTags(item.publicRecord).slice(0, 150)}</div></div>`;
}

function renderStructuredNames(label, names){
  return `<div class="fate-item"><b>${label}</b><span>${names.slice(0, 4).join(", ")}</span>${names.length > 4 ? `<div>+${names.length - 4} more witnesses in the hidden record.</div>` : ""}</div>`;
}

function stripTags(html){
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || div.innerText || "";
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
