import test from "node:test";
import assert from "node:assert/strict";
import { CANDY_GAMES, checkCandyGameAnswer, formatProbabilityPercent, getBestCandyGame, getCandyGameProbabilities, getCandyGameProbability } from "../src/probability-logic.mjs";

test("candy game uses three subtly similar probability situations", () => {
  assert.equal(CANDY_GAMES.length, 3);
  assert.deepEqual(CANDY_GAMES.map((game) => game.id), [1, 2, 3]);
  assert.deepEqual(CANDY_GAMES.map((game) => [game.favorableOutcomes, game.totalOutcomes]), [[4, 20], [1, 4], [3, 10]]);
  assert.equal(CANDY_GAMES[2].title, "10면 주사위 게임");
  assert.deepEqual(CANDY_GAMES[2].tools, ["10면 주사위"]);
});

test("candy game probabilities are represented as percents", () => {
  assert.deepEqual(getCandyGameProbabilities().map((item) => item.percent), [20, 25, 30]);
  assert.deepEqual(getCandyGameProbability(CANDY_GAMES[1]), {
    id: 2,
    numerator: 1,
    denominator: 4,
    percent: 25
  });
});

test("third candy game is the most favorable choice", () => {
  assert.equal(getBestCandyGame().id, 3);
  assert.equal(formatProbabilityPercent(20), "20");
  assert.equal(formatProbabilityPercent(25), "25");
  assert.equal(formatProbabilityPercent(30), "30");
});

test("candy game answer checker requires all three probabilities and the best game", () => {
  assert.equal(checkCandyGameAnswer({ p1: 20, p2: 25, p3: 30, best: 3 }).correct, true);
  assert.equal(checkCandyGameAnswer({ p1: "20", p2: "25", p3: "30", best: "3" }).correct, true);
  assert.equal(checkCandyGameAnswer({ p1: 20, p2: 24, p3: 30, best: 3 }).correct, false);
  assert.equal(checkCandyGameAnswer({ p1: 20, p2: 25, p3: 30, best: 2 }).correct, false);
});
