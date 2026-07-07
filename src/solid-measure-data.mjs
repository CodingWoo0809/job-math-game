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

export const SOLID_MEASURE_STAGES = Object.freeze([
  makeStage({
    id: "insulation-case",
    difficulty: "기초 · 전개도와 겉넓이",
    title: "액체 전기 보온 케이스 점검",
    type: "rectangular-prism",
    note: "B-07의 식판 아래에는 직육면체 모양 보온 케이스가 있다. 가로 6 cm, 세로 4 cm, 높이 5 cm인 케이스의 전개도에 나타나는 모든 직사각형 넓이를 더해 겉넓이를 구하고, 케이스 안에 들어갈 수 있는 부피도 확인해야 한다.",
    help: "직육면체의 겉넓이는 마주 보는 면 3쌍의 넓이를 모두 더합니다. 부피는 가로×세로×높이입니다.",
    givens: { lengthCm: 6, widthCm: 4, heightCm: 5 },
    fields: [
      { key: "surfaceAreaCm2", label: "보온 케이스의 겉넓이", unit: "cm²", step: "1" },
      { key: "volumeCm3", label: "보온 케이스의 부피", unit: "cm³", step: "1" }
    ]
  }),
  makeStage({
    id: "cylinder-electricity",
    difficulty: "적용 · 원기둥 부피",
    title: "원기둥 컵의 액체 전기 양",
    type: "cylinder-volume",
    note: "현재 반지름이 7 cm, 높이가 12 cm인 원기둥 모양 컵에 액체 전기가 가득 담겨 있다. 이 액체를 전부 원뿔 컵으로 옮길 예정이므로, 먼저 원기둥 컵에 들어 있는 액체 전기의 부피를 구해야 한다.",
    help: "원기둥의 부피는 밑면의 넓이×높이입니다. π는 그대로 두고 π 앞의 수만 입력하세요.",
    givens: { radiusCm: 7, heightCm: 12 },
    fields: [
      { key: "cylinderVolumePiCm3", label: "원기둥 컵의 액체 전기 부피", unit: "π cm³", step: "1" }
    ]
  }),
  makeStage({
    id: "cone-cup-height",
    difficulty: "종합 · 원뿔 부피",
    title: "B-07이 좋아하는 원뿔 컵 설계",
    type: "cone-transfer",
    note: "B-07은 밑면의 반지름이 7 cm인 원뿔 컵에 액체 전기가 정확히 가득 차야만 기분이 좋아진다. 원기둥 컵의 액체 전기를 모두 옮겼을 때 원뿔 컵이 가득 차려면, 원뿔 컵의 높이는 몇 cm여야 할까?",
    help: "원뿔의 부피는 밑면의 넓이×높이×1/3입니다. 앞에서 구한 원기둥 부피와 같아지도록 높이를 구하세요.",
    givens: { cylinderRadiusCm: 7, cylinderHeightCm: 12, coneRadiusCm: 7 },
    fields: [
      { key: "coneHeightCm", label: "원뿔 컵의 높이", unit: "cm", step: "0.1" }
    ]
  })
]);

export function rectangularPrismSurfaceArea(length, width, height) {
  return round2(2 * (length * width + length * height + width * height));
}

export function rectangularPrismVolume(length, width, height) {
  return round2(length * width * height);
}

export function cylinderVolumePiCoefficient(radius, height) {
  return round2(radius ** 2 * height);
}

export function coneVolumePiCoefficient(radius, height) {
  return round2((radius ** 2 * height) / 3);
}

export function coneHeightForSameVolume(cylinderRadius, cylinderHeight, coneRadius) {
  const cylinderVolumePi = cylinderVolumePiCoefficient(cylinderRadius, cylinderHeight);
  return round2((3 * cylinderVolumePi) / (coneRadius ** 2));
}

export function getSolidStageAnswer(stage) {
  if (stage.type === "rectangular-prism") {
    const { lengthCm, widthCm, heightCm } = stage.givens;
    return Object.freeze({
      surfaceAreaCm2: rectangularPrismSurfaceArea(lengthCm, widthCm, heightCm),
      volumeCm3: rectangularPrismVolume(lengthCm, widthCm, heightCm)
    });
  }
  if (stage.type === "cylinder-volume") {
    const { radiusCm, heightCm } = stage.givens;
    return Object.freeze({
      cylinderVolumePiCm3: cylinderVolumePiCoefficient(radiusCm, heightCm)
    });
  }
  if (stage.type === "cone-transfer") {
    const { cylinderRadiusCm, cylinderHeightCm, coneRadiusCm } = stage.givens;
    return Object.freeze({
      coneHeightCm: coneHeightForSameVolume(cylinderRadiusCm, cylinderHeightCm, coneRadiusCm)
    });
  }
  throw new Error(`Unknown solid measure stage: ${stage.type}`);
}

function nearlyEqual(left, right, tolerance = 0.02) {
  return Number.isFinite(left) && Math.abs(left - right) <= tolerance;
}

export function checkSolidStageAnswer(stage, submitted) {
  const answer = getSolidStageAnswer(stage);
  const fieldResults = stage.fields.map((field) => {
    const submittedValue = Number(submitted[field.key]);
    const correct = nearlyEqual(submittedValue, answer[field.key]);
    return Object.freeze({ key: field.key, label: field.label, correct, expected: answer[field.key] });
  });
  return Object.freeze({
    correct: fieldResults.every((field) => field.correct),
    fieldResults,
    answer
  });
}

export function createSolidMeasureRun() {
  return SOLID_MEASURE_STAGES;
}
