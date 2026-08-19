/* OKLA Livana — shared site behaviours. Idempotent; attribute-driven so React re-renders can't undo it. */
(function () {
  if (window.__oklaSite) return;
  window.__oklaSite = true;

  var PASSWORD = 'OKLA';
  var sentinel = null;

  function gate() {
    if (document.getElementById('okla-gate')) return;
    try { if (sessionStorage.getItem('okla_auth') === '1') return; } catch (e) { return; }
    var g = document.createElement('div');
    g.id = 'okla-gate';
    g.setAttribute('style', 'position:fixed;inset:0;z-index:99999;background:#293028;display:flex;align-items:center;justify-content:center;font-family:Montserrat,sans-serif');
    g.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:22px;width:min(420px,86vw);align-items:flex-start">' +
      '<img src="assets/logo/logo-long-beige.png" alt="OKLA Livana" style="height:26px;width:auto">' +
      '<div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#A8AEA0">Private investor site</div>' +
      '<div style="font-family:\'Zilla Slab\',serif;font-size:30px;line-height:1.1;color:#D8D2C6">Enter password to continue</div>' +
      '<input id="okla-gate-input" type="password" placeholder="Password" style="width:100%;box-sizing:border-box;background:transparent;border:0;border-bottom:2px solid #6B775A;color:#EEF0EF;font-family:Montserrat,sans-serif;font-size:16px;padding:12px 0;outline:none">' +
      '<div id="okla-gate-err" style="font-size:12px;color:#A5543E;min-height:16px"></div>' +
      '<button id="okla-gate-btn" style="border:0;background:#A5543E;color:#EEF0EF;font-family:Montserrat,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;padding:14px 28px;cursor:pointer;text-align:left">Enter</button>' +
      '</div>';
    document.body.appendChild(g);
    var input = g.querySelector('#okla-gate-input');
    var err = g.querySelector('#okla-gate-err');
    function submit() {
      if (input.value.trim().toUpperCase() === PASSWORD) {
        try { sessionStorage.setItem('okla_auth', '1'); } catch (e) {}
        g.remove();
      } else { err.textContent = 'Incorrect password.'; input.value = ''; }
    }
    g.querySelector('#okla-gate-btn').addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    setTimeout(function () { input.focus(); }, 60);
  }

  var lastTop = 0;
  function scrollY() { return lastTop; }

  /* reveal — CSS owns the animation; JS only adds an attribute */
  function checkReveals() {
    var h = window.innerHeight || 800;
    document.querySelectorAll('[data-reveal]:not([data-revealed])').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.94 && r.bottom > -40) el.setAttribute('data-revealed', '1');
    });
  }

  function runCount(el) {
    if (el.getAttribute('data-count-done') === '1') return;
    el.setAttribute('data-count-done', '1');
    var to = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    var dur = 1500, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var v = to * (1 - Math.pow(1 - p, 3));
      el.textContent = pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-NZ')) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function checkCounts() {
    var h = window.innerHeight || 800;
    document.querySelectorAll('[data-count]:not([data-count-done])').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.85 && r.bottom > 0) runCount(el);
    });
  }

  /* ---------- reading progress + chapter rail (all pages) ---------- */
  var prog = null, rail = null, chapters = [];

  function labelFor(sec) {
    var explicit = sec.getAttribute('data-chapter');
    if (explicit) return explicit;
    var heads = sec.querySelectorAll('[style*="ZaridSlab"]');
    for (var i = 0; i < heads.length; i++) {
      /* React re-serializes the style object with spaces, so normalize before matching.
         Accepts the H1/H2/H3/H4 tiers; excludes the 52px counter numerals. */
      var st = (heads[i].getAttribute('style') || '').replace(/\s+/g, '');
      if (!/font-size:(clamp\((40|34|32|30|28|26|22)px|24px)/.test(st)) continue;
      var t = (heads[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (t.length > 2) return t.length > 46 ? t.slice(0, 44).replace(/[\s,—-]+$/, '') + '…' : t;
    }
    return null;
  }

  function isDark(sec) {
    /* React serializes colours as rgb(), never hex — read the computed value. */
    var m = (getComputedStyle(sec).backgroundColor || '').match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!m) return false;
    var lum = 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3];
    return lum < 128;
  }

  /* What is actually BEHIND the rail right now — not which chapter is active.
     The active chapter persists across the image/video bands that follow it,
     so reading its colour leaves the dots inverted over the next light band. */
  function toneAtRail() {
    var y = window.innerHeight / 2;
    var secs = document.querySelectorAll('section');
    for (var i = secs.length - 1; i >= 0; i--) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= y && r.bottom >= y) return isDark(secs[i]) ? 'dark' : 'light';
    }
    return isDark(document.body) ? 'dark' : 'light';
  }

  function buildChrome() {
    if (!document.body) return;
    if (!prog) {
      prog = document.createElement('div');
      prog.className = 'okla-prog';
      prog.innerHTML = '<div class="okla-prog-fill"></div>';
      document.body.appendChild(prog);
    }
    var secs = [].slice.call(document.querySelectorAll('section'));
    /* the hero is the page title, not a chapter */
    if (secs.length) secs.shift();
    var found = [];
    secs.forEach(function (sec, i) {
      if (!sec.id) sec.id = 'ch-' + (i + 1);
      if (sec.getAttribute('data-chapter') === 'skip') return;
      var lab = labelFor(sec);
      if (!lab) return;
      found.push({ sec: sec, label: lab });
    });
    /* fewer than three chapters is not worth a rail — and any rail built for a
       previous DOM (e.g. an accordion panel that has since closed) must go */
    if (found.length < 3) {
      if (rail) { rail.remove(); rail = null; }
      chapters = [];
      return;
    }
    var sig = found.map(function (f) { return f.sec.id + f.label; }).join('|');
    if (rail && rail.getAttribute('data-sig') === sig) { chapters = found; return; }
    if (!rail) {
      rail = document.createElement('nav');
      rail.className = 'okla-rail';
      rail.setAttribute('aria-label', 'Sections');
      document.body.appendChild(rail);
    }
    rail.setAttribute('data-sig', sig);
    rail.innerHTML = found.map(function (f) {
      return '<a href="#' + f.sec.id + '" class="okla-dot"><span class="okla-dot-lab">' +
        f.label.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span></a>';
    }).join('');
    chapters = found;
  }

  function paintProgress() {
    if (!prog) return;
    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, scrollY() / max));
    prog.firstChild.style.width = (p * 100).toFixed(2) + '%';
    prog.setAttribute('data-tone', toneAtRail());
    if (!chapters.length || !rail) return;
    var mid = scrollY() + window.innerHeight * 0.4;
    var active = null;
    chapters.forEach(function (f) { if (f.sec.offsetTop <= mid) active = f; });
    chapters.forEach(function (f, i) {
      var dot = rail.children[i];
      if (!dot) return;
      if (f === active) dot.setAttribute('data-on', '1'); else dot.removeAttribute('data-on');
    });
    /* dots and bar invert over dark sections so they stay visible */
    var tone = toneAtRail();
    if (rail.getAttribute('data-tone') !== tone) {
      rail.setAttribute('data-tone', tone);
      prog.setAttribute('data-tone', tone);
    }
  }

  var ticking = false;
  function frame() {
    ticking = false;
    var y = scrollY();
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var r = el.getBoundingClientRect();
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      var mid = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = 'translate3d(0,' + (-mid * speed).toFixed(1) + 'px,0) scale(1.18)';
    });
    document.querySelectorAll('[data-nav]').forEach(function (n) {
      if (y > 60) n.setAttribute('data-scrolled', '1'); else n.removeAttribute('data-scrolled');
    });
    checkReveals();
    checkCounts();
    paintProgress();
  }
  function onScroll(e) {
    var t = e && e.target;
    if (t && t.nodeType === 1 && typeof t.scrollTop === 'number') lastTop = t.scrollTop;
    else lastTop = window.pageYOffset || (document.scrollingElement ? document.scrollingElement.scrollTop : 0);
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  function boot() {
    gate();
    buildChrome();
    onScroll();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    new MutationObserver(function () { onScroll(); }).observe(document.documentElement, { childList: true, subtree: true });
    /* content can appear and disappear after load (accordion panels), so the
       chapter rail is rebuilt on the same tick as the reveal check */
    setInterval(function () { checkReveals(); checkCounts(); buildChrome(); }, 400);
    /* the template streams in, so chapters appear over the first seconds */
    [300, 900, 2000, 4000].forEach(function (t) {
      setTimeout(function () { buildChrome(); paintProgress(); }, t);
    });
    /* safety net: nothing stays invisible */
    setTimeout(function () {
      document.querySelectorAll('[data-reveal]:not([data-revealed])').forEach(function (el) { el.setAttribute('data-revealed', '1'); });
    }, 3000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
