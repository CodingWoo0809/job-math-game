import test from "node:test";
import assert from "node:assert/strict";
import { DIFFICULTY_POOLS, NET_QUESTIONS, SOLID_TYPES, advanceStreak, buildOptions, createChallengeSession, createChallengeSet } from "../src/solid-net-data.mjs";

const fixedRandom = () => 0.37;

test("3map1 has exactly 50 unique tiered net questions", () => {
  assert.equal(NET_QUESTIONS.length, 50);
  assert.equal(new Set(NET_QUESTIONS.map((question) => question.id)).size, 50);
  assert.deepEqual(
    Object.fromEntries(["easy", "medium", "hard"].map((level) => [level, NET_QUESTIONS.filter((question) => question.difficulty === level).length])),
    { easy: 20, medium: 20, hard: 10 }
  );
  for (const question of NET_QUESTIONS) assert.ok(SOLID_TYPES.includes(question.solid));
});

test("ten consecutive runs use all 50 questions once before reshuffling", () => {
  let seed = 20250622;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const session = createChallengeSession(random);
  const runs = Array.from({ length: 10 }, () => session.nextSet());
  const allQuestions = runs.flat();
  assert.equal(allQuestions.length, 50);
  assert.equal(new Set(allQuestions.map(({ id }) => id)).size, 50);
  for (const run of runs) {
    assert.deepEqual(run.map(({ difficulty }) => difficulty), ["easy", "easy", "medium", "medium", "hard"]);
    assert.notEqual(run[0].solid, run[1].solid);
    assert.notEqual(run[2].solid, run[3].solid);
  }
  const eleventh = session.nextSet();
  assert.equal(eleventh.some(({ id }) => runs[9].some((previous) => previous.id === id)), false);
});

test("every five-question run follows easy, easy, medium, medium, hard", () => {
  const run = createChallengeSet(fixedRandom);
  assert.equal(run.length, 5);
  assert.deepEqual(run.map((question) => question.difficulty), ["easy", "easy", "medium", "medium", "hard"]);
  assert.equal(new Set(run.map((question) => question.id)).size, 5);
  assert.notEqual(run[0].solid, run[1].solid);
  assert.notEqual(run[2].solid, run[3].solid);
});

test("each tier creates five confusing unique options with one answer", () => {
  for (const question of NET_QUESTIONS) {
    assert.ok(DIFFICULTY_POOLS[question.difficulty].includes(question.solid));
    const options = buildOptions(question.solid, question.difficulty, fixedRandom);
    assert.equal(options.length, 5);
    assert.equal(new Set(options).size, 5);
    assert.equal(options.filter((type) => type === question.solid).length, 1);
    assert.ok(options.every((type) => DIFFICULTY_POOLS[question.difficulty].includes(type)));
  }
});

test("every hard question always includes its own correct sight drawing", () => {
  const randomValues = [0, 0.13, 0.37, 0.61, 0.99];
  for (const question of NET_QUESTIONS.filter(({ difficulty }) => difficulty === "hard")) {
    for (const value of randomValues) {
      const options = buildOptions(question.solid, question.difficulty, () => value);
      assert.equal(options.filter((type) => type === question.solid).length, 1, `${question.id} at ${value}`);
    }
  }
});

test("five correct answers clear the room and one mistake resets to zero", () => {
  let streak = 0;
  for (let count = 0; count < 4; count += 1) {
    const result = advanceStreak(streak, true);
    streak = result.streak;
    assert.equal(result.complete, false);
  }
  assert.equal(advanceStreak(streak, true).complete, true);
  assert.deepEqual(advanceStreak(4, false), { streak: 0, reset: true, complete: false });
});
