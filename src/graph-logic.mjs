export const TANK_POINTS = Object.freeze([
  Object.freeze({ time: 0, value: 120 }),
  Object.freeze({ time: 10, value: 180 }),
  Object.freeze({ time: 20, value: 160 }),
  Object.freeze({ time: 30, value: 100 }),
  Object.freeze({ time: 40, value: 140 }),
  Object.freeze({ time: 50, value: 140 })
]);

export const SPRINKLER_POINTS = Object.freeze([
  Object.freeze({ time: 0, value: 0 }),
  Object.freeze({ time: 5, value: 12 }),
  Object.freeze({ time: 10, value: 12 }),
  Object.freeze({ time: 15, value: 0 }),
  Object.freeze({ time: 20, value: 0 }),
  Object.freeze({ time: 25, value: 12 }),
  Object.freeze({ time: 30, value: 12 }),
  Object.freeze({ time: 35, value: 0 }),
  Object.freeze({ time: 40, value: 0 }),
  Object.freeze({ time: 45, value: 12 }),
  Object.freeze({ time: 50, value: 12 }),
  Object.freeze({ time: 55, value: 0 }),
  Object.freeze({ time: 60, value: 0 })
]);

export function segmentChange(points, startTime, endTime) {
  const start = points.find((point) => point.time === startTime);
  const end = points.find((point) => point.time === endTime);
  if (!start || !end || endTime <= startTime) return null;
  const difference = end.value - start.value;
  return {
    difference,
    rate: difference / (endTime - startTime),
    direction: difference > 0 ? "increase" : difference < 0 ? "decrease" : "constant"
  };
}

export function findFastestDecrease(points = TANK_POINTS) {
  let result = null;
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const change = segmentChange(points, start.time, end.time);
    if (change.direction === "decrease" && (!result || change.rate < result.rate)) {
      result = { start: start.time, end: end.time, ...change };
    }
  }
  return result;
}

export function evaluateTankGraph(descriptionValue, fastestDropValue) {
  if (!descriptionValue || !fastestDropValue) {
    return { ok: false, code: "missing", message: "그래프의 변화 설명과 가장 빠른 감소 구간을 모두 골라 줘." };
  }
  if (descriptionValue !== "up-down-up-flat") {
    return { ok: false, code: "wrong-description", message: "선이 오른쪽으로 갈 때 위로 향하는지, 아래로 향하는지, 수평인지 구간별로 살펴봐." };
  }
  if (fastestDropValue === "10-20") {
    return { ok: false, code: "slower-drop", message: "10~20분에도 물이 감소하지만 20L만 줄었어. 다른 감소 구간과 기울기를 비교해 봐." };
  }
  if (fastestDropValue !== "20-30") {
    return { ok: false, code: "wrong-fastest-drop", message: "같은 10분 동안 물의 양이 가장 많이 줄어든 구간을 찾아봐." };
  }
  return { ok: true, code: "correct", message: "정확해! 20~30분에 60L가 줄어 물이 가장 빠르게 감소했어." };
}

export function evaluateSprinklerGraph(periodValue, safeWindowValue) {
  if (!periodValue || !safeWindowValue) {
    return { ok: false, code: "missing", message: "반복 주기와 다음 안전 통과 시간을 모두 골라 줘." };
  }
  if (periodValue !== "20") {
    return { ok: false, code: "wrong-period", message: "같은 모양의 꼭짓점이 처음 나타난 시각과 다음에 나타난 시각의 차를 구해 봐." };
  }
  if (safeWindowValue === "30-35") {
    return { ok: false, code: "still-spraying", message: "30~35분에는 관수량이 12L/분에서 0으로 감소하는 중이어서 아직 물이 뿜어져." };
  }
  if (safeWindowValue !== "35-40") {
    return { ok: false, code: "wrong-window", message: "현재 시각 32분 이후, 그래프가 0에서 수평으로 이어지는 가장 가까운 5분 구간을 찾아봐." };
  }
  return { ok: true, code: "correct", message: "좋아! 관수 패턴은 20분마다 반복되고, 35~40분이 다음 안전 통과 시간이야." };
}
