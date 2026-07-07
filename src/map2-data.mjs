export const MAP2_RECORDS = Object.freeze({
  sales: {
    category: "매출 집계표",
    title: "전날 시장 총매출",
    detail: "4,578,620원 / 회의 보고는 십만 원 단위의 가까운 값으로 작성"
  },
  budget: {
    category: "구매 견적서",
    title: "공동 포장재 구매 비용",
    detail: "2,346,800원 / 신청 예산은 부족하지 않게 십만 원 단위로 작성"
  },
  deposit: {
    category: "현금 계수표",
    title: "입금 전 현금 총액",
    detail: "1,287,650원 / 만 원 묶음만 입금하고 나머지는 거스름돈 준비금으로 보관"
  }
});

export const MAP2_RECORD_IDS = Object.freeze(["sales", "budget", "deposit"]);

export const ESTIMATION_TASKS = Object.freeze([
  {
    id: "sales",
    document: "매출 보고서",
    method: "반올림",
    value: 4578620,
    place: 100000,
    placeName: "십만",
    prompt: "4,578,620을 반올림하여 십만의 자리까지 나타내세요.",
    answer: 4600000,
    reason: "빠른 회의에서 전체 매출 규모를 가까운 값으로 보고"
  },
  {
    id: "budget",
    document: "구매 예산 신청서",
    method: "올림",
    value: 2346800,
    place: 100000,
    placeName: "십만",
    prompt: "2,346,800을 올림하여 십만의 자리까지 나타내세요.",
    answer: 2400000,
    reason: "실제 구매 비용보다 신청 금액이 부족하지 않게 작성"
  },
  {
    id: "deposit",
    document: "현금 입금 봉투",
    method: "버림",
    value: 1287650,
    place: 10000,
    placeName: "만",
    prompt: "1,287,650을 버림하여 만의 자리까지 나타내세요.",
    answer: 1280000,
    reason: "완성된 만 원 묶음만 입금하고 나머지는 준비금으로 보관"
  }
]);

export const MAP2_HINTS = Object.freeze({
  sales: [
    "십만의 자리까지 나타내는 문제야.",
    "십만의 자리 바로 아래인 만의 자리 숫자 7을 확인해 봐.",
    "반올림할 때 7은 5 이상이므로 십만의 자리 숫자를 1 크게 해.",
    "4,500,000에서 십만의 자리 숫자 5를 6으로 바꾸고 그 아래 자리는 0으로 나타내 봐."
  ],
  budget: [
    "십만의 자리까지 나타내는 문제야.",
    "십만의 자리 아래에 46,800이 남아 있어.",
    "올림은 아래 자리에 0이 아닌 수가 있으면 십만의 자리 숫자를 1 크게 해.",
    "2,300,000보다 큰 다음 십만 단위의 수를 생각해 봐."
  ],
  deposit: [
    "만의 자리까지 나타내는 문제야.",
    "만의 자리 아래인 천의 자리 이하 7,650을 확인해 봐.",
    "버림은 나타낼 자리 아래의 수를 모두 버리고 0으로 나타내.",
    "1,280,000에서 천의 자리 이하를 모두 0으로 나타낸 값이야."
  ]
});

