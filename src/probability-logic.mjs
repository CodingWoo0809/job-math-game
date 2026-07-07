function freezeGame(game) {
  return Object.freeze({
    ...game,
    tools: Object.freeze([...(game.tools ?? [])])
  });
}

export const CANDY_GAMES = Object.freeze([
  freezeGame({
    id: 1,
    title: "5의 배수 카드 게임",
    condition: "1부터 20까지의 숫자카드 중 1장을 뽑아 5의 배수가 나오면 사탕을 받는다.",
    totalOutcomes: 20,
    favorableOutcomes: 4,
    tools: ["숫자카드"]
  }),
  freezeGame({
    id: 2,
    title: "동전 두 개 게임",
    condition: "동전 2개를 동시에 던져 모두 앞면이 나오면 사탕을 받는다.",
    totalOutcomes: 4,
    favorableOutcomes: 1,
    tools: ["동전", "동전"]
  }),
  freezeGame({
    id: 3,
    title: "10면 주사위 게임",
    condition: "1부터 10까지의 눈이 있는 10면 주사위를 굴려 3의 배수가 나오면 사탕을 받는다.",
    totalOutcomes: 10,
    favorableOutcomes: 3,
    tools: ["10면 주사위"]
  })
]);

export function roundToHundredth(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getCandyGameProbability(game) {
  return Object.freeze({
    id: game.id,
    numerator: game.favorableOutcomes,
    denominator: game.totalOutcomes,
    percent: roundToHundredth((game.favorableOutcomes / game.totalOutcomes) * 100)
  });
}

export function getCandyGameProbabilities() {
  return CANDY_GAMES.map((game) => getCandyGameProbability(game));
}

export function getBestCandyGame() {
  return getCandyGameProbabilities().reduce((best, current) => (
    current.percent > best.percent ? current : best
  ));
}

export function formatProbabilityPercent(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
}

function isClosePercent(submitted, expected) {
  const value = Number(submitted);
  return Number.isFinite(value) && Math.abs(value - expected) <= 0.01;
}

export function checkCandyGameAnswer(submitted) {
  const probabilities = getCandyGameProbabilities();
  const best = getBestCandyGame();
  const percentResults = probabilities.map((probability) => {
    const key = `p${probability.id}`;
    return Object.freeze({
      key,
      expected: probability.percent,
      correct: isClosePercent(submitted[key], probability.percent)
    });
  });
  const bestValue = Number(submitted.best);
  const bestCorrect = Number.isInteger(bestValue) && bestValue === best.id;

  return Object.freeze({
    correct: bestCorrect && percentResults.every((result) => result.correct),
    bestCorrect,
    percentResults,
    probabilities: Object.freeze(probabilities),
    best
  });
}
