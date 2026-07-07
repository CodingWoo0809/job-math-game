import test from "node:test";
import assert from "node:assert/strict";
import { GATE_TRAFFIC, TRAFFIC_INTERVALS, checkTrafficReportAnswer, getPeakInterval, getRelativeFrequencyRows, getTrafficReportSummary, sumCounts } from "../src/data-organization-logic.mjs";

test("school gate traffic data uses five ten-minute intervals", () => {
  assert.deepEqual(TRAFFIC_INTERVALS, ["08:00~08:09", "08:10~08:19", "08:20~08:29", "08:30~08:39", "08:40~08:49"]);
  assert.deepEqual(GATE_TRAFFIC.main.counts, [10, 15, 25, 30, 20]);
  assert.deepEqual(GATE_TRAFFIC.back.counts, [8, 12, 20, 25, 35]);
});

test("frequency totals and relative frequencies are easy to compare", () => {
  assert.equal(sumCounts(GATE_TRAFFIC.main.counts), 100);
  assert.equal(sumCounts(GATE_TRAFFIC.back.counts), 100);
  assert.deepEqual(getRelativeFrequencyRows(GATE_TRAFFIC.main).map((row) => row.percent), [10, 15, 25, 30, 20]);
  assert.deepEqual(getRelativeFrequencyRows(GATE_TRAFFIC.back).map((row) => row.percent), [8, 12, 20, 25, 35]);
});

test("peak intervals identify main gate then back gate congestion", () => {
  assert.deepEqual(getPeakInterval(GATE_TRAFFIC.main), {
    gate: "main",
    label: "정문",
    index: 3,
    interval: "08:30~08:39",
    frequency: 30,
    percent: 30
  });
  assert.deepEqual(getPeakInterval(GATE_TRAFFIC.back), {
    gate: "back",
    label: "후문",
    index: 4,
    interval: "08:40~08:49",
    frequency: 35,
    percent: 35
  });
});

test("traffic report summary chooses tables, line graph, and back gate helper", () => {
  const summary = getTrafficReportSummary();
  assert.equal(summary.exactTable, "도수분포표");
  assert.equal(summary.relativeTable, "상대도수분포표");
  assert.equal(summary.bestGraph, "꺾은선그래프");
  assert.equal(summary.helperGate, "후문");
});

test("traffic report checker accepts purpose-matched table and graph answers", () => {
  assert.equal(checkTrafficReportAnswer({
    exactTable: "도수분포표",
    relativeTable: "상대도수분포표",
    graphType: "꺾은선그래프",
    mainPeak: "4",
    backPeak: "5",
    helperGate: "후문"
  }).correct, true);
  assert.equal(checkTrafficReportAnswer({
    exactTable: "도수분포표",
    relativeTable: "상대도수분포표",
    graphType: "막대그래프",
    mainPeak: "4",
    backPeak: "5",
    helperGate: "후문"
  }).correct, false);
});
