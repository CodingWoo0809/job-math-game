export const ARRIVAL_INTERVALS = Object.freeze([
  "08:00~08:09",
  "08:10~08:19",
  "08:20~08:29",
  "08:30~08:39",
  "08:40~08:49"
]);

export const ARRIVAL_FLOW = Object.freeze([14, 22, 35, 50, 29]);

export const TRANSPORT_SHARE = Object.freeze([
  Object.freeze({ label: "자전거", percent: 36, needsStorage: true }),
  Object.freeze({ label: "인라인스케이트", percent: 24, needsStorage: true }),
  Object.freeze({ label: "킥보드", percent: 20, needsStorage: true }),
  Object.freeze({ label: "도보", percent: 20, needsStorage: false })
]);

export const STORAGE_STATUS = Object.freeze([
  Object.freeze({ code: "A", label: "정문 보관소", emptySpots: 4 }),
  Object.freeze({ code: "B", label: "운동장 보관소", emptySpots: 11 }),
  Object.freeze({ code: "C", label: "후문 보관소", emptySpots: 18 }),
  Object.freeze({ code: "D", label: "체육관 보관소", emptySpots: 9 })
]);

export const WAIT_TIMES = Object.freeze([
  Object.freeze({ label: "정문 동선", minutes: 8 }),
  Object.freeze({ label: "운동장 동선", minutes: 5 }),
  Object.freeze({ label: "후문 동선", minutes: 3 }),
  Object.freeze({ label: "체육관 동선", minutes: 6 })
]);

export function getPeakArrival() {
  const count = Math.max(...ARRIVAL_FLOW);
  const index = ARRIVAL_FLOW.indexOf(count);
  return Object.freeze({
    index,
    interval: ARRIVAL_INTERVALS[index],
    count
  });
}

export function getTopStorageTransport() {
  return TRANSPORT_SHARE
    .filter((item) => item.needsStorage)
    .reduce((best, item) => (item.percent > best.percent ? item : best));
}

export function getMostVacantStorage() {
  return STORAGE_STATUS.reduce((best, item) => (item.emptySpots > best.emptySpots ? item : best));
}

export function getShortestWaitRoute() {
  return WAIT_TIMES.reduce((best, item) => (item.minutes < best.minutes ? item : best));
}

export function getDashboardInterpretationSummary() {
  const peakArrival = getPeakArrival();
  const topTransport = getTopStorageTransport();
  const mostVacantStorage = getMostVacantStorage();
  const shortestWaitRoute = getShortestWaitRoute();
  return Object.freeze({
    peakArrival,
    topTransport,
    mostVacantStorage,
    shortestWaitRoute,
    guideTarget: topTransport.label,
    guidePlace: mostVacantStorage.label,
    guideRoute: shortestWaitRoute.label
  });
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/번/g, "")
    .toLowerCase();
}

function includesNormalized(value, needle) {
  return normalize(value).includes(normalize(needle));
}

function matchesInterval(value, expectedIndex) {
  const text = normalize(value);
  const asNumber = Number(text);
  if (Number.isInteger(asNumber) && asNumber === expectedIndex + 1) return true;
  return text.includes(normalize(ARRIVAL_INTERVALS[expectedIndex]));
}

function matchesStorage(value, storage) {
  const text = normalize(value);
  return text.includes(normalize(storage.label)) || text.includes(normalize(storage.code)) || text.includes("후문");
}

function matchesRoute(value, route) {
  const text = normalize(value);
  return text.includes(normalize(route.label)) || text.includes("후문");
}

export function checkDashboardInterpretationAnswer(submitted) {
  const summary = getDashboardInterpretationSummary();
  const checks = Object.freeze({
    busiestInterval: matchesInterval(submitted.busiestInterval, summary.peakArrival.index),
    topTransport: includesNormalized(submitted.topTransport, summary.topTransport.label),
    emptySpots: Number(submitted.emptySpots) === summary.mostVacantStorage.emptySpots,
    bestStorage: matchesStorage(submitted.bestStorage, summary.mostVacantStorage),
    shortestRoute: matchesRoute(submitted.shortestRoute, summary.shortestWaitRoute)
  });

  return Object.freeze({
    correct: Object.values(checks).every(Boolean),
    checks,
    summary
  });
}
