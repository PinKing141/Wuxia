# Living Jianghu Roadmap

This roadmap tracks the long-term goal: the chronicle should feel like history being uncovered, not random event spam.

Core formula for major events:

`Personality + Memory + Relationship + Ambition + Opportunity = Event`

Faction version:

`Weak prestige + unstable succession + stolen technique + hostile neighbour + ambitious elder = faction war`

Technique version:

`Lost art + ruined site + desperate heir + high talent + dangerous method = future calamity`

## Status Legend

- `[x]` Built in the current implementation.
- `[ ]` Not built yet.
- `Partial` means there is an early version, but it is not yet a core living-world system.

## Current Built Foundation

- [x] Modular single-page prototype split into `data`, `entities`, `generators`, `simulation`, `observer`, `ui`, `utils`, and `styles`.
- [x] Seeded autonomous simulation with seasonal ticking.
- [x] Chinese Jianghu/Xuanhuan naming and realm direction.
- [x] Fixed and generated powers: dynasties, academies, sects, clans, temples, valleys, towers, workshops, cults, alliances, manors, palaces, and hidden lineages.
- [x] Public chronicle records and hidden True Record variants for major events.
- [x] Observer archive tabs: World Chronicle, Jianghu Ledger, Imperial Register, True Record, Fate Record, War Annals, Court Dossier, Archive of Sects, Register of Clans, Rumours, and Abyssal Record.
- [x] Fate Record inspection with causes, effects, beneficiaries, known witnesses, and rumour verdicts.
- [x] Faction-specific event tables for Tang Clan of Shu, Imperial Academy, Divine Hall, Black Sun Cult, and Abyssal Remnant.
- [x] First-class paths, qi types, faction weaknesses, training cultures, and institution types.
- [x] Full cultivation path set from the design docs: Martial, Sword, Saber, Daoist, Buddhist, Scholarly, Heretical, Poison, Medicine, Formation, Talisman, Ghost/Corpse, Assassin, Beast-Taming, Artifact Refining, Abyssal, and Hidden Lineage.
- [x] Realm ladder from Mortal to Immortal / Ascended.
- [x] Cultivation sub-stages: Early, Middle, Late, Peak, and Half-Step.
- [x] Cultivation progression, aging, lifespan, power, fame, breakthrough outcomes, injuries, inner demons, death, lost arts, art refinement, corruption, wars, faction collapse, and Son of the Abyss calamity events.
- [x] Basic public rumour and hidden truth support.
- [x] Memory-driven relationship events: sworn brotherhood, rivalry, betrayal, life debt, humiliation, disciple transmission, forbidden romance, favoritism, assassinations, and grudge wars.
- [x] Faction identity systems: ideology, goals, leaders, successors, wealth, military strength, cultivation strength, stability, diplomacy, secrets, vassals, and type-specific behaviour.
- [x] Technique biography systems: creators, origin factions, current and past holders, inheritance events, theft records, lost and rediscovered manuals, branches, risks, counters, and lineage reports.
- [x] Structured chronicle records with event type, importance, involved people/factions/techniques, hidden causes, consequences, known witnesses, tags, and first-class rumour entities.
- [x] Structured conflict systems: personal insults, duels, assassinations, succession crises, romance tension, resource disputes, border skirmishes, dynastic rebellion pressure, faction wars, battles, casualties, aftermath, and war reports.
- [x] Deep Archive observer UI with global search, indexes, clickable records, and detail reports for people, powers, techniques, wars, events, regions, relationships, and bloodlines.
- [x] Local server smoke check returns the current app page on `http://127.0.0.1:5181/the-murim-chronicle.html`.

## Phase 0: Modular Prototype

Goal: keep the prototype expandable.

- [x] Move RNG and utility helpers out of the HTML file.
- [x] Move names, factions, realms, paths, qi types, techniques, and event tables into `src/data`.
- [x] Move entity creation into `src/entities`.
- [x] Move world generation into `src/generators`.
- [x] Move ticking and systems into `src/simulation`.
- [x] Move chronicle, record filters, causality, and selectors into `src/observer`.
- [x] Move rendering into `src/ui`.
- [x] Move CSS into `styles`.
- [ ] Optional: add a `src/core` layer if shared engine state, scheduling, or simulation contracts become complex enough to need it.

Success condition:

- [x] The game works like the original prototype but is modular.

## Phase 1: World Foundation

Goal: the world should exist before individuals act.

Current status: Complete for the Phase 1 text simulation layer. The simulator now has structured regions, landmark records, faction seats, character locations, regional events, travel drift, territory pressure, and location-aware chronicle entries. A visual map remains a later observer/UI feature, not a Phase 1 blocker.

- [x] Basic region names exist.
- [x] Factions have text regions and seats.
- [x] Add `Region` entities with id, type, dominant faction, danger, stability, wealth, spiritual density, population pressure, demonic activity, recent events, and hidden secrets.
- [x] Add cities, mountains, rivers, forbidden zones, cultivation sites, faction seats, battlefields, and ancient ruins.
- [x] Add `src/generators/regions.js`.
- [x] Add `src/observer/map-state.js`.
- [x] Add `src/simulation/territory-system.js`.
- [x] Add `src/simulation/travel-system.js`.
- [x] Add `src/simulation/regional-event-system.js`.
- [x] Give people birthplace and current location.
- [x] Make wars, deaths, inheritances, and treasures happen somewhere specific.

Minimum text regions:

- [x] Central Plains style region list exists in seed data.
- [x] Expand to structured Central Plains, Shu, Jiangnan, Northern Desert, Eastern Sea, Kunlun Mountains, Imperial Capital, Southern Wilderness, and Western Borderlands records.
- [x] Add extra structured regions for Frostbound North, Jade Coast, and Ten Thousand Peaks.

## Phase 2: Character Life System

Goal: characters should feel like people, not stat blocks.

Current status: Complete for the Phase 2 model foundation. Every generated character now has gender, family, rank, hidden aptitude stats, personality traits, ambition, fear, memories, relationships, secrets, public and hidden identity, injury/death storage, reputation, and life goals. Deeper memory-driven event selection belongs to Phase 4.

- [x] Age.
- [x] Faction membership.
- [x] Talent.
- [x] Realm and sub-stage.
- [x] Path and qi type.
- [x] Master id for recruited disciples.
- [x] Lineage text for inherited manuals.
- [x] Fame and public epithet.
- [x] Basic grudge ids.
- [x] Gender.
- [x] Birthplace and current location.
- [x] Family id and lightweight surname-family graph.
- [x] Rank in faction.
- [x] Disciple id list.
- [x] Separate hidden stats: cultivationTalent, comprehension, combatInstinct, daoHeart, willpower, luck, foundationQuality.
- [x] Personality traits.
- [x] Ambitions.
- [x] Fears.
- [x] Memories.
- [x] Relationships with emotional weights.
- [x] Secrets.
- [x] Public identity and hidden identity.
- [x] Injuries and cause of death storage.
- [x] Life goals that drive quiet yearly pressure.

Minimum alive version:

- [x] Every major character has at least one ambition.
- [x] Every major character has at least one fear.
- [x] Every major character can store memories linked to events.
- [x] Every major character can form durable relationships.

## Phase 3: Cultivation System

Goal: cultivation should drive status, lifespan, politics, danger, and relationships.

Current status: Complete for the Phase 3 cultivation foundation. The realm ladder, sub-stages, paths, qi types, progress, lifespan, power, hidden stats, resources, technique compatibility, master guidance, pill-toxicity pressure, injuries, inner demons, and explicit breakthrough outcomes now drive cultivation. Full named pill/herb economies remain in the later core expansion section.

- [x] Universal realm ladder.
- [x] Early, Middle, Late, Peak, and Half-Step stages.
- [x] Path and qi type compatibility affects growth and power.
- [x] Talent affects cultivation speed.
- [x] Realm affects lifespan and power.
- [x] High-realm breakthroughs create public and True Record entries.
- [x] Stage-deepening records exist for notable cultivators.
- [x] Separate cultivation stats: comprehension, foundationQuality, qiPurity, mentalState, resources, techniqueCompatibility, masterGuidance, luck.
- [x] Breakthrough attempts instead of automatic realm-up.
- [x] Breakthrough outcomes: success, flawed success, failure, severe backlash, foundation damage, qi deviation, inner demon, and death.
- [x] Injury system.
- [x] Inner demon system.
- [x] Resource-assisted breakthrough system.
- [x] Basic high-realm bottleneck and minor foundation damage on failed attempts.
- [x] Pill toxicity and unstable foundation effects.

Build files:

- [x] `src/data/realms.js`
- [x] `src/data/paths.js`
- [x] `src/data/qiTypes.js`
- [x] `src/simulation/cultivation-system.js`
- [x] `src/simulation/breakthrough-system.js`
- [x] `src/simulation/inner-demon-system.js`
- [x] `src/simulation/injury-system.js`

## Phase 4: Relationships And Memory

Goal: events should come from remembered history.

Current status: Complete for the Phase 4 memory/relationship foundation. Relationship and Memory entities now store durable emotional state, memories influence relationship pressure, relationships drift over time, life debts form from healing, jealousy can become betrayal, romance can create faction tension, master favoritism can seed succession resentment, and grudges can escalate into humiliation, duels, assassinations, or memory-driven wars.

- [x] Basic grudges on figures.
- [x] Sworn brotherhood event.
- [x] Rival duel event.
- [x] Betrayal event.
- [x] Disciple transmission event.
- [x] Forbidden romance rumour event.
- [x] `Relationship` entity.
- [x] `Memory` entity.
- [x] Relationship types: master, disciple, parent, child, sibling, sworn sibling, friend, rival, enemy, lover, spouse, benefactor, life-debtor, killer, betrayer, protector, secret admirer, political ally.
- [x] Relationship feelings: respect, loyalty, fear, love, envy, resentment, debt, trust, hatred, admiration.
- [x] Memory types for origins, oaths, master loss, lost duel, praise, manual discovery, betrayal, failed breakthrough, exile, romance, corruption, and faction duty.
- [x] Memories influence future event selection.
- [x] Grudges escalate into duels, assassinations, and wars.
- [x] Observer relationship report service.

Build files:

- [x] `src/entities/relationship.js`
- [x] `src/entities/memory.js`
- [x] `src/simulation/relationship-system.js`
- [x] `src/simulation/memory-system.js`
- [x] `src/simulation/grudge-system.js`
- [x] `src/observer/relationship-report-service.js`

## Phase 5: Factions, Sects, Clans, Temples

Goal: factions should behave differently by type.

Current status: Complete for the Phase 5 faction foundation. Factions now have ideology, leaders, successors, wealth, military strength, cultivation strength, public reputation, internal stability, diplomacy lists, vassals, grudges, forbidden techniques, secrets, current goals, succession pressure, faction politics, and type-specific yearly behaviour.

- [x] Fixed legacy powers.
- [x] Generated powers.
- [x] Explicit institution types.
- [x] Alignment-aware institution generation.
- [x] Type-specific leader titles.
- [x] Faction weaknesses.
- [x] Training cultures.
- [x] Signature techniques.
- [x] Prestige.
- [x] Membership.
- [x] War and collapse.
- [x] Faction-specific event tables for important legacy factions.
- [x] Region id and territory.
- [x] Ideology.
- [x] Leader id and successor id.
- [x] Wealth.
- [x] Military strength.
- [x] Cultivation strength separated from prestige.
- [x] Public reputation separated from hidden stability.
- [x] Internal stability.
- [x] Allies, enemies, vassals, and faction grudges.
- [x] Forbidden techniques.
- [x] Faction secrets.
- [x] Current goals.
- [x] Succession system.
- [x] Faction politics system.
- [x] Type-specific behaviour for sects, clans, temples, academies, dynasties, demonic sects, medicine valleys, Tang-style clans, and rogue alliances.

Build files still needed:

- [x] `src/data/faction-types.js`
- [x] `src/simulation/faction-system.js`
- [x] `src/simulation/succession-system.js`
- [x] `src/simulation/faction-politics-system.js`

## Phase 6: Techniques And Inheritance

Goal: a martial art should have a biography.

Current status: Complete for the Phase 6 technique biography foundation. Techniques now track types, grades, creators, origin factions, current and past holders, public status, damage/completeness state, compatibility requirements, risks, counters, parent/child branches, creation, modification, inheritance, theft, loss, rediscovery, corruption, and observer lineage reports. Full clickable technique detail pages remain part of Phase 9 deep observer UI.

- [x] Technique entity exists.
- [x] Technique path and qi type.
- [x] Technique tier.
- [x] Technique corruption.
- [x] Signature techniques for factions.
- [x] Technique holders count.
- [x] Techniques can be lost.
- [x] Techniques can be rediscovered by new heirs.
- [x] Techniques can become dormant after a calamity vessel dies.
- [x] Technique refinement events.
- [x] Technique name flavour includes talisman, corpse-refining, and beast-taming options.
- [x] Technique type.
- [x] Technique grade: Common, Refined, Profound, Earth, Heaven, Saint, Immortal.
- [x] Creator id.
- [x] Origin faction id.
- [x] Current holder ids and past holder ids.
- [x] Public known status.
- [x] Forbidden, damaged, complete, and completeness fields.
- [x] Compatibility requirements.
- [x] Risks.
- [x] Known counters.
- [x] Parent and child technique ids.
- [x] Derived techniques and branch versions.
- [x] Technique creation by characters.
- [x] Technique modification based on life history, injury, physique, path, qi type, and personality.
- [x] Technique inheritance events with explicit teacher, student, and event id.
- [x] Technique lineage observer service and visible lineage summary.

Build files:

- [x] `src/simulation/technique-creation-system.js`
- [x] `src/simulation/technique-modification-system.js`
- [x] `src/simulation/technique-inheritance-system.js`
- [x] `src/observer/technique-lineage-service.js`

## Phase 7: Events, Rumours, Public Truth, Hidden Truth

Goal: every major event should have layers.

Current status: Complete for the Phase 7 event-layer foundation. Chronicle events now keep public records, true records, known-by text, causes, effects, beneficiaries, structured location ids, event type, importance, involved person/faction/technique ids, hidden cause ids, consequence ids, known-by person ids, rumour ids, tags, and first-class rumour entities. Deeper clickable event pages remain part of Phase 9.

- [x] Chronicle event ids.
- [x] Public record.
- [x] True Record.
- [x] Known-by text.
- [x] Cause records.
- [x] Effect records.
- [x] Beneficiaries.
- [x] Rumour verdict metadata.
- [x] Record archive filters.
- [x] Fate Record display.
- [x] Location id.
- [x] Event type enum.
- [x] Importance enum beyond current `normal`, `major`, and `epic`.
- [x] Involved person ids.
- [x] Involved faction ids.
- [x] Involved technique ids.
- [x] Hidden cause ids.
- [x] Consequence ids.
- [x] Known-by person ids.
- [x] Rumour entity ids.
- [x] Tags.
- [x] Rumour entities with true, false, half-true, exaggerated, planted, misunderstood, imperial propaganda, and sect cover-up types.

Build files:

- [x] `src/entities/chronicle-event.js`
- [x] `src/entities/rumour.js`
- [x] `src/simulation/event-system.js`
- [x] `src/simulation/rumour-system.js`
- [x] `src/simulation/chronicle-system.js`
- [x] `src/observer/public-record-service.js`
- [x] `src/observer/true-record-service.js`

## Phase 8: Conflict System

Goal: conflict should escalate naturally from personal insult to faction war.

Current status: Complete for the Phase 8 conflict foundation. Conflict now exists at multiple scales: personal insults, rivalries, duels, assassinations, succession crises, romance tension, resource disputes, border skirmishes, dynastic rebellion pressure, faction wars, battles, casualties, faction collapse, aftermath, and structured war reports. Full clickable war pages remain part of Phase 9.

- [x] Personal duel event.
- [x] Betrayal event.
- [x] Grudge ids.
- [x] Faction war start.
- [x] Battle casualties.
- [x] War end with winner and loser.
- [x] Faction collapse and survivors.
- [x] Public cause and hidden/true cause text for wars.
- [x] Personal insult conflict level.
- [x] Assassination system.
- [x] Succession crisis system.
- [x] Marriage conflict system.
- [x] Resource dispute system.
- [x] Technique theft as structured event.
- [x] Border skirmish level before war.
- [x] Dynastic rebellion.
- [x] Structured `War` entity with cause event id, hidden cause event id, battles, casualties, territory changes, technique losses, grudges created, aftermath.
- [x] Conflict escalation chain from memory to duel to assassination to sect dispute to war.

Build files:

- [x] `src/simulation/duel-system.js`
- [x] `src/simulation/assassination-system.js`
- [x] `src/simulation/war-system.js`
- [x] `src/simulation/battle-system.js`
- [x] `src/simulation/aftermath-system.js`
- [x] `src/observer/war-report-service.js`

## Phase 9: Observer-Only Deep Inspection

Goal: observing deeply is the gameplay.

Current status: Complete for the Phase 9 observer foundation. The app now has a Deep Archive with global search, indexes, clickable chronicle/entity records, and detail reports for people, factions, techniques, wars, events, regions, relationships, and bloodlines. These reports expose hidden causes, consequences, witnesses, technique histories, war reports, and likely future paths without giving the observer control.

- [x] Chronicle screen.
- [x] Powers panel.
- [x] Notable cultivators panel.
- [x] Record filters.
- [x] Fate Record causality panel.
- [x] Archive tabs for rumours, true records, wars, court records, clans, sects, abyssal events, and ledgers.
- [x] Search everything.
- [x] Map screen.
- [x] People index.
- [x] Techniques index.
- [x] Wars index.
- [x] Lineages index.
- [x] Person detail page.
- [x] Faction detail page.
- [x] Technique detail page.
- [x] War detail page.
- [x] Event detail page.
- [x] Region detail page.
- [x] Relationship detail page.
- [x] Bloodline detail page.
- [x] `Why did this happen?` causality section with immediate cause, deep cause, hidden cause, consequences, and who knows.

## Phase 10: Era System And Calamities

Goal: long simulations should have readable historical chapters.

Current status: Early partial. The Son of the Abyss exists as a rare calamity-style event, but there is no era system or world-tension model.

- [x] Son of the Abyss calamity-level figure.
- [x] Calamity can be defeated and leave dormant inheritance behind.
- [x] Abyssal Record archive.
- [ ] Era state.
- [ ] Era names: Peace, Rising Heroes, Sect Rivalry, Demonic Growth, Imperial Expansion, Calamity, Collapse, Restoration, Hidden Masters, Succession Wars.
- [ ] Era drift every 20-100 years based on world conditions.
- [ ] World tension metrics.
- [ ] Calamities: demonic sect unification, heavenly tribulation disaster, ancient tomb opening, corpse plague, imperial purge, great sect war, poison catastrophe, dragon vein collapse, forbidden scripture resurfacing.
- [ ] Restoration after collapse.
- [ ] Review Son of the Abyss terminology so the title is distinct from ordinary qi labels and the cause remains narratively coherent.

## Phase 11: Balance, Testing, Replayability

Goal: every seed should create different but believable history.

Current status: Early partial. Manual deterministic smoke tests have been used. No committed automated test suite exists yet.

- [x] Deterministic seeds can be run from Node.
- [x] Manual invariant checks for missing true records and missing causal traces.
- [x] Browser verification passes on local clean servers.
- [ ] Automated simulation test suite.
- [ ] Test births/recruitment rate.
- [ ] Test high-realm distribution.
- [ ] Test sect death rate.
- [ ] Test war frequency.
- [ ] Test lost and rediscovered technique frequency.
- [ ] Test memory-caused events after memory system exists.
- [ ] Test demonic/corrupt cultivator danger rate.
- [ ] Debug reports for average lifespan, living cultivators, wars per century, collapses, high-realm experts, lost techniques, death causes, and most dangerous faction.
- [ ] 300-year replayability report.

## Core System Expansion: Geniuses, Roots, Physiques, Pills, Treasures

Goal: geniuses, physiques, roots, pills, treasures, and technique evolution become core systems rather than rare flavour text.

Current status: Mostly not built. The sim has a single talent stat and some prodigy flavour, but not the full hidden aptitude model.

### Geniuses

- [x] Basic talent stat.
- [x] Prodigy recruitment flavour for high-talent recruits.
- [ ] Genius type classification: cultivation, comprehension, combat, sword, alchemy, formation, talisman, poison, body refining, demonic path, late-blooming, false genius, heaven-defying.
- [x] Separate hidden stats: cultivationTalent, comprehension, combatInstinct, daoHeart, willpower, luck, foundationQuality.
- [ ] Genius types affect event selection, technique creation, combat outcomes, and faction recruitment pressure.

### Spiritual Roots

- [ ] Spiritual root data: Metal, Wood, Water, Fire, Earth, Wind, Lightning, Ice, Yin, Yang, Five Elements, Mixed, Heavenly, Mutated, Impure, Damaged.
- [ ] Root affects cultivation speed.
- [ ] Root affects technique compatibility.
- [ ] Root affects qi type affinity.
- [ ] Root affects breakthrough chance.
- [ ] Root affects alchemy, formation, and talisman aptitude.
- [ ] Root affects sect interest.

### Special Physiques

- [ ] Physique data.
- [ ] Start with Innate Sword Body, Pure Yang Body, Extreme Yin Body, Five Elements Body, Ten Thousand Poison Body, Vajra Body, Thunder Spirit Body, Broken Meridian Body, Heavenly Dao Heart, Devil Heart Body.
- [ ] Each physique has benefit, cost, trigger condition, compatible paths, danger, rarity, and public-known status.
- [ ] Physiques create recruitment, conflict, fear, and study/abduction events.

### Pills, Herbs, Elixirs, And Treasures

- [ ] Pill data.
- [ ] Start with Qi Gathering Pill, Meridian Opening Pill, Foundation Establishment Pill, Healing Pill, Poison Cleansing Pill, Blood Replenishing Pill, Soul Nourishing Pill, Heart Calming Pill.
- [ ] Pill grades: Low, Middle, High, Peak, Perfect, Flawed, Poisoned, Forbidden.
- [ ] Pill effects: speed cultivation, assist breakthrough, heal injuries, repair meridians, extend lifespan, stabilise foundation, purify qi, strengthen body, restore soul, suppress inner demons, remove poison.
- [ ] Pill risks: toxicity, unstable foundation, reduced future breakthrough chance, dependency, qi deviation, hidden poison, impurities, inner demon growth, shortened lifespan.
- [ ] Herb and treasure data: Thousand-Year Ginseng, Nine Leaf Spirit Grass, Blood Jade Lotus, Earth Fire Mushroom, Cold Moon Flower, Dragon Bone Grass, Purple Cloud Fruit, Heavenly Star Stone, Black Iron Essence, Thunderstruck Wood, Yin Spring Water, Yang Flame Stone.
- [ ] Resource events: auction, theft, failed refinement, poisoned pill scandal, herb garden destroyed, secret realm opens, ancient pill recipe found, alchemist defects, furnace explosion, rare herb matures.

### Alchemists

- [ ] Character role or profession system.
- [ ] Alchemist grades from Apprentice to Saint Alchemist.
- [ ] Alchemists can create pills, repair foundations, cure poison, extend lifespan, trigger auction wars, be kidnapped, create forbidden pills, and poison enemies.

### Artifacts And Weapons

- [ ] Artifact data.
- [ ] Categories: spirit sword, saber, spear, cauldron, talisman brush, formation flag, poison needle, hidden weapon, Buddhist relic, Daoist seal, demonic banner, soul bell, storage ring, protective robe.
- [ ] Artifact grade, owner history, creator, spirit, damage, compatibility, special effect, curse.
- [ ] Artifact biography observer service.

## Minimum Alive Version Checklist

- [x] 50-100 important living characters.
- [x] 8-12 factions minimum.
- [x] 10-20 techniques minimum.
- [x] 8-12 structured regions.
- [x] Relationships.
- [x] Memories.
- [ ] Faction goals.
- [x] Cultivation progression.
- [x] Wars.
- [x] Duels.
- [x] Betrayals.
- [x] Lost techniques.
- [x] Public and hidden records.
- [ ] Biography pages.
- [x] Causality panel for events.

## Development Milestones

### Milestone 1: Modular Prototype

- [x] Split current HTML into folders.
- [x] Move data into `data`.
- [x] Move simulation into `simulation`.
- [x] Move rendering into `ui`.
- [x] Preserve visible features.

Success condition:

- [x] The game works exactly like before but is modular.

### Milestone 2: Chinese World Conversion

- [x] Chinese names.
- [x] Jianghu / cultivation world terms.
- [x] Chinese sects, clans, temples, academies, dynasties, valleys, workshops, cults, alliances, and hidden lineages.
- [x] Son of the Abyss title.
- [x] Chinese cultivation ladder.
- [x] Full documented path list represented in data.

Success condition:

- [x] The world feels Chinese cultivation-based rather than Korean Murim-based.

### Milestone 3: Real Character Model

- [x] Personality.
- [x] Ambition.
- [x] Fear.
- [x] Memory.
- [x] Relationships.
- [x] Secrets.

Success condition:

- [x] Every major character has reasons to act.

### Milestone 4: Relationship-Driven Events

- [x] Some rivalry, betrayal, romance, disciple, and sworn-brotherhood events exist.
- [x] Rivalries create duels through stored relationship state.
- [x] Jealousy creates betrayal through ambition and memory.
- [x] Life debts create loyalty.
- [x] Humiliation creates revenge.
- [x] Romance creates faction tension.
- [x] Master favoritism creates succession disputes.

Success condition:

- [x] Events are caused by character history, not just random chance.

### Milestone 5: Faction Identity

- [x] Faction types.
- [x] Training cultures.
- [x] Weaknesses.
- [x] Type labels and titles.
- [x] Some faction-specific events.
- [x] Type-specific faction AI.
- [x] Succession.
- [x] Goals.
- [x] Wealth/resources.
- [x] Diplomacy.

Success condition:

- [x] Different organizations behave differently over time, not only in flavour text.

### Milestone 6: Technique History

- [x] Techniques can be held, refined, lost, rediscovered, and corrupted.
- [x] Techniques have creators.
- [x] Techniques track holders and past holders.
- [x] Techniques can be stolen as structured events.
- [x] Techniques can branch and mutate.
- [x] Techniques can have known counters and risks.

Success condition:

- [x] A martial art can have a biography.

### Milestone 7: Public Record / True Record

- [x] Major events get public and true versions.
- [x] Major events get causes and effects.
- [x] Some events record who knows the truth.
- [x] Rumour verdicts exist.
- [x] Structured hidden causes and known-by person ids.
- [x] Rumour entities.

Success condition:

- [x] The observer can discover hidden reality beneath public history.

### Milestone 8: Causality View

- [x] Click chronicle event.
- [x] See causes.
- [x] See effects.
- [x] See beneficiaries.
- [x] See related rumour verdicts.
- [ ] See past cause chains across decades.
- [ ] See related people, factions, techniques, memories, and consequences as structured links.

Success condition:

- [ ] The world feels connected across decades.

### Milestone 9: Era And Calamity System

- [x] Son of the Abyss calamity exists.
- [ ] Historical era state.
- [ ] Era transitions based on conditions.
- [ ] Rare calamity event table.
- [ ] Restoration and aftermath.

Success condition:

- [ ] A 300-year simulation has clear historical chapters.

### Milestone 10: Deep Observer UI

- [x] Chronicle and record filters.
- [x] Fate Record panel.
- [x] Power and notable cultivator panels.
- [x] Search.
- [ ] Follow people.
- [ ] Follow factions.
- [ ] Follow techniques.
- [x] Biography pages.
- [x] War reports.
- [x] Technique histories.
- [x] Faction histories.

Success condition:

- [x] The player can observe the world to an uncanny degree without controlling it.

## What Not To Prioritize Yet

- [ ] Huge visual map.
- [ ] Complex combat animations.
- [ ] Inventory system.
- [ ] Playable character.
- [ ] Player choices.
- [ ] Massive economy.
- [ ] Too many realm variations.
- [ ] Overdesigned UI.
- [ ] Hundreds of technique names before technique biographies exist.

## Next Recommended Build Order

1. Make one event chain memory-driven: humiliation to grudge to duel to revenge.
2. Add `simulation/relationshipSystem.js`, `simulation/memorySystem.js`, and `simulation/grudgeSystem.js`.
3. Add spiritual roots and the first ten physiques.
4. Add pills and pill toxicity.
5. Add technique creator/holder history.
6. Add technique creation and modification.
7. Add structured war entities and aftermath.
8. Add faction goals and succession pressure.
9. Add era state and era transitions.
10. Add observer biography/detail pages for people, factions, techniques, wars, regions, and relationships.
