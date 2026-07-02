"use strict";

// The entity detail modal — a "scroll" window that opens over the world when
// you click a person, sect, technique, region, war, event, bloodline or bond.
// It keeps a navigation stack so you can walk between linked entities (via the
// connection chips) and step back. The simulation keeps ticking behind it.

import { archiveDetail, entityConnections } from "../observer/deep-archive-service.js";

const $ = id=>document.getElementById(id);

let els = null;
let stack = [];
let onNavigate = null;
let lastFocus = null;

export function initEntityModal(opts={}){
  onNavigate = opts.onNavigate || null;
  els = {
    root:$("entityModal"),
    card:$("entityModal")?.querySelector(".emodal-card"),
    title:$("emodalTitle"),
    sub:$("emodalSub"),
    body:$("emodalBody"),
    back:$("emodalBack"),
  };
  if(!els.root || els.root.dataset.bound) return;
  els.root.dataset.bound = "1";

  els.root.addEventListener("click", e=>{
    if(e.target.closest("[data-emodal-close]")){ closeEntity(); return; }
    const chip = e.target.closest("[data-emodal-type][data-emodal-id]");
    if(chip){ pushEntity(chip.dataset.emodalType, Number(chip.dataset.emodalId)); return; }
  });
  els.back.addEventListener("click", ()=>back());
  document.addEventListener("keydown", e=>{
    if(els.root.hidden) return;
    if(e.key === "Escape"){ e.preventDefault(); closeEntity(); }
    else if(e.key === "Tab") trapFocus(e);
  });
}

export function openEntity(type, id){
  stack = [];
  pushEntity(type, id);
}

function pushEntity(type, id){
  const top = stack[stack.length - 1];
  if(!top || top.type !== type || top.id !== Number(id)) stack.push({type, id:Number(id)});
  render();
}

function back(){
  if(stack.length <= 1) return closeEntity();
  stack.pop();
  render();
}

function closeEntity(){
  if(!els || els.root.hidden) return;
  els.root.hidden = true;
  document.body.classList.remove("emodal-open");
  stack = [];
  if(lastFocus && lastFocus.focus){ lastFocus.focus(); lastFocus = null; }
}

function render(){
  const current = stack[stack.length - 1];
  if(!current) return;
  const detail = archiveDetail(current.type, current.id);
  const conns = entityConnections(current.type, current.id);

  if(!detail){
    // Entity vanished (e.g. filtered out) — step back or close gracefully.
    stack.pop();
    if(stack.length) return render();
    return closeEntity();
  }

  els.title.textContent = detail.title;
  els.sub.textContent = detail.subtitle || "";
  els.back.hidden = stack.length <= 1;
  els.body.innerHTML = connectionsHtml(conns) + sectionsHtml(detail);
  els.body.scrollTop = 0;
  // Subtle fade/slide as the body content swaps (open and cross-nav).
  if(els.body.animate){
    els.body.animate([{opacity:0, transform:"translateY(6px)"}, {opacity:1, transform:"none"}], {duration:150, easing:"ease"});
  }

  const wasOpen = !els.root.hidden;
  if(!wasOpen){
    lastFocus = document.activeElement;
    els.root.hidden = false;
    document.body.classList.add("emodal-open");
  }
  els.card.focus({preventScroll:true});
  if(onNavigate) onNavigate(current.type, current.id);
}

export function detailSectionsHtml(detail){
  if(!detail) return `<div class="emodal-empty">No record found.</div>`;
  return `<h2 class="emodal-inline-title">${escapeHtml(detail.title)}</h2>` +
    `<div class="emodal-inline-sub">${escapeHtml(detail.subtitle || "")}</div>` +
    sectionsHtml(detail);
}

function sectionsHtml(detail){
  return detail.sections.map(section=>`
    <section class="emodal-section">
      <h3>${escapeHtml(section.label)}</h3>
      <div class="emodal-lines">${
        String(section.body || "").split("\n").map(line=>line.trim() ? `<p>${formatLine(line)}</p>` : "").join("")
      }</div>
    </section>`).join("");
}

function connectionsHtml(conns){
  if(!conns.length) return "";
  return `<div class="emodal-conns" aria-label="Connections">${
    conns.map(c=>`<button class="chip chip-${c.type}" data-emodal-type="${c.type}" data-emodal-id="${c.id}" title="${escapeHtml(c.label)}">${escapeHtml(c.label)}</button>`).join("")
  }</div>`;
}

function formatLine(line){
  const esc = escapeHtml(line);
  const match = esc.match(/^([^:]{1,26}):\s+([\s\S]+)$/);
  if(match) return `<span class="k">${match[1]}</span> ${match[2]}`;
  return esc;
}

function trapFocus(e){
  const focusable = els.card.querySelectorAll('button:not([hidden]), [href], [tabindex]:not([tabindex="-1"])');
  if(!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
