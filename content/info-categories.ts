export interface InfoCategory {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  /** 내부 이미지 상세 페이지 경로 (externalUrl이 없을 때 사용) */
  image?: string;
  /** 설정 시 /info/[slug] 진입 없이 바로 이 URL로 이동 (예: 외부 PDF) */
  externalUrl?: string;
}

export const INFO_CATEGORIES: InfoCategory[] = [
  {
    slug: "information",
    title: "Information",
    emoji: "ℹ️",
    description: "행사 정보를 확인하세요",
    image: "https://keystonellc.kr/sap/2026/0714_now/info/img/info.png",
  },
  {
    slug: "keynote",
    title: "Keynote",
    emoji: "🎤",
    description: "주요 키노트를 확인하세요",
    image: "https://keystonellc.kr/sap/2026/0714_now/info/img/keynote.png",
  },
  {
    slug: "agenda",
    title: "Agenda",
    emoji: "📅",
    description: "전체 세션 일정을 확인하세요",
    externalUrl: "https://keystonellc.kr/sap/2026/0714_now/agenda.pdf",
  },
  {
    slug: "sponsor",
    title: "Sponsor",
    emoji: "🤝",
    description: "참여 스폰서 정보를 확인하세요",
    image: "https://keystonellc.kr/sap/2026/0714_now/info/img/sponsor.png",
  },
  {
    slug: "event",
    title: "Event",
    emoji: "⭐",
    description: "이벤트와 혜택 정보를 확인하세요",
    image: "https://keystonellc.kr/sap/2026/0714_now/info/img/event.png",
  },
  {
    slug: "map",
    title: "Event Map",
    emoji: "📍",
    description: "행사장 위치를 확인하세요",
    image: "https://keystonellc.kr/sap/2026/0714_now/info/img/location.png",
  },
];

export function getInfoCategory(slug: string): InfoCategory | undefined {
  return INFO_CATEGORIES.find((c) => c.slug === slug);
}
