import test from "node:test";
import assert from "node:assert/strict";
import { PLANE_GEOMETRY_STAGES, annulusAreaPiCoefficient, annulusBoundaryPiCoefficient, checkPlaneStageAnswer, circleCircumferencePiCoefficient, circleRadiusFromPiArea, countNetDies, equilateralTriangleAreaRoot3Coefficient, equilateralTriangleHeightRoot3Coefficient, getPlaneStageAnswer, rectangleArea, rectanglePerimeter } from "../src/plane-geometry-data.mjs";

test("plane geometry run contains five varied cinematic job-style stages", () => {
  assert.equal(PLANE_GEOMETRY_STAGES.length, 5);
  assert.deepEqual(PLANE_GEOMETRY_STAGES.map((stage) => stage.type), ["rectangle", "circle", "equilateral", "annulus", "wafer"]);
});

test("rectangle stage uses perimeter and area", () => {
  assert.equal(rectanglePerimeter(12, 7), 38);
  assert.equal(rectangleArea(12, 7), 84);
  assert.deepEqual(getPlaneStageAnswer(PLANE_GEOMETRY_STAGES[0]), { rectanglePerimeterCm: 38, rectangleAreaCm2: 84 });
});

test("circle stage derives radius from area and then circumference", () => {
  assert.equal(circleRadiusFromPiArea(25), 5);
  assert.equal(circleCircumferencePiCoefficient(5), 10);
  assert.deepEqual(getPlaneStageAnswer(PLANE_GEOMETRY_STAGES[1]), { radiusMm: 5, circumferencePiMm: 10 });
});

test("equilateral triangle stage keeps radical values as coefficients", () => {
  assert.equal(equilateralTriangleHeightRoot3Coefficient(10), 5);
  assert.equal(equilateralTriangleAreaRoot3Coefficient(10), 25);
  assert.deepEqual(getPlaneStageAnswer(PLANE_GEOMETRY_STAGES[2]), { triangleHeightRoot3Cm: 5, triangleAreaRoot3Cm2: 25 });
});

test("annulus stage uses outer area minus inner area and both boundary lengths", () => {
  assert.equal(annulusAreaPiCoefficient(8, 5), 39);
  assert.equal(annulusBoundaryPiCoefficient(8, 5), 26);
  assert.deepEqual(getPlaneStageAnswer(PLANE_GEOMETRY_STAGES[3]), { annulusAreaPiCm2: 39, boundaryLengthPiCm: 26 });
});

test("wafer stage counts only square dies fully inside the circle", () => {
  assert.equal(countNetDies(5, 2, 0, 1), 12);
  assert.deepEqual(getPlaneStageAnswer(PLANE_GEOMETRY_STAGES[4]), { netDies: 12, coveredAreaCm2: 48 });
});

test("plane geometry answer checker requires every requested fabrication value", () => {
  assert.equal(checkPlaneStageAnswer(PLANE_GEOMETRY_STAGES[0], { rectanglePerimeterCm: 38, rectangleAreaCm2: 84 }).correct, true);
  assert.equal(checkPlaneStageAnswer(PLANE_GEOMETRY_STAGES[1], { radiusMm: 5, circumferencePiMm: 10 }).correct, true);
  assert.equal(checkPlaneStageAnswer(PLANE_GEOMETRY_STAGES[2], { triangleHeightRoot3Cm: 5, triangleAreaRoot3Cm2: 20 }).correct, false);
  assert.equal(checkPlaneStageAnswer(PLANE_GEOMETRY_STAGES[3], { annulusAreaPiCm2: 39, boundaryLengthPiCm: 80 }).correct, false);
  assert.equal(checkPlaneStageAnswer(PLANE_GEOMETRY_STAGES[4], { netDies: 11, coveredAreaCm2: 48 }).correct, false);
});
