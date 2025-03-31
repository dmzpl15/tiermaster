// api/admin/seed-items/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const categoryGroups = [
    { group: '🍜 음식', categories: ['라면', '치킨 브랜드', '편의점 간편식', '떡볶이', '즉석 국밥', '분식류', '한식 반찬', '냉동식품', '프랜차이즈 도시락', '아이스크림 브랜드'] },
    { group: '🎬 콘텐츠', categories: ['넷플릭스 드라마', '예능 프로그램', '아이돌 그룹', '영화 명작', 'OTT 플랫폼', '한국 드라마', '웹툰', '게임 스트리머', '웹소설', 'K-POP 명곡', '해외 영화', '애니메이션'] },
    { group: '📱 앱 / 도구', categories: ['생산성 앱', '공부 앱', '메신저 앱', 'SNS', 'SNS 기능 선호도', '영상 편집 앱', '사진 보정 앱', '뉴스 앱', '가계부 앱', '전자책 플랫폼', '가격 비교 사이트', '신선식품 배송앱', '쇼핑앱', '교통/내비 앱'] },
    { group: '👕 패션 / 뷰티', categories: ['신발 브랜드', '화장품 브랜드', '향수', 'SPA 브랜드', '헤어 제품', '남성 패션', '여성 패션', '카페 브랜드 인기', '명품 브랜드', '뷰티 유튜버'] },
    { group: '📚 교육 / 진로', categories: ['수능 과목', '인강 플랫폼', '취업 준비', '전공 학과 비교', '대학교 브랜드', '가성비 대학', '고등학교 유형', '국가고시', '지역별 명문고', '진로 희망 직업', '자격증 / 시험'] },
    { group: '🏘️ 주거 / 지역', categories: ['서민 아파트 브랜드', '살기 좋은 동네', '지역 브랜드 이미지', '서울 외곽 거주 만족도', '경기도 아파트 추천', '광역시 인기 동네', '고향 선호도', '해외 이주 선호 국가'] },
    { group: '⚽ 스포츠', categories: ['K리그 구단 인기', '프로농구 구단 인기', '국대 선수 호감도', '스포츠 해설가 선호도', '야구단 응원도', 'e스포츠 팀 인기', '야구 선수', '축구 선수', '기타 스포츠 스타'] },
    { group: '🛍 소비 / 생활', categories: ['배달앱', '쇼핑몰', '카드사 혜택', '구독 서비스', '청소기 브랜드', '편의점 브랜드', '전기차 브랜드', '렌탈 서비스', '백화점 만족도', '면세점 선호도', '맥주 브랜드', '소주 브랜드', '통신사', '포털/검색엔진'] },
    { group: '🧠 틈새 비교', categories: ['우리 동네 맛집', '나만 알고 싶은 아이템', '유튜버 vs 유튜버', 'SNS 채널 비교', '논란의 명언', '이상형 월드컵', '인터넷 밈', '숙소 예약 플랫폼', '여행 예약 서비스', '국내 여행지 인기', '해외 여행지 인기', '놀이공원 선호도','고속철 선호도'] },
    { group: '🏛 정치 / 사회', categories: ['정당 호감도', '대통령 인지도', '국회의원 호불호', '시사 이슈 공감도', '언론사 신뢰도', '노조 이미지', '정치인 호감도', '역대 대통령 인식'] },
    { group: '💼 경제 / 기업', categories: ['대기업 브랜드 이미지', '중소기업 복지', '프랜차이즈 만족도', '스타트업 평판', '연봉 기대 기업', '퇴사율 높은 기업', '간편결제 선호도', '은행 선호도', '투자 인기 종목', '산업 트렌드', '재벌 총수 호감도'] },
    { group: '🎤 연예 / 인물', categories: ['남자 배우 인기', '여자 배우 인기', '유튜버 호불호', '예능인 호감도', '논란 연예인 이미지', '아이돌 리더 평가', '디지털 장의사 요청도', '남자 가수', '여자 가수', '모델', '방송인'] },
    { group: '🌐 사회 민감 이슈', categories: ['젠더 이슈', '세대 갈등', '직장 내 괴롭힘', '군대 관련 공감도', '주거 정책 만족도', '출산 장려금 인식', '지역 갈등', '이념 대립', '디지털 성범죄/개인정보 이슈', '환경/기후 위기'] },
];

const initialItems = [
    { id: '1', name: '진라면', category: '라면', votes: 12 },
    { id: '2', name: '삼양라면', category: '라면', votes: 9 },
    { id: '3', name: '너구리', category: '라면', votes: 15 },
    { id: '4', name: '교촌치킨', category: '치킨 브랜드', votes: 17 },
    { id: '5', name: '굽네치킨', category: '치킨 브랜드', votes: 11 },
    { id: '6', name: '맘스터치', category: '치킨 브랜드', votes: 13 },
    { id: '7', name: '신전떡볶이', category: '떡볶이', votes: 14 },
    { id: '8', name: '죠스떡볶이', category: '떡볶이', votes: 8 },
    { id: '9', name: '응급실떡볶이', category: '떡볶이', votes: 10 },
    { id: '10', name: '참치마요', category: '편의점 간편식', votes: 20 },
    { id: '11', name: '불닭마요', category: '편의점 간편식', votes: 16 },

    { id: '12', name: '킹덤', category: '넷플릭스 드라마', votes: 22 },
    { id: '13', name: '더 글로리', category: '넷플릭스 드라마', votes: 19 },
    { id: '14', name: '무한도전', category: '예능 프로그램', votes: 25 },
    { id: '15', name: '나혼자산다', category: '예능 프로그램', votes: 18 },
    { id: '16', name: 'BTS', category: '아이돌 그룹', votes: 30 },
    { id: '17', name: '뉴진스', category: '아이돌 그룹', votes: 28 },
    { id: '18', name: '기생충', category: '영화 명작', votes: 21 },
    { id: '19', name: '살인의 추억', category: '영화 명작', votes: 23 },

    { id: '20', name: 'Notion', category: '생산성 앱', votes: 30 },
    { id: '21', name: 'Todoist', category: '생산성 앱', votes: 15 },
    { id: '22', name: '카카오톡', category: '메신저 앱', votes: 27 },
    { id: '23', name: '디스코드', category: '메신저 앱', votes: 10 },

    { id: '24', name: '나이키', category: '신발 브랜드', votes: 18 },
    { id: '25', name: '뉴발란스', category: '신발 브랜드', votes: 14 },

    { id: '26', name: '라네즈 쿠션', category: '화장품 브랜드', votes: 12 },
    { id: '27', name: '클리오 킬커버', category: '화장품 브랜드', votes: 11 },

    { id: '28', name: '국어', category: '수능 과목', votes: 10 },
    { id: '29', name: '수학', category: '수능 과목', votes: 12 },
    { id: '30', name: '영어', category: '수능 과목', votes: 9 },

    { id: '31', name: '메가스터디', category: '인강 플랫폼', votes: 11 },
    { id: '32', name: '이투스', category: '인강 플랫폼', votes: 8 },

    { id: '33', name: '배달의민족', category: '배달앱', votes: 26 },
    { id: '34', name: '요기요', category: '배달앱', votes: 18 },
    { id: '35', name: '무신사', category: '쇼핑몰', votes: 22 },
    { id: '36', name: '29CM', category: '쇼핑몰', votes: 16 },

    { id: '37', name: '홍대맛집', category: '우리 동네 맛집', votes: 9 },
    { id: '38', name: '망원 맛집', category: '우리 동네 맛집', votes: 10 },

    { id: '39', name: '스벅 텀블러', category: '나만 알고 싶은 아이템', votes: 10 },
    { id: '40', name: '탱글젤리 핸드크림', category: '나만 알고 싶은 아이템', votes: 8 },

    { id: '41', name: '더불어민주당', category: '정당 호감도', votes: 15 },
    { id: '42', name: '국민의힘', category: '정당 호감도', votes: 13 },

    { id: '43', name: '윤석열 대통령', category: '대통령 인지도', votes: 19 },
    { id: '44', name: '이재명 대표', category: '대통령 인지도', votes: 14 },

    { id: '45', name: '삼성전자', category: '대기업 브랜드 이미지', votes: 30 },
    { id: '46', name: '카카오', category: '대기업 브랜드 이미지', votes: 12 },
    { id: '47', name: '토스', category: '스타트업 평판', votes: 16 },
    { id: '48', name: '직방', category: '스타트업 평판', votes: 11 },

    { id: '49', name: '박보검', category: '남자 배우 인기', votes: 24 },
    { id: '50', name: '이준호', category: '남자 배우 인기', votes: 19 },

    { id: '51', name: '김태리', category: '여자 배우 인기', votes: 27 },
    { id: '52', name: '한소희', category: '여자 배우 인기', votes: 25 },

    { id: '53', name: '이영지', category: '예능인 호감도', votes: 20 },
    { id: '54', name: '유재석', category: '예능인 호감도', votes: 30 },

    { id: '55', name: '남녀 갈등 이슈', category: '젠더 이슈', votes: 11 },
    { id: '56', name: '데이트비용 논쟁', category: '젠더 이슈', votes: 13 },

    { id: '57', name: 'MZ세대 vs 586세대', category: '세대 갈등', votes: 15 },
    { id: '58', name: 'N포세대 논쟁', category: '세대 갈등', votes: 12 },

    { id: '59', name: '전세 사기 대응 정책', category: '주거 정책 만족도', votes: 13 },
    { id: '60', name: '청년 월세 지원금', category: '주거 정책 만족도', votes: 10 },
    { id: '61', name: '래미안', category: '서민 아파트 브랜드', votes: 13 },
    { id: '62', name: '푸르지오', category: '서민 아파트 브랜드', votes: 11 },
    { id: '63', name: '신림동', category: '살기 좋은 동네', votes: 12 },
    { id: '64', name: '망원동', category: '살기 좋은 동네', votes: 10 },
    { id: '65', name: '강남구', category: '지역 브랜드 이미지', votes: 20 },
    { id: '66', name: '분당구', category: '지역 브랜드 이미지', votes: 16 },
    { id: '67', name: '서울 외곽 동작구', category: '서울 외곽 거주 만족도', votes: 8 },
    { id: '68', name: '서울 외곽 중랑구', category: '서울 외곽 거주 만족도', votes: 7 },
    { id: '69', name: '수지구', category: '경기도 아파트 추천', votes: 14 },
    { id: '70', name: '일산서구', category: '경기도 아파트 추천', votes: 11 },
    { id: '71', name: '해운대구', category: '광역시 인기 동네', votes: 15 },
    { id: '72', name: '동래구', category: '광역시 인기 동네', votes: 12 },
    { id: '73', name: 'FC 서울', category: 'K리그 구단 인기', votes: 17 },
    { id: '74', name: '울산 현대', category: 'K리그 구단 인기', votes: 18 },
    { id: '75', name: '서울 SK', category: '프로농구 구단 인기', votes: 13 },
    { id: '76', name: '안양 KGC', category: '프로농구 구단 인기', votes: 12 },
    { id: '77', name: '손흥민', category: '국대 선수 호감도', votes: 32 },
    { id: '78', name: '김민재', category: '국대 선수 호감도', votes: 28 },
    { id: '79', name: '이영표', category: '스포츠 해설가 선호도', votes: 10 },
    { id: '80', name: '서형욱', category: '스포츠 해설가 선호도', votes: 8 },
    { id: '81', name: 'LG 트윈스', category: '야구단 응원도', votes: 20 },
    { id: '82', name: '두산 베어스', category: '야구단 응원도', votes: 19 },
    { id: '83', name: 'T1', category: 'e스포츠 팀 인기', votes: 25 },
    { id: '84', name: '젠지', category: 'e스포츠 팀 인기', votes: 23 },
    { id: '85', name: '삼성카드', category: '카드사 혜택', votes: 16 },
    { id: '86', name: '국민카드', category: '카드사 혜택', votes: 14 },
    { id: '87', name: '넷플릭스', category: '구독 서비스', votes: 28 },
    { id: '88', name: '쿠팡 와우', category: '구독 서비스', votes: 25 },
    { id: '89', name: 'LG 코드제로', category: '청소기 브랜드', votes: 17 },
    { id: '90', name: '다이슨 V12', category: '청소기 브랜드', votes: 21 },
    { id: '91', name: 'CU', category: '편의점 브랜드', votes: 19 },
    { id: '92', name: 'GS25', category: '편의점 브랜드', votes: 20 },
    { id: '93', name: '현대 아이오닉 5', category: '전기차 브랜드', votes: 22 },
    { id: '94', name: '기아 EV6', category: '전기차 브랜드', votes: 23 },
    { id: '95', name: '청호나이스', category: '렌탈 서비스', votes: 12 },
    { id: '96', name: '코웨이', category: '렌탈 서비스', votes: 18 },
    { id: '97', name: '현대백화점', category: '백화점 만족도', votes: 17 },
    { id: '98', name: '롯데백화점', category: '백화점 만족도', votes: 14 },
    { id: '99', name: '신라면세점', category: '면세점 선호도', votes: 15 },
    { id: '100', name: '롯데면세점', category: '면세점 선호도', votes: 13 },
    { id: '101', name: '제주도', category: '국내 여행지 인기', votes: 28 },
    { id: '102', name: '강릉', category: '국내 여행지 인기', votes: 23 },
    { id: '103', name: '보라카이', category: '해외 여행지 인기', votes: 19 },
    { id: '104', name: '오사카', category: '해외 여행지 인기', votes: 22 },
    { id: '105', name: '에버랜드', category: '놀이공원 선호도', votes: 26 },
    { id: '106', name: '롯데월드', category: '놀이공원 선호도', votes: 24 },
    { id: '107', name: '한솥 도시락', category: '프랜차이즈 도시락', votes: 21 },
    { id: '108', name: '본도시락', category: '프랜차이즈 도시락', votes: 19 },
    { id: '109', name: '이디야 커피', category: '카페 브랜드 인기', votes: 22 },
    { id: '110', name: '스타벅스', category: '카페 브랜드 인기', votes: 30 },
    { id: '111', name: '서울대', category: '대학교 브랜드', votes: 27 },
    { id: '112', name: '연세대', category: '대학교 브랜드', votes: 25 },
    { id: '113', name: '휘문고', category: '지역별 명문고', votes: 14 },
    { id: '114', name: '한영외고', category: '지역별 명문고', votes: 16 },
    { id: '115', name: '네이버페이', category: '간편결제 선호도', votes: 18 },
    { id: '116', name: '카카오페이', category: '간편결제 선호도', votes: 22 },
    { id: '117', name: '삼성페이', category: '간편결제 선호도', votes: 25 },
    { id: '118', name: '토스페이', category: '간편결제 선호도', votes: 20 },
    { id: '119', name: '서울시립대', category: '가성비 대학', votes: 15 },
    { id: '120', name: '인천대', category: '가성비 대학', votes: 14 },
    { id: '121', name: 'SRT', category: '고속철 선호도', votes: 19 },
    { id: '122', name: 'KTX', category: '고속철 선호도', votes: 21 },
    { id: '123', name: '리디북스', category: '전자책 플랫폼', votes: 18 },
    { id: '124', name: '밀리의 서재', category: '전자책 플랫폼', votes: 20 },
    { id: '125', name: '다나와', category: '가격 비교 사이트', votes: 16 },
    { id: '126', name: '에누리', category: '가격 비교 사이트', votes: 13 },
    { id: '127', name: '마켓컬리', category: '신선식품 배송앱', votes: 19 },
    { id: '128', name: '헬로네이처', category: '신선식품 배송앱', votes: 14 },
    { id: '129', name: '우리은행', category: '은행 선호도', votes: 17 },
    { id: '130', name: '신한은행', category: '은행 선호도', votes: 22 },
    { id: '131', name: '카카오뱅크', category: '은행 선호도', votes: 25 },
    { id: '132', name: '토스뱅크', category: '은행 선호도', votes: 19 },
    { id: '133', name: '야놀자', category: '숙소 예약 플랫폼', votes: 24 },
    { id: '134', name: '여기어때', category: '숙소 예약 플랫폼', votes: 23 },
    { id: '135', name: '인스타그램 스토리', category: 'SNS 기능 선호도', votes: 20 },
    { id: '136', name: '유튜브 쇼츠', category: 'SNS 기능 선호도', votes: 28 },
    { id: '137', name: '마이리얼트립', category: '여행 예약 서비스', votes: 17 },
    { id: '138', name: '트리플', category: '여행 예약 서비스', votes: 14 },
    { id: '139', name: '배스킨라빈스', category: '아이스크림 브랜드', votes: 20 },
    { id: '140', name: '나뚜루', category: '아이스크림 브랜드', votes: 16 },
    { id: '141', name: '비비고 만두', category: '냉동식품', votes: 21 },

    { id: '142', name: '오뚜기 볶음밥', category: '냉동식품', votes: 19 },

    { id: '143', name: '안성탕면', category: '라면', votes: 11 },
    { id: '144', name: '팔도비빔면', category: '라면', votes: 14 },
    { id: '145', name: '신라면', category: '라면', votes: 19 },
    { id: '146', name: '짜파게티', category: '라면', votes: 17 },
    { id: '147', name: '불닭볶음면', category: '라면', votes: 22 },
    { id: '148', name: '틈새라면', category: '라면', votes: 8 },
    { id: '149', name: '튀김우동', category: '라면', votes: 10 },
    { id: '150', name: '나가사끼 짬뽕', category: '라면', votes: 13 },
    { id: '151', name: '꼬꼬면', category: '라면', votes: 9 },
    { id: '152', name: '참깨라면', category: '라면', votes: 7 },
    { id: '153', name: '무파마', category: '라면', votes: 6 },
    { id: '154', name: '열라면', category: '라면', votes: 11 },
    { id: '155', name: '쇠고기면', category: '라면', votes: 5 },
    { id: '156', name: '왕뚜껑', category: '라면', votes: 15 },
    { id: '157', name: '육개장 사발면', category: '라면', votes: 12 },
    { id: '158', name: '진짬뽕', category: '라면', votes: 16 },
    { id: '159', name: '김치사발면', category: '라면', votes: 10 },
    { id: '160', name: '맛짬뽕', category: '라면', votes: 8 },
    { id: '161', name: '육개장 큰사발', category: '라면', votes: 9 },
    { id: '162', name: '참라면', category: '라면', votes: 6 },
    { id: '163', name: '왕갈비탕면', category: '라면', votes: 7 },
    { id: '164', name: '쇠고기김치면', category: '라면', votes: 5 },
    { id: '165', name: '고추장찌개면', category: '라면', votes: 4 },
    { id: '166', name: '해물짬뽕', category: '라면', votes: 6 },
    { id: '167', name: '불타는 고추짬뽕', category: '라면', votes: 5 },
    { id: '168', name: '오징어짬뽕', category: '라면', votes: 7 },
    { id: '169', name: '진짬짜면', category: '라면', votes: 8 },
    { id: '170', name: '짜왕', category: '라면', votes: 12 },
    { id: '171', name: '배홍동 비빔면', category: '라면', votes: 14 },
    { id: '172', name: '틈새라면 빨계떡', category: '라면', votes: 10 },
    { id: '173', name: '열라면 큰사발', category: '라면', votes: 7 },
    { id: '174', name: '틈새라면 틈새컵', category: '라면', votes: 6 },
    { id: '175', name: '부대찌개면', category: '라면', votes: 5 },
    { id: '176', name: '꼬꼬면 컵', category: '라면', votes: 4 },
    { id: '177', name: '튀김우동 큰사발', category: '라면', votes: 6 },
    { id: '178', name: '멸치칼국수면', category: '라면', votes: 3 },

    { id: '179', name: 'BBQ', category: '치킨 브랜드', votes: 18 },
    { id: '180', name: 'BHC', category: '치킨 브랜드', votes: 16 },
    { id: '181', name: '노랑통닭', category: '치킨 브랜드', votes: 9 },
    { id: '182', name: '페리카나', category: '치킨 브랜드', votes: 7 },
    { id: '183', name: '처갓집 양념치킨', category: '치킨 브랜드', votes: 10 },
    { id: '184', name: '네네치킨', category: '치킨 브랜드', votes: 12 },
    { id: '185', name: '또래오래', category: '치킨 브랜드', votes: 8 },
    { id: '186', name: '호식이 두마리치킨', category: '치킨 브랜드', votes: 9 },
    { id: '187', name: '지코바', category: '치킨 브랜드', votes: 11 },
    { id: '188', name: '60계 치킨', category: '치킨 브랜드', votes: 10 },
    { id: '189', name: '푸라닭', category: '치킨 브랜드', votes: 13 },
    { id: '190', name: '오븐에 빠진 닭', category: '치킨 브랜드', votes: 6 },
    { id: '191', name: '치킨마루', category: '치킨 브랜드', votes: 7 },
    { id: '192', name: '멕시카나', category: '치킨 브랜드', votes: 8 },
    { id: '193', name: '바르닭', category: '치킨 브랜드', votes: 5 },
    { id: '194', name: '링크치킨', category: '치킨 브랜드', votes: 3 },
    { id: '195', name: '치르치르', category: '치킨 브랜드', votes: 6 },
    { id: '196', name: '코리엔탈깻잎치킨', category: '치킨 브랜드', votes: 4 },
    { id: '197', name: '스모프치킨', category: '치킨 브랜드', votes: 4 },

    { id: '198', name: '참치마요 삼각김밥', category: '편의점 간편식', votes: 20 },
    { id: '199', name: '불닭마요 삼각김밥', category: '편의점 간편식', votes: 16 },
    { id: '200', name: '제육볶음 도시락', category: '편의점 간편식', votes: 14 },
    { id: '201', name: '돈까스 도시락', category: '편의점 간편식', votes: 13 },
    { id: '202', name: '치킨마요 덮밥', category: '편의점 간편식', votes: 15 },
    { id: '203', name: '햄치즈 샌드위치', category: '편의점 간편식', votes: 12 },
    { id: '204', name: '불고기버거', category: '편의점 간편식', votes: 11 },
    { id: '205', name: '매콤닭갈비 볶음밥', category: '편의점 간편식', votes: 10 },
    { id: '206', name: '김치볶음밥 컵밥', category: '편의점 간편식', votes: 9 },
    { id: '207', name: '참치주먹밥', category: '편의점 간편식', votes: 8 },
    { id: '208', name: '스팸김치볶음밥', category: '편의점 간편식', votes: 10 },
    { id: '209', name: '참치마요네즈 주먹밥', category: '편의점 간편식', votes: 7 },
    { id: '210', name: '오믈렛덮밥 도시락', category: '편의점 간편식', votes: 8 },
    { id: '211', name: '닭가슴살 샐러드', category: '편의점 간편식', votes: 9 },
    { id: '212', name: '불닭볶음면 컵밥', category: '편의점 간편식', votes: 10 },
    { id: '213', name: '오징어덮밥 도시락', category: '편의점 간편식', votes: 6 },
    { id: '214', name: '참치김치찌개 도시락', category: '편의점 간편식', votes: 7 },
    { id: '215', name: '에그마요 샌드위치', category: '편의점 간편식', votes: 12 },
    { id: '216', name: '에그불고기 버거', category: '편의점 간편식', votes: 6 },
    { id: '217', name: '스파게티 도시락', category: '편의점 간편식', votes: 9 },
    { id: '218', name: '커리덮밥', category: '편의점 간편식', votes: 7 },
    { id: '219', name: '불고기 또띠아', category: '편의점 간편식', votes: 5 },
    { id: '220', name: '소시지김치볶음밥', category: '편의점 간편식', votes: 8 },
    { id: '221', name: '토스트 샌드위치', category: '편의점 간편식', votes: 7 },
    { id: '222', name: '곱창볶음 도시락', category: '편의점 간편식', votes: 6 },
    { id: '223', name: '참치야채 김밥', category: '편의점 간편식', votes: 10 },
    { id: '224', name: '치즈불닭김밥', category: '편의점 간편식', votes: 9 },

    { id: '225', name: '신전떡볶이', category: '떡볶이', votes: 14 },
    { id: '226', name: '죠스떡볶이', category: '떡볶이', votes: 8 },
    { id: '227', name: '응급실떡볶이', category: '떡볶이', votes: 10 },
    { id: '228', name: '두끼떡볶이', category: '떡볶이', votes: 12 },
    { id: '229', name: '국대떡볶이', category: '떡볶이', votes: 11 },
    { id: '230', name: '청년다방 떡볶이', category: '떡볶이', votes: 9 },
    { id: '231', name: '엽기떡볶이', category: '떡볶이', votes: 18 },
    { id: '232', name: '동대문 엽기떡볶이', category: '떡볶이', votes: 8 }, // 일부 중복 인식 가능
    { id: '233', name: '불스떡볶이', category: '떡볶이', votes: 7 },
    { id: '234', name: '홍떡', category: '떡볶이', votes: 6 },

    { id: '242', name: '오뚜기 소고기국밥', category: '즉석 국밥', votes: 12 },
    { id: '243', name: '오뚜기 설렁탕', category: '즉석 국밥', votes: 11 },
    { id: '244', name: '오뚜기 육개장', category: '즉석 국밥', votes: 13 },
    { id: '245', name: '오뚜기 곰탕', category: '즉석 국밥', votes: 10 },
    { id: '246', name: '비비고 육개장', category: '즉석 국밥', votes: 15 },
    { id: '247', name: '비비고 설렁탕', category: '즉석 국밥', votes: 14 },
    { id: '248', name: '비비고 사골곰탕', category: '즉석 국밥', votes: 12 },
    { id: '249', name: '햇반 컵반 육개장국밥', category: '즉석 국밥', votes: 9 },
    { id: '250', name: '햇반 컵반 순댓국밥', category: '즉석 국밥', votes: 8 },
    { id: '251', name: '본설렁탕 국밥', category: '즉석 국밥', votes: 10 },
    { id: '252', name: '홍반장 돼지국밥', category: '즉석 국밥', votes: 7 },
    { id: '253', name: '양반 소고기무국', category: '즉석 국밥', votes: 6 },
    { id: '254', name: '한촌설렁탕 국밥', category: '즉석 국밥', votes: 7 },

    { id: '255', name: '김밥', category: '분식류', votes: 18 },
    { id: '256', name: '참치김밥', category: '분식류', votes: 15 },
    { id: '257', name: '치즈김밥', category: '분식류', votes: 14 },
    { id: '258', name: '소고기김밥', category: '분식류', votes: 13 },
    { id: '259', name: '떡볶이', category: '분식류', votes: 20 }, // 중복 허용
    { id: '260', name: '라볶이', category: '분식류', votes: 16 },
    { id: '261', name: '오뎅탕', category: '분식류', votes: 12 },
    { id: '262', name: '튀김', category: '분식류', votes: 15 },
    { id: '263', name: '김말이튀김', category: '분식류', votes: 14 },
    { id: '264', name: '오징어튀김', category: '분식류', votes: 13 },
    { id: '265', name: '순대', category: '분식류', votes: 17 },
    { id: '266', name: '순대볶음', category: '분식류', votes: 11 },
    { id: '267', name: '계란말이', category: '분식류', votes: 10 },
    { id: '268', name: '주먹밥', category: '분식류', votes: 12 },
    { id: '269', name: '찹쌀도너츠', category: '분식류', votes: 9 },
    { id: '270', name: '만두', category: '분식류', votes: 14 },
    { id: '271', name: '부추전', category: '분식류', votes: 8 },
    { id: '272', name: '핫도그', category: '분식류', votes: 13 },
    { id: '273', name: '컵밥', category: '분식류', votes: 10 },

    { id: '274', name: '진미채볶음', category: '한식 반찬', votes: 13 },
    { id: '275', name: '멸치볶음', category: '한식 반찬', votes: 15 },
    { id: '276', name: '콩자반', category: '한식 반찬', votes: 12 },
    { id: '277', name: '계란말이', category: '한식 반찬', votes: 17 },
    { id: '278', name: '감자조림', category: '한식 반찬', votes: 14 },
    { id: '279', name: '우엉조림', category: '한식 반찬', votes: 11 },
    { id: '280', name: '소시지볶음', category: '한식 반찬', votes: 16 },
    { id: '281', name: '스팸구이', category: '한식 반찬', votes: 13 },
    { id: '282', name: '김치볶음', category: '한식 반찬', votes: 10 },
    { id: '283', name: '어묵볶음', category: '한식 반찬', votes: 15 },
    { id: '284', name: '두부조림', category: '한식 반찬', votes: 14 },
    { id: '285', name: '애호박볶음', category: '한식 반찬', votes: 9 },
    { id: '286', name: '참나물무침', category: '한식 반찬', votes: 8 },
    { id: '287', name: '열무김치', category: '한식 반찬', votes: 10 },
    { id: '288', name: '총각김치', category: '한식 반찬', votes: 11 },
    { id: '289', name: '파김치', category: '한식 반찬', votes: 10 },
    { id: '290', name: '깍두기', category: '한식 반찬', votes: 12 },
    { id: '291', name: '부추무침', category: '한식 반찬', votes: 8 },
    { id: '292', name: '청포묵무침', category: '한식 반찬', votes: 7 },
    { id: '293', name: '마늘쫑볶음', category: '한식 반찬', votes: 8 },
    { id: '294', name: '고추장멸치볶음', category: '한식 반찬', votes: 7 },
    { id: '295', name: '표고버섯볶음', category: '한식 반찬', votes: 7 },
    { id: '296', name: '가지나물', category: '한식 반찬', votes: 6 },
    { id: '297', name: '시금치나물', category: '한식 반찬', votes: 9 },
    { id: '298', name: '도라지무침', category: '한식 반찬', votes: 7 },
    { id: '299', name: '고사리나물', category: '한식 반찬', votes: 6 },
    { id: '300', name: '묵은지볶음', category: '한식 반찬', votes: 8 },
    { id: '301', name: '청국장비빔', category: '한식 반찬', votes: 5 },
    { id: '302', name: '고추장불고기', category: '한식 반찬', votes: 10 },
    { id: '303', name: '소불고기', category: '한식 반찬', votes: 11 },
    { id: '304', name: '제육볶음', category: '한식 반찬', votes: 13 },
    { id: '305', name: '계란장조림', category: '한식 반찬', votes: 10 },
    { id: '306', name: '소고기장조림', category: '한식 반찬', votes: 12 },
    { id: '307', name: '명란젓', category: '한식 반찬', votes: 9 },
    { id: '308', name: '오징어젓갈', category: '한식 반찬', votes: 8 },
    { id: '309', name: '낙지젓', category: '한식 반찬', votes: 7 },
    { id: '310', name: '갈치속젓', category: '한식 반찬', votes: 6 },

    { id: '311', name: '비비고 왕교자', category: '냉동식품', votes: 25 },
    { id: '312', name: '비비고 김치왕교자', category: '냉동식품', votes: 20 },
    { id: '314', name: '오뚜기 낙지볶음밥', category: '냉동식품', votes: 14 },
    { id: '315', name: '비비고 새우볶음밥', category: '냉동식품', votes: 17 },
    { id: '316', name: '비비고 한섬만두', category: '냉동식품', votes: 12 },
    { id: '317', name: '풀무원 얇은피 만두', category: '냉동식품', votes: 18 },
    { id: '318', name: '피코크 한우미역국', category: '냉동식품', votes: 11 },
    { id: '319', name: '피코크 육개장', category: '냉동식품', votes: 13 },
    { id: '320', name: '비비고 돼지불고기', category: '냉동식품', votes: 15 },
    { id: '321', name: '비비고 순살고등어구이', category: '냉동식품', votes: 9 },
    { id: '322', name: 'CJ 고메 함박스테이크', category: '냉동식품', votes: 16 },
    { id: '323', name: '고메 치킨너겟', category: '냉동식품', votes: 14 },
    { id: '324', name: '고메 핫도그', category: '냉동식품', votes: 13 },
    { id: '325', name: '이마트 노브랜드 군만두', category: '냉동식품', votes: 11 },
    { id: '326', name: '노브랜드 탕수육', category: '냉동식품', votes: 10 },
    { id: '327', name: '비비고 잔치국수', category: '냉동식품', votes: 8 },
    { id: '328', name: '풀무원 칼국수', category: '냉동식품', votes: 9 },
    { id: '329', name: '삼진어묵 우동', category: '냉동식품', votes: 7 },
    { id: '330', name: '피코크 순대국', category: '냉동식품', votes: 10 },

    { id: '331', name: '한솥도시락', category: '프랜차이즈 도시락', votes: 21 },
    { id: '332', name: '본도시락', category: '프랜차이즈 도시락', votes: 18 },
    { id: '333', name: 'GS25 도시락', category: '프랜차이즈 도시락', votes: 16 },
    { id: '334', name: 'CU 도시락', category: '프랜차이즈 도시락', votes: 15 },
    { id: '335', name: '세븐일레븐 도시락', category: '프랜차이즈 도시락', votes: 13 },
    { id: '336', name: '이마트24 도시락', category: '프랜차이즈 도시락', votes: 10 },
    { id: '337', name: '오니기리와 이규동', category: '프랜차이즈 도시락', votes: 9 },
    { id: '338', name: '오봉도시락', category: '프랜차이즈 도시락', votes: 8 },
    { id: '339', name: '미고도시락', category: '프랜차이즈 도시락', votes: 6 },
    { id: '340', name: '도시락킹', category: '프랜차이즈 도시락', votes: 5 },


    { id: '341', name: '배스킨라빈스', category: '아이스크림 브랜드', votes: 20 },
    { id: '342', name: '나뚜루', category: '아이스크림 브랜드', votes: 16 },
    { id: '343', name: '하겐다즈', category: '아이스크림 브랜드', votes: 18 },
    { id: '344', name: '메로나', category: '아이스크림 브랜드', votes: 14 },
    { id: '345', name: '빙그레 투게더', category: '아이스크림 브랜드', votes: 15 },
    { id: '346', name: '롯데 월드콘', category: '아이스크림 브랜드', votes: 13 },
    { id: '347', name: '롯데 죠스바', category: '아이스크림 브랜드', votes: 12 },
    { id: '348', name: '롯데 스크류바', category: '아이스크림 브랜드', votes: 11 },
    { id: '349', name: '롯데 설레임', category: '아이스크림 브랜드', votes: 10 },
    { id: '350', name: '빙그레 붕어싸만코', category: '아이스크림 브랜드', votes: 14 },
    { id: '351', name: '해태 누가바', category: '아이스크림 브랜드', votes: 12 },
    { id: '352', name: '해태 바밤바', category: '아이스크림 브랜드', votes: 11 },
    { id: '353', name: '더위사냥', category: '아이스크림 브랜드', votes: 10 },
    { id: '354', name: '빙그레 옥동자', category: '아이스크림 브랜드', votes: 8 },
    { id: '355', name: '폴라포', category: '아이스크림 브랜드', votes: 9 },
    { id: '356', name: 'M&M 아이스크림', category: '아이스크림 브랜드', votes: 6 },
    { id: '357', name: '벤앤제리스', category: '아이스크림 브랜드', votes: 7 },


];

export async function POST() {
    try {
        let insertedGroups = 0;
        let insertedCategories = 0;
        let insertedItems = 0;
        
        //Map을 사용해 group -> group_id, category -> category_id 매핑
        const groupMap = new Map();
        const categoryMap = new Map();
    
        // 그룹 생성 및 ID 저장
        for (const g of categoryGroups) {
          const { data: groupData, error: groupErr } = await supabase
            .from('groups')
            .upsert({ name: g.group })
            .select('id')
            .single();
    
          if (groupErr) throw groupErr;
          groupMap.set(g.group, groupData.id);
          insertedGroups++;
    
          for (const category of g.categories) {
            const { data: catData, error: catErr } = await supabase
              .from('categories')
              .upsert({ name: category, group_id: groupData.id })
              .select('id')
              .single();
    
            if (catErr) throw catErr;
            categoryMap.set(category, catData.id);
            insertedCategories++;
          }
        }
      
        // 아이템 생성
        for (const item of initialItems) {
          const category_id = categoryMap.get(item.category);
          if (!category_id) {
              console.warn('❌ 카테고리 매핑 실패:', item.name, '카테고리:', item.category);
              continue;
            }
            
          // votes 필드 활성화 - 샘플 데이터에 포함된 votes 값 사용
          const { error: itemErr } = await supabase.from('items').insert({
            name: item.name,
            category_id,
           //votes: item.votes, // votes 필드 활성화
             votes: 0  // 명시적으로 0 지정
          });
          
          if (itemErr) {
              console.error('❌ 아이템 삽입 실패:', item.name, itemErr.message);
            } else {
              insertedItems++;
            }
        }
    
        return NextResponse.json({ 
          success: true, 
          message: `샘플 데이터가 성공적으로 삽입되었습니다. (${insertedGroups}개 그룹, ${insertedCategories}개 카테고리, ${insertedItems}개 아이템)`,
          stats: {
            groups: insertedGroups,
            categories: insertedCategories,
            items: insertedItems
          }
        });
    } catch (e) {
      console.error('샘플 데이터 삽입 중 오류:', e);
      return NextResponse.json({ 
        success: false, 
        message: '샘플 데이터 삽입 중 오류가 발생했습니다.',
        error: e instanceof Error ? e.message : String(e) 
      }, { status: 500 });
    }
  }
  
