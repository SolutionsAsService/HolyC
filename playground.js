// The playground: runs the program in the textarea with the subset interpreter (holyc-core.js). Nothing is sent anywhere.
(function () {
  "use strict";
  var form = document.getElementById("play-form");
  if (!form || !window.HolyC) return;
  var src = document.getElementById("src"), out = document.getElementById("result");
  Array.prototype.forEach.call(document.querySelectorAll(".js-only"), function (el) { el.hidden = false; });
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  function run() {
    var text = src.value;
    if (!text.trim()) { out.innerHTML = '<div class="errbox"><p>Type a program first, for example <code>"Hello, world!\\n";</code></p></div>'; return; }
    var r;
    try { r = window.HolyC.run(text); } catch (e) { r = { ok: false, out: "", error: "The interpreter hit an internal problem with this program. Please report it.", steps: 0 }; }
    var body = r.out ? esc(r.out) : '<span class="muted">(no output)</span>';
    if (r.ok) {
      out.innerHTML = '<div class="okbox"><pre aria-label="Output">' + body + '</pre><p class="meta">Ran in this page\'s interpreter, ' + r.steps + ' steps. Not run on TempleOS.</p></div>';
    } else {
      out.innerHTML = '<div class="okbox"><pre aria-label="Output so far">' + body + '</pre></div><div class="errbox" role="alert"><p><strong>Stopped.</strong> ' + esc(r.error) + '</p></div>';
    }
    try { out.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { /* ignore */ }
  }
  form.addEventListener("submit", function (ev) { ev.preventDefault(); run(); });
  src.addEventListener("keydown", function (ev) { if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); run(); } });
  Array.prototype.forEach.call(document.querySelectorAll(".chip.ex"), function (b) {
    b.addEventListener("click", function () { src.value = b.getAttribute("data-code"); run(); });
  });
})();
