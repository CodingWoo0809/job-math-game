import {
  DIALOGUES,
  HINTS,
  MAP_DATA,
  NOTE_DEFINITIONS,
  REQUIRED_NOTES
} from "./map-data.mjs";
import {
  CORRECT_COSTS,
  evaluateCostAnswers,
  evaluateInvoiceAnswer
} from "./math-logic.mjs";
import { assetManager } from "./asset-manager.mjs";

const SAVE_KEY = "wh-math-adventure-1map1";
const SETTINGS_KEY = "wh-math-adventure-settings";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

const ui = {
  hud: document.querySelector("#hud"),
  objective: document.querySelector("#objective-text"),
  interactionPrompt: document.querySelector("#interaction-prompt"),
  interactionText: document.querySelector("#interaction-text"),
  toast: document.querySelector("#toast"),
  startScreen: document.querySelector("#start-screen"),
  newGame: document.querySelector("#new-game-button"),
  continueGame: document.querySelector("#continue-button"),
  notebookButton: document.querySelector("#notebook-button"),
  notebookCount: document.querySelector("#notebook-count"),
  notebookPanel: document.querySelector("#notebook-panel"),
  notebookEntries: document.querySelector("#notebook-entries"),
  settingsButton: document.querySelector("#settings-button"),
  settingsPanel: document.querySelector("#settings-panel"),
  dialoguePanel: document.querySelector("#dialogue-panel"),
  speakerAvatar: document.querySelector("#speaker-avatar"),
  speakerName: document.querySelector("#speaker-name"),
  dialogueText: document.querySelector("#dialogue-text"),
  dialogueNext: document.querySelector("#dialogue-next"),
  challengePanel: document.querySelector("#challenge-panel"),
  challengeSteps: [
    document.querySelector("#challenge-step-1"),
    document.querySelector("#challenge-step-2"),
    document.querySelector("#challenge-step-3")
  ],
  progressSteps: [...document.querySelectorAll("[data-step-indicator]")],
  costCards: document.querySelector("#cost-cards"),
  challengeNotebookButton: document.querySelector("#challenge-notebook-button"),
  costForm: document.querySelector("#cost-form"),
  totalCost: document.querySelector("#total-cost"),
  remainingBudget: document.querySelector("#remaining-budget"),
  costFeedback: document.querySelector("#cost-feedback"),
  invoiceForm: document.querySelector("#invoice-form"),
  correctedFee: document.querySelector("#corrected-fee"),
  invoiceFeedback: document.querySelector("#invoice-feedback"),
  hintButton: document.querySelector("#hint-button"),
  hintText: document.querySelector("#hint-text"),
  approveDelivery: document.querySelector("#approve-delivery"),
  completeScreen: document.querySelector("#complete-screen"),
  replayButton: document.querySelector("#replay-button"),
  nextMapButton: document.querySelector("#next-map-button"),
  touchControls: document.querySelector("#touch-controls"),
  touchLeft: document.querySelector("#touch-left"),
  touchRight: document.querySelector("#touch-right"),
  touchInteract: document.querySelector("#touch-interact"),
  largeTextToggle: document.querySelector("#large-text-toggle"),
  motionToggle: document.querySelector("#motion-toggle"),
  soundToggle: document.querySelector("#sound-toggle")
};

const defaultState = () => ({
  started: false,
  playerX: 245,
  playerDirection: 1,
  cameraX: 0,
  introSeen: false,
  questStarted: false,
  notes: new Set(),
  nearbyId: null,
  challengeStep: 1,
  challengeCompleted: false,
  pathOpen: false,
  truckDeparting: false,
  truckOffset: 0,
  complete: false,
  focusX: null,
  focusTimer: 0,
  hintIndices: { cost: 0, invoice: 0 },
  dialogueQueue: [],
  dialogueCallback: null,
  lastTime: performance.now(),
  walkTime: 0
});

let state = defaultState();
const keys = { left: false, right: false };
let viewWidth = 1280;
let viewHeight = 720;
let groundY = 540;
let toastTimer = null;
let audioContext = null;
let returnToChallenge = false;

const world = {
  width: 2600,
  truckBaseX: 1390,
  barrierX: 2208,
  interactions: [
    { id: "clerk", x: 785, radius: 80, label: "빵집 담당자와 대화" },
    { id: "order", x: 930, radius: 72, label: "주문서 확인" },
    { id: "flour", x: 1085, radius: 68, label: "밀가루 라벨 확인" },
    { id: "milk", x: 1185, radius: 68, label: "우유 라벨 확인" },
    { id: "butter", x: 1285, radius: 68, label: "버터 라벨 확인" },
    { id: "terminal", x: 1435, radius: 75, label: "계산 단말기 사용" },
    { id: "delivery", x: 1810, radius: 90, label: "배송 계약서 확인" }
  ]
};

const settings = loadSettings();
applySettings();
renderCostCards();
updateNotebook();
resizeCanvas();
updateContinueButton();
assetManager.loadAll().catch((error) => {
  console.warn(error);
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.addEventListener("blur", clearMovement);

ui.newGame.addEventListener("click", () => startGame(true));
ui.continueGame.addEventListener("click", () => startGame(false));
ui.notebookButton.addEventListener("click", () => openPanel(ui.notebookPanel));
ui.settingsButton.addEventListener("click", () => openPanel(ui.settingsPanel));
ui.dialogueNext.addEventListener("click", advanceDialogue);
ui.costForm.addEventListener("submit", submitCostAnswers);
ui.invoiceForm.addEventListener("submit", submitInvoiceAnswer);
ui.hintButton.addEventListener("click", showNextHint);
ui.challengeNotebookButton.addEventListener("click", openChallengeNotebook);
ui.approveDelivery.addEventListener("click", approveDelivery);
ui.replayButton.addEventListener("click", () => startGame(true));
ui.nextMapButton.addEventListener("click", () => {
  window.location.href = "./1map2.html";
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => closePanel(document.querySelector(`#${button.dataset.close}`)));
});

ui.largeTextToggle.addEventListener("change", () => updateSetting("largeText", ui.largeTextToggle.checked));
ui.motionToggle.addEventListener("change", () => updateSetting("reduceMotion", ui.motionToggle.checked));
ui.soundToggle.addEventListener("change", () => updateSetting("sound", ui.soundToggle.checked));

bindHoldButton(ui.touchLeft, "left");
bindHoldButton(ui.touchRight, "right");
ui.touchInteract.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  interact();
});

requestAnimationFrame(gameLoop);

function startGame(isNew) {
  if (isNew) {
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    resetChallengeUI();
  } else {
    state = loadGame();
  }

  state.started = true;
  state.lastTime = performance.now();
  ui.startScreen.classList.add("is-hidden");
  ui.completeScreen.classList.toggle("is-hidden", !state.complete);
  ui.hud.classList.toggle("is-hidden", state.complete);
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
    ui.touchControls.classList.remove("is-hidden");
  }
  updateNotebook();
  updateObjective();
  playTone(420, 0.08);
  if (state.complete) {
    ui.touchControls.classList.add("is-hidden");
    ui.replayButton.focus();
  } else {
    canvas.focus();
  }
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) return defaultState();
    const loaded = defaultState();
    loaded.playerX = Number.isFinite(saved.playerX) ? saved.playerX : loaded.playerX;
    loaded.playerDirection = saved.playerDirection === -1 ? -1 : 1;
    loaded.introSeen = Boolean(saved.introSeen);
    loaded.questStarted = Boolean(saved.questStarted);
    loaded.notes = new Set(Array.isArray(saved.notes) ? saved.notes.filter((id) => REQUIRED_NOTES.includes(id)) : []);
    loaded.challengeStep = Math.min(3, Math.max(1, Number(saved.challengeStep) || 1));
    loaded.challengeCompleted = Boolean(saved.challengeCompleted);
    loaded.pathOpen = Boolean(saved.pathOpen || saved.challengeCompleted);
    loaded.truckOffset = loaded.pathOpen ? 760 : 0;
    loaded.complete = Boolean(saved.complete);
    return loaded;
  } catch {
    return defaultState();
  }
}

function saveGame() {
  if (!state.started) return;
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      playerX: Math.round(state.playerX),
      playerDirection: state.playerDirection,
      introSeen: state.introSeen,
      questStarted: state.questStarted,
      notes: [...state.notes],
      challengeStep: state.challengeStep,
      challengeCompleted: state.challengeCompleted,
      pathOpen: state.pathOpen,
      complete: state.complete
    })
  );
  updateContinueButton();
}

function updateContinueButton() {
  ui.continueGame.classList.toggle("is-hidden", !localStorage.getItem(SAVE_KEY));
}

function loadSettings() {
  const fallback = {
    largeText: false,
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    sound: true
  };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return fallback;
  }
}

function updateSetting(key, value) {
  settings[key] = value;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applySettings();
}

function applySettings() {
  document.documentElement.classList.toggle("large-text", settings.largeText);
  document.documentElement.classList.toggle("reduce-motion", settings.reduceMotion);
  ui.largeTextToggle.checked = settings.largeText;
  ui.motionToggle.checked = settings.reduceMotion;
  ui.soundToggle.checked = settings.sound;
}

function onKeyDown(event) {
  const targetIsInput = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
  if (event.key === "Escape") {
    closeTopLayer();
    return;
  }
  if (targetIsInput) return;

  const isLeft = event.key === "ArrowLeft" || event.key.toLowerCase() === "a" || event.code === "KeyA";
  const isRight = event.key === "ArrowRight" || event.key.toLowerCase() === "d" || event.code === "KeyD";
  const isInteractKey =
    event.key === "Enter" ||
    event.key === " " ||
    event.code === "Space" ||
    event.key.toLowerCase() === "e" ||
    event.code === "KeyE";

  if (isLeft || isRight || isInteractKey) event.preventDefault();

  if (isLeft) keys.left = true;
  if (isRight) keys.right = true;

  if ((event.key === "Enter" || event.key === " " || event.code === "Space") && !ui.dialoguePanel.classList.contains("is-hidden")) {
    advanceDialogue();
    return;
  }

  if (isInteractKey) interact();
}

function onKeyUp(event) {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a" || event.code === "KeyA") keys.left = false;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d" || event.code === "KeyD") keys.right = false;
}

function bindHoldButton(button, direction) {
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

function gameLoop(now) {
  const dt = Math.min(0.034, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  if (!state.started || state.complete) return;

  if (state.focusTimer > 0) {
    state.focusTimer -= dt;
    if (state.focusTimer <= 0 && !state.truckDeparting) state.focusX = null;
  }

  if (state.truckDeparting) {
    const speed = settings.reduceMotion ? 900 : 310;
    state.truckOffset = Math.min(760, state.truckOffset + speed * dt);
    if (state.truckOffset >= 760) {
      state.truckDeparting = false;
      state.pathOpen = true;
      state.focusX = null;
      showToast("철창이 열렸어. 열린 길로 이동하자!", "success");
      updateObjective();
      saveGame();
    }
  }

  const paused = isInteractionPaused();
  if (!paused) {
    let direction = 0;
    if (keys.left) direction -= 1;
    if (keys.right) direction += 1;
    if (direction !== 0) {
      const previousX = state.playerX;
      state.playerX += direction * 235 * dt;
      state.playerDirection = direction;
      state.walkTime += dt * 11;
      const rightLimit = state.pathOpen ? world.width - 70 : world.barrierX - 60;
      state.playerX = Math.max(90, Math.min(rightLimit, state.playerX));
      if (previousX < 560 && state.playerX >= 560 && !state.introSeen) {
        state.introSeen = true;
        state.focusX = 1510;
        state.focusTimer = 3.2;
        showDialogue(DIALOGUES.intro, () => {
          updateObjective();
          saveGame();
        });
      }
      if (Math.abs(previousX - state.playerX) > 0.1 && Math.random() < 0.018) saveGame();
    }
  }

  updateNearbyInteraction();
  updateCamera(dt);

  if (state.pathOpen && state.playerX > 2320 && !state.complete) completeMap();
}

function isInteractionPaused() {
  return (
    !ui.dialoguePanel.classList.contains("is-hidden") ||
    !ui.notebookPanel.classList.contains("is-hidden") ||
    !ui.challengePanel.classList.contains("is-hidden") ||
    !ui.settingsPanel.classList.contains("is-hidden")
  );
}

function updateNearbyInteraction() {
  if (isInteractionPaused() || state.truckDeparting) {
    state.nearbyId = null;
    ui.interactionPrompt.classList.add("is-hidden");
    return;
  }

  let nearest = null;
  let nearestDistance = Infinity;
  for (const item of world.interactions) {
    if (state.pathOpen && ["terminal", "delivery"].includes(item.id)) continue;
    const distance = Math.abs(state.playerX - item.x);
    if (distance <= item.radius && distance < nearestDistance) {
      nearest = item;
      nearestDistance = distance;
    }
  }

  state.nearbyId = nearest?.id ?? null;
  if (nearest) {
    ui.interactionText.textContent = nearest.label;
    ui.interactionPrompt.classList.remove("is-hidden");
  } else {
    ui.interactionPrompt.classList.add("is-hidden");
  }
}

function interact() {
  if (!state.started || state.complete || isInteractionPaused() || state.truckDeparting) return;
  const id = state.nearbyId;
  if (!id) {
    if (!state.pathOpen && Math.abs(state.playerX - world.barrierX) < 110) {
      showToast("철창이 닫혀 있어. 먼저 필요한 정보를 모아 계산을 확인하자.");
    }
    return;
  }

  playTone(540, 0.05);
  if (id === "clerk") {
    if (!state.questStarted) {
      showDialogue(DIALOGUES.clerk, () => {
        state.questStarted = true;
        updateObjective();
        saveGame();
      });
    } else {
      const missing = REQUIRED_NOTES.length - state.notes.size;
      showDialogue([
        {
          speaker: "빵집 담당자",
          avatar: "빵집",
          text: missing > 0
            ? `필요한 정보가 ${missing}개 남아 있어. 주문서, 재료 라벨, 배송 계약서를 더 확인해 줘.`
            : "정보를 모두 확인했어. 이제 계산 단말기에서 실제 비용을 계산해 보자."
        }
      ]);
    }
    return;
  }

  if (!state.questStarted) {
    showToast("먼저 빵집 담당자에게 상황을 물어보자.");
    return;
  }

  if (REQUIRED_NOTES.includes(id)) {
    collectNote(id);
    return;
  }

  if (id === "terminal") {
    if (state.notes.size < REQUIRED_NOTES.length) {
      showToast(`계산에 필요한 정보가 ${REQUIRED_NOTES.length - state.notes.size}개 부족해. 주변 정보를 더 확인하자.`);
      return;
    }
    openChallenge();
  }
}

function collectNote(id) {
  const note = NOTE_DEFINITIONS[id];
  if (!note) return;
  if (state.notes.has(id)) {
    showToast(`${note.title}: ${note.detail}`);
    return;
  }
  state.notes.add(id);
  updateNotebook();
  updateObjective();
  showToast(`수첩 기록 · ${note.title}`);
  playTone(720, 0.08);
  saveGame();
}

function updateNotebook() {
  const notes = [...state.notes];
  ui.notebookCount.textContent = String(notes.length);
  if (notes.length === 0) {
    ui.notebookEntries.innerHTML = '<div class="note-empty">아직 기록한 정보가 없어.<br />주변을 조사해 보자.</div>';
    return;
  }
  ui.notebookEntries.innerHTML = notes
    .map((id) => {
      const note = NOTE_DEFINITIONS[id];
      return `<article class="note-entry"><span>${note.category}</span><strong>${note.title}</strong><p>${note.detail}</p></article>`;
    })
    .join("");
}

function updateObjective() {
  if (state.complete) return;
  if (state.pathOpen) {
    ui.objective.textContent = "열린 길을 따라 다음 장소로 이동하자.";
  } else if (state.challengeCompleted) {
    ui.objective.textContent = "배송차와 철창이 열릴 때까지 잠시 기다리자.";
  } else if (state.challengeStep > 1) {
    ui.objective.textContent = "계산서의 오류를 찾아 수정하자.";
  } else if (state.notes.size === REQUIRED_NOTES.length) {
    ui.objective.textContent = "계산 단말기에서 실제 납품 비용을 확인하자.";
  } else if (state.questStarted) {
    ui.objective.textContent = `계산에 필요한 정보 수집 ${state.notes.size}/${REQUIRED_NOTES.length}`;
  } else {
    ui.objective.textContent = "빵집 담당자에게 상황을 물어보자.";
  }
}

function showDialogue(lines, callback = null) {
  clearMovement();
  state.dialogueQueue = [...lines];
  state.dialogueCallback = callback;
  ui.dialoguePanel.classList.remove("is-hidden");
  showCurrentDialogue();
}

function showCurrentDialogue() {
  const line = state.dialogueQueue[0];
  if (!line) return;
  ui.speakerName.textContent = line.speaker;
  ui.speakerAvatar.textContent = line.avatar;
  ui.speakerAvatar.style.background = line.avatar === "WH" ? "#1b8f88" : line.avatar === "빵집" ? "#d88350" : "#426f9d";
  ui.dialogueText.textContent = line.text;
  ui.dialogueNext.focus();
}

function advanceDialogue() {
  if (ui.dialoguePanel.classList.contains("is-hidden")) return;
  state.dialogueQueue.shift();
  if (state.dialogueQueue.length > 0) {
    playTone(390, 0.035);
    showCurrentDialogue();
    return;
  }
  ui.dialoguePanel.classList.add("is-hidden");
  const callback = state.dialogueCallback;
  state.dialogueCallback = null;
  if (callback) callback();
  canvas.focus();
}

function renderCostCards() {
  ui.costCards.innerHTML = [
    ...MAP_DATA.items.map(
      (item) => `<div class="cost-card"><span>${item.name}</span><strong>${item.quantity}${item.unit} × 단가</strong><em>단가는 수첩에서 확인</em></div>`
    ),
    '<div class="cost-card"><span>계약 배송비 · 1회</span><strong>금액 미표시</strong><em>계약서 기록을 수첩에서 확인</em></div>',
    '<div class="cost-card"><span>최대 예산</span><strong>금액 미표시</strong><em>주문서 기록을 수첩에서 확인</em></div>'
  ].join("");
}

function openChallengeNotebook() {
  returnToChallenge = true;
  ui.challengePanel.classList.add("is-hidden");
  openPanel(ui.notebookPanel);
}

function openChallenge() {
  clearMovement();
  setChallengeStep(state.challengeStep);
  openPanel(ui.challengePanel);
  setTimeout(() => {
    if (state.challengeStep === 1) ui.totalCost.focus();
    if (state.challengeStep === 2) ui.invoiceForm.querySelector("input[type='radio']")?.focus();
    if (state.challengeStep === 3) ui.approveDelivery.focus();
  }, 0);
}

function setChallengeStep(step) {
  state.challengeStep = step;
  ui.challengeSteps.forEach((panel, index) => panel.classList.toggle("is-hidden", index + 1 !== step));
  ui.progressSteps.forEach((indicator, index) => {
    const indicatorStep = index + 1;
    indicator.classList.toggle("is-active", indicatorStep === step);
    indicator.classList.toggle("is-complete", indicatorStep < step);
  });
  ui.hintButton.disabled = step === 3;
  ui.hintText.textContent = step === 3 ? "계산과 오류 수정이 모두 끝났어." : "막히면 힌트를 단계별로 확인할 수 있어.";
  updateObjective();
  saveGame();
}

function submitCostAnswers(event) {
  event.preventDefault();
  const result = evaluateCostAnswers(ui.totalCost.value, ui.remainingBudget.value);
  setFeedback(ui.costFeedback, result);
  if (!result.ok) {
    playTone(210, 0.12, "triangle");
    return;
  }
  playSuccessChord();
  setTimeout(() => setChallengeStep(2), settings.reduceMotion ? 0 : 450);
}

function submitInvoiceAnswer(event) {
  event.preventDefault();
  const selected = new FormData(ui.invoiceForm).get("invoiceRow");
  const result = evaluateInvoiceAnswer(selected, ui.correctedFee.value);
  setFeedback(ui.invoiceFeedback, result);
  if (!result.ok) {
    playTone(210, 0.12, "triangle");
    return;
  }
  playSuccessChord();
  setTimeout(() => setChallengeStep(3), settings.reduceMotion ? 0 : 450);
}

function setFeedback(element, result) {
  element.textContent = result.message;
  element.classList.toggle("is-error", !result.ok);
  element.classList.toggle("is-success", result.ok);
}

function showNextHint() {
  const key = state.challengeStep === 1 ? "cost" : "invoice";
  const index = Math.min(state.hintIndices[key], HINTS[key].length - 1);
  ui.hintText.textContent = HINTS[key][index];
  state.hintIndices[key] = Math.min(index + 1, HINTS[key].length - 1);
  playTone(610, 0.07);
}

function approveDelivery() {
  state.challengeCompleted = true;
  closePanel(ui.challengePanel);
  updateObjective();
  saveGame();
  showDialogue(DIALOGUES.success, startTruckDeparture);
}

function startTruckDeparture() {
  state.truckDeparting = true;
  state.focusX = world.truckBaseX + 330;
  state.focusTimer = 5;
  updateObjective();
  playSuccessChord();
}

function completeMap() {
  clearMovement();
  state.complete = true;
  ui.hud.classList.add("is-hidden");
  ui.interactionPrompt.classList.add("is-hidden");
  ui.touchControls.classList.add("is-hidden");
  ui.completeScreen.classList.remove("is-hidden");
  playSuccessChord();
  saveGame();
  ui.replayButton.focus();
}

function resetChallengeUI() {
  ui.costForm.reset();
  ui.invoiceForm.reset();
  ui.costFeedback.textContent = "";
  ui.invoiceFeedback.textContent = "";
  ui.costFeedback.className = "form-feedback";
  ui.invoiceFeedback.className = "form-feedback";
  ui.hintText.textContent = "막히면 힌트를 단계별로 확인할 수 있어.";
  setChallengeStep(1);
}

function openPanel(panel) {
  clearMovement();
  panel.classList.remove("is-hidden");
  panel.querySelector("button, input")?.focus();
}

function closePanel(panel) {
  if (!panel || panel.classList.contains("is-hidden")) return;
  panel.classList.add("is-hidden");
  clearMovement();
  if (panel === ui.notebookPanel && returnToChallenge) {
    returnToChallenge = false;
    ui.challengePanel.classList.remove("is-hidden");
    if (state.challengeStep === 1) ui.totalCost.focus();
    if (state.challengeStep === 2) ui.invoiceForm.querySelector("input[type='radio']")?.focus();
    if (state.challengeStep === 3) ui.approveDelivery.focus();
    return;
  }
  canvas.focus();
}

function closeTopLayer() {
  if (!ui.challengePanel.classList.contains("is-hidden")) return closePanel(ui.challengePanel);
  if (!ui.notebookPanel.classList.contains("is-hidden")) return closePanel(ui.notebookPanel);
  if (!ui.settingsPanel.classList.contains("is-hidden")) return closePanel(ui.settingsPanel);
  if (!ui.dialoguePanel.classList.contains("is-hidden")) return advanceDialogue();
}

function showToast(message) {
  if (toastTimer) clearTimeout(toastTimer);
  ui.toast.textContent = message;
  ui.toast.classList.remove("is-hidden");
  toastTimer = setTimeout(() => ui.toast.classList.add("is-hidden"), 2600);
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
  if (state.focusX !== null) {
    target = (state.playerX + state.focusX) / 2 - viewWidth / 2;
  }
  target = Math.max(0, Math.min(world.width - viewWidth, target));
  const smoothing = settings.reduceMotion ? 1 : 1 - Math.exp(-4.5 * dt);
  state.cameraX += (target - state.cameraX) * smoothing;
}

function render() {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, viewWidth, viewHeight);
  drawSky();
  drawBackground();
  drawGround();
  drawHouse();
  drawStartArch();
  drawBakery();
  drawStreetDetails();
  drawTruck();
  drawBarrier();
  drawNPCs();
  drawInteractables();
  drawWH();
  drawForeground();
}

function worldX(x, parallax = 1) {
  return x - state.cameraX * parallax;
}

const ART = Object.freeze({
  ink: "#26304f",
  inkSoft: "#4b5777",
  skyTop: "#87e7ff",
  skyMid: "#c9f6ff",
  skyBottom: "#fff2bf",
  grass: "#68d675",
  grassDark: "#36a95f",
  road: "#7d8a95",
  roadDark: "#5c6875",
  cream: "#fff4d8",
  paper: "#fffdf4",
  coral: "#ff7a6c",
  teal: "#28b7a6",
  tealDark: "#168477",
  gold: "#ffd45f",
  wood: "#9c6b45",
  skin: "#f4c7a8",
  hair: "#17223b"
});

function drawOutlinedRoundRect(x, y, width, height, radius, fill, stroke = ART.ink, lineWidth = 5) {
  ctx.save();
  ctx.lineJoin = "round";
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

function drawOutlinedCircle(x, y, radius, fill, stroke = ART.ink, lineWidth = 5) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

function drawOutlinedPath(points, fill, stroke = ART.ink, lineWidth = 5) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

function drawTinySparkle(x, y, size, color = "#fffdf4") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(38,48,79,.25)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * .28, y - size * .28);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size * .28, y + size * .28);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * .28, y + size * .28);
  ctx.lineTo(x - size, y);
  ctx.lineTo(x - size * .28, y - size * .28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawWindowBox(x, y, width, height, curtain = "#ffb0a1") {
  drawOutlinedRoundRect(x, y, width, height, 10, "#c9f6ff", ART.ink, 4);
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.75)";
  roundRect(ctx, x + 8, y + 8, width - 16, height - 16, 6);
  ctx.fill();
  ctx.strokeStyle = ART.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + 4);
  ctx.lineTo(x + width / 2, y + height - 4);
  ctx.moveTo(x + 4, y + height / 2);
  ctx.lineTo(x + width - 4, y + height / 2);
  ctx.stroke();
  ctx.fillStyle = curtain;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 8);
  ctx.quadraticCurveTo(x + width * .28, y + 18, x + 14, y + height - 8);
  ctx.lineTo(x + 8, y + height - 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + width - 8, y + 8);
  ctx.quadraticCurveTo(x + width * .72, y + 18, x + width - 14, y + height - 8);
  ctx.lineTo(x + width - 8, y + height - 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
  gradient.addColorStop(0, ART.skyTop);
  gradient.addColorStop(0.58, ART.skyMid);
  gradient.addColorStop(1, ART.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  ctx.save();
  const sunX = viewWidth - 136;
  const sunY = 104;
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = ART.gold;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.42;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  drawOutlinedCircle(sunX, sunY, 45, ART.gold, "rgba(38,48,79,.35)", 3);
  ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.beginPath();
  ctx.arc(sunX - 14, sunY - 14, 9, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 9; i += 1) {
    const sx = 90 + i * 145 - (state.cameraX * 0.03) % 145;
    const sy = 70 + (i % 3) * 45;
    drawTinySparkle(sx, sy, 5 + (i % 2) * 2, "rgba(255,255,255,.72)");
  }
  ctx.restore();
}

function drawBackground() {
  const hillOffset = state.cameraX * 0.16;
  ctx.fillStyle = "#74d386";
  ctx.beginPath();
  ctx.moveTo(-200 - hillOffset, groundY - 80);
  for (let x = -200; x <= viewWidth + 300; x += 180) {
    ctx.quadraticCurveTo(x + 90 - hillOffset, groundY - 210 - ((x / 180) % 2) * 34, x + 180 - hillOffset, groundY - 84);
  }
  ctx.lineTo(viewWidth + 300, groundY);
  ctx.lineTo(-200, groundY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(38,48,79,.18)";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = "rgba(86, 122, 150, 0.34)";
  for (let x = -100; x < viewWidth + 180; x += 125) {
    const px = x - (state.cameraX * 0.28) % 125;
    const height = 60 + ((x / 125) % 3) * 18;
    drawOutlinedRoundRect(px, groundY - 98 - height, 76, height, 10, "rgba(98,143,164,.34)", "rgba(38,48,79,.12)", 3);
    for (let wy = groundY - 86 - height; wy < groundY - 105; wy += 22) {
      ctx.fillStyle = "rgba(255, 245, 190, 0.62)";
      roundRect(ctx, px + 12, wy, 12, 8, 2);
      ctx.fill();
      roundRect(ctx, px + 42, wy, 12, 8, 2);
      ctx.fill();
    }
  }

  const shopOffset = state.cameraX * 0.21;
  for (let i = 0; i < 5; i += 1) {
    const bx = 150 + i * 360 - (shopOffset % 360);
    const by = groundY - 180 - (i % 2) * 20;
    drawOutlinedRoundRect(bx, by, 155, 130, 22, i % 2 ? "#ffd6aa" : "#d9f2ff", "rgba(38,48,79,.18)", 4);
    drawOutlinedPath([[bx - 12, by + 12], [bx + 77, by - 46], [bx + 167, by + 12]], i % 2 ? "#ff8c7a" : "#62d2c1", "rgba(38,48,79,.18)", 4);
    drawWindowBox(bx + 42, by + 46, 70, 48, "#ffd45f");
  }

  drawCloud(210 - state.cameraX * 0.08, 110, 0.9);
  drawCloud(720 - state.cameraX * 0.1, 165, 0.65);
  drawCloud(1180 - state.cameraX * 0.07, 92, 0.8);
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.strokeStyle = "rgba(38,48,79,.2)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 18, 25, Math.PI, Math.PI * 2);
  ctx.arc(31, 8, 33, Math.PI, Math.PI * 2);
  ctx.arc(70, 20, 24, Math.PI, Math.PI * 2);
  ctx.rect(0, 18, 70, 26);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGround() {
  ctx.fillStyle = ART.grassDark;
  ctx.fillRect(0, groundY - 44, viewWidth, 22);
  ctx.fillStyle = ART.grass;
  ctx.fillRect(0, groundY - 58, viewWidth, 32);
  ctx.fillStyle = "rgba(255,255,255,.22)";
  ctx.fillRect(0, groundY - 56, viewWidth, 7);
  ctx.strokeStyle = ART.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, groundY - 26);
  ctx.lineTo(viewWidth, groundY - 26);
  ctx.stroke();

  if (assetManager.has("props.asphaltRoad")) {
    drawSurfaceStrip("props.sidewalkTile", groundY - 126, 112, 0.98);
    drawSurfaceStrip("props.bicycleLaneTile", groundY - 35, 92, 0.96);
    drawSurfaceStrip("props.asphaltRoad", groundY + 42, Math.max(190, viewHeight - groundY + 96), 1);
    return;
  }

  ctx.fillStyle = ART.road;
  ctx.fillRect(0, groundY + 12, viewWidth, viewHeight - groundY);
  ctx.fillStyle = ART.roadDark;
  ctx.fillRect(0, groundY + 14, viewWidth, 8);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  for (let x = -((state.cameraX * 1.1) % 170); x < viewWidth + 170; x += 170) {
    roundRect(ctx, x, groundY + 73, 92, 7, 4);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(38,48,79,.12)";
  for (let x = -((state.cameraX * 0.8) % 96); x < viewWidth + 96; x += 96) {
    roundRect(ctx, x, groundY + 36, 44, 8, 4);
    ctx.fill();
  }
}

function drawSurfaceStrip(key, y, height, alpha = 1) {
  const image = assetManager.get(key);
  if (!image) return;
  const tileWidth = image.naturalWidth * (height / image.naturalHeight);
  const offset = -positiveModulo(state.cameraX, tileWidth);

  for (let x = offset - tileWidth; x < viewWidth + tileWidth; x += tileWidth) {
    assetManager.draw(ctx, key, {
      x,
      y,
      width: tileWidth,
      height,
      anchorX: 0,
      anchorY: 0,
      alpha
    });
  }
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function drawStartArch() {
  const x = worldX(245);
  if (x < -280 || x > viewWidth + 280) return;
  assetManager.draw(ctx, "props.jobMathRpgRaceArch", {
    x,
    y: groundY + 8,
    height: 270,
    alpha: 0.98
  });
}

function drawHouse() {
  const x = worldX(70);
  const y = groundY - 330;
  if (x > viewWidth || x + 470 < 0) return;
  if (assetManager.draw(ctx, "buildings.house01", { x: worldX(295), y: groundY - 6, height: 360 })) {
    drawSign(x + 112, y + 252, "WH의 집", "#fffdf4", ART.ink);
    return;
  }
  drawOutlinedRoundRect(x + 10, y + 28, 430, 272, 28, "#ffe3bc", ART.ink, 6);
  drawOutlinedPath([[x - 18, y + 44], [x + 225, y - 92], [x + 468, y + 44]], "#ff7a6c", ART.ink, 6);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.52)";
  ctx.lineWidth = 5;
  for (let tile = x + 40; tile < x + 420; tile += 60) {
    ctx.beginPath();
    ctx.moveTo(tile, y + 22);
    ctx.quadraticCurveTo(tile + 32, y - 2, tile + 63, y + 24);
    ctx.stroke();
  }
  ctx.restore();
  drawOutlinedRoundRect(x + 37, y + 48, 110, 42, 16, "#fff7df", ART.ink, 4);
  ctx.fillStyle = ART.tealDark;
  ctx.font = "950 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("WH HOME", x + 92, y + 75);
  drawWindowBox(x + 50, y + 112, 96, 82, "#ffb0a1");
  drawWindowBox(x + 304, y + 112, 96, 82, "#ffd45f");
  drawOutlinedRoundRect(x + 182, y + 154, 88, 146, 18, "#31585a", ART.ink, 5);
  drawOutlinedCircle(x + 250, y + 228, 7, ART.gold, ART.ink, 2);
  drawSign(x + 111, y + 251, "WH의 집", "#fffdf4", ART.ink);
}

function drawBakery() {
  const x = worldX(610);
  const y = groundY - 340;
  if (x > viewWidth || x + 520 < 0) return;
  if (assetManager.draw(ctx, "buildings.morningBakery", { x: worldX(862), y: groundY - 4, height: 410 })) {
    return;
  }
  drawOutlinedRoundRect(x, y + 8, 500, 302, 28, "#ffe5c4", ART.ink, 6);
  drawOutlinedRoundRect(x - 14, y + 2, 528, 42, 18, "#ff8a72", ART.ink, 6);
  drawOutlinedRoundRect(x + 102, y + 47, 296, 64, 18, "#fffdf4", ART.ink, 5);
  ctx.fillStyle = "#7a4a3a";
  ctx.font = "1000 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("MORNING BAKERY", x + 250, y + 85);

  for (let i = 0; i < 6; i += 1) {
    drawOutlinedPath(
      [
        [x + 36 + i * 72, y + 121],
        [x + 108 + i * 72, y + 121],
        [x + 98 + i * 72, y + 166],
        [x + 48 + i * 72, y + 166]
      ],
      i % 2 === 0 ? "#ff7a6c" : "#fff1d6",
      ART.ink,
      3
    );
  }

  drawOutlinedRoundRect(x + 48, y + 166, 230, 144, 14, "#9fe4e9", ART.ink, 5);
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  roundRect(ctx, x + 70, y + 184, 186, 95, 12);
  ctx.fill();
  ctx.fillStyle = "#c88758";
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x + 96 + i * 42, y + 258, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawOutlinedRoundRect(x + 331, y + 166, 104, 144, 16, "#60433d", ART.ink, 5);
  drawOutlinedCircle(x + 414, y + 237, 7, ART.gold, ART.ink, 2);
}

function drawMarketOperationsOffice() {
  const x = worldX(2208);
  if (x < -260 || x > viewWidth + 260) return;
  assetManager.draw(ctx, "buildings.marketOperationsOffice", {
    x,
    y: groundY - 4,
    height: 340,
    alpha: 0.96
  });
}

function drawStreetDetails() {
  drawTree(530, 1.05);
  drawTree(2220, 1.2);
  drawLamp(2060);
  const benchX = worldX(420);
  if (benchX > -150 && benchX < viewWidth + 150) assetManager.draw(ctx, "props.bench", { x: benchX, y: groundY + 4, height: 108 });
  const mailboxX = worldX(360);
  if (mailboxX > -100 && mailboxX < viewWidth + 100) assetManager.draw(ctx, "props.mailbox", { x: mailboxX, y: groundY + 6, height: 112 });
  const trashX = worldX(2040);
  if (trashX > -100 && trashX < viewWidth + 100) assetManager.draw(ctx, "props.trashCan", { x: trashX, y: groundY + 5, height: 122 });
  const signX = worldX(2250);
  if (signX > -100 && signX < viewWidth + 100) {
    if (assetManager.draw(ctx, "props.signpost", { x: signX + 8, y: groundY + 4, height: 190 })) return;
    drawOutlinedRoundRect(signX - 5, groundY - 178, 13, 178, 5, "#6d4f3d", ART.ink, 3);
    drawOutlinedRoundRect(signX - 62, groundY - 198, 136, 50, 14, ART.teal, ART.ink, 4);
    ctx.fillStyle = "#fffdf4";
    ctx.font = "900 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("학교 방향 →", signX + 7, groundY - 166);
  }
}

function drawTree(x, scale = 1) {
  const sx = worldX(x);
  if (sx < -100 || sx > viewWidth + 100) return;
  if (assetManager.draw(ctx, "props.tree", { x: sx, y: groundY + 2, height: 250 * scale })) return;
  ctx.save();
  ctx.translate(sx, groundY);
  ctx.scale(scale, scale);
  drawOutlinedRoundRect(-13, -150, 26, 150, 10, ART.wood, ART.ink, 4);
  ctx.fillStyle = "rgba(255,255,255,.16)";
  roundRect(ctx, -6, -138, 5, 118, 3);
  ctx.fill();
  for (const [cx, cy, r, fill] of [[0, -170, 56, "#62c56f"], [-42, -144, 42, "#76dd89"], [43, -144, 44, "#50b966"], [2, -218, 39, "#88e09b"]]) {
    drawOutlinedCircle(cx, cy, r, fill, ART.ink, 4);
  }
  drawTinySparkle(-23, -194, 6, "rgba(255,255,255,.56)");
  drawTinySparkle(31, -170, 4, "rgba(255,255,255,.5)");
  ctx.restore();
}

function drawLamp(x) {
  const sx = worldX(x);
  if (sx < -60 || sx > viewWidth + 60) return;
  if (assetManager.draw(ctx, "props.streetLamp", { x: sx + 28, y: groundY + 5, height: 250 })) return;
  drawOutlinedRoundRect(sx - 5, groundY - 242, 10, 242, 5, "#465a63", ART.ink, 3);
  drawOutlinedRoundRect(sx - 5, groundY - 244, 55, 11, 5, "#465a63", ART.ink, 3);
  drawOutlinedRoundRect(sx + 24, groundY - 254, 36, 34, 11, "#ffe8a4", ART.ink, 3);
  ctx.fillStyle = "rgba(255,228,161,.32)";
  ctx.beginPath();
  ctx.ellipse(sx + 42, groundY - 104, 64, 140, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTruck() {
  const x = worldX(world.truckBaseX + state.truckOffset);
  const y = groundY - 215;
  if (x > viewWidth + 100 || x + 590 < -100) return;

  ctx.fillStyle = "rgba(30,45,55,0.22)";
  ctx.beginPath();
  ctx.ellipse(x + 300, groundY + 5, 285, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  if (assetManager.draw(ctx, "vehicles.logisticsTruck", { x: x + 280, y: groundY + 18, width: 520 })) {
    if (!state.pathOpen && !state.truckDeparting) {
      ctx.save();
      ctx.translate(x + 46, groundY - 62);
      ctx.rotate(-0.04);
      drawOutlinedRoundRect(-138, 0, 145, 17, 7, "#697784", ART.ink, 3);
      ctx.restore();
    }
    const stickerX = x + 392;
    drawOutlinedRoundRect(stickerX, groundY - 125, 96, 46, 10, "#fff5ca", ART.ink, 3);
    ctx.fillStyle = ART.inkSoft;
    ctx.font = "900 8px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("계약 배송비", stickerX + 48, groundY - 108);
    ctx.font = "1000 13px system-ui";
    ctx.fillText("6,000원", stickerX + 48, groundY - 91);
    return;
  }

  drawOutlinedRoundRect(x, y, 360, 165, 25, "#fff0d8", ART.ink, 6);
  drawOutlinedRoundRect(x + 18, y + 21, 326, 18, 9, ART.coral, ART.ink, 3);
  ctx.fillStyle = ART.tealDark;
  ctx.font = "1000 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("FRESH DELIVERY", x + 180, y + 95);
  ctx.fillStyle = ART.inkSoft;
  ctx.font = "850 13px system-ui";
  ctx.fillText("BAKERY SUPPLY 쨌 06:40", x + 180, y + 119);
  for (const [cx, cy, r] of [[x + 48, y + 63, 15], [x + 305, y + 64, 11], [x + 70, y + 126, 8]]) {
    drawOutlinedCircle(cx, cy, r, "#ffd45f", ART.ink, 2.5);
  }

  drawOutlinedPath([[x + 350, y + 58], [x + 456, y + 58], [x + 530, y + 135], [x + 530, y + 165], [x + 350, y + 165]], "#4f8490", ART.ink, 6);
  drawOutlinedPath([[x + 410, y + 72], [x + 454, y + 72], [x + 504, y + 126], [x + 410, y + 126]], "#c9f6ff", ART.ink, 3.5);
  drawOutlinedRoundRect(x + 516, y + 139, 32, 16, 4, ART.ink, ART.ink, 2);

  for (const wheelX of [x + 100, x + 430]) {
    drawOutlinedCircle(wheelX, y + 177, 42, "#2d3444", ART.ink, 5);
    drawOutlinedCircle(wheelX, y + 177, 18, "#c6d2d7", ART.ink, 3);
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wheelX, y + 177, 28, -0.2, Math.PI * 1.1);
    ctx.stroke();
  }

  if (!state.pathOpen && !state.truckDeparting) {
    ctx.save();
    ctx.translate(x - 2, y + 153);
    ctx.rotate(-0.04);
    drawOutlinedRoundRect(-138, 0, 145, 17, 7, "#697784", ART.ink, 3);
    ctx.restore();
  }

  const stickerX = x + 425;
  drawOutlinedRoundRect(stickerX, y + 132, 88, 42, 9, "#fff5ca", ART.ink, 3);
  ctx.fillStyle = ART.inkSoft;
  ctx.font = "900 8px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("계약 배송비", stickerX + 44, y + 146);
  ctx.font = "1000 12px system-ui";
  ctx.fillText("6,000원", stickerX + 44, y + 161);
}

function drawBarrier() {
  if (state.pathOpen) return;
  const x = worldX(world.barrierX);
  if (x < -100 || x > viewWidth + 100) return;
  const openProgress = state.truckDeparting ? Math.min(1, state.truckOffset / 760) : 0;
  if (assetManager.has("props.lockedIronGate")) {
    assetManager.draw(ctx, "props.lockedIronGate", {
      x,
      y: groundY + 8 - openProgress * 180,
      height: 232,
      alpha: 1 - openProgress * 0.42
    });
    if (openProgress > 0.12) {
      drawTinySparkle(x - 58, groundY - 190 - openProgress * 150, 7, ART.gold);
      drawTinySparkle(x + 54, groundY - 156 - openProgress * 145, 5, "#fffdf4");
    }
    return;
  }
  ctx.save();
  ctx.translate(0, -openProgress * 120);
  ctx.globalAlpha *= 1 - openProgress * 0.42;
  drawOutlinedRoundRect(x - 113, groundY - 78, 226, 26, 11, "#fff7df", ART.ink, 4);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 110, groundY - 76, 220, 22);
  ctx.clip();
  ctx.strokeStyle = ART.coral;
  ctx.lineWidth = 18;
  for (let stripe = x - 150; stripe < x + 160; stripe += 55) {
    ctx.beginPath();
    ctx.moveTo(stripe, groundY - 48);
    ctx.lineTo(stripe + 34, groundY - 95);
    ctx.stroke();
  }
  ctx.restore();
  drawOutlinedRoundRect(x - 92, groundY - 55, 15, 57, 5, "#5f6873", ART.ink, 3);
  drawOutlinedRoundRect(x + 77, groundY - 55, 15, 57, 5, "#5f6873", ART.ink, 3);
  drawOutlinedRoundRect(x - 55, groundY - 118, 112, 32, 12, "#fffdf4", ART.ink, 3);
  ctx.fillStyle = ART.coral;
  ctx.font = "1000 11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("안전 확인 중", x, groundY - 97);
  ctx.restore();
}

function drawNPCs() {
  const bakeryStaffX = worldX(785);
  if (bakeryStaffX > -110 && bakeryStaffX < viewWidth + 110) {
    ctx.fillStyle = "rgba(24, 35, 48, 0.18)";
    ctx.beginPath();
    ctx.ellipse(bakeryStaffX, groundY + 4, 35, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!assetManager.draw(ctx, "characters.bakeryStaff", { x: bakeryStaffX, y: groundY + 2, height: 178 })) {
      drawPerson(785, "#ff9a5e", "#343d57", 0.96, false);
    }
  }
  if (!state.pathOpen && !state.truckDeparting) {
    const driverX = worldX(1870);
    if (driverX > -80 && driverX < viewWidth + 80) {
      const drawn = assetManager.draw(ctx, "characters.truckDriver", { x: driverX, y: groundY + 3, height: 172 });
      if (!drawn) drawPerson(1870, "#5d9cff", "#24364a", 1.02, true);
    }
  }
}

function drawPerson(x, shirt, hair, scale, cap) {
  const sx = worldX(x);
  if (sx < -70 || sx > viewWidth + 70) return;
  ctx.save();
  ctx.translate(sx, groundY - 4);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(30,40,50,0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 4, 32, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ART.ink;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-11, -44);
  ctx.lineTo(-16, -3);
  ctx.moveTo(11, -44);
  ctx.lineTo(17, -3);
  ctx.stroke();
  ctx.fillStyle = shirt;
  drawOutlinedRoundRect(-33, -111, 66, 70, 20, shirt, ART.ink, 5);
  ctx.strokeStyle = ART.ink;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-27, -92);
  ctx.lineTo(-44, -63);
  ctx.moveTo(27, -92);
  ctx.lineTo(42, -70);
  ctx.stroke();
  ctx.strokeStyle = shirt;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-27, -92);
  ctx.lineTo(-44, -63);
  ctx.moveTo(27, -92);
  ctx.lineTo(42, -70);
  ctx.stroke();
  drawOutlinedCircle(0, -142, 34, ART.skin, ART.ink, 4.5);
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(0, -155, 34, Math.PI, Math.PI * 2);
  ctx.fill();
  if (cap) {
    ctx.fillStyle = "#304f78";
    ctx.beginPath();
    ctx.arc(0, -156, 37, Math.PI, Math.PI * 2);
    ctx.fill();
    drawOutlinedRoundRect(-34, -158, 58, 9, 4, "#304f78", ART.ink, 2);
  }
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = ART.ink;
  ctx.lineWidth = 2;
  for (const eyeX of [-11, 13]) {
    ctx.beginPath();
    ctx.ellipse(eyeX, -142, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ART.ink;
    ctx.beginPath();
    ctx.arc(eyeX + 1, -141, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
  }
  ctx.strokeStyle = "#9b4e49";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(2, -129, 7, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.restore();
}

function drawInteractables() {
  drawClipboard();
  drawCrate(1085, "밀가루", "#d9b77d", state.notes.has("flour"));
  drawCrate(1185, "우유", "#92cfdb", state.notes.has("milk"));
  drawCrate(1285, "버터", "#e9c948", state.notes.has("butter"));
  drawTerminal();

  for (const item of world.interactions) {
    if (item.id === "clerk" || item.id === "terminal" || item.id === "delivery") continue;
    if (!state.questStarted) continue;
    if (REQUIRED_NOTES.includes(item.id) && state.notes.has(item.id)) continue;
    drawInterestMarker(item.x, item.id === state.nearbyId);
  }
  if (!state.questStarted) drawInterestMarker(785, state.nearbyId === "clerk");
  if (state.questStarted && !state.notes.has("delivery")) drawInterestMarker(1810, state.nearbyId === "delivery");
  if (state.questStarted && state.notes.size === REQUIRED_NOTES.length && !state.challengeCompleted) {
    drawInterestMarker(1435, state.nearbyId === "terminal");
  }
}

function drawClipboard() {
  const x = worldX(930);
  if (x < -80 || x > viewWidth + 80) return;
  drawOutlinedRoundRect(x - 5, groundY - 103, 10, 103, 4, "#5a6e67", ART.ink, 3);
  drawOutlinedRoundRect(x - 38, groundY - 134, 76, 86, 11, "#9f6c43", ART.ink, 4);
  drawOutlinedRoundRect(x - 29, groundY - 126, 58, 69, 6, ART.paper, ART.ink, 2.5);
  drawOutlinedRoundRect(x - 15, groundY - 139, 30, 14, 6, ART.gold, ART.ink, 2.5);
  ctx.fillStyle = ART.inkSoft;
  for (let i = 0; i < 4; i += 1) {
    roundRect(ctx, x - 19, groundY - 112 + i * 13, 38, 4, 2);
    ctx.fill();
  }
}

function drawCrate(x, label, color, collected) {
  const sx = worldX(x);
  if (sx < -80 || sx > viewWidth + 80) return;
  ctx.fillStyle = "rgba(30,40,50,0.18)";
  ctx.beginPath();
  ctx.ellipse(sx, groundY, 44, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  if (assetManager.draw(ctx, "props.boxes", { x: sx, y: groundY + 2, height: 74 })) {
    drawOutlinedRoundRect(sx - 31, groundY - 47, 62, 27, 8, "rgba(255,255,255,.92)", ART.ink, 2.5);
    ctx.fillStyle = collected ? ART.tealDark : ART.inkSoft;
    ctx.font = "1000 11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(collected ? `${label} ✓` : label, sx, groundY - 30);
    if (collected) drawTinySparkle(sx + 38, groundY - 72, 7, ART.gold);
    return;
  }
  drawOutlinedRoundRect(sx - 42, groundY - 70, 84, 68, 13, color, ART.ink, 4.5);
  ctx.save();
  ctx.globalAlpha = .42;
  ctx.fillStyle = "#fff";
  roundRect(ctx, sx - 34, groundY - 62, 68, 10, 5);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(38,48,79,.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx - 36, groundY - 48);
  ctx.lineTo(sx + 36, groundY - 48);
  ctx.moveTo(sx - 20, groundY - 68);
  ctx.lineTo(sx - 20, groundY - 2);
  ctx.moveTo(sx + 20, groundY - 68);
  ctx.lineTo(sx + 20, groundY - 2);
  ctx.stroke();
  drawOutlinedRoundRect(sx - 30, groundY - 48, 60, 26, 8, "rgba(255,255,255,.92)", ART.ink, 2.5);
  ctx.fillStyle = collected ? ART.tealDark : ART.inkSoft;
  ctx.font = "1000 11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(collected ? `${label} ✓` : label, sx, groundY - 31);
  if (collected) drawTinySparkle(sx + 38, groundY - 72, 7, ART.gold);
}

function drawTerminal() {
  const x = worldX(1435);
  if (x < -80 || x > viewWidth + 80 || state.pathOpen) return;
  drawOutlinedRoundRect(x - 42, groundY - 124, 84, 96, 18, "#475b68", ART.ink, 5);
  drawOutlinedRoundRect(x - 31, groundY - 111, 62, 48, 9, state.notes.size === REQUIRED_NOTES.length ? "#abf0d2" : "#9fb7bd", ART.ink, 3);
  ctx.fillStyle = ART.ink;
  ctx.font = "1000 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("172,500원", x, groundY - 82);
  for (let i = 0; i < 3; i += 1) {
    drawOutlinedCircle(x - 18 + i * 18, groundY - 52, 4.5, i === 2 ? ART.gold : "#d8deda", ART.ink, 1.5);
  }
  drawOutlinedRoundRect(x - 6, groundY - 29, 12, 29, 5, "#d8deda", ART.ink, 2);
}

function drawInterestMarker(x, active) {
  const sx = worldX(x);
  if (sx < -40 || sx > viewWidth + 40) return;
  const pulse = settings.reduceMotion ? 0 : Math.sin(performance.now() / 260) * 4;
  const y = groundY - 188 + pulse;
  drawOutlinedCircle(sx, y, active ? 18 : 15, active ? ART.coral : ART.gold, ART.ink, 3.5);
  ctx.fillStyle = "#fffdf4";
  ctx.font = "1000 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(active ? "E" : "!", sx, y + 7);
  if (active) drawTinySparkle(sx + 24, y - 20, 6, "#fffdf4");
}

function drawWH() {
  const x = worldX(state.playerX);
  const moving = !isInteractionPaused() && (keys.left || keys.right);
  const bob = moving && !settings.reduceMotion ? Math.sin(state.walkTime * 2) * 3 : 0;
  const legSwing = moving && !settings.reduceMotion ? Math.sin(state.walkTime) * 13 : 0;
  const armSwing = moving && !settings.reduceMotion ? Math.sin(state.walkTime) * 8 : 0;
  if (assetManager.has("characters.wh")) {
    ctx.fillStyle = "rgba(24, 35, 48, 0.2)";
    ctx.beginPath();
    ctx.ellipse(x, groundY + 5, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    assetManager.drawCharacter(ctx, "wh", {
      x,
      y: groundY + 3 + bob,
      height: 176,
      direction: state.playerDirection === -1 ? "left" : "right"
    });
    return;
  }
  ctx.save();
  ctx.translate(x, groundY - 1 + bob);
  ctx.scale(state.playerDirection, 1);

  ctx.fillStyle = "rgba(24, 35, 48, 0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 6, 40, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ART.ink;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, -48);
  ctx.lineTo(-17 - legSwing * 0.55, -5);
  ctx.moveTo(12, -48);
  ctx.lineTo(18 + legSwing * 0.55, -5);
  ctx.stroke();

  ctx.strokeStyle = ART.gold;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-24 - legSwing * 0.55, -4);
  ctx.lineTo(-8 - legSwing * 0.55, -4);
  ctx.moveTo(10 + legSwing * 0.55, -4);
  ctx.lineTo(28 + legSwing * 0.55, -4);
  ctx.stroke();

  drawOutlinedRoundRect(-37, -119, 20, 62, 10, "#ffbe4d", ART.ink, 4);

  drawOutlinedRoundRect(-29, -121, 62, 81, 22, ART.teal, ART.ink, 5);
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.22)";
  roundRect(ctx, -19, -111, 42, 12, 6);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#fffdf4";
  ctx.font = "1000 12px system-ui";
  ctx.textAlign = "center";
  ctx.save();
  ctx.scale(state.playerDirection, 1);
  ctx.fillText("WH", 2 * state.playerDirection, -76);
  ctx.restore();

  ctx.strokeStyle = ART.ink;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-22, -101);
  ctx.lineTo(-39 + armSwing * 0.25, -66);
  ctx.moveTo(25, -100);
  ctx.lineTo(40 - armSwing * 0.25, -70);
  ctx.stroke();
  ctx.strokeStyle = ART.teal;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-22, -101);
  ctx.lineTo(-39 + armSwing * 0.25, -66);
  ctx.moveTo(25, -100);
  ctx.lineTo(40 - armSwing * 0.25, -70);
  ctx.stroke();

  drawOutlinedCircle(2, -151, 39, ART.skin, ART.ink, 5);
  ctx.fillStyle = ART.hair;
  ctx.beginPath();
  ctx.ellipse(2, -166, 39, 28, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(37, -149);
  ctx.quadraticCurveTo(18, -139, -9, -142);
  ctx.quadraticCurveTo(-29, -144, -37, -152);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-26, -153);
  ctx.quadraticCurveTo(-18, -138, -4, -141);
  ctx.quadraticCurveTo(11, -145, 24, -142);
  ctx.quadraticCurveTo(31, -146, 34, -154);
  ctx.fill();
  ctx.strokeStyle = ART.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(2, -166, 39, 28, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(37, -149);
  ctx.quadraticCurveTo(18, -139, -9, -142);
  ctx.quadraticCurveTo(-29, -144, -37, -152);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.strokeStyle = ART.ink;
  ctx.lineWidth = 3;
  for (const eyeX of [-7, 18]) {
    ctx.beginPath();
    ctx.ellipse(eyeX, -151, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ART.tealDark;
    ctx.beginPath();
    ctx.arc(eyeX + 2, -149, 5.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(eyeX + 4, -153, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
  }

  ctx.strokeStyle = "#9b4e49";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(6, -135, 7, 0.15, Math.PI - 0.15);
  ctx.stroke();
  drawTinySparkle(35, -181, 5, "rgba(255,255,255,.8)");
  ctx.restore();
}

function drawForeground() {
  const grassX = worldX(1470);
  if (grassX > -220 && grassX < viewWidth + 220) {
    assetManager.draw(ctx, "props.grass", { x: grassX, y: groundY + 8, height: 86, alpha: .92 });
  }
  const flowerX = worldX(1615);
  if (flowerX > -220 && flowerX < viewWidth + 220) {
    assetManager.draw(ctx, "props.flowerbed", { x: flowerX, y: groundY + 8, height: 92, alpha: .95 });
  }
  const x = worldX(2140);
  if (x > -200 && x < viewWidth + 200) {
    ctx.fillStyle = "rgba(69,173,92,0.85)";
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.arc(x + i * 45, groundY + 5, 30 + (i % 2) * 11, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }
  for (let i = 0; i < 10; i += 1) {
    const sx = -80 + i * 210 - (state.cameraX * 1.08) % 210;
    if (sx < -40 || sx > viewWidth + 40) continue;
    ctx.strokeStyle = "rgba(38,48,79,.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, groundY - 25);
    ctx.quadraticCurveTo(sx + 9, groundY - 45, sx + 19, groundY - 25);
    ctx.stroke();
    drawOutlinedCircle(sx + 23, groundY - 28, 6, i % 2 ? ART.gold : ART.coral, ART.ink, 2);
  }
}

function drawSign(x, y, text, background, color) {
  drawOutlinedRoundRect(x, y, 90, 34, 10, background, ART.ink, 3);
  ctx.fillStyle = color;
  ctx.font = "1000 13px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(text, x + 45, y + 22);
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

function playTone(frequency, duration, type = "sine") {
  if (!settings.sound) return;
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + 0.02);
  } catch {
    // Audio is an enhancement; gameplay remains fully usable without it.
  }
}

function playSuccessChord() {
  playTone(523, 0.16, "triangle");
  setTimeout(() => playTone(659, 0.16, "triangle"), 90);
  setTimeout(() => playTone(784, 0.22, "triangle"), 180);
}






