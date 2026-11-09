# Claims check: Provocateur (Debord), round 1

Anchor used: The Society of the Spectacle (Guy Debord), thesis 1 ("everything that was directly lived has moved away into a representation") and thesis 10 ("the spectacle presents itself as a vast inaccessible reality that can never be questioned"). The test for this site: is each printed statement a claim the work can back, or an image of one?

## Verdict: OBJECT (no BLOCKER; 4 MAJOR, 9 MINOR)

This site is more honest than most of its kind. The footer, the legend, the per-example "Output from this site's interpreter" label and the refusal to repeat Davis's remarks are claims it can back. I ran `node scripts/check-holyc.js`: it passes (29 programs, 26 compared with gcc -O0, 16 refusals). The objection is narrow. The words "Firm", "run" and "real" promise a stronger check than the author performed. The hero staging shows interpreter output as if it were the TempleOS screen, with no label. Three page-copy sentences state in the site's own voice things the facts data does not support: "Everything in it ... was written by Davis", "small enough to read", and "radical simplicity". One sensitive-subject choice (the order of the person facts) reads as a juxtaposition the site says it avoids. No fact I know of is false. Dates, age, the 640x480 and 16-colour display, ring 0 with one address space, the rename order, DolDoc, the Oracle and the palette names all match my recall. I could not check any of them against a source: Wikipedia and templeos.org are unreachable from here.

I could verify one source, holyc-lang. Its README and COPYING were fetched from raw.githubusercontent.com.

## Findings

**1. MAJOR. "Firm" promises a verification that has not happened.**
- Says: tiers.json gives the Firm blurb as "Widely documented and consistent everywhere the author remembers seeing it". The index tells readers to "treat the weaker marks as leads, not citations". That implies Firm items may be cited.
- Wrong or unproven: the author's own words are that nothing was checked. "Widely documented" asserts that documents exist and agree, and the author consulted none. The scheme measures the writer's confidence, not the world's agreement.
- Confidence: high. Verified by reading the files.
- Replace the Firm blurb with: "Stated the same way in everything the author recalls. Not looked up: none of these is checked against a source." Replace the index sentence with: "Every mark, Firm included, is the author's recollection. Check anything you intend to repeat."

**2. MAJOR. The marks cover only the facts and differences lists; the lesson prose carries none.**
- Says: the footer says "Each fact carries a mark". The lessons make unmarked claims about HolyC: "There are no int, char or float keywords", "I64 is the type to reach for by default", "A character is a U8", "Bool is true or false", "The control statements are the ones from C ... switch falls through", "Define a function before the line that calls it".
- Wrong or unproven: these are as unchecked as the marked claims, yet they look firmer because they have no mark. The reader can't tell whether the lessons are Firm.
- Confidence: high. Verified by reading.
- Add one sentence under the lessons lede: "The lessons are written from memory like the rest. The marked list near the end is the part where the author was least sure." Or give each lesson a tier. I would lean on the sentence.

**3. MAJOR. The hero shows interpreter output as the TempleOS screen, unlabelled.**
- Says: the index hero is a bezeled "screen" with the bar "HolyC / 640x480, 16 colours", the pixel logo, a program and its output with a blinking cursor. Every other output on the site is labelled "Output from this site's interpreter". The hero is the only one that is not.
- Wrong or unproven: this is the image standing in for the thing (thesis 1). The first thing most visitors see implies a TempleOS terminal. The hello world is the safest case, but the staging sets the register for the whole site.
- Confidence: high. Verified by reading `index()` in build.py.
- Add under the hero program, in the same style as the other figures: "Staged on a 640x480 screen for show. Output from this site's interpreter, not from TempleOS."

**4. MAJOR. The index card says "every output produced by a real run".**
- Says: the card "The language" reads "with every output produced by a real run". The meta description reads "with every example run".
- Wrong or unproven: "real run" reads as "a real HolyC run". No example ran on a HolyC compiler, as the DESIGN-LOG admits, and the holyc page says "run by a small interpreter written for this site". The card contradicts the page it links to.
- Confidence: high. Verified by reading the files.
- Replace with: "HolyC from first principles ... every output produced by this site's own interpreter, not by TempleOS." Change the meta description to "with every example run through a subset interpreter".

**5. MAJOR (sensitivity). The person facts are ordered so the page implies a causal story.**
- Says: the Terry page lists, in facts.json order: sole author, born, died, "God told him", struck by a train, serious mental illness "which was part of the story of the project", offensive statements, then "trained as an electrical engineer ... before his illness". The page note says it will not "treat his illness as entertainment".
- Wrong or unproven: (a) The religious claim is followed at once by the train and the illness. A reader will link them, and the site asserts that link in its own voice ("part of the story of the project"), which is a causal claim no tier backs. (b) The only fact that is about his capability comes last, after the death, the illness and the abuse. (c) "Before his illness" is a dated claim the site cannot support. He may have worked after onset, and I am only medium confident either way.
- Confidence: medium on (c), high on the structure. Verified by running the build's index filter logic mentally and reading the page source. The order follows facts.json.
- Reorder the person facts chronologically and by kind: trained / worked, wrote the system, said God told him (as his own account), lived with illness, later abusive statements, born/died, death. Change the illness fact to "Davis lived with serious mental illness; reports describe schizophrenia. Reports differ on the diagnosis and its history." and drop "which was part of the story of the project". Change the education fact to "Davis trained as an electrical engineer and worked as a programmer", with no "before his illness".

**6. MINOR. The page copy overstates the sole-author fact.**
- Says: templeos.html says "Everything in it, the kernel, the shell, the editor, the compiler, the games and the documents, was written by Terry A. Davis, and almost all of it in HolyC". The firm fact says "largely on his own".
- Wrong or unproven: "Everything" is stronger than "largely". The bootloader and kernel contain assembly. The system ships text Davis did not write (the Bible text it quotes, for one). "Almost all of it in HolyC" is a claim no fact or note backs.
- Confidence: medium. Not verified.
- Replace with: "Davis wrote the kernel, the shell, the editor, the compiler and the games himself, by his own account and by every account the author recalls, mostly in HolyC with some assembly." Add "reported" to that sentence's tier.

**7. MINOR. "Small enough to read" and "radical simplicity" contradict the site's own 100,000-line figure.**
- Says: templeos.html says the system "is small enough to read". terry.html ends with "studied as a case of radical simplicity".
- Wrong or unproven: the site also says on the order of 100,000 lines, tier uncertain. A hundred thousand lines is not small enough for one reader. TempleOS has a built-in compiler, a hypertext document format and 3D graphics, which is not "simple". "Still studied" is unsourced.
- Confidence: medium. Not verified; the lines figure is the site's own.
- Replace both with: "unusually small for what it does" and "is still looked at as an example of what one person can build". Mark the second reported.

**8. MINOR. "A gifted programmer" is an unargued adjective.**
- Says: the Terry page lede reads "A gifted programmer, a man living with serious mental illness, and ...". Nothing on the page gives a reason for "gifted".
- Wrong or unproven: it is hagiographic by default and a value judgement. The site's own facts support "wrote a whole operating system and compiler himself", which is the claim worth making.
- Confidence: medium. Verified by reading.
- Replace with: "A programmer who wrote a whole operating system and its compiler largely by himself, a man who lived with serious mental illness, and the author of TempleOS and HolyC."

**9. MINOR. "Many offensive and abusive statements" is not specific enough, and the fact carries editorial text.**
- Says: "In his later years Davis made many offensive and abusive statements, which are well documented. This site is about the software." Tier reported.
- Wrong or unproven: the sentence is fair and does not repeat them, which is right. But the unnamed category lets a reader think it means gruffness or eccentricity. The abuse was racist, and naming the category costs nothing. The second sentence is policy inside a tiered fact, and the Terry page's "the reason anyone remembers him" is an unhedged claim. He is also remembered as an internet figure.
- Confidence: medium on the wording, high on the structure. Not verified.
- Replace the fact with "In his later years Davis made many abusive statements, including racist abuse, which are well documented." and move the policy sentence to the page note. Replace "the reason anyone remembers him" with "the reason this site exists".

**10. MINOR. The index card calls the Terry page "a short, careful life".**
- Says: the card title reads "a short, careful life", and its text says "the serious illness that was part of the story".
- Wrong or unproven: "careful life" is wrong. The page is a careful account, not a careful life, and "short" for a man who died at 48 reads as a euphemism. "Part of the story" turns the illness into plot.
- Confidence: high on the misreading. Verified by reading.
- Replace with: "a short, careful account" and "Terry A. Davis, who wrote it, and what is and is not known about his life."

**11. MINOR. The "no network stack" fact is attached to the wrong claim in "Running it today".**
- Says: the paragraph reads "Because it has no network stack and runs everything at the highest privilege, it is best treated as a curiosity ... {Reported mark}". The mark sits at the end and is read as covering the whole sentence.
- Wrong or unproven: "no network stack" is reported; the privilege claim is firm; the advice is the site's opinion. One mark cannot cover all three. The fact as written is also the version I would call firm in recollection (Davis said TempleOS had no networking), so Reported is fine but should say what it covers.
- Confidence: medium. Verified by reading.
- Split the sentence: "TempleOS has no network stack [Reported] and runs everything at the highest privilege [Firm], so the author suggests treating it as a curiosity to explore in a sandbox."

**12. MINOR. The playground silently differs from the rest of the site on `$`, and the lessons cannot show it.**
- Says: differences.json says "a dollar sign begins a document-format command, so a literal dollar is written twice" (reported). The playground ran `"Cost $5 and $$ \n";` and printed `Cost $5 and $$` exactly as typed.
- Wrong or unproven: if the site's own claim is true, the interpreter's output for any string containing `$` is not what TempleOS would print. The playground's "What it does not" list omits `$`. The same list says `%e` is refused, which is honest. A bare `%` in a string is refused too, which is the honest direction.
- Confidence: high on the interpreter behaviour (I ran it). Medium on what TempleOS prints.
- Add to "What it does not": "`$` in strings: TempleOS treats it as the start of a document command; this interpreter prints it as it is." Also have the interpreter refuse a lone `$` the way it refuses `%e`.

**13. MINOR. Operator precedence is disclosed but the playground gives the wrong answer silently.**
- Says: the playground lists "HolyC's operator-precedence differences: it uses C precedence". differences.json marks this uncertain.
- Wrong or unproven: I ran two probes. `1 << 2 + 1` gave 8 (C), and I recall HolyC giving 5, because shifts bind tighter than `+` there. `5 & 3 == 3` gave 1 (C), and I recall HolyC giving 0. The disclosure is honest and none of the 19 lesson examples mixes the operators, so no lesson output is at risk. The uncertain tier is right (my confidence in the HolyC side is medium).
- Confidence: medium. Verified the interpreter side by running it.
- Keep the disclosure. Add one worked pair to the differences entry so the reader sees the size of the gap: "1 << 2 + 1 is 8 in C; in HolyC the author recalls 5".

## Things that need no change but have risk

- Lesson `types`, block 1: `"%d %.1f %c\n", n, x, c;` passes an F64 to a variadic Print. The interpreter's output is sound under C semantics. Under HolyC I am medium confident `%.1f` works the same way.
- Lesson `wrap`: signed overflow on I64 is undefined behaviour in C. The check program compares with an unsigned add, which is the honest route. The lesson text "what a 64-bit machine does" is true of the hardware and of the compiled code. I recall HolyC compiling straight to x86-64, so I rate this high.
- Differences "Sized type names": "Bool is its own type" is the weakest claim in the entry. holyc-lang's lexer has a `KW_BOOL` keyword, but I could not establish Bool's exact semantics in TempleOS (I recall a one-byte type). The interpreter makes `Bool b = 5` print 1; I cannot say what TempleOS does. Change to "Bool holds TRUE or FALSE" and add "reported". Confidence: low.
- Differences "Exceptions": "a thrown value is a short constant" is loose. I recall `throw('Oops')`, an integer, usually a character constant of up to eight characters. Reported tier is right. Suggested wording: "throw takes an integer, usually a short character constant such as 'Oops'."
- Differences "A string statement prints": the lesson never says a literal `%` must be written `%%`. In HolyC the bare string is a format string. The interpreter refuses a lone `%` loudly, which is the honest direction, but a learner meets a refusal the lesson did not prepare them for.

## Checked and found correct (as far as I know)

- **Dates and identity:** born 15 December 1969, died 11 August 2018, aged 48; sole author; 64-bit; the rename order J Operating System, LoseThos, SparrowOS, TempleOS, with 2013 for the last (the note rightly says years vary).
- **System facts:** 640x480 with 16 colours; ring 0 and a single address space; HolyC as both language and shell, with the compiler built in; DolDoc as the document format; the Oracle as a program of random words that Davis took as messages; "public domain" (he declared it; the fact is fine as firm in recollection but "Davis released it into the public domain" is the safer phrasing, a minor point).
- **The religious claim:** "Davis said that God told him to build it, and that it was God's temple" reports the claim as his claim. The templeos page's "This site records his claim as his claim" is fair. "Reported" is the right tier.
- **The illness wording:** "reports describe schizophrenia", with the note that reports differ, stays with what is reported and does not diagnose.
- **The train:** "struck by a train and killed", with no method details and no label of intent. That is the right restraint.
- **Palette:** the 16 names and their order match my recall of TempleOS (BLACK, BLUE ... YELLOW, WHITE). The hex values are standard VGA.
- **HolyC claims confirmed or consistent with my recall:** the string statement printing, the sized type names, calls without parentheses, default and skipped arguments (`Vol(, , 10)`), inheritance with `class`, `try`/`catch`/`throw`, asm blocks and run-time compilation. `$$` for a literal dollar is correct. I could not check `start`/`end` sub-switch; reported is the right tier.
- **Interpreter honesty:** each example carries "Output from this site's interpreter". The holyc, playground and footer text all say "subset" and "not TempleOS". The README says the same. `check-holyc.js` passes, and its own comment says it checks against C, not TempleOS. The Playground's "What it supports/does not" lists are accurate against what I ran: `%e` is refused, `1 << 64` is refused, and a pointer is refused.
- **Resources:** holyc-lang is real. The README describes "a working state ... Errors are a bit hit and miss! This is more for fun than for serious development"; the site's "working but with rough edges" is fair but a little kinder. The README lists AOT, a JIT, a REPL, an assembler and a disassembler, so "with a JIT, a REPL and an assembler" is right. The licence file (COPYING) is the BSD 2-clause text, so "BSD-style licence" is right. The holyc-lang.com line is right: the README links it. The templeos.org line says "Not checked from here", which is honest; I could not reach it either.
- **Footer and legend:** the footer says "Written from general knowledge, and not yet checked line by line", names the interpreter's limits, and says "not affiliated". That is a claim the site can back.

## Resources: one suggested change

Change the holyc-lang description to: "A community compiler for HolyC, written in C, with a JIT, a REPL and an assembler. Its README says it is working but 'hit and miss' on errors and 'more for fun than for serious software development'. BSD-style licence." Medium confidence that quoting the README is better than paraphrasing it. Verified by fetching the README.

## What I did not check

Real TempleOS output of any lesson. The `start`/`end` sub-switch. The source of the 100,000-line figure. The single-voice sound claim (the site says uncertain; the tier is honest, but the text is too terse to be useful, and it could read "Sound is limited to one note at a time", uncertain). The CSS and the visual design.
