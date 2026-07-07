export const SOLID_TYPES = Object.freeze([
  "cube",
  "cuboid",
  "cone",
  "cylinder",
  "triangular-prism",
  "square-pyramid",
  "pentagonal-pyramid",
  "square-frustum",
  "triangular-pyramid",
  "octahedron",
  "dodecahedron",
  "icosahedron"
]);

export const DIFFICULTY_POOLS = Object.freeze({
  easy: Object.freeze(["cube", "cuboid", "cone", "cylinder", "square-pyramid", "triangular-prism"]),
  medium: Object.freeze(["triangular-prism", "square-pyramid", "pentagonal-pyramid", "square-frustum", "triangular-pyramid", "cuboid"]),
  hard: Object.freeze(["dodecahedron", "icosahedron", "octahedron", "pentagonal-pyramid", "square-pyramid", "triangular-pyramid"])
});

const COLORS = Object.freeze([
  "#56d6c9", "#7bc8ff", "#b39cff", "#ffbc69", "#ef8f8f",
  "#68d391", "#e7c55c", "#f0a65f", "#d993d0", "#62c8e5"
]);
const makeQuestion = (id, solid, variant, accent, difficulty) => Object.freeze({ id, solid, variant, accent, difficulty });
const makeSeries = (prefix, solid, count, difficulty, colorOffset = 0) => Array.from({ length: count }, (_, index) => (
  makeQuestion(`${prefix}-${String(index + 1).padStart(2, "0")}`, solid, index, COLORS[(index + colorOffset) % COLORS.length], difficulty)
));

// 쉬움 20 + 생각 20 + 고난도 10 = 총 50문항.
export const NET_QUESTIONS = Object.freeze([
  ...makeSeries("cube", "cube", 8, "easy", 0),
  ...makeSeries("cuboid", "cuboid", 7, "easy", 2),
  ...makeSeries("cone", "cone", 5, "easy", 5),

  ...makeSeries("triangular-prism", "triangular-prism", 7, "medium", 1),
  ...makeSeries("square-frustum", "square-frustum", 7, "medium", 4),
  ...makeSeries("pentahedron-square-pyramid", "square-pyramid", 6, "medium", 7),

  ...makeSeries("dodecahedron", "dodecahedron", 5, "hard", 3),
  ...makeSeries("icosahedron", "icosahedron", 5, "hard", 6)
]);

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function makeDistinctPairDeck(questions, random) {
  const groups = [...new Set(questions.map(({ solid }) => solid))].map((solid) => shuffle(questions.filter((question) => question.solid === solid), random));
  const pairs = [];
  while (groups.some(({ length }) => length)) {
    const active = shuffle(groups.filter(({ length }) => length), random).sort((first, second) => second.length - first.length);
    if (active.length < 2) throw new Error("난이도별 연속 두 문항은 서로 다른 입체도형이어야 합니다.");
    const pair = [active[0].pop(), active[1].pop()];
    pairs.push(random() < 0.5 ? pair : pair.reverse());
  }
  return shuffle(pairs, random).flat();
}

function moveFreshChunkToFront(deck, previousIds, chunkSize) {
  if (!previousIds.size) return deck;
  for (let index = 0; index < deck.length; index += chunkSize) {
    const chunk = deck.slice(index, index + chunkSize);
    if (chunk.every(({ id }) => !previousIds.has(id))) {
      if (index === 0) return deck;
      return [...chunk, ...deck.slice(0, index), ...deck.slice(index + chunkSize)];
    }
  }
  return deck;
}

export function createChallengeSession(random = Math.random) {
  const previousIds = { easy: new Set(), medium: new Set(), hard: new Set() };
  let decks = { easy: [], medium: [], hard: [] };

  const refill = () => {
    const questionsAt = (difficulty) => NET_QUESTIONS.filter((question) => question.difficulty === difficulty);
    decks = {
      easy: moveFreshChunkToFront(makeDistinctPairDeck(questionsAt("easy"), random), previousIds.easy, 2),
      medium: moveFreshChunkToFront(makeDistinctPairDeck(questionsAt("medium"), random), previousIds.medium, 2),
      hard: moveFreshChunkToFront(shuffle(questionsAt("hard"), random), previousIds.hard, 1)
    };
  };

  const nextSet = () => {
    if (decks.easy.length < 2 || decks.medium.length < 2 || decks.hard.length < 1) refill();
    const easy = decks.easy.splice(0, 2);
    const medium = decks.medium.splice(0, 2);
    const hard = decks.hard.splice(0, 1);
    previousIds.easy = new Set(easy.map(({ id }) => id));
    previousIds.medium = new Set(medium.map(({ id }) => id));
    previousIds.hard = new Set(hard.map(({ id }) => id));
    return Object.freeze([...easy, ...medium, ...hard]);
  };

  refill();
  return Object.freeze({ nextSet });
}

export function createChallengeSet(random = Math.random) {
  return createChallengeSession(random).nextSet();
}

export function buildOptions(correctSolid, difficulty, random = Math.random) {
  const pool = DIFFICULTY_POOLS[difficulty];
  if (!pool || !pool.includes(correctSolid)) throw new Error("Unknown solid or difficulty");
  const distractors = shuffle(pool.filter((type) => type !== correctSolid), random).slice(0, 4);
  return shuffle([correctSolid, ...distractors], random);
}

export function advanceStreak(currentStreak, isCorrect, target = 5) {
  const streak = isCorrect ? currentStreak + 1 : 0;
  return Object.freeze({ streak, reset: !isCorrect, complete: streak >= target });
}
