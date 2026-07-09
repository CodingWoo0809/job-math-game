import { evaluateEstimationAnswer } from "./estimation-logic.mjs";
import {
  ESTIMATION_TASKS,
  MAP2_HINTS,
  MAP2_RECORD_IDS,
  MAP2_RECORDS
} from "./map2-data.mjs";
import { assetManager } from "./asset-manager.mjs";

const SAVE_KEY = "wh-math-adventure-1map2";
const canvas = document.querySelector("#map2-canvas");
const ctx = canvas.getContext("2d");

const ui = {
  hud: document.querySelector("#map2-hud"),
  objective: document.querySelector("#map2-objective"),
  prompt: document.querySelector("#map2-interaction-prompt"),
  promptText: document.querySelector("#map2-interaction-text"),
  toast: document.querySelector("#map2-toast"),
  startScreen: document.querySelector("#map2-start-screen"),
  startButton: document.querySelector("#map2-start-button"),
  notebookButton: document.querySelector("#map2-notebook-button"),
  notebookCount: document.querySelector("#map2-notebook-count"),
  notebook: document.querySelector("#map2-notebook"),
  notebookClose: document.querySelector("#map2-notebook-close"),
  notebookEntries: document.querySelector("#map2-notebook-entries"),
  dialogue: document.querySelector("#map2-dialogue"),
  speakerAvatar: document.querySelector("#map2-speaker-avatar"),
  speakerName: document.querySelector("#map2-speaker-name"),
  dialogueText: document.querySelector("#map2-dialogue-text"),
  dialogueNext: document.querySelector("#map2-dialogue-next"),
  settlement: document.querySelector("#settlement-panel"),
  settlementClose: document.querySelector("#settlement-close"),
  settlementContent: document.querySelector("#settlement-content"),
  settlementSuccess: document.querySelector("#settlement-success"),
  taskList: document.querySelector("#estimate-task-list"),
  stampProgress: document.querySelector("#stamp-progress"),
  hintButton: document.querySelector("#map2-hint-button"),
  hintText: document.querySelector("#map2-hint-text"),
  openGate: document.querySelector("#open-market-gate"),
  complete: document.querySelector("#map2-complete"),
  replay: document.querySelector("#map2-replay"),
  next: document.querySelector("#map2-next"),
  touchControls: document.querySelector("#map2-touch-controls"),
  touchLeft: document.querySelector("#map2-touch-left"),
  touchRight: document.querySelector("#map2-touch-right"),
  touchInteract: document.querySelector("#map2-touch-interact")
};

const makeState = () => ({
  started: false,
  playerX: 190,
  direction: 1,
  cameraX: 0,
  questStarted: false,
  records: new Set(),
  solved: new Set(),
  hints: { sales: 0, budget: 0, deposit: 0 },
  nearby: null,
  gateOpening: false,
  gateOpen: false,
  gateLift: 0,
  complete: false,
  dialogueQueue: [],
  dialogueCallback: null,
  focusX: null,
  focusTimer: 0,
  walkTime: 0,
  lastTime: performance.now()
});

let state = makeState();
let viewWidth = 1280;
let viewHeight = 720;
let groundY = 540;
let toastTimer = null;
const keys = { left: false, right: false };

const world = {
  width: 2780,
  gateX: 2250,
  interactions: [
    { id: "manager", x: 520, radius: 86, label: "재무 담당자와 대화" },
    { id: "sales", x: 890, radius: 75, label: "매출 집계표 확인" },
    { id: "budget", x: 1280, radius: 75, label: "구매 견적서 확인" },
    { id: "deposit", x: 1660, radius: 75, label: "현금 계수표 확인" },
    { id: "terminal", x: 1990, radius: 88, label: "정산 단말기 사용" }
  ]
};

const INTRO_DIALOGUE = [
  { speaker: "WH", avatar: "WH", text: "시장문이 잠겨 있네. 이 길이 학교로 가는 지름길인데." },
  {
    speaker: "재무 담당자",
    avatar: "정산",
    text: "전날 정산이 끝나야 보행문을 열 수 있어. 큰 금액 세 개를 업무 목적에 맞게 어림해야 해."
  },
  {
    speaker: "WH",
    avatar: "WH",
    text: "매출 집계표, 구매 견적서와 현금 계수표를 확인한 뒤 정산을 도와드릴게요."
  }
];

resizeCanvas();
renderTasks();
renderNotebook();
renderStampProgress();
assetManager.loadAll().catch((error) => console.warn(error));
requestAnimationFrame(loop);

ui.startButton.addEventListener("click", startGame);
ui.notebookButton.addEventListener("click", () => openPanel(ui.notebook));
ui.notebookClose.addEventListener("click", () => closePanel(ui.notebook));
ui.dialogueNext.addEventListener("click", advanceDialogue);
ui.settlementClose.addEventListener("click", () => closePanel(ui.settlement));
ui.hintButton.addEventListener("click", showHint);
ui.openGate.addEventListener("click", confirmSettlement);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href = "./1map3.html"; });

ui.taskList.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-task]");
  if (!form) return;
  event.preventDefault();
  submitTask(form);
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);
window.addEventListener("blur", clearMovement);
bindHold(ui.touchLeft, "left");
bindHold(ui.touchRight, "right");
ui.touchInteract.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  interact();
});

function startGame() {
  state.started = true;
  state.lastTime = performance.now();
  ui.startScreen.classList.add("is-hidden");
  ui.hud.classList.remove("is-hidden");
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
    ui.touchControls.classList.remove("is-hidden");
  }
  updateObjective();
  canvas.focus();
}

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  state = makeState();
  ui.complete.classList.add("is-hidden");
  ui.startScreen.classList.remove("is-hidden");
  ui.hud.classList.add("is-hidden");
  ui.touchControls.classList.add("is-hidden");
  ui.settlementContent.classList.remove("is-hidden");
  ui.settlementSuccess.classList.add("is-hidden");
  renderTasks();
  renderNotebook();
  renderStampProgress();
}

function saveGame() {
  if (!state.started) return;
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      records: [...state.records],
      solved: [...state.solved],
      gateOpen: state.gateOpen,
      playerX: Math.round(state.playerX)
    })
  );
}

function keyDown(event) {
  if (event.target instanceof HTMLInputElement) return;
  if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D", "e", "E", "Enter", " "].includes(event.key)) {
    event.preventDefault();
  }
  if (event.key === "Escape") {
    if (!ui.settlement.classList.contains("is-hidden")) closePanel(ui.settlement);
    else if (!ui.notebook.classList.contains("is-hidden")) closePanel(ui.notebook);
    else if (!ui.dialogue.classList.contains("is-hidden")) advanceDialogue();
    return;
  }
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = true;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = true;
  if ((event.key === "Enter" || event.key === " ") && !ui.dialogue.classList.contains("is-hidden")) {
    advanceDialogue();
    return;
  }
  if (event.key.toLowerCase() === "e" || event.key === "Enter") interact();
}

function keyUp(event) {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = false;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = false;
}

function bindHold(button, direction) {
  const start = (event) => {
    event.preventDefault();
    keys[direction] = true;
  };
  const stop = (event) => {
    event.preventDefault();
    keys[direction] = false;
  };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("pointerleave", stop);
}

function clearMovement() {
  keys.left = false;
  keys.right = false;
}

function loop(now) {
  const dt = Math.min(0.034, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  if (!state.started || state.complete) return;

  if (state.focusTimer > 0) {
    state.focusTimer -= dt;
    if (state.focusTimer <= 0 && !state.gateOpening) state.focusX = null;
  }

  if (state.gateOpening) {
    state.gateLift = Math.min(170, state.gateLift + 95 * dt);
    if (state.gateLift >= 170) {
      state.gateOpening = false;
      state.gateOpen = true;
      state.focusX = null;
      showToast("시장 보행문이 열렸어. 다음 길로 이동하자!");
      updateObjective();
      saveGame();
    }
  }

  if (!paused()) {
    let direction = 0;
    if (keys.left) direction -= 1;
    if (keys.right) direction += 1;
    if (direction) {
      state.playerX += direction * 240 * dt;
      state.direction = direction;
      state.walkTime += dt * 10;
      const limit = state.gateOpen ? world.width - 60 : world.gateX - 58;
      state.playerX = Math.max(80, Math.min(limit, state.playerX));
    }
  }

  updateNearby();
  updateCamera(dt);
  if (state.gateOpen && state.playerX > 2580) completeMap();
}

function paused() {
  return (
    !ui.dialogue.classList.contains("is-hidden") ||
    !ui.notebook.classList.contains("is-hidden") ||
    !ui.settlement.classList.contains("is-hidden")
  );
}

function updateNearby() {
  if (paused() || state.gateOpening) {
    state.nearby = null;
    ui.prompt.classList.add("is-hidden");
    return;
  }
  let nearest = null;
  let distance = Infinity;
  for (const item of world.interactions) {
    const current = Math.abs(state.playerX - item.x);
    if (current <= item.radius && current < distance) {
      nearest = item;
      distance = current;
    }
  }
  state.nearby = nearest?.id ?? null;
  if (nearest) {
    ui.promptText.textContent = nearest.label;
    ui.prompt.classList.remove("is-hidden");
  } else {
    ui.prompt.classList.add("is-hidden");
  }
}

function interact() {
  if (!state.started || paused() || state.gateOpening || !state.nearby) return;
  const id = state.nearby;
  if (id === "manager") {
    if (!state.questStarted) {
      showDialogue(INTRO_DIALOGUE, () => {
        state.questStarted = true;
        updateObjective();
      });
    } else {
      const missing = MAP2_RECORD_IDS.length - state.records.size;
      showDialogue([
        {
          speaker: "재무 담당자",
          avatar: "정산",
          text: missing ? `정산 자료가 ${missing}개 더 필요해. 세 점포의 문서를 확인해 줘.` : "자료가 모두 모였어. 보행문 앞 정산 단말기를 사용해 줘."
        }
      ]);
    }
    return;
  }

  if (!state.questStarted) {
    showToast("먼저 시장 재무 담당자에게 상황을 물어보자.");
    return;
  }

  if (MAP2_RECORD_IDS.includes(id)) {
    collectRecord(id);
    return;
  }

  if (id === "terminal") {
    if (state.records.size < MAP2_RECORD_IDS.length) {
      showToast(`정산 자료가 ${MAP2_RECORD_IDS.length - state.records.size}개 부족해.`);
      return;
    }
    openSettlement();
  }
}

function collectRecord(id) {
  const record = MAP2_RECORDS[id];
  if (state.records.has(id)) {
    showToast(`${record.title}: ${record.detail}`);
    return;
  }
  state.records.add(id);
  renderNotebook();
  updateObjective();
  showToast(`정산 수첩 기록 · ${record.title}`);
  saveGame();
}

function renderNotebook() {
  ui.notebookCount.textContent = String(state.records.size);
  if (!state.records.size) {
    ui.notebookEntries.innerHTML = '<div class="note-empty">아직 기록한 정산 자료가 없어.<br />시장 점포를 살펴보자.</div>';
    return;
  }
  ui.notebookEntries.innerHTML = [...state.records]
    .map((id) => {
      const record = MAP2_RECORDS[id];
      return `<article class="note-entry"><span>${record.category}</span><strong>${record.title}</strong><p>${record.detail}</p></article>`;
    })
    .join("");
}

function renderTasks() {
  ui.taskList.innerHTML = ESTIMATION_TASKS.map((task) => {
    const solved = state.solved.has(task.id);
    return `
      <form class="estimate-task${solved ? " is-complete" : ""}" data-task="${task.id}" novalidate>
        <div class="task-topline"><span class="task-document">${task.document}</span><span class="method-pill">${task.method}</span></div>
        <h3>${task.prompt}</h3>
        <p class="task-reason">직무 목적 · ${task.reason}</p>
        <div class="money-input">
          <input name="answer" inputmode="numeric" autocomplete="off" placeholder="숫자로 입력" ${solved ? `value="${task.answer.toLocaleString("ko-KR")}" disabled` : ""} aria-label="${task.document} 정답" />
          <span>원</span>
        </div>
        <p class="task-feedback${solved ? " is-success" : ""}" aria-live="polite">${solved ? `${task.method} 정산 완료` : "자리와 어림 방법을 확인해 답을 입력해."}</p>
        <button class="task-check" type="submit" ${solved ? "disabled" : ""}>${solved ? "도장 완료 ✓" : "정산 도장 받기"}</button>
      </form>`;
  }).join("");
}

function submitTask(form) {
  const taskId = form.dataset.task;
  const input = form.elements.answer;
  const feedback = form.querySelector(".task-feedback");
  const result = evaluateEstimationAnswer(taskId, input.value);
  feedback.textContent = result.message;
  feedback.classList.toggle("is-error", !result.ok);
  feedback.classList.toggle("is-success", result.ok);
  if (!result.ok) return;

  state.solved.add(taskId);
  input.disabled = true;
  form.querySelector("button").disabled = true;
  form.querySelector("button").textContent = "도장 완료 ✓";
  form.classList.add("is-complete");
  renderStampProgress();
  saveGame();
  if (state.solved.size === ESTIMATION_TASKS.length) {
    setTimeout(showSettlementSuccess, 450);
  }
}

function renderStampProgress() {
  ui.stampProgress.innerHTML = ESTIMATION_TASKS.map(
    (task) => `<span class="${state.solved.has(task.id) ? "is-complete" : ""}">${task.method}${state.solved.has(task.id) ? " ✓" : ""}</span>`
  ).join("");
}

function showHint() {
  const current = ESTIMATION_TASKS.find((task) => !state.solved.has(task.id));
  if (!current) {
    ui.hintText.textContent = "세 가지 정산을 모두 완료했어.";
    return;
  }
  const index = Math.min(state.hints[current.id], MAP2_HINTS[current.id].length - 1);
  ui.hintText.textContent = `${current.method} · ${MAP2_HINTS[current.id][index]}`;
  state.hints[current.id] = Math.min(index + 1, MAP2_HINTS[current.id].length - 1);
}

function openSettlement() {
  clearMovement();
  renderTasks();
  renderStampProgress();
  if (state.solved.size === ESTIMATION_TASKS.length) showSettlementSuccess();
  else {
    ui.settlementContent.classList.remove("is-hidden");
    ui.settlementSuccess.classList.add("is-hidden");
  }
  openPanel(ui.settlement);
}

function showSettlementSuccess() {
  ui.settlementContent.classList.add("is-hidden");
  ui.settlementSuccess.classList.remove("is-hidden");
  ui.openGate.focus();
}

function confirmSettlement() {
  closePanel(ui.settlement);
  showDialogue([
    { speaker: "재무 담당자", avatar: "정산", text: "세 문서가 모두 목적에 맞게 작성됐어. 이제 시장문을 열게!" },
    { speaker: "WH", avatar: "WH", text: "어림은 그냥 대충 계산하는 게 아니라, 필요한 방식으로 수를 나타내는 거구나." }
  ], startGateOpening);
}

function startGateOpening() {
  state.gateOpening = true;
  state.focusX = world.gateX;
  state.focusTimer = 3;
  updateObjective();
}

function updateObjective() {
  if (state.gateOpen) ui.objective.textContent = "열린 시장문을 지나 다음 등굣길로 이동하자.";
  else if (state.gateOpening) ui.objective.textContent = "시장 보행문이 열리고 있어.";
  else if (state.solved.size === 3) ui.objective.textContent = "정산 단말기에서 시장문 열기를 확정하자.";
  else if (state.records.size === 3) ui.objective.textContent = "시장문 앞 정산 단말기에서 세 문서를 처리하자.";
  else if (state.questStarted) ui.objective.textContent = `시장 정산 자료 수집 ${state.records.size}/3`;
  else ui.objective.textContent = "시장 재무 담당자에게 상황을 물어보자.";
}

function showDialogue(lines, callback = null) {
  clearMovement();
  state.dialogueQueue = [...lines];
  state.dialogueCallback = callback;
  ui.dialogue.classList.remove("is-hidden");
  showDialogueLine();
}

function showDialogueLine() {
  const line = state.dialogueQueue[0];
  ui.speakerName.textContent = line.speaker;
  ui.speakerAvatar.textContent = line.avatar;
  ui.speakerAvatar.style.background = line.avatar === "WH" ? "#1b8f88" : "#8c4260";
  ui.dialogueText.textContent = line.text;
  ui.dialogueNext.focus();
}

function advanceDialogue() {
  if (ui.dialogue.classList.contains("is-hidden")) return;
  state.dialogueQueue.shift();
  if (state.dialogueQueue.length) return showDialogueLine();
  ui.dialogue.classList.add("is-hidden");
  const callback = state.dialogueCallback;
  state.dialogueCallback = null;
  if (callback) callback();
  canvas.focus();
}

function openPanel(panel) {
  clearMovement();
  panel.classList.remove("is-hidden");
  panel.querySelector("button, input")?.focus();
}

function closePanel(panel) {
  panel.classList.add("is-hidden");
  clearMovement();
  canvas.focus();
}

function showToast(message) {
  if (toastTimer) clearTimeout(toastTimer);
  ui.toast.textContent = message;
  ui.toast.classList.remove("is-hidden");
  toastTimer = setTimeout(() => ui.toast.classList.add("is-hidden"), 2500);
}

function completeMap() {
  state.complete = true;
  clearMovement();
  ui.hud.classList.add("is-hidden");
  ui.prompt.classList.add("is-hidden");
  ui.touchControls.classList.add("is-hidden");
  ui.complete.classList.remove("is-hidden");
  ui.replay.focus();
  saveGame();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  viewWidth = Math.max(320, rect.width);
  viewHeight = Math.max(360, rect.height);
  groundY = Math.max(330, viewHeight * 0.76);
  canvas.width = Math.round(viewWidth * ratio);
  canvas.height = Math.round(viewHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function updateCamera(dt) {
  let target = state.playerX - viewWidth * 0.4;
  if (state.focusX !== null) target = (state.playerX + state.focusX) / 2 - viewWidth / 2;
  target = Math.max(0, Math.min(world.width - viewWidth, target));
  state.cameraX += (target - state.cameraX) * (1 - Math.exp(-4.5 * dt));
}

function sx(x, parallax = 1) {
  return x - state.cameraX * parallax;
}

function draw() {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, viewWidth, viewHeight);
  drawSky();
  drawBackground();
  drawGround();
  drawMap2Scenery();
  drawEntrance();
  drawStall(720, "과일·채소", "#d85e52", "sales");
  drawStall(1100, "공동 포장재", "#4a8d72", "budget");
  drawStall(1480, "현금 보관소", "#d99c35", "deposit");
  drawOffice();
  drawGate();
  drawPeople();
  drawTerminal();
  drawMarkers();
  drawWH();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
  gradient.addColorStop(0, "#9fcfc7");
  gradient.addColorStop(0.68, "#ead9b4");
  gradient.addColorStop(1, "#f3c987");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewWidth, viewHeight);
  ctx.fillStyle = "rgba(255,221,132,0.9)";
  ctx.beginPath();
  ctx.arc(viewWidth - 135, 96, 46, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground() {
  ctx.fillStyle = "#6f9274";
  ctx.beginPath();
  ctx.moveTo(0, groundY - 85);
  for (let x = -100; x < viewWidth + 200; x += 180) {
    const px = x - (state.cameraX * 0.14) % 180;
    ctx.quadraticCurveTo(px + 90, groundY - 230, px + 180, groundY - 85);
  }
  ctx.lineTo(viewWidth, groundY);
  ctx.lineTo(0, groundY);
  ctx.fill();
  ctx.fillStyle = "rgba(76,75,71,0.32)";
  for (let x = -80; x < viewWidth + 140; x += 115) {
    const px = x - (state.cameraX * 0.26) % 115;
    ctx.fillRect(px, groundY - 180, 76, 95);
  }
}

function drawGround() {
  ctx.fillStyle = "#d6bf97";
  ctx.fillRect(0, groundY - 26, viewWidth, 48);
  ctx.fillStyle = "#8d7765";
  ctx.fillRect(0, groundY + 22, viewWidth, viewHeight - groundY);
  ctx.strokeStyle = "rgba(255,245,220,0.26)";
  ctx.lineWidth = 2;
  for (let x = -((state.cameraX * 1.1) % 90); x < viewWidth + 90; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 22);
    ctx.lineTo(x - 25, viewHeight);
    ctx.stroke();
  }
}

function drawMap2Scenery() {
  const scenery = [
    ["props.tree", 335, 250, 1],
    ["props.flowerbed", 610, 92, 0.92],
    ["props.grass", 1350, 82, 0.82],
    ["props.tree", 2175, 235, 0.92],
    ["props.bench", 2380, 110, 0.9],
    ["props.trashCan", 2060, 108, 0.9]
  ];

  for (const [key, worldX, height, alpha] of scenery) {
    const x = sx(worldX);
    if (x < -180 || x > viewWidth + 180) continue;
    assetManager.draw(ctx, key, { x, y: groundY + 4, height, alpha });
  }
}

function drawEntrance() {
  const x = sx(250);
  if (x < -280 || x > viewWidth + 280) return;
  if (assetManager.draw(ctx, "props.jobMathRpgRaceArch", {
    x,
    y: groundY + 8,
    height: 270,
    alpha: 0.98
  })) {
    drawEntranceLabel(x, "아침뜰 시장");
    return;
  }

  ctx.fillStyle = "#563756";
  ctx.fillRect(x - 210, groundY - 265, 18, 265);
  ctx.fillRect(x + 180, groundY - 265, 18, 265);
  roundRect(ctx, x - 218, groundY - 300, 405, 58, 18);
  ctx.fill();
  ctx.fillStyle = "#fff0cf";
  ctx.font = "950 25px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("아침뜰 시장", x - 16, groundY - 264);
}

function drawEntranceLabel(x, label) {
  const labelWidth = 172;
  const labelHeight = 44;
  const labelX = x - labelWidth / 2;
  const labelY = groundY - 224;
  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 224, 0.94)";
  ctx.strokeStyle = "#26304f";
  ctx.lineWidth = 3;
  roundRect(ctx, labelX, labelY, labelWidth, labelHeight, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#563756";
  ctx.font = "950 23px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label, x, labelY + 29);
  ctx.restore();
}

function drawStall(x, name, color, recordId) {
  const px = sx(x);
  if (px < -280 || px > viewWidth + 280) return;
  const buildingByRecord = {
    sales: "buildings.financeMarket",
    budget: "buildings.packagingWarehouse",
    deposit: "buildings.cashVault"
  };
  const buildingKey = buildingByRecord[recordId];
  if (buildingKey && assetManager.draw(ctx, buildingKey, { x: px + 150, y: groundY - 20, height: recordId === "sales" ? 305 : 325 })) {
    drawDocumentStand(x + 150, recordId, color);
    return;
  }
  ctx.fillStyle = "#f4e3c4";
  roundRect(ctx, px, groundY - 280, 300, 254, 10);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(px - 10, groundY - 282, 320, 32);
  ctx.fillStyle = "#fff5dc";
  ctx.font = "900 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(name, px + 150, groundY - 259);
  for (let i = 0; i < 7; i += 1) {
    ctx.fillStyle = i % 2 ? "#fff2d6" : color;
    ctx.beginPath();
    ctx.moveTo(px + i * 46 - 5, groundY - 238);
    ctx.lineTo(px + i * 46 + 41, groundY - 238);
    ctx.lineTo(px + i * 46 + 34, groundY - 198);
    ctx.lineTo(px + i * 46 + 2, groundY - 198);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#6e584a";
  ctx.fillRect(px + 30, groundY - 145, 240, 72);
  ctx.fillStyle = "#b78855";
  for (let i = 0; i < 4; i += 1) ctx.fillRect(px + 45 + i * 57, groundY - 130, 42, 36);
  drawDocumentStand(x + 150, recordId, color);
}

function drawDocumentStand(x, recordId, color) {
  const px = sx(x);
  const easelByRecord = {
    sales: "props.salesSummaryEasel",
    budget: "props.purchaseQuoteEasel",
    deposit: "props.cashCountEasel"
  };
  const easelKey = easelByRecord[recordId];
  if (easelKey && assetManager.draw(ctx, easelKey, { x: px, y: groundY + 2, height: 110 })) {
    if (state.records.has(recordId)) {
      ctx.fillStyle = "#4a8d72";
      ctx.beginPath();
      ctx.arc(px + 35, groundY - 112, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "900 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("✓", px + 35, groundY - 108);
    }
    return;
  }
  ctx.fillStyle = "#4a4d4d";
  ctx.fillRect(px - 3, groundY - 88, 6, 88);
  ctx.fillStyle = color;
  roundRect(ctx, px - 36, groundY - 125, 72, 55, 6);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(px - 26, groundY - 116, 52, 38);
  ctx.fillStyle = state.records.has(recordId) ? "#4a8d72" : "#6a5b57";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(state.records.has(recordId) ? "기록 완료 ✓" : "정산 자료", px, groundY - 93);
}

function drawOffice() {
  const x = sx(1990);
  if (x < -300 || x > viewWidth + 300) return;
  if (assetManager.draw(ctx, "buildings.marketOperationsOffice", {
    x,
    y: groundY - 4,
    height: 340,
    alpha: 0.98
  })) return;

  const left = x - 130;
  ctx.fillStyle = "#ddd1c3";
  roundRect(ctx, left, groundY - 300, 260, 275, 10);
  ctx.fill();
  ctx.fillStyle = "#563756";
  ctx.fillRect(left - 8, groundY - 300, 276, 42);
  ctx.fillStyle = "#fff1d6";
  ctx.font = "900 17px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("?? ?? ???", left + 130, groundY - 273);
  ctx.fillStyle = "#8fb8b0";
  ctx.fillRect(left + 30, groundY - 230, 200, 92);
  ctx.fillStyle = "#4c3e48";
  roundRect(ctx, left + 86, groundY - 132, 88, 107, 5);
  ctx.fill();
}

function drawTerminal() {
  const x = sx(1990);
  if (x < -80 || x > viewWidth + 80) return;
  ctx.fillStyle = "#43394a";
  roundRect(ctx, x - 42, groundY - 152, 84, 118, 11);
  ctx.fill();
  ctx.fillStyle = state.records.size === 3 ? "#f3dca5" : "#988c91";
  roundRect(ctx, x - 32, groundY - 139, 64, 58, 6);
  ctx.fill();
  ctx.fillStyle = "#563756";
  ctx.font = "900 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${state.solved.size}/3 정산`, x, groundY - 107);
  ctx.fillStyle = "#5b6061";
  ctx.fillRect(x - 4, groundY - 34, 8, 34);
}

function drawGate() {
  const x = sx(world.gateX);
  if (x < -180 || x > viewWidth + 180) return;
  const gateKey = state.gateOpen || state.gateOpening || state.gateLift > 0 ? "props.openIronGate" : "props.closedIronGate";
  if (assetManager.draw(ctx, gateKey, {
    x,
    y: groundY + 8,
    height: 238
  })) {
    return;
  }

  ctx.fillStyle = "#4d354e";
  ctx.fillRect(x - 110, groundY - 270, 26, 270);
  ctx.fillRect(x + 84, groundY - 270, 26, 270);
  ctx.fillRect(x - 120, groundY - 282, 240, 28);
  ctx.fillStyle = "#f3dca5";
  ctx.font = "900 13px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(state.gateOpen ? "?? ?? ? ?? ??" : "?? ? ? ?? ??", x, groundY - 264);
  ctx.save();
  ctx.translate(0, -state.gateLift);
  for (let i = -74; i <= 74; i += 37) {
    ctx.fillStyle = "#6a4a68";
    ctx.fillRect(x + i - 6, groundY - 244, 12, 244);
  }
  ctx.fillRect(x - 80, groundY - 80, 160, 12);
  ctx.restore();
}

function drawPeople() {
  drawMap2Person(520, "financeManager", "#8c4260", "정산", 178);
  drawMap2Person(1010, "pedestrian04", "#4a8d72", "상인", 136);
  drawMap2Person(1760, "pedestrian01", "#d99c35", "상인", 142);
}

function drawMap2Person(x, characterKey, fallbackColor, label, height) {
  const px = sx(x);
  if (px < -90 || px > viewWidth + 90) return;
  ctx.fillStyle = "rgba(30,30,35,0.18)";
  ctx.beginPath();
  ctx.ellipse(px, groundY + 3, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const drawn = characterKey.startsWith("pedestrian")
    ? assetManager.drawCharacter(ctx, characterKey, { x: px, y: groundY + 2, height, direction: "front" })
    : assetManager.draw(ctx, `characters.${characterKey}`, { x: px, y: groundY + 2, height });
  if (!drawn) drawPerson(x, fallbackColor, label);
}

function drawPerson(x, shirt) {
  const px = sx(x);
  if (px < -60 || px > viewWidth + 60) return;
  ctx.save();
  ctx.translate(px, groundY);
  ctx.fillStyle = "rgba(30,30,35,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 3, 25, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#34333f";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, -43); ctx.lineTo(-12, -3);
  ctx.moveTo(8, -43); ctx.lineTo(13, -3);
  ctx.stroke();
  ctx.fillStyle = shirt;
  roundRect(ctx, -27, -105, 54, 67, 15);
  ctx.fill();
  ctx.fillStyle = "#edc2a7";
  ctx.beginPath();
  ctx.arc(0, -132, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#34333f";
  ctx.beginPath();
  ctx.arc(0, -139, 27, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMarkers() {
  if (!state.questStarted) drawMarker(520, state.nearby === "manager");
  if (state.questStarted) {
    for (const id of MAP2_RECORD_IDS) {
      if (state.records.has(id)) continue;
      const interaction = world.interactions.find((item) => item.id === id);
      drawMarker(interaction.x, state.nearby === id);
    }
    if (state.records.size === 3 && state.solved.size < 3) drawMarker(1990, state.nearby === "terminal");
  }
}

function drawMarker(x, active) {
  const px = sx(x);
  if (px < -40 || px > viewWidth + 40) return;
  const bob = Math.sin(performance.now() / 260) * 4;
  ctx.fillStyle = active ? "#d85e52" : "#e5a83c";
  ctx.beginPath();
  ctx.arc(px, groundY - 184 + bob, active ? 16 : 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "950 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(active ? "E" : "!", px, groundY - 177 + bob);
}

function drawWH() {
  const x = sx(state.playerX);
  const moving = !paused() && (keys.left || keys.right);
  const swing = moving ? Math.sin(state.walkTime) * 11 : 0;
  const bob = moving ? Math.sin(state.walkTime * 2) * 2 : 0;
  if (assetManager.has("characters.wh")) {
    ctx.fillStyle = "rgba(20,30,40,0.2)";
    ctx.beginPath();
    ctx.ellipse(x, groundY + 4, 33, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    assetManager.drawCharacter(ctx, "wh", {
      x,
      y: groundY + 2 + bob,
      height: 170,
      direction: state.direction === -1 ? "left" : "right"
    });
    return;
  }
  ctx.save();
  ctx.translate(x, groundY - 2 + bob);
  ctx.scale(state.direction, 1);
  ctx.fillStyle = "rgba(20,30,40,0.2)";
  ctx.beginPath(); ctx.ellipse(0, 5, 33, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#1b2941"; ctx.lineWidth = 9; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, -48); ctx.lineTo(-12 - swing * 0.55, -5);
  ctx.moveTo(9, -48); ctx.lineTo(14 + swing * 0.55, -5);
  ctx.stroke();
  ctx.strokeStyle = "#f4b63e"; ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-18 - swing * 0.55, -4); ctx.lineTo(-6 - swing * 0.55, -4);
  ctx.moveTo(8 + swing * 0.55, -4); ctx.lineTo(22 + swing * 0.55, -4);
  ctx.stroke();
  ctx.fillStyle = "#1b8f88";
  roundRect(ctx, -27, -119, 58, 78, 20); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "950 12px system-ui"; ctx.textAlign = "center";
  ctx.save(); ctx.scale(state.direction, 1); ctx.fillText("WH", 2 * state.direction, -76); ctx.restore();
  ctx.fillStyle = "#efc3a9";
  ctx.beginPath(); ctx.arc(2, -151, 35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#17223b";
  ctx.beginPath(); ctx.arc(2, -162, 36, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#17223b"; ctx.lineWidth = 2;
  for (const eyeX of [2, 21]) {
    ctx.beginPath(); ctx.ellipse(eyeX, -151, 8, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#126b68"; ctx.beginPath(); ctx.arc(eyeX + 2, -150, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(eyeX + 3, -153, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
  }
  ctx.strokeStyle = "#9b4e49"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(12, -136, 6, 0.1, Math.PI - 0.1); ctx.stroke();
  ctx.restore();
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}
