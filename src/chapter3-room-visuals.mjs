import { assetManager } from "./asset-manager.mjs";

let loadingStarted = false;

export function ensureChapter3RoomAssets() {
  if (loadingStarted || typeof Image === "undefined") return;
  loadingStarted = true;
  assetManager.loadAll().catch((error) => console.warn(error));
}

export function drawFutureBaseBackdrop(ctx, options) {
  const {
    width,
    height,
    now = 0,
    lineColor = "rgba(95,210,219,.22)",
    glowColor = "91,220,210",
    floorTopRatio = .72
  } = options;
  ctx.fillStyle = "#050a12";
  ctx.fillRect(0, 0, width, height);
  drawFutureWallTiles(ctx, width, height, floorTopRatio);
  drawRoomDepth(ctx, width, height, lineColor, floorTopRatio);
  drawEnergyGrid(ctx, width, height, now, lineColor, glowColor, floorTopRatio);
}

export function drawFutureSlidingDoor(ctx, options) {
  const {
    width,
    height,
    progress = 0,
    xRatio = .5,
    floorYRatio = .72,
    doorHeightRatio = .58,
    maxDoorHeight = 420,
    frameScale = 1,
    glow = "95,209,197"
  } = options;
  const cx = width * xRatio;
  const floorY = height * floorYRatio;
  const doorH = Math.min(height * doorHeightRatio, maxDoorHeight) * frameScale;
  const image = assetManager.get("props.futureBaseSlidingDoor");
  const ratio = image ? image.naturalWidth / image.naturalHeight : .72;
  const doorW = doorH * ratio;
  const open = smoothstep(Math.max(0, Math.min(1, progress)));
  ctx.save();
  ctx.fillStyle = "rgba(2,7,12,.96)";
  roundRect(ctx, cx - doorW * .56, floorY - doorH * 1.04, doorW * 1.12, doorH * 1.06, 18);
  ctx.fill();
  ctx.strokeStyle = `rgba(${glow},.5)`;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = `rgba(${glow},${.1 + open * .24})`;
  ctx.fillRect(cx - doorW * .42, floorY - doorH * .94, doorW * .84, doorH * .92);
  const offset = -doorH * .82 * open;
  if (image) {
    ctx.save();
    roundRect(ctx, cx - doorW * .56, floorY - doorH * 1.04, doorW * 1.12, doorH * 1.06, 18);
    ctx.clip();
    assetManager.draw(ctx, "props.futureBaseSlidingDoor", { x: cx, y: floorY + offset, height: doorH, anchorX: .5, anchorY: 1 });
    ctx.restore();
  } else {
    ctx.fillStyle = "#172637";
    roundRect(ctx, cx - doorW / 2, floorY - doorH + offset, doorW, doorH, 14);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(${glow},${.35 + open * .35})`;
  ctx.beginPath();
  ctx.arc(cx + doorW * .39, floorY - doorH * .82, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFutureWH(ctx, options) {
  const {
    width,
    height,
    now = 0,
    xRatio = .5,
    yRatio = .78,
    xOffset = 0,
    yOffset = 0,
    spriteHeight = 154,
    flipX = false
  } = options;
  const x = width * xRatio + xOffset;
  const y = height * yRatio + yOffset - Math.sin(now / 180) * 2;
  drawShadow(ctx, x, y + 5, 34, 10);
  if (assetManager.has("characters.wh")) {
    assetManager.draw(ctx, "characters.wh", { x, y, height: spriteHeight, anchorX: .5, anchorY: 1, flipX });
    return;
  }
  drawFallbackWH(ctx, x, y, spriteHeight / 150, flipX);
}

export function drawFutureTransitionRoom(ctx, options) {
  const {
    width,
    height,
    now = 0,
    doorProgress = 0,
    whXRatio = .5,
    whYRatio = .78,
    whXOffset = 0,
    whYOffset = 0,
    whHeight = 154,
    doorXRatio = .5,
    doorHeightRatio = .58,
    lineColor,
    glowColor,
    beforeDoor,
    afterDoor
  } = options;
  drawFutureBaseBackdrop(ctx, { width, height, now, lineColor, glowColor });
  if (typeof beforeDoor === "function") beforeDoor();
  drawFutureSlidingDoor(ctx, { width, height, progress: doorProgress, xRatio: doorXRatio, doorHeightRatio });
  if (typeof afterDoor === "function") afterDoor();
  drawFutureWH(ctx, { width, height, now, xRatio: whXRatio, yRatio: whYRatio, xOffset: whXOffset, yOffset: whYOffset, spriteHeight: whHeight });
}

function drawFutureWallTiles(ctx, width, height, floorTopRatio) {
  const image = assetManager.get("props.futureBaseWallTile");
  const tileW = Math.max(170, Math.min(260, width / 5));
  const tileH = tileW * .66;
  if (image) {
    for (let y = -tileH * .28; y < height * (floorTopRatio + .02); y += tileH) {
      for (let x = -tileW * .18; x < width + tileW * .2; x += tileW) {
        ctx.drawImage(image, x, y, tileW, tileH);
      }
    }
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, height * floorTopRatio);
    gradient.addColorStop(0, "#10202b");
    gradient.addColorStop(1, "#07111a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height * floorTopRatio);
    ctx.strokeStyle = "rgba(93,154,166,.22)";
    for (let x = 0; x < width; x += tileW) {
      for (let y = 0; y < height * floorTopRatio; y += tileH) ctx.strokeRect(x, y, tileW, tileH);
    }
  }
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "rgba(2,6,12,.08)");
  shade.addColorStop(.68, "rgba(1,5,10,.32)");
  shade.addColorStop(1, "rgba(1,3,6,.9)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
}

function drawRoomDepth(ctx, width, height, lineColor, floorTopRatio) {
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
  ctx.fillRect(0, height * floorTopRatio, width, height * (1 - floorTopRatio));
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  for (let inset = 35; inset < Math.min(width, height) * .45; inset += 70) {
    ctx.strokeRect(inset, inset * .5, width - inset * 2, height - inset * 1.05);
  }
}

function drawEnergyGrid(ctx, width, height, now, lineColor, glowColor, floorTopRatio) {
  const horizon = height * .48;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  for (let x = -80; x <= width + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(width / 2, horizon);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = horizon; y < height; y += 55) {
    const wave = Math.sin(now / 650 + y * .018) * 2;
    ctx.beginPath();
    ctx.moveTo(0, y + wave);
    ctx.lineTo(width, y - wave);
    ctx.stroke();
  }
  const pulse = .12 + Math.sin(now / 450) * .04;
  for (const [x, y] of [[width * .15, height * .34], [width * .85, height * .34], [width * .5, height * .13]]) {
    const beam = ctx.createRadialGradient(x, y, 3, x, y, 115);
    beam.addColorStop(0, `rgba(${glowColor},${pulse})`);
    beam.addColorStop(1, `rgba(${glowColor},0)`);
    ctx.fillStyle = beam;
    ctx.fillRect(x - 115, y - 115, 230, 230);
  }
}

function drawFallbackWH(ctx, x, y, scale, flipX) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (flipX ? -1 : 1), scale);
  ctx.fillStyle = "#1b8f88";
  roundRect(ctx, -23, -92, 49, 64, 16);
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

function drawShadow(ctx, x, y, rx, ry) {
  ctx.fillStyle = "rgba(0,0,0,.32)";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}
