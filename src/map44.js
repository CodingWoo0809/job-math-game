import {
  ARRIVAL_FLOW,
  ARRIVAL_INTERVALS,
  STORAGE_STATUS,
  TRANSPORT_SHARE,
  WAIT_TIMES,
  checkDashboardInterpretationAnswer,
  getDashboardInterpretationSummary
} from "./data-interpretation-logic.mjs";

const canvas = document.querySelector("#map44-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map44-hud"),
  objective: document.querySelector("#map44-objective"),
  count: document.querySelector("#interpretation-count"),
  start: document.querySelector("#map44-start"),
  startButton: document.querySelector("#map44-start-button"),
  guide: document.querySelector("#map44-control-guide"),
  prompt: document.querySelector("#map44-interaction-prompt"),
  promptTarget: document.querySelector("#map44-interaction-target"),
  promptText: document.querySelector("#map44-interaction-text"),
  dialogue: document.querySelector("#map44-dialogue"),
  dialogueSpeaker: document.querySelector("#map44-dialogue-speaker"),
  dialogueText: document.querySelector("#map44-dialogue-text"),
  dialogueClose: document.querySelector("#map44-dialogue-close"),
  inventory: document.querySelector("#map44-inventory"),
  inventoryClose: document.querySelector("#map44-inventory-close"),
  textbookList: document.querySelector("#map44-textbook-list"),
  notesList: document.querySelector("#map44-notes-list"),
  inventoryHint: document.querySelector("#map44-inventory-hint"),
  puzzle: document.querySelector("#map44-puzzle"),
  puzzleClose: document.querySelector("#interpretation-close"),
  summary: document.querySelector("#interpretation-summary"),
  visual: document.querySelector("#interpretation-visual"),
  form: document.querySelector("#interpretation-form"),
  fields: document.querySelector("#interpretation-fields"),
  feedback: document.querySelector("#map44-feedback"),
  resolution: document.querySelector("#map44-resolution"),
  resolutionTitle: document.querySelector("#map44-resolution-title"),
  resolutionText: document.querySelector("#map44-resolution-text"),
  resolutionContinue: document.querySelector("#map44-resolution-continue"),
  complete: document.querySelector("#map44-complete"),
  replay: document.querySelector("#map44-replay"),
  next: document.querySelector("#map44-next")
};

const objects = Object.freeze({
  teacher: Object.freeze({ id: "teacher", kind: "teacher", label: "생활안전부 선생님", x: 0.18, y: 0.62 }),
  students: Object.freeze({ id: "students", kind: "students", label: "막힌 현관 앞 학생들", x: 0.79, y: 0.66 }),
  arrivalBoard: Object.freeze({ id: "arrivalBoard", kind: "arrivalBoard", label: "도착 인원 꺾은선그래프", x: 0.35, y: 0.55 }),
  shareChart: Object.freeze({ id: "shareChart", kind: "shareChart", label: "이동수단 원그래프", x: 0.52, y: 0.54 }),
  storageTable: Object.freeze({ id: "storageTable", kind: "storageTable", label: "보관소 빈자리 표", x: 0.69, y: 0.54 }),
  waitBoard: Object.freeze({ id: "waitBoard", kind: "waitBoard", label: "동선 대기시간 막대그래프", x: 0.42, y: 0.78 }),
  guideDesk: Object.freeze({ id: "guideDesk", kind: "guideDesk", label: "안내 방송 책상", x: 0.62, y: 0.79 })
});

const requiredIds = Object.freeze(["teacher", "students", "arrivalBoard", "shareChart", "storageTable", "waitBoard"]);

const textbookEntries = Object.freeze([
  { title: "표 해석", body: "표는 행과 열의 제목, 단위, 최댓값과 최솟값을 확인하며 읽는다. 같은 기준끼리 비교해야 한다." },
  { title: "원그래프 해석", body: "원그래프는 전체를 100%로 보았을 때 각 항목이 차지하는 비율을 나타낸다. 부채꼴이 클수록 비율이 크다." },
  { title: "막대그래프 해석", body: "막대그래프는 항목별 크기를 비교하기 좋다. 대기시간처럼 작을수록 좋은 값도 있으므로 무엇을 묻는지 먼저 확인한다." },
  { title: "꺾은선그래프 해석", body: "꺾은선그래프는 시간에 따른 증가, 감소, 최댓값, 최솟값을 파악하기 좋다." },
  { title: "자료 해석 순서", body: "제목 → 축과 범례 → 단위 → 가장 큰 값과 작은 값 → 상황에서 필요한 행동 순서로 읽으면 실수를 줄일 수 있다." }
]);

const makeState = () => ({
  started: false,
  modal: null,
  player: { x: 0.14, y: 0.8 },
  keys: new Set(),
  collected: new Set(),
  lastPrompt: null,
  lastTime: performance.now(),
  resolving: false,
  resolutionProgress: 0
});

let state = makeState();
let width = 1280;
let height = 720;

resize();
renderInventory();
ui.visual.innerHTML = renderInterpretationVisual();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
ui.startButton.addEventListener("click", startGame);
ui.dialogueClose.addEventListener("click", closeDialogue);
ui.inventoryClose.addEventListener("click", closeInventory);
ui.puzzleClose.addEventListener("click", closePuzzle);
ui.form.addEventListener("submit", submitInterpretation);
ui.resolutionContinue.addEventListener("click", completeMap);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href = "./4map5.html"; });

function startGame() {
  state.started = true;
  ui.start.classList.add("is-hidden");
  ui.hud.classList.remove("is-hidden");
  ui.guide.classList.remove("is-hidden");
  updateObjective();
}

function resetGame() {
  state = makeState();
  ui.complete.classList.add("is-hidden");
  ui.resolution.classList.add("is-hidden");
  ui.puzzle.classList.add("is-hidden");
  ui.inventory.classList.add("is-hidden");
  ui.dialogue.classList.add("is-hidden");
  ui.prompt.classList.add("is-hidden");
  ui.hud.classList.add("is-hidden");
  ui.guide.classList.add("is-hidden");
  ui.start.classList.remove("is-hidden");
  renderInventory();
  renderProgress();
}

function handleKeyDown(event) {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyI", "Escape"].includes(event.code)) event.preventDefault();
  if (!state.started) return;
  if (event.code === "KeyI") {
    if (state.modal === "inventory") closeInventory();
    else if (!state.modal) openInventory();
    return;
  }
  if (event.code === "Escape") {
    if (state.modal === "dialogue") closeDialogue();
    else if (state.modal === "inventory") closeInventory();
    else if (state.modal === "puzzle") closePuzzle();
    return;
  }
  if (event.code === "Space") {
    if (state.modal === "dialogue") closeDialogue();
    else if (!state.modal) interact();
    return;
  }
  state.keys.add(event.code);
}

function handleKeyUp(event) {
  state.keys.delete(event.code);
}

function loop(now) {
  const dt = Math.min(0.034, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;
  updatePlayer(dt);
  updatePrompt();
  if (state.resolving) state.resolutionProgress = Math.min(1, state.resolutionProgress + dt * 0.54);
  drawScene(now);
  requestAnimationFrame(loop);
}

function updatePlayer(dt) {
  if (!state.started || state.modal || state.resolving) return;
  let dx = 0;
  let dy = 0;
  if (state.keys.has("ArrowUp")) dy -= 1;
  if (state.keys.has("ArrowDown")) dy += 1;
  if (state.keys.has("ArrowLeft")) dx -= 1;
  if (state.keys.has("ArrowRight")) dx += 1;
  if (!dx && !dy) return;
  const length = Math.hypot(dx, dy) || 1;
  const speed = 0.28;
  state.player.x = clamp(state.player.x + (dx / length) * speed * dt, 0.08, 0.9);
  state.player.y = clamp(state.player.y + (dy / length) * speed * dt, 0.48, 0.86);
}

function updatePrompt() {
  if (!state.started || state.modal || state.resolving) {
    ui.prompt.classList.add("is-hidden");
    return;
  }
  const nearest = getNearestInteractable();
  if (!nearest) {
    state.lastPrompt = null;
    ui.prompt.classList.add("is-hidden");
    return;
  }
  state.lastPrompt = nearest;
  ui.promptTarget.textContent = nearest.label;
  ui.promptText.textContent = nearest.kind === "guideDesk" ? "Space Bar로 안내 방송 작성" : "Space Bar로 대화/조사";
  ui.prompt.classList.remove("is-hidden");
}

function getNearestInteractable() {
  let best = null;
  for (const candidate of Object.values(objects)) {
    const distance = Math.hypot(candidate.x - state.player.x, (candidate.y - state.player.y) * 1.35);
    if (distance < 0.08 && (!best || distance < best.distance)) best = { ...candidate, distance };
  }
  return best;
}

function interact() {
  const target = getNearestInteractable();
  if (!target) {
    showDialogue("WH", "가까이에서 조사할 대상을 찾아보자. 선생님, 학생들, 네 개의 자료 전광판, 안내 방송 책상을 확인할 수 있어.");
    return;
  }
  if (target.kind === "teacher") inspectTeacher();
  else if (target.kind === "students") inspectStudents();
  else if (target.kind === "arrivalBoard") inspectArrivalBoard();
  else if (target.kind === "shareChart") inspectShareChart();
  else if (target.kind === "storageTable") inspectStorageTable();
  else if (target.kind === "waitBoard") inspectWaitBoard();
  else inspectGuideDesk();
}

function inspectTeacher() {
  state.collected.add("teacher");
  showDialogue("생활안전부 선생님", "현관 앞 자전거·인라인 동선이 꼬였어. 전광판에는 자료가 다 있는데, 어느 시간대가 가장 붐비고 어떤 학생들을 어디로 안내해야 할지 해석이 필요해.");
  updateObjective();
  renderInventory();
}

function inspectStudents() {
  state.collected.add("students");
  showDialogue("막힌 현관 앞 학생들", "자전거를 어디에 세워야 할지 몰라서 줄이 멈췄어. 앞쪽 보관소는 꽉 찬 것 같은데, 뒤쪽으로 가도 되는지 방송이 나와야 움직일 수 있대.");
  updateObjective();
  renderInventory();
}

function inspectArrivalBoard() {
  state.collected.add("arrivalBoard");
  showDialogue("도착 인원 꺾은선그래프", `시간대별 현관 도착 인원: ${ARRIVAL_INTERVALS.map((interval, index) => `${interval} ${ARRIVAL_FLOW[index]}명`).join(", ")}.`);
  updateObjective();
  renderInventory();
}

function inspectShareChart() {
  state.collected.add("shareChart");
  showDialogue("이동수단 원그래프", `이동수단 비율: ${TRANSPORT_SHARE.map((item) => `${item.label} ${item.percent}%`).join(", ")}. 보관소가 필요한 이동수단은 자전거, 인라인스케이트, 킥보드다.`);
  updateObjective();
  renderInventory();
}

function inspectStorageTable() {
  state.collected.add("storageTable");
  showDialogue("보관소 빈자리 표", `보관소별 남은 자리: ${STORAGE_STATUS.map((item) => `${item.code} ${item.label} ${item.emptySpots}자리`).join(", ")}.`);
  updateObjective();
  renderInventory();
}

function inspectWaitBoard() {
  state.collected.add("waitBoard");
  showDialogue("동선 대기시간 막대그래프", `동선별 평균 대기시간: ${WAIT_TIMES.map((item) => `${item.label} ${item.minutes}분`).join(", ")}. 대기시간은 작을수록 빨리 이동할 수 있다는 뜻이다.`);
  updateObjective();
  renderInventory();
}

function inspectGuideDesk() {
  if (!isReadyToSolve()) {
    showDialogue("안내 방송 책상", `아직 해석 단서가 부족하다. 현재 수집 정보는 ${getCollectedCount()}/${getRequiredCount()}개다. 네 종류의 자료 전광판과 현장 상황을 더 확인해 보자.`);
    return;
  }
  openPuzzle();
}

function isReadyToSolve() {
  return requiredIds.every((id) => state.collected.has(id));
}

function openPuzzle() {
  if (!isReadyToSolve()) return;
  state.modal = "puzzle";
  ui.puzzle.classList.remove("is-hidden");
  renderPuzzle();
}

function closePuzzle() {
  ui.puzzle.classList.add("is-hidden");
  if (state.modal === "puzzle") state.modal = null;
}

function renderPuzzle() {
  ui.summary.innerHTML = renderCollectedSummary();
  ui.visual.innerHTML = renderInterpretationVisual();
  ui.form.reset();
  ui.form.classList.remove("is-wrong");
  ui.feedback.textContent = "각 자료의 제목과 단위를 확인하고, 현관 혼잡을 풀기 위해 필요한 값을 해석하세요.";
  ui.feedback.className = "interpretation-feedback";
  renderProgress();
  requestAnimationFrame(() => ui.fields.querySelector("input")?.focus());
}

function renderCollectedSummary() {
  return `
    <b>수집한 자료</b><br/>
    꺾은선그래프: ${ARRIVAL_INTERVALS.map((interval, index) => `${index + 1}. ${interval} ${ARRIVAL_FLOW[index]}명`).join(" / ")}<br/>
    원그래프: ${TRANSPORT_SHARE.map((item) => `${item.label} ${item.percent}%`).join(" / ")}<br/>
    빈자리 표: ${STORAGE_STATUS.map((item) => `${item.code}. ${item.label} ${item.emptySpots}자리`).join(" / ")}<br/>
    막대그래프: ${WAIT_TIMES.map((item) => `${item.label} ${item.minutes}분`).join(" / ")}
  `;
}

function renderInterpretationVisual() {
  const linePoints = ARRIVAL_FLOW.map((count, index) => {
    const x = 0.9 + index * 0.75;
    const y = 2.35 - (count / 55) * 1.45;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  const tableRows = STORAGE_STATUS.map((item, index) => {
    const y = 4.35 + index * 0.43;
    return `
      <rect class="dash-table-cell" x=".45" y="${y}" width=".45" height=".43"/>
      <rect class="dash-table-cell" x=".9" y="${y}" width="1.35" height=".43"/>
      <rect class="dash-table-cell" x="2.25" y="${y}" width=".7" height=".43"/>
      <text class="dash-small" x=".68" y="${y + 0.28}" text-anchor="middle">${item.code}</text>
      <text class="dash-small" x="1.58" y="${y + 0.28}" text-anchor="middle">${item.label.replace(" 보관소", "")}</text>
      <text class="dash-small" x="2.6" y="${y + 0.28}" text-anchor="middle">${item.emptySpots}</text>
    `;
  }).join("");

  const barRows = WAIT_TIMES.map((item, index) => {
    const y = 4.45 + index * 0.43;
    const widthValue = item.minutes * 0.22;
    const bestClass = item.minutes === 3 ? " best" : "";
    return `
      <text class="dash-small" x="6.3" y="${y + 0.18}" text-anchor="start">${item.label.replace(" 동선", "")}</text>
      <rect class="dash-bar${bestClass}" x="7.15" y="${y}" width="${widthValue.toFixed(2)}" height=".22" rx=".05"/>
      <text class="dash-small" x="${(7.25 + widthValue).toFixed(2)}" y="${y + 0.18}" text-anchor="start">${item.minutes}분</text>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 12 7.2" role="img" aria-label="현관 앞 표와 그래프 해석 자료">
      <rect class="dash-panel" x=".3" y=".35" width="4.2" height="2.65" rx=".16"/>
      <text class="dash-title" x="2.4" y=".72" text-anchor="middle">현관 도착 인원 꺾은선그래프</text>
      <line class="dash-axis" x1=".68" y1="2.48" x2="4.1" y2="2.48"/>
      <line class="dash-axis" x1=".68" y1="2.48" x2=".68" y2=".9"/>
      <polyline class="dash-line" points="${linePoints}"/>
      ${linePoints.split(" ").map((point) => {
        const [x, y] = point.split(",");
        return `<circle class="dash-dot" cx="${x}" cy="${y}" r=".08"/>`;
      }).join("")}
      ${ARRIVAL_INTERVALS.map((_, index) => `<text class="dash-small" x="${(0.9 + index * 0.75).toFixed(2)}" y="2.78" text-anchor="middle">${index + 1}</text>`).join("")}
      <text class="dash-small" x="2.4" y="2.95" text-anchor="middle">1~5번 시간대</text>

      <rect class="dash-panel" x="4.75" y=".35" width="3.05" height="2.65" rx=".16"/>
      <text class="dash-title" x="6.28" y=".72" text-anchor="middle">이동수단 원그래프</text>
      <circle cx="6.25" cy="1.7" r=".62" pathLength="100" fill="none" stroke="#55a7ff" stroke-width=".42" stroke-dasharray="36 64" transform="rotate(-90 6.25 1.7)"/>
      <circle cx="6.25" cy="1.7" r=".62" pathLength="100" fill="none" stroke="#ffb35b" stroke-width=".42" stroke-dasharray="24 76" stroke-dashoffset="-36" transform="rotate(-90 6.25 1.7)"/>
      <circle cx="6.25" cy="1.7" r=".62" pathLength="100" fill="none" stroke="#ff7ba8" stroke-width=".42" stroke-dasharray="20 80" stroke-dashoffset="-60" transform="rotate(-90 6.25 1.7)"/>
      <circle cx="6.25" cy="1.7" r=".62" pathLength="100" fill="none" stroke="#c0d8a5" stroke-width=".42" stroke-dasharray="20 80" stroke-dashoffset="-80" transform="rotate(-90 6.25 1.7)"/>
      <text class="dash-small" x="5.15" y="2.55">자전거 36%</text>
      <text class="dash-small" x="6.55" y="2.55">인라인 24%</text>
      <text class="dash-small" x="5.15" y="2.78">킥보드 20%</text>
      <text class="dash-small" x="6.55" y="2.78">도보 20%</text>

      <rect class="dash-panel" x="8.05" y=".35" width="3.65" height="2.65" rx=".16"/>
      <text class="dash-title" x="9.88" y=".72" text-anchor="middle">해석 미션</text>
      <text class="dash-small" x="8.35" y="1.2">1. 가장 붐비는 시간대</text>
      <text class="dash-small" x="8.35" y="1.58">2. 가장 많은 보관 대상</text>
      <text class="dash-small" x="8.35" y="1.96">3. 빈자리가 많은 보관소</text>
      <text class="dash-small" x="8.35" y="2.34">4. 대기시간이 짧은 동선</text>

      <rect class="dash-panel" x=".3" y="3.55" width="4.2" height="3.05" rx=".16"/>
      <text class="dash-title" x="2.4" y="3.92" text-anchor="middle">보관소 빈자리 표</text>
      <rect class="dash-table-head" x=".45" y="4.02" width=".45" height=".33"/>
      <rect class="dash-table-head" x=".9" y="4.02" width="1.35" height=".33"/>
      <rect class="dash-table-head" x="2.25" y="4.02" width=".7" height=".33"/>
      <text class="dash-small" x=".68" y="4.25" text-anchor="middle">구역</text>
      <text class="dash-small" x="1.58" y="4.25" text-anchor="middle">보관소</text>
      <text class="dash-small" x="2.6" y="4.25" text-anchor="middle">빈자리</text>
      ${tableRows}

      <rect class="dash-panel" x="4.75" y="3.55" width="6.95" height="3.05" rx=".16"/>
      <text class="dash-title" x="8.23" y="3.92" text-anchor="middle">동선별 평균 대기시간 막대그래프</text>
      ${barRows}
      <text class="dash-small" x="8.23" y="6.28" text-anchor="middle">대기시간은 작을수록 빠른 동선이다.</text>
    </svg>
  `;
}

function submitInterpretation(event) {
  event.preventDefault();
  if (state.modal !== "puzzle") return;
  const submitted = Object.fromEntries(["busiestInterval", "topTransport", "emptySpots", "bestStorage", "shortestRoute"].map((name) => [name, ui.form.elements[name]?.value ?? ""]));
  if (Object.values(submitted).some((value) => String(value).trim() === "")) {
    showError("안내 방송에 필요한 해석 칸을 모두 채워야 해.");
    return;
  }
  const result = checkDashboardInterpretationAnswer(submitted);
  if (!result.correct) {
    showError(getFeedbackForChecks(result.checks));
    return;
  }
  closePuzzle();
  playResolution(result.summary);
}

function getFeedbackForChecks(checks) {
  if (!checks.busiestInterval) return "꺾은선그래프에서 점이 가장 높은 시간대를 다시 찾아보자. 시간대 번호로 적어도 돼.";
  if (!checks.topTransport) return "원그래프에서 보관소가 필요한 이동수단 중 가장 큰 비율을 다시 확인해 보자.";
  if (!checks.emptySpots) return "빈자리 표에서 가장 큰 빈자리 수를 찾아보자.";
  if (!checks.bestStorage) return "빈자리가 가장 많은 보관소 이름이나 구역 문자를 다시 확인해 보자.";
  return "막대그래프에서 대기시간이 가장 짧은 동선을 찾아야 해. 대기시간은 작을수록 좋아.";
}

function showError(message) {
  ui.feedback.textContent = message;
  ui.feedback.className = "interpretation-feedback is-error";
  ui.form.classList.remove("is-wrong");
  void ui.form.offsetWidth;
  ui.form.classList.add("is-wrong");
}

function playResolution(summary) {
  state.modal = "resolution";
  state.resolving = true;
  state.resolutionProgress = 0;
  ui.resolutionTitle.textContent = "자전거 학생들이 후문 보관소로 움직이고 있어!";
  ui.resolutionText.textContent = `꺾은선그래프에서 ${summary.peakArrival.interval}에 ${summary.peakArrival.count}명으로 가장 붐비는 것을 확인했다. 원그래프에서는 보관 대상 중 자전거가 ${summary.topTransport.percent}%로 가장 많고, 표에서는 ${summary.mostVacantStorage.label}가 ${summary.mostVacantStorage.emptySpots}자리로 가장 여유 있다. 막대그래프에서도 ${summary.shortestWaitRoute.label}이 ${summary.shortestWaitRoute.minutes}분으로 가장 짧으므로, WH는 자전거 학생들을 후문 보관소로 안내했다.`;
  ui.resolution.classList.remove("is-hidden");
}

function completeMap() {
  ui.resolution.classList.add("is-hidden");
  ui.hud.classList.add("is-hidden");
  ui.guide.classList.add("is-hidden");
  state.resolving = false;
  state.modal = null;
  ui.complete.classList.remove("is-hidden");
  ui.replay.focus();
}

function showDialogue(speaker, text) {
  ui.dialogueSpeaker.textContent = speaker;
  ui.dialogueText.textContent = text;
  ui.dialogue.classList.remove("is-hidden");
  state.modal = "dialogue";
}

function closeDialogue() {
  ui.dialogue.classList.add("is-hidden");
  if (state.modal === "dialogue") state.modal = null;
}

function openInventory() {
  renderInventory();
  ui.inventory.classList.remove("is-hidden");
  state.modal = "inventory";
}

function closeInventory() {
  ui.inventory.classList.add("is-hidden");
  if (state.modal === "inventory") state.modal = null;
}

function renderInventory() {
  ui.textbookList.innerHTML = textbookEntries.map((entry) => `
    <div class="inventory-item"><b>${entry.title}</b>${entry.body}</div>
  `).join("");
  const notes = [];
  if (state.collected.has("teacher")) notes.push(["해결 목적", "현관 앞 보관소 혼잡을 풀기 위해 표와 그래프를 해석해 안내 방송을 작성해야 한다."]);
  if (state.collected.has("students")) notes.push(["학생들 상황", "자전거를 세울 곳을 몰라 현관 앞 줄이 멈춰 있다. 방송이 나오면 이동할 수 있다."]);
  if (state.collected.has("arrivalBoard")) notes.push(["꺾은선그래프", ARRIVAL_INTERVALS.map((interval, index) => `${interval}: ${ARRIVAL_FLOW[index]}명`).join(", ")]);
  if (state.collected.has("shareChart")) notes.push(["원그래프", TRANSPORT_SHARE.map((item) => `${item.label}: ${item.percent}%`).join(", ")]);
  if (state.collected.has("storageTable")) notes.push(["보관소 빈자리 표", STORAGE_STATUS.map((item) => `${item.code} ${item.label}: ${item.emptySpots}자리`).join(", ")]);
  if (state.collected.has("waitBoard")) notes.push(["막대그래프", WAIT_TIMES.map((item) => `${item.label}: ${item.minutes}분`).join(", ")]);
  if (isReadyToSolve()) notes.push(["해결 준비", "안내 방송 책상에서 가장 붐비는 시간대, 주요 이동수단, 보관소 빈자리와 대기시간을 해석할 수 있다."]);
  ui.notesList.innerHTML = notes.length
    ? notes.map(([title, body]) => `<div class="inventory-item"><b>${title}</b>${body}</div>`).join("")
    : `<div class="inventory-item is-empty">아직 모은 정보가 없다. 학교 현관 앞 사람들과 전광판을 조사해 보자.</div>`;
  ui.inventoryHint.textContent = isReadyToSolve()
    ? "정보가 충분하다. 안내 방송 책상에서 표와 그래프 해석을 마무리할 수 있다."
    : "교과서는 읽는 방법을 알려 주지만, 전광판의 실제 값은 직접 조사해야 한다.";
  renderProgress();
}

function updateObjective() {
  if (!state.collected.has("teacher")) {
    ui.objective.textContent = "생활안전부 선생님에게 현관 앞 상황을 물어보자.";
  } else if (!state.collected.has("students")) {
    ui.objective.textContent = "현관 앞 학생들에게 무엇 때문에 막혔는지 들어보자.";
  } else if (!state.collected.has("arrivalBoard")) {
    ui.objective.textContent = "도착 인원 꺾은선그래프를 조사해 가장 붐비는 시간대를 찾자.";
  } else if (!state.collected.has("shareChart")) {
    ui.objective.textContent = "이동수단 원그래프를 조사해 보관 대상이 가장 많은 이동수단을 찾자.";
  } else if (!state.collected.has("storageTable")) {
    ui.objective.textContent = "보관소 빈자리 표를 조사해 여유 있는 보관소를 찾자.";
  } else if (!state.collected.has("waitBoard")) {
    ui.objective.textContent = "동선 대기시간 막대그래프를 조사해 가장 빠른 동선을 찾자.";
  } else {
    ui.objective.textContent = "안내 방송 책상에서 표와 그래프 해석을 마무리하자.";
  }
  renderProgress();
}

function getRequiredCount() {
  return requiredIds.length;
}

function getCollectedCount() {
  return requiredIds.filter((id) => state.collected.has(id)).length;
}

function renderProgress() {
  ui.count.textContent = `${getCollectedCount()} / ${getRequiredCount()}`;
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const density = Math.min(2, devicePixelRatio || 1);
  width = Math.max(320, rect.width);
  height = Math.max(360, rect.height);
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  ctx.setTransform(density, 0, 0, density, 0, 0);
}

function drawScene(now) {
  const density = Math.min(2, devicePixelRatio || 1);
  ctx.setTransform(density, 0, 0, density, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#8fe4ff");
  sky.addColorStop(0.46, "#eefdff");
  sky.addColorStop(0.47, "#dff5cf");
  sky.addColorStop(1, "#82d46d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  drawSun(now);
  drawGround();
  drawSchoolEntrance();
  drawBikeLane();
  drawWorldObjects(now);
  drawWH();
}

function drawSun(now) {
  const x = width * 0.82;
  const y = height * 0.14;
  const glow = ctx.createRadialGradient(x, y, 18, x, y, 120 + Math.sin(now / 600) * 7);
  glow.addColorStop(0, "rgba(255,209,102,.96)");
  glow.addColorStop(0.38, "rgba(255,209,102,.28)");
  glow.addColorStop(1, "rgba(255,209,102,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x, y, 42, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround() {
  ctx.fillStyle = "#dcecc7";
  ctx.fillRect(0, height * 0.5, width, height * 0.5);
  ctx.fillStyle = "#e8cf99";
  ctx.beginPath();
  ctx.moveTo(width * 0.07, height);
  ctx.quadraticCurveTo(width * 0.45, height * 0.62, width * 0.95, height * 0.78);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillRect(width * 0.08, height * 0.58, width * 0.84, 14);
}

function drawSchoolEntrance() {
  ctx.save();
  ctx.translate(width * 0.52, height * 0.28);
  ctx.fillStyle = "rgba(255,255,255,.84)";
  ctx.fillRect(-280, 30, 560, 175);
  ctx.fillStyle = "#ffbd73";
  ctx.beginPath();
  ctx.moveTo(-300, 30);
  ctx.lineTo(0, -70);
  ctx.lineTo(300, 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7fdcff";
  for (let i = 0; i < 8; i += 1) ctx.fillRect(-210 + i * 60, 66, 34, 24);
  ctx.fillStyle = "#234156";
  ctx.font = "950 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("SCHOOL ENTRANCE", 0, 154);
  ctx.restore();
}

function drawBikeLane() {
  ctx.save();
  ctx.strokeStyle = "rgba(29, 111, 71, .45)";
  ctx.lineWidth = 5;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.moveTo(width * 0.78, height * 0.76);
  ctx.quadraticCurveTo(width * 0.88, height * 0.66, width * 0.93, height * 0.52);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#1b9d58";
  ctx.font = "900 13px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("후문 보관소 방향", width * 0.89, height * 0.5);
  ctx.restore();
}

function drawWorldObjects(now) {
  drawTeacher(objects.teacher.x * width, objects.teacher.y * height);
  drawStudents(now);
  drawBoard(objects.arrivalBoard.x * width, objects.arrivalBoard.y * height, "꺾은선", "#55a7ff", state.collected.has("arrivalBoard"));
  drawBoard(objects.shareChart.x * width, objects.shareChart.y * height, "원그래프", "#ffb35b", state.collected.has("shareChart"));
  drawBoard(objects.storageTable.x * width, objects.storageTable.y * height, "빈자리표", "#2da85a", state.collected.has("storageTable"));
  drawBoard(objects.waitBoard.x * width, objects.waitBoard.y * height, "막대그래프", "#ff7ba8", state.collected.has("waitBoard"));
  drawGuideDesk(objects.guideDesk.x * width, objects.guideDesk.y * height, now);
}

function drawTeacher(x, y) {
  drawPerson(x, y, "#2da85a", "선생님");
}

function drawStudents(now) {
  const baseX = objects.students.x * width;
  const baseY = objects.students.y * height;
  const start = [[-45, 2], [-12, -10], [22, 3], [54, -8], [85, 4]];
  const targetBaseX = width * 0.9;
  const targetBaseY = height * 0.56;
  const progress = state.resolving ? easeOutCubic(state.resolutionProgress) : 0;
  const colors = ["#55a7ff", "#ff7ba8", "#ffb35b", "#69c78e", "#9a7bff"];
  start.forEach(([sx, sy], index) => {
    const x = lerp(baseX + sx, targetBaseX - 38 + index * 20, progress);
    const y = lerp(baseY + sy, targetBaseY + (index % 2) * 11, progress);
    drawChildWithWheel(x, y + Math.sin(now / 240 + index) * 1.4, colors[index], index);
  });
}

function drawPerson(x, y, color, label) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(35,65,86,.13)";
  ctx.beginPath();
  ctx.ellipse(0, 48, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4c7a8";
  ctx.beginPath();
  ctx.arc(0, -28, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6d4b35";
  ctx.beginPath();
  ctx.arc(0, -36, 18, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-16, -10, 32, 50, 10);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label, 0, 58);
  ctx.restore();
}

function drawChildWithWheel(x, y, color, index) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#234156";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-16, 36, 9, 0, Math.PI * 2);
  ctx.arc(18, 36, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(35,65,86,.12)";
  ctx.beginPath();
  ctx.ellipse(0, 45, 25, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4c7a8";
  ctx.beginPath();
  ctx.arc(0, -24, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-13, -8, 26, 40, 10);
  ctx.fill();
  ctx.fillStyle = "#234156";
  ctx.font = "900 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(index === 0 ? "?" : "!", 0, 55);
  ctx.restore();
}

function drawBoard(x, y, label, color, known) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#8a5a35";
  ctx.fillRect(-5, 42, 10, 72);
  ctx.fillStyle = known ? "#f4fff6" : "#fff8df";
  ctx.strokeStyle = known ? "#2da85a" : "#ffd166";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-58, -46, 116, 86, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  if (label === "꺾은선") {
    ctx.beginPath();
    ctx.moveTo(-32, 12);
    ctx.lineTo(-14, -12);
    ctx.lineTo(5, 4);
    ctx.lineTo(30, -22);
    ctx.stroke();
  } else if (label === "원그래프") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -8, 24, 0, Math.PI * 1.4);
    ctx.lineTo(0, -8);
    ctx.fill();
    ctx.strokeStyle = "#234156";
    ctx.beginPath();
    ctx.arc(0, -8, 24, 0, Math.PI * 2);
    ctx.stroke();
  } else if (label === "빈자리표") {
    ctx.strokeStyle = color;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-32, -22 + i * 18);
      ctx.lineTo(32, -22 + i * 18);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-32 + i * 32, -22);
      ctx.lineTo(-32 + i * 32, 14);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = color;
    [-25, -8, 9, 26].forEach((barX, index) => {
      ctx.fillRect(barX, 18 - index * 8, 12, 14 + index * 8);
    });
  }
  ctx.fillStyle = "#234156";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label, 0, 32);
  ctx.restore();
}

function drawGuideDesk(x, y, now) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#8a5a35";
  ctx.fillRect(-132, 42, 264, 18);
  ctx.fillRect(-105, 58, 18, 70);
  ctx.fillRect(88, 58, 18, 70);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(-118, -20, 236, 68, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(35,65,86,.14)";
  ctx.stroke();
  ctx.fillStyle = "#1b9d58";
  ctx.font = "900 12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("안내 방송 책상", 0, 8);
  ctx.fillStyle = "#4a6675";
  ctx.font = "800 10px system-ui";
  ctx.fillText("자료 해석 후 Space", 0, 30);
  ctx.fillStyle = `rgba(45,168,90,${0.35 + Math.sin(now / 300) * 0.08})`;
  ctx.beginPath();
  ctx.arc(88, -18, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWH() {
  const x = state.player.x * width;
  const y = state.player.y * height;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.92, 0.92);
  ctx.fillStyle = "rgba(35,65,86,.16)";
  ctx.beginPath();
  ctx.ellipse(0, -8, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1b8f88";
  ctx.beginPath();
  ctx.roundRect(-22, -72, 44, 54, 13);
  ctx.fill();
  ctx.fillStyle = "#efc3a9";
  ctx.beginPath();
  ctx.arc(0, -94, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#17223b";
  ctx.beginPath();
  ctx.arc(0, -103, 25, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("WH", 0, -39);
  ctx.restore();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}
