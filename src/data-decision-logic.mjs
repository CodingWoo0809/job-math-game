export const WAIT_TIME_RECORDS = Object.freeze([
  Object.freeze({ day: "월", minutes: 6, note: "정상" }),
  Object.freeze({ day: "화", minutes: 8, note: "정상" }),
  Object.freeze({ day: "수", minutes: 6, note: "정상" }),
  Object.freeze({ day: "목", minutes: 10, note: "정상" }),
  Object.freeze({ day: "금", minutes: 40, note: "프린터 고장" }),
  Object.freeze({ day: "다음 월", minutes: 9, note: "정상" }),
  Object.freeze({ day: "다음 화", minutes: 12, note: "정상" })
]);

export const DECISION_CONTEXT = Object.freeze({
  purpose: "과제 제출 줄의 보통 대기시간 안내",
  extremeCause: "프린터 고장으로 생긴 40분 기록",
  finalNotice: "평소 대기시간은 약 9분"
});

export function getWaitTimes() {
  return WAIT_TIME_RECORDS.map((record) => record.minutes);
}

export function getSortedWaitTimes() {
  return [...getWaitTimes()].sort((a, b) => a - b);
}

export function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

export function mean(values) {
  return sum(values) / values.length;
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const center = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[center - 1] + sorted[center]) / 2 : sorted[center];
}

export function modes(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const maxCount = Math.max(...counts.values());
  return [...counts.entries()]
    .filter(([, count]) => count === maxCount)
    .map(([value]) => value)
    .sort((a, b) => a - b);
}

export function getDecisionSummary() {
  const waitTimes = getWaitTimes();
  const sortedData = getSortedWaitTimes();
  const average = mean(waitTimes);
  const center = median(waitTimes);
  const frequent = modes(waitTimes);
  return Object.freeze({
    rawData: Object.freeze([...waitTimes]),
    sortedData: Object.freeze(sortedData),
    mean: average,
    median: center,
    modes: Object.freeze(frequent),
    selectedRepresentative: "중앙값",
    selectedValue: center,
    finalNotice: DECISION_CONTEXT.finalNotice,
    reason: "평균은 40분이라는 극단적인 값 때문에 커지고, 최빈값 6분은 짧게 기다린 날만 반복된 값이라 보통 대기시간 안내에 부족하다. 중앙값은 자료를 작은 수부터 놓았을 때 가운데 값이라 극단값의 영향을 덜 받는다."
  });
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function parseNumbers(value) {
  return (String(value ?? "").match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

function matchesNumber(value, expected) {
  const [number] = parseNumbers(value);
  return Number.isFinite(number) && Math.abs(number - expected) < 0.001;
}

function matchesNumberList(value, expected) {
  const numbers = parseNumbers(value);
  return numbers.length === expected.length && numbers.every((number, index) => Math.abs(number - expected[index]) < 0.001);
}

function includesNormalized(value, needle) {
  return normalize(value).includes(normalize(needle));
}

export function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function checkWaitTimeDecisionAnswer(submitted) {
  const summary = getDecisionSummary();
  const checks = Object.freeze({
    sortedData: matchesNumberList(submitted.sortedData, summary.sortedData),
    meanValue: matchesNumber(submitted.meanValue, summary.mean),
    medianValue: matchesNumber(submitted.medianValue, summary.median),
    modeValue: matchesNumberList(submitted.modeValue, summary.modes),
    representativeValue: includesNormalized(submitted.representativeValue, summary.selectedRepresentative)
  });

  return Object.freeze({
    correct: Object.values(checks).every(Boolean),
    checks,
    summary
  });
}
