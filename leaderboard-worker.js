/*
 * Tank Commander — shared leaderboard backend (Cloudflare Worker)
 * --------------------------------------------------------------
 * OPTIONAL. The game works without this (scores save to each player's
 * own browser). Deploy this to get a single leaderboard shared by
 * everyone who plays your site.
 *
 * SETUP (free, ~5 minutes, no credit card):
 *   1. Create a free account at https://dash.cloudflare.com
 *   2. Workers & Pages -> Create -> Create Worker. Name it e.g. "tank-leaderboard".
 *   3. Click "Edit code", delete the sample, paste THIS file, and Deploy.
 *   4. Create a KV namespace: Storage & Databases -> KV -> Create namespace,
 *      name it "SCORES".
 *   5. Bind it to the worker: open your worker -> Settings -> Variables and
 *      Bindings -> add a KV Namespace binding. Variable name MUST be  SCORES
 *      and point it at the namespace you just made. Save & redeploy.
 *   6. Copy your worker URL (looks like
 *      https://tank-leaderboard.YOURNAME.workers.dev ).
 *   7. In index.html, set:   const LEADERBOARD_API = "https://tank-leaderboard.YOURNAME.workers.dev";
 *      Commit & push. Done — the in-game leaderboard is now global.
 */
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const KEY = "scores";

    if (request.method === "GET") {
      const data = (await env.SCORES.get(KEY)) || "[]";
      return new Response(data, { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (request.method === "POST") {
      let e;
      try { e = await request.json(); } catch (_) {
        return new Response("bad request", { status: 400, headers: cors });
      }
      const entry = {
        name:  String(e.name  || "Anon").slice(0, 12),
        team:  String(e.team  || "").slice(0, 24),
        score: Math.max(0, Math.min(100, parseInt(e.score) || 0)),
        grade: String(e.grade || "").slice(0, 3),
        peak:  Math.max(0, Math.min(200, parseInt(e.peak)  || 0)),
        champs:Math.max(0, Math.min(6,   parseInt(e.champs)|| 0)),
        window:Math.max(0, Math.min(10,  parseInt(e.window)|| 0)),
        date:  String(e.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
        ts:    Date.now(),
      };
      const arr = JSON.parse((await env.SCORES.get(KEY)) || "[]");
      arr.push(entry);
      // keep the 1000 most recent submissions
      const trimmed = arr.slice(-1000);
      await env.SCORES.put(KEY, JSON.stringify(trimmed));
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response("method not allowed", { status: 405, headers: cors });
  },
};
