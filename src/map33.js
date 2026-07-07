import { DIRECTION_LABELS, checkEscapePlan, createSimilarityRun, getActualRoute, getRoutePoints, getScaleDenominator } from "./similarity-route-data.mjs";

const canvas = document.querySelector("#map33-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map33-hud"),
  objective: document.querySelector("#map33-objective"),
  count: document.querySelector("#route-count"),
  start: document.querySelector("#map33-start"),
  startButton: document.querySelector("#map33-start-button"),
  puzzle: document.querySelector("#map33-puzzle"),
  difficulty: document.querySelector("#route-difficulty"),
  number: document.querySelector("#route-number"),
  slots: document.querySelector("#route-slots"),
  title: document.querySelector("#route-title"),
  map: document.querySelector("#escape-map"),
  note: document.querySelector("#route-note"),
  form: document.querySelector("#route-form"),
  scaleInput: document.querySelector("#scale-ratio-input"),
  segmentInputs: document.querySelector("#route-segment-inputs"),
  submit: document.querySelector("#route-submit"),
  feedback: document.querySelector("#map33-feedback"),
  complete: document.querySelector("#map33-complete"),
  replay: document.querySelector("#map33-replay"),
  next: document.querySelector("#map33-next")
};

const difficultyLabels = { easy: "기초 축척", medium: "응용 이동", hard: "정밀 닮음" };
const makeState = () => ({ run: createSimilarityRun(), index: 0, locked: false, doorProgress: 0, lastTime: performance.now() });
let state = makeState();
let width = 1280;
let height = 720;

resize();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
ui.startButton.addEventListener("click", startGame);
ui.form.addEventListener("submit", submitPlan);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href = "./3map4.html"; });

function startGame() {
  ui.start.classList.add("is-hidden");
  ui.hud.classList.remove("is-hidden");
  ui.puzzle.classList.remove("is-hidden");
  renderPuzzle();
}

function resetGame() {
  state = makeState();
  ui.complete.classList.add("is-hidden");
  ui.puzzle.classList.add("is-hidden");
  ui.hud.classList.add("is-hidden");
  ui.start.classList.remove("is-hidden");
  ui.objective.textContent = "축척 지도 3장을 해석해 실제 이동 계획을 세우자.";
  renderProgress();
}

function renderPuzzle() {
  const puzzle = state.run[state.index];
  state.locked = false;
  ui.difficulty.textContent = difficultyLabels[puzzle.difficulty];
  ui.number.textContent = String(state.index + 1);
  ui.title.textContent = puzzle.title;
  ui.note.textContent = puzzle.roomNote;
  ui.map.innerHTML = renderEscapeMap(puzzle);
  ui.form.reset();
  ui.form.classList.remove("is-wrong");
  ui.scaleInput.disabled = false;
  ui.submit.disabled = false;
  renderSegmentFields(puzzle);
  ui.feedback.textContent = "지도에서 각 선분이 몇 칸인지 세고, 왼쪽 아래의 축척을 이용해 실제 m를 구하세요.";
  ui.feedback.className = "route-feedback";
  renderProgress();
  requestAnimationFrame(() => ui.scaleInput.focus());
}

function renderSegmentFields(puzzle) {
  const actualRoute = getActualRoute(puzzle);
  ui.segmentInputs.innerHTML = puzzle.segments.map((segment, index) => `
    <label class="route-segment-field">
      <span>${index + 1}번째 이동 계획</span>
      <span class="route-segment-controls">
        <select name="direction-${index + 1}" data-segment-direction="${index}" required>
          <option value="">방향 선택</option>
          ${Object.entries(DIRECTION_LABELS).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
        </select>
        <span class="number-with-unit"><input name="distance-${index + 1}" data-segment-distance="${index}" type="number" min="0" step="0.1" inputmode="decimal" autocomplete="off" required/><b>m</b></span>
      </span>
      <small class="route-segment-hint">지도에서 이 선분이 몇 칸인지 직접 세어 보세요.</small>
    </label>
  `).join("");
  ui.segmentInputs.querySelectorAll("select,input").forEach((field) => {
    field.disabled = false;
    field.setAttribute("aria-label", field.matches("select") ? "이동 방향" : "실제 이동 거리");
  });
  ui.segmentInputs.dataset.answerCount = String(actualRoute.length);
}

function submitPlan(event) {
  event.preventDefault();
  if (state.locked) return;
  const puzzle = state.run[state.index];
  const submittedSegments = puzzle.segments.map((_, index) => ({
    direction: ui.segmentInputs.querySelector(`[data-segment-direction="${index}"]`)?.value ?? "",
    distanceM: ui.segmentInputs.querySelector(`[data-segment-distance="${index}"]`)?.value ?? ""
  }));
  const missing = ui.scaleInput.value.trim() === "" || submittedSegments.some((segment) => segment.direction === "" || String(segment.distanceM).trim() === "");
  if (missing) {
    showError("닮음비와 모든 이동 계획을 빠짐없이 입력해야 해.");
    return;
  }
  const result = checkEscapePlan(puzzle, ui.scaleInput.value, submittedSegments);
  if (!result.correct) {
    if (!result.scaleCorrect) {
      showError(`축척부터 다시 보자. 1:${formatNumber(getScaleDenominator(puzzle))}은 지도 1 cm가 실제 ${formatNumber(getScaleDenominator(puzzle))} cm라는 뜻이야. m로 바꾸어 입력해 봐.`);
    } else if (!result.directionCorrect) {
      showError("거리 계산은 거의 됐어. 청록색 경로의 화살표 순서를 따라 동쪽·서쪽·북쪽·남쪽 방향을 다시 확인해 봐.");
    } else {
      showError("방향은 맞았어. 선분마다 격자 칸 수를 다시 세고, 축척으로 실제 m를 계산해 봐.");
    }
    return;
  }
  state.locked = true;
  ui.scaleInput.disabled = true;
  ui.segmentInputs.querySelectorAll("select,input").forEach((field) => { field.disabled = true; });
  ui.submit.disabled = true;
  ui.feedback.textContent = `인증 성공. 지도 1 cm는 실제 ${formatNumber(result.answer.metersPerCm)} m, 이동 계획은 ${formatRoute(result.answer.segments)}이야.`;
  ui.feedback.className = "route-feedback is-success";
  state.index += 1;
  renderProgress();
  if (state.index >= state.run.length) setTimeout(completeMap, 950);
  else setTimeout(renderPuzzle, 950);
}

function showError(message) {
  ui.feedback.textContent = message;
  ui.feedback.className = "route-feedback is-error";
  ui.form.classList.remove("is-wrong");
  void ui.form.offsetWidth;
  ui.form.classList.add("is-wrong");
}

function renderProgress() {
  ui.count.textContent = `${state.index} / 3`;
  [...ui.slots.children].forEach((slot, index) => slot.classList.toggle("is-filled", index < state.index));
}

function completeMap() {
  ui.puzzle.classList.add("is-hidden");
  state.doorProgress = 0.01;
  ui.objective.textContent = "탈출 계획 인증 완료. 지도대로 움직여 다음 격실로 나가자.";
  setTimeout(() => {
    ui.hud.classList.add("is-hidden");
    ui.complete.classList.remove("is-hidden");
    ui.replay.focus();
  }, 1050);
}

function renderEscapeMap(puzzle) {
  const activePoints = getRoutePoints(puzzle);
  const activePath = pointsToPath(activePoints);
  const grid = renderGrid(puzzle.widthCm, puzzle.heightCm);
  const hazards = puzzle.hazards.map((hazard) => `
    <rect class="hazard-zone" x="${hazard.x}" y="${hazard.y}" width="${hazard.width}" height="${hazard.height}" rx=".1"/>
    <text class="hazard-label" x="${hazard.x + hazard.width / 2}" y="${hazard.y + hazard.height / 2 + 0.08}" text-anchor="middle">${hazard.label}</text>
  `).join("");
  const [start] = activePoints;
  const exit = activePoints.at(-1);
  return `
    <svg viewBox="-0.45 -0.45 ${puzzle.widthCm + 0.9} ${puzzle.heightCm + 0.9}" role="img" aria-label="${puzzle.title} 축척 지도">
      ${grid}
      ${hazards}
      <path class="route-path-active" d="${activePath}"/>
      <circle class="route-marker" cx="${start.x}" cy="${start.y}" r=".22"/><text class="segment-label" x="${start.x}" y="${start.y + .55}" text-anchor="middle">WH</text>
      <circle class="exit-marker" cx="${exit.x}" cy="${exit.y}" r=".25"/><text class="segment-label" x="${exit.x}" y="${exit.y - .4}" text-anchor="middle">출구</text>
      <text class="map-scale-label" x=".18" y="${puzzle.heightCm - .18}">1:${formatNumber(getScaleDenominator(puzzle))}</text>
      <text class="map-caption" x="${puzzle.widthCm / 2}" y="${puzzle.heightCm + .32}" text-anchor="middle">1칸 = 지도 1 cm · 아래쪽이 남쪽</text>
    </svg>
  `;
}

function renderGrid(columns, rows) {
  let lines = "";
  for (let x = 0; x <= columns; x += 1) lines += `<line class="map-grid-line" x1="${x}" y1="0" x2="${x}" y2="${rows}"/>`;
  for (let y = 0; y <= rows; y += 1) lines += `<line class="map-grid-line" x1="0" y1="${y}" x2="${columns}" y2="${y}"/>`;
  lines += `<text class="map-grid-label" x="${columns - 0.1}" y="-.12" text-anchor="end">동</text>`;
  lines += `<text class="map-grid-label" x=".1" y="-.12">서</text>`;
  lines += `<text class="map-grid-label" x="${columns + .12}" y=".28">북</text>`;
  lines += `<text class="map-grid-label" x="${columns + .12}" y="${rows - .1}">남</text>`;
  return lines;
}

function pointsToPath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

function formatNumber(value) {
  return Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function formatRoute(segments) {
  return segments.map((segment, index) => `${index + 1}번째 ${segment.label} ${formatNumber(segment.realM)} m`).join(", ");
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
  gradient.addColorStop(0, "#16142d");
  gradient.addColorStop(1, "#060710");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  drawPerspectiveGrid(now);
  drawProjectedMap(now);
  drawExitDoor();
  drawWH(now);
}

function drawPerspectiveGrid(now) {
  ctx.strokeStyle = "rgba(140,125,255,.2)";
  ctx.lineWidth = 1;
  const centerX = width * 0.5;
  const horizon = height * 0.42;
  for (let x = -80; x <= width + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(centerX, horizon);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = horizon; y < height; y += 54) {
    const wave = Math.sin(now / 600 + y * 0.02) * 2;
    ctx.beginPath();
    ctx.moveTo(0, y + wave);
    ctx.lineTo(width, y - wave);
    ctx.stroke();
  }
}

function drawProjectedMap(now) {
  const mapW = Math.min(430, width * 0.38);
  const mapH = mapW * 0.62;
  const x = width * 0.5 - mapW / 2;
  const y = height * 0.19 + Math.sin(now / 700) * 5;
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "rgba(10,12,28,.75)";
  ctx.strokeStyle = "rgba(120,239,226,.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, mapW, mapH, 18);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(120,239,226,.18)";
  for (let gx = x + 24; gx < x + mapW; gx += 34) {
    ctx.beginPath();
    ctx.moveTo(gx, y + 14);
    ctx.lineTo(gx, y + mapH - 14);
    ctx.stroke();
  }
  for (let gy = y + 24; gy < y + mapH; gy += 34) {
    ctx.beginPath();
    ctx.moveTo(x + 14, gy);
    ctx.lineTo(x + mapW - 14, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = "#78efe2";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + mapW * 0.27, y + mapH * 0.72);
  ctx.lineTo(x + mapW * 0.52, y + mapH * 0.72);
  ctx.lineTo(x + mapW * 0.52, y + mapH * 0.43);
  ctx.lineTo(x + mapW * 0.76, y + mapH * 0.43);
  ctx.stroke();
  ctx.restore();
}

function drawExitDoor() {
  const progress = state.doorProgress;
  const doorW = 150;
  const doorH = 250;
  const x = width * 0.79;
  const y = height * 0.36;
  ctx.save();
  ctx.fillStyle = "#0b0c18";
  ctx.strokeStyle = "#4a4479";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - doorW / 2, y, doorW, doorH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(120,239,226,${0.08 + progress * 0.42})`;
  ctx.fillRect(x - doorW / 2 + 16, y + 16, doorW - 32, doorH - 32 - progress * 110);
  ctx.fillStyle = "#ff7897";
  ctx.beginPath();
  ctx.arc(x + doorW * 0.28, y + doorH * 0.52, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWH(now) {
  const move = state.doorProgress;
  const x = width * (0.42 + move * 0.22);
  const y = height * 0.79 - Math.sin(now / 180) * 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.92, 0.92);
  ctx.fillStyle = "#4f45b6";
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
