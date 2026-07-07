import test from "node:test";
import assert from "node:assert/strict";
import {
  ARRIVAL_FLOW,
  ARRIVAL_INTERVALS,
  STORAGE_STATUS,
  TRANSPORT_SHARE,
  WAIT_TIMES,
  checkDashboardInterpretationAnswer,
  getDashboardInterpretationSummary,
  getMostVacantStorage,
  getPeakArrival,
  getShortestWaitRoute,
  getTopStorageTransport
} from "../src/data-interpretation-logic.mjs";

test("4map4 dashboard data uses varied table and graph sources", () => {
  assert.deepEqual(ARRIVAL_INTERVALS, ["08:00~08:09", "08:10~08:19", "08:20~08:29", "08:30~08:39", "08:40~08:49"]);
  assert.deepEqual(ARRIVAL_FLOW, [14, 22, 35, 50, 29]);
  assert.equal(TRANSPORT_SHARE.reduce((sum, item) => sum + item.percent, 0), 100);
  assert.equal(STORAGE_STATUS.length, 4);
  assert.equal(WAIT_TIMES.length, 4);
});

test("dashboard interpretation finds peak, largest share, most vacancy, and shortest wait", () => {
  assert.deepEqual(getPeakArrival(), {
    index: 3,
    interval: "08:30~08:39",
    count: 50
  });
  assert.deepEqual(getTopStorageTransport(), {
    label: "자전거",
    percent: 36,
    needsStorage: true
  });
  assert.deepEqual(getMostVacantStorage(), {
    code: "C",
    label: "후문 보관소",
    emptySpots: 18
  });
  assert.deepEqual(getShortestWaitRoute(), {
    label: "후문 동선",
    minutes: 3
  });
});

test("dashboard summary guides bicycle students to the back gate storage", () => {
  const summary = getDashboardInterpretationSummary();
  assert.equal(summary.guideTarget, "자전거");
  assert.equal(summary.guidePlace, "후문 보관소");
  assert.equal(summary.guideRoute, "후문 동선");
});

test("dashboard answer checker accepts interpretation-based subjective answers", () => {
  assert.equal(checkDashboardInterpretationAnswer({
    busiestInterval: "4",
    topTransport: "자전거",
    emptySpots: "18",
    bestStorage: "후문 보관소",
    shortestRoute: "후문 동선"
  }).correct, true);

  assert.equal(checkDashboardInterpretationAnswer({
    busiestInterval: "08:30~08:39",
    topTransport: "자전거",
    emptySpots: 18,
    bestStorage: "C",
    shortestRoute: "후문"
  }).correct, true);

  assert.equal(checkDashboardInterpretationAnswer({
    busiestInterval: "3",
    topTransport: "인라인스케이트",
    emptySpots: "11",
    bestStorage: "운동장",
    shortestRoute: "운동장"
  }).correct, false);
});
