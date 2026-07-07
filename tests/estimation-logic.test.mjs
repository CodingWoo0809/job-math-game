import test from "node:test";
import assert from "node:assert/strict";
import { ESTIMATION_TASKS } from "../src/map2-data.mjs";
import { estimateToPlace, evaluateEstimationAnswer } from "../src/estimation-logic.mjs";

test("textbook-style rounding example gives 460", () => {
  assert.equal(estimateToPlace(457, 10, "반올림"), 460);
});

test("all map2 estimation answers match their task data", () => {
  for (const task of ESTIMATION_TASKS) {
    assert.equal(estimateToPlace(task.value, task.place, task.method), task.answer);
    assert.equal(evaluateEstimationAnswer(task.id, String(task.answer)).ok, true);
  }
});

test("map2 uses the required textbook sentence form", () => {
  for (const task of ESTIMATION_TASKS) {
    assert.match(task.prompt, new RegExp(`을 ${task.method}하여 ${task.placeName}의 자리까지 나타내세요\\.$`));
  }
});

test("representative place-value mistakes receive targeted feedback", () => {
  assert.equal(evaluateEstimationAnswer("sales", "4,500,000").code, "rounded-down");
  assert.equal(evaluateEstimationAnswer("sales", "4,580,000").code, "wrong-place");
  assert.equal(evaluateEstimationAnswer("budget", "2,300,000").code, "rounded-down");
  assert.equal(evaluateEstimationAnswer("deposit", "1,290,000").code, "rounded-instead");
});
