import test from "node:test";
import assert from "node:assert/strict";
import {
  ATM_DATA,
  ATM_FEE_ROWS,
  TARGET_TRANSACTION,
  calculateAtmTransaction,
  evaluateAtmPlan,
  findFeeRow
} from "../src/atm-logic.mjs";

test("ATM fee table uses amount intervals with decreasing rates and extra fees", () => {
  assert.equal(ATM_FEE_ROWS.length, 6);
  for (let index = 1; index < ATM_FEE_ROWS.length; index += 1) {
    assert.ok(ATM_FEE_ROWS[index].rate < ATM_FEE_ROWS[index - 1].rate);
    assert.ok(ATM_FEE_ROWS[index].extraFee < ATM_FEE_ROWS[index - 1].extraFee);
    assert.ok(ATM_FEE_ROWS[index].rate.toString().split(".")[1]?.length <= 2);
  }
});

test("350000 won belongs to the 300001-400000 interval", () => {
  assert.equal(findFeeRow(350000)?.key, "300001-400000");
  assert.equal(findFeeRow(50000)?.key, "0-50000");
  assert.equal(findFeeRow(50001)?.key, "50001-100000");
});

test("academy fee and allowance require a 350310 won account balance", () => {
  assert.equal(ATM_DATA.academyFee + ATM_DATA.allowance, 350000);
  assert.deepEqual(
    {
      percentageFee: TARGET_TRANSACTION.percentageFee,
      extraFee: TARGET_TRANSACTION.extraFee,
      totalFee: TARGET_TRANSACTION.totalFee,
      accountDebit: TARGET_TRANSACTION.accountDebit
    },
    { percentageFee: 210, extraFee: 100, totalFee: 310, accountDebit: 350310 }
  );
  assert.equal(calculateAtmTransaction(350000)?.row.rate, 0.06);
});

test("correct ATM plan is accepted", () => {
  const result = evaluateAtmPlan("higher-lower", 350000, "300001-400000", 210, 310, 350310);
  assert.equal(result.ok, true);
});

test("ATM plan rejects common mistakes", () => {
  assert.equal(evaluateAtmPlan("higher-lower", 300000, "200001-300000", 240, 390, 300390).code, "missing-allowance");
  assert.equal(evaluateAtmPlan("higher-lower", 350000, "200001-300000", 210, 310, 350310).code, "wrong-interval");
  assert.equal(evaluateAtmPlan("higher-lower", 350000, "300001-400000", 21000, 21100, 371100).code, "percent-as-decimal");
  assert.equal(evaluateAtmPlan("higher-lower", 350000, "300001-400000", 210, 210, 350210).code, "missing-extra-fee");
  assert.equal(evaluateAtmPlan("higher-lower", 350000, "300001-400000", 210, 310, 350000).code, "missing-fee-in-debit");
});
