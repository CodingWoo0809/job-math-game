function freezeFields(fields) {
  return Object.freeze(fields.map((field) => Object.freeze({ ...field })));
}

function makeStage({ id, rule, title, type, note, help, givens, fields }) {
  return Object.freeze({
    id,
    rule,
    title,
    type,
    note,
    help,
    givens: Object.freeze({ ...givens }),
    fields: freezeFields(fields)
  });
}

export const PHOTO_CHILDREN = Object.freeze({
  boys: 4,
  girls: 3,
  total: 7
});

export const COUNTING_STAGES = Object.freeze([
  makeStage({
    id: "girls-together",
    rule: "곱의법칙 · 묶음으로 보기",
    title: "여아끼리 이웃하게 줄 세우기",
    type: "girls-together",
    note: "공원 사진 촬영을 준비하던 선생님은 남아 4명, 여아 3명을 한 줄로 세우려고 한다. 이때 여아 3명이 서로 이웃하게 서는 경우의 수를 구해야 한다.",
    help: "여아 3명을 하나의 묶음으로 생각하면 남아 4명과 여아 묶음 1개, 모두 5개의 대상을 배열합니다. 그 뒤 묶음 안의 여아 3명도 순서를 바꿀 수 있습니다.",
    givens: PHOTO_CHILDREN,
    fields: [
      { key: "ways", label: "여아끼리 이웃하게 서는 경우의 수", unit: "가지", step: "1" }
    ]
  }),
  makeStage({
    id: "girls-at-ends",
    rule: "순열 · 양 끝 자리 먼저 정하기",
    title: "여아를 양 끝에 배치해 줄 세우기",
    type: "girls-at-ends",
    note: "사진을 찍은 뒤 선생님은 한 장만 더 부탁한다. 이번에는 여아가 양 끝에 오도록 7명의 유치원생을 한 줄로 세우는 경우의 수를 알고 싶어 한다.",
    help: "양 끝에 설 여아를 순서를 고려해 고른 뒤, 가운데 5자리에 남은 아이들을 배열합니다.",
    givens: PHOTO_CHILDREN,
    fields: [
      { key: "ways", label: "여아가 양 끝에 서는 경우의 수", unit: "가지", step: "1" }
    ]
  })
]);

export function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error("factorial input must be a non-negative integer");
  let result = 1;
  for (let value = 2; value <= n; value += 1) result *= value;
  return result;
}

export function permutation(n, r) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
    throw new Error("permutation inputs must satisfy 0 <= r <= n");
  }
  return factorial(n) / factorial(n - r);
}

export function girlsTogetherLineups({ boys, girls }) {
  return factorial(boys + 1) * factorial(girls);
}

export function girlsAtBothEndsLineups({ boys, girls }) {
  return permutation(girls, 2) * factorial(boys + girls - 2);
}

export function getCountingStageAnswer(stage) {
  if (stage.type === "girls-together") {
    return Object.freeze({ ways: girlsTogetherLineups(stage.givens) });
  }
  if (stage.type === "girls-at-ends") {
    return Object.freeze({ ways: girlsAtBothEndsLineups(stage.givens) });
  }
  throw new Error(`Unknown counting stage: ${stage.type}`);
}

export function checkCountingStageAnswer(stage, submitted) {
  const answer = getCountingStageAnswer(stage);
  const fieldResults = stage.fields.map((field) => {
    const submittedValue = Number(submitted[field.key]);
    const correct = Number.isInteger(submittedValue) && submittedValue === answer[field.key];
    return Object.freeze({ key: field.key, label: field.label, correct, expected: answer[field.key] });
  });
  return Object.freeze({
    correct: fieldResults.every((field) => field.correct),
    fieldResults,
    answer
  });
}

export function createCountingRun() {
  return COUNTING_STAGES;
}
