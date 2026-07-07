import { parseMoney } from "./math-logic.mjs";

export const AGE_DATA = Object.freeze({
  currentDifference: 4,
  yearsLater: 3,
  futureSum: 40,
  youngerAge: 15,
  olderAge: 19
});

export const AGE_SYSTEM = Object.freeze({
  currentDifference: "y-x=4",
  futureSum: "(x+3)+(y+3)=40",
  simplifiedFutureSum: "x+y=34"
});

function parseAge(value) {
  if (typeof value === "string") return parseMoney(value.replace(/살/g, ""));
  return parseMoney(value);
}

export function evaluateAges(youngerValue, olderValue) {
  const younger = parseAge(youngerValue);
  const older = parseAge(olderValue);
  if (younger === null || older === null) {
    return { ok: false, code: "missing", message: "동생과 형의 현재 나이를 모두 입력해 줘." };
  }
  if (younger === 18 && older === 22) {
    return { ok: false, code: "future-ages", message: "18살과 22살은 두 사람의 3년 뒤 나이야. 문제에서 묻는 현재 나이로 되돌려 봐." };
  }
  if (younger === AGE_DATA.olderAge && older === AGE_DATA.youngerAge) {
    return { ok: false, code: "reversed", message: "두 나이의 값은 맞지만 형과 동생이 바뀌었어. 형의 나이가 더 많아야 해." };
  }
  if (older - younger !== AGE_DATA.currentDifference) {
    return { ok: false, code: "wrong-difference", message: `입력한 현재 나이의 차는 ${older - younger}살이야. 형의 나이에서 동생의 나이를 빼면 4살이어야 해.` };
  }
  const futureSum = (younger + AGE_DATA.yearsLater) + (older + AGE_DATA.yearsLater);
  if (futureSum !== AGE_DATA.futureSum) {
    return { ok: false, code: "wrong-future-sum", message: `두 사람의 3년 뒤 나이 합은 ${futureSum}살이야. 단서의 40살과 같은지 확인해 봐.` };
  }
  if (younger !== AGE_DATA.youngerAge || older !== AGE_DATA.olderAge) {
    return { ok: false, code: "incorrect", message: "연립방정식 y-x=4, (x+3)+(y+3)=40을 함께 풀어 두 현재 나이를 다시 구해 봐." };
  }
  return { ok: true, code: "correct", message: "정답이야! 동생은 15살, 형은 19살이야." };
}
