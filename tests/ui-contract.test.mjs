import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { NOTE_DEFINITIONS, REQUIRED_NOTES } from "../src/map-data.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

test("every DOM id used by game.js exists in index.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "index.html"), "utf8"),
    readFile(resolve(root, "src", "game.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  const missing = [...new Set(selectedIds)].filter((id) => !htmlIds.has(id));
  assert.deepEqual(missing, []);
});

test("HTML ids are unique", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test("all required notebook entries have content", () => {
  assert.equal(REQUIRED_NOTES.length, 5);
  for (const id of REQUIRED_NOTES) {
    assert.ok(NOTE_DEFINITIONS[id]);
    assert.ok(NOTE_DEFINITIONS[id].title.length > 0);
    assert.ok(NOTE_DEFINITIONS[id].detail.length > 0);
  }
});

test("all local assets linked from index.html exist", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const paths = [
    ...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)
  ].map((match) => match[1].replace(/^\.\//, ""));

  assert.ok(paths.length >= 2);
  await Promise.all(paths.map((path) => access(resolve(root, path))));
});

test("cost challenge does not reveal collected prices", async () => {
  const game = await readFile(resolve(root, "src", "game.js"), "utf8");
  const start = game.indexOf("function renderCostCards()");
  const end = game.indexOf("function openChallengeNotebook()", start);
  const renderBlock = game.slice(start, end);

  assert.doesNotMatch(renderBlock, /item\.unitPrice/);
  assert.doesNotMatch(renderBlock, /MAP_DATA\.deliveryFee/);
  assert.doesNotMatch(renderBlock, /MAP_DATA\.budget/);
  assert.match(renderBlock, /수첩에서 확인/);
});

test("every DOM id used by map2.js exists in 1map2.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "1map2.html"), "utf8"),
    readFile(resolve(root, "src", "map2.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  const missing = [...new Set(selectedIds)].filter((id) => !htmlIds.has(id));
  assert.deepEqual(missing, []);
});

test("map2 HTML ids are unique and linked assets exist", async () => {
  const html = await readFile(resolve(root, "1map2.html"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);

  const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)]
    .map((match) => match[1].replace(/^\.\//, ""));
  await Promise.all(paths.map((path) => access(resolve(root, path))));
});

test("every game canvas fills its game frame", async () => {
  const css = await readFile(resolve(root, "styles.css"), "utf8");
  const canvasRule = css.match(/\.game-frame\s*>\s*canvas\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(canvasRule, /width:\s*100%/);
  assert.match(canvasRule, /height:\s*100%/);
  assert.match(canvasRule, /display:\s*block/);
});

test("map1 completion links to map2", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "index.html"), "utf8"),
    readFile(resolve(root, "src", "game.js"), "utf8")
  ]);
  assert.match(html, /id="next-map-button"[^>]*>다음 맵으로/);
  assert.match(game, /window\.location\.href = "\.\/1map2\.html"/);
});

test("every DOM id used by map3.js exists in 1map3.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "1map3.html"), "utf8"),
    readFile(resolve(root, "src", "map3.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("map3 and chapter2 pages have unique ids and valid local assets", async () => {
  for (const page of ["1map3.html", "chapter2.html"]) {
    const html = await readFile(resolve(root, page), "utf8");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page} has duplicate ids`);
    const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)]
      .map((match) => match[1].replace(/^\.\//, ""));
    await Promise.all(paths.map((path) => access(resolve(root, path))));
  }
});

test("map progression connects map2 to map3 and map3 to chapter2", async () => {
  const [map2, map3] = await Promise.all([
    readFile(resolve(root, "src", "map2.js"), "utf8"),
    readFile(resolve(root, "src", "map3.js"), "utf8")
  ]);
  assert.match(map2, /window\.location\.href = "\.\/1map3\.html"/);
  assert.match(map3, /window\.location\.href = "\.\/chapter2\.html"/);
});

test("every DOM id used by map21.js exists in 2map1.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "2map1.html"), "utf8"),
    readFile(resolve(root, "src", "map21.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("2map1 page has unique ids and valid local assets", async () => {
  const html = await readFile(resolve(root, "2map1.html"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)]
    .map((match) => match[1].replace(/^\.\//, ""));
  await Promise.all(paths.map((path) => access(resolve(root, path))));
});

test("chapter2 gateway links to 2map1", async () => {
  const html = await readFile(resolve(root, "chapter2.html"), "utf8");
  assert.match(html, /id="start-map21"[^>]+href="\.\/2map1\.html"/);
});

test("every DOM id used by map22.js exists in 2map2.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "2map2.html"), "utf8"),
    readFile(resolve(root, "src", "map22.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("2map2 page has unique ids and valid local assets", async () => {
  const html = await readFile(resolve(root, "2map2.html"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)]
    .map((match) => match[1].replace(/^\.\//, ""));
  await Promise.all(paths.map((path) => access(resolve(root, path))));
});

test("2map1 completion links to 2map2", async () => {
  const game = await readFile(resolve(root, "src", "map21.js"), "utf8");
  assert.match(game, /window\.location\.href="\.\/2map2\.html"/);
});

test("every DOM id used by map23.js exists in 2map3.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "2map3.html"), "utf8"),
    readFile(resolve(root, "src", "map23.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("2map3 page has unique ids and valid local assets", async () => {
  const html = await readFile(resolve(root, "2map3.html"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)]
    .map((match) => match[1].replace(/^\.\//, ""));
  await Promise.all(paths.map((path) => access(resolve(root, path))));
});

test("2map3 uses account-paid interval fees and includes a working calculator UI", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "2map3.html"), "utf8"),
    readFile(resolve(root, "src", "map23.js"), "utf8")
  ]);
  assert.doesNotMatch(html, /수수료 현금|수수료는 현금으로만/);
  assert.match(html, /거래 대금 구간/);
  assert.match(html, /id="calculator-display"/);
  assert.match(html, /data-calc="%"/);
  assert.match(game, /addEventListener\("click",useCalculator\)/);
});

test("2map2 completion links to 2map3", async () => {
  const game = await readFile(resolve(root, "src", "map22.js"), "utf8");
  assert.match(game, /window\.location\.href="\.\/2map3\.html"/);
});

test("every DOM id used by map24.js exists in 2map4.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "2map4.html"), "utf8"),
    readFile(resolve(root, "src", "map24.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("2map4 page has unique ids and valid local assets", async () => {
  const html = await readFile(resolve(root, "2map4.html"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)]
    .map((match) => match[1].replace(/^\.\//, ""));
  await Promise.all(paths.map((path) => access(resolve(root, path))));
});

test("2map3 completion links to 2map4", async () => {
  const game = await readFile(resolve(root, "src", "map23.js"), "utf8");
  assert.match(game, /window\.location\.href="\.\/2map4\.html"/);
});

test("every DOM id used by map25.js exists in 2map5.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "2map5.html"), "utf8"),
    readFile(resolve(root, "src", "map25.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("2map5 page has unique ids and valid local assets", async () => {
  const html = await readFile(resolve(root, "2map5.html"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)]
    .map((match) => match[1].replace(/^\.\//, ""));
  await Promise.all(paths.map((path) => access(resolve(root, path))));
});

test("2map5 asks for final ages without equation choices or a revealed setup", async () => {
  const html = await readFile(resolve(root, "2map5.html"), "utf8");
  const challengeStart = html.indexOf('id="solve-stage"');
  const challengeEnd = html.indexOf('id="age-success"');
  const challenge = html.slice(challengeStart, challengeEnd);
  assert.doesNotMatch(challenge, /type="radio"|name="equation"|x\+y=34|y-x=4|34-2x/);
  assert.match(challenge, /name="younger"/);
  assert.match(challenge, /name="older"/);
  assert.match(challenge, /보기는 없습니다/);
});

test("2map4 completion links to 2map5", async () => {
  const game = await readFile(resolve(root, "src", "map24.js"), "utf8");
  assert.match(game, /window\.location\.href="\.\/2map5\.html"/);
});

test("chapter3 gateway and 3map pages have unique ids and valid local assets", async () => {
  for (const page of ["chapter3.html", "3map1.html", "3map2.html", "3map3.html", "3map4.html", "3map5.html"]) {
    const html = await readFile(resolve(root, page), "utf8");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page} has duplicate ids`);
    const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)]
      .map((match) => match[1].replace(/^\.\//, ""));
    await Promise.all(paths.map((path) => access(resolve(root, path))));
  }
});

test("chapter3 capture animation contains exactly five agents", async () => {
  const game = await readFile(resolve(root, "src", "chapter3.js"), "utf8");
  const match = game.match(/const agents=\[(.*?)\];/s);
  assert.ok(match);
  assert.equal([...match[1].matchAll(/\[[^\]]+\]/g)].length, 5);
});

test("every DOM id used by map31.js exists in 3map1.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "3map1.html"), "utf8"),
    readFile(resolve(root, "src", "map31.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("chapter 2 finale links through chapter3 to 3map1", async () => {
  const [map25, chapter3] = await Promise.all([
    readFile(resolve(root, "src", "map25.js"), "utf8"),
    readFile(resolve(root, "chapter3.html"), "utf8")
  ]);
  assert.match(map25, /window\.location\.href="\.\/chapter3\.html"/);
  assert.match(chapter3, /id="start-map31"[^>]+href="\.\/3map1\.html"/);
});

test("3map1 completion links to 3map2", async () => {
  const game = await readFile(resolve(root, "src", "map31.js"), "utf8");
  assert.match(game, /window\.location\.href="\.\/3map2\.html"/);
});

test("every DOM id used by map32.js exists in 3map2.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "3map2.html"), "utf8"),
    readFile(resolve(root, "src", "map32.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("3map2 uses four views and two subjective number answers", async () => {
  const html = await readFile(resolve(root, "3map2.html"), "utf8");
  for (const label of ["평면도", "정면도", "우측면도", "좌측면도"]) assert.match(html, new RegExp(label));
  assert.match(html, /name="total-layers"[^>]+type="number"/);
  assert.match(html, /name="second-layer-cubes"[^>]+type="number"/);
  assert.doesNotMatch(html, /type="radio"|type="checkbox"/);
});

test("3map2 completion links to 3map3", async () => {
  const game = await readFile(resolve(root, "src", "map32.js"), "utf8");
  assert.match(game, /window\.location\.href="\.\/3map3\.html"/);
});

test("every DOM id used by map33.js exists in 3map3.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "3map3.html"), "utf8"),
    readFile(resolve(root, "src", "map33.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("3map3 uses a scaled route plan with subjective numeric answers", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "3map3.html"), "utf8"),
    readFile(resolve(root, "src", "map33.js"), "utf8")
  ]);
  assert.match(html, /축척|닮음비|평행이동|합동/);
  assert.match(html, /name="scale-ratio"[^>]+type="number"/);
  assert.match(html, /id="route-segment-inputs"/);
  assert.match(game, /1:\$\{formatNumber\(getScaleDenominator\(puzzle\)\)\}/);
  assert.doesNotMatch(html, /회색 기준|평행이동|지도 1 cm는 실제 2 m|지도 1cm당/);
  assert.doesNotMatch(html, /1:200은 지도|축척이 1:200이면|실제 200 cm/);
  assert.doesNotMatch(game, /formatNumber\(segment\.mapCm\).*cm/);
  assert.doesNotMatch(html, /type="radio"|type="checkbox"/);
});

test("3map3 completion links to 3map4", async () => {
  const game = await readFile(resolve(root, "src", "map33.js"), "utf8");
  assert.match(game, /window\.location\.href = "\.\/3map4\.html"/);
});

test("every DOM id used by map34.js exists in 3map4.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "3map4.html"), "utf8"),
    readFile(resolve(root, "src", "map34.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("3map4 uses plane perimeter and area fabrication answers", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "3map4.html"), "utf8"),
    readFile(resolve(root, "src", "map34.js"), "utf8")
  ]);
  assert.match(html, /둘레|넓이|직사각형|원형 심선|정삼각형|도넛형|차광칩/);
  assert.match(html, /id="fabrication-fields"/);
  assert.match(html, /0 \/ 5/);
  assert.doesNotMatch(html, /3\.14/);
  assert.doesNotMatch(html, /type="radio"|type="checkbox"/);
  assert.match(game, /window\.location\.href = "\.\/3map5\.html"/);
});

test("3map4 completion links to 3map5", async () => {
  const game = await readFile(resolve(root, "src", "map34.js"), "utf8");
  assert.match(game, /window\.location\.href = "\.\/3map5\.html"/);
});

test("every DOM id used by map35.js exists in 3map5.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "3map5.html"), "utf8"),
    readFile(resolve(root, "src", "map35.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("3map5 uses solid surface area and cone volume transfer answers", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "3map5.html"), "utf8"),
    readFile(resolve(root, "src", "map35.js"), "utf8")
  ]);
  assert.match(html, /AI 로봇|액체 전기|원기둥|원뿔|겉넓이|부피|1\/3|반지름이 7 cm/);
  assert.match(html, /id="solid-fields"/);
  assert.doesNotMatch(html, /type="radio"|type="checkbox"/);
  assert.match(game, /window\.location\.href = "\.\/chapter4\.html"/);
  await access(resolve(root, "chapter4.html"));
});

test("chapter4 gateway and 4map pages have unique ids and valid local assets", async () => {
  for (const page of ["chapter4.html", "4map1.html", "4map2.html", "4map3.html", "4map4.html", "4map5.html"]) {
    const html = await readFile(resolve(root, page), "utf8");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page} has duplicate ids`);
    const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)]
      .map((match) => match[1].replace(/^\.\//, ""));
    await Promise.all(paths.map((path) => access(resolve(root, path))));
  }
});

test("chapter4 gateway is bright and links to 4map1", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "chapter4.html"), "utf8"),
    readFile(resolve(root, "src", "chapter4.js"), "utf8")
  ]);
  assert.match(html, /햇빛|밝은 공원길|자전거|인라인스케이트|학교/);
  assert.match(html, /id="start-map41"[^>]+href="\.\/4map1\.html"/);
  assert.match(game, /drawBikeKid/);
  assert.match(game, /drawInlineKid/);
});

test("every DOM id used by map41.js exists in 4map1.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map1.html"), "utf8"),
    readFile(resolve(root, "src", "map41.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("4map1 uses subjective counting answers for the kindergarten photo lineup", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map1.html"), "utf8"),
    readFile(resolve(root, "src", "map41.js"), "utf8")
  ]);
  assert.match(html, /화살표 방향키|↑ ↓ ← →|Space Bar|인벤토리|직무수학 교과서/);
  assert.match(html, /id="map41-inventory"/);
  assert.match(html, /id="interaction-prompt"/);
  assert.match(html, /id="counting-example"/);
  assert.match(html, /id="counting-fields"/);
  assert.match(html, /id="map41-puzzle" class="modal-layer is-hidden"/);
  assert.match(game, /discoveredKids/);
  assert.match(game, /knownConditions/);
  assert.match(game, /ArrowUp|ArrowDown|ArrowLeft|ArrowRight/);
  assert.match(game, /event\.code === "Space"/);
  assert.match(game, /event\.code === "KeyI"/);
  assert.match(game, /state\.knownConditions\[1\] = true/);
  assert.match(game, /수집한 정보를 바탕으로|직접 확인한 아이/);
  assert.match(game, /window\.location\.href = "\.\/4map2\.html"/);
  assert.doesNotMatch(html, /type="radio"|type="checkbox"/);
});

test("every DOM id used by map42.js exists in 4map2.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map2.html"), "utf8"),
    readFile(resolve(root, "src", "map42.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("4map2 uses exploration and subjective probability comparison for the stationery candy game", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map2.html"), "utf8"),
    readFile(resolve(root, "src", "map42.js"), "utf8")
  ]);
  assert.match(html, /문구점|사탕|가능성|백분율|화살표 방향키|↑ ↓ ← →|Space Bar|인벤토리|직무수학 교과서/);
  assert.match(html, /id="map42-inventory"/);
  assert.match(html, /id="map42-interaction-prompt"/);
  assert.match(html, /id="probability-example"/);
  assert.match(html, /id="probability-fields"/);
  assert.match(html, /name="p1"/);
  assert.match(html, /name="p2"/);
  assert.match(html, /name="p3"/);
  assert.match(html, /name="best"/);
  assert.match(html, /id="map42-puzzle" class="modal-layer is-hidden"/);
  assert.match(game, /inspectedCards/);
  assert.match(game, /fairnessChecked/);
  assert.match(game, /spokenKids/);
  assert.match(game, /ArrowUp|ArrowDown|ArrowLeft|ArrowRight/);
  assert.match(game, /event\.code === "Space"/);
  assert.match(game, /event\.code === "KeyI"/);
  assert.match(game, /checkCandyGameAnswer/);
  assert.match(game, /window\.location\.href = "\.\/4map3\.html"/);
  assert.doesNotMatch(html, /type="radio"|type="checkbox"/);
});

test("every DOM id used by map43.js exists in 4map3.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map3.html"), "utf8"),
    readFile(resolve(root, "src", "map43.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("4map3 uses exploration and subjective data organization answers", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map3.html"), "utf8"),
    readFile(resolve(root, "src", "map43.js"), "utf8")
  ]);
  assert.match(html, /등교길|자료 정리|도수분포표|상대도수분포표|꺾은선그래프|화살표 방향키|↑ ↓ ← →|Space Bar|인벤토리|직무수학 교과서/);
  assert.match(html, /id="map43-inventory"/);
  assert.match(html, /id="map43-interaction-prompt"/);
  assert.match(html, /id="data-example"/);
  assert.match(html, /id="data-fields"/);
  for (const name of ["exactTable", "relativeTable", "graphType", "mainPeak", "backPeak", "helperGate"]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(html, /id="map43-puzzle" class="modal-layer is-hidden"/);
  assert.match(game, /collected/);
  assert.match(game, /checkTrafficReportAnswer/);
  assert.match(game, /getRelativeFrequencyRows/);
  assert.match(game, /ArrowUp|ArrowDown|ArrowLeft|ArrowRight/);
  assert.match(game, /event\.code === "Space"/);
  assert.match(game, /event\.code === "KeyI"/);
  assert.match(game, /window\.location\.href = "\.\/4map4\.html"/);
  assert.doesNotMatch(html, /type="radio"|type="checkbox"/);
});

test("every DOM id used by map44.js exists in 4map4.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map4.html"), "utf8"),
    readFile(resolve(root, "src", "map44.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("4map4 uses exploration and subjective table and graph interpretation answers", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map4.html"), "utf8"),
    readFile(resolve(root, "src", "map44.js"), "utf8")
  ]);
  assert.match(html, /현관|자료 해석|표|원그래프|막대그래프|꺾은선그래프|화살표 방향키|↑ ↓ ← →|Space Bar|인벤토리|직무수학 교과서/);
  assert.match(html, /id="map44-inventory"/);
  assert.match(html, /id="map44-interaction-prompt"/);
  assert.match(html, /id="interpretation-example"/);
  assert.match(html, /id="interpretation-fields"/);
  for (const name of ["busiestInterval", "topTransport", "emptySpots", "bestStorage", "shortestRoute"]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(html, /id="map44-puzzle" class="modal-layer is-hidden"/);
  assert.match(game, /collected/);
  assert.match(game, /checkDashboardInterpretationAnswer/);
  assert.match(game, /ARRIVAL_FLOW/);
  assert.match(game, /TRANSPORT_SHARE/);
  assert.match(game, /STORAGE_STATUS/);
  assert.match(game, /WAIT_TIMES/);
  assert.match(game, /ArrowUp|ArrowDown|ArrowLeft|ArrowRight/);
  assert.match(game, /event\.code === "Space"/);
  assert.match(game, /event\.code === "KeyI"/);
  assert.match(game, /window\.location\.href = "\.\/4map5\.html"/);
  assert.doesNotMatch(html, /type="radio"|type="checkbox"/);
});

test("4map4 answer placeholders do not reveal actual answers", async () => {
  const html = await readFile(resolve(root, "4map4.html"), "utf8");
  const placeholders = [...html.matchAll(/placeholder="([^"]*)"/g)].map((match) => match[1]).join(" ");
  assert.doesNotMatch(placeholders, /08:30~08:39|자전거|후문 보관소|후문 동선/);
});

test("every DOM id used by map45.js exists in 4map5.html", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map5.html"), "utf8"),
    readFile(resolve(root, "src", "map45.js"), "utf8")
  ]);
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const selectedIds = [...game.matchAll(/querySelector\("#([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(selectedIds)].filter((id) => !htmlIds.has(id)), []);
});

test("4map5 uses exploration and subjective mean median mode decision answers", async () => {
  const [html, game] = await Promise.all([
    readFile(resolve(root, "4map5.html"), "utf8"),
    readFile(resolve(root, "src", "map45.js"), "utf8")
  ]);
  assert.match(html, /대기시간|자료|대푯값|평균|중앙값|최빈값|화살표 방향키|↑ ↓ ← →|Space Bar|인벤토리|직무수학 교과서/);
  assert.match(html, /수학 교실로 들어가기|주마등|CHAPTER 01|CHAPTER 02|CHAPTER 03|CHAPTER 04|수학 수업에 힘차게 들어가다/);
  assert.match(html, /id="map45-inventory"/);
  assert.match(html, /id="map45-interaction-prompt"/);
  assert.match(html, /id="decision-example"/);
  assert.match(html, /id="decision-fields"/);
  for (const name of ["sortedData", "meanValue", "medianValue", "modeValue", "representativeValue"]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(html, /id="map45-puzzle" class="modal-layer is-hidden"/);
  assert.match(game, /collected/);
  assert.match(game, /checkWaitTimeDecisionAnswer/);
  assert.match(game, /WAIT_TIME_RECORDS/);
  assert.match(game, /recordBoard/);
  assert.match(game, /formulaBoard/);
  assert.match(game, /outlierMemo/);
  assert.match(game, /noticeDesk/);
  assert.match(game, /replayFinale/);
  assert.match(game, /ArrowUp|ArrowDown|ArrowLeft|ArrowRight/);
  assert.match(game, /event\.code === "Space"/);
  assert.match(game, /event\.code === "KeyI"/);
  assert.match(game, /window\.location\.href = "\.\/index\.html"/);
  assert.doesNotMatch(html, /type="radio"|type="checkbox"/);
});

test("4map5 answer placeholders do not reveal actual answers", async () => {
  const html = await readFile(resolve(root, "4map5.html"), "utf8");
  const placeholders = [...html.matchAll(/placeholder="([^"]*)"/g)].map((match) => match[1]).join(" ");
  assert.doesNotMatch(placeholders, /6|8|9|10|12|40|13|중앙값/);
});
