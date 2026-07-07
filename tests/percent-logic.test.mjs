import test from "node:test";
import assert from "node:assert/strict";
import { evaluateDiscount, evaluateProfit, evaluateSalary, PERCENT_DATA } from "../src/percent-logic.mjs";

test("salary proposal has an 8 percent actual raise and 10 percent promised pay", () => {
  assert.equal(PERCENT_DATA.salary.increase / PERCENT_DATA.salary.oldPay * 100, 8);
  assert.equal(PERCENT_DATA.salary.oldPay * 1.1, 2750000);
  assert.equal(evaluateSalary(8, 2750000).ok, true);
  assert.equal(evaluateSalary(10, 2750000).code, "accepted-claim");
});

test("safety equipment discount rate is 15 percent", () => {
  assert.equal(PERCENT_DATA.discount.listPrice - PERCENT_DATA.discount.salePrice, 75000);
  assert.equal(PERCENT_DATA.discount.discountAmount / PERCENT_DATA.discount.listPrice * 100, 15);
  assert.equal(evaluateDiscount(75000, 15).ok, true);
});

test("cost-based project profit rate is 20 percent", () => {
  assert.equal(PERCENT_DATA.profit.revenue - PERCENT_DATA.profit.cost, 800000);
  assert.equal(PERCENT_DATA.profit.profit / PERCENT_DATA.profit.cost * 100, 20);
  assert.equal(evaluateProfit(800000, 20).ok, true);
});
