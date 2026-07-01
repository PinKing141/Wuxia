"use strict";

import { makeEpithet } from "../generators/names.js";
import { recomputeLife, updatePublicIdentity, updateReputation } from "../entities/figure.js";
import { rememberEvent } from "../entities/memory.js";
import { benefit, cause, effect, rumour } from "../observer/causality.js";
import { chron, plainRef, ref } from "../observer/chronicle.js";
import { STATE } from "../state.js";
import { cap, clamp, dual } from "../utils/random.js";

export function maybeName(f, force){
  if(f.namedAt != null) return;
  if(force || (f.realm >= 3 && f.fame >= 14)){
    f.epithet = makeEpithet();
    f.namedAt = STATE.year;
    const event = chron(
      "c-rise",
      `${plainRef(f)}${f.sect ? " of " + dual(f.sect.name, f.sect.recordName) : ""} has won renown across the land, now spoken of as <span class="nm">${dual(cap(f.epithet.en), f.epithet.recordName)}</span>.`,
      "major",
      {
        trueRecord:`The epithet took hold because realm ${f.realm}, fame ${Math.round(f.fame)}, and ${f.sect ? "faction rumor networks" : "wanderer gossip"} aligned at the same moment.`,
        knownBy:"True Record; rumour brokers",
        beneficiaries:[
          benefit(ref(f), "A memorable epithet converts deeds into influence.", "Public renown attracts rivals."),
          benefit("Rumour brokers", "Gain a name that spreads easily.", "")
        ],
        rumour:rumour("Mostly true", "Jianghu storytellers", "The epithet reflects real fame, though storytellers polish the edges.")
      }
    );
    updateReputation(f);
    rememberEvent(f, event, {
      type:"earned_epithet",
      emotionalWeight:30,
      publicKnown:true,
      text:`Won the epithet ${cap(f.epithet.en)}.`
    });
  }
}

export function alignShift(f, amount, reason){
  const before = f.align;
  f.alignmentDrift = clamp(f.alignmentDrift + amount, 0, 100);
  let nextAlign;
  if(f.alignmentDrift >= 88) nextAlign = "abyssal";
  else if(f.alignmentDrift >= 72) nextAlign = "heretical";
  else if(f.alignmentDrift >= 42) nextAlign = "rogue";
  else if(f.alignmentDrift <= 10 && f.align !== "hidden") nextAlign = "righteous";
  else nextAlign = f.align;

  if(nextAlign !== before && f.align !== "hidden"){
    f.align = nextAlign;
    if(nextAlign === "abyssal"){
      const event = chron(
        "c-corrupt",
        `${ref(f)} has become abyss-touched${reason ? " after " + reason : ""}. The Jianghu argues whether this is madness, possession, or forbidden cultivation.`,
        "major",
        {
          trueRecord:`Death qi, resentment qi, and contradiction rites have rewritten their meridians; this is not simple demonic practice but a rejection of Heaven's law.`,
          knownBy:"True Record; a few hidden-lineage diviners",
          causalType:"calamity",
          causes:[
            cause("Drift", "Abyssal threshold crossed", `${ref(f)} reached drift ${Math.round(f.alignmentDrift)}.`),
            cause("Pressure", "Visible trigger", reason || "a concealed accumulation of corrupted practice")
          ],
          effects:[
            effect("Cultivation", "Heaven rejects the meridians", "Future breakthroughs become faster and more dangerous.")
          ],
          beneficiaries:[
            benefit(ref(f), "Gains frightening cultivation speed.", "Heaven's law and righteous factions now reject them.")
          ]
        }
      );
      rememberEvent(f, event, {
        type:"fell_to_abyss",
        emotionalWeight:-70,
        hidden:false,
        publicKnown:true,
        text:"Became abyss-touched after accumulated drift."
      });
    } else if(nextAlign === "heretical"){
      const event = chron(
        "c-corrupt",
        `${ref(f)} has fallen to the Heretical Path${reason ? " after " + reason : ""}. Public records blame greed and forbidden manuals.`,
        "major",
        {
          trueRecord:`Their drift began earlier than the Jianghu knows: resentment, technique corruption, and old grudges hollowed the foundation before the fall became visible.`,
          knownBy:"True Record; the closest surviving witnesses",
          causalType:"betrayal",
          causes:[
            cause("Drift", "Heretical threshold crossed", `${ref(f)} reached drift ${Math.round(f.alignmentDrift)}.`),
            cause("Pressure", "Visible trigger", reason || "resentment and corrupted inheritance")
          ],
          effects:[
            effect("Reputation", "Public trust breaks", `${ref(f)} can now seed fear, betrayal, and future grudges.`)
          ],
          beneficiaries:[
            benefit(ref(f), "Can abandon orthodox restraint for faster methods.", "Trust, lifespan, and stability decay.")
          ]
        }
      );
      rememberEvent(f, event, {
        type:"fell_to_heretical_path",
        emotionalWeight:-48,
        hidden:false,
        publicKnown:true,
        text:"Fell to the Heretical Path after resentment and corrupted inheritance."
      });
    } else if(nextAlign === "rogue" && before === "righteous"){
      const event = chron("c-corrupt", `${ref(f)} forsakes the righteous canon for rogue methods${reason ? " after " + reason : ""}.`, "normal");
      rememberEvent(f, event, {
        type:"forsook_righteous_canon",
        emotionalWeight:-18,
        hidden:false,
        publicKnown:true
      });
    }
    recomputeLife(f);
    updatePublicIdentity(f);
    updateReputation(f);
  }
}
