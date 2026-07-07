const DESIGN_ROUTES = [
  { id: "1map1", title: "1-1 납품 비용 확인", href: "./index.html" },
  { id: "1map2", title: "1-2 큰 수의 어림", href: "./1map2.html" },
  { id: "1map3", title: "1-3 단위 변환", href: "./1map3.html" },
  { id: "chapter2", title: "Chapter 2 전환", href: "./chapter2.html" },
  { id: "2map1", title: "2-1 비례 분배", href: "./2map1.html" },
  { id: "2map2", title: "2-2 백분율", href: "./2map2.html" },
  { id: "2map3", title: "2-3 대응 관계 표", href: "./2map3.html" },
  { id: "2map4", title: "2-4 그래프 해석", href: "./2map4.html" },
  { id: "2map5", title: "2-5 일차방정식", href: "./2map5.html" },
  { id: "chapter3", title: "Chapter 3 전환", href: "./chapter3.html" },
  { id: "3map1", title: "3-1 전개도와 겨냥도", href: "./3map1.html" },
  { id: "3map2", title: "3-2 평면도·정면도·측면도", href: "./3map2.html" },
  { id: "3map3", title: "3-3 닮음과 축척 지도", href: "./3map3.html" },
  { id: "3map4", title: "3-4 평면도형의 둘레와 넓이", href: "./3map4.html" },
  { id: "3map5", title: "3-5 입체도형의 부피", href: "./3map5.html" },
  { id: "chapter4", title: "Chapter 4 전환", href: "./chapter4.html" },
  { id: "4map1", title: "4-1 경우의 수", href: "./4map1.html" },
  { id: "4map2", title: "4-2 가능성", href: "./4map2.html" },
  { id: "4map3", title: "4-3 자료 정리", href: "./4map3.html" },
  { id: "4map4", title: "4-4 표와 그래프 해석", href: "./4map4.html" },
  { id: "4map5", title: "4-5 대푯값과 의사결정", href: "./4map5.html" },
];

const LOCAL_HOSTS = new Set(["", "127.0.0.1", "localhost"]);
const params = new URLSearchParams(window.location.search);
const isLocalPreview = LOCAL_HOSTS.has(window.location.hostname) || window.location.protocol === "file:";
const isForcedOn = params.get("dev") === "1";
const isForcedOff = params.get("dev") === "0";

if (!isForcedOff && (isLocalPreview || isForcedOn)) {
  bootDesignTools();
}

function bootDesignTools() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountDesignTools, { once: true });
    return;
  }

  mountDesignTools();
}

function mountDesignTools() {
  if (document.querySelector("[data-design-tools]")) {
    return;
  }

  const currentIndex = getCurrentRouteIndex();
  const currentRoute = DESIGN_ROUTES[currentIndex] ?? DESIGN_ROUTES[0];
  const isOpen = localStorage.getItem("wh-design-tools-open") === "true";

  injectDesignToolsStyle();

  const root = document.createElement("aside");
  root.className = `design-tools${isOpen ? " is-open" : ""}`;
  root.setAttribute("data-design-tools", "");
  root.setAttribute("aria-label", "디자인 작업용 맵 이동 도구");
  root.innerHTML = `
    <button class="design-tools__toggle" type="button" aria-expanded="${isOpen ? "true" : "false"}">
      <span aria-hidden="true">⚡</span>
      <b>디자인 이동</b>
    </button>
    <section class="design-tools__panel" aria-label="맵 바로 이동">
      <div class="design-tools__head">
        <span>작업용 빠른 이동</span>
        <button class="design-tools__close" type="button" aria-label="디자인 이동 패널 닫기">×</button>
      </div>
      <p class="design-tools__current">현재: <strong>${currentRoute.id}</strong></p>
      <div class="design-tools__buttons">
        <button type="button" data-design-action="prev">← 이전</button>
        <button type="button" data-design-action="next">다음 →</button>
      </div>
      <label class="design-tools__select-label">
        <span>바로 갈 곳</span>
        <select class="design-tools__select">
          ${DESIGN_ROUTES.map(
            (route, index) =>
              `<option value="${index}"${index === currentIndex ? " selected" : ""}>${route.id} · ${route.title}</option>`,
          ).join("")}
        </select>
      </label>
      <p class="design-tools__hint">단축키: Ctrl + Shift + ← / →</p>
    </section>
  `;

  document.body.appendChild(root);

  const toggle = root.querySelector(".design-tools__toggle");
  const close = root.querySelector(".design-tools__close");
  const select = root.querySelector(".design-tools__select");

  toggle.addEventListener("click", () => setPanelOpen(root, !root.classList.contains("is-open")));
  close.addEventListener("click", () => setPanelOpen(root, false));
  select.addEventListener("change", () => goToRoute(Number(select.value)));

  root.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-design-action]");
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.designAction;
    if (action === "next") {
      goToRoute(currentIndex + 1);
    }
    if (action === "prev") {
      goToRoute(currentIndex - 1);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (!event.ctrlKey || !event.shiftKey) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToRoute(currentIndex + 1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToRoute(currentIndex - 1);
    }
  });
}

function setPanelOpen(root, isOpen) {
  root.classList.toggle("is-open", isOpen);
  root.querySelector(".design-tools__toggle")?.setAttribute("aria-expanded", String(isOpen));
  localStorage.setItem("wh-design-tools-open", String(isOpen));
}

function getCurrentRouteIndex() {
  const filename = decodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
  const normalized = filename === "" ? "index.html" : filename;
  const index = DESIGN_ROUTES.findIndex((route) => route.href.replace("./", "") === normalized);
  return index >= 0 ? index : 0;
}

function goToRoute(index) {
  const safeIndex = Math.max(0, Math.min(DESIGN_ROUTES.length - 1, index));
  const next = DESIGN_ROUTES[safeIndex];
  if (!next) {
    return;
  }

  const href = new URL(next.href, window.location.href);
  if (isForcedOn) {
    href.searchParams.set("dev", "1");
  }
  window.location.href = href.href;
}

function injectDesignToolsStyle() {
  if (document.querySelector("#design-tools-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "design-tools-style";
  style.textContent = `
    .design-tools {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 99999;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #17304b;
      pointer-events: none;
    }

    .design-tools button,
    .design-tools select {
      font: inherit;
    }

    .design-tools__toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 0;
      border-radius: 999px;
      padding: 9px 12px;
      background: linear-gradient(135deg, #ffe66d, #ff9f43);
      color: #392200;
      box-shadow: 0 8px 22px rgba(20, 31, 48, 0.28);
      cursor: pointer;
      pointer-events: auto;
    }

    .design-tools__toggle b {
      font-size: 12px;
      line-height: 1;
      white-space: nowrap;
    }

    .design-tools__panel {
      display: none;
      width: min(300px, calc(100vw - 28px));
      margin-top: 10px;
      border: 1px solid rgba(255, 255, 255, 0.55);
      border-radius: 18px;
      padding: 14px;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 18px 40px rgba(20, 31, 48, 0.26);
      backdrop-filter: blur(12px);
      pointer-events: auto;
    }

    .design-tools.is-open .design-tools__panel {
      display: block;
    }

    .design-tools__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
      font-weight: 900;
    }

    .design-tools__close {
      width: 26px;
      height: 26px;
      border: 0;
      border-radius: 50%;
      background: #eaf1f8;
      color: #17304b;
      cursor: pointer;
    }

    .design-tools__current,
    .design-tools__hint {
      margin: 6px 0 10px;
      font-size: 12px;
      color: #50647b;
    }

    .design-tools__buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }

    .design-tools__buttons button {
      border: 0;
      border-radius: 12px;
      padding: 9px 10px;
      background: #17304b;
      color: #fff;
      font-weight: 800;
      cursor: pointer;
    }

    .design-tools__select-label {
      display: grid;
      gap: 5px;
      font-size: 12px;
      font-weight: 800;
    }

    .design-tools__select {
      width: 100%;
      border: 1px solid #cad7e4;
      border-radius: 12px;
      padding: 9px 10px;
      background: #fff;
      color: #17304b;
    }

    .design-tools__hint {
      margin-bottom: 0;
    }
  `;
  document.head.appendChild(style);
}
