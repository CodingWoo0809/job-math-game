import test from "node:test";
import assert from "node:assert/strict";
import {
  SPRINKLER_POINTS,
  TANK_POINTS,
  evaluateSprinklerGraph,
  evaluateTankGraph,
  findFastestDecrease,
  segmentChange
} from "../src/graph-logic.mjs";

test("tank graph contains increase, decrease, increase and constant changes", () => {
  assert.equal(segmentChange(TANK_POINTS, 0, 10).direction, "increase");
  assert.equal(segmentChange(TANK_POINTS, 10, 20).direction, "decrease");
  assert.equal(segmentChange(TANK_POINTS, 20, 30).direction, "decrease");
  assert.equal(segmentChange(TANK_POINTS, 30, 40).direction, "increase");
  assert.equal(segmentChange(TANK_POINTS, 40, 50).direction, "constant");
});

test("tank level decreases fastest from 20 to 30 minutes", () => {
  assert.deepEqual(findFastestDecrease(), {
    start: 20,
    end: 30,
    difference: -60,
    rate: -6,
    direction: "decrease"
  });
});

test("sprinkler graph repeats every 20 minutes", () => {
  for (let index = 0; index <= 4; index += 1) {
    assert.equal(SPRINKLER_POINTS[index].value, SPRINKLER_POINTS[index + 4].value);
    assert.equal(SPRINKLER_POINTS[index].value, SPRINKLER_POINTS[index + 8].value);
  }
});

test("correct graph explanations are accepted", () => {
  assert.equal(evaluateTankGraph("up-down-up-flat", "20-30").ok, true);
  assert.equal(evaluateSprinklerGraph("20", "35-40").ok, true);
});

test("representative graph mistakes receive targeted feedback", () => {
  assert.equal(evaluateTankGraph("up-down-up-flat", "10-20").code, "slower-drop");
  assert.equal(evaluateSprinklerGraph("10", "35-40").code, "wrong-period");
  assert.equal(evaluateSprinklerGraph("20", "30-35").code, "still-spraying");
});
