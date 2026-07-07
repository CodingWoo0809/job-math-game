import test from "node:test";
import assert from "node:assert/strict";
import { SOLID_MEASURE_STAGES, checkSolidStageAnswer, coneHeightForSameVolume, coneVolumePiCoefficient, cylinderVolumePiCoefficient, getSolidStageAnswer, rectangularPrismSurfaceArea, rectangularPrismVolume } from "../src/solid-measure-data.mjs";

test("solid measure run contains surface area, cylinder volume, and cone transfer stages", () => {
  assert.equal(SOLID_MEASURE_STAGES.length, 3);
  assert.deepEqual(SOLID_MEASURE_STAGES.map((stage) => stage.type), ["rectangular-prism", "cylinder-volume", "cone-transfer"]);
});

test("rectangular prism stage uses net surface area and volume", () => {
  assert.equal(rectangularPrismSurfaceArea(6, 4, 5), 148);
  assert.equal(rectangularPrismVolume(6, 4, 5), 120);
  assert.deepEqual(getSolidStageAnswer(SOLID_MEASURE_STAGES[0]), { surfaceAreaCm2: 148, volumeCm3: 120 });
});

test("cylinder cup volume is kept as a pi coefficient", () => {
  assert.equal(cylinderVolumePiCoefficient(7, 12), 588);
  assert.deepEqual(getSolidStageAnswer(SOLID_MEASURE_STAGES[1]), { cylinderVolumePiCm3: 588 });
});

test("cone cup height uses one third of base area times height", () => {
  assert.equal(coneHeightForSameVolume(7, 12, 7), 36);
  assert.equal(coneVolumePiCoefficient(7, 36), 588);
  assert.deepEqual(getSolidStageAnswer(SOLID_MEASURE_STAGES[2]), { coneHeightCm: 36 });
});

test("solid measure answer checker requires every requested value", () => {
  assert.equal(checkSolidStageAnswer(SOLID_MEASURE_STAGES[0], { surfaceAreaCm2: 148, volumeCm3: 120 }).correct, true);
  assert.equal(checkSolidStageAnswer(SOLID_MEASURE_STAGES[1], { cylinderVolumePiCm3: 588 }).correct, true);
  assert.equal(checkSolidStageAnswer(SOLID_MEASURE_STAGES[2], { coneHeightCm: 36 }).correct, true);
  assert.equal(checkSolidStageAnswer(SOLID_MEASURE_STAGES[2], { coneHeightCm: 12 }).correct, false);
});
