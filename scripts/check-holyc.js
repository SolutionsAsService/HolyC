#!/usr/bin/env node
// Re-runnable check of the HolyC subset interpreter (holyc-core.js).
//   node scripts/check-holyc.js
// Each case is a HolyC program with either an expected output, or an equivalent C program: the C program is compiled
// with gcc and the two outputs must match exactly. That checks the arithmetic, wrap-around, division, shifts and
// formatting against a real compiler. Programs the interpreter must refuse are checked for a clear error message.
// This verifies the interpreter against C semantics; it does not (and cannot here) verify it against TempleOS.
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const HC = require(path.join(__dirname, "..", "holyc-core.js"));

const C_HEAD = "#include <stdio.h>\n#include <stdint.h>\n#include <math.h>\n#include <string.h>\ntypedef long long I64; typedef unsigned char U8; typedef double F64;\n";
const cases = [
  { name: "hello", hc: '"Hello, world!\\n";', expect: "Hello, world!\n" },
  { name: "print format", hc: 'Print("%s has %d letters\\n", "HolyC", 5);', expect: "HolyC has 5 letters\n" },
  { name: "arithmetic", hc: 'I64 x = 6 * 7; "%d %d %d %d\\n", x, x / 5, x % 5, -x / 5;', c: 'I64 x = 6 * 7; printf("%lld %lld %lld %lld\\n", x, x/5, x%5, -x/5);' },
  { name: "negative modulo and division", hc: '"%d %d %d %d\\n", -7 / 2, -7 % 3, 7 / -2, 7 % -3;', c: 'printf("%lld %lld %lld %lld\\n", (I64)-7/2, (I64)-7%3, (I64)7/-2, (I64)7%-3);' },
  { name: "U8 wraps", hc: 'U8 a = 250; a += 10; "%d\\n", a; U8 b = 0; b--; "%d\\n", b;', c: 'U8 a = 250; a += 10; printf("%d\\n", a); U8 b = 0; b--; printf("%d\\n", b);' },
  { name: "I64 wraps", hc: 'I64 big = 9223372036854775807; big++; "%d\\n", big;', c: 'I64 big = 9223372036854775807LL; big = (I64)((unsigned long long)big + 1ULL); printf("%lld\\n", big);' },
  { name: "bit operations", hc: '"%d %d %d %d %d\\n", 12 & 10, 12 | 10, 12 ^ 10, 1 << 10, 1024 >> 3;', c: 'printf("%d %d %d %d %d\\n", 12&10, 12|10, 12^10, 1<<10, 1024>>3);' },
  { name: "hex and char formats", hc: '"%x %X %c %c\\n", 255, 255, 72, \'i\';', c: 'printf("%llx %llX %c %c\\n", 255LL, 255LL, 72, \'i\');' },
  { name: "width, zero pad, left align", hc: '"[%5d][%-5d][%05d][%+d]\\n", 42, 42, 42, 42;', c: 'printf("[%5lld][%-5lld][%05lld][%+lld]\\n", 42LL, 42LL, 42LL, 42LL);' },
  { name: "floats", hc: 'F64 r = 2.0; "%.4f %.2f %.0f\\n", Sqrt(r), 3.14159, 2.5;', c: 'F64 r = 2.0; printf("%.4f %.2f %.0f\\n", sqrt(r), 3.14159, 2.5);' },
  { name: "int and float mix", hc: 'F64 a = 7 / 2; F64 b = 7 / 2.0; "%.2f %.2f\\n", a, b;', c: 'F64 a = 7 / 2; F64 b = 7 / 2.0; printf("%.2f %.2f\\n", a, b);' },
  { name: "for loop sum", hc: 'I64 s = 0; I64 i; for (i = 1; i <= 100; i++) s += i; "%d\\n", s;', c: 'I64 s = 0; I64 i; for (i = 1; i <= 100; i++) s += i; printf("%lld\\n", s);' },
  { name: "while and break/continue", hc: 'I64 i = 0; while (TRUE) { i++; if (i % 2 == 0) continue; if (i > 9) break; "%d ", i; } "\\n";', c: 'I64 i = 0; while (1) { i++; if (i % 2 == 0) continue; if (i > 9) break; printf("%lld ", i); } printf("\\n");' },
  { name: "do while", hc: 'I64 n = 5; do { "%d ", n; n--; } while (n > 0); "\\n";', c: 'I64 n = 5; do { printf("%lld ", n); n--; } while (n > 0); printf("\\n");' },
  { name: "switch with fall-through", hc: 'I64 i; for (i = 1; i <= 4; i++) { switch (i) { case 1: "one "; case 2: "two "; break; case 3: "three "; break; default: "other "; } } "\\n";', c: 'I64 i; for (i = 1; i <= 4; i++) { switch (i) { case 1: printf("one "); case 2: printf("two "); break; case 3: printf("three "); break; default: printf("other "); } } printf("\\n");' },
  { name: "factorial and recursion", hc: 'I64 Fact(I64 n) { if (n <= 1) return 1; return n * Fact(n - 1); } "%d %d\\n", Fact(10), Fact(20);', c: 'I64 Fact(I64 n){ if (n <= 1) return 1; return n * Fact(n-1);}', main: 'printf("%lld %lld\\n", Fact(10), Fact(20));' },
  { name: "fibonacci", hc: 'I64 Fib(I64 n) { if (n < 2) return n; return Fib(n - 1) + Fib(n - 2); } I64 i; for (i = 0; i < 12; i++) "%d ", Fib(i); "\\n";', c: 'I64 Fib(I64 n){ if (n < 2) return n; return Fib(n-1)+Fib(n-2);}', main: 'I64 i; for (i = 0; i < 12; i++) printf("%lld ", Fib(i)); printf("\\n");' },
  { name: "default arguments", hc: 'I64 Add(I64 a, I64 b = 10) { return a + b; } "%d %d\\n", Add(1), Add(1, 2);', c: 'I64 Add(I64 a, I64 b){ return a+b; }', main: 'printf("%lld %lld\\n", Add(1,10), Add(1,2));' },
  { name: "skipped argument uses the default", hc: 'I64 Vol(I64 w = 2, I64 h = 3, I64 d = 4) { return w * h * d; } "%d %d %d\\n", Vol(), Vol(5), Vol(, , 10);', c: 'I64 Vol(I64 w, I64 h, I64 d){ return w*h*d; }', main: 'printf("%lld %lld %lld\\n", Vol(2,3,4), Vol(5,3,4), Vol(2,3,10));' },
  { name: "call without parentheses", hc: 'U0 Greet() { "Hello from Greet\\n"; } Greet; Greet();', expect: "Hello from Greet\nHello from Greet\n" },
  { name: "array and bubble sort", hc: 'I64 a[5] = {5, 3, 1, 4, 2}; I64 i, j, t; for (i = 0; i < 4; i++) for (j = 0; j < 4 - i; j++) if (a[j] > a[j + 1]) { t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; } for (i = 0; i < 5; i++) "%d ", a[i]; "\\n";', c: 'I64 a[5] = {5,3,1,4,2}; I64 i,j,t; for (i=0;i<4;i++) for (j=0;j<4-i;j++) if (a[j]>a[j+1]) { t=a[j]; a[j]=a[j+1]; a[j+1]=t; } for (i=0;i<5;i++) printf("%lld ", a[i]); printf("\\n");' },
  { name: "strings", hc: 'U8 *s = "TempleOS"; "%d %c %c\\n", StrLen(s), s[0], s[StrLen(s) - 1];', c: 'const char *s = "TempleOS"; printf("%d %c %c\\n", (int)strlen(s), s[0], s[strlen(s)-1]);' },
  { name: "classes", hc: 'class Point { I64 x; I64 y; }; Point p; p.x = 3; p.y = 4; "%d\\n", p.x * p.x + p.y * p.y;', c: 'typedef struct { I64 x; I64 y; } Point; Point p; p.x = 3; p.y = 4; printf("%lld\\n", p.x*p.x+p.y*p.y);' },
  { name: "ternary and logic", hc: 'I64 x = 5; "%d %d %d %d\\n", x > 3 ? 100 : 200, !x, x && 0, x || 0;', c: 'I64 x = 5; printf("%lld %d %d %d\\n", x > 3 ? 100LL : 200LL, !x, x && 0, x || 0);' },
  { name: "primes up to 30", hc: 'I64 n, d; for (n = 2; n <= 30; n++) { Bool p = TRUE; for (d = 2; d * d <= n; d++) if (n % d == 0) { p = FALSE; break; } if (p) "%d ", n; } "\\n";', c: 'I64 n,d; for (n=2;n<=30;n++){ int p=1; for(d=2;d*d<=n;d++) if(n%d==0){p=0;break;} if(p) printf("%lld ", n);} printf("\\n");' },
  { name: "#define", hc: '#define SIZE 4\nI64 i, s = 0; for (i = 0; i < SIZE; i++) s += i * i; "%d\\n", s;', c: '#define SIZE 4\nI64 i, s = 0; for (i = 0; i < SIZE; i++) s += i * i; printf("%lld\\n", s);' },
  { name: "multi-line comments and escapes", hc: '/* a comment\n spanning lines */\n"tab:\\t|quote:\\"|percent:%%\\n"; // trailing', c: 'printf("tab:\\t|quote:\\"|percent:%%\\n");' },
  { name: "casts and wrap", hc: 'I64 big = 300; "%d %d\\n", (U8)big, (I8)200;', c: 'I64 big = 300; printf("%d %d\\n", (U8)big, (signed char)200);' },
  { name: "compound assignment", hc: 'I64 x = 10; x += 5; x -= 3; x *= 2; x /= 4; x %= 4; x <<= 3; x >>= 1; x |= 1; x &= 7; x ^= 2; "%d\\n", x;', c: 'I64 x = 10; x += 5; x -= 3; x *= 2; x /= 4; x %= 4; x <<= 3; x >>= 1; x |= 1; x &= 7; x ^= 2; printf("%lld\\n", x);' },
];
// programs the interpreter must refuse, with a message that mentions this text
const refuse = [
  ['I64 x = 1 / 0; "%d\\n", x;', "Divide by zero"], ['"%d\\n", y;', "'y' is not defined"], ['Foo;', "not defined"], ['I64 a[3]; a[5] = 1;', "outside the array"],
  ['while (TRUE) { }', "too many steps"], ['"%d\\n", "text";', "needs an integer"], ['"%d\\n";', "more arguments"], ['"%d\\n", 1, 2;', "More arguments"],
  ['I64 *p;', "Pointers"], ['asm { }', "not supported"], ['"unterminated', "never closed"], ['I64 F(I64 n) { return F(n + 1); } F(0);', "nested too deeply"],
  ['@', "Unexpected character"], ['U0 x;', "cannot hold"], ['I64 Add(I64 a, I64 b) { return a + b; } Add(1);', "has no default"], ['#include "x.HC"', "not supported"],
];

let bad = 0, compared = 0;
const gcc = (() => { try { cp.execSync("gcc --version", { stdio: "ignore" }); return true; } catch (e) { return false; } })();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hccheck-"));
cases.forEach((c, i) => {
  const r = HC.run(c.hc);
  if (!r.ok) { bad++; console.log("FAIL", c.name, "=> error:", r.error); return; }
  let want = c.expect;
  if (want === undefined && c.c !== undefined) {
    if (!gcc) { console.log("skip (no gcc):", c.name); return; }
    const defs = (c.c.match(/^#define.*$/gm) || []).join("\n"), rest = c.c.replace(/^#define.*$/gm, "");
    const body = c.main !== undefined ? rest + "\nint main(void){ " + c.main + " return 0; }\n" : "int main(void){ " + rest + " return 0; }\n";
    const src = C_HEAD + defs + "\n" + body;
    const f = path.join(tmp, "t" + i + ".c"), exe = path.join(tmp, "t" + i);
    fs.writeFileSync(f, src);
    try { cp.execSync("gcc -O0 -w -o " + exe + " " + f + " -lm", { stdio: "pipe" }); want = cp.execSync(exe, { encoding: "utf8" }); compared++; }
    catch (e) { bad++; console.log("FAIL", c.name, "=> the C translation did not compile or run:", String(e.stderr || e.message).slice(0, 200)); return; }
  }
  if (r.out !== want) { bad++; console.log("FAIL", c.name, "\n  interpreter:", JSON.stringify(r.out), "\n  expected:   ", JSON.stringify(want)); }
});
refuse.forEach(([src, frag]) => {
  const r = HC.run(src);
  if (r.ok || !new RegExp(frag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(r.error)) { bad++; console.log("FAIL should refuse:", JSON.stringify(src.slice(0, 50)), "=>", r.ok ? "ran" : r.error); }
});
// output is kept when a program fails part-way, and errors carry a line number
const part = HC.run('"first\\n";\n"second\\n";\nI64 x = 1 / 0;'); if (part.ok || part.out !== "first\nsecond\n" || part.line !== 3) { bad++; console.log("FAIL: partial output / line number", JSON.stringify(part)); }
fs.rmSync(tmp, { recursive: true, force: true });
console.log(bad ? `${bad} FAILURE(S)` : `ok: ${cases.length} programs ran correctly (${compared} compared with gcc-compiled C, the rest against fixed expected output), ${refuse.length} bad programs refused with a clear message, partial output and line numbers kept`);
process.exit(bad ? 1 : 0);
