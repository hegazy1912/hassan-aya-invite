/* ============================================================
   letters.js — مكتبة الظروف: ورقة بتتطوي، ظرف بلسان وختم شمعي، صندوق، أصوات
   بتُستخدم في: cinema.html (إرسال الرسالة)  و  messages.html (فتح الرسايل عند العريس)
   كل الانيميشن بـ Web Animations API (من غير مكتبات خارجية)
   ============================================================ */
(function () {
  'use strict';
  var LET = window.LET = { muted: false };
  var LITE = (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || ((navigator.hardwareConcurrency || 8) <= 4) || ((navigator.deviceMemory || 8) <= 4);
  LET.lite = LITE;

  /* ---------- ألوان الورق/الظرف ---------- */
  var TH = {
    cream: { n: 'كريمي', p1: '#fdf7e8', p2: '#efe0bf', e1: '#f6ecd3', e2: '#e2cfa4', inn: '#bfa36a', ink: '#3b2a17', ln: 'rgba(150,118,62,.24)' },
    rose:  { n: 'وردي',  p1: '#fff0f3', p2: '#f6c9d3', e1: '#fbdde4', e2: '#eeb3c2', inn: '#cf8497', ink: '#4a1f2b', ln: 'rgba(176,84,108,.22)' },
    sky:   { n: 'سماوي', p1: '#eff6ff', p2: '#c6dcf5', e1: '#d9e8fa', e2: '#b1cdee', inn: '#7f9fc9', ink: '#1f3350', ln: 'rgba(70,110,170,.22)' },
    mint:  { n: 'نعناع', p1: '#f1faf2', p2: '#c9e6cc', e1: '#dcf0de', e2: '#b4d9b9', inn: '#82ad89', ink: '#1f3d27', ln: 'rgba(64,120,76,.22)' }
  };
  LET.themes = TH;
  LET.theme = function (el, key) {
    var t = TH[key] || TH.cream;
    ['p1', 'p2', 'e1', 'e2', 'inn', 'ink', 'ln'].forEach(function (k) { el.style.setProperty('--' + k, t[k]); });
  };

  /* ---------- أدوات ---------- */
  function $(tag, cls, html) {
    var e = document.createElement(tag || 'div');
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  LET.el = $;
  var sleep = LET.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  /* بيشغل انيميشن وبيثبّت الحالة النهائية على الـ style وبعدين يلغي الانيميشن */
  var A = LET.A = function (el, kf, ms, ease, delay) {
    var a;
    try { a = el.animate(kf, { duration: ms, easing: ease || 'ease', delay: delay || 0, fill: 'both' }); }
    catch (e) { return Promise.resolve(); }
    return a.finished.then(function () { try { a.commitStyles(); } catch (e) {} a.cancel(); }, function () {});
  };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  LET.ar = function (n) { n = Number(n) || 0; if (n > 99) return '٩٩+'; try { return n.toLocaleString('ar-EG'); } catch (e) { return String(n); } };

  /* ---------- الصوت (WebAudio، من غير ملفات) ---------- */
  var AC = null, NB = null;
  function ac() {
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) { try { AC = new C(); } catch (e) {} } }
    if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  function noise() {
    if (NB) return NB;
    var len = Math.floor(AC.sampleRate * 1.2); NB = AC.createBuffer(1, len, AC.sampleRate);
    var d = NB.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return NB;
  }
  LET.sfx = {
    unlock: ac,
    paper: function (kind) {
      if (LET.muted || !ac()) return;
      var t = AC.currentTime, tear = kind === 'tear', dur = tear ? 0.5 : 0.3;
      var s = AC.createBufferSource(); s.buffer = noise();
      var f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = .75;
      f.frequency.setValueAtTime(tear ? 1500 : 800, t); f.frequency.exponentialRampToValueAtTime(tear ? 6500 : 2800, t + dur);
      var g = AC.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(tear ? 0.28 : 0.11, t + 0.035); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); s.stop(t + dur + 0.05);
    },
    thud: function () {            /* ختم الشمع */
      if (LET.muted || !ac()) return;
      var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.22);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.3);
      var s = AC.createBufferSource(); s.buffer = noise();
      var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      var g2 = AC.createGain(); g2.gain.setValueAtTime(0.22, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      s.connect(lp); lp.connect(g2); g2.connect(AC.destination); s.start(t); s.stop(t + 0.12);
    },
    chime: function () {           /* نجاح: نغمتين */
      if (LET.muted || !ac()) return;
      var t = AC.currentTime;
      [[659, 0], [988, 0.11], [1319, 0.24]].forEach(function (p) {
        var o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = p[0];
        g.gain.setValueAtTime(0.0001, t + p[1]); g.gain.exponentialRampToValueAtTime(0.1, t + p[1] + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + p[1] + 0.7);
        o.connect(g); g.connect(AC.destination); o.start(t + p[1]); o.stop(t + p[1] + 0.75);
      });
    },
    tick: function () {
      if (LET.muted || !ac()) return;
      var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = 1500;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.06);
    }
  };

  /* ---------- قصاصات وبتلات (بتتحط على الشاشة كلها) ---------- */
  LET.confetti = function (x, y, n, o) {
    o = o || {};
    if (LITE) n = Math.min(n, 24);
    var cols = o.colors || ['#ffd9a0', '#ffb3c1', '#ffe9b0', '#f6c9d3', '#d8b878', '#ffffff'];
    for (var i = 0; i < n; i++) {
      var p = $('div', 'lt-conf'), petal = Math.random() < .5, s = rnd(6, 12);
      p.style.left = x + 'px'; p.style.top = y + 'px';
      p.style.width = s + 'px'; p.style.height = (petal ? s * .72 : s * .5) + 'px';
      p.style.background = cols[Math.floor(Math.random() * cols.length)];
      p.style.borderRadius = petal ? '60% 20% 60% 20%' : '1px';
      document.body.appendChild(p);
      var ang = rnd(-Math.PI * .95, -Math.PI * .05), sp = rnd(120, o.power || 300);
      var dx = Math.cos(ang) * sp, dy = Math.sin(ang) * sp, rot = rnd(-720, 720), dur = rnd(1700, 3000);
      (function (p, dx, dy, rot, dur) {
        var a = p.animate([
          { transform: 'translate(-50%,-50%) scale(.5) rotate(0deg)', opacity: 0 },
          { transform: 'translate(' + (dx * .6) + 'px,' + (dy * .8) + 'px) scale(1) rotate(' + (rot * .5) + 'deg)', opacity: 1, offset: .22 },
          { transform: 'translate(' + (dx * 1.1) + 'px,' + (dy * .55 + (o.fall || 420)) + 'px) scale(.9) rotate(' + rot + 'deg)', opacity: 0 }
        ], { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
        a.onfinish = function () { p.remove(); };
      })(p, dx, dy, rot, dur);
    }
  };

  /* ============================================================
     الورقة: 3 أجزاء (t فوق، m وسط، b تحت). b بتتطوي لفوق ثم t بتتطوي لتحت.
     ============================================================ */
  LET.paper = function (o) {
    var w = o.w, h3 = Math.round(o.h / 3), H = h3 * 3, lh = o.lh || 24, fs = o.fs || 15, pad = o.pad == null ? 12 : o.pad;
    var el = $('div', 'lt-paper'); el.style.width = w + 'px'; el.style.height = H + 'px';
    LET.theme(el, o.theme); el.style.setProperty('--lh', lh + 'px'); el.style.setProperty('--py', pad + 'px');
    var P = { el: el, w: w, H: H, h3: h3, pn: {} };
    ['t', 'm', 'b'].forEach(function (k, i) {
      var pn = $('div', 'lt-pn ' + k); pn.style.top = (i * h3) + 'px'; pn.style.height = h3 + 'px';
      var f = $('div', 'lt-pf'), pi = $('div', 'lt-pi');
      pi.style.width = w + 'px'; pi.style.height = H + 'px'; pi.style.top = (-i * h3) + 'px';
      if (o.text != null) {
        var tx = $('div', 'lt-tx'); tx.style.fontSize = fs + 'px'; tx.style.lineHeight = lh + 'px'; tx.style.padding = pad + 'px';
        tx.textContent = o.text;
        if (o.clamp) { tx.style.display = '-webkit-box'; tx.style.webkitBoxOrient = 'vertical'; tx.style.webkitLineClamp = String(o.clamp); tx.style.maxHeight = (o.clamp * lh + pad * 2) + 'px'; }
        pi.appendChild(tx);
        if (o.from) {
          var fr = $('div', 'lt-fr'); fr.textContent = o.from; fr.style.fontSize = (fs - 1) + 'px'; fr.style.bottom = '8px'; fr.style.padding = '0 ' + pad + 'px';
          fr.style.top = 'auto'; fr.style.position = 'absolute'; pi.appendChild(fr);
        }
      }
      var sh = $('div', 'lt-sh'); f.appendChild(pi); f.appendChild(sh);
      var b = $('div', 'lt-pb'); var sh2 = $('div', 'lt-sh'); b.appendChild(sh2);
      pn.appendChild(f); pn.appendChild(b); el.appendChild(pn);
      P.pn[k] = { el: pn, sh: sh };
    });
    var EASE = 'cubic-bezier(.5,.1,.3,1)';
    P.foldB = function (ms) { ms = ms || 460; return Promise.all([A(P.pn.b.el, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(180deg)' }], ms, EASE), A(P.pn.b.sh, [{ opacity: 0 }, { opacity: .55, offset: .5 }, { opacity: 0 }], ms)]); };
    P.foldT = function (ms) { ms = ms || 460; return Promise.all([A(P.pn.t.el, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-180deg)' }], ms, EASE), A(P.pn.t.sh, [{ opacity: 0 }, { opacity: .55, offset: .5 }, { opacity: 0 }], ms)]); };
    P.unfoldT = function (ms) { ms = ms || 460; return Promise.all([A(P.pn.t.el, [{ transform: 'rotateX(-180deg)' }, { transform: 'rotateX(0deg)' }], ms, EASE), A(P.pn.t.sh, [{ opacity: 0 }, { opacity: .5, offset: .5 }, { opacity: 0 }], ms)]); };
    P.unfoldB = function (ms) { ms = ms || 460; return Promise.all([A(P.pn.b.el, [{ transform: 'rotateX(180deg)' }, { transform: 'rotateX(0deg)' }], ms, EASE), A(P.pn.b.sh, [{ opacity: 0 }, { opacity: .5, offset: .5 }, { opacity: 0 }], ms)]); };
    P.fold = function (ms) { return P.foldB(ms).then(function () { return P.foldT(ms); }); };
    P.unfold = function (ms) { return P.unfoldT(ms).then(function () { return P.unfoldB(ms); }); };
    P.setFolded = function () { P.pn.t.el.style.transform = 'rotateX(-180deg)'; P.pn.b.el.style.transform = 'rotateX(180deg)'; };
    P.setOpen = function () { P.pn.t.el.style.transform = 'rotateX(0deg)'; P.pn.b.el.style.transform = 'rotateX(0deg)'; };

    /* كتابة النص كلمة كلمة (للعريس) */
    P.prepareWrite = function (text, from, fsz, lhh, padd) {
      var wr = $('div', 'lt-write'); wr.style.fontSize = fsz + 'px'; wr.style.lineHeight = lhh + 'px'; wr.style.padding = padd + 'px';
      var words = [];
      String(text).split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { if (tok.indexOf('\n') >= 0) wr.appendChild(document.createElement('br')); else wr.appendChild(document.createTextNode(' ')); return; }
        var sp = $('span', 'w'); sp.textContent = tok; wr.appendChild(sp); words.push(sp);
      });
      var sig = null;
      if (from) { sig = $('span', 'sig'); sig.textContent = from; sig.style.marginTop = (lhh * .5) + 'px'; sig.style.fontSize = (fsz - 2) + 'px'; wr.appendChild(sig); }
      el.appendChild(wr); P.writeEl = wr;
      P.reveal = function () {
        var per = Math.min(70, 2300 / Math.max(1, words.length)), ps = [];
        words.forEach(function (sp, i) {
          ps.push(A(sp, [{ opacity: 0, filter: 'blur(6px)', transform: 'translateY(7px)' }, { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }], 380, 'ease-out', i * per));
        });
        if (sig) ps.push(A(sig, [{ opacity: 0 }, { opacity: .65 }], 600, 'ease', words.length * per + 150));
        return Promise.all(ps);
      };
      P.hideWrite = function (ms) { return A(wr, [{ opacity: 1 }, { opacity: 0 }], ms || 240); };
      return wr;
    };
    return P;
  };

  /* ============================================================
     الظرف: back + pocket + flap(بوجهين) + ختم شمعي. الورقة بتتحط جواه (z=2).
     ============================================================ */
  LET.envelope = function (o) {
    var w = o.w, h = o.h, ss = o.seal || Math.round(h * 0.28);
    var g = $('div', 'lt-grp'); g.style.width = w + 'px'; g.style.height = h + 'px'; g.style.isolation = 'isolate'; LET.theme(g, o.theme);
    var back = $('div', 'lt-eb'), glow = $('div', 'lt-glow'), es = $('div', 'lt-es'), ef = $('div', 'lt-ef');
    var ev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ev.setAttribute('class', 'lt-ev'); ev.setAttribute('viewBox', '0 0 100 100'); ev.setAttribute('preserveAspectRatio', 'none');
    ev.innerHTML = '<path class="b" d="M0 4.2L50 59L100 4.2"/><path class="a" d="M0 0L50 55L100 0"/><path class="a" d="M0 100L50 56"/><path class="a" d="M100 100L50 56"/>';
    var fl = $('div', 'lt-fl'), ff = $('div', 'lt-ff'), fb = $('div', 'lt-fb'); fl.appendChild(ff); fl.appendChild(fb);
    var seal = $('div', 'lt-seal', 'H&amp;A');
    seal.style.width = ss + 'px'; seal.style.height = ss + 'px'; seal.style.marginLeft = (-ss / 2) + 'px'; seal.style.marginTop = (-ss / 2) + 'px'; seal.style.fontSize = Math.round(ss * .4) + 'px';
    [back, glow, es, ef, ev, fl, seal].forEach(function (n) { g.appendChild(n); });
    var G = { el: g, w: w, h: h, seal: seal, glowEl: glow };

    G.add = function (paperEl) { g.appendChild(paperEl); };
    G.setFlapOpen = function (open) { fl.style.transform = 'rotateX(' + (open ? -180 : 0) + 'deg)'; fl.style.zIndex = open ? 0 : 5; };
    G.flapTo = function (open, ms) {
      ms = ms || 560; fl.style.zIndex = 5;
      var from = open ? 0 : -180, to = open ? -180 : 0;
      return A(fl, [{ transform: 'rotateX(' + from + 'deg)' }, { transform: 'rotateX(-90deg)' }], ms * .5, 'ease-in').then(function () {
        fl.style.zIndex = open ? 0 : 5;
        return A(fl, [{ transform: 'rotateX(-90deg)' }, { transform: 'rotateX(' + to + 'deg)' }], ms * .5, 'ease-out');
      });
    };
    G.glow = function (on, ms) { return A(glow, [{ opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0 }], ms || 600); };
    G.sealHide = function () { seal.style.opacity = '0'; seal.style.visibility = 'hidden'; };
    G.sealShow = function () { seal.style.visibility = 'visible'; seal.style.opacity = '1'; seal.style.transform = 'none'; };
    G.sealStamp = function () {
      seal.style.visibility = 'visible'; LET.sfx.thud();
      var rip = $('div', 'lt-rip'), rs = ss * 1.1;
      rip.style.cssText = 'left:' + (w / 2 - rs / 2) + 'px;top:' + (h * .55 - rs / 2) + 'px;width:' + rs + 'px;height:' + rs + 'px';
      g.appendChild(rip);
      A(rip, [{ opacity: .95, transform: 'scale(.6)' }, { opacity: 0, transform: 'scale(2.6)' }], 760, 'ease-out').then(function () { rip.remove(); });
      return A(seal, [
        { opacity: 0, transform: 'scale(2.8) rotate(-18deg)' },
        { opacity: 1, transform: 'scale(.84) rotate(2deg)', offset: .58 },
        { opacity: 1, transform: 'scale(1.09) rotate(-1deg)', offset: .8 },
        { opacity: 1, transform: 'scale(1) rotate(0deg)' }], 580, 'cubic-bezier(.3,.1,.3,1)');
    };
    G.sealBreak = function () {
      LET.sfx.paper('tear');
      var mk = function (cls) {
        var c = $('div', 'lt-seal half ' + cls, 'H&amp;A'); c.style.cssText = seal.style.cssText; c.style.visibility = 'visible'; c.style.opacity = '1'; c.style.transform = 'none'; g.appendChild(c); return c;
      };
      var a = mk('hA'), b = mk('hB'); seal.style.visibility = 'hidden';
      var ps = [
        A(a, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: 'translate(-9px,-4px) rotate(-6deg)', opacity: 1, offset: .2 }, { transform: 'translate(-' + (ss * .9) + 'px,' + (ss * 1.5) + 'px) rotate(-38deg)', opacity: 0 }], 760, 'cubic-bezier(.4,0,.8,.6)'),
        A(b, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: 'translate(9px,-4px) rotate(6deg)', opacity: 1, offset: .2 }, { transform: 'translate(' + (ss * .9) + 'px,' + (ss * 1.7) + 'px) rotate(34deg)', opacity: 0 }], 760, 'cubic-bezier(.4,0,.8,.6)')
      ];
      for (var i = 0; i < 9; i++) {
        var cr = $('div', 'lt-crumb'), s = rnd(3, 6); cr.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (w / 2 - s / 2) + 'px;top:' + (h * .55 - s / 2) + 'px';
        g.appendChild(cr);
        (function (cr) {
          var ang = rnd(-Math.PI, 0), sp = rnd(18, 54);
          A(cr, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + (Math.cos(ang) * sp) + 'px,' + (Math.sin(ang) * sp - 8) + 'px)', opacity: 1, offset: .4 }, { transform: 'translate(' + (Math.cos(ang) * sp * 1.3) + 'px,' + (Math.sin(ang) * sp + 70) + 'px)', opacity: 0 }], rnd(600, 950), 'ease-out').then(function () { cr.remove(); });
        })(cr);
      }
      return Promise.all(ps).then(function () { a.remove(); b.remove(); });
    };
    return G;
  };

  /* ============================================================
     الصندوق (بيتحط في الـ stage كأجزاء مستقلة عشان الظرف يدخل بينهم)
     ============================================================ */
  LET.box = function (stage, o) {
    var L = o.left, T = o.top, W = o.w || 150, Hh = o.h || 104, count = o.count || 0;
    var glow = $('div', 'lt-bglow'); glow.style.cssText = 'left:' + (L - 36) + 'px;top:' + (T + 4) + 'px;width:' + (W + 72) + 'px;height:' + (Hh + 24) + 'px';
    var bk = $('div', 'lt-bk'); bk.style.cssText = 'left:' + (L + 4) + 'px;top:' + (T + 6) + 'px;width:' + (W - 8) + 'px;height:44px';
    var bf = $('div', 'lt-bf', '<div class="lt-pl"><b>رسايل العرسان</b><small>🔒 بعد الفرح</small></div>');
    bf.style.cssText = 'left:' + L + 'px;top:' + (T + 26) + 'px;width:' + W + 'px;height:' + (Hh - 26) + 'px';
    var lid = $('div', 'lt-lid'); lid.style.cssText = 'left:' + (L - 6) + 'px;top:' + (T + 2) + 'px;width:' + (W + 12) + 'px;height:26px;transform:perspective(420px) rotateX(0deg)';
    var bdg = $('div', 'lt-bdg', LET.ar(count)); bdg.style.cssText = 'left:' + (L + W - 18) + 'px;top:' + (T + 12) + 'px;width:28px;height:28px';
    [glow, bk, bf, lid, bdg].forEach(function (n) { stage.appendChild(n); });
    var B = { bk: bk, bf: bf, lid: lid, bdg: bdg, glow: glow, L: L, T: T, W: W };
    var LID = 'perspective(420px) rotateX(';
    B.open = function () { return A(lid, [{ transform: LID + '0deg)' }, { transform: LID + '-78deg)' }], 380, 'cubic-bezier(.3,1.35,.5,1)'); };
    B.close = function () {
      return A(lid, [{ transform: LID + '-78deg) translateY(0)' }, { transform: LID + '7deg) translateY(2px)', offset: .62 }, { transform: LID + '0deg) translateY(0)' }], 520, 'cubic-bezier(.4,0,.3,1)');
    };
    B.thump = function () {
      var kf = [{ transform: 'scale(1,1)' }, { transform: 'scale(1.04,.93)', offset: .25 }, { transform: 'scale(.98,1.03)', offset: .55 }, { transform: 'scale(1,1)' }];
      [bf, bk].forEach(function (n) { n.style.transformOrigin = '50% 100%'; A(n, kf, 520, 'ease-out'); });
    };
    B.setCount = function (n) {
      bdg.textContent = LET.ar(n);
      return A(bdg, [{ transform: 'scale(1)' }, { transform: 'scale(1.75) rotate(-10deg)', offset: .4 }, { transform: 'scale(.9) rotate(4deg)', offset: .7 }, { transform: 'scale(1) rotate(0)' }], 620, 'cubic-bezier(.3,1.4,.5,1)');
    };
    B.shine = function () { return A(glow, [{ opacity: 0 }, { opacity: 1, offset: .35 }, { opacity: .0 }], 1500); };
    return B;
  };

  /* ============================================================
     مشهد الإرسال كامل: ورقة تتطوي -> تدخل الظرف -> لسان يتقفل -> ختم -> الظرف يطير للصندوق
     stage: عنصر position:relative  |  o: {text,theme,from,count,getResult}
     بيرجع Promise<{ok,count,error}>
     ============================================================ */
  LET.send = function (stage, o) {
    var SW = 280, SH = 312;
    stage.innerHTML = ''; stage.style.width = SW + 'px'; stage.style.height = SH + 'px'; stage.style.position = 'relative'; stage.style.margin = '0 auto';
    var count = o.count || 0;
    var box = LET.box(stage, { left: 65, top: 206, w: 150, h: 104, count: count });
    var env = LET.envelope({ w: 176, h: 104, theme: o.theme, seal: 30 });
    env.el.style.left = '52px'; env.el.style.top = '80px'; env.el.style.zIndex = 2; stage.appendChild(env.el);
    var paper = LET.paper({ w: 150, h: 111, theme: o.theme, text: o.text, from: o.from ? '— ' + o.from : '', fs: 11.5, lh: 17, pad: 12, clamp: 5 });
    paper.el.style.left = '13px'; paper.el.style.top = '-80px'; env.add(paper.el);
    env.setFlapOpen(true); env.sealHide();
    paper.el.style.opacity = '0'; env.el.style.opacity = '0';
    var DROP_IN = 74;                       /* بيدخل الورقة المطوية جوه الظرف */
    var run = async function () {
      LET.sfx.unlock();
      LET.sfx.paper('rustle');
      await Promise.all([
        A(paper.el, [{ opacity: 0, transform: 'translateY(-26px) rotate(-4deg) scale(.88)' }, { opacity: 1, transform: 'translateY(0) rotate(0deg) scale(1)' }], 560, 'cubic-bezier(.2,.8,.3,1.2)'),
        A(env.el, [{ opacity: 0, transform: 'translateY(46px) scale(.94)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], 520, 'cubic-bezier(.2,.8,.3,1)', 140)
      ]);
      await sleep(380);
      LET.sfx.paper('rustle'); await paper.foldB(430);
      LET.sfx.paper('rustle'); await paper.foldT(430);
      await sleep(80);
      await A(paper.el, [{ transform: 'translateY(0)' }, { transform: 'translateY(' + (DROP_IN + 6) + 'px)', offset: .8 }, { transform: 'translateY(' + DROP_IN + 'px)' }], 640, 'cubic-bezier(.5,0,.3,1)');
      LET.sfx.paper('rustle');
      await env.flapTo(false, 520);
      await sleep(60);
      await env.sealStamp();
      env.glow(false, 10);
      await sleep(260);
      /* الطيران للصندوق */
      box.open();
      await A(env.el, [
        { transform: 'translate(0,0) scale(1) rotate(0deg)', offset: 0 },
        { transform: 'translate(0,-20px) scale(.92) rotate(-5deg)', offset: .3 },
        { transform: 'translate(0,56px) scale(.62) rotate(4deg)', offset: .72 },
        { transform: 'translate(0,73px) scale(.5) rotate(0deg)', offset: 1 }], 900, 'cubic-bezier(.45,.05,.25,1)');
      var res = await Promise.resolve(o.getResult ? o.getResult() : { ok: true });
      if (!res || !res.ok) {
        /* فشل الإرسال: الظرف يرجع مكانه والمكالمة تبلّغ الواجهة */
        box.close();
        await A(env.el, [{ transform: 'translate(0,73px) scale(.5) rotate(0deg)', opacity: 1 }, { transform: 'translate(0,73px) scale(.5) rotate(0deg)', opacity: 0 }], 300);
        return { ok: false, error: (res && res.error) || 'failed' };
      }
      await A(env.el, [{ transform: 'translate(0,73px) scale(.5)' }, { transform: 'translate(0,60px) scale(.5)', offset: .2 }, { transform: 'translate(0,134px) scale(.5)' }], 460, 'cubic-bezier(.5,0,.8,.7)');
      LET.sfx.paper('rustle');
      box.close(); box.thump();
      await sleep(240);
      var n = res.count != null ? res.count : count + 1;
      box.setCount(n); LET.sfx.chime(); box.shine();
      /* شرارات من فتحة الصندوق */
      var ems = ['✨', '💛', '💌', '🤍', '✨'];
      for (var i = 0; i < (LITE ? 4 : 9); i++) {
        var sp = $('span', 'lt-spark', ems[i % ems.length]); sp.style.left = (140 - 6) + 'px'; sp.style.top = '226px'; sp.style.fontSize = Math.round(rnd(11, 18)) + 'px';
        stage.appendChild(sp);
        (function (sp) { A(sp, [{ opacity: 0, transform: 'translate(0,0) scale(.4)' }, { opacity: 1, transform: 'translate(' + rnd(-70, 70) + 'px,' + rnd(-110, -50) + 'px) scale(1)', offset: .4 }, { opacity: 0, transform: 'translate(' + rnd(-90, 90) + 'px,' + rnd(-60, 10) + 'px) scale(.8)' }], rnd(1100, 1700), 'ease-out', rnd(0, 350)).then(function () { sp.remove(); }); })(sp);
      }
      await sleep(700);
      return { ok: true, count: n };
    };
    return run();
  };
})();
