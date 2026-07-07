import test from "node:test";
import assert from "node:assert/strict";
import { CONVERSION_TASKS } from "../src/map3-data.mjs";
import { convertUnits, evaluateConversionAnswer } from "../src/conversion-logic.mjs";

test("map3 covers all requested unit conversions", () => {
  const pairs = CONVERSION_TASKS.map((task) => `${task.source}->${task.targetUnit}`);
  assert.ok(pairs.some((pair) => pair.includes("L") && pair.endsWith("mL")));
  assert.ok(pairs.some((pair) => pair.includes("시간") && pair.endsWith("분")));
  assert.ok(pairs.some((pair) => pair.includes("분") && pair.includes("초") && pair.endsWith("초")));
  assert.ok(pairs.some((pair) => pair.includes("kg") && pair.endsWith("g")));
  assert.ok(pairs.some((pair) => pair.includes("km") && pair.endsWith("cm")));
});

test("all conversion answers match the design", () => {
  const expected = { coolant: 2075, schedule: 95, timer: 200, equipment: 4025, route: 125000 };
  for (const task of CONVERSION_TASKS) {
    assert.equal(convertUnits(task.id), expected[task.id]);
    assert.equal(evaluateConversionAnswer(task.id, String(expected[task.id])).ok, true);
  }
});

test("representative unit mistakes receive targeted feedback", () => {
  assert.equal(evaluateConversionAnswer("coolant", "275").code, "targeted");
  assert.equal(evaluateConversionAnswer("schedule", "135").code, "targeted");
  assert.equal(evaluateConversionAnswer("timer", "320").code, "targeted");
  assert.equal(evaluateConversionAnswer("equipment", "425").code, "targeted");
  assert.equal(evaluateConversionAnswer("route", "1250").code, "targeted");
});
