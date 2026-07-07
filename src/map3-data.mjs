export const CONVERSION_TASKS = Object.freeze([
  {
    id: "coolant",
    device: "냉각수 주입기",
    badge: "들이",
    source: "2 L 75 mL",
    question: "냉각수의 양을 mL로 나타내세요.",
    targetUnit: "mL",
    answer: 2075,
    relation: "1 L = 1,000 mL",
    purpose: "냉각 장치는 mL 단위의 총량을 인식해."
  },
  {
    id: "schedule",
    device: "점검 일정표",
    badge: "시간",
    source: "1시간 35분",
    question: "점검 시간을 분으로 나타내세요.",
    targetUnit: "분",
    answer: 95,
    relation: "1시간 = 60분",
    purpose: "운행 시스템은 점검 시간을 분 단위로 기록해."
  },
  {
    id: "timer",
    device: "출입문 안전 타이머",
    badge: "시간",
    source: "3분 20초",
    question: "안전 점검 시간을 초로 나타내세요.",
    targetUnit: "초",
    answer: 200,
    relation: "1분 = 60초",
    purpose: "출입문 제어기는 점검 시간을 초 단위로 받아."
  },
  {
    id: "equipment",
    device: "비상 장비 저울",
    badge: "무게",
    source: "4 kg 25 g",
    question: "비상 장비의 무게를 g으로 나타내세요.",
    targetUnit: "g",
    answer: 4025,
    relation: "1 kg = 1,000 g",
    purpose: "적재 저울은 장비 무게를 g 단위로 확인해."
  },
  {
    id: "route",
    device: "주행 경로 보정기",
    badge: "길이",
    source: "1.25 km",
    question: "주행 거리를 cm로 나타내세요.",
    targetUnit: "cm",
    answer: 125000,
    relation: "1 km = 1,000 m · 1 m = 100 cm",
    purpose: "바퀴 회전 보정기는 경로 길이를 cm 단위로 계산해."
  }
]);

export const CONVERSION_HINTS = Object.freeze({
  coolant: [
    "1 L는 1,000 mL야.",
    "2 L를 먼저 2,000 mL로 바꿔 봐.",
    "2,000 mL와 75 mL를 더하면 돼."
  ],
  schedule: [
    "1시간은 60분이야.",
    "1시간 35분은 60분과 35분을 합한 시간이야.",
    "60 + 35를 계산해 봐."
  ],
  timer: [
    "1분은 60초야.",
    "3분을 초로 바꾸면 3 × 60 = 180초야.",
    "180초와 20초를 더해 봐."
  ],
  equipment: [
    "1 kg은 1,000 g이야.",
    "4 kg을 먼저 4,000 g으로 바꿔 봐.",
    "4,000 g과 25 g을 더하면 돼."
  ],
  route: [
    "km에서 cm로 바꾸려면 m를 거쳐 두 번 변환할 수 있어.",
    "1 km는 1,000 m이고, 1 m는 100 cm야.",
    "1.25 × 1,000 × 100을 계산해 봐."
  ]
});

export function getConversionTask(taskId) {
  return CONVERSION_TASKS.find((task) => task.id === taskId) ?? null;
}

