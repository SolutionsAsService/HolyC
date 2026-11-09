// A small interpreter for a SUBSET of HolyC, the language of TempleOS. It is not TempleOS and not Terry Davis's compiler:
// it runs the code on this page with the semantics the site documents, so a reader can try short programs. It supports
// the integer and F64 types, strings, arrays of numbers, simple classes, functions with default arguments, calls without
// parentheses, string-literal print statements, and the usual C control flow. Anything else is refused with a message.
// Integers are 64-bit signed with wrap-around (BigInt); the operators use C precedence.
(function (root) {
  "use strict";

  function HCError(msg, line) { this.name = "HCError"; this.message = (line ? "Line " + line + ": " : "") + msg; this.line = line || 0; }
  HCError.prototype = Object.create(Error.prototype);

  var TYPES = { U0: { k: "void" }, Bool: { k: "i", b: 8, s: false }, I8: { k: "i", b: 8, s: true }, U8: { k: "i", b: 8, s: false }, I16: { k: "i", b: 16, s: true }, U16: { k: "i", b: 16, s: false },
    I32: { k: "i", b: 32, s: true }, U32: { k: "i", b: 32, s: false }, I64: { k: "i", b: 64, s: true }, U64: { k: "i", b: 64, s: false }, F64: { k: "f" } };
  var STEP_LIMIT = 3000000, OUT_LIMIT = 8000, DEPTH_LIMIT = 400, CELL_LIMIT = 1000000;

  // ---- lexer -----------------------------------------------------------------------------------------------------
  function lex(src) {
    var toks = [], i = 0, n = src.length, line = 1;
    var ops3 = ["<<=", ">>="], ops2 = ["==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<", ">>", "->"];
    while (i < n) {
      var c = src[i];
      if (c === "\n") { line++; i++; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
      if (c === "/" && src[i + 1] === "*") { var e = src.indexOf("*/", i + 2); if (e < 0) throw new HCError("A /* comment is never closed.", line); for (var q = i; q < e; q++) if (src[q] === "\n") line++; i = e + 2; continue; }
      if (c === "#") { var eol = src.indexOf("\n", i); if (eol < 0) eol = n; toks.push({ t: "pp", v: src.slice(i, eol).trim(), line: line }); i = eol; continue; }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
        var m = src.slice(i).match(/^(0[xX][0-9a-fA-F]+|[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?|[0-9]+\.([eE][+-]?[0-9]+)?|[0-9]+[eE][+-]?[0-9]+|[0-9]+)/);
        var txt = m[0]; i += txt.length;
        if (/^0[xX]/.test(txt) || !/[.eE]/.test(txt)) {
          var iv = BigInt(txt);
          if (iv > 18446744073709551615n) throw new HCError("The number " + txt.slice(0, 24) + (txt.length > 24 ? "..." : "") + " does not fit in 64 bits.", line);
          toks.push({ t: "num", v: iv, line: line });
        } else toks.push({ t: "num", v: parseFloat(txt), line: line });
        continue;
      }
      if (/[A-Za-z_]/.test(c)) { var j = i; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++; toks.push({ t: "id", v: src.slice(i, j), line: line }); i = j; continue; }
      if (c === '"') {
        var s = ""; i++;
        while (i < n && src[i] !== '"') {
          if (src[i] === "\n") throw new HCError("A string is not closed on its line.", line);
          if (src[i] === "\\") { var d = src[i + 1]; var map = { n: "\n", t: "\t", "\\": "\\", '"': '"', "0": "\0", r: "\r", "'": "'" }; if (!(d in map)) throw new HCError("Unsupported escape \\" + d + " in a string.", line); s += map[d]; i += 2; }
          else { s += src[i]; i++; }
        }
        if (i >= n) throw new HCError("A string is never closed.", line);
        i++; toks.push({ t: "str", v: s, line: line }); continue;
      }
      if (c === "'") {
        var body = "", k = i + 1;
        while (k < n && src[k] !== "'") { if (src[k] === "\\") { var dd = src[k + 1]; var mp = { n: "\n", t: "\t", "\\": "\\", "'": "'", "0": "\0", '"': '"' }; if (!(dd in mp)) throw new HCError("Unsupported escape in a character constant.", line); body += mp[dd]; k += 2; } else { body += src[k]; k++; } }
        if (k >= n) throw new HCError("A character constant is never closed.", line);
        if (body.length !== 1) throw new HCError("Only one-character constants are supported here.", line);
        toks.push({ t: "num", v: BigInt(body.charCodeAt(0)), line: line }); i = k + 1; continue;
      }
      var op = ops3.indexOf(src.substr(i, 3)) > -1 ? src.substr(i, 3) : (ops2.indexOf(src.substr(i, 2)) > -1 ? src.substr(i, 2) : c);
      if ("+-*/%<>=!&|^~?:;,.(){}[]".indexOf(op[0]) < 0) throw new HCError("Unexpected character " + JSON.stringify(c) + ".", line);
      toks.push({ t: "op", v: op, line: line }); i += op.length;
    }
    toks.push({ t: "eof", v: "", line: line });
    return toks;
  }

  // ---- parser ----------------------------------------------------------------------------------------------------
  function parse(src) {
    var toks = lex(src), p = 0, classes = {};
    var peek = function (o) { return toks[p + (o || 0)]; };
    var isOp = function (v, o) { var t = peek(o); return t.t === "op" && t.v === v; };
    var isId = function (v, o) { var t = peek(o); return t.t === "id" && (v === undefined || t.v === v); };
    var next = function () { return toks[p++]; };
    var fail = function (m, t) { throw new HCError(m, (t || peek()).line); };
    var expect = function (v) { if (!isOp(v)) fail("Expected '" + v + "' but found '" + (peek().v === "" ? "end of input" : peek().v) + "'."); return next(); };
    var isTypeName = function (t) { return t && t.t === "id" && (TYPES[t.v] || classes[t.v]); };

    function parseType() {
      var t = next(), ty = TYPES[t.v] || classes[t.v] ? { name: t.v, ptr: 0 } : null;
      if (!ty) fail("Unknown type '" + t.v + "'.", t);
      while (isOp("*")) { next(); ty.ptr++; }
      return ty;
    }

    function parseProgram() { var items = []; while (peek().t !== "eof") items.push(parseItem()); return items; }

    function parseItem() {
      var t = peek();
      if (t.t === "pp") { next(); var m = t.v.match(/^#define\s+([A-Za-z_]\w*)\s+(.+)$/); if (m) return { k: "define", name: m[1], text: m[2], line: t.line }; if (/^#define/.test(t.v)) throw new HCError("In this subset a #define must have a single value: a number, a string or a name.", t.line); throw new HCError("Preprocessor lines other than #define are not supported here.", t.line); }
      if (isId("class")) return parseClass();
      if (isId("public") || isId("extern") || isId("static")) next();
      if (isTypeName(peek())) {
        // function definition: Type name ( ... ) {
        var save = p; var ty = parseType();
        if (peek().t === "id" && isOp("(", 1)) {
          var name = next().v; next(); var params = [];
          if (!isOp(")")) {
            if (isId("U0") && isOp(")", 1)) next();
            else do {
              var pt = parseType(); var pname = next(); if (pname.t !== "id") fail("Expected a parameter name.", pname);
              var def = null; if (isOp("=")) { next(); def = parseAssign(); }
              params.push({ ty: pt, name: pname.v, def: def });
            } while (isOp(",") && next());
          }
          expect(")");
          if (isOp(";")) { next(); return { k: "proto", name: name, line: t.line }; }
          var body = parseBlock();
          return { k: "func", name: name, ret: ty, params: params, body: body, line: t.line };
        }
        p = save;
      }
      return parseStmt();
    }

    function parseClass() {
      var t = next(); var name = next(); if (name.t !== "id") fail("Expected a class name.", name);
      classes[name.v] = { fields: [] };
      expect("{"); var fields = [];
      while (!isOp("}")) {
        var ty = parseType();
        do { var f = next(); if (f.t !== "id") fail("Expected a member name.", f); if (isOp("[")) fail("Array members are not supported here.", f); fields.push({ ty: ty, name: f.v }); } while (isOp(",") && next());
        expect(";");
      }
      expect("}"); if (isOp(";")) next();
      classes[name.v].fields = fields;
      return { k: "class", name: name.v, fields: fields, line: t.line };
    }

    function parseBlock() { var l = expect("{").line; var body = []; while (!isOp("}")) { if (peek().t === "eof") fail("A { is never closed.", { line: l }); body.push(parseStmt()); } next(); return { k: "block", body: body, line: l }; }

    function parseDecl() {
      var line = peek().line, ty = parseType(), decls = [];
      do {
        var ptr = ty.ptr; while (isOp("*")) { next(); ptr++; }
        var nm = next(); if (nm.t !== "id") fail("Expected a variable name.", nm);
        var d = { name: nm.v, ty: { name: ty.name, ptr: ptr }, size: null, init: null, line: nm.line };
        if (isOp("[")) { next(); d.size = isOp("]") ? -1 : parseAssign(); expect("]"); }
        if (isOp("=")) { next(); if (isOp("{")) { next(); var items = []; while (!isOp("}")) { items.push(parseAssign()); if (isOp(",")) next(); else break; } expect("}"); d.init = { k: "list", items: items }; } else d.init = parseAssign(); }
        decls.push(d);
      } while (isOp(",") && next());
      expect(";");
      return { k: "decl", decls: decls, line: line };
    }

    var C_TYPES = { int: "I64 (or I32 for 32 bits)", char: "U8 (or I8 for a signed one)", float: "F64", double: "F64", long: "I64", short: "I16", void: "U0", unsigned: "U64, U32, U16 or U8", bool: "Bool", size_t: "U64" };
    function parseStmt() {
      var t = peek();
      if (t.t === "id" && Object.prototype.hasOwnProperty.call(C_TYPES, t.v) && (peek(1).t === "id" || isOp("*", 1))) fail("HolyC has no '" + t.v + "' type; use " + C_TYPES[t.v] + ". (The integer types are I8 to I64 and U8 to U64.)", t);
      if (t.t === "pp") return parseItem();
      if (t.t === "op" && t.v === "{") return parseBlock();
      if (t.t === "op" && t.v === ";") { next(); return { k: "empty", line: t.line }; }
      if (t.t === "str") {
        next(); var args = [];
        while (isOp(",")) { next(); args.push(parseAssign()); }
        expect(";"); return { k: "print", fmt: t.v, args: args, line: t.line };
      }
      if (t.t === "id") {
        if (t.v === "if") { next(); expect("("); var c = parseExpr(); expect(")"); var th = parseStmt(), el = null; if (isId("else")) { next(); el = parseStmt(); } return { k: "if", c: c, th: th, el: el, line: t.line }; }
        if (t.v === "while") { next(); expect("("); var cw = parseExpr(); expect(")"); return { k: "while", c: cw, body: parseStmt(), line: t.line }; }
        if (t.v === "do") { next(); var bd = parseStmt(); if (!isId("while")) fail("Expected 'while' after the body of do."); next(); expect("("); var cd = parseExpr(); expect(")"); expect(";"); return { k: "dowhile", c: cd, body: bd, line: t.line }; }
        if (t.v === "for") {
          next(); expect("("); var init = null, cond = null, step = null;
          if (!isOp(";")) init = isTypeName(peek()) ? parseDecl() : (function () { var ex = parseExpr(); expect(";"); return { k: "expr", e: ex, line: t.line }; })(); else next();
          if (!isOp(";")) cond = parseExpr(); expect(";");
          if (!isOp(")")) step = parseExpr(); expect(")");
          return { k: "for", init: init, cond: cond, step: step, body: parseStmt(), line: t.line };
        }
        if (t.v === "switch") {
          next(); expect("("); var sv = parseExpr(); expect(")"); expect("{"); var cases = [];
          while (!isOp("}")) {
            var cur;
            if (isId("case")) { next(); var lab = parseTernary(); expect(":"); cur = { label: lab, body: [] }; }
            else if (isId("default")) { next(); expect(":"); cur = { label: null, body: [] }; }
            else fail("Expected 'case' or 'default'.");
            while (!isOp("}") && !isId("case") && !isId("default")) cur.body.push(parseStmt());
            cases.push(cur);
          }
          next(); return { k: "switch", v: sv, cases: cases, line: t.line };
        }
        if (t.v === "break") { next(); expect(";"); return { k: "break", line: t.line }; }
        if (t.v === "continue") { next(); expect(";"); return { k: "continue", line: t.line }; }
        if (t.v === "return") { next(); var rv = null; if (!isOp(";")) rv = parseExpr(); expect(";"); return { k: "return", e: rv, line: t.line }; }
        if (t.v === "goto" || t.v === "try" || t.v === "lock" || t.v === "asm") fail("'" + t.v + "' is not supported by this subset.", t);
        if (isTypeName(t) && !isOp("(", 1)) return parseDecl();
      }
      var e = parseExpr(); expect(";");
      return { k: "expr", e: e, line: t.line };
    }

    // expressions (C precedence)
    function parseExpr() { return parseAssign(); }
    function parseAssign() {
      var l = parseTernary(); var t = peek();
      if (t.t === "op" && /^(=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=)$/.test(t.v)) { next(); var r = parseAssign(); return { k: "assign", op: t.v, l: l, r: r, line: t.line }; }
      return l;
    }
    function parseTernary() { var c = parseBin(0); if (isOp("?")) { var t = next(); var a = parseAssign(); expect(":"); var b = parseAssign(); return { k: "cond", c: c, a: a, b: b, line: t.line }; } return c; }
    var LEVELS = [["||"], ["&&"], ["|"], ["^"], ["&"], ["==", "!="], ["<", ">", "<=", ">="], ["<<", ">>"], ["+", "-"], ["*", "/", "%"]];
    function parseBin(lv) {
      if (lv >= LEVELS.length) return parseUnary();
      var l = parseBin(lv + 1);
      while (peek().t === "op" && LEVELS[lv].indexOf(peek().v) > -1) { var o = next(); var r = parseBin(lv + 1); l = { k: "bin", op: o.v, l: l, r: r, line: o.line }; }
      return l;
    }
    function parseUnary() {
      var t = peek();
      if (t.t === "op" && (t.v === "!" || t.v === "~" || t.v === "-" || t.v === "+")) { next(); return { k: "un", op: t.v, e: parseUnary(), line: t.line }; }
      if (t.t === "op" && (t.v === "++" || t.v === "--")) { next(); return { k: "pre", op: t.v, e: parseUnary(), line: t.line }; }
      if (t.t === "op" && (t.v === "&" || t.v === "*")) fail("Pointers and the address-of operator are not supported by this subset.", t);
      if (t.t === "op" && t.v === "(" && isTypeName(peek(1)) && !isOp("*", 2) ) { var save = p; next(); var ty = parseType(); if (isOp(")")) { next(); return { k: "cast", ty: ty, e: parseUnary(), line: t.line }; } p = save; }
      return parsePostfix();
    }
    function parsePostfix() {
      var e = parsePrimary();
      for (;;) {
        var t = peek();
        if (t.t === "op" && t.v === "(") {
          next(); var args = [];
          if (!isOp(")")) { for (;;) { if (isOp(",")) { args.push(null); next(); continue; } args.push(parseAssign()); if (isOp(",")) { next(); if (isOp(")")) args.push(null); continue; } break; } }
          expect(")"); e = { k: "call", f: e, args: args, line: t.line };
        }
        else if (t.t === "op" && t.v === "[") { next(); var ix = parseExpr(); expect("]"); e = { k: "index", e: e, i: ix, line: t.line }; }
        else if (t.t === "op" && t.v === ".") { next(); var nm = next(); if (nm.t !== "id") fail("Expected a member name.", nm); e = { k: "member", e: e, name: nm.v, line: t.line }; }
        else if (t.t === "op" && (t.v === "++" || t.v === "--")) { next(); e = { k: "post", op: t.v, e: e, line: t.line }; }
        else break;
      }
      return e;
    }
    function parsePrimary() {
      var t = next();
      if (t.t === "num") return { k: "num", v: t.v, line: t.line };
      if (t.t === "str") return { k: "str", v: t.v, line: t.line };
      if (t.t === "id") return { k: "id", name: t.v, line: t.line };
      if (t.t === "op" && t.v === "(") { var e = parseExpr(); expect(")"); return e; }
      fail("Unexpected '" + (t.v === "" ? "end of input" : t.v) + "'.", t);
    }
    return parseProgram();
  }

  // ---- values and evaluation -------------------------------------------------------------------------------------
  function wrap(ty, v) { return ty.s ? BigInt.asIntN(ty.b, v) : BigInt.asUintN(ty.b, v); }
  var isInt = function (v) { return typeof v === "bigint"; };
  var isNum = function (v) { return typeof v === "bigint" || typeof v === "number"; };
  var asF = function (v) { return typeof v === "bigint" ? Number(v) : v; };

  function convert(ty, v, line, what) {
    if (ty.ptr > 0) { if (ty.name === "U8" && ty.ptr === 1 && (typeof v === "string" || v === 0n)) return v; throw new HCError("Pointers other than U8 * strings are not supported here.", line); }
    var T = TYPES[ty.name];
    if (!T) { if (v && v.cls === ty.name) return v; throw new HCError("Cannot store that in a " + ty.name + ".", line); }
    if (T.k === "void") throw new HCError("A U0 cannot hold a value.", line);
    if (!isNum(v)) throw new HCError("Cannot store " + (typeof v === "string" ? "a string" : "that") + " in " + (what || ty.name) + ".", line);
    if (T.k === "f") return asF(v);
    if (typeof v === "number") { if (!isFinite(v)) throw new HCError("Cannot store infinity or NaN in an integer.", line); v = BigInt(Math.trunc(v)); }
    if (ty.name === "Bool") return v !== 0n ? 1n : 0n;
    return wrap(T, v);
  }

  function fixed(x, prec) {
    var s = Math.abs(x) >= 1e21 && isFinite(x) ? BigInt(Math.trunc(Math.abs(x))).toString() + (prec > 0 ? "." + "0".repeat(prec) : "") : Math.abs(x).toFixed(prec);
    if (x < 0 || Object.is(x, -0)) s = "-" + s;
    if (prec <= 15 && isFinite(x)) {
      var t = Math.abs(x) * Math.pow(10, prec), fl = Math.floor(t);
      if (t - fl === 0.5 && t < 9007199254740992) {
        var n = fl % 2 === 0 ? fl : fl + 1;
        var digits = String(n); while (digits.length <= prec) digits = "0" + digits;
        s = (x < 0 ? "-" : "") + (prec > 0 ? digits.slice(0, digits.length - prec) + "." + digits.slice(digits.length - prec) : digits);
      }
    }
    return s;
  }

  function formatOut(fmt, args, line) {
    var out = "", ai = 0, i = 0;
    while (i < fmt.length) {
      var c = fmt[i];
      if (c !== "%") { out += c; i++; continue; }
      var m = fmt.slice(i).match(/^%([-+0 ]*)(\d+)?(?:\.(\d+))?([dusxXcfp%])/);
      if (!m) throw new HCError("Unsupported format spec at '" + fmt.slice(i, i + 4) + "'. This subset supports %d %u %x %X %c %s %f %%.", line);
      i += m[0].length;
      var flags = m[1], width = m[2] ? parseInt(m[2], 10) : 0, prec = m[3] !== undefined ? parseInt(m[3], 10) : null, ty = m[4];
      if (ty === "%") { out += "%"; continue; }
      if (ai >= args.length) throw new HCError("The format string asks for more arguments than were given.", line);
      var a = args[ai++], s;
      if (ty === "d" || ty === "u") { if (!isInt(a)) throw new HCError("%" + ty + " needs an integer.", line); s = (ty === "u" ? BigInt.asUintN(64, a) : a).toString(); if (flags.indexOf("+") > -1 && a >= 0n) s = "+" + s; else if (flags.indexOf(" ") > -1 && a >= 0n) s = " " + s; }
      else if (ty === "x" || ty === "X") { if (!isInt(a)) throw new HCError("%" + ty + " needs an integer.", line); s = BigInt.asUintN(64, a).toString(16); if (ty === "X") s = s.toUpperCase(); }
      else if (ty === "c") { if (!isInt(a)) throw new HCError("%c needs an integer.", line); s = String.fromCharCode(Number(BigInt.asUintN(8, a))); }
      else if (ty === "s") { if (typeof a !== "string") throw new HCError("%s needs a string.", line); s = prec !== null ? a.slice(0, prec) : a; }
      else if (ty === "f") { if (!isNum(a)) throw new HCError("%f needs a number.", line); s = fixed(asF(a), prec !== null ? prec : 6); if (flags.indexOf("+") > -1 && asF(a) >= 0) s = "+" + s; }
      else throw new HCError("%p is not supported here.", line);
      if (s.length < width) { if (flags.indexOf("-") > -1) s = s + " ".repeat(width - s.length); else if (flags.indexOf("0") > -1 && ty !== "s" && ty !== "c") { var neg = /^[-+]/.test(s) ? s[0] : ""; s = neg + "0".repeat(width - s.length) + s.slice(neg.length); } else s = " ".repeat(width - s.length) + s; }
      out += s;
    }
    if (ai < args.length) throw new HCError("More arguments were given than the format string uses.", line);
    return out;
  }

  function run(src) {
    var out = "", steps = 0, depth = 0;
    var globals = Object.create(null), funcs = Object.create(null), classes = Object.create(null), defines = Object.create(null);
    var BRK = { k: "break" }, CNT = { k: "continue" }, cells = 0;
    function emit(s, line) { out += s; if (out.length > OUT_LIMIT) { out = out.slice(0, OUT_LIMIT); throw new HCError("Output limit reached (" + OUT_LIMIT + " characters); the program printed too much.", line); } }
    function tick(line) { if (++steps > STEP_LIMIT) throw new HCError("Stopped after too many steps. Is there an infinite loop?", line); }

    var builtins = {
      Print: function (a, line) { if (typeof a[0] !== "string") throw new HCError("Print needs a format string first.", line); emit(formatOut(a[0], a.slice(1), line), line); return 0n; },
      PutChars: function (a, line) { if (!isInt(a[0])) throw new HCError("PutChars needs a character.", line); emit(String.fromCharCode(Number(BigInt.asUintN(8, a[0]))), line); return 0n; },
      StrLen: function (a, line) { if (typeof a[0] !== "string") throw new HCError("StrLen needs a string.", line); return BigInt(a[0].length); },
      Sqrt: function (a, line) { if (!isNum(a[0])) throw new HCError("Sqrt needs a number.", line); return Math.sqrt(asF(a[0])); },
      Sin: function (a) { return Math.sin(asF(a[0])); }, Cos: function (a) { return Math.cos(asF(a[0])); },
      Abs: function (a, line) { if (!isNum(a[0])) throw new HCError("Abs needs a number.", line); return isInt(a[0]) ? (a[0] < 0n ? -a[0] : a[0]) : Math.abs(a[0]); },
      Min: function (a) { return (isInt(a[0]) && isInt(a[1])) ? (a[0] < a[1] ? a[0] : a[1]) : Math.min(asF(a[0]), asF(a[1])); },
      Max: function (a) { return (isInt(a[0]) && isInt(a[1])) ? (a[0] > a[1] ? a[0] : a[1]) : Math.max(asF(a[0]), asF(a[1])); }
    };
    var consts = { TRUE: 1n, FALSE: 0n, NULL: 0n };

    function suggest(name) {
      var low = name.toLowerCase(), pools = [Object.keys(builtins), Object.keys(funcs), Object.keys(globals), Object.keys(TYPES)];
      for (var i = 0; i < pools.length; i++) for (var j = 0; j < pools[i].length; j++) if (pools[i][j].toLowerCase() === low && pools[i][j] !== name) return " Did you mean " + pools[i][j] + "? (HolyC is case-sensitive.)";
      return "";
    }
    function lookup(scopes, name, line) {
      for (var i = scopes.length - 1; i >= 0; i--) if (name in scopes[i]) return scopes[i][name];
      if (name in globals) return globals[name];
      return undefined;
    }
    function zero(ty, line) {
      if (ty.ptr > 0) return 0n;
      var T = TYPES[ty.name];
      if (T) return T.k === "f" ? 0 : 0n;
      var c = classes[ty.name]; if (!c) throw new HCError("Unknown type " + ty.name + ".", line);
      var o = { cls: ty.name, f: Object.create(null) }; c.fields.forEach(function (f) { o.f[f.name] = zero(f.ty, line); }); return o;
    }

    function evalExpr(e, sc) {
      tick(e.line);
      switch (e.k) {
        case "num": return e.v;
        case "str": return e.v;
        case "id": {
          var cell = lookup(sc, e.name, e.line);
          if (cell) return cell.v;
          if (e.name in consts) return consts[e.name];
          if (e.name in defines) return evalExpr(defines[e.name], sc);
          throw new HCError("'" + e.name + "' is not defined here." + suggest(e.name), e.line);
        }
        case "un": {
          var v = evalExpr(e.e, sc);
          if (e.op === "!") return (isInt(v) ? v === 0n : v === 0) ? 1n : 0n;
          if (!isNum(v)) throw new HCError("Operator " + e.op + " needs a number.", e.line);
          if (e.op === "-") return isInt(v) ? BigInt.asIntN(64, -v) : -v;
          if (e.op === "+") return v;
          if (!isInt(v)) throw new HCError("~ needs an integer.", e.line);
          return BigInt.asIntN(64, ~v);
        }
        case "cast": { return convert(e.ty, evalExpr(e.e, sc), e.line); }
        case "bin": return binary(e, sc);
        case "cond": return truthy(evalExpr(e.c, sc)) ? evalExpr(e.a, sc) : evalExpr(e.b, sc);
        case "assign": return assign(e, sc);
        case "pre": case "post": {
          var ref = refOf(e.e, sc), old = ref.get();
          if (!isNum(old)) throw new HCError("++ and -- need a number.", e.line);
          var nv = isInt(old) ? (e.op === "++" ? old + 1n : old - 1n) : (e.op === "++" ? old + 1 : old - 1);
          ref.set(nv); return e.k === "pre" ? ref.get() : old;
        }
        case "index": {
          var base = evalExpr(e.e, sc), ix = evalExpr(e.i, sc);
          if (!isInt(ix)) throw new HCError("An index must be an integer.", e.line);
          if (typeof base === "string") { var k = Number(ix); if (k < 0 || k > base.length) throw new HCError("Index " + k + " is outside the string.", e.line); return k === base.length ? 0n : BigInt(base.charCodeAt(k)); }
          if (base && base.arr) { var j = Number(ix); if (j < 0 || j >= base.arr.length) throw new HCError("Index " + j + " is outside the array (size " + base.arr.length + ").", e.line); return base.arr[j]; }
          throw new HCError("That cannot be indexed.", e.line);
        }
        case "member": {
          var o = evalExpr(e.e, sc);
          if (!o || !o.f) throw new HCError("That has no members.", e.line);
          if (!(e.name in o.f)) throw new HCError("Class " + o.cls + " has no member '" + e.name + "'.", e.line);
          return o.f[e.name];
        }
        case "call": return call(e, sc);
      }
      throw new HCError("Cannot evaluate that.", e.line);
    }
    function truthy(v) { return isInt(v) ? v !== 0n : (typeof v === "number" ? v !== 0 : true); }
    function binary(e, sc) {
      if (e.op === "&&") { var l1 = evalExpr(e.l, sc); return truthy(l1) && truthy(evalExpr(e.r, sc)) ? 1n : 0n; }
      if (e.op === "||") { var l2 = evalExpr(e.l, sc); return truthy(l2) || truthy(evalExpr(e.r, sc)) ? 1n : 0n; }
      var a = evalExpr(e.l, sc), b = evalExpr(e.r, sc), op = e.op;
      if (!isNum(a) || !isNum(b)) {
        if ((op === "==" || op === "!=") && typeof a === "string" && typeof b === "string") return (op === "==") === (a === b) ? 1n : 0n;
        throw new HCError("Operator " + op + " needs numbers.", e.line);
      }
      if (isInt(a) && isInt(b)) {
        switch (op) {
          case "+": return BigInt.asIntN(64, a + b); case "-": return BigInt.asIntN(64, a - b); case "*": return BigInt.asIntN(64, a * b);
          case "/": if (b === 0n) throw new HCError("Divide by zero.", e.line); return BigInt.asIntN(64, a / b);
          case "%": if (b === 0n) throw new HCError("Divide by zero.", e.line); return a % b;
          case "&": return a & b; case "|": return a | b; case "^": return a ^ b;
          case "<<": if (b < 0n || b > 63n) throw new HCError("A shift must be between 0 and 63.", e.line); return BigInt.asIntN(64, a << b);
          case ">>": if (b < 0n || b > 63n) throw new HCError("A shift must be between 0 and 63.", e.line); return a >> b;
          case "==": return a === b ? 1n : 0n; case "!=": return a !== b ? 1n : 0n; case "<": return a < b ? 1n : 0n; case ">": return a > b ? 1n : 0n; case "<=": return a <= b ? 1n : 0n; case ">=": return a >= b ? 1n : 0n;
        }
      }
      var x = asF(a), y = asF(b);
      switch (op) {
        case "+": return x + y; case "-": return x - y; case "*": return x * y; case "/": if (y === 0) throw new HCError("Divide by zero.", e.line); return x / y;
        case "==": return x === y ? 1n : 0n; case "!=": return x !== y ? 1n : 0n; case "<": return x < y ? 1n : 0n; case ">": return x > y ? 1n : 0n; case "<=": return x <= y ? 1n : 0n; case ">=": return x >= y ? 1n : 0n;
      }
      throw new HCError("Operator " + op + " needs integers.", e.line);
    }
    function refOf(t, sc) {
      if (t.k === "id") {
        var cell = lookup(sc, t.name, t.line); if (!cell) throw new HCError("'" + t.name + "' is not defined here.", t.line);
        if (cell.ro) throw new HCError("'" + t.name + "' is not a variable that can be assigned.", t.line);
        return { get: function () { return cell.v; }, set: function (v) { cell.v = convert(cell.ty, v, t.line, cell.ty.name + " " + t.name); } };
      }
      if (t.k === "index") {
        var base = evalExpr(t.e, sc), ix = evalExpr(t.i, sc);
        if (!base || !base.arr) throw new HCError("Only arrays can be assigned by index here.", t.line);
        var j = Number(ix); if (!isInt(ix) || j < 0 || j >= base.arr.length) throw new HCError("Index " + j + " is outside the array (size " + base.arr.length + ").", t.line);
        return { get: function () { return base.arr[j]; }, set: function (v) { base.arr[j] = convert(base.ety, v, t.line); } };
      }
      if (t.k === "member") {
        var o = evalExpr(t.e, sc); if (!o || !o.f) throw new HCError("That has no members.", t.line);
        if (!(t.name in o.f)) throw new HCError("Class " + o.cls + " has no member '" + t.name + "'.", t.line);
        var fd = classes[o.cls].fields.filter(function (f) { return f.name === t.name; })[0];
        return { get: function () { return o.f[t.name]; }, set: function (v) { o.f[t.name] = convert(fd.ty, v, t.line); } };
      }
      throw new HCError("That cannot be assigned to.", t.line);
    }
    function assign(e, sc) {
      var ref = refOf(e.l, sc), v = evalExpr(e.r, sc);
      if (e.op !== "=") { var cur = ref.get(); var bin = { k: "bin", op: e.op.slice(0, -1), l: { k: "lit", v: cur }, r: { k: "lit", v: v }, line: e.line }; v = binaryLit(bin); }
      ref.set(v); return ref.get();
    }
    function binaryLit(b) { var sc = []; var save = evalExprLit; return binary({ k: "bin", op: b.op, l: { k: "num", v: b.l.v, line: b.line }, r: { k: "num", v: b.r.v, line: b.line }, line: b.line }, sc); }
    var evalExprLit = null;
    function call(e, sc) {
      var name = e.f.k === "id" ? e.f.name : null;
      if (!name) throw new HCError("Only named functions can be called here.", e.line);
      var f = funcs[name];
      if (!f && name in builtins) {
        var vals = e.args.map(function (a) { if (a === null) throw new HCError("A built-in cannot skip an argument.", e.line); return evalExpr(a, sc); });
        return builtins[name](vals, e.line);
      }
      if (!f) throw new HCError("Function '" + name + "' is not defined" + (name in globals ? " (it is a variable)" : " yet; define it before you use it") + "." + suggest(name), e.line);
      return invoke(f, e.args, sc, e.line);
    }
    function invoke(f, argExprs, sc, line) {
      if (argExprs.length > f.params.length) throw new HCError(f.name + " takes at most " + f.params.length + " argument" + (f.params.length === 1 ? "" : "s") + ".", line);
      if (++depth > DEPTH_LIMIT) throw new HCError("Calls nested too deeply (recursion limit " + DEPTH_LIMIT + ").", line);
      var local = Object.create(null);
      f.params.forEach(function (pm, i) {
        var ex = argExprs[i], v;
        if (ex === undefined || ex === null) { if (!pm.def) throw new HCError("Argument " + (i + 1) + " (" + pm.name + ") of " + f.name + " has no default.", line); v = evalExpr(pm.def, [local]); }
        else v = evalExpr(ex, sc);
        local[pm.name] = { ty: pm.ty, v: convert(pm.ty, v, line, "parameter " + pm.name) };
      });
      var r = execBlock(f.body.body, [local], f);
      depth--;
      if (r && r.k === "return") { if (f.ret.name === "U0" && f.ret.ptr === 0) return 0n; return convert(f.ret, r.v === undefined ? zero(f.ret, line) : r.v, line, "the return value"); }
      return f.ret.name === "U0" ? 0n : zero(f.ret, line);
    }

    function declare(d, sc, line) {
      var scope = sc[sc.length - 1] || globals;
      d.decls.forEach(function (x) {
        if (x.ty.ptr > 0 && !(x.ty.name === "U8" && x.ty.ptr === 1)) throw new HCError("Pointers other than U8 * strings are not supported here.", x.line);
        if (x.ty.ptr === 0 && x.ty.name === "U0") throw new HCError("A U0 cannot hold a value.", x.line);
        if (Object.prototype.hasOwnProperty.call(scope, x.name)) throw new HCError("'" + x.name + "' is already declared in this scope.", x.line);
        if (x.size !== null) {
          var T = TYPES[x.ty.name]; if (!T || T.k === "void" || x.ty.ptr > 0) throw new HCError("Arrays of this type are not supported here.", x.line);
          var init = x.init && x.init.k === "list" ? x.init.items.map(function (it) { return evalExpr(it, sc); }) : null;
          var n = x.size === -1 ? (init ? init.length : 0) : Number(evalExpr(x.size, sc));
          if (!(n >= 0 && n <= 100000)) throw new HCError("Array size must be between 0 and 100000.", x.line);
          cells += n; if (cells > CELL_LIMIT) throw new HCError("Too much memory: the program has allocated more than " + CELL_LIMIT + " array cells in total.", x.line);
          if (init && init.length > n) throw new HCError("Too many initial values for the array.", x.line);
          var arr = []; for (var i = 0; i < n; i++) arr.push(init && i < init.length ? convert(x.ty, init[i], x.line) : (T.k === "f" ? 0 : 0n));
          scope[x.name] = { ty: x.ty, v: { arr: arr, ety: x.ty }, ro: true };
        } else {
          var v = x.init ? evalExpr(x.init, sc) : zero(x.ty, x.line);
          scope[x.name] = { ty: x.ty, v: (x.init ? convert(x.ty, v, x.line, x.ty.name + " " + x.name) : v) };
        }
      });
    }

    function execBlock(list, sc, fn) {
      var scopes = sc.concat([Object.create(null)]);
      for (var i = 0; i < list.length; i++) { var r = exec(list[i], scopes, fn); if (r) return r; }
      return null;
    }
    function exec(s, sc, fn) {
      tick(s.line);
      switch (s.k) {
        case "empty": return null;
        case "block": return execBlock(s.body, sc, fn);
        case "decl": declare(s, sc, s.line); return null;
        case "print": {
          var args = s.args.map(function (a) { return evalExpr(a, sc); });
          emit(formatOut(s.fmt, args, s.line), s.line); return null;
        }
        case "expr": {
          var e = s.e;
          if (e.k === "id") { var f = funcs[e.name]; if (f) { invoke(f, [], sc, e.line); return null; } if (e.name in builtins) { builtins[e.name]([], e.line); return null; } }
          evalExpr(e, sc); return null;
        }
        case "if": { if (truthy(evalExpr(s.c, sc))) return exec(s.th, sc, fn); else if (s.el) return exec(s.el, sc, fn); return null; }
        case "while": { while (truthy(evalExpr(s.c, sc))) { var r = exec(s.body, sc, fn); if (r) { if (r === BRK) break; if (r === CNT) continue; return r; } tick(s.line); } return null; }
        case "dowhile": { do { var r2 = exec(s.body, sc, fn); if (r2) { if (r2 === BRK) break; if (r2 === CNT) continue; return r2; } tick(s.line); } while (truthy(evalExpr(s.c, sc))); return null; }
        case "for": {
          var scopes = sc.concat([Object.create(null)]);
          if (s.init) exec(s.init, scopes, fn);
          while (!s.cond || truthy(evalExpr(s.cond, scopes))) {
            var r3 = exec(s.body, scopes, fn);
            if (r3) { if (r3 === BRK) break; if (r3 !== CNT) return r3; }
            if (s.step) evalExpr(s.step, scopes);
            tick(s.line);
          }
          return null;
        }
        case "switch": {
          var v = evalExpr(s.v, sc), start = -1;
          for (var i = 0; i < s.cases.length; i++) { if (s.cases[i].label !== null && evalExpr(s.cases[i].label, sc) === v) { start = i; break; } }
          if (start < 0) for (var k = 0; k < s.cases.length; k++) if (s.cases[k].label === null) { start = k; break; }
          if (start < 0) return null;
          for (var j = start; j < s.cases.length; j++) { var rr = execBlock(s.cases[j].body, sc, fn); if (rr) { if (rr === BRK) return null; return rr; } }
          return null;
        }
        case "break": return BRK;
        case "continue": return CNT;
        case "return": return { k: "return", v: s.e ? evalExpr(s.e, sc) : undefined };
        case "define": {
          var dt = lex(s.text).filter(function (x) { return x.t !== "eof"; });
          if (dt.length !== 1 || (dt[0].t !== "num" && dt[0].t !== "str" && dt[0].t !== "id")) throw new HCError("In this subset a #define must have a single value: a number, a string or a name.", s.line);
          defines[s.name] = dt[0].t === "id" ? { k: "id", name: dt[0].v, line: s.line } : { k: dt[0].t === "num" ? "num" : "str", v: dt[0].v, line: s.line };
          return null;
        }
        case "class": classes[s.name] = { fields: s.fields }; return null;
        case "func": funcs[s.name] = s; return null;
        case "proto": return null;
      }
      throw new HCError("Cannot run that statement.", s.line);
    }

    try {
      var prog = parse(src);
      prog.forEach(function (item) { var r = exec(item, [], null); if (r && r.k === "return") throw new HCError("return outside a function.", item.line); if (r === BRK || r === CNT) throw new HCError("break or continue outside a loop.", item.line); });
      return { ok: true, out: out, steps: steps };
    } catch (err) {
      if (err instanceof HCError) return { ok: false, out: out, error: err.message, line: err.line, steps: steps };
      if (err instanceof RangeError) return { ok: false, out: out, error: "Calls nested too deeply.", line: 0, steps: steps };
      return { ok: false, out: out, error: "The interpreter hit an internal problem with this program (" + String(err && err.message ? err.message : err).slice(0, 80) + "). Please report it.", line: 0, steps: steps };
    }
  }

  var api = { run: run };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.HolyC = api;
})(typeof window !== "undefined" ? window : this);
