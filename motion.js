/* スクロール演出（外部ライブラリなし・軽量版）
   方針: スクロール中に「レイアウトの読み取り」をしない。位置は事前に計測して保存し、
   動かすのは transform / opacity だけ（GPUで処理される）。 */
(function () {
  'use strict';
  var w = window, d = document;
  if (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in w)) return;
  var root = d.documentElement;
  root.classList.add('mo');

  /* 1. 出現対象 */
  var SEL = '.label,main h2,main .lead,.item,.price .row,.faq>div,.info .row,.rows li,.steps li,.voice li,.flow li,.scene li,.guide li,.ingredients .row,.cta .row,.access .row,.pagehead h1,main .actions,.cap p,.offer';
  var revs = [].slice.call(d.querySelectorAll(SEL)).filter(function (el) { return !el.closest('.hero'); });
  var seen = new Map();
  revs.forEach(function (el) {
    var p = el.parentNode, i = seen.get(p) || 0; seen.set(p, i + 1);
    el.style.setProperty('--d', (Math.min(i, 4) * 0.07).toFixed(2) + 's');
    el.classList.add('rv');
  });

  /* 2. 写真の枠 */
  var pars = [];
  [].slice.call(d.querySelectorAll('main img')).forEach(function (img) {
    if (img.closest('.hero') || img.hasAttribute('data-nopar')) return;
    var wrap = d.createElement('div');
    wrap.className = 'pw';
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
    if (!img.closest('.rv')) wrap.classList.add('rvi');
    pars.push({ w: wrap, i: img, banner: !!img.closest('.terrace,.macro,.band,.core'), x: img.getAttribute('data-par') === 'x', top: 0, h: 0 });
  });

  /* 3. 位置の事前計測（リサイズ・読み込み後のみ） */
  var pend = revs.concat(pars.filter(function (p) { return p.w.classList.contains('rvi'); }).map(function (p) { return p.w; }))
    .map(function (el) { return { el: el, top: 0 }; });
  var bgs = [].slice.call(d.querySelectorAll('[data-bg]')).map(function (el) { return { el: el, top: 0, bot: 0, c: el.getAttribute('data-bg') }; });
  var hero = d.querySelector('.hero');
  var heroImg = hero && hero.querySelector('img');
  var copy = hero && hero.querySelector('.copy');
  var heroH = 1, imgH = 1, docH = 1, vh = 1, W = 1, m = false;

  function measure() {
    var sy = w.scrollY || 0;
    vh = w.innerHeight; W = w.innerWidth; m = W <= 820;
    docH = root.scrollHeight;
    pend.forEach(function (o) { o.top = o.el.getBoundingClientRect().top + sy - (parseFloat(o.el.getAttribute('data-ty')) || 0); });
    pars.forEach(function (o) { var r = o.w.getBoundingClientRect(); o.top = r.top + sy; o.h = r.height; o.wd = r.width; });
    bgs.forEach(function (o) { var r = o.el.getBoundingClientRect(); o.top = r.top + sy; o.bot = r.bottom + sy; });
    if (hero) { heroH = hero.offsetHeight || 1; imgH = heroImg ? heroImg.offsetHeight : 1; }
  }

  /* 4. スクロール処理（読み取りなし） */
  var bar = d.createElement('div');
  bar.className = 'mo-prog';
  d.body.appendChild(bar);
  var t0 = performance.now(), ticking = false, curBg = '';
  var bodyStyle = d.body.style;

  function frame(now) {
    ticking = false;
    var y = w.scrollY || 0;
    var max = docH - vh;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';

    if (heroImg) {
      var intro = Math.min(1, (now - t0) / 1600);
      var ease = 1 - Math.pow(1 - intro, 3);
      var p = Math.min(1, Math.max(0, y / heroH));
      if (y < heroH * 1.1 || intro < 1) {
        var s = 1.02 + 0.04 * (1 - ease) + p * 0.04;
        heroImg.style.transform = 'translate3d(0,' + (p * imgH * 0.03).toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
        if (copy && !m) {
          copy.style.opacity = Math.max(0, 1 - p * 1.5).toFixed(3);
          copy.style.transform = 'translate3d(0,' + (-p * 36).toFixed(1) + 'px,0)';
        }
      }
      if (intro < 1) request();
    }

    for (var n = pend.length - 1; n >= 0; n--) {
      if (pend[n].top < y + vh * 0.94) { pend[n].el.classList.add('in'); pend.splice(n, 1); }
    }

    for (var k = 0; k < pars.length; k++) {
      var o = pars[k];
      if (o.top + o.h < y - 120 || o.top > y + vh + 120) continue;
      var q = (o.top + o.h / 2 - y - vh / 2) / (vh / 2 + o.h / 2);
      q = q > 1 ? 1 : q < -1 ? -1 : q;
      var sc = o.banner ? (m ? 1.1 : 1.14) : (m ? 1.05 : 1.08);
      var amp = (sc - 1) / 2 * 0.86;
      if (o.x && !m) o.i.style.transform = 'translate3d(' + (-q * amp * o.wd).toFixed(1) + 'px,0,0) scale(' + sc + ')';
      else o.i.style.transform = 'translate3d(0,' + (-q * amp * o.h).toFixed(1) + 'px,0) scale(' + sc + ')';
    }

    /* 背景色：画面の中央にある章の色へ */
    if (bgs.length) {
      var mid = y + vh / 2, c = curBg;
      for (var j = 0; j < bgs.length; j++) if (mid >= bgs[j].top && mid < bgs[j].bot) { c = bgs[j].c; break; }
      if (c && c !== curBg) { curBg = c; bodyStyle.backgroundColor = c; }
    }
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  var rt;
  function remeasure() { clearTimeout(rt); rt = setTimeout(function () { measure(); request(); }, 120); }
  measure(); request();
  w.addEventListener('scroll', request, { passive: true });
  w.addEventListener('resize', remeasure);
  w.addEventListener('load', remeasure);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(remeasure);
})();
