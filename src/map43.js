import { GATE_TRAFFIC, TRAFFIC_INTERVALS, checkTrafficReportAnswer, getRelativeFrequencyRows, getTrafficReportSummary, sumCounts } from "./data-organization-logic.mjs";

const canvas = document.querySelector("#map43-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map43-hud"),
  objective: document.querySelector("#map43-objective"),
  count: document.querySelector("#data-count"),
  start: document.querySelector("#map43-start"),
  startButton: document.querySelector("#map43-start-button"),
  guide: document.querySelector("#map43-control-guide"),
  prompt: document.querySelector("#map43-interaction-prompt"),
  promptTarget: document.querySelector("#map43-interaction-target"),
  promptText: document.querySelector("#map43-interaction-text"),
  dialogue: document.querySelector("#map43-dialogue"),
  dialogueSpeaker: document.querySelector("#map43-dialogue-speaker"),
  dialogueText: document.querySelector("#map43-dialogue-text"),
  dialogueClose: document.querySelector("#map43-dialogue-close"),
  inventory: document.querySelector("#map43-inventory"),
  inventoryClose: document.querySelector("#map43-inventory-close"),
  textbookList: document.querySelector("#map43-textbook-list"),
  notesList: document.querySelector("#map43-notes-list"),
  inventoryHint: document.querySelector("#map43-inventory-hint"),
  puzzle: document.querySelector("#map43-puzzle"),
  puzzleClose: document.querySelector("#data-close"),
  summary: document.querySelector("#data-summary"),
  visual: document.querySelector("#data-visual"),
  form: document.querySelector("#data-form"),
  fields: document.querySelector("#data-fields"),
  feedback: document.querySelector("#map43-feedback"),
  resolution: document.querySelector("#map43-resolution"),
  resolutionTitle: document.querySelector("#map43-resolution-title"),
  resolutionText: document.querySelector("#map43-resolution-text"),
  resolutionContinue: document.querySelector("#map43-resolution-continue"),
  complete: document.querySelector("#map43-complete"),
  replay: document.querySelector("#map43-replay"),
  next: document.querySelector("#map43-next")
};

const objects = Object.freeze({
  teacher: Object.freeze({ id: "teacher", kind: "teacher", label: "생활안전부 선생님", x: 0.22, y: 0.61 }),
  mainRecord: Object.freeze({ id: "mainRecord", kind: "mainRecord", label: "정문 통행량 기록판", x: 0.42, y: 0.55 }),
  backRecord: Object.freeze({ id: "backRecord", kind: "backRecord", label: "후문 통행량 기록판", x: 0.68, y: 0.55 }),
  graphKit: Object.freeze({ id: "graphKit", kind: "graphKit", label: "그래프 정리 키트", x: 0.36, y: 0.75 }),
  studentMemo: Object.freeze({ id: "studentMemo", kind: "studentMemo", label: "학생회 안내 메모", x: 0.80, y: 0.70 }),
  reportDesk: Object.freeze({ id: "reportDesk", kind: "reportDesk", label: "안전 배치 보고판", x: 0.55, y: 0.79 })
});

const textbookEntries = Object.freeze([
  { title: "도수분포표", body: "자료를 몇 개의 구간이나 항목으로 나누고, 각 구간에 속하는 자료의 개수인 도수를 표로 정리한 것이다." },
  { title: "상대도수분포표", body: "각 도수를 전체 자료 수로 나누어 전체에서 차지하는 비율을 나타낸 표이다. 서로 다른 자료의 비율을 비교할 때 유용하다." },
  { title: "꺾은선그래프", body: "시간에 따라 변하는 양을 점으로 찍고 선으로 이어 변화의 흐름을 보기 쉽게 나타낸 그래프이다." },
  { title: "목적에 맞는 표현", body: "정확한 값 확인은 표, 시간에 따른 변화 비교는 그래프처럼 자료를 쓰는 목적에 맞는 표현을 골라야 한다." }
]);

const makeState = () => ({
  started: false,
  modal: null,
  player: { x: 0.17, y: 0.78 },
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
ui.visual.innerHTML = renderDataVisual();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
ui.startButton.addEventListener("click", startGame);
ui.dialogueClose.addEventListener("click", closeDialogue);
ui.inventoryClose.addEventListener("click", closeInventory);
ui.puzzleClose.addEventListener("click", closePuzzle);
ui.form.addEventListener("submit", submitReport);
ui.resolutionContinue.addEventListener("click", completeMap);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href = "./4map4.html"; });

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
  if (state.resolving) state.resolutionProgress = Math.min(1, state.resolutionProgress + dt * 0.56);
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
  ui.promptText.textContent = nearest.kind === "reportDesk" ? "Space Bar로 보고서 정리" : "Space Bar로 대화/조사";
  ui.prompt.classList.remove("is-hidden");
}

function getNearestInteractable() {
  const candidates = Object.values(objects);
  let best = null;
  for (const candidate of candidates) {
    const distance = Math.hypot(candidate.x - state.player.x, (candidate.y - state.player.y) * 1.35);
    if (distance < 0.078 && (!best || distance < best.distance)) best = { ...candidate, distance };
  }
  return best;
}

function interact() {
  const target = getNearestInteractable();
  if (!target) {
    showDialogue("WH", "가까이에서 조사할 대상을 찾아보자. 선생님, 정문 기록판, 후문 기록판, 그래프 키트, 학생회 메모를 확인할 수 있어.");
    return;
  }
  if (target.kind === "teacher") inspectTeacher();
  else if (target.kind === "mainRecord") inspectGateRecord("main");
  else if (target.kind === "backRecord") inspectGateRecord("back");
  else if (target.kind === "graphKit") inspectGraphKit();
  else if (target.kind === "studentMemo") inspectStudentMemo();
  else inspectReportDesk();
}

function inspectTeacher() {
  state.collected.add("teacher");
  showDialogue("생활안전부 선생님", "정문과 후문 등교 통행량을 시간대별로 정리해야 해. 정확한 인원수, 전체에서 차지하는 비율, 시간에 따른 변화를 한꺼번에 보고 안전도우미를 어디에 보낼지 정해야 한단다.");
  updateObjective();
  renderInventory();
}

function inspectGateRecord(gateId) {
  const gate = GATE_TRAFFIC[gateId];
  state.collected.add(gateId === "main" ? "mainRecord" : "backRecord");
  showDialogue(`${gate.label} 통행량 기록판`, `${gate.label} 기록: ${TRAFFIC_INTERVALS.map((interval, index) => `${interval} ${gate.counts[index]}명`).join(", ")}.`);
  updateObjective();
  renderInventory();
}

function inspectGraphKit() {
  state.collected.add("graphKit");
  showDialogue("그래프 정리 키트", "인원수 자체를 정리할 때는 도수분포표, 비율을 비교할 때는 상대도수분포표, 시간대별 변화 흐름을 비교할 때는 꺾은선그래프가 알맞다.");
  updateObjective();
  renderInventory();
}

function inspectStudentMemo() {
  state.collected.add("studentMemo");
  showDialogue("학생회 안내 메모", "8시 40분 이후에도 후문 쪽으로 뛰어오는 학생이 많다는 민원이 있었어. 마지막 시간대의 변화도 꼭 확인해 줘.");
  updateObjective();
  renderInventory();
}

function inspectReportDesk() {
  if (!isReadyToSolve()) {
    showDialogue("안전 배치 보고판", `자료가 아직 부족하다. 현재 수집 자료는 ${getCollectedCount()}/${getRequiredCount()}개다.`);
    return;
  }
  openPuzzle();
}

function isReadyToSolve() {
  return ["teacher", "mainRecord", "backRecord", "graphKit", "studentMemo"].every((id) => state.collected.has(id));
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
  ui.visual.innerHTML = renderDataVisual();
  ui.form.reset();
  ui.form.classList.remove("is-wrong");
  ui.feedback.textContent = "목적에 맞는 표와 그래프 이름, 가장 붐비는 시간대 번호, 추가 배치 장소를 정리하세요.";
  ui.feedback.className = "data-feedback";
  renderProgress();
  requestAnimationFrame(() => ui.fields.querySelector("input")?.focus());
}

function renderCollectedSummary() {
  const main = GATE_TRAFFIC.main.counts.join(", ");
  const back = GATE_TRAFFIC.back.counts.join(", ");
  return `
    <b>수집한 자료</b><br/>
    시간대 번호: ${TRAFFIC_INTERVALS.map((interval, index) => `${index + 1}. ${interval}`).join(" / ")}<br/>
    정문 도수: ${main}명 · 총 ${sumCounts(GATE_TRAFFIC.main.counts)}명<br/>
    후문 도수: ${back}명 · 총 ${sumCounts(GATE_TRAFFIC.back.counts)}명<br/>
    목적: 안전도우미 배치를 위해 정확한 인원수, 비율, 시간대별 변화를 함께 정리하기
  `;
}

function renderDataVisual() {
  const mainRows = getRelativeFrequencyRows(GATE_TRAFFIC.main);
  const backRows = getRelativeFrequencyRows(GATE_TRAFFIC.back);
  const tableRows = TRAFFIC_INTERVALS.map((interval, index) => {
    const y = 1.15 + index * 0.55;
    return `
      <rect class="data-table-cell" x=".35" y="${y}" width="1.6" height=".55"/>
      <rect class="data-table-cell" x="1.95" y="${y}" width=".85" height=".55"/>
      <rect class="data-table-cell" x="2.8" y="${y}" width=".85" height=".55"/>
      <rect class="data-table-cell" x="3.65" y="${y}" width=".95" height=".55"/>
      <rect class="data-table-cell" x="4.6" y="${y}" width=".95" height=".55"/>
      <text class="data-small" x="1.15" y="${y + 0.35}" text-anchor="middle">${index + 1}. ${interval.slice(0, 5)}</text>
      <text class="data-small" x="2.38" y="${y + 0.35}" text-anchor="middle">${mainRows[index].frequency}</text>
      <text class="data-small" x="3.23" y="${y + 0.35}" text-anchor="middle">${backRows[index].frequency}</text>
      <text class="data-small" x="4.13" y="${y + 0.35}" text-anchor="middle">${mainRows[index].percent}%</text>
      <text class="data-small" x="5.08" y="${y + 0.35}" text-anchor="middle">${backRows[index].percent}%</text>
    `;
  }).join("");
  const mainPoints = makeLinePoints(GATE_TRAFFIC.main.counts);
  const backPoints = makeLinePoints(GATE_TRAFFIC.back.counts);
  return `
    <svg viewBox="0 0 12 7.2" role="img" aria-label="정문과 후문 통행량 자료 정리">
      <text class="data-label" x="2.95" y=".38" text-anchor="middle">도수분포표 + 상대도수분포표</text>
      <rect class="data-table-head" x=".35" y=".6" width="1.6" height=".55"/>
      <rect class="data-table-head" x="1.95" y=".6" width=".85" height=".55"/>
      <rect class="data-table-head" x="2.8" y=".6" width=".85" height=".55"/>
      <rect class="data-table-head" x="3.65" y=".6" width=".95" height=".55"/>
      <rect class="data-table-head" x="4.6" y=".6" width=".95" height=".55"/>
      <text class="data-small" x="1.15" y=".95" text-anchor="middle">시간대</text>
      <text class="data-small" x="2.38" y=".95" text-anchor="middle">정문</text>
      <text class="data-small" x="3.23" y=".95" text-anchor="middle">후문</text>
      <text class="data-small" x="4.13" y=".95" text-anchor="middle">정문%</text>
      <text class="data-small" x="5.08" y=".95" text-anchor="middle">후문%</text>
      ${tableRows}
      <text class="data-label" x="8.8" y=".38" text-anchor="middle">꺾은선그래프</text>
      <line class="data-axis" x1="6.25" y1="4.45" x2="11.35" y2="4.45"/>
      <line class="data-axis" x1="6.25" y1="4.45" x2="6.25" y2=".95"/>
      <polyline class="data-line-main" points="${mainPoints}"/>
      <polyline class="data-line-back" points="${backPoints}"/>
      ${mainPoints.split(" ").map((point) => {
        const [x, y] = point.split(",");
        return `<circle class="data-dot-main" cx="${x}" cy="${y}" r=".09"/>`;
      }).join("")}
      ${backPoints.split(" ").map((point) => {
        const [x, y] = point.split(",");
        return `<circle class="data-dot-back" cx="${x}" cy="${y}" r=".09"/>`;
      }).join("")}
      <text class="data-small" x="7.35" y="5.0">● 정문</text>
      <text class="data-small" x="8.35" y="5.0">● 후문</text>
      <text class="data-small" x="8.8" y="5.55" text-anchor="middle">후문은 마지막 시간대에 가장 높아진다.</text>
    </svg>
  `;
}

function makeLinePoints(counts) {
  const max = 40;
  return counts.map((count, index) => {
    const x = 6.55 + index * 1.12;
    const y = 4.45 - (count / max) * 3.2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function submitReport(event) {
  event.preventDefault();
  if (state.modal !== "puzzle") return;
  const submitted = Object.fromEntries(["exactTable", "relativeTable", "graphType", "mainPeak", "backPeak", "helperGate"].map((name) => [name, ui.form.elements[name]?.value ?? ""]));
  if (Object.values(submitted).some((value) => String(value).trim() === "")) {
    showError("보고서의 모든 칸을 채워야 안전 배치표를 완성할 수 있어.");
    return;
  }
  const result = checkTrafficReportAnswer(submitted);
  if (!result.correct) {
    showError(getFeedbackForChecks(result.checks));
    return;
  }
  closePuzzle();
  playResolution(result.summary);
}

function getFeedbackForChecks(checks) {
  if (!checks.exactTable) return "정확한 인원수, 즉 도수를 정리하는 표 이름을 다시 확인해 보자.";
  if (!checks.relativeTable) return "전체에서 차지하는 비율을 나타내는 표 이름을 다시 확인해 보자.";
  if (!checks.graphType) return "시간에 따라 변하는 두 자료를 비교하기 좋은 그래프를 떠올려 보자.";
  if (!checks.mainPeak) return "정문 도수가 가장 큰 시간대는 표에서 가장 큰 정문 값을 찾으면 돼.";
  if (!checks.backPeak) return "후문 도수가 가장 큰 시간대는 표에서 가장 큰 후문 값을 찾으면 돼.";
  return "추가 안전도우미는 마지막에 가장 붐비는 쪽으로 보내야 해.";
}

function showError(message) {
  ui.feedback.textContent = message;
  ui.feedback.className = "data-feedback is-error";
  ui.form.classList.remove("is-wrong");
  void ui.form.offsetWidth;
  ui.form.classList.add("is-wrong");
}

function playResolution(summary) {
  state.modal = "resolution";
  state.resolving = true;
  state.resolutionProgress = 0;
  ui.resolutionTitle.textContent = "후문 쪽으로 안전도우미가 이동하고 있어!";
  ui.resolutionText.textContent = `정확한 인원수는 도수분포표로, 비율은 상대도수분포표로 정리했다. 시간대별 변화는 꺾은선그래프로 비교하니 정문은 ${summary.mainPeak.interval}에 ${summary.mainPeak.frequency}명, 후문은 ${summary.backPeak.interval}에 ${summary.backPeak.frequency}명으로 가장 붐볐다. 따라서 추가 안전도우미는 후문으로 보낸다.`;
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
  if (state.collected.has("teacher")) notes.push(["정리 목적", "정문·후문 통행량의 인원수, 비율, 시간대별 변화를 정리해 안전도우미 배치 장소를 정한다."]);
  if (state.collected.has("mainRecord")) notes.push(["정문 기록", TRAFFIC_INTERVALS.map((interval, index) => `${interval}: ${GATE_TRAFFIC.main.counts[index]}명`).join(", ")]);
  if (state.collected.has("backRecord")) notes.push(["후문 기록", TRAFFIC_INTERVALS.map((interval, index) => `${interval}: ${GATE_TRAFFIC.back.counts[index]}명`).join(", ")]);
  if (state.collected.has("graphKit")) notes.push(["표와 그래프 키트", "도수분포표, 상대도수분포표, 꺾은선그래프를 목적에 맞게 사용한다."]);
  if (state.collected.has("studentMemo")) notes.push(["학생회 메모", "8시 40분 이후 후문 쪽 민원이 많으므로 마지막 시간대 변화를 확인한다."]);
  if (isReadyToSolve()) notes.push(["해결 준비", "자료가 모두 모였다. 안전 배치 보고판에서 표와 그래프로 정리할 수 있다."]);
  ui.notesList.innerHTML = notes.length
    ? notes.map(([title, body]) => `<div class="inventory-item"><b>${title}</b>${body}</div>`).join("")
    : `<div class="inventory-item is-empty">아직 모은 자료가 없다. 학교 앞 기록판과 사람들을 조사해 보자.</div>`;
  ui.inventoryHint.textContent = isReadyToSolve()
    ? "자료가 충분하다. 안전 배치 보고판에서 정리할 수 있다."
    : "교과서는 표와 그래프의 쓰임을 알려 주지만, 목적과 통행량 자료는 직접 조사해야 한다.";
  renderProgress();
}

function updateObjective() {
  if (!state.collected.has("teacher")) {
    ui.objective.textContent = "생활안전부 선생님에게 자료 정리 목적을 물어보자.";
  } else if (!state.collected.has("mainRecord") || !state.collected.has("backRecord")) {
    ui.objective.textContent = `정문과 후문 통행량 기록판을 조사하자. (${Number(state.collected.has("mainRecord")) + Number(state.collected.has("backRecord"))}/2)`;
  } else if (!state.collected.has("graphKit")) {
    ui.objective.textContent = "그래프 정리 키트에서 표와 그래프의 쓰임을 확인하자.";
  } else if (!state.collected.has("studentMemo")) {
    ui.objective.textContent = "학생회 안내 메모를 확인해 배치 판단의 단서를 얻자.";
  } else {
    ui.objective.textContent = "안전 배치 보고판에서 자료를 표와 그래프로 정리하자.";
  }
  renderProgress();
}

function getRequiredCount() {
  return 5;
}

function getCollectedCount() {
  return ["teacher", "mainRecord", "backRecord", "graphKit", "studentMemo"].filter((id) => state.collected.has(id)).length;
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
  sky.addColorStop(0.48, "#eefdff");
  sky.addColorStop(0.49, "#dff5cf");
  sky.addColorStop(1, "#82d46d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  drawSun(now);
  drawGround();
  drawSchool();
  drawWorldObjects(now);
  drawWH();
}

function drawSun(now) {
  const x = width * 0.82;
  const y = height * 0.15;
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
  ctx.moveTo(width * 0.12, height * 0.72);
  ctx.quadraticCurveTo(width * 0.48, height * 0.58, width * 0.92, height);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.lineTo(0, height * 0.84);
  ctx.closePath();
  ctx.fill();
}

function drawSchool() {
  ctx.save();
  ctx.translate(width * 0.5, height * 0.28);
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.fillRect(-230, 55, 460, 150);
  ctx.fillStyle = "#ffbd73";
  ctx.beginPath();
  ctx.moveTo(-250, 55);
  ctx.lineTo(0, -50);
  ctx.lineTo(250, 55);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7fdcff";
  for (let i = 0; i < 7; i += 1) ctx.fillRect(-170 + i * 55, 88, 30, 24);
  ctx.fillStyle = "#234156";
  ctx.font = "950 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("SCHOOL", 0, 158);
  drawGateLabel(-150, 220, "정문");
  drawGateLabel(150, 220, "후문");
  ctx.restore();
}

function drawGateLabel(x, y, label) {
  ctx.fillStyle = "#fff8df";
  ctx.strokeStyle = "#8a5a35";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 42, y - 28, 84, 42, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#234156";
  ctx.font = "900 15px system-ui";
  ctx.fillText(label, x, y - 2);
}

function drawWorldObjects(now) {
  drawTeacher(objects.teacher.x * width, objects.teacher.y * height);
  drawRecordBoard(objects.mainRecord.x * width, objects.mainRecord.y * height, "정문", GATE_TRAFFIC.main.counts, state.collected.has("mainRecord"));
  drawRecordBoard(objects.backRecord.x * width, objects.backRecord.y * height, "후문", GATE_TRAFFIC.back.counts, state.collected.has("backRecord"));
  drawGraphKit(objects.graphKit.x * width, objects.graphKit.y * height, state.collected.has("graphKit"));
  drawStudent(objects.studentMemo.x * width, objects.studentMemo.y * height);
  drawReportDesk(objects.reportDesk.x * width, objects.reportDesk.y * height, now);
  if (state.resolving) drawSafetyHelper(now);
}

function drawTeacher(x, y) {
  drawPerson(x, y, "#2da85a", "선생님");
}

function drawStudent(x, y) {
  drawPerson(x, y, "#ffb35b", "학생회");
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

function drawRecordBoard(x, y, label, counts, known) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#8a5a35";
  ctx.fillRect(-44, 44, 10, 62);
  ctx.fillRect(34, 44, 10, 62);
  ctx.fillStyle = known ? "#f4fff6" : "#fff8df";
  ctx.strokeStyle = known ? "#2da85a" : "#ffd166";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-58, -48, 116, 92, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#234156";
  ctx.font = "950 13px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${label} 기록`, 0, -20);
  ctx.fillStyle = "#4a6675";
  ctx.font = "800 9px system-ui";
  ctx.fillText(known ? counts.join(" · ") : "기록 확인", 0, 14);
  ctx.restore();
}

function drawGraphKit(x, y, known) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = known ? "#f4fff6" : "#fff8df";
  ctx.strokeStyle = known ? "#2da85a" : "#ffd166";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-50, -36, 100, 72, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#55a7ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-30, 18);
  ctx.lineTo(-10, -8);
  ctx.lineTo(8, 4);
  ctx.lineTo(30, -20);
  ctx.stroke();
  ctx.fillStyle = "#234156";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("그래프 키트", 0, 31);
  ctx.restore();
}

function drawReportDesk(x, y, now) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#8a5a35";
  ctx.fillRect(-140, 42, 280, 18);
  ctx.fillRect(-112, 58, 18, 70);
  ctx.fillRect(96, 58, 18, 70);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(-128, -22, 256, 72, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(35,65,86,.14)";
  ctx.stroke();
  ctx.fillStyle = "#1b9d58";
  ctx.font = "900 12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("안전 배치 보고판", 0, 8);
  ctx.fillStyle = "#4a6675";
  ctx.font = "800 10px system-ui";
  ctx.fillText("자료 모은 뒤 Space", 0, 30);
  ctx.fillStyle = `rgba(45,168,90,${0.35 + Math.sin(now / 300) * 0.08})`;
  ctx.beginPath();
  ctx.arc(100, -20, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSafetyHelper(now) {
  const progress = easeOutCubic(state.resolutionProgress);
  const startX = objects.teacher.x * width;
  const startY = objects.teacher.y * height;
  const endX = width * 0.65;
  const endY = height * 0.56;
  drawPerson(lerp(startX, endX, progress), lerp(startY, endY, progress) + Math.sin(now / 130) * 2, "#55a7ff", "도우미");
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
