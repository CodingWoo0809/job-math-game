import {
  DECISION_CONTEXT,
  WAIT_TIME_RECORDS,
  checkWaitTimeDecisionAnswer,
  formatNumber,
  getDecisionSummary
} from "./data-decision-logic.mjs";
import { assetManager } from "./asset-manager.mjs";

const canvas = document.querySelector("#map45-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map45-hud"),
  objective: document.querySelector("#map45-objective"),
  count: document.querySelector("#decision-count"),
  start: document.querySelector("#map45-start"),
  startButton: document.querySelector("#map45-start-button"),
  guide: document.querySelector("#map45-control-guide"),
  prompt: document.querySelector("#map45-interaction-prompt"),
  promptTarget: document.querySelector("#map45-interaction-target"),
  promptText: document.querySelector("#map45-interaction-text"),
  dialogue: document.querySelector("#map45-dialogue"),
  dialogueSpeaker: document.querySelector("#map45-dialogue-speaker"),
  dialogueText: document.querySelector("#map45-dialogue-text"),
  dialogueClose: document.querySelector("#map45-dialogue-close"),
  inventory: document.querySelector("#map45-inventory"),
  inventoryClose: document.querySelector("#map45-inventory-close"),
  textbookList: document.querySelector("#map45-textbook-list"),
  notesList: document.querySelector("#map45-notes-list"),
  inventoryHint: document.querySelector("#map45-inventory-hint"),
  puzzle: document.querySelector("#map45-puzzle"),
  puzzleClose: document.querySelector("#decision-close"),
  summary: document.querySelector("#decision-summary"),
  visual: document.querySelector("#decision-visual"),
  form: document.querySelector("#decision-form"),
  fields: document.querySelector("#decision-fields"),
  feedback: document.querySelector("#map45-feedback"),
  resolution: document.querySelector("#map45-resolution"),
  resolutionTitle: document.querySelector("#map45-resolution-title"),
  resolutionText: document.querySelector("#map45-resolution-text"),
  resolutionContinue: document.querySelector("#map45-resolution-continue"),
  complete: document.querySelector("#map45-complete"),
  replay: document.querySelector("#map45-replay"),
  next: document.querySelector("#map45-next")
};

const objects = Object.freeze({
  teacher: Object.freeze({ id: "teacher", kind: "teacher", label: "수학 선생님", x: 0.18, y: 0.62 }),
  council: Object.freeze({ id: "council", kind: "council", label: "학생회 기록팀", x: 0.78, y: 0.66 }),
  recordBoard: Object.freeze({ id: "recordBoard", kind: "recordBoard", label: "7일 대기시간 기록판", x: 0.34, y: 0.55 }),
  formulaBoard: Object.freeze({ id: "formulaBoard", kind: "formulaBoard", label: "대푯값 안내판", x: 0.53, y: 0.54 }),
  outlierMemo: Object.freeze({ id: "outlierMemo", kind: "outlierMemo", label: "프린터 고장 메모", x: 0.70, y: 0.54 }),
  noticeDesk: Object.freeze({ id: "noticeDesk", kind: "noticeDesk", label: "대기시간 안내문 책상", x: 0.62, y: 0.79 })
});

const requiredIds = Object.freeze(["teacher", "council", "recordBoard", "formulaBoard", "outlierMemo"]);

const textbookEntries = Object.freeze([
  { title: "자료로 나타내기", body: "흩어져 있는 기록을 같은 단위의 숫자 자료로 나열하면 계산하고 비교하기 쉬워진다." },
  { title: "평균", body: "자료값의 합을 자료의 개수로 나눈 값이다. 극단적인 값이 있으면 평균이 그쪽으로 크게 움직일 수 있다." },
  { title: "중앙값", body: "자료를 작은 수부터 큰 수까지 늘어놓았을 때 가운데 있는 값이다. 극단적인 값의 영향을 평균보다 덜 받는다." },
  { title: "최빈값", body: "가장 자주 나타나는 값이다. 가장 흔한 값을 알려 주지만, 상황의 중심을 항상 잘 나타내는 것은 아니다." },
  { title: "대표값 선택", body: "평균, 중앙값, 최빈값 중 어떤 값이 가장 적절한지는 자료의 특징과 해결하려는 목적에 따라 달라진다." }
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
ui.visual.innerHTML = renderDecisionVisual();
assetManager.loadAll().catch((error) => console.warn(error));
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
ui.startButton.addEventListener("click", startGame);
ui.dialogueClose.addEventListener("click", closeDialogue);
ui.inventoryClose.addEventListener("click", closeInventory);
ui.puzzleClose.addEventListener("click", closePuzzle);
ui.form.addEventListener("submit", submitDecision);
ui.resolutionContinue.addEventListener("click", completeMap);
ui.replay.addEventListener("click", replayFinale);
ui.next.addEventListener("click", () => { window.location.href = "./index.html"; });

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
  if (state.resolving) state.resolutionProgress = Math.min(1, state.resolutionProgress + dt * 0.52);
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
  ui.promptText.textContent = nearest.kind === "noticeDesk" ? "Space Bar로 안내문 작성" : "Space Bar로 대화/조사";
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
    showDialogue("WH", "가까이에서 조사할 대상을 찾아보자. 선생님, 학생회 기록팀, 대기시간 기록판, 대푯값 안내판, 프린터 고장 메모를 확인할 수 있어.");
    return;
  }
  if (target.kind === "teacher") inspectTeacher();
  else if (target.kind === "council") inspectCouncil();
  else if (target.kind === "recordBoard") inspectRecordBoard();
  else if (target.kind === "formulaBoard") inspectFormulaBoard();
  else if (target.kind === "outlierMemo") inspectOutlierMemo();
  else inspectNoticeDesk();
}

function inspectTeacher() {
  state.collected.add("teacher");
  showDialogue("수학 선생님", "과제 제출 줄 안내문에 ‘평소 대기시간’을 적어야 해. 그런데 기록 중 하루는 기계 고장 때문에 시간이 크게 튀었단다. 어떤 대푯값을 써야 학생들에게 가장 도움이 될까?");
  updateObjective();
  renderInventory();
}

function inspectCouncil() {
  state.collected.add("council");
  showDialogue("학생회 기록팀", "우리가 7일 동안 과제 제출 줄 대기시간을 적어 뒀어. 그냥 평균만 내면 너무 길게 나오는 것 같고, 최빈값만 쓰면 너무 짧게 안내하는 것 같아.");
  updateObjective();
  renderInventory();
}

function inspectRecordBoard() {
  state.collected.add("recordBoard");
  showDialogue("7일 대기시간 기록판", `기록: ${WAIT_TIME_RECORDS.map((record) => `${record.day} ${record.minutes}분`).join(", ")}.`);
  updateObjective();
  renderInventory();
}

function inspectFormulaBoard() {
  state.collected.add("formulaBoard");
  showDialogue("대푯값 안내판", "평균은 자료값의 합을 자료의 개수로 나누어 구한다. 중앙값은 자료를 작은 수부터 늘어놓았을 때 가운데 값이고, 최빈값은 가장 자주 나타나는 값이다.");
  updateObjective();
  renderInventory();
}

function inspectOutlierMemo() {
  state.collected.add("outlierMemo");
  showDialogue("프린터 고장 메모", `${DECISION_CONTEXT.extremeCause}이 있다. 이 날은 평소 줄의 모습이라고 보기 어렵다. 극단적인 값이 있을 때는 평균이 크게 흔들릴 수 있다.`);
  updateObjective();
  renderInventory();
}

function inspectNoticeDesk() {
  if (!isReadyToSolve()) {
    showDialogue("대기시간 안내문 책상", `아직 결정 자료가 부족하다. 현재 수집 정보는 ${getCollectedCount()}/${getRequiredCount()}개다. 기록판과 대푯값 안내판, 고장 메모를 더 확인해 보자.`);
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
  ui.visual.innerHTML = renderDecisionVisual();
  ui.form.reset();
  ui.form.classList.remove("is-wrong");
  ui.feedback.textContent = "기록을 숫자 자료로 나타낸 뒤 평균, 중앙값, 최빈값을 각각 구하세요.";
  ui.feedback.className = "interpretation-feedback";
  renderProgress();
  requestAnimationFrame(() => ui.fields.querySelector("input")?.focus());
}

function renderCollectedSummary() {
  return `
    <b>수집한 자료</b><br/>
    기록: ${WAIT_TIME_RECORDS.map((record) => `${record.day} ${record.minutes}분`).join(" / ")}<br/>
    목적: ${DECISION_CONTEXT.purpose}<br/>
    주의: ${DECISION_CONTEXT.extremeCause}이 있어 평균이 커질 수 있음<br/>
    계산: 평균, 중앙값, 최빈값을 모두 비교한 뒤 상황에 맞는 대푯값 선택
  `;
}

function renderDecisionVisual() {
  const recordCards = WAIT_TIME_RECORDS.map((record, index) => {
    const x = 0.7 + (index % 4) * 2.7;
    const y = 1.0 + Math.floor(index / 4) * 1.55;
    const isExtreme = record.minutes >= 30;
    return `
      <rect class="dash-table-cell${isExtreme ? " decision-hot" : ""}" x="${x}" y="${y}" width="2.2" height="1.05" rx=".12"/>
      <text class="dash-title" x="${x + 1.1}" y="${y + .34}" text-anchor="middle">${record.day}</text>
      <text class="decision-big-number" x="${x + 1.1}" y="${y + .78}" text-anchor="middle">${record.minutes}분</text>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 12 7.2" role="img" aria-label="7일간 과제 제출 대기시간 기록">
      <text class="dash-title" x="6" y=".45" text-anchor="middle">과제 제출 줄 7일 대기시간 기록</text>
      ${recordCards}
      <rect class="dash-panel" x=".7" y="4.45" width="5.15" height="1.55" rx=".16"/>
      <text class="dash-title" x="3.28" y="4.86" text-anchor="middle">대푯값 계산</text>
      <text class="dash-small" x="1.05" y="5.28">평균 = 자료값의 합 ÷ 자료의 개수</text>
      <text class="dash-small" x="1.05" y="5.62">중앙값 = 작은 수부터 나열했을 때 가운데 값</text>
      <rect class="dash-panel" x="6.15" y="4.45" width="5.15" height="1.55" rx=".16"/>
      <text class="dash-title" x="8.72" y="4.86" text-anchor="middle">상황 판단</text>
      <text class="dash-small" x="6.5" y="5.28">최빈값 = 가장 자주 나타나는 값</text>
      <text class="dash-small" x="6.5" y="5.62">극단적인 기록이 있을 때 평균은 흔들릴 수 있음</text>
      <text class="dash-small" x="6" y="6.6" text-anchor="middle">먼저 숫자 자료로 나열하고, 세 대푯값을 모두 비교하자.</text>
    </svg>
  `;
}

function submitDecision(event) {
  event.preventDefault();
  if (state.modal !== "puzzle") return;
  const submitted = Object.fromEntries(["sortedData", "meanValue", "medianValue", "modeValue", "representativeValue"].map((name) => [name, ui.form.elements[name]?.value ?? ""]));
  if (Object.values(submitted).some((value) => String(value).trim() === "")) {
    showError("안내문을 작성하려면 모든 칸을 채워야 해.");
    return;
  }
  const result = checkWaitTimeDecisionAnswer(submitted);
  if (!result.correct) {
    showError(getFeedbackForChecks(result.checks));
    return;
  }
  closePuzzle();
  playResolution(result.summary);
}

function getFeedbackForChecks(checks) {
  if (!checks.sortedData) return "먼저 기록을 작은 수부터 차례대로 나열해 보자.";
  if (!checks.meanValue) return "평균은 모든 대기시간을 더한 뒤 자료의 개수로 나누어 구해.";
  if (!checks.medianValue) return "중앙값은 작은 수부터 나열했을 때 가운데에 있는 값이야.";
  if (!checks.modeValue) return "최빈값은 가장 자주 나타난 값이야.";
  return "극단적인 값이 있고, 최빈값이 안내 목적에 부족할 때 어떤 대푯값이 보통 상황을 더 잘 나타내는지 생각해 보자.";
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
  ui.resolutionTitle.textContent = "중앙값으로 안내문이 완성되고 있어!";
  ui.resolutionText.textContent = `자료를 작은 수부터 나열하면 ${summary.sortedData.join(", ")}이다. 평균은 ${formatNumber(summary.mean)}분으로 40분 기록 때문에 길게 느껴지고, 최빈값은 ${summary.modes.join(", ")}분이라 보통 대기시간을 안내하기에는 너무 짧다. 중앙값은 ${summary.median}분으로 극단적인 값의 영향을 덜 받으므로, 안내문에는 “${summary.finalNotice}”이라고 적는 것이 가장 알맞다.`;
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

function replayFinale() {
  ui.complete.classList.add("is-hidden");
  void ui.complete.offsetWidth;
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
  if (state.collected.has("teacher")) notes.push(["안내 목적", "과제 제출 줄의 평소 대기시간을 학생들에게 알려 주어야 한다."]);
  if (state.collected.has("council")) notes.push(["학생회 고민", "평균은 길게 느껴지고, 최빈값은 너무 짧게 안내하는 것 같다는 의견이 있다."]);
  if (state.collected.has("recordBoard")) notes.push(["7일 기록", WAIT_TIME_RECORDS.map((record) => `${record.day}: ${record.minutes}분`).join(", ")]);
  if (state.collected.has("formulaBoard")) notes.push(["대푯값", "평균, 중앙값, 최빈값을 각각 계산하고 상황에 맞게 비교한다."]);
  if (state.collected.has("outlierMemo")) notes.push(["극단값 단서", "프린터 고장으로 40분 기록이 생겼다. 평소 줄의 모습으로 보기 어렵다."]);
  if (isReadyToSolve()) notes.push(["해결 준비", "대기시간 안내문 책상에서 자료를 나열하고 대푯값을 계산할 수 있다."]);
  ui.notesList.innerHTML = notes.length
    ? notes.map(([title, body]) => `<div class="inventory-item"><b>${title}</b>${body}</div>`).join("")
    : `<div class="inventory-item is-empty">아직 모은 정보가 없다. 학교 안 사람들과 자료판을 조사해 보자.</div>`;
  ui.inventoryHint.textContent = isReadyToSolve()
    ? "정보가 충분하다. 안내문 책상에서 평균, 중앙값, 최빈값을 비교할 수 있다."
    : "교과서는 대푯값의 뜻을 알려 주지만, 실제 대기시간 기록은 직접 조사해야 한다.";
  renderProgress();
}

function updateObjective() {
  if (!state.collected.has("teacher")) {
    ui.objective.textContent = "수학 선생님에게 대기시간 안내 목적을 물어보자.";
  } else if (!state.collected.has("council")) {
    ui.objective.textContent = "학생회 기록팀에게 왜 대표값 선택이 어려운지 들어보자.";
  } else if (!state.collected.has("recordBoard")) {
    ui.objective.textContent = "7일 대기시간 기록판을 조사해 자료를 모으자.";
  } else if (!state.collected.has("formulaBoard")) {
    ui.objective.textContent = "대푯값 안내판에서 평균, 중앙값, 최빈값의 뜻을 확인하자.";
  } else if (!state.collected.has("outlierMemo")) {
    ui.objective.textContent = "프린터 고장 메모를 확인해 극단적인 기록의 이유를 찾자.";
  } else {
    ui.objective.textContent = "대기시간 안내문 책상에서 상황에 맞는 대푯값을 정하자.";
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
  drawCourtyard();
  drawClassroom();
  drawWorldObjects(now);
  drawWH();
}

function drawSun(now) {
  const x = width * 0.82;
  const y = height * 0.14;
  const glow = ctx.createRadialGradient(x, y, 18, x, y, 125 + Math.sin(now / 600) * 7);
  glow.addColorStop(0, "rgba(255,209,102,.96)");
  glow.addColorStop(0.38, "rgba(255,209,102,.28)");
  glow.addColorStop(1, "rgba(255,209,102,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 132, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x, y, 42, 0, Math.PI * 2);
  ctx.fill();
}

function drawCourtyard() {
  ctx.fillStyle = "#dcecc7";
  ctx.fillRect(0, height * 0.5, width, height * 0.5);
  ctx.fillStyle = "#e8cf99";
  ctx.beginPath();
  ctx.moveTo(width * 0.05, height);
  ctx.quadraticCurveTo(width * 0.44, height * 0.62, width * 0.95, height * 0.76);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
}

function drawClassroom() {
  ctx.save();
  ctx.translate(width * 0.52, height * 0.28);
  ctx.fillStyle = "rgba(255,255,255,.86)";
  ctx.fillRect(-285, 30, 570, 178);
  ctx.fillStyle = "#ffbd73";
  ctx.beginPath();
  ctx.moveTo(-305, 30);
  ctx.lineTo(0, -72);
  ctx.lineTo(305, 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7fdcff";
  for (let i = 0; i < 8; i += 1) ctx.fillRect(-215 + i * 62, 66, 35, 25);
  ctx.fillStyle = "#234156";
  ctx.font = "950 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("MATH CLASS", 0, 154);
  ctx.restore();
}

function drawWorldObjects(now) {
  drawTeacher(objects.teacher.x * width, objects.teacher.y * height);
  drawCouncil(now);
  drawBoard(objects.recordBoard.x * width, objects.recordBoard.y * height, "기록", "#55a7ff", state.collected.has("recordBoard"));
  drawBoard(objects.formulaBoard.x * width, objects.formulaBoard.y * height, "대표", "#ffb35b", state.collected.has("formulaBoard"));
  drawBoard(objects.outlierMemo.x * width, objects.outlierMemo.y * height, "고장", "#ff7ba8", state.collected.has("outlierMemo"));
  drawNoticeDesk(objects.noticeDesk.x * width, objects.noticeDesk.y * height, now);
  if (state.resolving) drawNoticeSign(now);
}

function drawTeacher(x, y) {
  if (assetManager.draw(ctx, "characters.mathTeacher", { x, y: y + 56, height: 154 })) {
    ctx.fillStyle = "#234156";
    ctx.font = "900 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("선생님", x, y + 62);
    return;
  }
  drawPerson(x, y, "#2da85a", "선생님");
}

function drawCouncil(now) {
  const baseX = objects.council.x * width;
  const baseY = objects.council.y * height;
  const positions = [[-38, 0], [-6, -12], [26, 1], [58, -9]];
  const colors = ["#55a7ff", "#ff7ba8", "#ffb35b", "#69c78e"];
  positions.forEach(([dx, dy], index) => drawChild(baseX + dx, baseY + dy + Math.sin(now / 250 + index) * 1.4, colors[index], index));
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

function drawChild(x, y, color, index) {
  const key = index % 2 === 0 ? "characters.elementaryBoy" : "characters.elementaryGirl";
  if (assetManager.draw(ctx, key, { x, y: y + 46, height: 96 })) {
    ctx.fillStyle = "#234156";
    ctx.font = "900 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(index === 0 ? "?" : "!", x, y + 50);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(35,65,86,.12)";
  ctx.beginPath();
  ctx.ellipse(0, 42, 21, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4c7a8";
  ctx.beginPath();
  ctx.arc(0, -27, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-13, -11, 26, 42, 10);
  ctx.fill();
  ctx.fillStyle = "#234156";
  ctx.font = "900 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(index === 0 ? "?" : "!", 0, 48);
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
  ctx.fillStyle = color;
  ctx.font = label === "대표" ? "950 18px system-ui" : "950 17px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label === "대표" ? "x̄" : label === "고장" ? "!" : "7일", 0, -4);
  ctx.fillText(label === "대표" ? "Me" : label === "고장" ? "40" : "분", 0, 18);
  ctx.fillStyle = "#234156";
  ctx.font = "900 10px system-ui";
  ctx.fillText(label, 0, 32);
  ctx.restore();
}

function drawNoticeDesk(x, y, now) {
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
  ctx.fillText("대기시간 안내문 책상", 0, 8);
  ctx.fillStyle = "#4a6675";
  ctx.font = "800 10px system-ui";
  ctx.fillText("자료 모은 뒤 Space", 0, 30);
  ctx.fillStyle = `rgba(45,168,90,${0.35 + Math.sin(now / 300) * 0.08})`;
  ctx.beginPath();
  ctx.arc(88, -18, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNoticeSign(now) {
  const progress = easeOutCubic(state.resolutionProgress);
  const x = lerp(width * 0.62, width * 0.48, progress);
  const y = lerp(height * 0.82, height * 0.56, progress);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = progress;
  ctx.fillStyle = "#fffef4";
  ctx.beginPath();
  ctx.roundRect(-80, -60, 160, 100, 16);
  ctx.fill();
  ctx.strokeStyle = "#2da85a";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#1b9d58";
  ctx.font = "900 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("평소 대기시간", 0, -20);
  ctx.font = "950 22px system-ui";
  ctx.fillText("약 9분", 0, 14 + Math.sin(now / 220) * 1);
  ctx.restore();
}

function drawWH() {
  const x = state.player.x * width;
  const y = state.player.y * height;
  if (assetManager.has("characters.wh")) {
    ctx.fillStyle = "rgba(35,65,86,.16)";
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    assetManager.draw(ctx, "characters.wh", { x, y: y + 2, height: 128 });
    return;
  }
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
