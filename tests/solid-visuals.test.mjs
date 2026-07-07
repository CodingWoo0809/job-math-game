import test from "node:test";
import assert from "node:assert/strict";
import { NET_QUESTIONS, SOLID_TYPES } from "../src/solid-net-data.mjs";
import { CONE_NET_METRICS, NET_FACE_COUNTS, renderNetVisual, renderSightDrawing } from "../src/solid-visuals.mjs";

test("every question renders one connected net with the correct face count", () => {
  for (const question of NET_QUESTIONS) {
    const svg = renderNetVisual(question.solid, question.variant, question.accent);
    assert.match(svg, /data-connected-net="true"/);
    assert.equal([...svg.matchAll(/class="face(?:\s[^"]*)?"/g)].length, NET_FACE_COUNTS[question.solid], question.id);
  }
});

test("every sight drawing uses solid visible edges and dashed hidden edges", () => {
  for (const type of SOLID_TYPES) {
    const svg = renderSightDrawing(type);
    assert.match(svg, /class="edge visible"/, `${type} lacks visible edges`);
    assert.match(svg, /class="edge hidden"/, `${type} lacks hidden edges`);
    assert.match(svg, /data-sight-drawing="true"/);
  }
});

test("hard nets contain twelve pentagons or twenty triangles", () => {
  const dodecahedron = renderNetVisual("dodecahedron", 0, "#fff");
  const icosahedron = renderNetVisual("icosahedron", 0, "#fff");
  assert.equal([...dodecahedron.matchAll(/class="face"/g)].length, 12);
  assert.equal([...icosahedron.matchAll(/class="face"/g)].length, 20);
});

test("each cone sector arc is exactly as long as its base circumference", () => {
  for (const [variant, metrics] of CONE_NET_METRICS.entries()) {
    const arcLength = metrics.slantRadius * metrics.sectorAngle;
    const circumference = 2 * Math.PI * metrics.baseRadius;
    assert.ok(Math.abs(arcLength - circumference) < 1e-10, `cone variant ${variant}`);
    const svg = renderNetVisual("cone", variant, "#fff");
    assert.match(svg, /class="face cone-sector"/);
    assert.match(svg, /class="face cone-base"/);
  }
});

test("regular dodecahedron and icosahedron drawings have the correct topology", () => {
  const dodecahedron = renderSightDrawing("dodecahedron");
  const icosahedron = renderSightDrawing("icosahedron");
  assert.match(dodecahedron, /data-polyhedron="dodecahedron" data-vertex-count="20" data-edge-count="30"/);
  assert.match(icosahedron, /data-polyhedron="icosahedron" data-vertex-count="12" data-edge-count="30"/);
  assert.equal([...dodecahedron.matchAll(/<line /g)].length, 30);
  assert.equal([...icosahedron.matchAll(/<line /g)].length, 30);
});

test("the square frustum top face uses visible solid edges", () => {
  const svg = renderSightDrawing("square-frustum");
  assert.match(svg, /class="edge visible" points="60,55 94,66 126,53 93,43 60,55"/);
  assert.doesNotMatch(svg, /class="edge hidden"[^>]+(?:60,55|94,66|126,53|93,43)/);
});

test("the corrected pyramid drawings use the right number of base vertices", () => {
  const tetrahedron = renderSightDrawing("triangular-pyramid");
  const pentagonalPyramid = renderSightDrawing("pentagonal-pyramid");
  assert.match(tetrahedron, /38,98 96,114 147,83/);
  assert.match(pentagonalPyramid, /34,82 61,108 101,111 146,84/);
  assert.match(pentagonalPyramid, /x1="91" y1="61" x2="34" y2="82"/);
});
