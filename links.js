/* リンク先の一括設定。実案件ではここにURLを入れる。空のあいだは、押してもページが先頭に戻らない */
(function () {
  var LINKS = { line: '', instagram: '', map: '' };
  var MSG = 'デモサイトのため、リンク先は設定していません';
  [].forEach.call(document.querySelectorAll('[data-link]'), function (a) {
    var url = LINKS[a.getAttribute('data-link')];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; return; }
    a.setAttribute('aria-disabled', 'true');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (document.querySelector('.toast')) return;
      var t = document.createElement('div');
      t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = MSG;
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2600);
    });
  });
})();
