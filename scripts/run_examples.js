#!/usr/bin/env node
// Run every example on the site through the subset interpreter and record its output in data/outputs.json.
//   node scripts/run_examples.js          write data/outputs.json
//   node scripts/run_examples.js --check  exit 1 if a recorded output differs from a fresh run
// An example that fails is an error: nothing is published unless it ran.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const HC = require(path.join(__dirname, "..", "holyc-core.js"));
const ROOT = path.join(__dirname, "..");
const key = (code) => crypto.createHash("sha1").update(code).digest("hex").slice(0, 16);
const lessons = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "lessons.json"), "utf8")).lessons;
const hero = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "hero.json"), "utf8"));
const codes = [hero.code];
lessons.forEach(l => l.blocks.forEach(b => codes.push(b.code)));
const out = { interpreter: "holyc-core.js (a subset of HolyC; not TempleOS)", examples: {} };
let bad = 0;
codes.forEach(code => { const r = HC.run(code); if (!r.ok) { bad++; console.log("EXAMPLE FAILED:\n" + code + "\n  => " + r.error); } out.examples[key(code)] = { out: r.out }; });
if (bad) process.exit(1);
const file = path.join(ROOT, "data", "outputs.json");
if (process.argv.includes("--check")) {
  const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  if (JSON.stringify(old) !== JSON.stringify(out)) { console.log("stale: recorded outputs differ from a fresh run"); process.exit(1); }
  console.log(`ok: ${codes.length} examples match a fresh run`);
} else { fs.writeFileSync(file, JSON.stringify(out, null, 1) + "\n"); console.log(`recorded ${codes.length} example outputs`); }
