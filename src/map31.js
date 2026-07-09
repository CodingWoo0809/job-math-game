import { advanceStreak, buildOptions, createChallengeSession } from "./solid-net-data.mjs";
import { renderNetVisual, renderSightDrawing } from "./solid-visuals.mjs";
import { drawFutureTransitionRoom, ensureChapter3RoomAssets } from "./chapter3-room-visuals.mjs";

const canvas = document.querySelector("#map31-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map31-hud"),
  objective: document.querySelector("#map31-objective"),
  streakCount: document.querySelector("#streak-count"),
  start: document.querySelector("#map31-start"),
  startButton: document.querySelector("#map31-start-button"),
  puzzle: document.querySelector("#map31-puzzle"),
  questionNumber: document.querySelector("#question-number"),
  slots: document.querySelector("#streak-slots"),
  net: document.querySelector("#net-svg"),
  options: document.querySelector("#solid-options"),
  feedback: document.querySelector("#map31-feedback"),
  bankLeft: document.querySelector("#bank-left"),
  complete: document.querySelector("#map31-complete"),
  replay: document.querySelector("#map31-replay"),
  next: document.querySelector("#map31-next")
};
const makeState = () => {
  const challengeSession = createChallengeSession();
  return {
    started: false,
    challengeSession,
    questions: challengeSession.nextSet(),
    current: null,
    options: [],
    streak: 0,
    locked: false,
    doorProgress: 0,
    completed: false,
    lastTime: performance.now()
  };
};
let state = makeState();
let width = 1280;
let height = 720;

ensureChapter3RoomAssets();
resize();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
ui.startButton.addEventListener("click", startGame);
ui.options.addEventListener("click", chooseOption);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href="./3map2.html"; });

function startGame() {
  state.started = true;
  state.lastTime = performance.now();
  ui.start.classList.add("is-hidden");
  ui.hud.classList.remove("is-hidden");
  ui.puzzle.classList.remove("is-hidden");
  nextQuestion();
}

function resetGame() {
  state = makeState();
  ui.puzzle.classList.add("is-hidden");
  ui.complete.classList.add("is-hidden");
  ui.hud.classList.add("is-hidden");
  ui.start.classList.remove("is-hidden");
  ui.feedback.textContent = "선택지의 면 모양과 개수를 전개도와 비교해.";
  ui.feedback.className = "scanner-feedback";
  renderProgress();
}

function nextQuestion() {
  state.current = state.questions[state.streak];
  state.options = buildOptions(state.current.solid, state.current.difficulty);
  if (state.options.filter((type) => type === state.current.solid).length !== 1) throw new Error("정답 겨냥도는 보기에 정확히 하나 있어야 합니다.");
  state.locked = false;
  ui.questionNumber.textContent = String(state.streak + 1);
  const labels = { easy: "쉬움", medium: "생각", hard: "고난도" };
  ui.bankLeft.textContent = `난이도 ${labels[state.current.difficulty]} · ${state.streak + 1}/5`;
  ui.feedback.textContent = state.streak ? `연속 ${state.streak}문제 성공. 다음 전개도를 판별해.` : "전개도의 모든 면이 어떤 입체로 접히는지 생각해.";
  ui.feedback.className = "scanner-feedback";
  renderNet(state.current);
  renderOptions();
  renderProgress();
}

function chooseOption(event) {
  const button = event.target.closest("[data-solid]");
  if (!button || state.locked) return;
  state.locked = true;
  const correct = button.dataset.solid === state.current.solid;
  const result = advanceStreak(state.streak, correct);
  state.streak = result.streak;
  if (correct) {
    button.classList.add("is-correct");
    ui.feedback.textContent = result.complete ? "연속 5회 인증 완료. 격실 잠금이 해제된다!" : `정답. 연속 ${state.streak}회 인증 성공.`;
    ui.feedback.className = "scanner-feedback is-success";
  } else {
    button.classList.add("is-wrong");
    ui.feedback.textContent = "오답. 연속 기록이 초기화되었어. 새로운 쉬운 1번 문제부터 다시 시작한다.";
    ui.feedback.className = "scanner-feedback is-error";
    state.questions = state.challengeSession.nextSet();
  }
  renderProgress();
  if (result.complete) {
    state.completed = true;
    ui.objective.textContent = "인증 완료. 열리는 문으로 이동하자.";
    setTimeout(unlockRoom, 850);
  } else {
    setTimeout(nextQuestion, 1000);
  }
}

function unlockRoom() {
  ui.puzzle.classList.add("is-hidden");
  state.doorProgress = 0.01;
  setTimeout(() => {
    ui.hud.classList.add("is-hidden");
    ui.complete.classList.remove("is-hidden");
    ui.replay.focus();
  }, 1250);
}

function renderProgress() {
  ui.streakCount.textContent = `${state.streak} / 5`;
  [...ui.slots.children].forEach((slot, index) => slot.classList.toggle("is-filled", index < state.streak));
}

function renderOptions() {
  ui.options.innerHTML = state.options.map((type, index) => `<button class="solid-option" type="button" data-solid="${type}" aria-label="${index + 1}번 겨냥도"><b>${String.fromCharCode(65 + index)}</b><svg viewBox="0 0 180 130" aria-hidden="true">${renderSightDrawing(type)}</svg></button>`).join("");
}

function renderNet(question) {
  ui.net.innerHTML = renderNetVisual(question.solid, question.variant, question.accent);
}

function loop(now) {
  const dt = Math.min(0.034, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;
  if (state.doorProgress > 0) state.doorProgress = Math.min(1, state.doorProgress + dt * 0.8);
  draw(now);
  requestAnimationFrame(loop);
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

function draw(now) {
  const density = Math.min(2, devicePixelRatio || 1);
  ctx.setTransform(density, 0, 0, density, 0, 0);
  drawFutureTransitionRoom(ctx, {
    width,
    height,
    now,
    doorProgress: state.doorProgress,
    whXRatio: 0.5,
    whYRatio: 0.8,
    whHeight: 158,
    doorXRatio: 0.5,
    doorHeightRatio: 0.58
  });
}

function drawDoor() {
  const centerX = width * 0.5;
  const doorWidth = Math.min(230, width * 0.22);
  const top = height * 0.22;
  const bottom = height * 0.68;
  const open = state.doorProgress;
  ctx.fillStyle = "#162832";
  ctx.fillRect(centerX - doorWidth / 2, top, doorWidth, bottom - top);
  ctx.fillStyle = "#071018";
  ctx.fillRect(centerX - doorWidth / 2 + open * doorWidth / 2, top, Math.max(0, doorWidth - open * doorWidth), bottom - top);
  ctx.strokeStyle = "#4b8790";
  ctx.lineWidth = 3;
  ctx.strokeRect(centerX - doorWidth / 2, top, doorWidth, bottom - top);
  ctx.fillStyle = state.completed ? "#65d7c6" : "#d09b4f";
  ctx.beginPath();
  ctx.arc(centerX + doorWidth * 0.35, top + 35, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoomWH() {
  const x = width * 0.5;
  const y = height * 0.8;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#1b8f88";
  ctx.beginPath();
  ctx.roundRect(-22, -78, 44, 58, 14);
  ctx.fill();
  ctx.fillStyle = "#efc3a9";
  ctx.beginPath();
  ctx.arc(0, -101, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#17223b";
  ctx.beginPath();
  ctx.arc(0, -110, 26, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("WH", 0, -43);
  ctx.restore();
}
