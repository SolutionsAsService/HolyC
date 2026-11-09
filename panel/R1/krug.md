# Critic: Usability (Krug) - R1

Anchor used: Don't Make Me Think (Steve Krug): the five-second test, the trunk test, "don't make me decode before I can act".

## Verdict (OBJECT, mildly)

The site passes the test that matters most. In five seconds on the landing you see "HolyC", "The programming language of TempleOS, explained from scratch", a two-line demo, and two plainly labelled buttons. The path from the landing to a first run is a single tap plus a second tap, about 10 to 15 seconds, because the playground is pre-filled with Hello, world and Run sits in the first screen. The lessons have no sideways scroll on a phone (measured: 0 of 38 code blocks overflow at 390px, page scrollWidth 390). The Terry page is respectful and calm. The weak points are all about decoding. The landing never says who it is for or what TempleOS is. The marks legend lives only on the landing, so a reader who arrives on /terry.html from search meets "Firm / Reported / Uncertain" cold. The playground's error messages are good for syntax slips, but misleading for the two commonest beginner mistakes: lowercase `print`, and a C-style `int`. The nav has no "start here" and the page after Terry is Try it, which is fine, but Resources is a dead end. None of this is a blocker.

## Test 1: five seconds (index, 390x844 and 1280x800)

- What is this? Clear: title plus tagline plus the demo box. Desktop and phone both show the hero, the tagline and both buttons above or near the fold (phone: buttons at about y=540 of 844 in the screenshot scale; they are visible).
- Who is it for? "Explained from scratch" says beginners, but it never says "no TempleOS knowledge needed" and never says what TempleOS is. A visitor who typed "HolyC" knows; a visitor from a link does not.
- What do I do? "Learn HolyC" (solid) and "Try it in your browser" (outline): the right two buttons, in the right order.
- Colour swatch grid takes a full screen on phone (about 450px of 2966) between the buttons and the content. It is the site's character, but it sits between the first action and the "Where to start" cards and pushes them below the fold. Cost: roughly one screen of scroll for no action.

## Test 2: beginner to first program

Path timed by clicking: landing, tap "Try it in your browser", the textarea already holds `"Hello, world!\n";`, tap Run (button at y=402 of 844, 48px tall, 76px wide), output at y=668 appears under the fold-ish area. About 3 taps, 10 to 15 seconds. This beats the 60-second target. The one snag: a first-timer sees `"Hello, world!\n";` and may not know the program is a bare string; the lesson explains it, the playground does not link to it.

## Findings

1. MINOR - Landing does not say what TempleOS is or that no prior knowledge is needed.
   Evidence: hero text and cards; "The operating system" card text assumes the reader knows the name.
   Change: add one sentence under the tagline: "TempleOS was an operating system written by one programmer. No experience needed."

2. MAJOR - The marks legend is on the landing only; the pages that use the marks do not explain them.
   Evidence: terry.html and templeos.html each show "Firm", "Reported", "Uncertain" with a dash style per fact, and the only legend is in index.html "How sure is this site?". A deep-link reader sees "Reported" next to "Davis was struck by a train" with no key. The words are self-describing for Firm vs Uncertain, but "Reported" reads as "this is a news report" and the three line styles mean nothing alone.
   Change: put a three-item, one-line legend at the top of the TempleOS and Terry facts lists ("Firm: widely documented. Reported: accounts differ or it is Davis's own claim. Uncertain: unconfirmed."), or a `<details>` "What do these marks mean?" in the same place. Keep the landing copy.

3. MAJOR - Playground errors for the two commonest beginner slips mislead.
   Evidence (run live): `print("hi\n");` gives "Function 'print' is not defined yet; define it before you use it." The real problem is capitalisation (Print). `int x = 5;` gives "Expected ';' but found 'x'", which tells a C programmer nothing; the type is I64. `DrawIt;` gives "'DrawIt' is not defined here" (different wording from the function message for the same cause).
   Change: when an unknown name matches a known one case-insensitively, say "Did you mean Print? HolyC is case-sensitive." When the word is `int`/`char`/`float`/`long`/`double`/`void`, say "HolyC has no `int`; use I64 (see Types)." Unify "not defined yet/here" into one sentence and, for unknown names that are TempleOS built-ins, add "this playground does not include it".

4. MINOR - Other errors read well. Evidence: missing semicolon "Line 1: Expected ';' but found 'end of input'"; C `#include`: "Preprocessor lines other than #define are not supported here."; pointers: "Pointers and the address-of operator are not supported by this subset."; infinite loop: "Stopped after too many steps. Is there an infinite loop?" (returned in about 0.4 s, no hang); `x` undefined: "'x' is not defined here." Each names the line. Keep. Slight improvement: "end of input" could say "the program ended; did you forget a ;".

5. MINOR - What the playground can and cannot do is stated, but below the fold and in a dense list.
   Evidence: on 390px the "What it supports / What it does not" lists start at about y=1070 of 2688. A reader whose first non-trivial program fails (pointer, `MAlloc`) meets the error first and the list second; the error itself is good enough for that, so this is minor.
   Change: add to the result footer on failure a link "What this playground covers" to #h-sup.

6. MINOR - The result area is below the Run button by about 220px, and nothing scrolls it into view.
   Evidence: button at y=402 to 450, result box at y=668 on a 844px viewport (no keyboard). With the on-screen keyboard open (about 300 to 350px of a 844px screen, leaving about 500 visible) the textarea (322px tall, starts y=64) fills the whole visible area; Run at y=402 is visible only if the page does not scroll, and the result at 668 is not. Layout judgment, not tested on a device.
   Change: after Run, call `result.scrollIntoView({block:"nearest"})` and blur the textarea on touch devices; or shorten the textarea to 8 rows at narrow widths.

7. MINOR - "Output from this site's interpreter" label under all 19 examples is noise after the first two.
   Evidence: it repeats 19 times in holyc.html (page height 10,985px at 390). The first use is useful; the 18 others are the same words. The lede already says "run by a small interpreter written for this site".
   Change: keep the full label under the first example only; thereafter a short "Output" label. Keep the page-level caveat.

8. MINOR - Code versus output is clear on the lesson page.
   Evidence: shots/holyc-phone-*; code block, then output block, then caption; no sideways scroll at 390 (0 of 38 `pre` elements overflow, document scrollWidth 390). I could not confirm contrast of the two blocks in dark mode from a downsampled screenshot; they look distinct. No change except to keep a visible "Output" word, not only colour.

9. MINOR - Lesson order is right for a beginner, with one question.
   Evidence: Hello, Types, Numbers wrap around, Functions, Loops and choices, Strings and arrays, Classes, A longer example, How it differs from C. "Numbers wrap around" before functions and loops is an unusual early detour for a first-timer; it is HolyC-specific and interesting, but a newcomer wants Functions and Loops first. "How it differs from C" last is right for C programmers, but the lede says "from scratch": say who the differences list is for.
   Change: move "Numbers wrap around" after "Loops and choices"; label the last section "If you know C".

10. MINOR - Navigation: five items, no current-page confusion, prev/next at the foot of lesson pages. Dead ends: after Terry comes "Try it" (next link: "Learn the language he wrote", the right push); after Try it comes Resources, which has only Previous. Resources then ends with no onward link.
    Change: add "Back to the lessons" and "Home" to the Resources step-nav. The five-item nav is fine on phone (it wraps without scroll).

11. MINOR - Landing "Where to start" gives four cards of equal weight, in the order language / OS / author / try, while the hero has already given "Learn" and "Try". The cards repeat the buttons. For a Krug reader that is a surplus, not a defect.
    Change: none required; consider marking the first card "Start here".

12. MINOR - Tone of the Terry page: respectful, plain, not sensational.
    Evidence: the note "A note on how this page is written" says it will not repeat his offensive remarks and will not treat his illness as entertainment; the facts are neutral ("lived with serious mental illness (reports describe schizophrenia)"; "Davis was struck by a train and killed. Reported widely; the details are not repeated here."). The closing "The work" paragraph is respectful. One snag for an ordinary reader: "Reported - Davis was struck by a train and killed" has a dash-and-word mark that suggests doubt about a death, which is documented. And the "note" appears before the facts at the same size as body text, so it may be skipped.
    Change: re-mark the death-by-train fact "Firm" if the author is confident, or reword: "Davis died after being struck by a train." Add the legend (finding 2) above the list. Also the "Uncertain" electrical-engineer fact is the sort of fact that a reader will trust anyway; the mark is doing its job.

## What needs a real phone

- Run button reachability with the on-screen keyboard open (iOS Safari and Android Chrome): visual viewport height, whether the textarea scrolls the page, and whether the result is visible after Run.
- Whether the textarea zooms on focus in iOS Safari (font-size under 16px triggers it); I could not tell from the screenshot.
- Touch-target size of the example chips and of the five nav links in one row (the nav fits at 390px; at 360px or 320px it may wrap).
- Actual legibility of the 16-colour hero and swatch labels in sunlight, and the dark/light switch (`prefers-color-scheme`) on a device.
- Scroll feel of a 10,985px lesson page and whether the "On this page" disclosure is found.

I did not edit any site file. Chromium was driven at 390x844 with touch emulation; no real keyboard was shown.
