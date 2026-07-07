import test from "node:test";
import assert from "node:assert/strict";
import {
  DECISION_CONTEXT,
  WAIT_TIME_RECORDS,
  checkWaitTimeDecisionAnswer,
  getDecisionSummary,
  getSortedWaitTimes,
  getWaitTimes,
  mean,
  median,
  modes,
  sum
} from "../src/data-decision-logic.mjs";

test("4map5 uses waiting-time records with one extreme value", () => {
  assert.equal(WAIT_TIME_RECORDS.length, 7);
  assert.deepEqual(getWaitTimes(), [6, 8, 6, 10, 40, 9, 12]);
  assert.deepEqual(getSortedWaitTimes(), [6, 6, 8, 9, 10, 12, 40]);
  assert.equal(DECISION_CONTEXT.extremeCause, "프린터 고장으로 생긴 40분 기록");
});

test("representative value helpers calculate mean, median, and mode", () => {
  const values = getWaitTimes();
  assert.equal(sum(values), 91);
  assert.equal(mean(values), 13);
  assert.equal(median(values), 9);
  assert.deepEqual(modes(values), [6]);
});

test("central value is better than mean or mode for the waiting-time notice", () => {
  const summary = getDecisionSummary();
  assert.equal(summary.mean, 13);
  assert.equal(summary.median, 9);
  assert.deepEqual(summary.modes, [6]);
  assert.equal(summary.selectedRepresentative, "중앙값");
  assert.equal(summary.selectedValue, 9);
  assert.equal(summary.finalNotice, "평소 대기시간은 약 9분");
});

test("wait-time decision checker accepts subjective data list and representative value", () => {
  assert.equal(checkWaitTimeDecisionAnswer({
    sortedData: "6, 6, 8, 9, 10, 12, 40",
    meanValue: "13",
    medianValue: "9",
    modeValue: "6",
    representativeValue: "중앙값"
  }).correct, true);

  assert.equal(checkWaitTimeDecisionAnswer({
    sortedData: "6 6 8 9 10 12 40",
    meanValue: "13분",
    medianValue: "9분",
    modeValue: "6분",
    representativeValue: "중앙값"
  }).correct, true);

  assert.equal(checkWaitTimeDecisionAnswer({
    sortedData: "6, 8, 6, 10, 40, 9, 12",
    meanValue: "13",
    medianValue: "9",
    modeValue: "6",
    representativeValue: "평균"
  }).correct, false);
});
