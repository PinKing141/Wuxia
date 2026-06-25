"use strict";

import { genesis } from "./generators/genesis.js";
import { tick } from "./simulation/systems.js";
import { bindChronicleScroll, renderLog, renderPanels } from "./ui/render.js";

const $ = id=>document.getElementById(id);
let timer = null;
let speed = 420;
let paused = false;

function loop(){
  if(!paused){
    tick();
    renderLog();
    renderPanels();
  }
  timer = setTimeout(loop, speed);
}

function start(seed){
  if(timer) clearTimeout(timer);
  genesis(seed);
  renderLog();
  renderPanels();
  loop();
}

function bindControls(){
  $("pause").addEventListener("click", e=>{
    paused = !paused;
    e.target.textContent = paused ? "▶ Resume" : "❚❚ Pause";
  });

  $("reseed").addEventListener("click", ()=>start((Math.random() * 0xffffffff) >>> 0));

  $("speed").addEventListener("click", e=>{
    if(e.target.dataset.s){
      speed = +e.target.dataset.s;
      [...$("speed").children].forEach(b=>b.classList.toggle("on", b === e.target));
    }
  });

  bindChronicleScroll();
}

bindControls();
start((Math.random() * 0xffffffff) >>> 0);
