import { checkPlaneStageAnswer, createPlaneGeometryRun, getDieSquares } from "./plane-geometry-data.mjs";

const canvas = document.querySelector("#map34-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map34-hud"),
  objective: document.querySelector("#map34-objective"),
  count: document.querySelector("#fabrication-count"),
  start: document.querySelector("#map34-start"),
  startButton: document.querySelector("#map34-start-button"),
  puzzle: document.querySelector("#map34-puzzle"),
  difficulty: document.querySelector("#fabrication-difficulty"),
  number: document.querySelector("#fabrication-number"),
  slots: document.querySelector("#fabrication-slots"),
  title: document.querySelector("#fabrication-title"),
  visual: document.querySelector("#fabrication-visual"),
  note: document.querySelector("#fabrication-note"),
  form: document.querySelector("#fabrication-form"),
  help: document.querySelector("#fabrication-help"),
  fields: document.querySelector("#fabrication-fields"),
  submit: document.querySelector("#fabrication-submit"),
  feedback: document.querySelector("#map34-feedback"),
  complete: document.querySelector("#map34-complete"),
  replay: document.querySelector("#map34-replay"),
  next: document.querySelector("#map34-next")
};

const makeState = () => ({ run: createPlaneGeometryRun(), index: 0, locked: false, cutterProgress: 0, lastTime: performance.now() });
let state = makeState();
let width = 1280;
let height = 720;

resize();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
ui.startButton.addEventListener("click", startGame);
ui.form.addEventListener("submit", submitFabrication);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href = "./3map5.html"; });

function startGame() {
  ui.start.classList.add("is-hidden");
  ui.hud.classList.remove("is-hidden");
  ui.puzzle.classList.remove("is-hidden");
  renderStage();
}

function resetGame() {
  state = makeState();
  ui.complete.classList.add("is-hidden");
  ui.puzzle.classList.add("is-hidden");
  ui.hud.classList.add("is-hidden");
  ui.start.classList.remove("is-hidden");
  ui.objective.textContent = "평면 부품 5개를 계산해 절단 장치를 통과시키자.";
  renderProgress();
}

function renderStage() {
  const stage = state.run[state.index];
  state.locked = false;
  ui.difficulty.textContent = stage.difficulty;
  ui.number.textContent = String(state.index + 1);
  ui.title.textContent = stage.title;
  ui.note.textContent = stage.note;
  ui.help.textContent = stage.help;
  ui.visual.innerHTML = renderStageVisual(stage);
  ui.form.reset();
  ui.form.classList.remove("is-wrong");
  ui.fields.innerHTML = stage.fields.map((field) => `
    <label class="fabrication-field">
      <span>${field.label}</span>
      <span class="number-with-unit"><input name="${field.key}" data-fabrication-field="${field.key}" type="number" min="0" step="${field.step}" inputmode="decimal" autocomplete="off" required/><b>${field.unit}</b></span>
    </label>
  `).join("");
  ui.fields.querySelectorAll("input").forEach((input) => { input.disabled = false; });
  ui.submit.disabled = false;
  ui.feedback.textContent = "π는 그대로 두고, 필요한 경우 π 앞의 수만 입력하세요.";
  ui.feedback.className = "fabrication-feedback";
  renderProgress();
  requestAnimationFrame(() => ui.fields.querySelector("input")?.focus());
}

function submitFabrication(event) {
  event.preventDefault();
  if (state.locked) return;
  const stage = state.run[state.index];
  const submitted = Object.fromEntries(stage.fields.map((field) => [field.key, ui.fields.querySelector(`[name="${field.key}"]`)?.value ?? ""]));
  if (stage.fields.some((field) => String(submitted[field.key]).trim() === "")) {
    showError("모든 값을 입력해야 절단 장치가 움직여.");
    return;
  }
  const result = checkPlaneStageAnswer(stage, submitted);
  if (!result.correct) {
    const wrong = result.fieldResults.filter((field) => !field.correct).map((field) => field.label).join(", ");
    showError(`${wrong} 값을 다시 확인해 봐. ${stage.help}`);
    return;
  }
  state.locked = true;
  ui.fields.querySelectorAll("input").forEach((input) => { input.disabled = true; });
  ui.submit.disabled = true;
  ui.feedback.textContent = `인증 성공. ${formatAnswer(stage, result.answer)} 절단 장치가 부품을 정확히 잘라냈어.`;
  ui.feedback.className = "fabrication-feedback is-success";
  state.index += 1;
  state.cutterProgress = Math.max(state.cutterProgress, state.index / state.run.length);
  renderProgress();
  if (state.index >= state.run.length) setTimeout(completeMap, 950);
  else setTimeout(renderStage, 950);
}

function showError(message) {
  ui.feedback.textContent = message;
  ui.feedback.className = "fabrication-feedback is-error";
  ui.form.classList.remove("is-wrong");
  void ui.form.offsetWidth;
  ui.form.classList.add("is-wrong");
}

function renderProgress() {
  if (ui.slots.children.length !== state.run.length) ui.slots.innerHTML = Array.from({ length: state.run.length }, () => "<i></i>").join("");
  ui.count.textContent = `${state.index} / ${state.run.length}`;
  [...ui.slots.children].forEach((slot, index) => slot.classList.toggle("is-filled", index < state.index));
}

function completeMap() {
  ui.puzzle.classList.add("is-hidden");
  ui.objective.textContent = "차폐 부품 제작 완료. 마지막 입체 격실로 이동하자.";
  setTimeout(() => {
    ui.hud.classList.add("is-hidden");
    ui.complete.classList.remove("is-hidden");
    ui.replay.focus();
  }, 900);
}

function renderStageVisual(stage) {
  if (stage.type === "rectangle") return renderRectangleVisual(stage);
  if (stage.type === "circle") return renderCircleVisual(stage);
  if (stage.type === "equilateral") return renderEquilateralVisual(stage);
  if (stage.type === "annulus") return renderAnnulusVisual(stage);
  return renderWaferVisual(stage);
}

function renderRectangleVisual(stage) {
  const { widthCm, heightCm } = stage.givens;
  return `
    <svg viewBox="0 0 10 7" role="img" aria-label="직사각형 실링 패널">
      <rect class="shape-rectangle" x="2" y="1.45" width="6" height="3.5" rx=".08"/>
      <text class="shape-label" x="5" y="1.05" text-anchor="middle">가로 ${widthCm} cm</text>
      <text class="shape-label" x="8.45" y="3.35">세로 ${heightCm} cm</text>
      <text class="shape-sub-label" x="5" y="6.1" text-anchor="middle">테두리 길이와 덮는 넓이를 모두 계산하라</text>
    </svg>
  `;
}

function renderCircleVisual(stage) {
  return `
    <svg viewBox="0 0 10 7" role="img" aria-label="원형 전선 단면">
      <circle class="shape-disc" cx="4.1" cy="3.5" r="2.1"/>
      <line class="shape-radius" x1="4.1" y1="3.5" x2="6.2" y2="3.5"/>
      <text class="shape-label" x="4.1" y="3.55" text-anchor="middle">단면 넓이 ${formatNumber(stage.givens.areaPiMm2)}π mm²</text>
      <text class="shape-sub-label" x="7.25" y="3.4">반지름 ?</text>
      <text class="shape-sub-label" x="4.1" y="6.2" text-anchor="middle">심선을 감쌀 절연 테이프 길이 = 원의 둘레</text>
      <text class="shape-sub-label" x=".55" y=".65">π는 그대로 둔다</text>
    </svg>
  `;
}

function renderAnnulusVisual(stage) {
  const { outerRadiusCm, innerRadiusCm } = stage.givens;
  return `
    <svg viewBox="0 0 10 7" role="img" aria-label="도넛형 차폐 패치">
      <path class="shape-ring" d="M5 3.5 m-2.65 0 a2.65 2.65 0 1 0 5.3 0 a2.65 2.65 0 1 0 -5.3 0 M5 3.5 m-1.45 0 a1.45 1.45 0 1 1 2.9 0 a1.45 1.45 0 1 1 -2.9 0"/>
      <circle class="shape-inner" cx="5" cy="3.5" r="1.45"/>
      <line class="shape-radius" x1="5" y1="3.5" x2="7.65" y2="3.5"/>
      <line class="shape-radius" x1="5" y1="3.5" x2="6.45" y2="3.5"/>
      <text class="shape-label" x="5" y=".75" text-anchor="middle">바깥 반지름 ${outerRadiusCm} cm · 안쪽 반지름 ${innerRadiusCm} cm</text>
      <text class="shape-sub-label" x="5" y="6.25" text-anchor="middle">필요한 재료 넓이와 바깥+안쪽 절단 경계를 구하라</text>
      <text class="shape-sub-label" x=".55" y=".65">π는 그대로 둔다</text>
    </svg>
  `;
}

function renderEquilateralVisual(stage) {
  const { sideCm } = stage.givens;
  return `
    <svg viewBox="0 0 10 7" role="img" aria-label="정삼각형 지지대">
      <path class="shape-triangle" d="M5 1.15 L8.25 5.85 L1.75 5.85 Z"/>
      <line class="shape-height" x1="5" y1="1.15" x2="5" y2="5.85"/>
      <text class="shape-label" x="5" y="6.55" text-anchor="middle">한 변 ${sideCm} cm</text>
      <text class="shape-sub-label" x="5.18" y="3.55">높이 ?</text>
      <text class="shape-sub-label" x=".55" y=".65">√3은 그대로 둔다</text>
    </svg>
  `;
}

function renderWaferVisual(stage) {
  const { radiusCm, dieSideCm, offsetX, offsetY } = stage.givens;
  const squares = getDieSquares(radiusCm, dieSideCm, offsetX, offsetY);
  const scale = 0.72;
  const shift = 5;
  const cells = squares.map((square) => `
    <rect class="die-cell${square.inside ? "" : " partial"}" x="${shift + square.x * scale}" y="${shift + square.y * scale}" width="${dieSideCm * scale}" height="${dieSideCm * scale}"/>
  `).join("");
  return `
    <svg viewBox="0 0 10 10" role="img" aria-label="원형 렌즈 위 정사각형 차광칩 배치">
      <circle class="wafer-circle" cx="${shift}" cy="${shift}" r="${radiusCm * scale}"/>
      ${cells}
      <text class="shape-label" x="5" y=".65" text-anchor="middle">원형 렌즈 반지름 ${radiusCm} cm · 차광칩 한 변 ${dieSideCm} cm</text>
      <text class="shape-sub-label" x="5" y="9.3" text-anchor="middle">밝은 정사각형처럼 원 안에 완전히 들어가는 칩만 사용할 수 있다</text>
    </svg>
  `;
}

function formatAnswer(stage, answer) {
  return stage.fields.map((field) => `${field.label} ${formatNumber(answer[field.key])}${field.unit}`).join(", ");
}

function formatNumber(value) {
  return Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function loop(now) {
  const dt = Math.min(0.034, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;
  state.cutterProgress = Math.max(0, Math.min(1, state.cutterProgress + dt * 0.05));
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
  gradient.addColorStop(0, "#1b111a");
  gradient.addColorStop(1, "#07060b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  drawFactoryGrid(now);
  drawCuttingTable(now);
  drawWH(now);
}

function drawFactoryGrid(now) {
  const horizon = height * 0.43;
  ctx.strokeStyle = "rgba(255,111,155,.18)";
  ctx.lineWidth = 1;
  for (let x = -80; x <= width + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(width / 2, horizon);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = horizon; y < height; y += 54) {
    const wave = Math.sin(now / 700 + y * 0.018) * 2;
    ctx.beginPath();
    ctx.moveTo(0, y + wave);
    ctx.lineTo(width, y - wave);
    ctx.stroke();
  }
}

function drawCuttingTable(now) {
  const tableY = height * 0.65;
  ctx.save();
  ctx.fillStyle = "#17111a";
  ctx.strokeStyle = "#694254";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.26, tableY);
  ctx.lineTo(width * 0.74, tableY);
  ctx.lineTo(width * 0.81, tableY + 95);
  ctx.lineTo(width * 0.19, tableY + 95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const laserX = width * (0.36 + state.cutterProgress * 0.28);
  const laserY = height * 0.28 + Math.sin(now / 250) * 3;
  ctx.strokeStyle = "rgba(117,232,255,.78)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(laserX, laserY);
  ctx.lineTo(laserX, tableY + 36);
  ctx.stroke();
  const glow = ctx.createRadialGradient(laserX, tableY + 36, 2, laserX, tableY + 36, 80);
  glow.addColorStop(0, "rgba(117,232,255,.28)");
  glow.addColorStop(1, "rgba(117,232,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(laserX - 80, tableY - 44, 160, 160);
  ctx.restore();
}

function drawWH(now) {
  const x = width * 0.45;
  const y = height * 0.8 - Math.sin(now / 180) * 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.92, 0.92);
  ctx.fillStyle = "#a43f66";
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
