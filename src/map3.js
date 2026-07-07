import { evaluateConversionAnswer } from "./conversion-logic.mjs";
import { CONVERSION_HINTS, CONVERSION_TASKS, getConversionTask } from "./map3-data.mjs";
import { assetManager } from "./asset-manager.mjs";
import { getStudentSafeUrl } from "./access-control.mjs";

const canvas = document.querySelector("#map3-canvas");
const ctx = canvas.getContext("2d");

const ui = {
  hud: document.querySelector("#map3-hud"),
  objective: document.querySelector("#map3-objective"),
  count: document.querySelector("#device-count"),
  prompt: document.querySelector("#map3-interaction-prompt"),
  promptText: document.querySelector("#map3-interaction-text"),
  toast: document.querySelector("#map3-toast"),
  startScreen: document.querySelector("#map3-start-screen"),
  startButton: document.querySelector("#map3-start-button"),
  dialogue: document.querySelector("#map3-dialogue"),
  speakerAvatar: document.querySelector("#map3-speaker-avatar"),
  speakerName: document.querySelector("#map3-speaker-name"),
  dialogueText: document.querySelector("#map3-dialogue-text"),
  dialogueNext: document.querySelector("#map3-dialogue-next"),
  unitTableButton: document.querySelector("#unit-table-button"),
  unitTable: document.querySelector("#unit-table-panel"),
  unitTableClose: document.querySelector("#unit-table-close"),
  conversion: document.querySelector("#conversion-panel"),
  conversionClose: document.querySelector("#conversion-close"),
  conversionBadge: document.querySelector("#conversion-badge"),
  conversionTitle: document.querySelector("#conversion-title"),
  conversionPurpose: document.querySelector("#conversion-purpose"),
  conversionSource: document.querySelector("#conversion-source"),
  conversionQuestion: document.querySelector("#conversion-question"),
  conversionAnswer: document.querySelector("#conversion-answer"),
  conversionUnit: document.querySelector("#conversion-unit"),
  conversionFeedback: document.querySelector("#conversion-feedback"),
  conversionForm: document.querySelector("#conversion-form"),
  conversionHint: document.querySelector("#conversion-hint"),
  deviceIcon: document.querySelector("#device-icon"),
  gaugeFill: document.querySelector("#device-gauge-fill"),
  launchPanel: document.querySelector("#launch-panel"),
  launchSummary: document.querySelector("#launch-summary"),
  launchShuttle: document.querySelector("#launch-shuttle"),
  launchClose: document.querySelector("#launch-close"),
  complete: document.querySelector("#map3-complete"),
  replay: document.querySelector("#map3-replay"),
  chapter2: document.querySelector("#enter-chapter2"),
  touch: document.querySelector("#map3-touch-controls"),
  touchLeft: document.querySelector("#map3-touch-left"),
  touchRight: document.querySelector("#map3-touch-right"),
  touchInteract: document.querySelector("#map3-touch-interact")
};

const positions = Object.freeze({
  coolant: 740,
  equipment: 1080,
  schedule: 1420,
  timer: 1760,
  route: 2070
});

const icons = Object.freeze({ coolant: "◒", equipment: "▣", schedule: "◷", timer: "◴", route: "⌖" });
const colors = Object.freeze({ coolant: "#4ab7c3", equipment: "#e3a647", schedule: "#6f9ed2", timer: "#d87962", route: "#79aa6a" });

const makeState = () => ({
  started: false,
  playerX: 180,
  direction: 1,
  cameraX: 0,
  questStarted: false,
  solved: new Set(),
  currentTask: null,
  hintIndex: Object.fromEntries(CONVERSION_TASKS.map((task) => [task.id, 0])),
  nearby: null,
  dialogueQueue: [],
  dialogueCallback: null,
  focusX: null,
  focusTimer: 0,
  shuttleDeparting: false,
  shuttleOffset: 0,
  complete: false,
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
  width: 2880,
  technicianX: 460,
  shuttleX: 2420,
  interactions: [
    { id: "technician", x: 460, radius: 86, label: "운영 기술자와 대화" },
    ...CONVERSION_TASKS.map((task) => ({ id: task.id, x: positions[task.id], radius: 78, label: `${task.device} 점검` })),
    { id: "shuttle", x: 2420, radius: 105, label: "셔틀 주 제어 장치" }
  ]
};

const INTRO = [
  { speaker: "WH", avatar: "WH", text: "학교 방향 셔틀이 아직 출발하지 않았네." },
  {
    speaker: "운영 기술자",
    avatar: "기술",
    text: "교대 기록의 단위가 장치 표준과 달라서 자동 점검이 멈췄어. 다섯 장치의 값을 알맞은 단위로 바꿔야 해."
  },
  { speaker: "WH", avatar: "WH", text: "각 장치가 요구하는 단위를 확인해서 출발 준비를 끝내 볼게요." }
];

resize();
updateCount();
assetManager.loadAll().catch((error) => console.warn(error));
requestAnimationFrame(loop);

ui.startButton.addEventListener("click", startGame);
ui.dialogueNext.addEventListener("click", advanceDialogue);
ui.unitTableButton.addEventListener("click", () => openPanel(ui.unitTable));
ui.unitTableClose.addEventListener("click", () => closePanel(ui.unitTable));
ui.conversionClose.addEventListener("click", () => closePanel(ui.conversion));
ui.conversionForm.addEventListener("submit", submitConversion);
ui.conversionHint.addEventListener("click", showConversionHint);
ui.launchShuttle.addEventListener("click", launchShuttle);
ui.launchClose.addEventListener("click", () => closePanel(ui.launchPanel));
ui.replay.addEventListener("click", resetGame);
ui.chapter2.addEventListener("click", () => {
  const nextUrl = getStudentSafeUrl("./chapter2.html");
  if (nextUrl === "./chapter2.html") {
    window.location.href = "./chapter2.html";
  } else {
    window.location.href = nextUrl;
  }
});
if (getStudentSafeUrl("./chapter2.html") !== "./chapter2.html") ui.chapter2.textContent = "\uC624\uB298 \uCCB4\uD5D8\uD310 \uB9C8\uBB34\uB9AC";

window.addEventListener("resize", resize);
window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);
window.addEventListener("blur", clearMovement);
bindHold(ui.touchLeft, "left");
bindHold(ui.touchRight, "right");
ui.touchInteract.addEventListener("pointerdown", (event) => { event.preventDefault(); interact(); });

function startGame() {
  state.started = true;
  state.lastTime = performance.now();
  ui.startScreen.classList.add("is-hidden");
  ui.hud.classList.remove("is-hidden");
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) ui.touch.classList.remove("is-hidden");
  updateObjective();
  canvas.focus();
}

function resetGame() {
  state = makeState();
  ui.complete.classList.add("is-hidden");
  ui.startScreen.classList.remove("is-hidden");
  ui.hud.classList.add("is-hidden");
  ui.touch.classList.add("is-hidden");
  updateCount();
}

function keyDown(event) {
  if (event.target instanceof HTMLInputElement) return;
  if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D", "e", "E", "Enter", " "].includes(event.key)) event.preventDefault();
  if (event.key === "Escape") {
    if (!ui.launchPanel.classList.contains("is-hidden")) closePanel(ui.launchPanel);
    else if (!ui.conversion.classList.contains("is-hidden")) closePanel(ui.conversion);
    else if (!ui.unitTable.classList.contains("is-hidden")) closePanel(ui.unitTable);
    else if (!ui.dialogue.classList.contains("is-hidden")) advanceDialogue();
    return;
  }
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = true;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = true;
  if ((event.key === "Enter" || event.key === " ") && !ui.dialogue.classList.contains("is-hidden")) return advanceDialogue();
  if (event.key.toLowerCase() === "e" || event.key === "Enter") interact();
}

function keyUp(event) {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = false;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = false;
}

function bindHold(button, direction) {
  const start = (event) => { event.preventDefault(); keys[direction] = true; };
  const stop = (event) => { event.preventDefault(); keys[direction] = false; };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("pointerleave", stop);
}

function clearMovement() { keys.left = false; keys.right = false; }

function loop(now) {
  const dt = Math.min(.034, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  if (!state.started || state.complete) return;
  if (state.focusTimer > 0) {
    state.focusTimer -= dt;
    if (state.focusTimer <= 0 && !state.shuttleDeparting) state.focusX = null;
  }
  if (state.shuttleDeparting) {
    state.shuttleOffset += 330 * dt;
    if (state.shuttleOffset >= 900) completeMap();
  }
  if (!paused()) {
    let direction = 0;
    if (keys.left) direction -= 1;
    if (keys.right) direction += 1;
    if (direction) {
      state.playerX += direction * 245 * dt;
      state.direction = direction;
      state.walkTime += dt * 10;
      state.playerX = Math.max(75, Math.min(world.width - 75, state.playerX));
    }
  }
  updateNearby();
  updateCamera(dt);
}

function paused() {
  return !ui.dialogue.classList.contains("is-hidden") || !ui.unitTable.classList.contains("is-hidden") ||
    !ui.conversion.classList.contains("is-hidden") || !ui.launchPanel.classList.contains("is-hidden");
}

function updateNearby() {
  if (paused() || state.shuttleDeparting) {
    state.nearby = null;
    ui.prompt.classList.add("is-hidden");
    return;
  }
  let nearest = null;
  let distance = Infinity;
  for (const item of world.interactions) {
    const current = Math.abs(state.playerX - item.x);
    if (current <= item.radius && current < distance) { nearest = item; distance = current; }
  }
  state.nearby = nearest?.id ?? null;
  if (nearest) {
    ui.promptText.textContent = nearest.label;
    ui.prompt.classList.remove("is-hidden");
  } else ui.prompt.classList.add("is-hidden");
}

function interact() {
  if (!state.started || paused() || state.shuttleDeparting || !state.nearby) return;
  const id = state.nearby;
  if (id === "technician") {
    if (!state.questStarted) {
      showDialogue(INTRO, () => { state.questStarted = true; updateObjective(); });
    } else {
      const left = CONVERSION_TASKS.length - state.solved.size;
      showDialogue([{ speaker: "운영 기술자", avatar: "기술", text: left ? `아직 ${left}개 장치의 단위를 맞춰야 해.` : "모든 장치가 준비됐어. 셔틀 주 제어 장치에서 출발을 승인해 줘." }]);
    }
    return;
  }
  if (!state.questStarted) { showToast("먼저 셔틀 운영 기술자에게 상황을 물어보자."); return; }
  if (getConversionTask(id)) {
    if (state.solved.has(id)) showToast(`${getConversionTask(id).device}는 이미 활성화됐어.`);
    else openConversion(id);
    return;
  }
  if (id === "shuttle") {
    if (state.solved.size < CONVERSION_TASKS.length) {
      showToast(`출발 점검 장치가 ${CONVERSION_TASKS.length - state.solved.size}개 남았어.`);
      return;
    }
    openLaunchPanel();
  }
}

function openConversion(taskId) {
  const task = getConversionTask(taskId);
  state.currentTask = taskId;
  ui.conversionBadge.textContent = `${task.badge} · UNIT CHECK`;
  ui.conversionTitle.textContent = task.device;
  ui.conversionPurpose.textContent = task.purpose;
  ui.conversionSource.textContent = task.source;
  ui.conversionQuestion.textContent = task.question;
  ui.conversionUnit.textContent = task.targetUnit;
  ui.conversionAnswer.value = "";
  ui.conversionFeedback.textContent = `변환표 관계: ${task.relation}`;
  ui.conversionFeedback.className = "form-feedback";
  ui.deviceIcon.textContent = icons[taskId];
  ui.deviceIcon.style.color = colors[taskId];
  ui.gaugeFill.style.width = "12%";
  openPanel(ui.conversion);
  setTimeout(() => ui.conversionAnswer.focus(), 0);
}

function submitConversion(event) {
  event.preventDefault();
  const result = evaluateConversionAnswer(state.currentTask, ui.conversionAnswer.value);
  ui.conversionFeedback.textContent = result.message;
  ui.conversionFeedback.className = `form-feedback ${result.ok ? "is-success" : "is-error"}`;
  if (!result.ok) return;
  const solvedId = state.currentTask;
  state.solved.add(solvedId);
  ui.gaugeFill.style.width = "100%";
  updateCount();
  updateObjective();
  setTimeout(() => {
    closePanel(ui.conversion);
    showToast(`${getConversionTask(solvedId).device} 활성화 · ${state.solved.size}/5`);
    if (state.solved.size === CONVERSION_TASKS.length) {
      state.focusX = world.shuttleX;
      state.focusTimer = 2.5;
      showDialogue([
        { speaker: "시스템", avatar: "READY", text: "단위 점검 5개 완료. 학교 방향 셔틀의 출발 승인이 가능합니다." }
      ]);
    }
  }, 650);
}

function showConversionHint() {
  const id = state.currentTask;
  const hints = CONVERSION_HINTS[id];
  const index = Math.min(state.hintIndex[id], hints.length - 1);
  ui.conversionFeedback.textContent = `힌트 · ${hints[index]}`;
  ui.conversionFeedback.className = "form-feedback";
  state.hintIndex[id] = Math.min(index + 1, hints.length - 1);
}

function updateCount() { ui.count.textContent = String(state.solved.size); }

function updateObjective() {
  if (state.solved.size === CONVERSION_TASKS.length) ui.objective.textContent = "셔틀 주 제어 장치에서 출발을 승인하자.";
  else if (state.questStarted) ui.objective.textContent = `서로 다른 단위의 장치 점검 ${state.solved.size}/5`;
  else ui.objective.textContent = "셔틀 운영 기술자에게 상황을 물어보자.";
}

function openLaunchPanel() {
  ui.launchSummary.innerHTML = CONVERSION_TASKS.map((task) => `<span>${task.device} · ${task.answer.toLocaleString("ko-KR")} ${task.targetUnit}</span>`).join("");
  openPanel(ui.launchPanel);
}

function launchShuttle() {
  closePanel(ui.launchPanel);
  showDialogue([
    { speaker: "운영 기술자", avatar: "기술", text: "모든 단위가 정확해. WH, 탑승해! 챕터 2 구역으로 출발할게." },
    { speaker: "WH", avatar: "WH", text: "같은 양도 장치가 읽을 수 있는 단위로 맞춰야 움직일 수 있구나!" }
  ], () => {
    state.shuttleDeparting = true;
    state.focusX = world.shuttleX;
    state.focusTimer = 4;
    state.playerX = world.shuttleX - 70;
    ui.hud.classList.add("is-hidden");
    ui.touch.classList.add("is-hidden");
  });
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
  ui.speakerAvatar.style.background = line.avatar === "WH" ? "#1b8f88" : line.avatar === "READY" ? "#6f9ed2" : "#1d607b";
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

function openPanel(panel) { clearMovement(); panel.classList.remove("is-hidden"); panel.querySelector("button, input")?.focus(); }
function closePanel(panel) { panel.classList.add("is-hidden"); clearMovement(); canvas.focus(); }

function showToast(message) {
  if (toastTimer) clearTimeout(toastTimer);
  ui.toast.textContent = message;
  ui.toast.classList.remove("is-hidden");
  toastTimer = setTimeout(() => ui.toast.classList.add("is-hidden"), 2500);
}

function completeMap() {
  state.complete = true;
  state.shuttleDeparting = false;
  ui.prompt.classList.add("is-hidden");
  ui.complete.classList.remove("is-hidden");
  ui.chapter2.focus();
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  viewWidth = Math.max(320, rect.width);
  viewHeight = Math.max(360, rect.height);
  groundY = Math.max(330, viewHeight * .76);
  canvas.width = Math.round(viewWidth * ratio);
  canvas.height = Math.round(viewHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function updateCamera(dt) {
  let target = state.playerX - viewWidth * .4;
  if (state.focusX !== null) target = (state.playerX + state.focusX) / 2 - viewWidth / 2;
  target = Math.max(0, Math.min(world.width - viewWidth, target));
  state.cameraX += (target - state.cameraX) * (1 - Math.exp(-4.5 * dt));
}

function sx(x, parallax = 1) { return x - state.cameraX * parallax; }

function draw() {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, viewWidth, viewHeight);
  drawSky();
  drawBackground();
  drawGround();
  drawMap3Scenery();
  drawDepot();
  drawTechnician();
  for (const task of CONVERSION_TASKS) drawDevice(task);
  drawShuttle();
  drawMarkers();
  if (!state.shuttleDeparting) drawWH();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
  gradient.addColorStop(0, "#8acbd3"); gradient.addColorStop(.68, "#dce5d4"); gradient.addColorStop(1, "#ead3a2");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, viewWidth, viewHeight);
  ctx.fillStyle = "rgba(255,224,145,.9)"; ctx.beginPath(); ctx.arc(viewWidth - 135, 95, 46, 0, Math.PI * 2); ctx.fill();
}

function drawBackground() {
  ctx.fillStyle = "#6d9884"; ctx.beginPath(); ctx.moveTo(0, groundY - 80);
  for (let x = -100; x < viewWidth + 200; x += 190) {
    const px = x - (state.cameraX * .15) % 190;
    ctx.quadraticCurveTo(px + 95, groundY - 210, px + 190, groundY - 80);
  }
  ctx.lineTo(viewWidth, groundY); ctx.lineTo(0, groundY); ctx.fill();
  ctx.fillStyle = "rgba(62,92,98,.34)";
  for (let x = -80; x < viewWidth + 150; x += 125) {
    const px = x - (state.cameraX * .28) % 125; ctx.fillRect(px, groundY - 185, 82, 105);
  }
}

function drawGround() {
  ctx.fillStyle = "#c9d3cd"; ctx.fillRect(0, groundY - 30, viewWidth, 52);
  ctx.fillStyle = "#66787d"; ctx.fillRect(0, groundY + 22, viewWidth, viewHeight - groundY);
  ctx.fillStyle = "rgba(255,255,255,.6)";
  for (let x = -((state.cameraX * 1.1) % 170); x < viewWidth + 170; x += 170) ctx.fillRect(x, groundY + 75, 90, 5);
}

function drawMap3Scenery() {
  const scenery = [
    ["props.tree", 560, 245, 0.95],
    ["props.grass", 850, 76, 0.82],
    ["props.streetLamp", 1320, 235, 0.9],
    ["props.flowerbed", 1540, 88, 0.9],
    ["props.bench", 2285, 112, 0.9],
    ["props.signpost", 2620, 175, 0.9]
  ];

  for (const [key, worldX, height, alpha] of scenery) {
    const x = sx(worldX);
    if (x < -180 || x > viewWidth + 180) continue;
    assetManager.draw(ctx, key, { x, y: groundY + 4, height, alpha });
  }
}

function drawDepot() {
  const x = sx(290);
  if (x < -320 || x > viewWidth + 320) return;
  if (assetManager.draw(ctx, "buildings.shuttleBusTransferCenter", {
    x,
    y: groundY - 4,
    height: 355,
    alpha: 0.98
  })) return;

  const left = x - 260;
  ctx.fillStyle = "#d9e2dc"; roundRect(ctx, left, groundY - 340, 520, 310, 12); ctx.fill();
  ctx.fillStyle = "#153b52"; ctx.fillRect(left - 10, groundY - 340, 540, 48);
  ctx.fillStyle = "#8fc5cc"; ctx.fillRect(left + 55, groundY - 250, 220, 112);
  ctx.fillStyle = "#35505b"; roundRect(ctx, left + 350, groundY - 215, 105, 185, 6); ctx.fill();
}

function drawDevice(task) {
  const x = sx(positions[task.id]);
  if (x < -100 || x > viewWidth + 100) return;
  const active = state.solved.has(task.id);
  const kioskByTask = {
    coolant: "props.coolantRefillKiosk",
    equipment: "props.emergencyScaleCheckKiosk",
    schedule: "props.inspectionScheduleKiosk",
    timer: "props.doorSafetyTimerKiosk",
    route: "props.routeCalibrationKiosk"
  };
  const kioskKey = kioskByTask[task.id];
  if (kioskKey && assetManager.draw(ctx, kioskKey, { x, y: groundY + 2, height: 148, alpha: active ? 1 : 0.88 })) {
    ctx.fillStyle = active ? "#9ccd69" : "#d87962";
    ctx.beginPath();
    ctx.arc(x + 36, groundY - 126, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "950 16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(active ? "✓" : "!", x + 36, groundY - 121);
    return;
  }
  ctx.fillStyle = "rgba(20,40,48,.18)"; ctx.beginPath(); ctx.ellipse(x, groundY + 2, 48, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#354b56"; roundRect(ctx, x - 48, groundY - 145, 96, 135, 14); ctx.fill();
  ctx.fillStyle = active ? colors[task.id] : "#72858b"; roundRect(ctx, x - 36, groundY - 132, 72, 65, 9); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "950 28px system-ui"; ctx.textAlign = "center"; ctx.fillText(active ? "✓" : icons[task.id], x, groundY - 89);
  ctx.fillStyle = active ? "#9ccd69" : "#d87962"; ctx.beginPath(); ctx.arc(x, groundY - 48, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f2f5f2"; ctx.font = "850 10px system-ui"; ctx.fillText(task.device, x, groundY - 24);
}

function drawTechnician() {
  const x = sx(world.technicianX);
  if (x < -60 || x > viewWidth + 60) return;
  ctx.fillStyle = "rgba(20,30,40,.18)";
  ctx.beginPath();
  ctx.ellipse(x, groundY + 3, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (assetManager.draw(ctx, "characters.operationsTechnician", { x, y: groundY + 2, height: 178 })) return;
  ctx.save(); ctx.translate(x, groundY);
  ctx.fillStyle = "rgba(20,30,40,.18)"; ctx.beginPath(); ctx.ellipse(0, 3, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#263943"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-9,-45);ctx.lineTo(-13,-3);ctx.moveTo(9,-45);ctx.lineTo(14,-3);ctx.stroke();
  ctx.fillStyle = "#1d607b"; roundRect(ctx,-29,-110,58,70,16);ctx.fill();
  ctx.fillStyle = "#edc1a8";ctx.beginPath();ctx.arc(0,-139,28,0,Math.PI*2);ctx.fill();
  ctx.fillStyle = "#263943";ctx.beginPath();ctx.arc(0,-147,29,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillStyle="#fff";ctx.font="950 10px system-ui";ctx.textAlign="center";ctx.fillText("TECH",0,-72);ctx.restore();
}

function drawShuttle() {
  const x = sx(world.shuttleX + state.shuttleOffset);
  const y = groundY - 225;
  if (x < -650 || x > viewWidth + 100) return;
  ctx.fillStyle = "rgba(20,35,42,.22)";ctx.beginPath();ctx.ellipse(x+260,groundY+5,270,26,0,0,Math.PI*2);ctx.fill();
  if (assetManager.draw(ctx, "vehicles.schoolTownShuttleBus", { x: x + 270, y: groundY + 14, width: 520 })) return;
  ctx.fillStyle = "#f1efe3";roundRect(ctx,x,y,540,190,55);ctx.fill();
  ctx.fillStyle = "#1d607b";ctx.fillRect(x+18,y+125,505,42);
  ctx.fillStyle = "#9ed7dc";
  for(let i=0;i<4;i+=1){roundRect(ctx,x+95+i*92,y+28,72,70,12);ctx.fill();}
  ctx.fillStyle="#153b52";roundRect(ctx,x+26,y+30,55,68,18);ctx.fill();
  ctx.fillStyle="#fff";ctx.font="950 13px system-ui";ctx.textAlign="center";ctx.fillText("SCHOOL LINE",x+275,y+151);
  for(const wx of [x+120,x+430]){ctx.fillStyle="#263943";ctx.beginPath();ctx.arc(wx,y+183,39,0,Math.PI*2);ctx.fill();ctx.fillStyle="#9aa8aa";ctx.beginPath();ctx.arc(wx,y+183,16,0,Math.PI*2);ctx.fill();}
}

function drawMarkers() {
  if (!state.questStarted) drawMarker(world.technicianX, state.nearby === "technician");
  else {
    for (const task of CONVERSION_TASKS) if (!state.solved.has(task.id)) drawMarker(positions[task.id], state.nearby === task.id);
    if (state.solved.size === CONVERSION_TASKS.length) drawMarker(world.shuttleX, state.nearby === "shuttle");
  }
}

function drawMarker(x, active) {
  const px = sx(x); if (px < -40 || px > viewWidth + 40) return;
  const bob = Math.sin(performance.now()/260)*4;ctx.fillStyle=active?"#ee8b45":"#68c7cf";ctx.beginPath();ctx.arc(px,groundY-190+bob,active?16:13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#fff";ctx.font="950 18px system-ui";ctx.textAlign="center";ctx.fillText(active?"E":"!",px,groundY-183+bob);
}

function drawWH() {
  const x=sx(state.playerX);const moving=!paused()&&(keys.left||keys.right);const swing=moving?Math.sin(state.walkTime)*11:0;const bob=moving?Math.sin(state.walkTime*2)*2:0;
  if (assetManager.has("characters.wh")) {
    ctx.fillStyle="rgba(20,30,40,.2)";ctx.beginPath();ctx.ellipse(x,groundY+4,33,9,0,0,Math.PI*2);ctx.fill();
    assetManager.drawCharacter(ctx, "wh", { x, y: groundY + 2 + bob, height: 170, direction: state.direction === -1 ? "left" : "right" });
    return;
  }
  ctx.save();ctx.translate(x,groundY-2+bob);ctx.scale(state.direction,1);ctx.fillStyle="rgba(20,30,40,.2)";ctx.beginPath();ctx.ellipse(0,5,33,9,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#1b2941";ctx.lineWidth=9;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-8,-48);ctx.lineTo(-12-swing*.55,-5);ctx.moveTo(9,-48);ctx.lineTo(14+swing*.55,-5);ctx.stroke();
  ctx.strokeStyle="#f4b63e";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-18-swing*.55,-4);ctx.lineTo(-6-swing*.55,-4);ctx.moveTo(8+swing*.55,-4);ctx.lineTo(22+swing*.55,-4);ctx.stroke();
  ctx.fillStyle="#1b8f88";roundRect(ctx,-27,-119,58,78,20);ctx.fill();ctx.fillStyle="#fff";ctx.font="950 12px system-ui";ctx.textAlign="center";ctx.save();ctx.scale(state.direction,1);ctx.fillText("WH",2*state.direction,-76);ctx.restore();
  ctx.fillStyle="#efc3a9";ctx.beginPath();ctx.arc(2,-151,35,0,Math.PI*2);ctx.fill();ctx.fillStyle="#17223b";ctx.beginPath();ctx.arc(2,-162,36,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillStyle="#fff";ctx.strokeStyle="#17223b";ctx.lineWidth=2;for(const ex of [2,21]){ctx.beginPath();ctx.ellipse(ex,-151,8,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#126b68";ctx.beginPath();ctx.arc(ex+2,-150,5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(ex+3,-153,2,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";}
  ctx.strokeStyle="#9b4e49";ctx.lineWidth=2;ctx.beginPath();ctx.arc(12,-136,6,.1,Math.PI-.1);ctx.stroke();ctx.restore();
}

function roundRect(context,x,y,width,height,radius){const r=Math.min(radius,width/2,height/2);context.beginPath();context.moveTo(x+r,y);context.arcTo(x+width,y,x+width,y+height,r);context.arcTo(x+width,y+height,x,y+height,r);context.arcTo(x,y+height,x,y,r);context.arcTo(x,y,x+width,y,r);context.closePath();}
