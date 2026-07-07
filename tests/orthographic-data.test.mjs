import test from "node:test";
import assert from "node:assert/strict";
import {
  ORTHOGRAPHIC_QUESTIONS,
  checkProjectionAnswer,
  createProjectionRun,
  getOrthographicViews,
  getStructureAnswers,
  possibleSecondLayerCounts
} from "../src/orthographic-data.mjs";

test("3map2 has three questions for each difficulty", () => {
  assert.equal(ORTHOGRAPHIC_QUESTIONS.length, 9);
  assert.equal(new Set(ORTHOGRAPHIC_QUESTIONS.map(({ id }) => id)).size, 9);
  assert.deepEqual(
    Object.fromEntries(["easy", "medium", "hard"].map((level) => [level, ORTHOGRAPHIC_QUESTIONS.filter(({ difficulty }) => difficulty === level).length])),
    { easy: 3, medium: 3, hard: 3 }
  );
});

test("all four orthographic views match each cube structure", () => {
  for (const question of ORTHOGRAPHIC_QUESTIONS) {
    const views = getOrthographicViews(question.heights);
    assert.equal(views.top.length, question.heights.length);
    assert.equal(views.front.length, question.heights[0].length);
    assert.deepEqual(views.right, [...views.left].reverse());
    assert.equal(views.front.some((height) => height === 0), false, `${question.id} has an empty front column`);
  }
});

test("right and left views follow the front-based direction agreement", () => {
  const question = ORTHOGRAPHIC_QUESTIONS.find(({ id }) => id === "split-towers");
  const views = getOrthographicViews(question.heights);
  assert.deepEqual(views.right, [2, 1, 4]);
  assert.deepEqual(views.left, [4, 1, 2]);
});

test("the number of second-layer cubes is uniquely determined by the projections", () => {
  for (const question of ORTHOGRAPHIC_QUESTIONS) {
    const answer = getStructureAnswers(question.heights);
    assert.deepEqual([...possibleSecondLayerCounts(question)], [answer.secondLayerCubes], question.id);
  }
});

test("a run contains one easy, one medium and one hard question", () => {
  const run = createProjectionRun(() => 0.4);
  assert.deepEqual(run.map(({ difficulty }) => difficulty), ["easy", "medium", "hard"]);
  assert.equal(new Set(run.map(({ id }) => id)).size, 3);
});

test("subjective answers require both total layers and second-layer cubes", () => {
  for (const question of ORTHOGRAPHIC_QUESTIONS) {
    const answer = getStructureAnswers(question.heights);
    assert.equal(checkProjectionAnswer(question, answer.totalLayers, answer.secondLayerCubes).correct, true);
    assert.equal(checkProjectionAnswer(question, answer.totalLayers + 1, answer.secondLayerCubes).correct, false);
    assert.equal(checkProjectionAnswer(question, answer.totalLayers, answer.secondLayerCubes + 1).correct, false);
  }
});
