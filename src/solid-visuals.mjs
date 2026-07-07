const pointText = (points) => points.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
const round = (value) => Math.round(value * 10) / 10;
const face = (points, fill) => `<polygon class="face" points="${pointText(points)}" fill="${fill}"/>`;
const rect = (x, y, width, height, fill) => `<rect class="face" x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`;
const regularPolygon = (cx, cy, radius, count, rotation = -Math.PI / 2) => Array.from({ length: count }, (_, index) => {
  const angle = rotation + index * Math.PI * 2 / count;
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
});
const reflectPoint = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay;
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const projection = [ax + t * dx, ay + t * dy];
  return [2 * projection[0] - px, 2 * projection[1] - py];
};
const reflectPolygon = (polygon, edgeIndex) => {
  const a = polygon[edgeIndex], b = polygon[(edgeIndex + 1) % polygon.length];
  return polygon.map((point) => reflectPoint(point, a, b));
};
const farthestEdge = (polygon, origin = [210, 150]) => {
  let best = 0, distance = -1;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = polygon[(index + 1) % polygon.length];
    const mx = (polygon[index][0] + next[0]) / 2, my = (polygon[index][1] + next[1]) / 2;
    const current = (mx - origin[0]) ** 2 + (my - origin[1]) ** 2;
    if (current > distance) { distance = current; best = index; }
  }
  return best;
};

export const NET_FACE_COUNTS = Object.freeze({
  cube: 6,
  cuboid: 6,
  cone: 2,
  "triangular-prism": 5,
  "square-pyramid": 5,
  "square-frustum": 6,
  "pentagonal-pyramid": 6,
  dodecahedron: 12,
  icosahedron: 20
});

export const CONE_NET_METRICS = Object.freeze([
  Object.freeze({ slantRadius: 132, sectorAngle: 2.4 }),
  Object.freeze({ slantRadius: 140, sectorAngle: 1.8 }),
  Object.freeze({ slantRadius: 120, sectorAngle: 2.15 }),
  Object.freeze({ slantRadius: 128, sectorAngle: 2.5 }),
  Object.freeze({ slantRadius: 138, sectorAngle: 1.65 })
].map((entry) => Object.freeze({
  ...entry,
  baseRadius: entry.slantRadius * entry.sectorAngle / (2 * Math.PI)
})));

export function renderNetVisual(type, variant, accent) {
  const content = type === "cube" ? cubeNet(variant, accent)
    : type === "cuboid" ? cuboidNet(variant, accent)
    : type === "cone" ? coneNet(variant, accent)
    : type === "triangular-prism" ? triangularPrismNet(variant, accent)
    : type === "square-pyramid" ? squarePyramidNet(variant, accent)
    : type === "square-frustum" ? squareFrustumNet(variant, accent)
    : type === "pentagonal-pyramid" ? pentagonalPyramidNet(variant, accent)
    : type === "dodecahedron" ? dodecahedronNet(variant, accent)
    : icosahedronNet(variant, accent);
  return `<g data-connected-net="true" data-face-count="${NET_FACE_COUNTS[type]}">${content}</g>`;
}

function cubeNet(variant, color) {
  const sets = [
    [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [2, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3], [0, 1], [2, 2]]
  ];
  const transform = Math.floor(variant / sets.length) % 4;
  const coordinates = sets[variant % sets.length].map(([x, y]) => {
    if (transform === 1) return [-y, x];
    if (transform === 2) return [-x, y];
    if (transform === 3) return [y, -x];
    return [x, y];
  });
  const size = 52;
  const minX = Math.min(...coordinates.map(([x]) => x)), maxX = Math.max(...coordinates.map(([x]) => x));
  const minY = Math.min(...coordinates.map(([, y]) => y)), maxY = Math.max(...coordinates.map(([, y]) => y));
  const originX = 210 - (maxX - minX + 1) * size / 2 - minX * size;
  const originY = 150 - (maxY - minY + 1) * size / 2 - minY * size;
  return coordinates.map(([x, y], index) => rect(originX + x * size, originY + y * size, size, size, index === 2 ? color : `${color}cc`)).join("");
}

function cuboidNet(variant, color) {
  const configurations = [
    [68, 42, 62, 0, 0], [74, 36, 58, 2, 2], [60, 48, 72, 0, 2], [72, 40, 50, 2, 0],
    [64, 46, 66, 0, 0], [78, 34, 54, 2, 2], [58, 50, 68, 0, 2]
  ];
  const [longSide, depth, height, top, bottom] = configurations[variant % configurations.length];
  const widths = [longSide, depth, longSide, depth], start = 210 - longSide - depth, y = 119, positions = [];
  let x = start, result = "";
  widths.forEach((width, index) => { positions.push(x); result += rect(x, y, width, height, index === 1 ? color : `${color}cc`); x += width; });
  return result + rect(positions[top], y - depth, longSide, depth, `${color}aa`) + rect(positions[bottom], y + height, longSide, depth, `${color}aa`);
}

function coneNet(variant, color) {
  const metrics = CONE_NET_METRICS[variant % CONE_NET_METRICS.length];
  const apex = variant % 2 ? [220, 230] : [250, 220];
  const middleAngle = -Math.PI / 2;
  const startAngle = middleAngle - metrics.sectorAngle / 2;
  const endAngle = middleAngle + metrics.sectorAngle / 2;
  const radialPoint = (angle, distance) => [
    apex[0] + Math.cos(angle) * distance,
    apex[1] + Math.sin(angle) * distance
  ];
  const start = radialPoint(startAngle, metrics.slantRadius);
  const end = radialPoint(endAngle, metrics.slantRadius);
  // 밑면 원은 부채꼴의 호와 한 점에서 접하며, r = lθ / 2π를 정확히 만족한다.
  const circleCenter = radialPoint(startAngle, metrics.slantRadius + metrics.baseRadius);
  const arcLength = metrics.slantRadius * metrics.sectorAngle;
  return `<path class="face cone-sector" data-slant-radius="${metrics.slantRadius}" data-sector-angle="${metrics.sectorAngle}" data-arc-length="${round(arcLength)}" d="M ${apex[0]} ${apex[1]} L ${round(start[0])} ${round(start[1])} A ${metrics.slantRadius} ${metrics.slantRadius} 0 ${metrics.sectorAngle > Math.PI ? 1 : 0} 1 ${round(end[0])} ${round(end[1])} Z" fill="${color}cc"/><circle class="face cone-base" data-base-radius="${round(metrics.baseRadius)}" cx="${round(circleCenter[0])}" cy="${round(circleCenter[1])}" r="${round(metrics.baseRadius)}" fill="${color}"/>`;
}

function triangularPrismNet(variant, color) {
  const configurations = [
    [74, 78, 0, 1], [68, 88, 1, 2], [80, 66, 2, 0], [70, 82, 0, 2],
    [76, 70, 2, 1], [66, 92, 1, 0], [78, 74, 0, 1]
  ];
  const [width, height, attachment, bottomAttachment] = configurations[variant % configurations.length];
  const start = 210 - width * 1.5, y = 109;
  let result = "";
  for (let index = 0; index < 3; index += 1) result += rect(start + index * width, y, width, height, index === attachment ? color : `${color}cc`);
  const topX = start + attachment * width;
  const bottomX = start + bottomAttachment * width, triangleHeight = width * Math.sqrt(3) / 2;
  result += face([[topX, y], [topX + width, y], [topX + width / 2, y - triangleHeight]], `${color}aa`);
  result += face([[bottomX, y + height], [bottomX + width, y + height], [bottomX + width / 2, y + height + triangleHeight]], `${color}aa`);
  return result;
}

function squarePyramidNet(variant, color) {
  const configurations = [[82, 62], [72, 78], [88, 54], [68, 84], [78, 70], [74, 74]];
  const [side, triangleHeight] = configurations[variant % configurations.length];
  const x = 210 - side / 2, y = 150 - side / 2;
  return rect(x, y, side, side, color)
    + face([[x, y], [x + side, y], [210, y - triangleHeight]], `${color}aa`)
    + face([[x + side, y], [x + side, y + side], [x + side + triangleHeight, 150]], `${color}bb`)
    + face([[x + side, y + side], [x, y + side], [210, y + side + triangleHeight]], `${color}cc`)
    + face([[x, y + side], [x, y], [x - triangleHeight, 150]], `${color}dd`);
}

function squareFrustumNet(variant, color) {
  const configurations = [[80, 42, 61], [72, 38, 70], [88, 48, 52], [76, 34, 64], [84, 46, 56], [70, 40, 68], [86, 44, 54]];
  const [large, small, height] = configurations[variant % configurations.length];
  const x = 210 - large / 2, y = 150 - large / 2;
  const topLeft = 210 - small / 2, topY = y - height;
  const rightX = x + large + height, sideTop = 150 - small / 2;
  const bottomY = y + large + height, bottomLeft = 210 - small / 2;
  const leftX = x - height;
  const top = [[x, y], [x + large, y], [topLeft + small, topY], [topLeft, topY]];
  const right = [[x + large, y], [x + large, y + large], [rightX, sideTop + small], [rightX, sideTop]];
  const bottom = [[x + large, y + large], [x, y + large], [bottomLeft, bottomY], [bottomLeft + small, bottomY]];
  const left = [[x, y + large], [x, y], [leftX, sideTop], [leftX, sideTop + small]];
  const topSquare = rect(topLeft, topY - small, small, small, color);
  const content = rect(x, y, large, large, color) + face(top, `${color}bb`) + face(right, `${color}cc`) + face(bottom, `${color}aa`) + face(left, `${color}dd`) + topSquare;
  return `<g transform="rotate(${(variant % 4) * 90} 210 150)">${content}</g>`;
}

function pentagonalPyramidNet(variant, color) {
  const center = [210, 150], radius = variant ? 48 : 55, triangleHeight = variant ? 70 : 58;
  const pentagon = regularPolygon(center[0], center[1], radius, 5, -Math.PI / 2 + (variant ? Math.PI / 5 : 0));
  let result = face(pentagon, color);
  for (let index = 0; index < 5; index += 1) {
    const a = pentagon[index], b = pentagon[(index + 1) % 5], midpoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const vx = midpoint[0] - center[0], vy = midpoint[1] - center[1], length = Math.hypot(vx, vy);
    const apex = [midpoint[0] + vx / length * triangleHeight, midpoint[1] + vy / length * triangleHeight];
    result += face([a, b, apex], `${color}${["aa", "bb", "cc", "dd", "99"][index]}`);
  }
  return result;
}

function dodecahedronNet(variant, color) {
  const root = regularPolygon(210, 150, variant % 2 ? 22 : 23, 5, -Math.PI / 2 + (variant % 5) * Math.PI * 2 / 5);
  const firstRing = Array.from({ length: 5 }, (_, edge) => reflectPolygon(root, edge));
  const secondRing = firstRing.map((polygon) => reflectPolygon(polygon, farthestEdge(polygon)));
  const finalBranch = variant % 5;
  const final = reflectPolygon(secondRing[finalBranch], farthestEdge(secondRing[finalBranch]));
  return [root, ...firstRing, ...secondRing, final].map((polygon, index) => face(polygon, index === 0 ? color : `${color}${index % 2 ? "bb" : "88"}`)).join("");
}

function icosahedronNet(variant, color) {
  const side = 48, triangleHeight = side * Math.sqrt(3) / 2, startX = 78, baseY = 108;
  let result = "";
  for (let index = 0; index < 10; index += 1) {
    const x = startX + index * side / 2;
    const points = index % 2 === 0 ? [[x, baseY + triangleHeight], [x + side / 2, baseY], [x + side, baseY + triangleHeight]] : [[x, baseY], [x + side / 2, baseY + triangleHeight], [x + side, baseY]];
    result += face(points, index % 3 === 0 ? color : `${color}bb`);
    if (index % 2 === 1) result += face([[x, baseY], [x + side / 2, baseY - triangleHeight], [x + side, baseY]], `${color}88`);
    else result += face([[x, baseY + triangleHeight], [x + side / 2, baseY + triangleHeight * 2], [x + side, baseY + triangleHeight]], `${color}99`);
  }
  return `<g transform="rotate(${(variant % 5) * 36} 210 150)">${result}</g>`;
}

const line = (x1, y1, x2, y2, hidden = false) => `<line class="edge ${hidden ? "hidden" : "visible"}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const path = (d, hidden = false) => `<path class="edge ${hidden ? "hidden" : "visible"}" d="${d}"/>`;
const polyline = (points, hidden = false) => `<polyline class="edge ${hidden ? "hidden" : "visible"}" points="${points}"/>`;

export function renderSightDrawing(type) {
  const drawings = {
    cube: cubeSight,
    cuboid: cuboidSight,
    cone: coneSight,
    cylinder: cylinderSight,
    "triangular-prism": triangularPrismSight,
    "square-pyramid": squarePyramidSight,
    "pentagonal-pyramid": pentagonalPyramidSight,
    "square-frustum": squareFrustumSight,
    "triangular-pyramid": triangularPyramidSight,
    octahedron: octahedronSight,
    dodecahedron: dodecahedronSight,
    icosahedron: icosahedronSight
  };
  return `<g data-sight-drawing="true" data-solid-type="${type}">${drawings[type]()}</g>`;
}

function cubeSight() { return polyline("45,48 105,48 105,108 45,108 45,48") + polyline("75,27 135,27 135,87 105,108") + line(45,48,75,27) + line(105,48,135,27) + line(75,27,75,87,true) + line(75,87,135,87,true) + line(45,108,75,87,true); }
function cuboidSight() { return polyline("27,55 111,55 111,103 27,103 27,55") + polyline("65,31 151,31 151,79 111,103") + line(27,55,65,31) + line(111,55,151,31) + line(65,31,65,79,true) + line(65,79,151,79,true) + line(27,103,65,79,true); }
function coneSight() { return line(90,18,38,101) + line(90,18,142,101) + path("M38 101 A52 17 0 0 0 142 101") + path("M38 101 A52 17 0 0 1 142 101", true); }
function cylinderSight() { return path("M42 35 A48 16 0 0 1 138 35 A48 16 0 0 1 42 35") + line(42,35,42,98) + line(138,35,138,98) + path("M42 98 A48 16 0 0 0 138 98") + path("M42 98 A48 16 0 0 1 138 98", true); }
function triangularPrismSight() { return polyline("32,98 69,39 104,98 32,98") + polyline("78,79 116,23 151,82") + line(32,98,78,79) + line(69,39,116,23) + line(104,98,151,82) + line(78,79,151,82,true); }
function squarePyramidSight() { return polyline("35,92 91,113 148,88") + line(148,88,91,66,true) + line(91,66,35,92,true) + line(91,19,35,92) + line(91,19,148,88) + line(91,19,91,113) + line(91,19,91,66,true); }
function pentagonalPyramidSight() { return polyline("34,82 61,108 101,111 146,84") + line(146,84,91,61,true) + line(91,61,34,82,true) + line(91,18,34,82) + line(91,18,61,108) + line(91,18,101,111) + line(91,18,146,84) + line(91,18,91,61,true); }
function squareFrustumSight() { return polyline("34,91 93,112 149,88") + line(149,88,92,69,true) + line(92,69,34,91,true) + polyline("60,55 94,66 126,53 93,43 60,55") + line(34,91,60,55) + line(93,112,94,66) + line(149,88,126,53) + line(92,69,93,43,true); }
function triangularPyramidSight() { return polyline("38,98 96,114 147,83") + line(147,83,38,98,true) + line(91,20,38,98) + line(91,20,96,114) + line(91,20,147,83); }
function octahedronSight() { return polyline("25,67 90,36 155,67 90,98 25,67") + line(90,12,25,67) + line(90,12,155,67) + line(90,12,90,36) + line(90,122,25,67) + line(90,122,155,67) + line(90,122,90,98) + line(90,12,90,98,true) + line(90,122,90,36,true); }
function dodecahedronSight() { return regularPolyhedronSight("dodecahedron"); }
function icosahedronSight() { return regularPolyhedronSight("icosahedron"); }

const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSAHEDRON_VERTICES = [
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, 1], [-PHI, 0, -1]
];
const squaredDistance3 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const ICOSAHEDRON_EDGES = [];
for (let first = 0; first < ICOSAHEDRON_VERTICES.length; first += 1) {
  for (let second = first + 1; second < ICOSAHEDRON_VERTICES.length; second += 1) {
    if (Math.abs(squaredDistance3(ICOSAHEDRON_VERTICES[first], ICOSAHEDRON_VERTICES[second]) - 4) < 1e-6) ICOSAHEDRON_EDGES.push([first, second]);
  }
}
const edgeKey = (first, second) => first < second ? `${first}:${second}` : `${second}:${first}`;
const ICOSAHEDRON_EDGE_SET = new Set(ICOSAHEDRON_EDGES.map(([first, second]) => edgeKey(first, second)));
const ICOSAHEDRON_FACES = [];
for (let first = 0; first < 12; first += 1) {
  for (let second = first + 1; second < 12; second += 1) {
    for (let third = second + 1; third < 12; third += 1) {
      if (ICOSAHEDRON_EDGE_SET.has(edgeKey(first, second)) && ICOSAHEDRON_EDGE_SET.has(edgeKey(second, third)) && ICOSAHEDRON_EDGE_SET.has(edgeKey(first, third))) ICOSAHEDRON_FACES.push([first, second, third]);
    }
  }
}
const faceCenter3 = (indices) => indices.reduce((sum, index) => sum.map((value, axis) => value + ICOSAHEDRON_VERTICES[index][axis]), [0, 0, 0]).map((value) => value / indices.length);
const DODECAHEDRON_VERTICES = ICOSAHEDRON_FACES.map(faceCenter3);
const DODECAHEDRON_EDGES = [];
for (let first = 0; first < ICOSAHEDRON_FACES.length; first += 1) {
  for (let second = first + 1; second < ICOSAHEDRON_FACES.length; second += 1) {
    const shared = ICOSAHEDRON_FACES[first].filter((vertex) => ICOSAHEDRON_FACES[second].includes(vertex));
    if (shared.length === 2) DODECAHEDRON_EDGES.push([first, second, shared]);
  }
}
const rotate3 = ([x, y, z]) => {
  const angleX = -0.34, angleY = 0.52, angleZ = -0.08;
  const afterX = [x, y * Math.cos(angleX) - z * Math.sin(angleX), y * Math.sin(angleX) + z * Math.cos(angleX)];
  const afterY = [afterX[0] * Math.cos(angleY) + afterX[2] * Math.sin(angleY), afterX[1], -afterX[0] * Math.sin(angleY) + afterX[2] * Math.cos(angleY)];
  return [afterY[0] * Math.cos(angleZ) - afterY[1] * Math.sin(angleZ), afterY[0] * Math.sin(angleZ) + afterY[1] * Math.cos(angleZ), afterY[2]];
};
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const subtract3 = (a, b) => a.map((value, axis) => value - b[axis]);
const dot3 = (a, b) => a.reduce((sum, value, axis) => sum + value * b[axis], 0);
function projectedVertices(vertices) {
  const rotated = vertices.map(rotate3);
  const minX = Math.min(...rotated.map(([x]) => x)), maxX = Math.max(...rotated.map(([x]) => x));
  const minY = Math.min(...rotated.map(([, y]) => y)), maxY = Math.max(...rotated.map(([, y]) => y));
  const scale = Math.min(126 / (maxX - minX), 104 / (maxY - minY));
  return { rotated, projected: rotated.map(([x, y]) => [90 + (x - (minX + maxX) / 2) * scale, 68 - (y - (minY + maxY) / 2) * scale]) };
}
function outwardFaceIsVisible(faceIndices, rotatedVertices) {
  const [a, b, c] = faceIndices.map((index) => rotatedVertices[index]);
  let normal = cross3(subtract3(b, a), subtract3(c, a));
  const center = a.map((value, axis) => (value + b[axis] + c[axis]) / 3);
  if (dot3(normal, center) < 0) normal = normal.map((value) => -value);
  return normal[2] > 0;
}
function regularPolyhedronSight(type) {
  const isIcosahedron = type === "icosahedron";
  const vertices = isIcosahedron ? ICOSAHEDRON_VERTICES : DODECAHEDRON_VERTICES;
  const edges = isIcosahedron ? ICOSAHEDRON_EDGES : DODECAHEDRON_EDGES;
  const { rotated, projected } = projectedVertices(vertices);
  const visibleFaces = isIcosahedron ? ICOSAHEDRON_FACES.map((faceIndices) => outwardFaceIsVisible(faceIndices, rotated)) : null;
  const rendered = edges.map((edge) => {
    const [first, second] = edge;
    let isVisible;
    if (isIcosahedron) {
      const adjacentFaces = ICOSAHEDRON_FACES.map((faceIndices, index) => faceIndices.includes(first) && faceIndices.includes(second) ? index : -1).filter((index) => index >= 0);
      isVisible = adjacentFaces.some((index) => visibleFaces[index]);
    } else {
      isVisible = edge[2].some((icosahedronVertex) => rotate3(ICOSAHEDRON_VERTICES[icosahedronVertex])[2] > 0);
    }
    return { isVisible, svg: line(round(projected[first][0]), round(projected[first][1]), round(projected[second][0]), round(projected[second][1]), !isVisible) };
  });
  return `<g data-polyhedron="${type}" data-vertex-count="${vertices.length}" data-edge-count="${edges.length}">${rendered.filter(({ isVisible }) => !isVisible).map(({ svg }) => svg).join("")}${rendered.filter(({ isVisible }) => isVisible).map(({ svg }) => svg).join("")}</g>`;
}
