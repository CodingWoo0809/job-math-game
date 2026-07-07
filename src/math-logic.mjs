import { MAP_DATA } from "./map-data.mjs";

export function parseMoney(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : null;
  }

  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\s,원]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  return Number.parseInt(cleaned, 10);
}

export function formatMoney(value) {
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

export function calculateMapCosts(data = MAP_DATA) {
  const itemCosts = Object.fromEntries(
    data.items.map((item) => [item.id, item.quantity * item.unitPrice])
  );
  const subtotal = Object.values(itemCosts).reduce((sum, cost) => sum + cost, 0);
  const total = subtotal + data.deliveryFee;
  const remaining = data.budget - total;

  return {
    itemCosts,
    subtotal,
    total,
    remaining,
    invoiceDifference: data.billedTotal - total
  };
}

export const CORRECT_COSTS = Object.freeze(calculateMapCosts());

export function evaluateCostAnswers(totalValue, remainingValue) {
  const total = parseMoney(totalValue);
  const remaining = parseMoney(remainingValue);

  if (total === null || remaining === null) {
    return { ok: false, code: "missing", message: "빈칸에 숫자를 모두 입력해 줘." };
  }

  if (total === CORRECT_COSTS.total && remaining === CORRECT_COSTS.remaining) {
    return { ok: true, code: "correct", message: "좋아! 실제 비용과 남은 예산이 모두 정확해." };
  }

  if (total === 64700) {
    return {
      ok: false,
      code: "unit-prices-only",
      message: "단가만 더한 것 같아. 같은 재료가 여러 개이므로 수량과 단가를 곱해 보자."
    };
  }

  if (total === CORRECT_COSTS.subtotal) {
    return {
      ok: false,
      code: "missing-delivery",
      message: "재료 비용은 맞아. 납품을 위해 추가되는 계약 배송비도 전체 비용에 포함해 보자."
    };
  }

  if (total === MAP_DATA.billedTotal) {
    return {
      ok: false,
      code: "copied-invoice",
      message: "계산서의 값을 그대로 사용했어. 주문서와 계약서의 정보로 실제 비용을 직접 확인해 보자."
    };
  }

  if (total === CORRECT_COSTS.total + MAP_DATA.deliveryFee) {
    return {
      ok: false,
      code: "duplicate-delivery",
      message: "배송비 6,000원을 두 번 더한 것 같아. 계약 배송비는 전체 비용에 한 번만 포함해 보자."
    };
  }

  if (total === CORRECT_COSTS.remaining) {
    return {
      ok: false,
      code: "swapped-values",
      message: "2,500원은 예산에서 남는 돈이야. 실제로 지불할 전체 금액을 다시 확인해 보자."
    };
  }

  if (total === CORRECT_COSTS.total) {
    return {
      ok: false,
      code: "wrong-remaining",
      message: "전체 비용은 정확해. 최대 예산 170,000원에서 전체 비용을 빼 보자."
    };
  }

  if (remaining === CORRECT_COSTS.remaining) {
    return {
      ok: false,
      code: "wrong-total",
      message: "남은 예산은 맞아. 수량과 단가를 이용해 전체 비용을 다시 확인해 보자."
    };
  }

  return {
    ok: false,
    code: "incorrect",
    message: "수량 × 단가로 각 재료의 비용을 구한 뒤, 계약 배송비 1회분을 한 번만 더해 보자."
  };
}

export function evaluateInvoiceAnswer(selectedRow, correctedFeeValue) {
  const correctedFee = parseMoney(correctedFeeValue);

  if (!selectedRow || correctedFee === null) {
    return { ok: false, code: "missing", message: "오류 항목을 선택하고 올바른 금액을 입력해 줘." };
  }

  if (selectedRow !== "delivery") {
    return {
      ok: false,
      code: "wrong-row",
      message: "선택한 재료 비용은 실제 계산과 같아. 별도로 청구된 항목을 살펴보자."
    };
  }

  if (correctedFee !== MAP_DATA.deliveryFee) {
    return {
      ok: false,
      code: "wrong-fee",
      message: "오류 항목은 찾았어. 차량 앞쪽의 계약서에 적힌 정확한 배송비를 다시 확인해 보자."
    };
  }

  return { ok: true, code: "correct", message: "계산서의 오류를 정확히 찾았어!" };
}
