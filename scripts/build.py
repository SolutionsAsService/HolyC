#!/usr/bin/env python3
"""Generate the HolyC site from data/*.json and the recorded example outputs. Standard library only.

    node scripts/run_examples.js    (first) run every example through the interpreter, record data/outputs.json
    python3 scripts/build.py        write every page, and check that styles.css uses only the 16 palette colours
    python3 scripts/build.py --check

The build refuses to run if any example has no recorded output, and refuses if the stylesheet uses a colour that is not
one of the 16 VGA colours. Nothing printed on a page is typed by hand: outputs come from the interpreter, counts from data.
"""
import hashlib
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
e = lambda s: html.escape(str(s), quote=True)
L = lambda f: json.loads((ROOT / "data" / f).read_text(encoding="utf-8"))
LESSONS, TIERS, DIFFS, FACTS, PAL, HERO, OUTS = L("lessons.json")["lessons"], {t["id"]: t for t in L("tiers.json")["tiers"]}, L("differences.json")["differences"], L("facts.json")["facts"], L("palette.json"), L("hero.json"), L("outputs.json")
_site = ROOT / "data" / "site.json"
SITE_URL = (json.loads(_site.read_text(encoding="utf-8")).get("url", "").rstrip("/") if _site.exists() else "")
REPO = "https://github.com/SolutionsAsService/HolyC"
NAV = [("holyc.html", "HolyC"), ("templeos.html", "TempleOS"), ("terry.html", "Terry"), ("playground.html", "Try it"), ("resources.html", "Resources")]
FOOTNAV = [("index.html", "Home")] + NAV


def key(code):
    return hashlib.sha1(code.encode("utf-8")).hexdigest()[:16]


def output(code):
    r = OUTS["examples"].get(key(code))
    if r is None:
        raise SystemExit(f"no recorded output for this example (run node scripts/run_examples.js first):\n{code}")
    return r["out"]


for l in LESSONS:
    for b in l["blocks"]:
        output(b["code"])
output(HERO["code"])
N_EX = len(OUTS["examples"])
HEX = {c["name"]: c["hex"] for c in PAL["colors"]}


# ---- the pixel logo: HolyC in 5 x 9 bitmaps, one palette colour per letter
GLYPHS = {
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#", ".....", "....."],
    "o": [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###.", ".....", "....."],
    "l": [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###.", ".....", "....."],
    "y": [".....", ".....", "#...#", "#...#", "#...#", ".####", "....#", "....#", ".###."],
    "C": [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###.", ".....", "....."],
}
LOGO = [("H", "YELLOW"), ("o", "LTCYAN"), ("l", "LTGREEN"), ("y", "LTPURPLE"), ("C", "LTRED")]


def logo_svg(cls="logo"):
    rects = []
    for i, (ch, color) in enumerate(LOGO):
        for y, row in enumerate(GLYPHS[ch]):
            for x, c in enumerate(row):
                if c == "#":
                    rects.append(f'<rect x="{i * 6 + x}" y="{y}" width="1" height="1" fill="{HEX[color]}"/>')
    return f'<svg class="{cls}" viewBox="0 0 29 9" aria-hidden="true" focusable="false" shape-rendering="crispEdges">{"".join(rects)}</svg>'


def head(title, desc, page, og=False):
    nav = "".join(f'<a href="{h}"' + (' aria-current="page"' if h == page else "") + f">{t}</a>" for h, t in NAV)
    img = f'<meta property="og:image" content="{(SITE_URL + "/" if SITE_URL else "")}social.png"><meta name="twitter:card" content="summary_large_image">' if og else ""
    canon = f'<meta property="og:url" content="{SITE_URL}/{page}"><link rel="canonical" href="{SITE_URL}/{page}">' if SITE_URL else ""
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark light">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:type" content="website">{img}{canon}
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="styles.css">
</head>
<body class="{'home' if page == 'index.html' else ''}">
<a class="skip" href="#main">Skip to the content</a>
<header class="mast">
  <a class="brand" href="index.html"><span class="sq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>HolyC</a>
  <nav aria-label="Pages">{nav}</nav>
</header>
<main id="main">
'''


def foot(*scripts):
    s = "".join(f'<script src="{x}"></script>' for x in scripts)
    return f'''</main>
<footer class="foot">
  <nav class="footnav" aria-label="Pages">{"".join(f'<a href="{h}">{t}</a>' for h, t in FOOTNAV)}</nav>
  <p><strong>Written from general knowledge, and not yet checked line by line</strong> against the TempleOS documentation or Terry Davis's own writing. Each fact carries a mark for how sure we are. Outputs come from a small interpreter written for this site, which runs a subset of HolyC; they have not been run on TempleOS.</p>
  <p class="small">An independent fan and study site, not affiliated with Terry Davis's estate or any HolyC project. Code and text are MIT-licensed. Nothing on this site loads from another domain.</p>
</footer>
{s}
</body>
</html>
'''


def mark(tier):
    return f'<span class="mk mk-{tier}"><i aria-hidden="true"></i>{e(TIERS[tier]["name"])}</span>'


def term(code, note=None):
    shown = "".join(f'<span class="ln">{e(l)}</span>' for l in code.split("\n"))
    out = output(code)
    body = e(out.rstrip("\n")) if out else '<span class="muted">(no output)</span>'
    nt = f'<p class="bnote">{e(note)}</p>' if note else ""
    return (f'<figure class="term"><pre class="cmd"><code>{shown}</code></pre>'
            f'<pre class="out" aria-label="Output"><code>{body}</code></pre><p class="src">Output from this site\'s interpreter</p>{nt}</figure>')


def palette_strip():
    sw = "".join(f'<li><span class="sw" style="background:{c["hex"]}" aria-hidden="true"></span><span class="pn"><b>{c["index"]}</b> {e(c["name"])}</span></li>' for c in PAL["colors"])
    return f'<ol class="palette" aria-label="The 16 colours">{sw}</ol>'


def index():
    cards = [("holyc.html", "The language", f"{len(LESSONS)} lessons, all run", "HolyC from first principles: types, functions, loops and classes, with every output produced by a real run."),
             ("templeos.html", "The operating system", "what it was and why it was odd", "A 64-bit system with a 640 by 480, 16-colour screen, no separation between kernel and programs, and a compiler in the box."),
             ("terry.html", "The author", "a short, careful life", "Terry A. Davis, the programmer who wrote it, and the serious illness that was part of the story."),
             ("playground.html", "Try it", "run HolyC in your browser", "Type a program and run it, using a small interpreter for a subset of the language.")]
    ch = "".join(f'<li class="card"><p class="tag">{e(t)}</p><h3><a href="{h}">{e(n)}</a></h3><p>{e(d)}</p></li>' for h, n, t, d in cards)
    tl = "".join(f'<li>{mark(t["id"])}<span>{e(t["blurb"])}</span></li>' for t in TIERS.values())
    return head("HolyC and TempleOS: the language and the operating system of Terry A. Davis", "A guide to HolyC, the programming language of TempleOS, with every example run, and a careful look at the operating system and its author, Terry A. Davis. Every fact is marked for how sure we are.", "index.html", True) + f'''
<section class="hero hero-screen" aria-labelledby="h1">
  <h1 id="h1" class="sr">HolyC</h1>
  <div class="screen">
    <div class="scrbar" aria-hidden="true"><span>HolyC</span><span>640x480, 16 colours</span></div>
    <div class="scrbody">
      {logo_svg()}
      <p class="tagline">The programming language of TempleOS, explained from scratch.</p>
      <pre class="prog" aria-label="A HolyC program and what it prints"><code><span class="c-code">{e(HERO["code"])}</span>
<span class="c-out">{e(output(HERO["code"]).rstrip(chr(10)))}</span><span class="cur" aria-hidden="true"></span></code></pre>
    </div>
  </div>
  <p class="cta"><a class="btn" href="holyc.html">Learn HolyC</a><a class="btn ghost" href="playground.html">Try it in your browser</a></p>
  <div class="palwrap"><p class="palcap"><strong>The whole display is these 16 colours.</strong> So is every colour on this site.</p>{palette_strip()}</div>
</section>

<section aria-labelledby="h-where">
  <h2 id="h-where" class="sech">Where to start</h2>
  <ul class="cards">{ch}</ul>
</section>

<section class="band" aria-labelledby="h-sure">
  <h2 id="h-sure" class="sech">How sure is this site?</h2>
  <p class="lede2">It was written from general knowledge and not checked line by line against the TempleOS documentation, so every fact carries a mark. Treat the weaker marks as leads, not citations.</p>
  <ul class="legend">{tl}</ul>
</section>
''' + foot()


def holyc_page():
    secs = []
    for l in LESSONS:
        body = "".join(f"<p>{e(t)}</p>" for t in l["body"])
        blocks = "".join(term(b["code"], b.get("note")) for b in l["blocks"])
        secs.append(f'<section class="lesson" id="{l["id"]}" aria-labelledby="h-{l["id"]}"><h2 id="h-{l["id"]}" class="sech">{e(l["title"])}</h2><div class="prose">{body}</div>{blocks}</section>')
    toc = "".join(f'<li><a href="#{l["id"]}">{e(l["title"])}</a></li>' for l in LESSONS) + '<li><a href="#differences">How it differs from C</a></li>'
    rows = "".join(f'<li class="diff"><h3>{e(d["title"])}</h3><p>{e(d["text"])}</p>{mark(d["tier"])}</li>' for d in DIFFS)
    return head("HolyC: the language, with every example run", f"HolyC explained from scratch in {len(LESSONS)} short lessons, with {sum(len(l['blocks']) for l in LESSONS)} examples that were actually run, and how it differs from C.", "holyc.html") + f'''
<section class="page-head"><p class="kicker">The language</p><h1>HolyC from scratch</h1>
<p class="lede">The programming language of TempleOS: C-like, with a built-in compiler, no main function, and a shell that is the language itself.</p>
<p class="small">{sum(len(l["blocks"]) for l in LESSONS)} examples, every one run. They were run by a small interpreter written for this site that covers a subset of HolyC, not by TempleOS. You can <a href="playground.html">change and run them yourself</a>.</p>
<details class="toc"><summary>On this page ({len(LESSONS) + 1} sections)</summary><ul>{toc}</ul></details></section>
{"".join(secs)}
<section id="differences" class="lesson" aria-labelledby="h-diff"><h2 id="h-diff" class="sech">How it differs from C</h2>
<p class="lede2">HolyC looks like C. These are the differences that matter first, each with a mark for how sure we are.</p>
<ul class="diffs">{rows}</ul></section>
<nav class="stepnav" aria-label="Previous and next"><span></span><a class="next" href="templeos.html"><span>Next</span>TempleOS, the operating system</a></nav>
''' + foot()


def facts_list(idx):
    return "".join(f'<li class="fact">{mark(FACTS[i]["tier"])}<p>{e(FACTS[i]["text"])}</p>' + (f'<p class="fnote">{e(FACTS[i]["note"])}</p>' if FACTS[i].get("note") else "") + "</li>" for i in idx)


OS_FACTS = [i for i, f in enumerate(FACTS) if f.get("about") in ("os", "both")]
PERSON_FACTS = [i for i, f in enumerate(FACTS) if f.get("about") in ("person", "both")]


def templeos_page():
    return head("TempleOS: the operating system", "What TempleOS was: a 64-bit operating system for PCs with a fixed 640 by 480, 16-colour display, one address space, a compiler built in, and one author.", "templeos.html") + f'''
<section class="page-head"><p class="kicker">The operating system</p><h1>TempleOS</h1>
<p class="lede">A complete operating system, written almost entirely by one man, built around a language and a screen so small they fit in a head.</p></section>
<section aria-labelledby="h-what"><h2 id="h-what" class="sech">What it was</h2>
<div class="prose"><p>TempleOS is a 64-bit operating system for PCs. Everything in it, the kernel, the shell, the editor, the compiler, the games and the documents, was written by Terry A. Davis, and almost all of it in HolyC. It is small enough to read, and it is deliberately unlike other systems: one display mode, one language, one address space and, by most accounts, no networking.</p>
<p>Davis described it as a temple for God, and said he built it because God told him to. That belief shaped the design, and it is part of why the project is remembered. This site records his claim as his claim, and concentrates on the software.</p></div></section>
<section aria-labelledby="h-design"><h2 id="h-design" class="sech">The design, in facts</h2>
<ul class="facts">{facts_list(OS_FACTS)}</ul></section>
<section class="band" aria-labelledby="h-screen"><h2 id="h-screen" class="sech">The screen</h2>
<p class="lede2">The display is 640 by 480 pixels with 16 colours, and that is all. {e(PAL["note"])}</p>
{palette_strip()}</section>
<section aria-labelledby="h-run"><h2 id="h-run" class="sech">Running it today</h2>
<div class="prose"><p>TempleOS is usually run inside a virtual machine, a program that pretends to be a PC, such as QEMU, VirtualBox or VMware. Because it has no network stack and runs everything at the highest privilege, it is best treated as a curiosity to explore in a sandbox, not as a system to use. {mark("reported")}</p>
<p>Several community projects continue the language or the system. The <a href="resources.html">resources page</a> lists a few.</p></div></section>
<nav class="stepnav" aria-label="Previous and next"><a class="prev" href="holyc.html"><span>Previous</span>HolyC from scratch</a><a class="next" href="terry.html"><span>Next</span>Terry A. Davis</a></nav>
''' + foot()


def terry_page():
    return head("Terry A. Davis, the author of TempleOS", "A short, careful account of Terry A. Davis, the programmer who wrote TempleOS and HolyC, and the serious illness that was part of the story.", "terry.html") + f'''
<section class="page-head"><p class="kicker">The author</p><h1>Terry A. Davis</h1>
<p class="lede">A gifted programmer, a man living with serious mental illness, and the person who wrote TempleOS and HolyC.</p></section>
<section aria-labelledby="h-care"><h2 id="h-care" class="sech">A note on how this page is written</h2>
<div class="prose"><p>Davis's life was difficult and he died young. In his later years he also said many offensive and abusive things, which are well documented. This site is about the software, which is the reason anyone remembers him, so this page is short and sticks to the record. It does not repeat his offensive remarks, and it does not treat his illness as entertainment.</p></div></section>
<section aria-labelledby="h-facts"><h2 id="h-facts" class="sech">What is known</h2>
<ul class="facts">{facts_list(PERSON_FACTS)}</ul>
<p class="small">Nothing here has been checked against primary sources. For a fuller and sourced account, see the Wikipedia article listed on the <a href="resources.html">resources page</a>.</p></section>
<section class="band" aria-labelledby="h-legacy"><h2 id="h-legacy" class="sech">The work</h2>
<div class="prose"><p>Whatever one makes of the circumstances, TempleOS is a real feat: a whole operating system, a compiler, an editor and a set of programs, designed around one person's ideas, by that one person. HolyC lives on in community compilers, and the system is still studied as a case of radical simplicity.</p></div>
<p><a class="more" href="holyc.html">Learn the language he wrote</a></p></section>
<nav class="stepnav" aria-label="Previous and next"><a class="prev" href="templeos.html"><span>Previous</span>TempleOS</a><a class="next" href="playground.html"><span>Next</span>Try HolyC in your browser</a></nav>
''' + foot()


def playground_page():
    first = LESSONS[0]["blocks"][0]["code"]
    starters = [("Hello", LESSONS[0]["blocks"][0]["code"]), ("Types", LESSONS[1]["blocks"][0]["code"]), ("Wrap-around", LESSONS[2]["blocks"][1]["code"]), ("Functions", LESSONS[3]["blocks"][1]["code"]),
                ("Loops", LESSONS[4]["blocks"][0]["code"]), ("Arrays", LESSONS[5]["blocks"][1]["code"]), ("Classes", LESSONS[6]["blocks"][0]["code"]), ("Primes", LESSONS[7]["blocks"][0]["code"])]
    chips = "".join(f'<button type="button" class="chip ex" data-code="{e(c)}">{e(n)}</button>' for n, c in starters)
    return head("Try HolyC in your browser", "Run short HolyC programs in your browser with a small interpreter for a subset of the language. Nothing is sent anywhere.", "playground.html") + f'''
<section class="page-head"><p class="kicker">Try it</p><h1>Run HolyC</h1>
<p class="lede">Type a program and run it. This is a small interpreter written for this site, covering a subset of HolyC. It is not TempleOS, and nothing you type leaves your browser.</p></section>
<section aria-labelledby="h-play">
  <h2 id="h-play" class="sr">Playground</h2>
  <form id="play-form" class="pform js-only" hidden>
    <label class="f" for="src"><span class="label">HolyC program</span></label>
    <textarea id="src" name="src" rows="12" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" maxlength="6000">{e(first)}</textarea>
    <div class="row"><button class="btn" type="submit">Run</button><span class="hint">Ctrl or Cmd + Enter also runs it</span></div>
  </form>
  <div class="js-only" id="examples" hidden><p class="small">Start from an example:</p><div class="chips">{chips}</div></div>
  <div id="result" class="result" role="status" aria-live="polite"></div>
  <noscript><p class="note">The playground needs JavaScript, which runs it entirely in your browser. The <a href="holyc.html">lessons</a> show every example with its output.</p></noscript>
</section>
<section class="two" aria-labelledby="h-sup">
  <div><h2 id="h-sup" class="sech">What it supports</h2>
  <ul class="plain"><li>Types U0, Bool, I8 to I64, U8 to U64 and F64, with wrap-around at each size.</li><li>String statements and Print with %d %u %x %X %c %s %f (use %.2f and the like for floats) and %%.</li><li>Functions with default and skipped arguments, calls without parentheses, recursion.</li><li>if, else, for, while, do while, switch, break, continue, return.</li><li>Arrays of numbers, U8 * strings, simple classes, #define, built-ins Print, PutChars, StrLen, Sqrt, Sin, Cos, Abs, Min, Max.</li></ul></div>
  <div><h2 class="sech">What it does not</h2>
  <ul class="plain"><li>Pointers other than strings, memory allocation, asm, try and catch, goto, the file system, graphics, sound and the rest of TempleOS.</li><li>HolyC's operator-precedence differences: it uses C precedence, so avoid mixing bitwise operators with comparisons.</li><li>Anything that depends on TempleOS itself. For that you need the real system.</li></ul>
  <p class="small">The interpreter is checked against real C programs compiled with gcc for arithmetic and formatting (see <code>scripts/check-holyc.js</code>), not against TempleOS.</p></div>
</section>
<nav class="stepnav" aria-label="Previous and next"><a class="prev" href="terry.html"><span>Previous</span>Terry A. Davis</a><a class="next" href="resources.html"><span>Next</span>Resources</a></nav>
''' + foot("holyc-core.js", "playground.js")


def resources_page():
    items = [
        ("TempleOS on Wikipedia", "https://en.wikipedia.org/wiki/TempleOS", "A sourced overview of the system, its history and its reception. Start here to check anything on this site."),
        ("Terry A. Davis on Wikipedia", "https://en.wikipedia.org/wiki/Terry_A._Davis", "A sourced biography, written with more care than a page like ours can offer."),
        ("holyc-lang: a HolyC compiler", "https://github.com/Jamesbarford/holyc-lang", "A community compiler for HolyC, written in C, with a JIT, a REPL and an assembler. Its README describes it as working but with rough edges. BSD-style licence."),
        ("holyc-lang documentation", "https://holyc-lang.com/", "The documentation for that compiler, listed in its README."),
        ("templeos.org", "https://templeos.org/", "Davis's original site for the system. Not checked from here; it may be an archive or unavailable."),
    ]
    li = "".join(f'<li class="res"><h3><a href="{u}" rel="noopener">{e(t)}</a></h3><p>{e(d)}</p></li>' for t, u, d in items)
    return head("Resources: HolyC and TempleOS", "Where to read more and where to run real HolyC: Wikipedia, the holyc-lang compiler and Davis's original site.", "resources.html") + f'''
<section class="page-head"><p class="kicker">Resources</p><h1>Where to read more, and run the real thing</h1>
<p class="lede">A short list. Links were not checked from the build environment; if one is dead, <a href="{REPO}/issues/new">tell us</a>.</p></section>
<section aria-labelledby="h-r"><h2 id="h-r" class="sr">The list</h2><ul class="reslist">{li}</ul>
<p class="small">To run real HolyC, use a community compiler such as holyc-lang or run TempleOS itself in a virtual machine. This site's playground is a teaching tool, not a substitute.</p></section>
<nav class="stepnav" aria-label="Previous and next"><a class="prev" href="playground.html"><span>Previous</span>Try it</a><span></span></nav>
''' + foot()


def favicon():
    sq = "".join(f'<rect x="{x}" y="{y}" width="14" height="14" fill="{HEX[c]}"/>' for (x, y, c) in [(2, 2, "YELLOW"), (16, 2, "LTCYAN"), (2, 16, "LTGREEN"), (16, 16, "LTRED")])
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="{HEX["BLUE"]}"/>{sq}</svg>'


OUT = {"index.html": index(), "holyc.html": holyc_page(), "templeos.html": templeos_page(), "terry.html": terry_page(), "playground.html": playground_page(),
       "resources.html": resources_page(), "favicon.svg": favicon()}


def palette_check():
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    allowed = {h.lower() for h in HEX.values()}
    used = set(re.findall(r"#[0-9a-fA-F]{3,8}\b", css))
    bad = sorted(u for u in used if u.lower() not in allowed)
    if bad or re.search(r"rgba?\(|hsla?\(", css):
        raise SystemExit("styles.css uses colours that are not one of the 16 VGA colours: " + ", ".join(bad or ["rgb()/hsl()"]))
    return len(used)


def main():
    check = "--check" in sys.argv
    n = palette_check() if (ROOT / "styles.css").exists() else 0
    stale = []
    for name, text in OUT.items():
        p = ROOT / name
        if not p.exists() or p.read_text(encoding="utf-8") != text:
            stale.append(name)
            if not check:
                p.write_text(text, encoding="utf-8")
    if check and stale:
        print("stale:", ", ".join(stale)); sys.exit(1)
    print("ok" if check else f"written {len(OUT)} files; {N_EX} recorded examples; stylesheet uses {n} colour values, all from the 16")


main()
