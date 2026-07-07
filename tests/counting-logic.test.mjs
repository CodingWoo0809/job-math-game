import test from "node:test";
import assert from "node:assert/strict";
import { COUNTING_STAGES, PHOTO_CHILDREN, checkCountingStageAnswer, factorial, getCountingStageAnswer, girlsAtBothEndsLineups, girlsTogetherLineups, permutation } from "../src/counting-logic.mjs";

test("photo lineup uses four boys and three girls", () => {
  assert.deepEqual(PHOTO_CHILDREN, { boys: 4, girls: 3, total: 7 });
  assert.equal(COUNTING_STAGES.length, 2);
  assert.deepEqual(COUNTING_STAGES.map((stage) => stage.type), ["girls-together", "girls-at-ends"]);
});

test("factorial and permutation support the lineup calculations", () => {
  assert.equal(factorial(5), 120);
  assert.equal(factorial(3), 6);
  assert.equal(permutation(3, 2), 6);
});

test("girls together is calculated by treating the girls as one block", () => {
  assert.equal(girlsTogetherLineups({ boys: 4, girls: 3 }), 720);
  assert.deepEqual(getCountingStageAnswer(COUNTING_STAGES[0]), { ways: 720 });
});

test("girls at both ends chooses ordered end girls and arranges the middle", () => {
  assert.equal(girlsAtBothEndsLineups({ boys: 4, girls: 3 }), 720);
  assert.deepEqual(getCountingStageAnswer(COUNTING_STAGES[1]), { ways: 720 });
});

test("counting answer checker requires the exact subjective answer", () => {
  assert.equal(checkCountingStageAnswer(COUNTING_STAGES[0], { ways: 720 }).correct, true);
  assert.equal(checkCountingStageAnswer(COUNTING_STAGES[1], { ways: 720 }).correct, true);
  assert.equal(checkCountingStageAnswer(COUNTING_STAGES[0], { ways: 5040 }).correct, false);
  assert.equal(checkCountingStageAnswer(COUNTING_STAGES[1], { ways: 360 }).correct, false);
});
