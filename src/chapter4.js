const canvas = document.querySelector("#chapter4-canvas");
const ctx = canvas.getContext("2d");
let width = 1280;
let height = 720;

resize();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);

function resize() {
  const rect = canvas.getBoundingClientRect();
  const density = Math.min(2, devicePixelRatio || 1);
  width = Math.max(320, rect.width);
  height = Math.max(360, rect.height);
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  ctx.setTransform(density, 0, 0, density, 0, 0);
}

function loop(now) {
  const density = Math.min(2, devicePixelRatio || 1);
  ctx.setTransform(density, 0, 0, density, 0, 0);
  drawGateway(now);
  requestAnimationFrame(loop);
}

function drawGateway(now) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#8fe4ff");
  sky.addColorStop(0.48, "#f1fdff");
  sky.addColorStop(0.49, "#d7f3c7");
  sky.addColorStop(1, "#79cf69");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  drawSun(now);
  drawCloud(width * 0.2, height * 0.17, now, 0);
  drawCloud(width * 0.66, height * 0.22, now, 1.7);
  drawSchool();
  drawTrees(now);
  drawParkPath();
  drawBikeKid((width * 0.08 + (now * 0.052) % (width * 0.92)), height * 0.76, "#69a7ff");
  drawInlineKid(width - ((now * 0.065) % (width * 0.88)) - width * 0.06, height * 0.64, "#ff7ba8");
}

function drawSun(now) {
  const x = width * 0.82;
  const y = height * 0.14;
  const glow = ctx.createRadialGradient(x, y, 14, x, y, 140 + Math.sin(now / 700) * 8);
  glow.addColorStop(0, "rgba(255,209,102,.95)");
  glow.addColorStop(0.4, "rgba(255,209,102,.28)");
  glow.addColorStop(1, "rgba(255,209,102,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 145, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x, y, 45, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(x, y, now, phase) {
  ctx.save();
  ctx.translate(x + Math.sin(now / 1200 + phase) * 10, y);
  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.beginPath();
  ctx.arc(-42, 8, 26, 0, Math.PI * 2);
  ctx.arc(-10, -5, 34, 0, Math.PI * 2);
  ctx.arc(32, 8, 25, 0, Math.PI * 2);
  ctx.fillRect(-45, 8, 88, 26);
  ctx.fill();
  ctx.restore();
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

function drawTrees(now) {
  for (let i = 0; i < 7; i += 1) {
    const x = width * (0.05 + i * 0.15);
    const y = height * (0.55 + (i % 2) * 0.05);
    ctx.fillStyle = "#8a5a35";
    ctx.fillRect(x - 9, y - 4, 18, 86);
    ctx.fillStyle = i % 2 ? "#2da85a" : "#47bd62";
    ctx.beginPath();
    ctx.arc(x + Math.sin(now / 900 + i) * 2, y - 28, 42, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParkPath() {
  ctx.fillStyle = "#e8cf99";
  ctx.beginPath();
  ctx.moveTo(width * 0.37, height * 0.5);
  ctx.quadraticCurveTo(width * 0.58, height * 0.72, width * 0.48, height);
  ctx.lineTo(width * 0.8, height);
  ctx.quadraticCurveTo(width * 0.68, height * 0.72, width * 0.5, height * 0.5);
  ctx.closePath();
  ctx.fill();
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
  drawKid(0, -28, color);
  ctx.restore();
}

function drawInlineKid(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  drawKid(0, 0, color);
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

function drawKid(x, y, color) {
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
