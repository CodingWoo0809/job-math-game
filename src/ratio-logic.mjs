import { parseMoney } from "./math-logic.mjs";

export const MONKEY_DATA = Object.freeze({
  weights: [12, 18, 30],
  simplestRatio: [2, 3, 5],
  totalBananas: 30,
  allocation: [6, 9, 15]
});

export const MIXTURE_DATA = Object.freeze({
  ratio: [1, 5],
  totalLiters: 24,
  concentrate: 4,
  water: 20
});

function parseValues(values) {
  return values.map(parseMoney);
}

export function evaluateMonkeyDistribution(ratioValues, bananaValues) {
  const ratio = parseValues(ratioValues);
  const bananas = parseValues(bananaValues);
  if ([...ratio, ...bananas].some((value) => value === null)) {
    return { ok: false, code: "missing", message: "비와 바나나 수를 모두 숫자로 입력해 줘." };
  }
  if (!ratio.every((value, index) => value === MONKEY_DATA.simplestRatio[index])) {
    if (ratio[0] * 3 === ratio[1] * 2 && ratio[0] * 5 === ratio[2] * 2) {
      return { ok: false, code: "not-simplest", message: "몸무게와 같은 비이지만 가장 간단한 자연수의 비로 더 줄여 보자." };
    }
    return { ok: false, code: "wrong-ratio", message: "12:18:30을 공통으로 나눌 수 있는 수를 찾아 가장 간단한 비로 나타내 보자." };
  }
  const sum = bananas.reduce((total, value) => total + value, 0);
  if (sum !== MONKEY_DATA.totalBananas) {
    return { ok: false, code: "wrong-total", message: `세 바구니의 바나나는 모두 ${MONKEY_DATA.totalBananas}개가 되어야 해. 지금은 ${sum}개야.` };
  }
  if (bananas.every((value) => value === 10)) {
    return { ok: false, code: "equal-not-proportional", message: "똑같이 10개씩 나누면 몸무게 차이를 반영하지 못해. 2:3:5의 각 몫에 같은 수를 곱해 보자." };
  }
  if (!bananas.every((value, index) => value === MONKEY_DATA.allocation[index])) {
    return { ok: false, code: "not-proportional", message: "바나나 수의 비도 2:3:5가 되어야 해. 전체 30개를 비의 합 10으로 먼저 나누어 보자." };
  }
  return { ok: true, code: "correct", message: "몸무게의 비에 맞는 공정한 분배야!" };
}

export function evaluateMixture(concentrateValue, waterValue) {
  const concentrate = parseMoney(concentrateValue);
  const water = parseMoney(waterValue);
  if (concentrate === null || water === null) {
    return { ok: false, code: "missing", message: "원액과 물의 양을 모두 입력해 줘." };
  }
  const total = concentrate + water;
  if (total !== MIXTURE_DATA.totalLiters) {
    return { ok: false, code: "wrong-total", message: `완성할 영양액은 24 L야. 지금 설정한 전체 양은 ${total} L야.` };
  }
  if (water !== concentrate * 5) {
    return { ok: false, code: "wrong-ratio", message: "원액과 물의 비는 1:5야. 물은 원액의 5배가 되어야 해." };
  }
  return { ok: true, code: "correct", message: "원액 4 L와 물 20 L, 혼합비가 정확해!" };
}

