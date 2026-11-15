// BigCEREE 수업 입장 관리 (강의관리보드에서 만든 classes/access.json을 읽음)
// - 목록 페이지: access.json에 열려 있는 주차만 '입장' 버튼을 켜고, 나머지는 비활성화
// - 수업 페이지: 열려 있지 않으면 본문 대신 안내문을 보여 줌
// - access.json이 없거나 읽지 못하면 모두 닫힌 것으로 처리
// 주의: 공개 저장소의 정적 사이트이므로 완전한 접근 차단은 아닙니다(주소·원본 파일은 공개).
(function () {
  var script = document.currentScript;
  var root = new URL("./", script ? script.src : location.href);   // 사이트 최상위 (style.css와 같은 폴더)
  var LESSON_RE = /\/classes\/([^\/]+)\/(\d{2})-[^\/]+\/present\/(index\.html)?$/;
  var lesson = location.pathname.match(LESSON_RE);
  var preview = /[?&]preview=1\b/.test(location.search);
  if (!preview) document.documentElement.classList.add("access-pending");

  function isOpen(cfg, subject, week) {
    var list = (cfg && cfg.open && cfg.open[subject]) || [];
    return list.indexOf(week) !== -1;
  }

  function apply(cfg) {
    // 1) 목록 페이지의 '입장' 버튼
    var links = document.querySelectorAll("a.enter-btn, span.enter-btn[data-href]");
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      var href = el.getAttribute("href") || el.getAttribute("data-href");
      var m = new URL(href, location.href).pathname.match(LESSON_RE);
      if (!m) continue;
      var open = preview || isOpen(cfg, m[1], m[2]);
      if (!open && el.tagName === "A") {
        var span = document.createElement("span");
        span.className = "enter-btn is-disabled";
        span.title = "수업 시간에 열립니다";
        span.setAttribute("data-href", href);
        span.textContent = el.textContent;
        el.parentNode.replaceChild(span, el);
      }
    }
    // 2) 수업 페이지
    if (lesson && !preview && !isOpen(cfg, lesson[1], lesson[2])) {
      var layout = document.getElementById("lesson-layout");
      if (layout) layout.remove();
      var bar = document.querySelector(".lesson-topbar");
      if (bar) bar.remove();
      var box = document.createElement("div");
      box.className = "access-closed";
      box.innerHTML = "<h1>지금은 열려 있지 않은 수업입니다</h1>" +
        "<p>이 주차 수업 화면은 강의 시간에 열립니다. 안내받은 시간에 다시 접속해 주세요.</p>" +
        '<p><a class="enter-btn" href="../../index.html">수업 목록으로</a></p>';
      document.body.appendChild(box);
    }
    document.documentElement.classList.remove("access-pending");
  }

  function load() {
    fetch(new URL("classes/access.json?ts=" + Date.now(), root).href, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(apply);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
