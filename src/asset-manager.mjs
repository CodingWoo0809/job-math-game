export const ASSET_MANIFEST = Object.freeze({
  characters: Object.freeze({
    wh: "./assets/characters/sprites/wh.png",
    bakeryStaff: "./assets/characters/sprites/bakery_staff.png",
    elementaryGirl: "./assets/characters/sprites/elementary_girl.png",
    elementaryBoy: "./assets/characters/sprites/elementary_boy.png",
    financeManager: "./assets/characters/sprites/finance_manager.png",
    mathTeacher: "./assets/characters/sprites/math_teacher.png",
    operationsTechnician: "./assets/characters/sprites/operations_technician.png",
    truckDriver: "./assets/characters/sprites/truck_driver.png",
    monkey: "./assets/characters/sprites/monkey.png",
    wildlifeKeeper: "./assets/characters/sprites/wildlife_keeper.png",
    saplingCaretaker: "./assets/characters/sprites/sapling_caretaker.png",
    forestWorkers: Object.freeze({
      worker01: "./assets/characters/sprites/forest_worker_01.png",
      worker02: "./assets/characters/sprites/forest_worker_02.png",
      worker03: "./assets/characters/sprites/forest_worker_03.png",
      worker04: "./assets/characters/sprites/forest_worker_04.png"
    }),
    directional: Object.freeze({
      pedestrian01: Object.freeze({
        front: "./assets/characters/sprites/directions/pedestrian_01_front.png",
        back: "./assets/characters/sprites/directions/pedestrian_01_back.png",
        left: "./assets/characters/sprites/directions/pedestrian_01_left.png",
        right: "./assets/characters/sprites/directions/pedestrian_01_right.png"
      }),
      pedestrian02: Object.freeze({
        front: "./assets/characters/sprites/directions/pedestrian_02_front.png",
        back: "./assets/characters/sprites/directions/pedestrian_02_back.png",
        left: "./assets/characters/sprites/directions/pedestrian_02_left.png",
        right: "./assets/characters/sprites/directions/pedestrian_02_right.png"
      }),
      pedestrian03: Object.freeze({
        front: "./assets/characters/sprites/directions/pedestrian_03_front.png",
        back: "./assets/characters/sprites/directions/pedestrian_03_back.png",
        left: "./assets/characters/sprites/directions/pedestrian_03_left.png",
        right: "./assets/characters/sprites/directions/pedestrian_03_right.png"
      }),
      pedestrian04: Object.freeze({
        front: "./assets/characters/sprites/directions/pedestrian_04_front.png",
        back: "./assets/characters/sprites/directions/pedestrian_04_back.png",
        left: "./assets/characters/sprites/directions/pedestrian_04_left.png",
        right: "./assets/characters/sprites/directions/pedestrian_04_right.png"
      }),
      pedestrian05: Object.freeze({
        front: "./assets/characters/sprites/directions/pedestrian_05_front.png",
        back: "./assets/characters/sprites/directions/pedestrian_05_back.png",
        left: "./assets/characters/sprites/directions/pedestrian_05_left.png",
        right: "./assets/characters/sprites/directions/pedestrian_05_right.png"
      })
    })
  }),
  vehicles: Object.freeze({
    logisticsTruck: "./assets/vehicles/sprites/logistics_truck.png",
    schoolTownShuttleBus: "./assets/vehicles/sprites/school_town_shuttle_bus.png"
  }),
  buildings: Object.freeze({
    house01: "./assets/buildings/sprites/house_01.png",
    morningBakery: "./assets/buildings/sprites/morning_bakery.png",
    marketOperationsOffice: "./assets/buildings/sprites/market_operations_office.png",
    shuttleBusTransferCenter: "./assets/buildings/sprites/shuttle_bus_transfer_center.png",
    financeMarket: "./assets/buildings/sprites/finance_market.png",
    packagingWarehouse: "./assets/buildings/sprites/packaging_warehouse.png",
    cashVault: "./assets/buildings/sprites/cash_vault.png"
  }),
  props: Object.freeze({
    tree: "./assets/props/sprites/tree.png",
    saplings: Object.freeze({
      sapling01: "./assets/props/sprites/sapling_01.png",
      sapling02: "./assets/props/sprites/sapling_02.png",
      sapling03: "./assets/props/sprites/sapling_03.png",
      sapling04: "./assets/props/sprites/sapling_04.png",
      sapling05: "./assets/props/sprites/sapling_05.png",
      sapling06: "./assets/props/sprites/sapling_06.png",
      sapling07: "./assets/props/sprites/sapling_07.png"
    }),
    grass: "./assets/props/sprites/grass.png",
    flowerbed: "./assets/props/sprites/flowerbed.png",
    bench: "./assets/props/sprites/bench.png",
    utilityPole: "./assets/props/sprites/utility_pole.png",
    streetLamp: "./assets/props/sprites/street_lamp.png",
    signpost: "./assets/props/sprites/signpost.png",
    mailbox: "./assets/props/sprites/mailbox.png",
    boxes: "./assets/props/sprites/boxes.png",
    trashCan: "./assets/props/sprites/trash_can.png",
    asphaltRoad: "./assets/props/sprites/asphalt_road.png",
    atmMachine: "./assets/props/sprites/atm_machine.png",
    irrigationControlMonitor: "./assets/props/sprites/irrigation_control_monitor.png",
    automaticIrrigator: "./assets/props/sprites/automatic_irrigator.png",
    sidewalkTile: "./assets/props/sprites/sidewalk_tile.png",
    bicycleLaneTile: "./assets/props/sprites/bicycle_lane_tile.png",
    jobMathRpgRaceArch: "./assets/props/sprites/job_math_rpg_race_arch.png",
    lockedIronGate: "./assets/props/sprites/locked_iron_gate.png",
    bananaSingle: "./assets/props/sprites/banana_single.png",
    bananaBunch: "./assets/props/sprites/banana_bunch.png",
    cashCountEasel: "./assets/props/sprites/cash_count_easel.png",
    salaryProposalEasel: "./assets/props/sprites/salary_proposal_easel.png",
    safetyQuoteEasel: "./assets/props/sprites/safety_quote_easel.png",
    businessProfitEasel: "./assets/props/sprites/business_profit_easel.png",
    coolantRefillKiosk: "./assets/props/sprites/coolant_refill_kiosk.png",
    doorSafetyTimerKiosk: "./assets/props/sprites/door_safety_timer_kiosk.png",
    emergencyScaleCheckKiosk: "./assets/props/sprites/emergency_scale_check_kiosk.png",
    inspectionScheduleKiosk: "./assets/props/sprites/inspection_schedule_kiosk.png",
    purchaseQuoteEasel: "./assets/props/sprites/purchase_quote_easel.png",
    routeCalibrationKiosk: "./assets/props/sprites/route_calibration_kiosk.png",
    salesSummaryEasel: "./assets/props/sprites/sales_summary_easel.png"
  })
});

const flattenManifest = (manifest, prefix = "") => Object.entries(manifest).flatMap(([key, value]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return typeof value === "string" ? [[path, value]] : flattenManifest(value, path);
});

const directionAlias = Object.freeze({
  up: "back",
  down: "front",
  backward: "back",
  forward: "front",
  north: "back",
  south: "front",
  west: "left",
  east: "right",
  "-1": "left",
  "1": "right"
});

const normalizeDirection = (direction) => {
  const key = String(direction ?? "front").toLowerCase();
  return directionAlias[key] ?? (["front", "back", "left", "right"].includes(key) ? key : "front");
};

export class AssetManager {
  constructor(manifest = ASSET_MANIFEST) {
    this.manifest = manifest;
    this.images = new Map();
    this.loading = null;
  }

  loadAll() {
    if (this.loading) return this.loading;
    this.loading = Promise.all(
      flattenManifest(this.manifest).map(([key, src]) => this.load(key, src))
    );
    return this.loading;
  }

  load(key, src) {
    if (this.images.has(key)) return Promise.resolve(this.images.get(key));
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        this.images.set(key, image);
        resolve(image);
      };
      image.onerror = () => reject(new Error(`Asset load failed: ${src}`));
      image.src = new URL(src, document.baseURI).href;
    });
  }

  get(key) {
    return this.images.get(key) ?? null;
  }

  has(key) {
    return this.images.has(key);
  }

  draw(ctx, key, options) {
    const image = this.get(key);
    if (!image) return false;
    const {
      x,
      y,
      width,
      height,
      anchorX = 0.5,
      anchorY = 1,
      flipX = false,
      alpha = 1
    } = options;
    const drawWidth = width ?? (height ? image.naturalWidth * (height / image.naturalHeight) : image.naturalWidth);
    const drawHeight = height ?? (width ? image.naturalHeight * (width / image.naturalWidth) : image.naturalHeight);
    const left = -drawWidth * anchorX;
    const top = -drawHeight * anchorY;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    ctx.drawImage(image, left, top, drawWidth, drawHeight);
    ctx.restore();
    return true;
  }

  drawCharacter(ctx, characterKey, options) {
    const direction = normalizeDirection(options.direction);
    const directionalKey = `characters.directional.${characterKey}.${direction}`;
    if (this.has(directionalKey)) {
      return this.draw(ctx, directionalKey, options);
    }

    const baseKey = characterKey.includes(".") ? characterKey : `characters.${characterKey}`;
    return this.draw(ctx, baseKey, {
      ...options,
      flipX: options.flipX ?? direction === "left"
    });
  }
}

export const assetManager = new AssetManager();
