import { parseMoney } from "./math-logic.mjs";
import { ESTIMATION_TASKS } from "./map2-data.mjs";

export function estimateToPlace(value, place, method) {
  if (!Number.isFinite(value) || !Number.isFinite(place) || place <= 0) return null;
  const scaled = value / place;
  if (method === "반올림") return Math.round(scaled) * place;
  if (method === "올림") return Math.ceil(scaled) * place;
  if (method === "버림") return Math.floor(scaled) * place;
  return null;
}

export function getEstimationTask(taskId) {
  return ESTIMATION_TASKS.find((task) => task.id === taskId) ?? null;
}

export function evaluateEstimationAnswer(taskId, inputValue) {
  const task = getEstimationTask(taskId);
  const input = parseMoney(inputValue);
  if (!task) return { ok: false, code: "unknown-task", message: "문제 정보를 다시 확인해 줘." };
  if (input === null) return { ok: false, code: "missing", message: "숫자로 답을 입력해 줘." };
  if (input === task.answer) {
    return { ok: true, code: "correct", message: `${task.method}한 값이 정확해! 정산 도장이 찍혔어.` };
  }

  if (taskId === "sales" && input === 4500000) {
    return {
      ok: false,
      code: "rounded-down",
      message: "만의 자리 숫자는 7이야. 5 이상이므로 십만의 자리 숫자 5를 1 크게 해 보자."
    };
  }
  if (taskId === "sales" && input === 4580000) {
    return {
      ok: false,
      code: "wrong-place",
      message: "만의 자리까지가 아니라 십만의 자리까지 나타내야 해. 만의 자리 이하를 0으로 나타내 보자."
    };
  }
  if (taskId === "budget" && input === 2300000) {
    return {
      ok: false,
      code: "rounded-down",
      message: "올림한 예산은 실제 비용보다 작아질 수 없어. 다음 십만 단위의 수로 나타내 보자."
    };
  }
  if (taskId === "budget" && input === 2350000) {
    return {
      ok: false,
      code: "wrong-place",
      message: "십만의 자리까지 나타내야 해. 만의 자리 이하를 모두 0으로 나타내 보자."
    };
  }
  if (taskId === "deposit" && input === 1290000) {
    return {
      ok: false,
      code: "rounded-instead",
      message: "반올림이 아니라 버림이야. 천의 자리 이하를 그대로 버리고 0으로 나타내 보자."
    };
  }
  if (taskId === "deposit" && input === 1287000) {
    return {
      ok: false,
      code: "wrong-place",
      message: "만의 자리까지 나타내야 해. 천의 자리 이하를 모두 0으로 나타내 보자."
    };
  }
  if (input % task.place !== 0) {
    return {
      ok: false,
      code: "place-not-zeroed",
      message: `${task.placeName}의 자리까지 나타내므로 그 아래 자리의 숫자는 모두 0으로 나타내야 해.`
    };
  }

  const direction = input < task.value ? "작아" : "커";
  return {
    ok: false,
    code: "incorrect",
    message: `입력한 값은 원래 수보다 ${direction}. ${task.method}의 방법과 ${task.placeName}의 자리를 다시 확인해 보자.`
  };
}

