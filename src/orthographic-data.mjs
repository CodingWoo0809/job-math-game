const freezeGrid = (grid) => Object.freeze(grid.map((row) => Object.freeze([...row])));
const makeQuestion = (id, difficulty, title, heights) => Object.freeze({ id, difficulty, title, heights: freezeGrid(heights) });

export const ORTHOGRAPHIC_QUESTIONS = Object.freeze([
  makeQuestion("single-core", "easy", "단일 중심 기둥", [
    [1, 1, 1],
    [1, 3, 1],
    [1, 1, 1]
  ]),
  makeQuestion("split-towers", "easy", "엇갈린 두 기둥", [
    [0, 2, 1],
    [1, 1, 1],
    [4, 0, 0]
  ]),
  makeQuestion("ridge-three", "easy", "가운데 세 기둥", [
    [1, 1, 1],
    [2, 3, 2],
    [1, 1, 1]
  ]),

  makeQuestion("stair-pair", "medium", "꺾인 통로의 두 기둥", [
    [3, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 1, 4]
  ]),
  makeQuestion("diagonal-three", "medium", "대각선 연결 구조", [
    [3, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 2, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 4]
  ]),
  makeQuestion("loading-ridge", "medium", "적재 선반 네 기둥", [
    [1, 1, 1, 1, 1],
    [2, 3, 4, 2, 1],
    [1, 1, 1, 1, 1]
  ]),

  makeQuestion("reverse-diagonal", "hard", "역대각선 삼중 구조", [
    [0, 0, 0, 1, 3],
    [0, 0, 0, 1, 0],
    [0, 1, 5, 1, 0],
    [0, 1, 0, 0, 0],
    [2, 1, 0, 0, 0]
  ]),
  makeQuestion("long-diagonal", "hard", "장축 계단 구조", [
    [5, 1, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0],
    [0, 1, 3, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 4, 1, 0],
    [0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1, 2]
  ]),
  makeQuestion("alternating-five", "hard", "교차 적재 구조", [
    [1, 1, 1, 1, 1],
    [2, 0, 3, 0, 5],
    [1, 1, 1, 1, 1],
    [0, 4, 0, 2, 0],
    [1, 1, 1, 1, 1]
  ])
]);

export function getOrthographicViews(heights) {
  const rows = heights.length;
  const columns = heights[0].length;
  const top = heights.map((row) => row.map((height) => Number(height > 0)));
  const front = Array.from({ length: columns }, (_, column) => Math.max(...heights.map((row) => row[column])));
  const leftProfile = heights.map((row) => Math.max(...row));
  return Object.freeze({
    top: freezeGrid(top),
    front: Object.freeze(front),
    right: Object.freeze(leftProfile),
    left: Object.freeze([...leftProfile].reverse()),
    rows,
    columns
  });
}

export function getStructureAnswers(heights) {
  const flat = heights.flat();
  return Object.freeze({
    totalLayers: Math.max(...flat),
    secondLayerCubes: flat.filter((height) => height >= 2).length
  });
}

export function checkProjectionAnswer(question, totalLayers, secondLayerCubes) {
  const answer = getStructureAnswers(question.heights);
  const totalCorrect = Number(totalLayers) === answer.totalLayers;
  const secondCorrect = Number(secondLayerCubes) === answer.secondLayerCubes;
  return Object.freeze({ correct: totalCorrect && secondCorrect, totalCorrect, secondCorrect, answer });
}

export function possibleSecondLayerCounts(question) {
  const views = getOrthographicViews(question.heights);
  const side = views.left;
  const candidates = [];
  for (let row = 0; row < views.rows; row += 1) {
    for (let column = 0; column < views.columns; column += 1) {
      if (views.top[row][column] && side[row] >= 2 && views.front[column] >= 2) candidates.push([row, column]);
    }
  }
  const counts = new Set();
  for (let mask = 0; mask < 2 ** candidates.length; mask += 1) {
    const selected = candidates.filter((_, index) => mask & (2 ** index));
    const frontSatisfied = views.front.every((height, column) => height < 2 || selected.some(([, selectedColumn]) => selectedColumn === column));
    const sideSatisfied = side.every((height, row) => height < 2 || selected.some(([selectedRow]) => selectedRow === row));
    if (frontSatisfied && sideSatisfied) counts.add(selected.length);
  }
  return counts;
}

export function createProjectionRun(random = Math.random) {
  const pick = (difficulty) => {
    const pool = ORTHOGRAPHIC_QUESTIONS.filter((question) => question.difficulty === difficulty);
    return pool[Math.floor(random() * pool.length)];
  };
  return Object.freeze([pick("easy"), pick("medium"), pick("hard")]);
}
