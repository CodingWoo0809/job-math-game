export const TRAFFIC_INTERVALS = Object.freeze([
  "08:00~08:09",
  "08:10~08:19",
  "08:20~08:29",
  "08:30~08:39",
  "08:40~08:49"
]);

export const GATE_TRAFFIC = Object.freeze({
  main: Object.freeze({
    id: "main",
    label: "정문",
    counts: Object.freeze([10, 15, 25, 30, 20])
  }),
  back: Object.freeze({
    id: "back",
    label: "후문",
    counts: Object.freeze([8, 12, 20, 25, 35])
  })
});

export function sumCounts(counts) {
  return counts.reduce((sum, count) => sum + count, 0);
}

export function getFrequencyRows(gate) {
  return TRAFFIC_INTERVALS.map((interval, index) => Object.freeze({
    interval,
    frequency: gate.counts[index]
  }));
}

export function getRelativeFrequencyRows(gate) {
  const total = sumCounts(gate.counts);
  return getFrequencyRows(gate).map((row) => Object.freeze({
    ...row,
    relativeFrequency: row.frequency / total,
    percent: Math.round((row.frequency / total) * 100)
  }));
}

export function getPeakInterval(gate) {
  const max = Math.max(...gate.counts);
  const index = gate.counts.indexOf(max);
  const total = sumCounts(gate.counts);
  return Object.freeze({
    gate: gate.id,
    label: gate.label,
    index,
    interval: TRAFFIC_INTERVALS[index],
    frequency: max,
    percent: Math.round((max / total) * 100)
  });
}

export function getTrafficReportSummary() {
  const mainPeak = getPeakInterval(GATE_TRAFFIC.main);
  const backPeak = getPeakInterval(GATE_TRAFFIC.back);
  return Object.freeze({
    mainTotal: sumCounts(GATE_TRAFFIC.main.counts),
    backTotal: sumCounts(GATE_TRAFFIC.back.counts),
    mainPeak,
    backPeak,
    bestGraph: "꺾은선그래프",
    exactTable: "도수분포표",
    relativeTable: "상대도수분포표",
    helperGate: backPeak.frequency > mainPeak.frequency ? "후문" : "정문"
  });
}

function normalize(value) {
  return String(value ?? "").trim().replace(/\s+/g, "").toLowerCase();
}

function includesKorean(value, needle) {
  return normalize(value).includes(normalize(needle));
}

function matchesIntervalIndex(value, expectedIndex) {
  const text = normalize(value);
  const number = Number(text);
  if (Number.isInteger(number) && number === expectedIndex + 1) return true;
  return text.includes(TRAFFIC_INTERVALS[expectedIndex].replace(/\s+/g, ""));
}

export function checkTrafficReportAnswer(submitted) {
  const summary = getTrafficReportSummary();
  const checks = Object.freeze({
    exactTable: includesKorean(submitted.exactTable, "도수분포표"),
    relativeTable: includesKorean(submitted.relativeTable, "상대도수분포표"),
    graphType: includesKorean(submitted.graphType, "꺾은선"),
    mainPeak: matchesIntervalIndex(submitted.mainPeak, summary.mainPeak.index),
    backPeak: matchesIntervalIndex(submitted.backPeak, summary.backPeak.index),
    helperGate: includesKorean(submitted.helperGate, summary.helperGate)
  });

  return Object.freeze({
    correct: Object.values(checks).every(Boolean),
    checks,
    summary
  });
}
