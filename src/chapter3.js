import { assetManager } from "./asset-manager.mjs";

const canvas = document.querySelector("#chapter3-canvas");
const ctx = canvas.getContext("2d");
const caption = document.querySelector("#cinema-caption");
const skip = document.querySelector("#skip-capture");
const card = document.querySelector("#chapter3-card");
let width = 1280;
let height = 720;
let start = performance.now();
let finished = false;

const agents=[[-.1,.52,-.12,0,"characters.blackSuitAgents.agent01",.88,false],[1.1,.5,.12,0,"characters.blackSuitAgents.agent03",.86,true],[.16,1.15,-.06,.04,"characters.blackSuitAgents.agent02",.82,false],[.84,1.15,.06,.04,"characters.blackSuitAgents.agent04",.82,true],[.5,-.22,0,-.06,"characters.blackSuitAgents.agent05",.78,false]];
const ALLEY_WALL_KEYS = ["props.alleyWalls.wall01", "props.alleyWalls.wall02", "props.alleyWalls.wall03", "props.alleyWalls.wall04", "props.alleyWalls.wall05", "props.alleyWalls.wall06", "props.alleyWalls.wall07", "props.alleyWalls.wall08", "props.alleyWalls.wall09", "props.alleyWalls.wall10", "props.alleyWalls.wall11", "props.alleyWalls.wall12"];
const ALLEY_LIGHTS = [
  [-.04, "props.brokenStreetlight", .92, 255, -8],
  [.18, "props.streetlight", .72, 235, 0],
  [.38, "props.flickeringStreetlight", .8, 250, 5],
  [.66, "props.streetlight", .72, 238, -4],
  [.92, "props.brokenStreetlight", .88, 250, 8],
  [1.08, "props.flickeringStreetlight", .82, 245, -2]
];

assetManager.loadAll().catch((error) => console.warn(error));
resize();
requestAnimationFrame(loop);
window.addEventListener("resize", resize);
skip.textContent = "\uAC74\uB108\uB6F0\uAE30";
skip.addEventListener("click", () => { start = performance.now() - 7200; finish(); });

function resize() {
  const rect = canvas.getBoundingClientRect();
  const d = Math.min(2, devicePixelRatio || 1);
  width = Math.max(320, rect.width);
  height = Math.max(360, rect.height);
  canvas.width = Math.round(width * d);
  canvas.height = Math.round(height * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
}

function loop(now) {
  const elapsed = (now - start) / 1000;
  const d = Math.min(2, devicePixelRatio || 1);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (elapsed < 5.15) drawAlley(elapsed);
  else drawCell(elapsed);
  updateCaption(elapsed);
  if (elapsed >= 6.7) finish();
  if (!finished) requestAnimationFrame(loop);
}

function updateCaption(t) {
  caption.textContent = t < 1.5
    ? "\uC5B4\uB450\uC6B4 \uACE8\uBAA9, WH\uAC00 \uC774\uC0C1\uD55C \uAE30\uCC99\uC744 \uB290\uB080\uB2E4."
    : t < 3.8
      ? "\uAC80\uC740 \uC815\uC7A5\uC758 \uC694\uC6D0 5\uBA85\uC774 WH\uB97C \uC0AC\uBC29\uC5D0\uC11C \uD3EC\uC704\uD55C\uB2E4."
      : t < 5.2
        ? "\uC2DC\uC57C\uAC00 \uAC80\uAC8C \uB2EB\uD788\uACE0, \uACF5\uAE30\uAC00 \uCC28\uAC11\uAC8C \uC2DD\uB294\uB2E4."
        : "\uCC28\uAC00\uC6B4 \uAE08\uC18D \uBC14\uB2E5 \uC704, WH\uAC00 \uC785\uCCB4\uB3C4\uD615 \uACA9\uB0A9\uC2E4\uC5D0\uC11C \uB208\uC744 \uB728\uB2E4.";
}

function drawAlley(t) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, "#25273a");
  g.addColorStop(.58, "#11141f");
  g.addColorStop(1, "#070910");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  drawAlleyWalls();
  drawAlleyStreetlights(t);
  drawAlleyFloor();
  const whX = width * (.35 + Math.min(t / 1.5, 1) * .1);
  const whY = height * .72;
  const converge = Math.max(0, Math.min(1, (t - 1.25) / 2.2));
  const actors = agents.map(([sx, sy, tx, ty, key, scale, flip]) => ({
    x: lerp(width * sx, whX + width * tx, converge),
    y: lerp(height * sy, whY + height * ty, converge),
    key,
    scale,
    flip,
    type: "agent"
  }));
  actors.push({ x: whX, y: whY, bob: t < 1.5 ? Math.sin(t * 12) * 5 : 0, type: "wh" });
  actors.sort((a, b) => a.y - b.y);
  for (const actor of actors) {
    if (actor.type === "wh") drawWH(actor.x, actor.y, actor.bob, 150);
    else drawAgent(actor.x, actor.y, actor.scale, actor.key, actor.flip);
  }
  if (t > 3.7) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (t - 3.7) / 1.25)})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawAlleyWalls() {
  const wallTop = height * .08;
  const wallBottom = height * .69;
  const tileW = Math.max(170, Math.min(245, width / 5.2));
  const tileH = tileW * .94;
  let index = 0;
  for (let y = wallTop; y < wallBottom; y += tileH * .78) {
    for (let x = -tileW * .22; x < width + tileW * .25; x += tileW * .86) {
      const key = ALLEY_WALL_KEYS[(index * 5 + Math.floor(y / 17)) % ALLEY_WALL_KEYS.length];
      const ok = assetManager.draw(ctx, key, { x, y, width: tileW, anchorX: 0, anchorY: 0, alpha: .72 });
      if (!ok) {
        ctx.fillStyle = index % 2 ? "#252938" : "#303241";
        ctx.fillRect(x, y, tileW, tileH * .72);
        ctx.strokeStyle = "rgba(0,0,0,.22)";
        ctx.strokeRect(x, y, tileW, tileH * .72);
      }
      index += 1;
    }
  }
  const haze = ctx.createLinearGradient(0, 0, 0, wallBottom);
  haze.addColorStop(0, "rgba(8,10,16,.05)");
  haze.addColorStop(1, "rgba(7,9,13,.7)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, wallBottom + 20);
}

function drawAlleyStreetlights(t) {
  for (const [ratio, key, alpha, lampHeight, tilt] of ALLEY_LIGHTS) {
    const x = width * ratio;
    const y = height * .72;
    const flicker = key.includes("flickering") ? .68 + Math.sin(t * 23 + ratio * 8) * .18 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((tilt * Math.PI) / 180);
    const ok = assetManager.draw(ctx, key, { x: 0, y: 4, height: lampHeight, anchorX: .5, anchorY: 1, alpha: alpha * flicker });
    ctx.restore();
    if (!ok) {
      ctx.strokeStyle = "rgba(33,36,45,.8)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + tilt, y - lampHeight);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(245,213,127,${.08 * flicker})`;
    ctx.beginPath();
    ctx.ellipse(x + tilt * 1.8, y - lampHeight * .82, 95, 48, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAlleyFloor() {
  ctx.fillStyle = "#0a0c13";
  ctx.fillRect(0, height * .68, width, height * .32);
  const floor = ctx.createLinearGradient(0, height * .68, 0, height);
  floor.addColorStop(0, "rgba(58,54,63,.7)");
  floor.addColorStop(1, "rgba(7,8,12,.96)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, height * .68, width, height * .32);
  ctx.strokeStyle = "rgba(125,125,137,.18)";
  ctx.lineWidth = 2;
  for (let x = -width; x < width * 2; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(width / 2 + (x - width / 2) * .42, height * .68);
    ctx.stroke();
  }
}

function drawCell(t) {
  const local = Math.max(0, t - 5.15);
  ctx.fillStyle = "#050a12";
  ctx.fillRect(0, 0, width, height);
  drawFutureWallTiles(local);
  drawFutureRoomDepth(local);
  drawSlidingDoor(local);
  const cx = width / 2;
  drawWH(cx, height * .76, Math.sin(t * 2.8) * 1.2, 160);
  drawWakeMask(local);
  ctx.fillStyle = "rgba(92,209,197,.86)";
  ctx.font = "900 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("CONTAINMENT A-01", cx, height * .18);
}

function drawFutureWallTiles(local) {
  const image = assetManager.get("props.futureBaseWallTile");
  const tileW = Math.max(170, Math.min(260, width / 5));
  const tileH = tileW * .66;
  if (image) {
    for (let y = -tileH * .28; y < height * .72; y += tileH) {
      for (let x = -tileW * .18; x < width + tileW * .2; x += tileW) {
        ctx.drawImage(image, x, y, tileW, tileH);
      }
    }
  } else {
    ctx.fillStyle = "#0c1722";
    ctx.fillRect(0, 0, width, height * .72);
    ctx.strokeStyle = "rgba(93,154,166,.22)";
    for (let x = 0; x < width; x += tileW) {
      for (let y = 0; y < height * .72; y += tileH) ctx.strokeRect(x, y, tileW, tileH);
    }
  }
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "rgba(2,6,12,.08)");
  shade.addColorStop(.68, "rgba(1,5,10,.28)");
  shade.addColorStop(1, "rgba(1,3,6,.88)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
}

function drawFutureRoomDepth(local) {
  const cx = width / 2;
  const cy = height * .54;
  ctx.fillStyle = "rgba(6,12,18,.62)";
  ctx.beginPath();
  ctx.moveTo(0, height * .2);
  ctx.lineTo(cx, cy);
  ctx.lineTo(0, height);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(width, height * .2);
  ctx.lineTo(cx, cy);
  ctx.lineTo(width, height);
  ctx.fill();
  ctx.fillStyle = "#07111a";
  ctx.fillRect(0, height * .72, width, height * .28);
  ctx.strokeStyle = `rgba(95,210,219,${.22 + Math.sin(local * 5) * .04})`;
  ctx.lineWidth = 2;
  for (let inset = 35; inset < Math.min(width, height) * .45; inset += 70) {
    ctx.strokeRect(inset, inset * .5, width - inset * 2, height - inset * 1.05);
  }
}

function drawSlidingDoor(local) {
  const cx = width / 2;
  const floorY = height * .72;
  const doorH = Math.min(height * .58, 420);
  const image = assetManager.get("props.futureBaseSlidingDoor");
  const ratio = image ? image.naturalWidth / image.naturalHeight : .72;
  const doorW = doorH * ratio;
  const open = smoothstep(Math.max(0, Math.min(1, (local - .48) / .9)));
  ctx.save();
  ctx.fillStyle = "rgba(2,7,12,.96)";
  roundRect(cx - doorW * .56, floorY - doorH * 1.04, doorW * 1.12, doorH * 1.06, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(112,225,223,.5)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = `rgba(95,209,197,${.1 + open * .2})`;
  ctx.fillRect(cx - doorW * .42, floorY - doorH * .94, doorW * .84, doorH * .92);
  const offset = -doorH * .82 * open;
  if (image) {
    ctx.save();
    ctx.beginPath();
    roundRect(cx - doorW * .56, floorY - doorH * 1.04, doorW * 1.12, doorH * 1.06, 18);
    ctx.clip();
    assetManager.draw(ctx, "props.futureBaseSlidingDoor", { x: cx, y: floorY + offset, height: doorH, anchorX: .5, anchorY: 1 });
    ctx.restore();
  } else {
    ctx.fillStyle = "#172637";
    ctx.fillRect(cx - doorW / 2, floorY - doorH + offset, doorW, doorH);
  }
  ctx.restore();
}

function drawWakeMask(local) {
  const wake = smoothstep(Math.max(0, Math.min(1, local / .7)));
  if (wake >= .995) return;
  const lid = height * .5 * (1 - wake);
  ctx.fillStyle = "rgba(0,0,0,.96)";
  ctx.fillRect(0, 0, width, lid);
  ctx.fillRect(0, height - lid, width, lid);
  ctx.fillStyle = `rgba(0,0,0,${.55 * (1 - wake)})`;
  ctx.fillRect(0, 0, width, height);
}

function drawWH(x, y, bob = 0, spriteHeight = 150) {
  drawShadow(x, y + 5, 34, 10);
  if (assetManager.has("characters.wh")) {
    assetManager.draw(ctx, "characters.wh", { x, y: y + bob, height: spriteHeight, anchorX: .5, anchorY: 1 });
    return;
  }
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "#1b8f88";
  roundRect(-23, -92, 49, 64, 16);
  ctx.fill();
  ctx.fillStyle = "#efc3a9";
  ctx.beginPath();
  ctx.arc(1, -118, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#17223b";
  ctx.beginPath();
  ctx.arc(1, -128, 29, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("WH", 1, -56);
  ctx.restore();
}

function drawAgent(x, y, scale, key, flip = false) {
  drawShadow(x, y + 4, 38 * scale, 11 * scale);
  if (assetManager.has(key)) {
    assetManager.draw(ctx, key, { x, y, height: 218 * scale, anchorX: .5, anchorY: 1, flipX: flip });
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (flip ? -1 : 1), scale);
  ctx.fillStyle = "#050609";
  roundRect(-30, -118, 60, 88, 13);
  ctx.fill();
  ctx.fillStyle = "#d2b29f";
  ctx.beginPath();
  ctx.arc(0, -145, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#050609";
  ctx.fillRect(-28, -166, 56, 20);
  ctx.fillStyle = "#d9dde2";
  ctx.beginPath();
  ctx.moveTo(-7, -115);
  ctx.lineTo(7, -115);
  ctx.lineTo(0, -83);
  ctx.fill();
  ctx.strokeStyle = "#050609";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-12, -32);
  ctx.lineTo(-15, 0);
  ctx.moveTo(12, -32);
  ctx.lineTo(15, 0);
  ctx.stroke();
  ctx.restore();
}

function drawShadow(x, y, rx, ry) {
  ctx.fillStyle = "rgba(0,0,0,.32)";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function finish() {
  if (finished) return;
  finished = true;
  card.classList.remove("is-hidden");
  caption.classList.add("is-hidden");
  skip.classList.add("is-hidden");
}
