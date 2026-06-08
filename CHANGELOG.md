# Changelog

## v7

The big one: a whole second way to play, plus deeper player and roster systems.

### 🪑 Survivor Mode (BETA)
- A new endless mode alongside the 6-Year Sprint. You inherit the same declining club, but instead of a six-year grade you try to **stay in the owner's favor as long as you can** — riding the cycle of contention, aging cores, and rebuilds until you're fired (or retire as a legend).
- **Owner Happiness bar** — a colored meter (red → yellow → green → diamond → iridescent) with the owner's mood and messages. Hit zero and you're done.
- **Preseason negotiation** — each year the owner sets a win target (anchored to your roster, payroll, and reputation so you can't sandbag), and you pick **Go for it / Compete / Retool**. Earned favor lets you buy a rebuild year.
- **The first two seasons are rebuild years** — you were hired to tear it down, so losing is expected and forgiven.
- **A full favor ledger** — titles, deep playoff runs, awards, homegrown breakouts and loyalty all bank favor; missed expectations, bloated payrolls, replacement-level rosters, and playoff droughts bleed it. The bar bleeds faster the higher you sit, so the top is hard to hold.
- **Cumulative scoring + its own leaderboard** (separate from the 6-Year board), plus a **5-round draft**, a living league with real contenders and tankers, and decades-long stability.

### New player systems (both modes)
- **🐶 DAWG** — a clutch / championship-mindset attribute on hitters and pitchers, independent of overall. The more DAWG across your roster, the better your October odds.
- **⭐ Fan Favorites** — homegrown, tenured stars become beloved; extending them pleases the owner, dealing them stings.
- **Offseason developmental storylines** — prospects can bust ("spent the offseason at the strip club," "showed up out of shape") or break out ("spent all winter in the gym and came in locked in"). High-ceiling prospects are now genuinely volatile — a 99 ceiling is no longer a lock.
- **📉 Decline** flags for aging players past their peak, and a clearer **service / contract-years-left** readout on cards.

### Roster & trade quality-of-life
- **Demote to the minors** to develop a young player faster.
- **Extension and free-agent term dropdowns** (1/3/5/10 years).
- Every rival club is now fully stocked, so trades have real variety and every position has plenty of options.
- ~45 more real players added across all tiers (Ketel Marte, Chris Sale, Aaron Nola, Bo Bichette, Brendan Donovan, and many more), and a wider inherited starting core so you don't see the same faces every game.

## v6

A big in-season-depth and grading update.

### Roster
- **Drag-and-drop lineups.** Drag any player onto an eligible slot to set your lineup, rotation, and bullpen yourself; a filled slot won't take a drop, so drag its player to the bench first to free it. Leave it alone and the front office auto-fills the best arrangement. Flex-eligible players can be slotted at their secondary positions.

### Two in-season decision points
- **Service Time Manipulation (game 20).** An early call-up window — promote a prospect now and it won't count as a contract year, so you keep them controllable longer.
- **Trade Deadline (game 110).** A full trade hub stop with shifted valuations: current production is king, ceilings cool off, and contract control matters more (rentals cheap, cost-controlled stars pricey). Clubs are tagged **buyers** (contending, overpay for win-now help) or **sellers** (out of it, deal rentals for youth), shown on a live standings dropdown, and the accept/reject bar swings to match. An even-value swap is always accepted, and a desperate buyer will eat an overpay to land your big-league talent. Set your roster again afterward to slot in what you acquired. The Front Office resources triangle is available here too.

### Awards
- **Rookie of the Year, Cy Young, and MVP.** Win one and you get bonus grade points plus a compensatory draft pick (between rounds 1 and 2 next year). The comp pick requires a homegrown winner for Cy Young and MVP; ROY always grants it.

### Grading overhaul (harder)
- A full **+/− letter scale** (A+ down to F) and a tougher curve — a perfect 100 now requires a near-flawless run.
- Rebalanced points: World Series (15 for the first, +10 each after), peak wins (up to 30), a 100-win-timing bonus, awards, tanking, homegrown core, and future window. Steeper penalties for luxury tax, bloated payroll, free-agent reliance, and — new — fielding replacement-level/sub-70 OVR starters during your contention years.
- The full scoring rubric is now visible on the home screen, in the Trade Hub, and on the end-of-run review.

### Development & leaderboard
- Development resources now help young big-leaguers too, at a smaller scale than the minors.
- "River City Rovers" (an old build's default name) is banned from the leaderboard — dropped on submit and hidden on read.

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
