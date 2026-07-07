import { checkCountingStageAnswer, createCountingRun } from "./counting-logic.mjs";

const canvas = document.querySelector("#map41-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map41-hud"),
  objective: document.querySelector("#map41-objective"),
  count: document.querySelector("#counting-count"),
  start: document.querySelector("#map41-start"),
  startButton: document.querySelector("#map41-start-button"),
  guide: document.querySelector("#control-guide"),
  prompt: document.querySelector("#interaction-prompt"),
  promptTarget: document.querySelector("#interaction-target"),
  promptText: document.querySelector("#interaction-text"),
  dialogue: document.querySelector("#map41-dialogue"),
  dialogueSpeaker: document.querySelector("#dialogue-speaker"),
  dialogueText: document.querySelector("#dialogue-text"),
  dialogueClose: document.querySelector("#dialogue-close"),
  inventory: document.querySelector("#map41-inventory"),
  inventoryClose: document.querySelector("#inventory-close"),
  textbookList: document.querySelector("#textbook-list"),
  notesList: document.querySelector("#notes-list"),
  inventoryHint: document.querySelector("#inventory-hint"),
  puzzle: document.querySelector("#map41-puzzle"),
  puzzleClose: document.querySelector("#counting-close"),
  rule: document.querySelector("#counting-rule"),
  number: document.querySelector("#counting-number"),
  slots: document.querySelector("#counting-slots"),
  title: document.querySelector("#counting-title"),
  visual: document.querySelector("#counting-visual"),
  note: document.querySelector("#counting-note"),
  summary: document.querySelector("#collected-summary"),
  example: document.querySelector("#counting-example"),
  form: document.querySelector("#counting-form"),
  help: document.querySelector("#counting-help"),
  fields: document.querySelector("#counting-fields"),
  submit: document.querySelector("#counting-submit"),
  feedback: document.querySelector("#map41-feedback"),
  resolution: document.querySelector("#map41-resolution"),
  resolutionTitle: document.querySelector("#resolution-title"),
  resolutionText: document.querySelector("#resolution-text"),
  resolutionContinue: document.querySelector("#resolution-continue"),
  complete: document.querySelector("#map41-complete"),
  replay: document.querySelector("#map41-replay"),
  next: document.querySelector("#map41-next")
};

const kids = Object.freeze([
  { id: "minjun", name: "민준", gender: "남아", x: 0.52, y: 0.58, color: "#69a7ff" },
  { id: "seoyeon", name: "서연", gender: "여아", x: 0.58, y: 0.61, color: "#ff7ba8" },
  { id: "jiho", name: "지호", gender: "남아", x: 0.64, y: 0.57, color: "#77c6ff" },
  { id: "harin", name: "하린", gender: "여아", x: 0.70, y: 0.62, color: "#ff94b9" },
  { id: "doyun", name: "도윤", gender: "남아", x: 0.76, y: 0.58, color: "#6ea4ff" },
  { id: "yuna", name: "유나", gender: "여아", x: 0.61, y: 0.70, color: "#ff7ba8" },
  { id: "junseo", name: "준서", gender: "남아", x: 0.69, y: 0.71, color: "#69a7ff" }
]);

const teacher = Object.freeze({ id: "teacher", label: "유치원 선생님", x: 0.29, y: 0.58 });
const planningBoard = Object.freeze({ id: "board", label: "촬영 계획판", x: 0.42, y: 0.55 });
const textbookEntries = Object.freeze([
  { title: "경우의 수", body: "어떤 일이 일어나는 방법의 수를 세는 것이다. 조건을 먼저 정확히 파악해야 한다." },
  { title: "곱의법칙", body: "한 선택 뒤에 다른 선택이 이어질 때 전체 경우의 수는 각 선택의 경우의 수를 곱한다." },
  { title: "묶음으로 보기", body: "서로 이웃해야 하는 대상들은 하나의 묶음처럼 보고 배열한 뒤, 묶음 안의 순서도 따로 센다." },
  { title: "순열", body: "서로 다른 대상을 순서 있게 배열하는 방법이다. 줄 세우기는 순서가 중요하므로 순열로 생각한다." }
]);

const makeState = () => ({
  run: createCountingRun(),
  stageIndex: 0,
  solvedStages: 0,
  started: false,
  modal: null,
  player: { x: 0.34, y: 0.78 },
  keys: new Set(),
  knownConditions: [false, false],
  discoveredKids: new Set(),
  lastPrompt: null,
  lastTime: performance.now(),
  resolutionStage: null,
  resolutionProgress: 0,
  pride: 0
});

let state = makeState();
let width = 1280;
let height = 720;

resize();
renderInventory();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
ui.startButton.addEventListener("click", startGame);
ui.dialogueClose.addEventListener("click", closeDialogue);
ui.inventoryClose.addEventListener("click", closeInventory);
ui.puzzleClose.addEventListener("click", closePuzzle);
ui.form.addEventListener("submit", submitCounting);
ui.resolutionContinue.addEventListener("click", continueAfterResolution);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href = "./4map2.html"; });

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
  if (state.resolutionStage !== null) state.resolutionProgress = Math.min(1, state.resolutionProgress + dt * 0.7);
  state.pride = Math.max(0, Math.min(1, state.pride + dt * 0.015));
  drawPark(now);
  requestAnimationFrame(loop);
}

function updatePlayer(dt) {
  if (!state.started || state.modal || state.resolutionStage !== null) return;
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
  if (!state.started || state.modal || state.resolutionStage !== null) {
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
  ui.promptText.textContent = nearest.kind === "board" ? "Space Bar로 촬영 계획 세우기" : "Space Bar로 대화/조사";
  ui.prompt.classList.remove("is-hidden");
}

function getNearestInteractable() {
  const candidates = [
    { kind: "teacher", id: teacher.id, label: teacher.label, x: teacher.x, y: teacher.y },
    { kind: "board", id: planningBoard.id, label: planningBoard.label, x: planningBoard.x, y: planningBoard.y },
    ...kids.map((kid) => ({ kind: "kid", id: kid.id, label: state.discoveredKids.has(kid.id) ? `${kid.name} (${kid.gender})` : "유치원생", x: kid.x, y: kid.y }))
  ];
  let best = null;
  for (const candidate of candidates) {
    const distance = Math.hypot(candidate.x - state.player.x, (candidate.y - state.player.y) * 1.35);
    if (distance < 0.075 && (!best || distance < best.distance)) best = { ...candidate, distance };
  }
  return best;
}

function interact() {
  const target = getNearestInteractable();
  if (!target) {
    showDialogue("WH", "가까이에서 조사할 대상을 찾아보자. 선생님, 아이들, 촬영 계획판을 확인할 수 있어.");
    return;
  }
  if (target.kind === "teacher") talkToTeacher();
  else if (target.kind === "kid") talkToKid(target.id);
  else inspectBoard();
}

function talkToTeacher() {
  const stage = state.run[state.stageIndex];
  if (!state.knownConditions[state.stageIndex]) {
    state.knownConditions[state.stageIndex] = true;
    if (state.stageIndex === 0) {
      showDialogue("유치원 선생님", "첫 사진은 여아들이 서로 이웃하게 서도록 찍고 싶어. 그런데 정확한 경우의 수를 설명해야 해서 고민이야. 아이들 정보는 네가 직접 확인해 줄래?");
    } else {
      showDialogue("유치원 선생님", "정말 고마워! 한 장만 더 부탁해도 될까? 이번에는 여아가 양 끝에 오도록 세우는 경우의 수가 궁금해.");
    }
  } else if (isReadyToSolve()) {
    showDialogue("유치원 선생님", `좋아, 조건과 인원 정보가 모였구나. 촬영 계획판에서 "${stage.title}" 계산을 정리해 보자.`);
  } else {
    showDialogue("유치원 선생님", "조건은 알았으니 이제 아이들에게 직접 말을 걸어 남아인지 여아인지 확인해 줘.");
  }
  updateObjective();
  renderInventory();
}

function talkToKid(id) {
  const kid = kids.find((item) => item.id === id);
  if (!kid) return;
  const firstTime = !state.discoveredKids.has(kid.id);
  state.discoveredKids.add(kid.id);
  showDialogue(kid.name, firstTime
    ? `안녕! 나는 ${kid.name}. 나는 ${kid.gender}야. 사진 찍을 때 어디에 서야 하는지 알려줘!`
    : `나는 ${kid.gender}라고 이미 체크했어. 인벤토리에서 확인할 수 있어.`);
  updateObjective();
  renderInventory();
}

function inspectBoard() {
  if (!state.knownConditions[state.stageIndex]) {
    showDialogue("촬영 계획판", "아직 사진 조건이 비어 있다. 선생님에게 먼저 어떤 사진을 찍고 싶은지 물어보자.");
    return;
  }
  if (state.discoveredKids.size < kids.length) {
    showDialogue("촬영 계획판", `아이들 정보가 아직 부족하다. 확인한 아이는 ${state.discoveredKids.size}/${kids.length}명이다.`);
    return;
  }
  openPuzzle();
}

function isReadyToSolve() {
  return state.knownConditions[state.stageIndex] && state.discoveredKids.size === kids.length;
}

function openPuzzle() {
  if (!isReadyToSolve()) return;
  state.modal = "puzzle";
  ui.puzzle.classList.remove("is-hidden");
  renderStage();
}

function closePuzzle() {
  ui.puzzle.classList.add("is-hidden");
  if (state.modal === "puzzle") state.modal = null;
}

function renderStage() {
  const stage = state.run[state.stageIndex];
  ui.rule.textContent = stage.rule;
  ui.number.textContent = String(state.stageIndex + 1);
  ui.title.textContent = stage.title;
  ui.note.textContent = stage.note;
  ui.help.textContent = "필요하면 I 키로 교과서와 수집 정보를 다시 확인하세요.";
  ui.summary.innerHTML = renderCollectedSummary(stage);
  ui.example.innerHTML = renderExample(stage);
  ui.visual.innerHTML = renderStageVisual(stage);
  ui.form.reset();
  ui.form.classList.remove("is-wrong");
  ui.fields.innerHTML = stage.fields.map((field) => `
    <label class="counting-field">
      <span>${field.label}</span>
      <span class="number-with-unit"><input name="${field.key}" data-counting-field="${field.key}" type="number" min="0" step="${field.step}" inputmode="numeric" autocomplete="off" required/><b>${field.unit}</b></span>
    </label>
  `).join("");
  ui.feedback.textContent = state.stageIndex === 0
    ? "수집한 정보를 바탕으로 여아 3명을 하나의 묶음처럼 생각해 보세요."
    : "양 끝 자리에 설 여아를 먼저 정하고, 가운데 자리를 배열해 보세요.";
  ui.feedback.className = "counting-feedback";
  renderProgress();
  requestAnimationFrame(() => ui.fields.querySelector("input")?.focus());
}

function renderCollectedSummary(stage) {
  const counts = getObservedCounts();
  const condition = state.stageIndex === 0
    ? "여아들이 서로 이웃하게 한 줄로 서기"
    : "여아가 양 끝에 오도록 한 줄로 서기";
  return `
    <b>수집한 조건</b><br/>
    선생님의 부탁: ${condition}<br/>
    직접 확인한 아이들: 남아 ${counts.boys}명, 여아 ${counts.girls}명, 모두 ${counts.total}명<br/>
    사용할 교과서 개념: ${stage.rule}
  `;
}

function renderExample(stage) {
  if (stage.type === "girls-together") {
    return `
      <b>생각해 볼 예시</b>
      <p>예를 들어 A, B가 꼭 이웃해야 하고 C도 함께 줄을 선다면, [AB] 묶음과 C를 배열한 뒤 [AB] 안에서 A-B, B-A 두 순서도 따로 생각할 수 있어.</p>
    `;
  }
  return `
    <b>생각해 볼 예시</b>
    <p>예를 들어 양 끝에 설 사람을 먼저 정한다면, 왼쪽 끝과 오른쪽 끝은 서로 다른 자리야. 같은 두 사람이라도 자리가 바뀌면 다른 배열로 본다.</p>
  `;
}

function submitCounting(event) {
  event.preventDefault();
  if (state.modal !== "puzzle") return;
  const stage = state.run[state.stageIndex];
  const submitted = Object.fromEntries(stage.fields.map((field) => [field.key, ui.fields.querySelector(`[name="${field.key}"]`)?.value ?? ""]));
  if (stage.fields.some((field) => String(submitted[field.key]).trim() === "")) {
    showError("경우의 수를 숫자로 입력해야 촬영 계획을 설명할 수 있어.");
    return;
  }
  const result = checkCountingStageAnswer(stage, submitted);
  if (!result.correct) {
    showError(`${stage.fields[0].label}를 다시 확인해 보자. ${stage.help}`);
    return;
  }
  closePuzzle();
  playResolution(result.answer.ways);
}

function showError(message) {
  ui.feedback.textContent = message;
  ui.feedback.className = "counting-feedback is-error";
  ui.form.classList.remove("is-wrong");
  void ui.form.offsetWidth;
  ui.form.classList.add("is-wrong");
}

function playResolution(ways) {
  state.modal = "resolution";
  state.resolutionStage = state.stageIndex;
  state.resolutionProgress = 0;
  ui.resolutionTitle.textContent = state.stageIndex === 0 ? "여아 묶음 줄 서기 시뮬레이션" : "양 끝 여아 배치 시뮬레이션";
  ui.resolutionText.textContent = getResolutionText(state.stageIndex, ways);
  ui.resolution.classList.remove("is-hidden");
}

function getResolutionText(stageIndex, ways) {
  if (stageIndex === 0) {
    return `여아 3명을 한 묶음으로 보면 남아 4명과 여아 묶음 1개, 모두 5개의 대상을 배열한다. 그리고 묶음 안 여아 3명의 순서도 바꿀 수 있으므로 5!×3! = ${ways}가지가 된다.`;
  }
  return `양 끝에 설 여아 2명을 순서 있게 고르면 3P2가지, 가운데 5자리에 남은 아이들을 배열하면 5!가지다. 그래서 3P2×5! = ${ways}가지가 된다.`;
}

function continueAfterResolution() {
  ui.resolution.classList.add("is-hidden");
  state.solvedStages = Math.max(state.solvedStages, state.stageIndex + 1);
  state.resolutionStage = null;
  state.resolutionProgress = 0;
  if (state.stageIndex === 0) {
    state.stageIndex = 1;
    state.knownConditions[1] = true;
    state.modal = null;
    showDialogue("유치원 선생님", "첫 번째 촬영 계획이 딱 맞았어! 한 장만 더 부탁해도 될까? 이번에는 여아가 양 끝에 오도록 세우는 경우의 수가 궁금해.");
    updateObjective();
    renderInventory();
  } else {
    state.modal = null;
    completeMap();
  }
}

function completeMap() {
  ui.hud.classList.add("is-hidden");
  ui.guide.classList.add("is-hidden");
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
  if (state.knownConditions[0]) notes.push(["첫 번째 촬영 조건", "여아들이 서로 이웃하게 한 줄로 서야 한다."]);
  if (state.knownConditions[1]) notes.push(["두 번째 촬영 조건", "여아가 양 끝에 오도록 한 줄로 서야 한다."]);
  const discovered = kids.filter((kid) => state.discoveredKids.has(kid.id));
  if (discovered.length) {
    const counts = getObservedCounts();
    notes.push(["확인한 아이들", discovered.map((kid) => `${kid.name}: ${kid.gender}`).join(", ")]);
    notes.push(["현재 인원 집계", `남아 ${counts.boys}명, 여아 ${counts.girls}명, 모두 ${counts.total}명`]);
  }
  if (state.solvedStages >= 1) notes.push(["첫 번째 계산 결과", "여아 묶음 배열은 5!×3! = 720가지였다."]);
  if (state.solvedStages >= 2) notes.push(["두 번째 계산 결과", "양 끝 여아 배치는 3P2×5! = 720가지였다."]);
  ui.notesList.innerHTML = notes.length
    ? notes.map(([title, body]) => `<div class="inventory-item"><b>${title}</b>${body}</div>`).join("")
    : `<div class="inventory-item is-empty">아직 모은 정보가 없다. 선생님과 아이들에게 말을 걸어 보자.</div>`;
  ui.inventoryHint.textContent = isReadyToSolve()
    ? "정보가 충분하다. 촬영 계획판으로 가서 계산을 정리할 수 있다."
    : "교과서는 개념을 알려 주지만, 사진 조건과 인원 정보는 직접 조사해야 한다.";
  renderProgress();
}

function getObservedCounts() {
  const discovered = kids.filter((kid) => state.discoveredKids.has(kid.id));
  const boys = discovered.filter((kid) => kid.gender === "남아").length;
  const girls = discovered.filter((kid) => kid.gender === "여아").length;
  return { boys, girls, total: discovered.length };
}

function updateObjective() {
  if (!state.knownConditions[state.stageIndex]) {
    ui.objective.textContent = state.stageIndex === 0
      ? "선생님에게 첫 번째 사진 촬영 조건을 물어보자."
      : "선생님에게 두 번째 사진 촬영 조건을 물어보자.";
  } else if (state.discoveredKids.size < kids.length) {
    ui.objective.textContent = `아이들에게 직접 말을 걸어 인원 정보를 모으자. (${state.discoveredKids.size}/${kids.length})`;
  } else {
    ui.objective.textContent = "촬영 계획판에서 수집한 정보를 연결해 경우의 수를 계산하자.";
  }
  renderProgress();
}

function renderProgress() {
  const currentTotal = kids.length + 1;
  const currentCount = state.discoveredKids.size + (state.knownConditions[state.stageIndex] ? 1 : 0);
  ui.count.textContent = `${currentCount} / ${currentTotal}`;
  if (ui.slots.children.length !== state.run.length) {
    ui.slots.innerHTML = Array.from({ length: state.run.length }, () => "<i></i>").join("");
  }
  [...ui.slots.children].forEach((slot, index) => slot.classList.toggle("is-filled", index < state.solvedStages));
}

function renderStageVisual(stage) {
  if (stage.type === "girls-together") return renderGirlsTogetherVisual(stage);
  return renderGirlsAtEndsVisual(stage);
}

function renderGirlsTogetherVisual(stage) {
  const { boys, girls } = stage.givens;
  return `
    <svg viewBox="0 0 10 6.6" role="img" aria-label="여아 세 명이 이웃하게 서는 줄 세우기 조건">
      <text class="case-label" x="5" y=".55" text-anchor="middle">직접 확인한 아이: 남아 ${boys}명, 여아 ${girls}명</text>
      <rect class="kid-block" x="4.55" y="1.25" width="2.1" height="2.9" rx=".18"/>
      ${renderKid(1.2, 3.25, "boy", "남")}
      ${renderKid(2.45, 3.25, "boy", "남")}
      ${renderKid(3.7, 3.25, "boy", "남")}
      ${renderKid(5.0, 3.25, "girl", "여")}
      ${renderKid(5.6, 3.25, "girl", "여")}
      ${renderKid(6.2, 3.25, "girl", "여")}
      ${renderKid(7.65, 3.25, "boy", "남")}
      <text class="case-small" x="5.6" y="4.55" text-anchor="middle">여아 3명을 한 묶음으로 보기</text>
      <text class="case-formula" x="5" y="5.62" text-anchor="middle">5개의 대상 배열 × 묶음 안 여아 배열</text>
    </svg>
  `;
}

function renderGirlsAtEndsVisual(stage) {
  const { boys, girls } = stage.givens;
  return `
    <svg viewBox="0 0 10 6.6" role="img" aria-label="양 끝에 여아가 서는 줄 세우기 조건">
      <text class="case-label" x="5" y=".55" text-anchor="middle">직접 확인한 아이: 남아 ${boys}명, 여아 ${girls}명</text>
      <rect class="kid-end" x=".75" y="1.05" width="1.05" height="3.45" rx=".15"/>
      <rect class="kid-end" x="8.2" y="1.05" width="1.05" height="3.45" rx=".15"/>
      ${renderKid(1.28, 3.25, "girl", "여")}
      ${renderKid(2.55, 3.25, "boy", "?")}
      ${renderKid(3.8, 3.25, "boy", "?")}
      ${renderKid(5.05, 3.25, "girl", "?")}
      ${renderKid(6.3, 3.25, "boy", "?")}
      ${renderKid(7.55, 3.25, "boy", "?")}
      ${renderKid(8.72, 3.25, "girl", "여")}
      <text class="case-small" x="5" y="4.72" text-anchor="middle">양 끝 여아 2명은 순서가 중요하고, 가운데 5명도 순서가 중요함</text>
      <text class="case-formula" x="5" y="5.75" text-anchor="middle">양 끝 여아 배열 × 가운데 배열</text>
    </svg>
  `;
}

function renderKid(x, y, type, label) {
  const bodyClass = type === "girl" ? "kid-girl" : "kid-boy";
  return `
    <g transform="translate(${x} ${y})">
      <circle class="kid-head" cx="0" cy="-.78" r=".28"/>
      <rect class="${bodyClass}" x="-.25" y="-.45" width=".5" height=".82" rx=".18"/>
      <text class="case-small" x="0" y=".88" text-anchor="middle">${label}</text>
    </g>
  `;
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

function drawPark(now) {
  const density = Math.min(2, devicePixelRatio || 1);
  ctx.setTransform(density, 0, 0, density, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#8fe4ff");
  sky.addColorStop(0.48, "#eefdff");
  sky.addColorStop(0.49, "#c9f0b7");
  sky.addColorStop(1, "#79ce67");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  drawSun(now);
  drawSchool();
  drawPath();
  drawTrees(now);
  drawCyclists(now);
  drawPhotoZone(now);
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

function drawSchool() {
  ctx.save();
  ctx.translate(width * 0.08, height * 0.31);
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.fillRect(0, 18, 230, 120);
  ctx.fillStyle = "#ffbd73";
  ctx.beginPath();
  ctx.moveTo(-8, 18);
  ctx.lineTo(115, -42);
  ctx.lineTo(238, 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7fdcff";
  for (let i = 0; i < 4; i += 1) ctx.fillRect(24 + i * 50, 44, 26, 22);
  ctx.fillStyle = "#234156";
  ctx.font = "900 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("SCHOOL", 115, 102);
  ctx.restore();
}

function drawPath() {
  ctx.fillStyle = "#e8cf99";
  ctx.beginPath();
  ctx.moveTo(width * 0.34, height * 0.5);
  ctx.quadraticCurveTo(width * 0.55, height * 0.7, width * 0.48, height);
  ctx.lineTo(width * 0.82, height);
  ctx.quadraticCurveTo(width * 0.7, height * 0.7, width * 0.5, height * 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawTrees(now) {
  for (let i = 0; i < 5; i += 1) {
    const x = width * (0.1 + i * 0.2);
    const y = height * (0.52 + (i % 2) * 0.04);
    ctx.fillStyle = "#8a5a35";
    ctx.fillRect(x - 8, y - 5, 16, 70);
    ctx.fillStyle = i % 2 ? "#2da85a" : "#47bd62";
    ctx.beginPath();
    ctx.arc(x + Math.sin(now / 700 + i) * 2, y - 25, 38, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCyclists(now) {
  const bikeX = (width * 0.1 + (now * 0.05) % (width * 0.82));
  drawBikeKid(bikeX, height * 0.76, "#69a7ff");
  const inlineX = width - ((now * 0.062) % (width * 0.78)) - width * 0.08;
  drawInlineKid(inlineX, height * 0.64, "#ff7ba8");
}

function drawPhotoZone() {
  ctx.save();
  ctx.translate(width * 0.62, height * 0.61);
  ctx.fillStyle = "rgba(255,255,255,.58)";
  ctx.beginPath();
  ctx.roundRect(-190, -118, 410, 185, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(35,65,86,.12)";
  ctx.stroke();
  ctx.fillStyle = "#234156";
  ctx.font = "900 13px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("촬영 대기 구역", 0, -88);
  ctx.restore();
}

function drawWorldObjects(now) {
  drawTeacher(teacher.x * width, teacher.y * height);
  drawPlanningBoard(planningBoard.x * width, planningBoard.y * height);
  const orderedKids = state.resolutionStage === null ? kids : getResolutionKids();
  for (const kid of orderedKids) {
    const base = kids.find((item) => item.id === kid.id) ?? kid;
    const x = (kid.x ?? base.x) * width;
    const y = (kid.y ?? base.y) * height + Math.sin(now / 250 + x * 0.01) * 1.5;
    drawChild(x, y, base, state.discoveredKids.has(base.id));
  }
}

function getResolutionKids() {
  const progress = easeOutCubic(state.resolutionProgress);
  const stage0 = [
    ["minjun", 0.48], ["jiho", 0.55], ["seoyeon", 0.62], ["harin", 0.67], ["yuna", 0.72], ["doyun", 0.79], ["junseo", 0.86]
  ];
  const stage1 = [
    ["seoyeon", 0.48], ["minjun", 0.55], ["jiho", 0.62], ["doyun", 0.69], ["junseo", 0.76], ["harin", 0.83], ["yuna", 0.9]
  ];
  const target = (state.resolutionStage === 0 ? stage0 : stage1).map(([id, x]) => ({ id, x, y: 0.63 }));
  return target.map((targetKid) => {
    const original = kids.find((kid) => kid.id === targetKid.id);
    return {
      id: targetKid.id,
      x: lerp(original.x, targetKid.x, progress),
      y: lerp(original.y, targetKid.y, progress)
    };
  });
}

function drawTeacher(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(35,65,86,.13)";
  ctx.beginPath();
  ctx.ellipse(0, 48, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4c7a8";
  ctx.beginPath();
  ctx.arc(0, -27, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7d5a45";
  ctx.beginPath();
  ctx.arc(0, -35, 18, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2da85a";
  ctx.beginPath();
  ctx.roundRect(-16, -10, 32, 48, 10);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("선생님", 0, 58);
  ctx.restore();
}

function drawPlanningBoard(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#8a5a35";
  ctx.fillRect(-34, 18, 8, 46);
  ctx.fillRect(26, 18, 8, 46);
  ctx.fillStyle = "#fff8df";
  ctx.strokeStyle = "#234156";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-48, -36, 96, 58, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1b9d58";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("촬영 계획판", 0, -10);
  ctx.fillStyle = "#4a6675";
  ctx.font = "800 9px system-ui";
  ctx.fillText("정보 모은 뒤 Space", 0, 8);
  ctx.restore();
}

function drawChild(x, y, kid, known) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(35,65,86,.12)";
  ctx.beginPath();
  ctx.ellipse(0, 42, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4c7a8";
  ctx.beginPath();
  ctx.arc(0, -27, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = known ? kid.color : "#f1c15d";
  ctx.beginPath();
  ctx.roundRect(-13, -11, 26, 42, 10);
  ctx.fill();
  ctx.fillStyle = "#234156";
  ctx.font = "900 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(known ? kid.gender : "?", 0, 48);
  ctx.restore();
}

function drawBikeKid(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#234156";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-28, 18, 18, 0, Math.PI * 2);
  ctx.arc(28, 18, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-28, 18);
  ctx.lineTo(0, -2);
  ctx.lineTo(28, 18);
  ctx.lineTo(-2, 18);
  ctx.lineTo(-28, 18);
  ctx.stroke();
  drawTinyKid(0, -28, color);
  ctx.restore();
}

function drawInlineKid(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  drawTinyKid(0, 0, color);
  ctx.strokeStyle = "#234156";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, 42);
  ctx.lineTo(2, 42);
  ctx.moveTo(10, 42);
  ctx.lineTo(30, 42);
  ctx.stroke();
  ctx.restore();
}

function drawTinyKid(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f4c7a8";
  ctx.beginPath();
  ctx.arc(0, -30, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-13, -17, 26, 38, 10);
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
