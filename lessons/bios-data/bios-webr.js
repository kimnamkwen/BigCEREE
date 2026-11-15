// BigCEREE 보건의료통계학 공통 webR 준비 스크립트
// - webR(브라우저용 R)을 한 번만 내려받아 초기화합니다.
// - 같은 폴더의 합성 자료 vas.csv를 webR 작업 폴더에 복사해 두므로,
//   RStudio 실습 스크립트와 똑같이 read.csv("vas.csv")로 불러올 수 있습니다.
// - getBiosWebR(["ggplot2"])처럼 필요한 패키지를 넘기면 처음 한 번만 설치합니다.
(function () {
  const here = document.currentScript ? document.currentScript.src : location.href;
  const CSV_URL = new URL("vas.csv", here).href;
  const installed = new Set();
  let webRPromise = null;
  window.BIOS_VAS_URL = CSV_URL;
  window.getBiosWebR = function (packages) {
    if (!webRPromise) {
      webRPromise = (async () => {
        const { WebR } = await import("https://webr.r-wasm.org/latest/webr.mjs");
        const webR = new WebR();
        await webR.init();
        const txt = await (await fetch(CSV_URL)).text();
        await webR.FS.writeFile("/home/web_user/vas.csv", new TextEncoder().encode(txt));
        await webR.evalRVoid('setwd("/home/web_user")');
        return webR;
      })();
    }
    return webRPromise.then(async (webR) => {
      const need = (packages || []).filter(p => !installed.has(p));
      if (need.length) {
        await webR.installPackages(need, { quiet: true });
        need.forEach(p => installed.add(p));
      }
      return webR;
    });
  };
})();
