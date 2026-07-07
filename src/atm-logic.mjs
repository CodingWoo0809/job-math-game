import { parseMoney } from "./math-logic.mjs";

export const ATM_DATA = Object.freeze({
  academyFee: 300000,
  allowance: 50000,
  cashNeeded: 350000
});

export const ATM_FEE_ROWS = Object.freeze([
  Object.freeze({ key: "0-50000", label: "0원~50,000원", min: 0, max: 50000, rate: 0.15, extraFee: 300 }),
  Object.freeze({ key: "50001-100000", label: "50,001원~100,000원", min: 50001, max: 100000, rate: 0.12, extraFee: 250 }),
  Object.freeze({ key: "100001-200000", label: "100,001원~200,000원", min: 100001, max: 200000, rate: 0.1, extraFee: 200 }),
  Object.freeze({ key: "200001-300000", label: "200,001원~300,000원", min: 200001, max: 300000, rate: 0.08, extraFee: 150 }),
  Object.freeze({ key: "300001-400000", label: "300,001원~400,000원", min: 300001, max: 400000, rate: 0.06, extraFee: 100 }),
  Object.freeze({ key: "400001-500000", label: "400,001원~500,000원", min: 400001, max: 500000, rate: 0.05, extraFee: 50 })
]);

export function findFeeRow(amount) {
  if (!Number.isFinite(amount) || amount < 0) return null;
  return ATM_FEE_ROWS.find((row) => amount >= row.min && amount <= row.max) ?? null;
}

export function calculateAtmTransaction(amount) {
  const row = findFeeRow(amount);
  if (!row) return null;
  const percentageFee = Number((amount * row.rate / 100).toFixed(2));
  const totalFee = Number((percentageFee + row.extraFee).toFixed(2));
  const accountDebit = Number((amount + totalFee).toFixed(2));
  return Object.freeze({ amount, row, percentageFee, extraFee: row.extraFee, totalFee, accountDebit });
}

export const TARGET_TRANSACTION = calculateAtmTransaction(ATM_DATA.cashNeeded);

export function evaluateAtmPlan(ruleValue, cashNeededValue, intervalValue, percentageFeeValue, totalFeeValue, accountDebitValue) {
  const cashNeeded = parseMoney(cashNeededValue);
  const percentageFee = parseMoney(percentageFeeValue);
  const totalFee = parseMoney(totalFeeValue);
  const accountDebit = parseMoney(accountDebitValue);

  if (!ruleValue || !intervalValue || [cashNeeded, percentageFee, totalFee, accountDebit].some((value) => value === null)) {
    return { ok: false, code: "missing", message: "규칙을 고르고 계산 결과를 모두 입력해 줘." };
  }
  if (ruleValue !== "higher-lower") {
    return { ok: false, code: "wrong-rule", message: "거래 대금 구간이 커질수록 수수료율과 추가 수수료가 어떻게 달라지는지 표의 위아래 행을 비교해 봐." };
  }
  if (cashNeeded === ATM_DATA.academyFee) {
    return { ok: false, code: "missing-allowance", message: "학원비 300,000원만 계산했어. 용돈 50,000원도 함께 인출해야 해." };
  }
  if (cashNeeded !== ATM_DATA.cashNeeded) {
    return { ok: false, code: "wrong-cash-needed", message: "학원비 300,000원과 용돈 50,000원을 먼저 더해 필요한 현금을 구해 봐." };
  }
  if (intervalValue !== TARGET_TRANSACTION.row.key) {
    return { ok: false, code: "wrong-interval", message: "350,000원이 어느 거래 대금 구간에 포함되는지 구간의 양 끝값을 확인해 봐." };
  }
  if (percentageFee === 21000) {
    return { ok: false, code: "percent-as-decimal", message: "0.06%는 0.06이 아니라 0.0006을 곱해야 해. 계산기에서는 0.06을 입력한 뒤 %를 눌러도 돼." };
  }
  if (percentageFee !== TARGET_TRANSACTION.percentageFee) {
    return { ok: false, code: "wrong-percentage-fee", message: "비율 수수료는 350,000 × 0.06%로 계산해 봐." };
  }
  if (totalFee === TARGET_TRANSACTION.percentageFee) {
    return { ok: false, code: "missing-extra-fee", message: "비율 수수료는 정확해. 해당 구간의 추가 수수료 100원도 더해야 해." };
  }
  if (totalFee !== TARGET_TRANSACTION.totalFee) {
    return { ok: false, code: "wrong-total-fee", message: "비율 수수료 210원과 추가 수수료 100원을 더해 총 수수료를 구해 봐." };
  }
  if (accountDebit === ATM_DATA.cashNeeded) {
    return { ok: false, code: "missing-fee-in-debit", message: "ATM은 인출할 현금과 수수료를 계좌에서 함께 차감해. 총 수수료를 더해 봐." };
  }
  if (accountDebit !== TARGET_TRANSACTION.accountDebit) {
    return { ok: false, code: "wrong-account-debit", message: "인출할 현금 350,000원에 총 수수료 310원을 더해 계좌 필요액을 구해 봐." };
  }

  return { ok: true, code: "correct", message: "정확해! 계좌에 350,310원이 있으면 학원비와 용돈을 한 번에 인출할 수 있어." };
}
