const freezeSegments = (segments) => Object.freeze(segments.map((segment) => Object.freeze({ ...segment })));
const freezePoint = (point) => Object.freeze({ ...point });
const round2 = (value) => Number(Number(value).toFixed(2));

export const DIRECTION_LABELS = Object.freeze({
  east: "동쪽",
  west: "서쪽",
  north: "북쪽",
  south: "남쪽"
});

const DIRECTION_VECTORS = Object.freeze({
  east: Object.freeze({ x: 1, y: 0 }),
  west: Object.freeze({ x: -1, y: 0 }),
  north: Object.freeze({ x: 0, y: -1 }),
  south: Object.freeze({ x: 0, y: 1 })
});

function makePuzzle({
  id,
  difficulty,
  title,
  roomNote,
  scaleMapCm,
  scaleRealM,
  widthCm,
  heightCm,
  start,
  segments,
  hazards = []
}) {
  return Object.freeze({
    id,
    difficulty,
    title,
    roomNote,
    scaleMapCm,
    scaleRealM,
    widthCm,
    heightCm,
    start: freezePoint(start),
    segments: freezeSegments(segments),
    hazards: Object.freeze(hazards.map((hazard) => Object.freeze({ ...hazard })))
  });
}

export const SIMILARITY_ROUTE_PUZZLES = Object.freeze([
  makePuzzle({
    id: "vent-shift",
    difficulty: "easy",
    title: "통풍구까지 이어지는 첫 경로",
    roomNote: "지도 왼쪽 아래의 축척을 확인하고, 경로 선분이 몇 칸인지 먼저 세어 보세요.",
    scaleMapCm: 1,
    scaleRealM: 2,
    widthCm: 8,
    heightCm: 8,
    start: { x: 1, y: 6 },
    segments: [
      { direction: "east", mapCm: 3 },
      { direction: "north", mapCm: 2 }
    ],
    hazards: [
      { x: 2.5, y: 3.3, width: 2.2, height: 1.1, label: "감지 바닥" }
    ]
  }),
  makePuzzle({
    id: "mirror-corridor",
    difficulty: "medium",
    title: "반사벽 사이의 ㄱ자 통로",
    roomNote: "지도는 1:250으로 실제 격실을 축소한 것입니다. 경로 선분이 몇 칸인지 먼저 세어 보세요.",
    scaleMapCm: 1,
    scaleRealM: 2.5,
    widthCm: 8,
    heightCm: 8,
    start: { x: 2, y: 7 },
    segments: [
      { direction: "north", mapCm: 2 },
      { direction: "east", mapCm: 3 },
      { direction: "north", mapCm: 1 }
    ],
    hazards: [
      { x: 3.1, y: 5.9, width: 2, height: 0.65, label: "왕복 레이저" },
      { x: 4.8, y: 3.8, width: 1.1, height: 1.4, label: "잠금벽" }
    ]
  }),
  makePuzzle({
    id: "final-hatch-scale",
    difficulty: "hard",
    title: "비상 해치 앞 축소 지도",
    roomNote: "지도는 1:400으로 표시되어 있습니다. 지도상의 칸 수를 실제 m 단위 이동 계획으로 바꾸세요.",
    scaleMapCm: 1,
    scaleRealM: 4,
    widthCm: 10,
    heightCm: 8,
    start: { x: 8, y: 7 },
    segments: [
      { direction: "west", mapCm: 2 },
      { direction: "north", mapCm: 3 },
      { direction: "east", mapCm: 3 }
    ],
    hazards: [
      { x: 5.9, y: 5.7, width: 1.9, height: 0.7, label: "압력판" },
      { x: 4.1, y: 3.7, width: 1.2, height: 1.3, label: "회전문" }
    ]
  })
]);

export function getScaleMetersPerCm(puzzle) {
  return round2(puzzle.scaleRealM / puzzle.scaleMapCm);
}

export function getScaleDenominator(puzzle) {
  return round2((puzzle.scaleRealM * 100) / puzzle.scaleMapCm);
}

export function movePoint(point, segment) {
  const vector = DIRECTION_VECTORS[segment.direction];
  if (!vector) throw new Error(`Unknown direction: ${segment.direction}`);
  return Object.freeze({
    x: round2(point.x + vector.x * segment.mapCm),
    y: round2(point.y + vector.y * segment.mapCm)
  });
}

export function getRoutePoints(puzzle, offset = { x: 0, y: 0 }) {
  const points = [Object.freeze({ x: round2(puzzle.start.x + offset.x), y: round2(puzzle.start.y + offset.y) })];
  for (const segment of puzzle.segments) {
    points.push(movePoint(points.at(-1), segment));
  }
  return Object.freeze(points);
}

export function getActualRoute(puzzle) {
  const metersPerCm = getScaleMetersPerCm(puzzle);
  return Object.freeze(puzzle.segments.map((segment) => Object.freeze({
    direction: segment.direction,
    label: DIRECTION_LABELS[segment.direction],
    mapCm: segment.mapCm,
    realM: round2(segment.mapCm * metersPerCm)
  })));
}

export function getEscapeAnswer(puzzle) {
  return Object.freeze({
    metersPerCm: getScaleMetersPerCm(puzzle),
    segments: getActualRoute(puzzle)
  });
}

export function isRouteInsideMap(puzzle) {
  return getRoutePoints(puzzle).every((point) => (
    point.x >= 0 &&
    point.x <= puzzle.widthCm &&
    point.y >= 0 &&
    point.y <= puzzle.heightCm
  ));
}

function nearlyEqual(left, right, tolerance = 0.02) {
  return Number.isFinite(left) && Math.abs(left - right) <= tolerance;
}

export function checkEscapePlan(puzzle, submittedScale, submittedSegments) {
  const answer = getEscapeAnswer(puzzle);
  const scaleCorrect = nearlyEqual(Number(submittedScale), answer.metersPerCm);
  const segmentResults = answer.segments.map((expected, index) => {
    const submitted = submittedSegments[index] ?? {};
    const directionCorrect = submitted.direction === expected.direction;
    const distanceCorrect = nearlyEqual(Number(submitted.distanceM), expected.realM);
    return Object.freeze({ directionCorrect, distanceCorrect, expected });
  });
  const directionCorrect = segmentResults.every((result) => result.directionCorrect);
  const distanceCorrect = segmentResults.every((result) => result.distanceCorrect);
  return Object.freeze({
    correct: scaleCorrect && directionCorrect && distanceCorrect,
    scaleCorrect,
    directionCorrect,
    distanceCorrect,
    segmentResults,
    answer
  });
}

export function createSimilarityRun() {
  return SIMILARITY_ROUTE_PUZZLES;
}
