# Critic: Evidence (Cairo), round 1, MEASUREMENT seat

Anchor used: Cairo, *How Charts Lie*. Every printed number must be traceable to its source, and every sentence about a limit, default or refusal must be true of the code. Here that applies to counts, colours, interpreter behaviour and the "what it does not do" lists.

Scope and method. I ran everything myself in Chromium (playwright) and node, against the built files in `/home/user/holyc`. I ran `scripts/build.py` once, which rewrote the 7 outputs with identical byte sizes, and I edited no site file. Scratch scripts are in the session scratchpad. HolyC behaviour I cite from memory rather than from TempleOS is marked "(memory)". I could not run TempleOS.

## 1. Measurements

| # | Measurement | Result | Verdict |
|---|---|---|---|
| 1 | `check_floor.py` on 6 pages at 360/390/430 | 12/12 hold on every page and width; PASS x6 | PASS |
| 2 | `measure.py --preset contrast`, 6 pages x 360/390/430/1280 | 0 fails, n=0 on all 24 runs | PASS |
| 3 | My own WCAG pass: every text node on 6 pages x dark/light, plus the playground after a good run and after an error | 268 element-level pairs, 24 distinct fg/bg pairs; lowest 5.72:1 (LTGRAY on BLUE card tag in dark; BLUE on LTGRAY links and card titles in light); 0 under 4.5 | PASS |
| 3a | Marks Firm/Reported/Uncertain | 13.29:1 dark (white on BLUE), 9.04:1 light (black on LTGRAY). Each mark also has a solid/dashed/dotted 5px rule plus a word, so it is not colour-only | PASS |
| 3b | Card tags, palette names, tagline, program block | tag 5.72 (dark) / 9.04 (light); palette name white on black 21:1; tagline YELLOW on BLUE 12.46:1; program code LTCYAN on BLACK 17.13:1, output white on black 21:1 | PASS |
| 3c | Buttons: normal / hover | normal 19.69:1 (black on YELLOW, dark) and 13.29:1 (white on BLUE, light); hover swaps to ink/bg = 21:1 | PASS |
| 3d | Keyboard focus rings | Tabbed all focusable elements: 244 stops (6 pages x 2 schemes), 0 without a ring. Every ring is 3px solid with 3px offset, accent colour against its parent background, at least 5.72:1 (BLUE on LTGRAY in light, the lowest) and at most 19.69:1 | PASS |
| 3e | Print emulation, light scheme | Fails, see F3. tagline YELLOW on white 1.07:1; "Output from..." caption and bnote LTGRAY on white 2.32:1 | FAIL |
| 3f | Print emulation, dark scheme | Fails, see F3. 7 to 16 text pairs per page at 1.00:1 (white text on the white print background) | FAIL |
| 4 | Palette rule: hex values in `styles.css` | 16 distinct hexes, 0 outside the VGA 16 | PASS |
| 4a | gradient / rgba / hsl / opacity / filter / color-mix / text-shadow / border-radius / url() in CSS | 0 of each. The single "gradient" hit is the header comment. `transparent` appears 4 times (alpha 0: borders, ghost button, tap highlight) | PASS (note) |
| 4b | Inline colours in HTML, favicon.svg, JS | all hex values are palette members (index/templeos swatches 16; logo 5; favicon 5; 0 rgb/hsl) | PASS |
| 4c | Rendered pixels, landing, 1280 dark / light and 390 dark / light | 16 of 16 palette colours present in each. 1,441 / 1,347 / 1,438 / 1,314 off-palette colours = 2.66% / 2.65% / 6.05% / 6.03% of pixels. All of them lie on the line between two palette colours (anti-alias); 0 non-antialias off-palette colours. `social.png`: 10 palette colours plus 644 anti-alias colours, 0 off-palette | PASS |
| 4d | UA-drawn colours (scrollbar, selection, caret) under `color-scheme: dark light` | not measurable from page pixels; no `::selection` or `caret-color` rule exists, so the UA picks those colours | NOTE (F12) |
| 5 | `node scripts/check-holyc.js` | ok: 29 programs (26 vs gcc), 16 refusals | PASS |
| 5a | `node scripts/run_examples.js --check` | ok: 20 examples match a fresh run | PASS |
| 5b | `python3 scripts/build.py` | "19 recorded examples; stylesheet uses 16 colour values, all from the 16" | PASS |
| 6 | My 144 extra HolyC programs vs gcc -O0 | 103 compared with C: 80 identical, 23 differ (8 value mismatches, 15 refusals); 40 recorded with no C equivalent (UB or HolyC-only); 1 uncaught exception | FAIL, see F1, F4 to F8 |
| 6a | Fuzz, pass 1 (seed 12345) | 1,329 inputs (300 random bytes, 100 random unicode, 300 token soups, 400 mutated lesson programs, truncations): 0 thrown, 0 slower than 2s, 0 malformed results | PASS |
| 6b | Fuzz, pass 2 (seed 987654, seeded with `#define`-heavy programs) | 7,185 inputs: 34 uncaught TypeError, all one root cause (F1), 0 slow, 0 malformed | FAIL |
| 6c | Hang / crash probes inside the 6000-char input limit | `while(TRUE){}` stops in 93 ms. A 1000-iteration loop declaring `I64 a[100000]` took 1,355 ms in node (481 ms in the browser); 20,000 iterations took 26,266 ms. 399-deep recursion with 5 such arrays took 4,621 ms and 1.93 GB RSS. The same with 8 arrays aborted node (V8 OOM) | FAIL, see F2 |
| 7 | Palette hex vs standard VGA | 16 of 16 match (index, name and value) | PASS |
| 7a | Counts on pages vs data | 19 examples: holyc.html says 19 and has 19 `.term` blocks, matching 19 lesson code blocks. 8 lessons: matches. 16 colours: matches. 9 sections: TOC has 9 and the page has 9 h2, which is 8 lessons plus "differences". 5 nav items: 5 on every page (the footer has 6, including Home). 18 facts: facts.json has 10 os + 7 person + 1 both, so templeos shows 11 and terry shows 8 (19 renderings of 18 facts, the "both" fact shown on both pages). Per-page tier counts equal the data (templeos 5/4/2, terry 3/4/1) | PASS |
| 7b | `outputs.json` vs fresh run | equal. The script runs 20 programs (hero plus 19 lesson blocks), and hero duplicates lesson 1, so 19 keys are stored | PASS (note F11) |
| 7c | Logo SVG | 67 rects. Expected from `GLYPHS`: H 17 + o 12 + l 10 + y 15 + C 13 = 67. Content bbox is exactly 0,0,29,9 = the viewBox. At 320/360/390/430/768/1280: 0 rects outside the svg box, svg inside its parent, aspect 3.222 at every width | PASS |
| 8 | JS disabled | Pages other than the playground: `innerText` identical with and without JS (index 2019, holyc 8018, templeos 3556, terry 2646, resources 1559 chars), no hidden elements. Playground: the form and chips are `hidden` and the noscript note is visible, so there is no dead form | PASS |
| 8a | 8 example chips, Ctrl+Enter, Cmd+Enter | all 8 chips load their source and print exactly the fresh-run output, and all 8 are in `outputs.json`. Ctrl+Enter and Meta+Enter run; plain Enter does not | PASS |
| 8b | maxlength | pasting 7,000 chars gives 6,000; pasting 6,007 gives 6,000 and drops the tail; a 5,999-char program ran | PASS |
| 8c | 20,000-char print | stops with "Output limit reached; the program printed too much." The output box holds 8,010 chars, not 8,000 | PASS (F9) |
| 8d | HTML escaping | 5 payloads (`<img onerror>`, `<script>`, `&amp;`, in the format spec, in an identifier, bare): 0 injected elements, 0 executed, all shown as text | PASS |
| 8e | Empty program | shows the "Type a program first" message | PASS |
| 9 | Horizontal overflow, 6 pages x 2 schemes x 5 widths (320/360/390/430/1280) | 60 checks, 0 with scrollWidth > innerWidth, 0 elements outside the viewport | PASS |
| 9a | Heading outline | one h1 per page; no skipped levels on any page. The landing is h1(sr), h2, h3 x4, h2. Playground and resources have a visually-hidden h2 | PASS |
| 9b | Landing h1 | `h1.sr` says "HolyC"; the aria-hidden pixel logo spells HolyC and I viewed it. Same word, so the visible logo conveys the h1 | PASS |
| 9c | Internal links / anchors | 111 internal hrefs across 6 pages, 0 broken | PASS |
| 9d | External requests | 2 requests (html + css) on 5 pages and 4 on holyc/playground, all `file://`; 0 network. 6 outbound links, all on resources.html, none loaded. The footer's "Nothing on this site loads from another domain" is true | PASS |
| 9e | Page weight (raw / gzip) | index 25.7 KB / 6.6 KB; templeos 23.5 / 6.8; terry 20.4 / 6.1; resources 18.7 / 5.7; playground 58.1 / 17.0; holyc 69.8 / 19.2. `holyc-core.js` is 35,179 / 9,479 | PASS |
| 9f | prefers-reduced-motion | no-preference: `.cur` animates (blink, 1.1s; visibility toggles). reduce: `animation-name: none`, 0 active animations, visibility constant over 1.8s | PASS |

## 2. Findings

### BLOCKER

**F1. `HolyC.run` throws an uncaught TypeError for a string `#define`, and the playground shows the previous result as if it were the new one.**
- Number: `#define NAME "Terry"` then `"%s\n", NAME;` raises `TypeError: Cannot read properties of undefined (reading 'line')`. 34 of 7,185 pass-2 fuzz inputs hit it, all via a string macro.
- Cause (`holyc-core.js`): the `case "define"` arm does `parse(s.text + ";")[0].e`. A string literal parses as a `print` statement, which has no `.e`. `run()` ends in `throw err` for anything that is not an `HCError` or `RangeError`.
- In the browser the result panel still showed the previous program's "Unexpected '<'" error while a pageerror fired. `playground.js` has no try/catch. It breaks the stated contract that the interpreter always returns `{ok:false,error}`.
- `playground.html` lists `#define` as supported, so a string macro (the likeliest use) crashes.
- Fix:
  - Make the define arm check `ps[0].k === "expr"`; otherwise throw `HCError("A #define here must be a number or an expression", s.line)`, or support string constants properly.
  - Replace the final `throw err` with `return {ok:false,out:out,error:"Internal error: "+err.message,line:0,steps:steps}`.
  - In `playground.js` wrap `HC.run` in try/catch and always overwrite `#result`.

### MAJOR

**F2. Allocation is not metered: 150 characters can freeze or crash the tab.**
- Numbers: 1,000 loop iterations each declaring `I64 a[100000]` took 1.36 s (node). 20,000 iterations took 26.3 s. 399-deep recursion with 5 array locals took 4.62 s and 1.93 GB RSS. With 8 array locals node aborted with a V8 out-of-memory.
- The 3,000,000-step budget and the 400-depth cap both pass, because allocation is not counted. The interpreter runs on the main thread (no Worker), so the 2 s hang bar is exceeded and the page cannot be closed cleanly.
- Fix:
  - Charge `steps += ceil(size/64)` per array declaration.
  - Keep a running total of live array elements across frames (for example 1,000,000) and refuse beyond it with a clear error.
  - Preferably run the interpreter in a Worker and terminate it after 2 s.

**F3. The print stylesheet leaves unreadable text, and in dark mode most of the page disappears.**
- Number: with print emulation and the light scheme, `.tagline` is YELLOW on white at 1.07:1, `.term .src` and `.bnote` are LTGRAY on white at 2.32:1, and the palette-index `b` is 1.07:1. With the dark scheme, 12/16/15/14/10/7 text pairs per page (index/holyc/templeos/terry/playground/resources) are 1.00:1, for example white `h2`, `.lede` and `.brand` on the white print background.
- Cause: the `@media print` block sets `body` and `.band` to white but only overrides colour on a few selectors. It leaves `--ink`, `--accent`, `--link` and `--ink2` at their dark values when the UA reports a dark scheme. Dark is the default in `:root`; light comes only from a media query.
- Fix: inside `@media print` redefine the tokens (`:root{--bg:#fff;--panel:#fff;--ink:#000;--ink2:#000;--accent:#000;--link:#000;--edge:#000;--ctl:#000}`) and add `.tagline,.src,.bnote,.pn b{color:#000!important}`. Printing then does not depend on the scheme.

**F4. The "what it does not do" list is incomplete: eight or more real limits are undisclosed, and the numeric caps are not stated at all.**
- Numbers: measured limits that `playground.html` never mentions:
  - program length 6,000 characters;
  - output 8,000 characters (`OUT_LIMIT`; 8,010 appear, F9);
  - 3,000,000 steps, about 10 per loop iteration, so a plain `for` accumulating `s += i` is refused at 300,000 iterations (it ran 250,000) and `Fib(27)` is refused;
  - recursion depth 400 (`F(399)` ok, `F(400)` refused);
  - arrays 0 to 100,000 elements;
  - `U8 s[6]="Hello"` then `"%s", s` is refused ("%s needs a string"), although the page says "U8 * strings";
  - array members in classes ("Array members are not supported here");
  - 2D arrays (error "Expected ';' but found '['", which does not say "unsupported");
  - function-like `#define SQ(x)` ("Preprocessor lines other than #define are not supported");
  - `'\x41'` ("Unsupported escape in a character constant"), `'AB'`, adjacent string literals, the comma operator, `sizeof`, `` ` `` (power), `^^`;
  - `%e %g %o %i %b %*d`, and builtins `Exp Ln Tan Floor Pow Rand StrCmp StrCpy`.
- The refusals are clear, but the page promises a list and the list is missing these. A 1,000,000-iteration sum, the most common first exercise, fails with "Is there an infinite loop?", which misattributes the cause.
- Fix:
  - Add a "Limits" list to `playground.html` with the four numeric caps.
  - Move the array, 2D, `%s`-array and function-like-`#define` cases into "What it does not".
  - For a step-budget failure say "step limit (3,000,000) reached", not "infinite loop".
  - For an unknown builtin say "not supported in this subset", not "define it before you use it".

**F5. The comparison with gcc found 8 real value disagreements, and the page's "checked against real C" claim covers only the subset that `check-holyc.js` happens to test.**
- Numbers (interpreter vs gcc):
  1. `U64 a=0; a--; "%d"` prints 18446744073709551615 (C `%lld` of the same bits prints -1). The same thing happens for `0xFFFFFFFFFFFFFFFF` and `9223372036854775808` printed with `%d`. Which is right on TempleOS I do not know. The page documents neither the `%d`-of-unsigned rule nor the choice.
  2. `"[% d]", 5` prints `[5]`; gcc prints `[ 5]`. The space flag is dropped.
  3. `#define A 2 + 3` then `A * 2` gives 10; textual substitution gives 8. The interpreter evaluates the macro as a parenthesised value. (HolyC macro semantics from memory: textual.)
  4. `"%.2f", 1e21` prints `1e+21`; gcc prints `1000000000000000000000.00`. This is JS `toFixed` switching to exponent at 1e21 and above.
  5. `F64 z=-0.0; "%.1f"` prints `0.0`; gcc prints `-0.0`.
  6. `I64 a=-1; U64 b=1; a < b` gives 1; C gives 0. Mixed signed/unsigned comparison is signed here (HolyC behaviour not checked).
  7. `1.0 / 0.0` is refused as "Divide by zero"; C and x86 give inf.
  8. `99999999999999999999999999` silently wraps to -2537764290115403777, and `I64 x=1; I64 x=2;` is accepted silently.
- Also, `5 > 3 > 1` evaluates with C semantics (0). I recall HolyC supporting chained comparisons such as `1 < i < 10` and `^^`, so the site's "uses C precedence" sentence should say that this differs too (memory).
- Fix:
  - State the `%d`-of-unsigned rule and the signed/unsigned comparison rule in the "differences" data, or make `%d` print signed (to match C and likely HolyC).
  - Add the 8 cases above to `check-holyc.js` (cases or refusals) so the "checked against gcc" sentence is measured, not assumed.
  - Implement `%.Nf` for |x| >= 1e21 with BigInt or `toLocaleString`.
  - Honour the space flag.

**F6. Many "Firm" marks have no source anyone can follow, and the legend defines "Firm" by the author's memory.**
- Number: 0 of 18 facts carry a URL, a citation or a page reference (`grep -c http data/facts.json` = 0). 7 facts are marked Firm; 8 Reported; 3 Uncertain. The legend says Firm means "Widely documented and consistent everywhere the author remembers seeing it", and the site says it was "written from general knowledge and not checked line by line".
- Birth and death dates and age (15 Dec 1969; 11 Aug 2018, aged 48; I checked the arithmetic and it is consistent) are the kind of number a reader will quote. They fall under my rule that every figure must be reproducible.
- Fix: add a `source` field per fact, even just "TempleOS Wikipedia article" or "templeos.org", rendered as a link. Rename "Firm" to "Consistent in the sources I remember", or demote it until the source is attached. The resources page already links Wikipedia and templeos.org, so this is cheap.

### MINOR

**F7. Silent acceptance where C or the compiler would refuse.** The two cases are the 26-digit literal wrapping to -2537764290115403777 and the redeclaration `I64 x=1; I64 x=2;` printing 2. For a teaching site, an honest "number too large for I64" and "x is already declared" error teaches the right thing. Fix: add both checks in the lexer and the declaration scope.

**F8. Misleading error text.**
- A 3,000-term sum `1+1+...` (about 6,000 characters, the maximum input) reports "Calls nested too deeply."; 2,001 terms run, so the JS stack is hit somewhere in between.
- A 2D array reports "Expected ';' but found '['".
- `Exp`, `Pow` and similar report "not defined yet; define it before you use it".
- Fix: map these to "expression too long/deep" and "not supported by this subset".

**F9. The output cap overshoots.** The cap is 8,000 but the box showed 8,010 characters, because `emit` appends first and then checks. Fix: `out = (out + s).slice(0, OUT_LIMIT)` before throwing, so the visible text is exactly the stated limit.

**F10. Latent contrast trap in the light scheme.** `--ink2` (#555555) on `--panel` (#AAAAAA) is 3.21:1 (fails 4.5). It is not live today: 0 of 268 measured pairs use it, because `.card .tag` is overridden to black. Any future `.small`, `.muted` or `.label` inside `.band` or `.card` fails. Fix: add a light-scheme rule `.band .small,.band .muted,.band .label,.card .small{color:var(--ink)}`, or darken `--ink2` to BLACK on panels.

**F11. The example count has two spellings.** The page says 19 and `outputs.json` holds 19 keys, but `run_examples.js --check` prints "20 examples" (hero plus 19 lesson blocks, one duplicate). Both are true, but a reader reconciling the two will find an off-by-one. Fix: print "20 runs, 19 unique" in the script, or drop the duplicate hero run.

**F12. Smallest type is 12px and some UA colours are unaudited.**
- The marks and card tags are 12px 800-weight uppercase; the palette names are 12.5px; `.label` is 13px.
- They pass contrast, but 12px is the floor, and the playground "meta" and `.src` lines are 13px at 9.04:1.
- No `::selection` or `caret-color` is set, so selection and scrollbar colours leave the 16 under `color-scheme: dark light`. The "every colour is one of the 16" sentence is true of authored colours only.
- Fix: raise the smallest type to 13px, and add `::selection{background:var(--accent);color:var(--on-accent)}` and `caret-color:var(--WHITE)` on the textarea.

**F13. Playground wording.** "Ran in this page's interpreter, 1 steps." is a grammar slip (pluralisation), and "steps" is a number no reader can reproduce, since it is an internal evaluator counter with no definition on the page. Fix: say "1 step", and either define it or drop it from the user-facing line.

## 3. Verdict

OBJECT. The static site is clean: palette, counts, contrast, focus, overflow, links, logo, no-JS and escaping all pass. F1 (uncaught exception, stale result), F2 (unmetered allocation) and F3 (print) are the three to fix before round 2. F4 and F5 are claim-versus-code gaps: the limits list and "checked against C" overstate coverage by the numbers above. F6 is the site's own honesty gap, since a Firm mark with no source is a figure no reader can reproduce.

Not covered, for the record: I did not measure real TempleOS; HolyC semantics marked "(memory)" need a primary source before being asserted. Screenshots in `shots/` were not re-taken; I sampled my own renders (identical to `shots/index-*` by colour histogram).
