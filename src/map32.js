import { checkProjectionAnswer, createProjectionRun, getOrthographicViews, getStructureAnswers } from "./orthographic-data.mjs";

const canvas = document.querySelector("#map32-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map32-hud"),
  objective: document.querySelector("#map32-objective"),
  scanCount: document.querySelector("#scan-count"),
  start: document.querySelector("#map32-start"),
  startButton: document.querySelector("#map32-start-button"),
  puzzle: document.querySelector("#map32-puzzle"),
  difficulty: document.querySelector("#projection-difficulty"),
  number: document.querySelector("#projection-number"),
  slots: document.querySelector("#projection-slots"),
  structureTitle: document.querySelector("#structure-title"),
  views: document.querySelector("#projection-views"),
  form: document.querySelector("#projection-form"),
  totalLayers: document.querySelector("#total-layers-input"),
  secondLayer: document.querySelector("#second-layer-input"),
  submit: document.querySelector("#projection-submit"),
  feedback: document.querySelector("#map32-feedback"),
  complete: document.querySelector("#map32-complete"),
  replay: document.querySelector("#map32-replay"),
  next: document.querySelector("#map32-next")
};

const makeState = () => ({ run: createProjectionRun(), index: 0, locked: false, doorProgress: 0, lastTime: performance.now() });
let state = makeState();
let width = 1280;
let height = 720;

resize();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
ui.startButton.addEventListener("click", startGame);
ui.form.addEventListener("submit", submitAnswer);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href="./3map3.html"; });

function startGame() {
  ui.start.classList.add("is-hidden");
  ui.hud.classList.remove("is-hidden");
  ui.puzzle.classList.remove("is-hidden");
  renderQuestion();
}

function resetGame() {
  state = makeState();
  ui.complete.classList.add("is-hidden");
  ui.puzzle.classList.add("is-hidden");
  ui.hud.classList.add("is-hidden");
  ui.start.classList.remove("is-hidden");
  renderProgress();
}

function renderQuestion() {
  const question = state.run[state.index];
  const views = getOrthographicViews(question.heights);
  const answer = getStructureAnswers(question.heights);
  const difficultyLabels = { easy: "기초 판독", medium: "응용 판독", hard: "정밀 판독" };
  state.locked = false;
  ui.difficulty.textContent = difficultyLabels[question.difficulty];
  ui.number.textContent = String(state.index + 1);
  ui.structureTitle.textContent = `구조물 ${String.fromCharCode(65 + state.index)} · ${question.title}`;
  ui.views.innerHTML = [
    projectionCard("평면도", "위에서 본 모양 · 아래쪽이 앞", renderTopView(views.top)),
    projectionCard("정면도", "앞에서 본 모양 · 왼쪽→오른쪽", renderElevation(views.front, answer.totalLayers, "왼쪽", "오른쪽")),
    projectionCard("우측면도", "오른쪽에서 본 모양 · 앞→뒤", renderElevation(views.right, answer.totalLayers, "앞", "뒤")),
    projectionCard("좌측면도", "왼쪽에서 본 모양 · 뒤→앞", renderElevation(views.left, answer.totalLayers, "뒤", "앞"))
  ].join("");
  ui.form.reset();
  ui.form.classList.remove("is-wrong");
  ui.totalLayers.disabled = false;
  ui.secondLayer.disabled = false;
  ui.submit.disabled = false;
  ui.feedback.textContent = "네 도면의 같은 위치와 높이를 대응시켜 보세요.";
  ui.feedback.className = "projection-feedback";
  renderProgress();
  requestAnimationFrame(() => ui.totalLayers.focus());
}

function projectionCard(title, description, svg) {
  return `<article class="view-card"><header><h3>${title}</h3><span>${description}</span></header>${svg}</article>`;
}

function renderTopView(top) {
  const cell = 22, padX = 12, padTop = 10, padBottom = 22;
  const rows = top.length, columns = top[0].length;
  const viewWidth = columns * cell + padX * 2, viewHeight = rows * cell + padTop + padBottom;
  let cells = "";
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const displayRow = rows - 1 - row;
      cells += `<rect class="projection-grid-cell${top[row][column] ? " is-filled" : ""}" x="${padX + column * cell}" y="${padTop + displayRow * cell}" width="${cell}" height="${cell}"/>`;
    }
  }
  return `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" role="img" aria-label="위에서 본 평면도">${cells}<text class="projection-axis" x="${viewWidth / 2}" y="${viewHeight - 5}" text-anchor="middle">▼ 앞쪽</text></svg>`;
}

function renderElevation(profile, totalLayers, leftLabel, rightLabel) {
  const cell = 22, padX = 12, padTop = 10, padBottom = 22;
  const viewWidth = profile.length * cell + padX * 2, viewHeight = totalLayers * cell + padTop + padBottom;
  let cells = "";
  for (let column = 0; column < profile.length; column += 1) {
    for (let layer = 1; layer <= totalLayers; layer += 1) {
      const y = padTop + (totalLayers - layer) * cell;
      cells += `<rect class="projection-grid-cell${layer <= profile[column] ? " is-filled" : ""}" x="${padX + column * cell}" y="${y}" width="${cell}" height="${cell}"/>`;
    }
  }
  return `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" role="img" aria-label="${leftLabel}에서 ${rightLabel} 방향으로 읽는 투상도">${cells}<text class="projection-axis" x="${padX}" y="${viewHeight - 5}">${leftLabel}</text><text class="projection-axis" x="${viewWidth - padX}" y="${viewHeight - 5}" text-anchor="end">${rightLabel}</text></svg>`;
}

function submitAnswer(event) {
  event.preventDefault();
  if (state.locked) return;
  const total = ui.totalLayers.value.trim();
  const second = ui.secondLayer.value.trim();
  if (total === "" || second === "") {
    showError("두 답을 모두 숫자로 입력해야 하중 정보를 전송할 수 있어.");
    return;
  }
  const result = checkProjectionAnswer(state.run[state.index], total, second);
  if (!result.correct) {
    if (!result.totalCorrect && !result.secondCorrect) showError("두 값 모두 다시 확인해 봐. 가장 높은 열이 총 층수이고, 높이가 2 이상인 위치마다 2층 정육면체가 1개 있어.");
    else if (!result.totalCorrect) showError("2층 정육면체 수는 맞았어. 정면도와 두 측면도에서 가장 높은 열을 찾아 총 층수를 다시 확인해.");
    else showError("총 층수는 맞았어. 2층 높이에 가로선을 그었다고 생각하고 그 선을 통과하는 기둥 수를 다시 세어 봐.");
    return;
  }
  state.locked = true;
  ui.totalLayers.disabled = true;
  ui.secondLayer.disabled = true;
  ui.submit.disabled = true;
  ui.feedback.textContent = `인증 성공. 총 ${result.answer.totalLayers}층, 2층 정육면체 ${result.answer.secondLayerCubes}개로 하중이 확인됐어.`;
  ui.feedback.className = "projection-feedback is-success";
  state.index += 1;
  renderProgress();
  if (state.index >= state.run.length) setTimeout(completeMap, 900);
  else setTimeout(renderQuestion, 900);
}

function showError(message) {
  ui.feedback.textContent = message;
  ui.feedback.className = "projection-feedback is-error";
  ui.form.classList.remove("is-wrong");
  void ui.form.offsetWidth;
  ui.form.classList.add("is-wrong");
}

function renderProgress() {
  ui.scanCount.textContent = `${state.index} / 3`;
  [...ui.slots.children].forEach((slot, index) => slot.classList.toggle("is-filled", index < state.index));
}

function completeMap() {
  ui.puzzle.classList.add("is-hidden");
  state.doorProgress = 0.01;
  ui.objective.textContent = "투상 인증 완료. 상승한 리프트에서 다음 격실로 이동하자.";
  setTimeout(() => {
    ui.hud.classList.add("is-hidden");
    ui.complete.classList.remove("is-hidden");
    ui.replay.focus();
  }, 1050);
}

function loop(now) {
  const dt = Math.min(0.034, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;
  if (state.doorProgress > 0) state.doorProgress = Math.min(1, state.doorProgress + dt * 0.85);
  drawRoom(now);
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

function drawRoom(now) {
  const density = Math.min(2, devicePixelRatio || 1);
  ctx.setTransform(density, 0, 0, density, 0, 0);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#10202b");
  gradient.addColorStop(1, "#05080d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(77,126,140,.28)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 80) { ctx.beginPath(); ctx.moveTo(width / 2, height * 0.42); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = height * 0.48; y < height; y += 55) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  const pulse = 0.18 + Math.sin(now / 450) * 0.05;
  [[width * 0.13, height * 0.34], [width * 0.87, height * 0.34], [width * 0.5, height * 0.11], [width * 0.5, height * 0.62]].forEach(([x, y]) => {
    const beam = ctx.createRadialGradient(x, y, 3, x, y, 110);
    beam.addColorStop(0, `rgba(91,220,210,${pulse})`);
    beam.addColorStop(1, "rgba(91,220,210,0)");
    ctx.fillStyle = beam;
    ctx.fillRect(x - 110, y - 110, 220, 220);
  });
  drawLift();
  drawWH();
}

function drawLift() {
  const liftY = height * (0.67 - state.doorProgress * 0.11);
  ctx.fillStyle = "#132a34";
  ctx.beginPath();
  ctx.moveTo(width * 0.35, liftY);
  ctx.lineTo(width * 0.65, liftY);
  ctx.lineTo(width * 0.72, liftY + 80);
  ctx.lineTo(width * 0.28, liftY + 80);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#4f8f95";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawWH() {
  const x = width * 0.5, y = height * 0.76 - state.doorProgress * height * 0.11;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#1b9189";
  ctx.beginPath();
  ctx.roundRect(-21, -72, 42, 54, 13);
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
