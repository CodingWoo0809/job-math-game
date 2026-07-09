import { assetManager } from "./asset-manager.mjs";
import { CANDY_GAMES, checkCandyGameAnswer, formatProbabilityPercent, getCandyGameProbabilities } from "./probability-logic.mjs";

const canvas = document.querySelector("#map42-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map42-hud"),
  objective: document.querySelector("#map42-objective"),
  count: document.querySelector("#probability-count"),
  start: document.querySelector("#map42-start"),
  startButton: document.querySelector("#map42-start-button"),
  guide: document.querySelector("#map42-control-guide"),
  prompt: document.querySelector("#map42-interaction-prompt"),
  promptTarget: document.querySelector("#map42-interaction-target"),
  promptText: document.querySelector("#map42-interaction-text"),
  dialogue: document.querySelector("#map42-dialogue"),
  dialogueSpeaker: document.querySelector("#map42-dialogue-speaker"),
  dialogueText: document.querySelector("#map42-dialogue-text"),
  dialogueClose: document.querySelector("#map42-dialogue-close"),
  inventory: document.querySelector("#map42-inventory"),
  inventoryClose: document.querySelector("#map42-inventory-close"),
  textbookList: document.querySelector("#map42-textbook-list"),
  notesList: document.querySelector("#map42-notes-list"),
  inventoryHint: document.querySelector("#map42-inventory-hint"),
  puzzle: document.querySelector("#map42-puzzle"),
  puzzleClose: document.querySelector("#probability-close"),
  summary: document.querySelector("#probability-summary"),
  visual: document.querySelector("#probability-visual"),
  form: document.querySelector("#probability-form"),
  fields: document.querySelector("#probability-fields"),
  feedback: document.querySelector("#map42-feedback"),
  resolution: document.querySelector("#map42-resolution"),
  resolutionTitle: document.querySelector("#map42-resolution-title"),
  resolutionText: document.querySelector("#map42-resolution-text"),
  resolutionContinue: document.querySelector("#map42-resolution-continue"),
  complete: document.querySelector("#map42-complete"),
  replay: document.querySelector("#map42-replay"),
  next: document.querySelector("#map42-next")
};

const uncle = Object.freeze({ id: "uncle", label: "문구점 아저씨", x: 0.22, y: 0.6 });
const kids = Object.freeze({ id: "kids", label: "속상한 초등학생들", x: 0.56, y: 0.82 });
const fairnessSign = Object.freeze({ id: "fairness", label: "공정한 도구 안내판", x: 0.36, y: 0.52 });
const choiceBoard = Object.freeze({ id: "choice-board", label: "사탕 게임 선택대", x: 0.56, y: 0.86 });
const gameCards = Object.freeze([
  { id: "game-1", gameId: 1, label: "상황 1 카드", x: 0.22, y: 0.58 },
  { id: "game-2", gameId: 2, label: "상황 2 카드", x: 0.58, y: 0.58 },
  { id: "game-3", gameId: 3, label: "상황 3 카드", x: 0.94, y: 0.58 }
]);

const textbookEntries = Object.freeze([
  { title: "가능성", body: "어떤 현상이 일어날 수 있는 정도를 말한다. 가능성이 클수록 그 현상이 더 자주 일어날 것으로 기대할 수 있다." },
  { title: "가능성의 수치화", body: "모든 결과가 같은 정도로 일어날 때 가능성은 원하는 결과의 수를 전체 결과의 수로 나누어 구한다." },
  { title: "백분율 표현", body: "가능성의 값을 100을 기준으로 나타내면 백분율이 된다. 예를 들어 1/4은 25%이다." },
  { title: "동시에 일어나는 두 일", body: "서로 영향을 주지 않는 도구를 함께 사용할 때 전체 경우는 각 도구의 경우의 수를 곱해 생각할 수 있다." }
]);

const makeState = () => ({
  started: false,
  modal: null,
  player: { x: 0.18, y: 0.78 },
  keys: new Set(),
  spokenUncle: false,
  spokenKids: false,
  fairnessChecked: false,
  inspectedCards: new Set(),
  lastPrompt: null,
  lastTime: performance.now(),
  resolutionProgress: 0,
  resolving: false,
  candyGlow: 0
});

let state = makeState();
let width = 1280;
let height = 720;

assetManager.loadAll().catch((error) => console.warn(error));
resize();
renderInventory();
ui.visual.innerHTML = renderProbabilityVisual();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
ui.startButton.addEventListener("click", startGame);
ui.dialogueClose.addEventListener("click", closeDialogue);
ui.inventoryClose.addEventListener("click", closeInventory);
ui.puzzleClose.addEventListener("click", closePuzzle);
ui.form.addEventListener("submit", submitProbability);
ui.resolutionContinue.addEventListener("click", completeMap);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href = "./4map3.html"; });

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
  if (state.resolving) state.resolutionProgress = Math.min(1, state.resolutionProgress + dt * 0.55);
  state.candyGlow = (state.candyGlow + dt) % 1000;
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
  ui.promptText.textContent = nearest.kind === "choice" ? "Space Bar로 선택 정리" : "Space Bar로 대화/조사";
  ui.prompt.classList.remove("is-hidden");
}

function getNearestInteractable() {
  const candidates = [
    { kind: "uncle", id: uncle.id, label: uncle.label, x: uncle.x, y: uncle.y },
    { kind: "kids", id: kids.id, label: kids.label, x: kids.x, y: kids.y },
    { kind: "fairness", id: fairnessSign.id, label: fairnessSign.label, x: fairnessSign.x, y: fairnessSign.y },
    { kind: "choice", id: choiceBoard.id, label: choiceBoard.label, x: choiceBoard.x, y: choiceBoard.y },
    ...gameCards.map((card) => ({ kind: "card", id: card.id, label: card.label, x: card.x, y: card.y }))
  ];
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
    showDialogue("WH", "조사할 대상을 찾아보자. 문구점 아저씨, 아이들, 세 장의 게임 카드, 공정한 도구 안내판을 확인할 수 있어.");
    return;
  }
  if (target.kind === "uncle") talkToUncle();
  else if (target.kind === "kids") talkToKids();
  else if (target.kind === "fairness") inspectFairnessSign();
  else if (target.kind === "card") inspectGameCard(target.id);
  else inspectChoiceBoard();
}

function talkToUncle() {
  state.spokenUncle = true;
  showDialogue("문구점 아저씨", "사탕 게임은 세 상황 중 하나를 골라 도전하는 거야. 이기면 사탕 하나! 다만 어떤 상황이 더 유리한지는 직접 따져 봐야지. 카드에 조건은 적어 뒀단다.");
  updateObjective();
  renderInventory();
}

function talkToKids() {
  state.spokenKids = true;
  showDialogue("초등학생들", "다들 아무 카드나 골랐는데 사탕을 거의 못 받았어. 셋 다 어려워 보이는데, 그래도 조금이라도 더 유리한 카드가 있지 않을까?");
  updateObjective();
  renderInventory();
}

function inspectFairnessSign() {
  state.fairnessChecked = true;
  showDialogue("공정한 도구 안내판", "모든 동전은 앞면과 뒷면이 같은 정도로 나오고, 모든 주사위 눈과 숫자카드는 같은 정도로 나온다. 서로 다른 도구의 결과는 서로 영향을 주지 않는다.");
  updateObjective();
  renderInventory();
}

function inspectGameCard(id) {
  const card = gameCards.find((item) => item.id === id);
  const game = CANDY_GAMES.find((item) => item.id === card?.gameId);
  if (!card || !game) return;
  state.inspectedCards.add(card.id);
  showDialogue(card.label, `${game.title}: ${game.condition}`);
  updateObjective();
  renderInventory();
}

function inspectChoiceBoard() {
  if (!isReadyToSolve()) {
    showDialogue("사탕 게임 선택대", `아직 정보가 부족하다. 현재 수집 정보는 ${getCollectedCount()}/${getRequiredCount()}개다. 세 게임 조건과 공정한 도구 안내까지 확인해 보자.`);
    return;
  }
  openPuzzle();
}

function isReadyToSolve() {
  return state.spokenUncle && state.spokenKids && state.fairnessChecked && state.inspectedCards.size === gameCards.length;
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
  ui.visual.innerHTML = renderProbabilityVisual();
  ui.form.reset();
  ui.form.classList.remove("is-wrong");
  ui.feedback.textContent = "가능성은 원하는 경우의 수 ÷ 전체 경우의 수로 계산하고, 백분율로 바꾸어 비교하세요.";
  ui.feedback.className = "probability-feedback";
  renderProgress();
  requestAnimationFrame(() => ui.fields.querySelector("input")?.focus());
}

function renderCollectedSummary() {
  return `
    <b>수집한 조건</b><br/>
    상황 1: 1~20 숫자카드 중 5의 배수<br/>
    상황 2: 동전 2개를 동시에 던져 모두 앞면<br/>
    상황 3: 1~10 눈이 있는 10면 주사위를 굴려 3의 배수<br/>
    도구 안내: 모든 결과는 같은 정도로 나타나며 서로 영향을 주지 않음
  `;
}

function renderProbabilityVisual() {
  return `
    <svg viewBox="0 0 10 6.6" role="img" aria-label="문구점 사탕 게임 세 가지 가능성 비교">
      <rect class="chance-card" x=".55" y=".75" width="2.7" height="4.7" rx=".18"/>
      <rect class="chance-card" x="3.65" y=".75" width="2.7" height="4.7" rx=".18"/>
      <rect class="chance-card accent" x="6.75" y=".75" width="2.7" height="4.7" rx=".18"/>
      <text class="chance-label" x="1.9" y="1.35" text-anchor="middle">상황 1</text>
      <text class="chance-small" x="1.9" y="2.05" text-anchor="middle">숫자카드 1~20</text>
      <text class="chance-small" x="1.9" y="2.48" text-anchor="middle">5의 배수</text>
      <text class="chance-question" x="1.9" y="4.18" text-anchor="middle">? %</text>
      <text class="chance-label" x="5" y="1.35" text-anchor="middle">상황 2</text>
      <text class="chance-small" x="5" y="2.05" text-anchor="middle">동전 2개</text>
      <text class="chance-small" x="5" y="2.48" text-anchor="middle">모두 앞면</text>
      <text class="chance-question" x="5" y="4.18" text-anchor="middle">? %</text>
      <text class="chance-label" x="8.1" y="1.35" text-anchor="middle">상황 3</text>
      <text class="chance-small" x="8.1" y="2.05" text-anchor="middle">10면 주사위</text>
      <text class="chance-small" x="8.1" y="2.48" text-anchor="middle">3의 배수</text>
      <text class="chance-question" x="8.1" y="4.18" text-anchor="middle">? %</text>
      <text class="chance-small" x="5" y="6.05" text-anchor="middle">세 값이 비슷해 보여도 백분율로 비교하면 가장 유리한 선택이 보인다.</text>
    </svg>
  `;
}

function submitProbability(event) {
  event.preventDefault();
  if (state.modal !== "puzzle") return;
  const submitted = Object.fromEntries(["p1", "p2", "p3", "best"].map((name) => [name, ui.form.elements[name]?.value ?? ""]));
  if (Object.values(submitted).some((value) => String(value).trim() === "")) {
    showError("세 상황의 가능성과 추천할 상황 번호를 모두 숫자로 입력해야 해.");
    return;
  }
  const result = checkCandyGameAnswer(submitted);
  if (!result.correct) {
    const wrongPercent = result.percentResults.find((item) => !item.correct);
    if (wrongPercent) {
      showError(`${wrongPercent.key.replace("p", "상황 ")}의 가능성을 다시 확인해 보자. 원하는 경우의 수를 전체 경우의 수로 나누고 100을 곱해.`);
    } else {
      showError("가장 유리한 상황 번호를 다시 비교해 보자. 백분율이 가장 큰 상황을 골라야 해.");
    }
    return;
  }
  closePuzzle();
  playResolution(result);
}

function showError(message) {
  ui.feedback.textContent = message;
  ui.feedback.className = "probability-feedback is-error";
  ui.form.classList.remove("is-wrong");
  void ui.form.offsetWidth;
  ui.form.classList.add("is-wrong");
}

function playResolution(result) {
  state.modal = "resolution";
  state.resolving = true;
  state.resolutionProgress = 0;
  const [p1, p2, p3] = result.probabilities.map((item) => formatProbabilityPercent(item.percent));
  ui.resolutionTitle.textContent = "WH의 추천으로 아이들이 3번 카드 앞에 섰어!";
  ui.resolutionText.textContent = `상황 1은 4/20 = ${p1}%, 상황 2는 1/4 = ${p2}%, 상황 3은 3/10 = ${p3}%야. 세 값 중 ${p3}%가 가장 크므로 사탕을 받기에 가장 유리한 선택은 상황 3이다.`;
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
  if (state.spokenUncle) notes.push(["아저씨의 규칙", "세 상황 중 하나를 골라 성공하면 사탕을 받는다."]);
  if (state.spokenKids) notes.push(["아이들 반응", "아무 카드나 골랐더니 승률이 좋지 않아 속상해하고 있다."]);
  if (state.fairnessChecked) notes.push(["공정한 도구 안내", "동전, 주사위, 숫자카드는 각 결과가 같은 정도로 나오며 서로 영향을 주지 않는다."]);
  for (const card of gameCards) {
    if (!state.inspectedCards.has(card.id)) continue;
    const game = CANDY_GAMES.find((item) => item.id === card.gameId);
    notes.push([`${card.label} 조건`, game.condition]);
  }
  if (isReadyToSolve()) {
    notes.push(["해결 준비", "세 상황의 가능성을 백분율로 나타내어 가장 큰 값을 고르면 된다."]);
  }
  ui.notesList.innerHTML = notes.length
    ? notes.map(([title, body]) => `<div class="inventory-item"><b>${title}</b>${body}</div>`).join("")
    : `<div class="inventory-item is-empty">아직 모은 정보가 없다. 문구점 앞 사람들과 게임 카드를 조사해 보자.</div>`;
  ui.inventoryHint.textContent = isReadyToSolve()
    ? "정보가 충분하다. 사탕 게임 선택대에서 세 가능성을 비교할 수 있다."
    : "교과서는 계산 방법을 알려 주지만, 게임 조건과 도구 안내는 직접 조사해야 한다.";
  renderProgress();
}

function updateObjective() {
  if (!state.spokenUncle) {
    ui.objective.textContent = "문구점 아저씨에게 사탕 게임 규칙을 물어보자.";
  } else if (state.inspectedCards.size < gameCards.length) {
    ui.objective.textContent = `세 가지 게임 카드를 직접 확인하자. (${state.inspectedCards.size}/${gameCards.length})`;
  } else if (!state.fairnessChecked) {
    ui.objective.textContent = "공정한 도구 안내판을 확인해 전체 경우를 계산할 근거를 모으자.";
  } else if (!state.spokenKids) {
    ui.objective.textContent = "아이들에게 말을 걸어 왜 도움이 필요한지 확인하자.";
  } else {
    ui.objective.textContent = "사탕 게임 선택대에서 가능성을 수치화해 가장 유리한 상황을 고르자.";
  }
  renderProgress();
}

function getRequiredCount() {
  return 6;
}

function getCollectedCount() {
  return Number(state.spokenUncle) + Number(state.spokenKids) + Number(state.fairnessChecked) + state.inspectedCards.size;
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
  drawStreet();
  drawSchoolGate();
  drawStationeryShop();
  drawCandyGameTable(now);
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

function drawStreet() {
  ctx.fillStyle = "#dcecc7";
  ctx.fillRect(0, height * 0.5, width, height * 0.5);
  ctx.fillStyle = "#e8cf99";
  ctx.beginPath();
  ctx.moveTo(width * 0.15, height * 0.58);
  ctx.quadraticCurveTo(width * 0.52, height * 0.78, width * 0.78, height);
  ctx.lineTo(width, height);
  ctx.lineTo(width, height * 0.78);
  ctx.quadraticCurveTo(width * 0.58, height * 0.64, width * 0.2, height * 0.52);
  ctx.closePath();
  ctx.fill();
}

function drawSchoolGate() {
  const x = width * 0.18;
  const y = height * 0.47;
  if (assetManager.draw(ctx, "buildings.schoolBuilding", { x, y, height: Math.min(255, height * 0.35), anchorX: 0.5, anchorY: 1, alpha: 0.82 })) return;
  ctx.save();
  ctx.translate(width * 0.07, height * 0.34);
  ctx.fillStyle = "rgba(255,255,255,.74)";
  ctx.fillRect(0, 32, 210, 112);
  ctx.fillStyle = "#ffbd73";
  ctx.beginPath();
  ctx.moveTo(-8, 32);
  ctx.lineTo(105, -28);
  ctx.lineTo(218, 32);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStationeryShop() {
  const x = width * 0.42;
  const y = height * 0.59;
  if (assetManager.draw(ctx, "buildings.stationeryStore", { x, y, height: Math.min(320, height * 0.44), anchorX: 0.5, anchorY: 1 })) return;
  ctx.save();
  ctx.translate(width * 0.42, height * 0.36);
  ctx.fillStyle = "#fff8df";
  ctx.strokeStyle = "rgba(35,65,86,.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-155, -18, 310, 190, 18);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCandyGameTable(now) {
  const x = choiceBoard.x * width;
  const y = choiceBoard.y * height;
  const glow = 0.5 + Math.sin(now / 300) * 0.12;
  ctx.fillStyle = `rgba(255, 123, 168, ${0.08 + glow * 0.08})`;
  ctx.beginPath();
  ctx.ellipse(x, y + 72, 150, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  if (assetManager.draw(ctx, "props.candyGameTable", { x, y: y + 110, width: 330, anchorX: 0.5, anchorY: 1 })) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#8a5a35";
  ctx.fillRect(-145, 52, 290, 18);
  ctx.fillRect(-120, 66, 18, 70);
  ctx.fillRect(104, 66, 18, 70);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(-132, -18, 264, 78, 16);
  ctx.fill();
  ctx.restore();
}

function drawWorldObjects(now) {
  drawUncle(uncle.x * width, uncle.y * height);
  drawFairnessSign(fairnessSign.x * width, fairnessSign.y * height);
  for (const card of gameCards) drawGameCard(card);
  drawKids(now);
}

function drawUncle(x, y) {
  ctx.fillStyle = "rgba(35,65,86,.13)";
  ctx.beginPath();
  ctx.ellipse(x, y + 49, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (assetManager.draw(ctx, "characters.stationeryStoreOwner", { x, y: y + 54, height: 150, anchorX: 0.5, anchorY: 1 })) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f0ba91";
  ctx.beginPath();
  ctx.arc(0, -28, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6d4b35";
  ctx.beginPath();
  ctx.arc(0, -36, 19, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffb35b";
  ctx.beginPath();
  ctx.roundRect(-17, -10, 34, 50, 10);
  ctx.fill();
  ctx.restore();
}

function drawKids(now) {
  const positions = state.resolving
    ? getResolutionKidPositions()
    : [[0.18, 0.83], [0.43, 0.88], [0.72, 0.83], [0.92, 0.88]];
  positions.forEach(([px, py], index) => {
    const girl = index === 1 || index === 3;
    drawChild(px * width, py * height + Math.sin(now / 250 + index) * 1.4, girl, index);
  });
}

function getResolutionKidPositions() {
  const progress = easeOutCubic(state.resolutionProgress);
  const start = [[0.18, 0.83], [0.43, 0.88], [0.72, 0.83], [0.92, 0.88]];
  const target = gameCards[2];
  return start.map(([sx, sy], index) => [
    lerp(sx, target.x - 0.12 + index * 0.08, progress),
    lerp(sy, target.y + 0.16 + (index % 2) * 0.03, progress)
  ]);
}

function drawChild(x, y, girl, index) {
  ctx.fillStyle = "rgba(35,65,86,.12)";
  ctx.beginPath();
  ctx.ellipse(x, y + 42, 21, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  const key = girl ? "characters.elementaryGirl" : "characters.elementaryBoy";
  const height = (girl ? 108 : 114) + [0, 4, -3, 3][index % 4];
  if (assetManager.draw(ctx, key, { x, y: y + 45, height, anchorX: 0.5, anchorY: 1, flipX: index % 2 === 1 })) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f4c7a8";
  ctx.beginPath();
  ctx.arc(0, -27, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = girl ? "#ff7ba8" : "#69a7ff";
  ctx.beginPath();
  ctx.roundRect(-13, -11, 26, 42, 10);
  ctx.fill();
  ctx.restore();
}

function drawKidMood() {
  // Mood marks were removed so students stay visually clean on the map.
}

function drawFairnessSign(x, y) {
  ctx.fillStyle = "rgba(35,65,86,.13)";
  ctx.beginPath();
  ctx.ellipse(x, y + 58, 34, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (assetManager.draw(ctx, "props.gameGuideEasel", { x, y: y + 76, height: 142, anchorX: 0.5, anchorY: 1 })) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#8a5a35";
  ctx.fillRect(-5, 20, 10, 78);
  ctx.fillStyle = "#f4fff6";
  ctx.strokeStyle = "#2da85a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-54, -30, 108, 58, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGameCard(card) {
  const x = card.x * width;
  const y = card.y * height;
  const known = state.inspectedCards.has(card.id);
  const tableKey = card.gameId === 1 ? "props.cardGameTable" : card.gameId === 2 ? "props.coinGameTable" : "props.diceGameTable";
  const tableWidth = Math.min(138, Math.max(86, width * 0.108));
  ctx.fillStyle = known ? "rgba(45,168,90,.16)" : "rgba(35,65,86,.1)";
  ctx.beginPath();
  ctx.ellipse(x, y + 58, tableWidth * 0.34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  if (assetManager.draw(ctx, tableKey, { x, y: y + 76, width: tableWidth, anchorX: 0.5, anchorY: 1, alpha: known ? 1 : 0.96 })) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = known ? "#fff0f5" : "#fff8df";
  ctx.strokeStyle = known ? "#ff7ba8" : "#ffd166";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-38, -54, 76, 96, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#234156";
  ctx.font = "950 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(String(card.gameId), 0, -14);
  ctx.restore();
}

function drawWH() {
  const x = state.player.x * width;
  const y = state.player.y * height;
  ctx.fillStyle = "rgba(35,65,86,.16)";
  ctx.beginPath();
  ctx.ellipse(x, y + 5, 27, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (assetManager.draw(ctx, "characters.wh", { x, y: y + 8, height: 150, anchorX: 0.5, anchorY: 1 })) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.92, 0.92);
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
