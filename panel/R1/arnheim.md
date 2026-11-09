# Critic: Formalist (Arnheim) - Round 1

Anchor used: Arnheim, Art and Visual Perception (balance, visual weight, structural skeleton, figure/ground). Evidence: shots/index-*, holyc-desktop-dark, terry-phone-dark, playground-desktop-light, social.png. Coordinates below are in original pixels (displayed x 1.08 at desktop, x 1.48 at phone).

## Verdict: OBJECT (to the inner pages and the lower landing, not to the hero)

The hero is genuinely strong: a blue field with a saturated bitmap H-o-l-y-C is the figure, the black page is the ground, and the one figure/ground contrast on the site is the right one. The eye enters at the yellow H (about 275,215 at 1280), sweeps right across the four-colour letters, drops to the yellow tagline, and rests on the black program box with its cursor. That is a clean Z-path and a real graphic. The composition then loses its tension in three places: the logo fills only 60% of the screen's width, leaving a dead right-hand third; the palette strip is a second, equal-weight "screen" competing with the first; and every inner page falls to a plain left-aligned text column with no carrier of the poster's force. The 16-colour rule is a strength at the hero and a limitation in the light scheme, where the stock grey panels read as a default. The most valuable single change is to carry the pixel-letter H (or a blue title bar) down onto each inner page as a page-opening band.

## Findings

1. MAJOR - Inner pages collapse into text. 
   Evidence: holyc-desktop-dark (9963px tall, a single column of small mono text; code blocks are black boxes with grey borders, no figure of any size), terry-phone-dark (white heading on black, then paragraphs; only the blue "The work" band shows the identity), playground-desktop-light (a 1280px page that is black textarea plus text, nothing from the logo palette except one blue button). Beyond the nav, the poster's energy is gone: one blue section on terry, none on holyc. 
   Change: give every inner page the same opening device: a bezeled blue "screen" band (title bar "HolyC / <page> / 640x480") containing the page title in large pixel letters, one palette colour per word or per page (holyc = yellow H, templeos = cyan, terry = ltgreen, try = ltred, resources = ltpurple), then the text below. One component, reused five times, carries the identity.

2. MAJOR - Right third of the hero screen is empty; the logo is left-heavy. 
   Evidence: index-desktop-dark, screen spans x 230-1050 (original) but letters end near x 840; the 'C' is at x 740-840, leaving about 200px blue void at right while the tagline and program box span full width. The glyph mass sits at the left and the tagline is left-set, so the composition tips left against a box that spans full width. At 390 the logo does fill the width and works. 
   Change: scale the bitmap to fill the inner width at desktop (about 1.25x), or centre the logo and tagline; either makes the screen balanced about its vertical axis.

3. MAJOR - The palette strip is a second poster. 
   Evidence: index-desktop-dark, y 720-910 (original): 16 saturated swatches in two rows hold more total chroma than the logo (the logo is thin strokes; the swatches are solid blocks), and they sit 40px below the buttons with equal width to the screen. At 390 they stack 4x4 and run about 330px, longer than the screen itself (about 320px). The eye is pulled down from the call to action into a colour chart, and the buttons get lost between two heavy blocks. 
   Change: make the strip a single row of 16 thin cells (about 28px high, names only on hover/focus or as small numbers) directly under the screen, as the screen's own palette bar; it stays a signature but reads as part of the screen, not a rival. On phone use 8x2.

4. MINOR - Screen floats in black at 1280. 
   Evidence: index-desktop-dark, screen 820px wide centred in 1280 with 230px black each side, while the sections below ("Where to start") use a wider 1090px column. The widths do not align: the screen is narrower than the nav rule above it and the card grid below. A skeleton of two different column widths reads as drift. 
   Change: set the screen to the page column width (or give the grid and the nav the screen's width); a shared edge makes the screen the head of the column rather than an island.

5. MAJOR - Buttons are small against the figure. 
   Evidence: index-desktop-dark, buttons about 140x45 and 240x45 under an 820x450 screen, a 1:10 area ratio; yellow "Learn HolyC" is the only warm solid below the screen and does catch the eye, but it is weaker than the swatches below it (finding 3). 
   Change: after reducing the strip, keep the yellow button and enlarge to about 56px high with the 2px black/white border; place it overlapping the screen's bottom bezel to tie the two together.

6. MINOR - Colour pairings. 
   Evidence: yellow on blue (tagline, index) is a strong 7:1 pairing and the right TempleOS signature; I do not find it harsh. Ltred on black and ltblue on black in code (holyc) are legible. The harsh cases are cyan labels in the Where to start cards on blue ("8 LESSONS, ALL RUN" in ltgray on blue at about 11px) which vibrate on blue and are tiny. 
   Change: raise the card eyebrow to 12px+ and use white or yellow, not ltgray.

7. MAJOR - Light scheme reads as an afterthought. 
   Evidence: index-desktop-light: the hero is the same blue screen on white (good: the screen is the figure and it holds), but "Where to start" cards and "How sure is this site?" are flat ltgray (#aaa) panels with black text; the whole lower half looks like a generic grey wireframe, and the "How sure" band (grey on white) has no force where the dark version has a full-bleed blue band. The cards lose the blue "screen" identity. 
   Change: in light, keep cards and the "How sure" band blue with white/yellow text (same as dark); the page ground can be white, but panels stay VGA blue. Dark is the real design; light should be "the same screens on paper", not a grey re-skin. Also terry/holyc light show black code boxes against white with thin grey rules, which is fine.

8. MINOR - Social card is faithful, but weak as a thumbnail. 
   Evidence: social.png 1200x630 is a literal crop of the screen: logo (letters about 100-300px tall), tagline, program box. It is faithful and the colour carries. Problems: the title bar text is 13px and illegible at thumbnail size; the logo is left-heavy with a blank blue right third (finding 2); the black outer margin at the bottom (y 540-630) is dead space. 
   Change: crop the card so the screen bleeds nearly to the edges, enlarge the logo to fill the width, drop the program box in favour of the tagline, and keep the palette strip as a thin row at the bottom (it is the brand's cheapest recognisable mark).

9. MINOR - Distinctiveness. 
   Evidence: everything below the first screen (cards with borders, section rules, mono headings) is the well-made "brutalist docs" template. What a stranger remembers is the hero logo, and the 16-colour joke ("So is every colour on this site"). 
   Change: see finding 1; to make it memorable, let the logo's letters recur: each inner page opens with its own pixel word, and the nav's four-square favicon becomes the page's first glyph.

## Single change that raises it most
Finding 1: one reusable bezeled blue title-screen component, with the page name in pixel letters in one palette colour, at the top of every inner page. It carries the hero's figure/ground tension down the whole site; no other change does as much.

## Answers to the brief
(1) Yes, dominant focal point (logo), clear Z-path at both widths; palette competes below it. (2) Logo right size at 390, a little small at 1280; palette too heavy; screen floats, narrower than the column. (3) Strength, except small cyan/ltgray labels on blue and the grey light panels. (4) Dark is the design; light holds only in the hero. (5) Collapse; use the title-screen band. (6) Faithful, not strong. (7) See above.
