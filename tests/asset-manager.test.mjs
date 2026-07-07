import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ASSET_MANIFEST } from "../src/asset-manager.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const flattenManifest = (manifest, prefix = "") => Object.entries(manifest).flatMap(([key, value]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return typeof value === "string" ? [[path, value]] : flattenManifest(value, path);
});

test("asset manager manifest points to existing local sprites", async () => {
  const entries = flattenManifest(ASSET_MANIFEST);
  assert.ok(entries.length >= 18);
  await Promise.all(entries.map(([, path]) => access(resolve(root, path.replace(/^\.\//, "")))));
});

test("environment sheet remains intact and required prop sprites are split", async () => {
  await access(resolve(root, "assets", "props", "environment_sheet.png"));
  const requiredProps = [
    "tree",
    "grass",
    "flowerbed",
    "bench",
    "utility_pole",
    "street_lamp",
    "signpost",
    "mailbox",
    "boxes",
    "trash_can"
  ];
  await Promise.all(requiredProps.map((name) => access(resolve(root, "assets", "props", "sprites", `${name}.png`))));
});

test("chapter 1 renewal sprites and original source sheets are present", async () => {
  const originals = [
    ["assets", "buildings", "morning bakery.png"],
    ["assets", "buildings", "finance_buildings_sheet.png"],
    ["assets", "characters", "bakery_staff.png"],
    ["assets", "characters", "finance_manager.png"],
    ["assets", "characters", "operations_technician.png"],
    ["assets", "characters", "pedestrians_front_sheet.png"],
    ["assets", "characters", "pedestrians_back_sheet.png"],
    ["assets", "characters", "pedestrians_side_walk_sheet.png"],
    ["assets", "vehicles", "school_town_shuttle_bus.png"]
  ];
  const generated = [
    ["assets", "buildings", "sprites", "morning_bakery.png"],
    ["assets", "buildings", "sprites", "finance_market.png"],
    ["assets", "buildings", "sprites", "packaging_warehouse.png"],
    ["assets", "buildings", "sprites", "cash_vault.png"],
    ["assets", "characters", "sprites", "bakery_staff.png"],
    ["assets", "characters", "sprites", "finance_manager.png"],
    ["assets", "characters", "sprites", "operations_technician.png"],
    ["assets", "vehicles", "sprites", "school_town_shuttle_bus.png"],
    ["assets", "props", "sprites", "sales_summary_easel.png"],
    ["assets", "props", "sprites", "purchase_quote_easel.png"],
    ["assets", "props", "sprites", "cash_count_easel.png"],
    ["assets", "props", "sprites", "coolant_refill_kiosk.png"],
    ["assets", "props", "sprites", "emergency_scale_check_kiosk.png"],
    ["assets", "props", "sprites", "inspection_schedule_kiosk.png"],
    ["assets", "props", "sprites", "door_safety_timer_kiosk.png"],
    ["assets", "props", "sprites", "route_calibration_kiosk.png"]
  ];

  await Promise.all([...originals, ...generated].map((parts) => access(resolve(root, ...parts))));
});

test("pedestrian direction sprite sheet is split into individual PNG files", async () => {
  const directions = ["front", "back", "left", "right"];
  const files = Array.from({ length: 5 }, (_, index) => index + 1).flatMap((number) =>
    directions.map((direction) =>
      resolve(root, "assets", "characters", "sprites", "directions", `pedestrian_${String(number).padStart(2, "0")}_${direction}.png`)
    )
  );

  await Promise.all(files.map((file) => access(file)));
});
