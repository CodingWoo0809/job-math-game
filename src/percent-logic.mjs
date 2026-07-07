import { parseMoney } from "./math-logic.mjs";

export const PERCENT_DATA = Object.freeze({
  salary: { oldPay: 2500000, offeredPay: 2700000, increase: 200000, actualRate: 8, promisedRate: 10, promisedPay: 2750000 },
  discount: { listPrice: 500000, salePrice: 425000, discountAmount: 75000, discountRate: 15 },
  profit: { cost: 4000000, revenue: 4800000, profit: 800000, profitRate: 20 }
});

function values(inputs) {
  return inputs.map(parseMoney);
}

export function evaluateSalary(rateValue, promisedPayValue) {
  const [rate, promisedPay] = values([rateValue, promisedPayValue]);
  if (rate === null || promisedPay === null) return { ok:false, code:"missing", message:"실제 인상률과 10% 인상 월급을 모두 입력해 줘." };
  if (rate !== 8) {
    if (rate === 10) return { ok:false, code:"accepted-claim", message:"10%는 약속한 비율이야. 실제 인상액 200,000원을 인상 전 월급 2,500,000원으로 나누어 봐." };
    return { ok:false, code:"wrong-rate", message:"인상률은 인상액 ÷ 인상 전 월급 × 100으로 계산해." };
  }
  if (promisedPay !== 2750000) return { ok:false, code:"wrong-pay", message:"10%를 0.10으로 나타내 2,500,000원에 곱한 금액을 기존 월급에 더해 봐." };
  return { ok:true, code:"correct", message:"실제 인상률은 8%, 약속한 10% 인상 월급은 2,750,000원이야." };
}

export function evaluateDiscount(amountValue, rateValue) {
  const [amount, rate] = values([amountValue, rateValue]);
  if (amount === null || rate === null) return { ok:false, code:"missing", message:"할인 금액과 할인율을 모두 입력해 줘." };
  if (amount !== 75000) return { ok:false, code:"wrong-amount", message:"표시 가격 500,000원에서 할인 가격 425,000원을 빼 할인 금액을 먼저 구해 봐." };
  if (rate !== 15) return { ok:false, code:"wrong-rate", message:"할인율은 할인 금액 ÷ 할인 전 표시 가격 × 100으로 계산해." };
  return { ok:true, code:"correct", message:"할인 금액 75,000원, 할인율 15%가 정확해." };
}

export function evaluateProfit(profitValue, rateValue) {
  const [profit, rate] = values([profitValue, rateValue]);
  if (profit === null || rate === null) return { ok:false, code:"missing", message:"이익과 손익률을 모두 입력해 줘." };
  if (profit !== 800000) return { ok:false, code:"wrong-profit", message:"판매 수익 4,800,000원에서 작업 원가 4,000,000원을 빼 이익을 구해 봐." };
  if (rate !== 20) return { ok:false, code:"wrong-rate", message:"이 문제의 손익률은 이익 ÷ 원가 × 100이야. 원가 4,000,000원을 기준으로 계산해." };
  return { ok:true, code:"correct", message:"이익 800,000원, 원가 기준 손익률 20%가 정확해." };
}

