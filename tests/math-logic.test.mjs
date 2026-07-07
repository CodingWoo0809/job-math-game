import test from "node:test";
import assert from "node:assert/strict";
import {
  CORRECT_COSTS,
  calculateMapCosts,
  evaluateCostAnswers,
  evaluateInvoiceAnswer,
  parseMoney
} from "../src/math-logic.mjs";

test("map costs match the design document", () => {
  const costs = calculateMapCosts();
  assert.deepEqual(costs.itemCosts, { flour: 55500, milk: 51200, butter: 54800 });
  assert.equal(costs.subtotal, 161500);
  assert.equal(costs.total, 167500);
  assert.equal(costs.remaining, 2500);
  assert.equal(costs.invoiceDifference, 5000);
});

test("money parser accepts commas and won labels", () => {
  assert.equal(parseMoney("167,500원"), 167500);
  assert.equal(parseMoney(" 2 500 "), 2500);
  assert.equal(parseMoney("abc"), null);
  assert.equal(parseMoney("-100"), null);
});

test("correct cost answers pass", () => {
  assert.equal(evaluateCostAnswers("167500", "2,500").ok, true);
  assert.equal(CORRECT_COSTS.total, 167500);
});

test("representative wrong answers return targeted feedback", () => {
  assert.equal(evaluateCostAnswers("64700", "0").code, "unit-prices-only");
  assert.equal(evaluateCostAnswers("161500", "8500").code, "missing-delivery");
  assert.equal(evaluateCostAnswers("172500", "0").code, "copied-invoice");
  assert.equal(evaluateCostAnswers("173500", "0").code, "duplicate-delivery");
  assert.equal(evaluateCostAnswers("2500", "167500").code, "swapped-values");
});

test("invoice correction requires the delivery row and contracted fee", () => {
  assert.equal(evaluateInvoiceAnswer("delivery", "6000").ok, true);
  assert.equal(evaluateInvoiceAnswer("flour", "6000").code, "wrong-row");
  assert.equal(evaluateInvoiceAnswer("delivery", "11000").code, "wrong-fee");
});
