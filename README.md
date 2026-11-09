# HolyC

A guide to **HolyC**, the programming language of TempleOS, and a careful look at the operating system and its author, Terry A. Davis. Its distinguishing ideas:

- **Every example was run.** The 19 examples on the lessons page, and the playground, use a small interpreter written for this site (`holyc-core.js`) that covers a *subset* of HolyC. It is not TempleOS and not Davis's compiler, and the pages say so.
- **Every fact is marked** *Firm*, *Reported* or *Uncertain*, because the text was written from general knowledge and has not been checked line by line against the TempleOS documentation.
- **Every colour on the site is one of TempleOS's 16** (the standard VGA palette). The build refuses to run if the stylesheet uses any other.

## How it is built

```bash
node scripts/check-holyc.js       # the interpreter: 29 programs (26 compared with gcc-compiled C), 16 bad programs refused
node scripts/run_examples.js      # run every example, write data/outputs.json (fails if an example does not run)
python3 scripts/build.py          # generate the pages; refuses a stylesheet with a colour outside the 16
python3 scripts/build.py --check  # exit 1 if a generated page is stale
node scripts/run_examples.js --check
```

Content is in `data/` (`lessons.json`, `facts.json`, `differences.json`, `palette.json`, `tiers.json`, `site.json`). After deploying, put the live address in `data/site.json` (`{ "url": "https://..." }`) and rebuild so the social card and canonical links become absolute.

The interpreter is checked against real C programs compiled with gcc for arithmetic, wrap-around, division, shifts and formatting. That checks it against C semantics; it cannot check it against TempleOS. To run real HolyC, use a community compiler such as [holyc-lang](https://github.com/Jamesbarford/holyc-lang) or run TempleOS in a virtual machine.

## A note on the subject

Terry A. Davis lived with serious mental illness and, in his later years, also said many offensive things. This site is about the software, and the page about him is short and sticks to the record.

## Contributing

Corrections are welcome, especially a source for any fact marked *Reported* or *Uncertain*: open an issue naming the page. Code and text are MIT-licensed (see `LICENSE`).
