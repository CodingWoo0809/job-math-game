import { checkSolidStageAnswer, createSolidMeasureRun } from "./solid-measure-data.mjs";

const canvas = document.querySelector("#map35-canvas");
const ctx = canvas.getContext("2d");
const ui = {
  hud: document.querySelector("#map35-hud"),
  objective: document.querySelector("#map35-objective"),
  count: document.querySelector("#solid-count"),
  start: document.querySelector("#map35-start"),
  startButton: document.querySelector("#map35-start-button"),
  puzzle: document.querySelector("#map35-puzzle"),
  difficulty: document.querySelector("#solid-difficulty"),
  number: document.querySelector("#solid-number"),
  slots: document.querySelector("#solid-slots"),
  title: document.querySelector("#solid-title"),
  visual: document.querySelector("#solid-visual"),
  note: document.querySelector("#solid-note"),
  form: document.querySelector("#solid-form"),
  help: document.querySelector("#solid-help"),
  fields: document.querySelector("#solid-fields"),
  submit: document.querySelector("#solid-submit"),
  feedback: document.querySelector("#map35-feedback"),
  complete: document.querySelector("#map35-complete"),
  replay: document.querySelector("#map35-replay"),
  next: document.querySelector("#map35-next")
};

const makeState = () => ({ run: createSolidMeasureRun(), index: 0, locked: false, robotMood: 0, lastTime: performance.now() });
let state = makeState();
let width = 1280;
let height = 720;

resize();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
ui.startButton.addEventListener("click", startGame);
ui.form.addEventListener("submit", submitSolidMeasure);
ui.replay.addEventListener("click", resetGame);
ui.next.addEventListener("click", () => { window.location.href = "./chapter4.html"; });

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
  ui.objective.textContent = "입체도형의 겉넓이와 부피를 계산해 로봇을 만족시키기";
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
    <label class="solid-field">
      <span>${field.label}</span>
      <span class="number-with-unit"><input name="${field.key}" data-solid-field="${field.key}" type="number" min="0" step="${field.step}" inputmode="decimal" autocomplete="off" required/><b>${field.unit}</b></span>
    </label>
  `).join("");
  ui.fields.querySelectorAll("input").forEach((input) => { input.disabled = false; });
  ui.submit.disabled = false;
  ui.feedback.textContent = stage.type === "cone-transfer"
    ? "원기둥의 액체 전기 부피와 원뿔 컵의 부피가 같아지도록 높이를 구하세요."
    : "단위와 공식을 확인한 뒤 필요한 값만 입력하세요.";
  ui.feedback.className = "solid-feedback";
  renderProgress();
  requestAnimationFrame(() => ui.fields.querySelector("input")?.focus());
}

function submitSolidMeasure(event) {
  event.preventDefault();
  if (state.locked) return;
  const stage = state.run[state.index];
  const submitted = Object.fromEntries(stage.fields.map((field) => [field.key, ui.fields.querySelector(`[name="${field.key}"]`)?.value ?? ""]));
  if (stage.fields.some((field) => String(submitted[field.key]).trim() === "")) {
    showError("모든 값을 입력해야 B-07의 식사 장치가 반응해.");
    return;
  }
  const result = checkSolidStageAnswer(stage, submitted);
  if (!result.correct) {
    const wrong = result.fieldResults.filter((field) => !field.correct).map((field) => field.label).join(", ");
    showError(`${wrong} 값을 다시 확인해 보자. ${stage.help}`);
    return;
  }
  state.locked = true;
  ui.fields.querySelectorAll("input").forEach((input) => { input.disabled = true; });
  ui.submit.disabled = true;
  ui.feedback.textContent = `정확해! ${formatAnswer(stage, result.answer)}. B-07의 표정이 조금 더 말랑해졌어.`;
  ui.feedback.className = "solid-feedback is-success";
  state.index += 1;
  state.robotMood = Math.max(state.robotMood, state.index / state.run.length);
  renderProgress();
  if (state.index >= state.run.length) setTimeout(completeMap, 1000);
  else setTimeout(renderStage, 1000);
}

function showError(message) {
  ui.feedback.textContent = message;
  ui.feedback.className = "solid-feedback is-error";
  ui.form.classList.remove("is-wrong");
  void ui.form.offsetWidth;
  ui.form.classList.add("is-wrong");
}

function renderProgress() {
  if (ui.slots.children.length !== state.run.length) {
    ui.slots.innerHTML = Array.from({ length: state.run.length }, () => "<i></i>").join("");
  }
  ui.count.textContent = `${state.index} / ${state.run.length}`;
  [...ui.slots.children].forEach((slot, index) => slot.classList.toggle("is-filled", index < state.index));
}

function completeMap() {
  ui.puzzle.classList.add("is-hidden");
  ui.objective.textContent = "B-07의 원뿔 컵이 가득 찼다. 챕터 3 탈출!";
  setTimeout(() => {
    ui.hud.classList.add("is-hidden");
    ui.complete.classList.remove("is-hidden");
    ui.replay.focus();
  }, 900);
}

function renderStageVisual(stage) {
  if (stage.type === "rectangular-prism") return renderPrismVisual(stage);
  if (stage.type === "cylinder-volume") return renderCylinderVisual(stage);
  return renderConeTransferVisual(stage);
}

function renderPrismVisual(stage) {
  const { lengthCm, widthCm, heightCm } = stage.givens;
  return `
    <svg viewBox="0 0 10 7" role="img" aria-label="직육면체 보온 케이스와 전개도">
      <polygon class="prism-top" points="2.2,1.5 5.2,.75 7.65,2.05 4.7,2.82"/>
      <polygon class="prism-face" points="2.2,1.5 4.7,2.82 4.7,5.35 2.2,4"/>
      <polygon class="prism-face" points="4.7,2.82 7.65,2.05 7.65,4.6 4.7,5.35"/>
      <text class="shape-label" x="5" y=".45" text-anchor="middle">직육면체 케이스: 가로 ${lengthCm} cm · 세로 ${widthCm} cm · 높이 ${heightCm} cm</text>
      <text class="shape-small" x="2.15" y="5.95">전개도 넓이 합 = 겉넓이</text>
      <rect class="net-rect" x="5.95" y="5.12" width="1.1" height=".72"/>
      <rect class="net-rect accent" x="7.05" y="5.12" width="1.1" height=".72"/>
      <rect class="net-rect" x="8.15" y="5.12" width="1.1" height=".72"/>
      <rect class="net-rect" x="7.05" y="4.4" width="1.1" height=".72"/>
      <rect class="net-rect" x="7.05" y="5.84" width="1.1" height=".72"/>
      <rect class="net-rect accent" x="7.05" y="3.68" width="1.1" height=".72"/>
      <text class="shape-formula" x="7.55" y="6.9" text-anchor="middle">부피 = 가로×세로×높이</text>
    </svg>
  `;
}

function renderCylinderVisual(stage) {
  const { radiusCm, heightCm } = stage.givens;
  return `
    <svg viewBox="0 0 10 7" role="img" aria-label="액체 전기가 가득 담긴 원기둥 컵">
      <ellipse class="electric-glow" cx="5" cy="1.55" rx="1.65" ry=".48"/>
      <path class="electric-glow" d="M3.35 1.55 V5.18 Q5 5.78 6.65 5.18 V1.55"/>
      <ellipse class="electric-fill" cx="5" cy="1.55" rx="1.48" ry=".37"/>
      <path class="electric-fill" d="M3.52 1.62 V4.95 Q5 5.42 6.48 4.95 V1.62"/>
      <ellipse class="solid-edge" cx="5" cy="5.18" rx="1.65" ry=".48"/>
      <line class="solid-line" x1="5" y1="1.55" x2="6.5" y2="1.55"/>
      <line class="solid-line" x1="7.12" y1="1.55" x2="7.12" y2="5.18"/>
      <text class="shape-label" x="5" y=".62" text-anchor="middle">원기둥 컵: 반지름 ${radiusCm} cm, 높이 ${heightCm} cm</text>
      <text class="shape-small" x="5.78" y="1.35">r=${radiusCm}</text>
      <text class="shape-small" x="7.32" y="3.45">h=${heightCm}</text>
      <text class="shape-formula" x="5" y="6.45" text-anchor="middle">원기둥 부피 = 밑면의 넓이×높이 = π×${radiusCm}²×${heightCm}</text>
    </svg>
  `;
}

function renderConeTransferVisual(stage) {
  const { cylinderRadiusCm, cylinderHeightCm, coneRadiusCm } = stage.givens;
  return `
    <svg viewBox="0 0 10 7" role="img" aria-label="원기둥 컵의 액체 전기를 원뿔 컵으로 옮기는 장면">
      <ellipse class="electric-glow" cx="2.3" cy="1.55" rx="1.05" ry=".32"/>
      <path class="electric-glow" d="M1.25 1.55 V4.4 Q2.3 4.8 3.35 4.4 V1.55"/>
      <path class="electric-fill" d="M1.38 1.62 V4.2 Q2.3 4.55 3.22 4.2 V1.62"/>
      <ellipse class="electric-fill" cx="2.3" cy="1.55" rx=".92" ry=".24"/>
      <path class="cone-side" d="M6.25 1.25 L8.95 1.25 L7.6 5.55 Z"/>
      <ellipse class="solid-edge" cx="7.6" cy="1.25" rx="1.35" ry=".38"/>
      <line class="solid-line" x1="7.6" y1="1.25" x2="8.95" y2="1.25"/>
      <line class="solid-line" x1="7.6" y1="1.25" x2="7.6" y2="5.55"/>
      <text class="shape-label" x="5" y=".45" text-anchor="middle">원기둥의 액체 전기를 원뿔 컵에 정확히 가득 담기</text>
      <text class="shape-small" x="2.3" y="5.38" text-anchor="middle">원기둥 r=${cylinderRadiusCm}, h=${cylinderHeightCm}</text>
      <text class="shape-small" x="8.25" y="1.05">r=${coneRadiusCm}</text>
      <text class="shape-small" x="7.8" y="3.55">높이 ?</text>
      <text class="shape-formula" x="5" y="6.27" text-anchor="middle">원뿔 부피 = 1/3×π×${coneRadiusCm}²×높이 = 원기둥 부피</text>
      <text class="shape-label" x="4.82" y="3.2" text-anchor="middle">→</text>
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
  state.robotMood = Math.max(0, Math.min(1, state.robotMood + dt * 0.025));
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
  gradient.addColorStop(0, "#0d1a2a");
  gradient.addColorStop(0.56, "#07101b");
  gradient.addColorStop(1, "#03060b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  drawContainmentGrid(now);
  drawRobot(now);
  drawElectricTray(now);
  drawWH(now);
}

function drawContainmentGrid(now) {
  const horizon = height * 0.43;
  ctx.strokeStyle = "rgba(101,242,255,.16)";
  ctx.lineWidth = 1;
  for (let x = -80; x <= width + 80; x += 78) {
    ctx.beginPath();
    ctx.moveTo(width / 2, horizon);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = horizon; y < height; y += 48) {
    const pulse = Math.sin(now / 600 + y * 0.02) * 2;
    ctx.beginPath();
    ctx.moveTo(0, y + pulse);
    ctx.lineTo(width, y - pulse);
    ctx.stroke();
  }
}

function drawRobot(now) {
  const x = width * 0.65;
  const y = height * 0.48 + Math.sin(now / 310) * 4;
  const mood = state.robotMood;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(101,242,255,.16)";
  ctx.beginPath();
  ctx.ellipse(0, 114, 110, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#dffcff";
  ctx.strokeStyle = "#65f2ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-70, -76, 140, 118, 30);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#07101b";
  ctx.beginPath();
  ctx.arc(-28, -26, 16, 0, Math.PI * 2);
  ctx.arc(28, -26, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mood > 0.9 ? "#b8ff6a" : "#65f2ff";
  ctx.beginPath();
  ctx.arc(-28, -26, 6 + mood * 3, 0, Math.PI * 2);
  ctx.arc(28, -26, 6 + mood * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#07101b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  const mouthY = 9;
  ctx.moveTo(-22, mouthY);
  ctx.quadraticCurveTo(0, mouthY + 18 * mood - 8 * (1 - mood), 22, mouthY);
  ctx.stroke();
  ctx.fillStyle = "#0a3141";
  ctx.font = "900 16px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("B-07", 0, 67);
  ctx.restore();
}

function drawElectricTray(now) {
  const x = width * 0.52;
  const y = height * 0.73;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#08131e";
  ctx.strokeStyle = "#244d64";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-230, -35, 460, 82, 18);
  ctx.fill();
  ctx.stroke();
  const glow = ctx.createRadialGradient(-40, 0, 4, -40, 0, 170);
  glow.addColorStop(0, "rgba(184,255,106,.34)");
  glow.addColorStop(1, "rgba(184,255,106,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-210, -76, 420, 150);
  ctx.fillStyle = "#b8ff6a";
  ctx.font = "900 12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("π는 그대로, 필요한 수만 입력", 0, 23 + Math.sin(now / 240) * 1.5);
  ctx.restore();
}

function drawWH(now) {
  const x = width * 0.34;
  const y = height * 0.82 - Math.sin(now / 190) * 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.92, 0.92);
  ctx.fillStyle = "#202a36";
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
  ctx.fillStyle = "#65f2ff";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("WH", 0, -39);
  ctx.restore();
}
