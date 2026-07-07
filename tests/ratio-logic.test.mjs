import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMixture, evaluateMonkeyDistribution, MIXTURE_DATA, MONKEY_DATA } from "../src/ratio-logic.mjs";

test("monkey weights simplify to 2:3:5 and allocate all bananas", () => {
  assert.deepEqual(MONKEY_DATA.simplestRatio, [2, 3, 5]);
  assert.deepEqual(MONKEY_DATA.allocation, [6, 9, 15]);
  assert.equal(MONKEY_DATA.allocation.reduce((sum, value) => sum + value, 0), 30);
  assert.equal(evaluateMonkeyDistribution([2, 3, 5], [6, 9, 15]).ok, true);
});

test("equal banana shares are rejected as non-proportional", () => {
  assert.equal(evaluateMonkeyDistribution([2, 3, 5], [10, 10, 10]).code, "equal-not-proportional");
});

test("equivalent but unsimplified weight ratios request simplification", () => {
  assert.equal(evaluateMonkeyDistribution([4, 6, 10], [6, 9, 15]).code, "not-simplest");
});

test("forest nutrient mixture uses 1:5 for a total of 24 L", () => {
  assert.equal(MIXTURE_DATA.concentrate, 4);
  assert.equal(MIXTURE_DATA.water, 20);
  assert.equal(evaluateMixture(4, 20).ok, true);
  assert.equal(evaluateMixture(12, 12).code, "wrong-ratio");
  assert.equal(evaluateMixture(3, 15).code, "wrong-total");
});
