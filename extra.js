/* 見せ場の動き。[data-demo] の中を順番に切り替える（外部ライブラリなし） */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  [].forEach.call(document.querySelectorAll('[data-demo]'), function (box) {
    var times = box.getAttribute('data-demo').split(',').map(Number);
    var all = function (s) { return [].slice.call(box.querySelectorAll(s)); };
    var tabs = all('[data-go]'), panels = all('[data-panel]'), play = box.querySelector('[data-play]');
    var count = box.querySelector('[data-count]');
    var step = 0, t = 0, playing = !reduce, seen = false, timer = null;
    all('[data-bubbles]').forEach(function (el) {
      for (var i = 0; i < +el.getAttribute('data-bubbles'); i++) {
        var b = document.createElement('i'), s = 4 + (i * 7) % 11;
        b.style.cssText = 'left:' + ((i * 37) % 94 + 2) + '%;width:' + s + 'px;height:' + s + 'px;animation-duration:' + (2.4 + (i % 5) * 0.6) + 's;animation-delay:-' + ((i * 0.43) % 4).toFixed(2) + 's';
        el.appendChild(b);
      }
    });
    function draw() {
      var p = Math.min(1, t / times[step]);
      box.setAttribute('data-step', step);
      box.style.setProperty('--p', p.toFixed(3));
      var done = 0, total = 0;
      times.forEach(function (v, i) { total += v; if (i < step) done += v; });
      box.style.setProperty('--all', ((done + p * times[step]) / total).toFixed(4));
      if (count) count.textContent = Math.round((done + p * times[step]) / total * +count.getAttribute('data-count'));
      panels.forEach(function (el) {
        var i = +el.getAttribute('data-panel');
        el.classList.toggle('on', i === step);
        el.classList.toggle('done', i <= step);
      });
      tabs.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-go') === step)); });
    }
    function sync() {
      var run = playing && seen && !document.hidden;
      box.classList.toggle('paused', !run);
      if (play) play.textContent = playing ? '動きを止める' : '再生する';
      if (run && !timer) timer = setInterval(function () {
        t += 100;
        if (t > times[step]) { step = (step + 1) % times.length; t = 0; }
        draw();
      }, 100);
      if (!run && timer) { clearInterval(timer); timer = null; }
    }
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        step = +b.getAttribute('data-go'); playing = false; t = times[step]; draw(); sync();
      });
    });
    if (play) play.addEventListener('click', function () { playing = !playing; if (playing && t >= times[step]) t = 0; sync(); });
    if (reduce) { step = times.length - 1; t = times[step]; }
    box.classList.add('ready'); draw(); sync();
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { seen = e[e.length - 1].isIntersecting; sync(); }, { threshold: 0.2 }).observe(box.querySelector('.x-stage') || box);
    else { seen = true; sync(); }
  });
})();
