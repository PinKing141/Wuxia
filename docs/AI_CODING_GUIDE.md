# AI Coding Guide

This project is an autonomous Chinese Jianghu/Xuanhuan chronicle simulator.

The player does not control the world. The player observes it through public records, hidden records, rumours, faction reports, and the True Record.

## Architecture Rules

1. Data files only contain definitions and lists.
2. Entity files define object structure.
3. Generator files create new entities.
4. Simulation systems change the world over time.
5. Observer services explain, search, summarize, and connect world history.
6. UI files only display state. UI files should not contain simulation logic.
7. Rules and formulas belong in simulation rules or simulation calculations.
8. Text templates belong in event data.
9. Chinese cultivation terms should be genre-authentic.
10. Avoid Korean Murim-coded terms and divine/game UI names. Use Jianghu, True Record, World Chronicle, qi, inner qi, true qi, spiritual qi, sword qi, blood qi, yin qi, yang qi, resentment qi, and abyssal qi where appropriate.

## Core Concepts

- The game is Chinese Xuanhuan with Wuxia/Jianghu foundations.
- The universal realm ladder runs from Mortal to Immortal / Ascended.
- Factions may be dynasties, academies, sects, clans, temples, valleys, towers, workshops, cults, alliances, or hidden lineages.
- Different factions use different paths, techniques, qi types, training cultures, and weaknesses.
- Every major event should have a public-facing chronicle and, when needed, a hidden truth.
- Relationships, memory, ambition, lineage, and old grudges should drive events.
- The Abyss is not just evil; it is a cosmic contradiction to Heaven's law.
- The Son of the Abyss is a calamity-level existence, not a renamed sect leader.

## Observer-Only Rule

Do not add direct player commands unless explicitly requested. The player's power is to see the world more truthfully than anyone inside it.
