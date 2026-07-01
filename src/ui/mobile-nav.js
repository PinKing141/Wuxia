"use strict";

// Drives the phone-only bottom tab bar. On desktop the CSS ignores
// [data-view] entirely, so this is a no-op there. It only toggles which
// of the three main columns (Powers / Chronicle / Realm) is visible on
// small screens — it never touches simulation state.

const app = document.querySelector(".app");
const nav = document.getElementById("mobilenav");

if(app && nav){
  const setView = view=>{
    app.dataset.view = view;
    [...nav.children].forEach(b=>b.classList.toggle("on", b.dataset.view === view));
  };

  nav.addEventListener("click", e=>{
    const btn = e.target.closest("button[data-view]");
    if(btn) setView(btn.dataset.view);
  });

  if(!app.dataset.view) setView("chronicle");
}
