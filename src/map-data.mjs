export const MAP_DATA = Object.freeze({
  id: "1map1",
  title: "막힌 골목의 계산서",
  budget: 170000,
  billedTotal: 172500,
  deliveryFee: 6000,
  billedDeliveryFee: 11000,
  items: [
    { id: "flour", name: "밀가루", quantity: 3, unit: "포대", unitPrice: 18500, color: "#e8c48c" },
    { id: "milk", name: "우유", quantity: 4, unit: "상자", unitPrice: 12800, color: "#9ed9e3" },
    { id: "butter", name: "버터", quantity: 2, unit: "상자", unitPrice: 27400, color: "#f1cf56" }
  ]
});

export const NOTE_DEFINITIONS = Object.freeze({
  order: {
    category: "주문서",
    title: "주문 수량과 최대 예산",
    detail: "밀가루 3포대 · 우유 4상자 · 버터 2상자 / 예산 170,000원"
  },
  flour: {
    category: "상자 라벨",
    title: "밀가루 단가",
    detail: "1포대당 18,500원"
  },
  milk: {
    category: "상자 라벨",
    title: "우유 단가",
    detail: "1상자당 12,800원"
  },
  butter: {
    category: "상자 라벨",
    title: "버터 단가",
    detail: "1상자당 27,400원"
  },
  delivery: {
    category: "배송 계약표",
    title: "계약 배송비",
    detail: "이번 구역 1회 배송: 6,000원 / 전체 비용에 한 번만 포함"
  }
});

export const REQUIRED_NOTES = Object.freeze(["order", "flour", "milk", "butter", "delivery"]);

export const HINTS = Object.freeze({
  cost: [
    "계산서가 예산을 넘은 이유를 찾으려면 실제로 내야 할 전체 비용을 먼저 구해야 해.",
    "주문 수량과 상자 단가를 짝지어 봐. 배송비 1회분도 전체 비용에 포함해야 해.",
    "각 식자재는 ‘수량 × 단가’로 계산하고, 마지막에 계약 배송비를 한 번만 더해 보자.",
    "식자재 비용은 161,500원이야. 여기에 계약 배송비 6,000원을 한 번 더한 뒤 예산과 비교해 봐."
  ],
  invoice: [
    "실제 비용과 계산서의 차이는 5,000원이야. 어느 줄에서 차이가 생겼을까?",
    "밀가루, 우유, 버터의 항목별 비용은 실제 계산과 같아.",
    "차량 앞쪽에서 확인한 계약 배송비와 계산서의 배송비를 비교해 봐.",
    "계산서의 배송비 11,000원을 계약 금액 6,000원으로 수정하면 돼."
  ]
});

export const DIALOGUES = Object.freeze({
  intro: [
    { speaker: "WH", avatar: "WH", text: "학교 가는 길이 차로 꽉 막혔네." },
    {
      speaker: "배송 기사",
      avatar: "기사",
      text: "리프트가 펼쳐져 있어서 지금은 지나가면 위험해. 계산서 확인이 끝나면 바로 길을 비켜 줄게."
    }
  ],
  clerk: [
    {
      speaker: "빵집 담당자",
      avatar: "빵집",
      text: "예산은 17만 원인데 청구액은 17만 2천5백 원이야. 주문한 수량과 계약 배송비를 같이 확인해 줄래?"
    },
    { speaker: "WH", avatar: "WH", text: "주문서와 실제 상자를 비교한 다음, 전체 비용을 계산해 볼게요." }
  ],
  success: [
    { speaker: "빵집 담당자", avatar: "빵집", text: "배송비 입력이 잘못됐구나. 덕분에 예산 안에서 정확히 처리했어!" },
    { speaker: "배송 기사", avatar: "기사", text: "확인 완료! 리프트를 접고 바로 길을 비켜 줄게." }
  ]
});
