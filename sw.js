/* Service worker for The Jianghu Chronicle.
   Precaches the app shell so the installed PWA opens and runs fully offline,
   and runtime-caches the web fonts. Bump CACHE when assets change to roll
   the cache over. */

"use strict";

const CACHE = "jianghu-v1";

const PRECACHE = [
  "./the-murim-chronicle.html",
  "./styles/app.css",
  "./manifest.webmanifest",
  "./assets/logo.svg",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/favicon-32.png",
  "./assets/favicon-16.png",
  "./src/data/character-life.js",
  "./src/data/cultivation.js",
  "./src/data/eras.js",
  "./src/data/faction-events.js",
  "./src/data/faction-types.js",
  "./src/data/factions.js",
  "./src/data/names.js",
  "./src/data/path-profiles.js",
  "./src/data/paths.js",
  "./src/data/qiTypes.js",
  "./src/data/realms.js",
  "./src/data/regions.js",
  "./src/data/techniques.js",
  "./src/entities/chronicle-event.js",
  "./src/entities/faction.js",
  "./src/entities/family.js",
  "./src/entities/figure.js",
  "./src/entities/memory.js",
  "./src/entities/region.js",
  "./src/entities/relationship.js",
  "./src/entities/rumour.js",
  "./src/entities/technique.js",
  "./src/entities/war.js",
  "./src/generators/genesis.js",
  "./src/generators/names.js",
  "./src/generators/regions.js",
  "./src/main.js",
  "./src/observer/causality.js",
  "./src/observer/chronicle.js",
  "./src/observer/deep-archive-service.js",
  "./src/observer/map-state.js",
  "./src/observer/public-record-service.js",
  "./src/observer/records.js",
  "./src/observer/relationship-report-service.js",
  "./src/observer/selectors.js",
  "./src/observer/technique-lineage-service.js",
  "./src/observer/true-record-service.js",
  "./src/observer/war-report-service.js",
  "./src/simulation/aftermath-system.js",
  "./src/simulation/assassination-system.js",
  "./src/simulation/battle-system.js",
  "./src/simulation/breakthrough-system.js",
  "./src/simulation/chronicle-system.js",
  "./src/simulation/cultivation-system.js",
  "./src/simulation/duel-system.js",
  "./src/simulation/era-system.js",
  "./src/simulation/event-system.js",
  "./src/simulation/faction-politics-system.js",
  "./src/simulation/faction-system.js",
  "./src/simulation/grudge-system.js",
  "./src/simulation/identity.js",
  "./src/simulation/injury-system.js",
  "./src/simulation/inner-demon-system.js",
  "./src/simulation/life-system.js",
  "./src/simulation/memory-system.js",
  "./src/simulation/regional-event-system.js",
  "./src/simulation/relationship-system.js",
  "./src/simulation/rumour-system.js",
  "./src/simulation/succession-system.js",
  "./src/simulation/systems.js",
  "./src/simulation/technique-creation-system.js",
  "./src/simulation/technique-inheritance-system.js",
  "./src/simulation/technique-modification-system.js",
  "./src/simulation/territory-system.js",
  "./src/simulation/travel-system.js",
  "./src/simulation/war-system.js",
  "./src/state.js",
  "./src/ui/mobile-nav.js",
  "./src/ui/render.js",
  "./src/utils/random.js"
];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", event=>{
  event.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k !== CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", event=>{
  const req = event.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);

  // App shell navigations: serve the cached page first so the PWA opens
  // instantly and offline; refresh it in the background.
  if(req.mode === "navigate"){
    event.respondWith(
      caches.match("./the-murim-chronicle.html").then(cached=>{
        const network = fetch(req).then(res=>{
          caches.open(CACHE).then(c=>c.put("./the-murim-chronicle.html", res.clone()));
          return res;
        }).catch(()=>cached);
        return cached || network;
      })
    );
    return;
  }

  // Google Fonts (cross-origin): cache-first, since they are versioned.
  if(FONT_HOSTS.includes(url.hostname)){
    event.respondWith(
      caches.open(CACHE).then(async c=>{
        const hit = await c.match(req);
        if(hit) return hit;
        const res = await fetch(req);
        if(res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Same-origin assets: cache-first with network fallback that fills the cache.
  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(req).then(hit=>{
        if(hit) return hit;
        return fetch(req).then(res=>{
          if(res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c=>c.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
