const round2 = (value) => Number(Number(value).toFixed(2));

function freezeFields(fields) {
  return Object.freeze(fields.map((field) => Object.freeze({ ...field })));
}

function makeStage({ id, difficulty, title, type, note, help, givens, fields }) {
  return Object.freeze({
    id,
    difficulty,
    title,
    type,
    note,
    help,
    givens: Object.freeze({ ...givens }),
    fields: freezeFields(fields)
  });
}

export const PLANE_GEOMETRY_STAGES = Object.freeze([
  makeStage({
    id: "rectangle-seal",
    difficulty: "기초 사각 패널",
    title: "압력문을 막는 직사각형 실링 패널",
    type: "rectangle",
    note: "압력문 틈을 막을 직사각형 실링 패널이 필요하다. 가로는 12 cm, 세로는 7 cm이다. 테두리를 한 바퀴 감쌀 둘레와 패널을 덮을 넓이를 입력해야 한다.",
    help: "직사각형의 둘레는 네 변의 길이를 모두 더하고, 넓이는 가로와 세로를 곱합니다.",
    givens: { widthCm: 12, heightCm: 7 },
    fields: [
      { key: "rectanglePerimeterCm", label: "실링 패널의 둘레", unit: "cm", step: "1" },
      { key: "rectangleAreaCm2", label: "실링 패널의 넓이", unit: "cm²", step: "1" }
    ]
  }),
  makeStage({
    id: "cable-core",
    difficulty: "기초 원 단면",
    title: "비상 전원 단자의 원형 심선",
    type: "circle",
    note: "비상 전선의 구리 심선 단면 넓이가 25π mm²로 표시되어 있다. 단자에 끼우려면 심선의 반지름과 둘레에 맞춘 절연 테이프 길이가 필요하다.",
    help: "π를 소수로 바꾸지 말고, π 앞의 수를 이용해 계산해 보세요.",
    givens: { areaPiMm2: 25 },
    fields: [
      { key: "radiusMm", label: "심선의 반지름", unit: "mm", step: "0.1" },
      { key: "circumferencePiMm", label: "심선을 한 바퀴 감쌀 길이", unit: "π mm", step: "1" }
    ]
  }),
  makeStage({
    id: "triangle-brace",
    difficulty: "응용 삼각 지지대",
    title: "삼각형 환풍구를 받치는 정삼각형 지지대",
    type: "equilateral",
    note: "환풍구 위로 접히는 삼각 지지대는 한 변이 10 cm인 정삼각형이다. 절단 장치는 지지대의 높이와 재료 넓이를 입력해야 작동한다.",
    help: "정삼각형을 반으로 나누면 30°-60°-90° 직각삼각형이 됩니다. √3은 그대로 두고 앞의 수를 입력하세요.",
    givens: { sideCm: 10 },
    fields: [
      { key: "triangleHeightRoot3Cm", label: "정삼각형의 높이", unit: "√3 cm", step: "0.1" },
      { key: "triangleAreaRoot3Cm2", label: "정삼각형의 넓이", unit: "√3 cm²", step: "0.1" }
    ]
  }),
  makeStage({
    id: "shield-ring",
    difficulty: "응용 도넛 단면",
    title: "레이저 렌즈를 덮는 도넛형 차폐 패치",
    type: "annulus",
    note: "작업대에는 가운데가 뚫린 원형 차폐 패치가 있다. 바깥 반지름은 8 cm, 안쪽 반지름은 5 cm이다. 패치 재료의 넓이와 절단해야 하는 전체 경계 길이를 입력해야 한다.",
    help: "π를 그대로 두고, 넓이와 둘레에서 π 앞의 수만 계산해 보세요.",
    givens: { outerRadiusCm: 8, innerRadiusCm: 5 },
    fields: [
      { key: "annulusAreaPiCm2", label: "차폐 패치의 넓이", unit: "π cm²", step: "1" },
      { key: "boundaryLengthPiCm", label: "전체 절단 경계 길이", unit: "π cm", step: "1" }
    ]
  }),
  makeStage({
    id: "wafer-dies",
    difficulty: "정밀 배치",
    title: "원형 감시 렌즈 위의 차광칩 배치",
    type: "wafer",
    note: "원형 감시 렌즈의 반지름은 5 cm이고, 정사각형 차광칩 한 변은 2 cm이다. 정렬 장치는 도면의 격자 위치에만 칩을 놓을 수 있으며, 원 안에 완전히 들어가는 칩만 사용할 수 있다.",
    help: "정사각형의 네 꼭짓점이 모두 원 안에 들어가는 칸만 세세요.",
    givens: { radiusCm: 5, dieSideCm: 2, offsetX: 0, offsetY: 1 },
    fields: [
      { key: "netDies", label: "사용 가능한 차광칩 수", unit: "개", step: "1", integer: true },
      { key: "coveredAreaCm2", label: "차광칩 전체 넓이", unit: "cm²", step: "0.1" }
    ]
  })
]);

export function circleRadiusFromPiArea(areaPiCoefficient) {
  return round2(Math.sqrt(areaPiCoefficient));
}

export function rectanglePerimeter(width, height) {
  return round2(2 * (width + height));
}

export function rectangleArea(width, height) {
  return round2(width * height);
}

export function circleCircumferencePiCoefficient(radius) {
  return round2(2 * radius);
}

export function equilateralTriangleHeightRoot3Coefficient(side) {
  return round2(side / 2);
}

export function equilateralTriangleAreaRoot3Coefficient(side) {
  return round2((side ** 2) / 4);
}

export function annulusAreaPiCoefficient(outerRadius, innerRadius) {
  return round2(outerRadius ** 2 - innerRadius ** 2);
}

export function annulusBoundaryPiCoefficient(outerRadius, innerRadius) {
  return round2(2 * (outerRadius + innerRadius));
}

export function getDieSquares(radius, side, offsetX = 0, offsetY = 0) {
  const squares = [];
  for (let x = -radius + offsetX; x < radius; x += side) {
    for (let y = -radius + offsetY; y < radius; y += side) {
      const corners = [[x, y], [x + side, y], [x, y + side], [x + side, y + side]];
      const inside = corners.every(([cx, cy]) => cx ** 2 + cy ** 2 <= radius ** 2 + 1e-9);
      squares.push(Object.freeze({ x: round2(x), y: round2(y), side, inside }));
    }
  }
  return Object.freeze(squares);
}

export function countNetDies(radius, side, offsetX = 0, offsetY = 0) {
  return getDieSquares(radius, side, offsetX, offsetY).filter((square) => square.inside).length;
}

export function getPlaneStageAnswer(stage) {
  if (stage.type === "rectangle") {
    const { widthCm, heightCm } = stage.givens;
    return Object.freeze({
      rectanglePerimeterCm: rectanglePerimeter(widthCm, heightCm),
      rectangleAreaCm2: rectangleArea(widthCm, heightCm)
    });
  }
  if (stage.type === "circle") {
    const radiusMm = circleRadiusFromPiArea(stage.givens.areaPiMm2);
    return Object.freeze({
      radiusMm,
      circumferencePiMm: circleCircumferencePiCoefficient(radiusMm)
    });
  }
  if (stage.type === "annulus") {
    const { outerRadiusCm, innerRadiusCm } = stage.givens;
    return Object.freeze({
      annulusAreaPiCm2: annulusAreaPiCoefficient(outerRadiusCm, innerRadiusCm),
      boundaryLengthPiCm: annulusBoundaryPiCoefficient(outerRadiusCm, innerRadiusCm)
    });
  }
  if (stage.type === "equilateral") {
    const { sideCm } = stage.givens;
    return Object.freeze({
      triangleHeightRoot3Cm: equilateralTriangleHeightRoot3Coefficient(sideCm),
      triangleAreaRoot3Cm2: equilateralTriangleAreaRoot3Coefficient(sideCm)
    });
  }
  if (stage.type === "wafer") {
    const { radiusCm, dieSideCm, offsetX, offsetY } = stage.givens;
    const netDies = countNetDies(radiusCm, dieSideCm, offsetX, offsetY);
    return Object.freeze({
      netDies,
      coveredAreaCm2: round2(netDies * dieSideCm ** 2)
    });
  }
  throw new Error(`Unknown plane geometry stage: ${stage.type}`);
}

function nearlyEqual(left, right, tolerance = 0.02) {
  return Number.isFinite(left) && Math.abs(left - right) <= tolerance;
}

export function checkPlaneStageAnswer(stage, submitted) {
  const answer = getPlaneStageAnswer(stage);
  const fieldResults = stage.fields.map((field) => {
    const submittedValue = Number(submitted[field.key]);
    const correct = field.integer ? submittedValue === answer[field.key] : nearlyEqual(submittedValue, answer[field.key]);
    return Object.freeze({ key: field.key, label: field.label, correct, expected: answer[field.key] });
  });
  return Object.freeze({
    correct: fieldResults.every((field) => field.correct),
    fieldResults,
    answer
  });
}

export function createPlaneGeometryRun() {
  return PLANE_GEOMETRY_STAGES;
}
