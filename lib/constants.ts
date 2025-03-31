// 사용자 등급별 상수 정의
export const USER_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  PRO: 'pro',
  ADMIN: 'admin'
};

// 등급별 월간 제안 가능 횟수
export const MONTHLY_SUBMISSION_LIMITS = {
  [USER_TIERS.FREE]: 2,
  [USER_TIERS.PREMIUM]: 10,
  [USER_TIERS.PRO]: 999, // 사실상 무제한
  [USER_TIERS.ADMIN]: 999 // 관리자도 무제한
};

// 등급별 가격 정보 (원화 기준)
export const TIER_PRICES = {
  [USER_TIERS.PREMIUM]: 4900, // 월 4,900원
  [USER_TIERS.PRO]: 9900 // 월 9,900원
};

// 등급별 혜택 설명
export const TIER_BENEFITS = {
  [USER_TIERS.FREE]: [
    '월 2회 항목 제안 가능',
    '모든 티어 투표 참여 가능',
    '기본 기능 이용 가능'
  ],
  [USER_TIERS.PREMIUM]: [
    '월 10회 항목 제안 가능',
    '모든 티어 투표 참여 가능',
    '프리미엄 배지 표시',
    '광고 없는 경험'
  ],
  [USER_TIERS.PRO]: [
    '무제한 항목 제안 가능',
    '모든 티어 투표 참여 가능',
    'Pro 배지 표시',
    '광고 없는 경험',
    '우선 항목 검토',
    '커스텀 프로필'
  ]
};
