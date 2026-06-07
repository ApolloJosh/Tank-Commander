# Changelog

## v5.1

A difficulty + living-league patch.

### Harder to dominate
- **Tighter win curve.** A 100-win season now requires a genuinely elite roster — wins convert more conservatively from team strength, so 100+ is an achievement, not a default. The declining starting club still opens around 70 wins.
- **October is a coin flip.** Playoff series are far more upset-prone: even the best, best-coached club is no lock to win a round, so World Series titles are earned, not assumed. (Coaching still helps, just less decisively.)
- **Slightly stricter grading.** The letter-grade cutoffs nudged up a couple points, so top marks take a bit more.

### Living AI league
- **Rival farm systems are alive.** A fresh draft/international class enters the league every offseason, so new high-ceiling prospects keep appearing on other clubs over the years — there's always young talent to scout and trade for, even deep into a rebuild.
- **Rivals improve over time.** The league bar rises each season as every club develops, so staying on top gets harder the longer you contend.

### Backend
- Anonymous per-browser device ID so the stats page can count unique players (no personal data; only applies to submissions made after this update).

## v5

A trade, roster, and economy overhaul.

### Trades
- **Rebuilt trade builder** — a segmented Your team / Partner / Whole league browser. "Whole league" searches every club's available players (plus their picks) with search, position filters, and sort by value / overall / ceiling / age / control. Pick a player and your trade partner is set automatically.
- **Player cards** — each row shows a gradient overall badge (with a prospect's ↑ceiling), durability, attribute strengths/weaknesses as emojis, and position flexibility, with a key explaining the icons.
- **Suggested-trade panel** — one need-based suggestion at a time with unlimited respins; it auto-respins after you accept. Built around both clubs' needs and surplus, mostly value-fair with the occasional surplus-driven imbalance.

### Roster & positions
- **Position flexibility** — high-OVR players can flex to nearby spots (e.g., an 85+ SS covers 2B/3B; a 99 SS adds CF; SP→RP at 90, etc.), shown with a ↔ tag and used when filling the lineup and covering injuries.
- Ceiling now shows next to overall on the roster; the diamond (96–98) and iridescent (99) colors apply to overalls and ceilings everywhere.
- Note added that calling a prospect up too early slows their development.
- Needs/surplus panel moved below the current roster in the trade hub.

### Economy
- **Salaries scale with ability and MLB service** — roughly $3M at year 1, $8M by year 3, up to a $25M cap at year 6 for a 99 OVR (lower overalls scale down). Salaries re-price each offseason, so a homegrown core gets expensive to keep.
- 2nd- and 3rd-round draft picks are worth a bit less in trades.

### Flavor
- Random war-movie-pun team names (with a reroll), and all fictional players are now named after war/military movie characters.

## v4

A big gameplay-depth update.

### New systems
- **Player attributes & Season Report Card.** Every player now has hidden granular skills — hitters: Contact, Power, Speed, Eye, Defense; pitchers: Velocity, Control, Spin, Whiff — built around their overall with positional flavor. A skill only surfaces as a tag when it's a true strength (85+) or weakness (50-). After each season, a Report Card ranks your club 1-of-16 across all nine categories.
- **Front Office Resources.** Each offseason you allocate between **Scouting** (more accurate draft ceilings / prospects hit their ceiling more often), **Development** (prospects grow faster and can be pushed past their ceiling — minors only; calling up early stunts them), and **Coaching** (raises your roster floor, boosts Defense & Control, and improves playoff-series odds) via a clickable triangle.
- **Injuries & Durability.** Every player has a durability rating; injuries roll from durability + age, are flagged short- or long-term with game counts, and the results screen estimates how many wins they cost. Fragile (🩹) and Iron (💪) tags surface on rosters and in trades, so depth matters.

### Trade & draft balance
- **Draft picks now track standings.** Each team has a single, unique draft slot tied to its projected record (worst = #1); no duplicate picks, and a team can't dangle a pick it already traded.
- **Stable trade partners.** Each club has a fixed trade block per offseason — no more roster reshuffling when you switch between teams.
- **Trade value rework.** Low-ceiling players are now cheap; solid, still-young regulars (75–85 OVR) are valued properly; stars and elite young prospects scale up.
- **Top-heavy pick scale.** #1 ≈ 90 value, #2 ≈ 72, #3 ≈ 60 — you can't dump scrubs for a premium pick anymore.
- **Draft ceilings retuned.** Most ceilings land 80–95; a **99 ceiling** is a top-pick prize (~51% chance to appear with the #1 pick, ~26% at #2, ~17% at #3, tapering after). Later rounds stay useful rather than worthless.

### Quality of life & polish
- Trade hub: sort dropdowns for both sides, a live needs/surplus banner that reads your farm, a current-roster dropdown (with bench + minors), and an expanded free-agent market with more elite options.
- **Diamond tiers:** ceilings and overalls of **96–98 shimmer blue-diamond**, and **99 is iridescent**.
- Roster and needs/surplus now appear on the draft screen too.

## v3
- Leaderboard (Top 10 Today / All-Time), local by default with an optional shared backend.
- Free agency, harsher 100-point grade with itemized reasons, military theme, and earlier balance work.
