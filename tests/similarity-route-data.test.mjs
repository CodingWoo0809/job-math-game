import test from "node:test";
import assert from "node:assert/strict";
import { SIMILARITY_ROUTE_PUZZLES, checkEscapePlan, getActualRoute, getEscapeAnswer, getRoutePoints, getScaleDenominator, getScaleMetersPerCm, isRouteInsideMap } from "../src/similarity-route-data.mjs";

test("similarity route bank has three ordered escape map stages", () => {
  assert.equal(SIMILARITY_ROUTE_PUZZLES.length, 3);
  assert.deepEqual(SIMILARITY_ROUTE_PUZZLES.map((puzzle) => puzzle.difficulty), ["easy", "medium", "hard"]);
});

test("scale meters per centimeter are calculated from the given scale statements", () => {
  assert.deepEqual(SIMILARITY_ROUTE_PUZZLES.map(getScaleMetersPerCm), [2, 2.5, 4]);
});

test("scale is expressible as textbook map ratios", () => {
  assert.deepEqual(SIMILARITY_ROUTE_PUZZLES.map(getScaleDenominator), [200, 250, 400]);
});

test("actual route distances use the similarity ratio", () => {
  const routes = SIMILARITY_ROUTE_PUZZLES.map((puzzle) => getActualRoute(puzzle).map((segment) => [segment.direction, segment.realM]));
  assert.deepEqual(routes, [
    [["east", 6], ["north", 4]],
    [["north", 5], ["east", 7.5], ["north", 2.5]],
    [["west", 8], ["north", 12], ["east", 12]]
  ]);
});

test("active routes remain inside each escape map", () => {
  for (const puzzle of SIMILARITY_ROUTE_PUZZLES) {
    assert.equal(isRouteInsideMap(puzzle), true, `${puzzle.id} active route`);
  }
});

test("route points follow the map direction agreement", () => {
  const puzzle = SIMILARITY_ROUTE_PUZZLES[0];
  const points = getRoutePoints(puzzle);
  assert.deepEqual(points, [
    { x: 1, y: 6 },
    { x: 4, y: 6 },
    { x: 4, y: 4 }
  ]);
});

test("escape plan checker requires scale, direction, and distance to be correct", () => {
  const puzzle = SIMILARITY_ROUTE_PUZZLES[2];
  const answer = getEscapeAnswer(puzzle);
  assert.equal(checkEscapePlan(puzzle, answer.metersPerCm, answer.segments.map((segment) => ({ direction: segment.direction, distanceM: segment.realM }))).correct, true);
  assert.equal(checkEscapePlan(puzzle, 2, answer.segments.map((segment) => ({ direction: segment.direction, distanceM: segment.realM }))).scaleCorrect, false);
  assert.equal(checkEscapePlan(puzzle, answer.metersPerCm, answer.segments.map((segment, index) => ({ direction: index === 0 ? "east" : segment.direction, distanceM: segment.realM }))).directionCorrect, false);
  assert.equal(checkEscapePlan(puzzle, answer.metersPerCm, answer.segments.map((segment, index) => ({ direction: segment.direction, distanceM: index === 1 ? 8 : segment.realM }))).distanceCorrect, false);
});
