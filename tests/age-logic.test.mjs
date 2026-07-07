import test from "node:test";
import assert from "node:assert/strict";
import { AGE_DATA, AGE_SYSTEM, evaluateAges } from "../src/age-logic.mjs";

test("brothers' ages satisfy the current difference and future sum", () => {
  assert.equal(AGE_DATA.olderAge - AGE_DATA.youngerAge, 4);
  assert.equal((AGE_DATA.youngerAge + 3) + (AGE_DATA.olderAge + 3), 40);
});

test("age clues are represented as a system of two linear equations", () => {
  assert.equal(AGE_SYSTEM.currentDifference, "y-x=4");
  assert.equal(AGE_SYSTEM.futureSum, "(x+3)+(y+3)=40");
  assert.equal(AGE_SYSTEM.simplifiedFutureSum, "x+y=34");
});

test("younger 15 and older 19 is the accepted answer", () => {
  assert.equal(evaluateAges(15, 19).ok, true);
  assert.equal(evaluateAges("15살", "19살").ok, true);
});

test("age answer detects future ages and reversed roles", () => {
  assert.equal(evaluateAges(18, 22).code, "future-ages");
  assert.equal(evaluateAges(19, 15).code, "reversed");
  assert.equal(evaluateAges(14, 20).code, "wrong-difference");
  assert.equal(evaluateAges(13, 17).code, "wrong-future-sum");
});
