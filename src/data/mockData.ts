import { InBodyRecord, HistoricalDataPoint, AIReportResult } from '../types';

// The user's actual InBody Result Sheet (SWING GYM 75.5kg)
export const USER_ACTUAL_RECORD: InBodyRecord = {
  id: 'rec_20240820_001',
  telemetryId: '50-SWING',
  timestamp: '2024-08-20T20:47:33+09:00',
  displayDate: '2024.08.20 20:47',
  dateShort: '08.20',
  deviceModel: 'InBody (SWING GYM)',
  location: 'SWING GYM',
  userProfile: {
    gender: '남성',
    age: 49,
    heightCm: 162.0,
  },
  metrics: {
    weightKg: 75.5,
    weightDelta: 0,
    skeletalMuscleKg: 30.1,
    smmDelta: 0,
    bodyFatKg: 22.8,
    bfmDelta: 0,
    percentBodyFat: 30.2,
    pbfDelta: 0,
    bmi: 28.8,
    waistHipRatio: 0.89,
    visceralFatLevel: 9,
    basalMetabolismKcal: 1515,
    fitnessScore: 71,
    targetWeightKg: 63.0,
    targetFatKg: -12.5,
    targetMuscleKg: 0.0,
  },
  segmentalLean: {
    rightArm: '표준',
    leftArm: '표준',
    trunk: '표준',
    rightLeg: '표준',
    leftLeg: '표준',
  },
  segmentalFat: {
    rightArm: '표준이상',
    leftArm: '표준이상',
    trunk: '표준이상',
    rightLeg: '표준이상',
    leftLeg: '표준이상',
  },
  verified: true,
  scanConfidence: 99.4,
  notes: '2024.08.20 SWING GYM 인바디 측정: 체중 75.5kg, 골격근 30.1kg, 체지방 22.8kg (30.2%)',
};

export const INITIAL_RECORD: InBodyRecord = USER_ACTUAL_RECORD;

export const INITIAL_RECORDS_LIST: InBodyRecord[] = [];

export const TIME_SERIES_HISTORY: HistoricalDataPoint[] = [];

export const INITIAL_AI_REPORT: AIReportResult = {
  generatedAt: '2024.08.20 20:55',
  model: 'Gemini 3.1 Flash Vision Engine',
  summary: '2024년 8월 20일 측정 결과, 체중은 75.5kg(과체중)이며 체지방률은 30.2%입니다. 골격근량이 30.1kg으로 표준 이상에 가까운 우수한 근육량을 보유하고 있어 기초대사량(1515kcal)을 바탕으로 한 점진적 체지방 감량이 권장됩니다.',
  bodyTypeDiagnosis: '근육형 과체중 (신장 162cm 대비 탄탄한 골격근 30.1kg 보유, 체지방 22.8kg 집중 관리 필요)',
  nutritionPrescription: {
    calories: 1600,
    proteinGrams: 105,
    carbsGrams: 160,
    fatGrams: 42,
    mealStrategy: '일일 목표 섭취 1,600kcal 준수 및 단백질 100g 이상 확보. 저녁 식사 시 정제 탄수화물 제한 및 복부지방률 0.89 개선을 위한 야식 절제.',
  },
  exercisePrescription: {
    aerobicZone2: '중강도 Zone 2 유산소(경사도 트레드밀, 실내 자전거) 주 4회 40분 (목표 심박수 120~135bpm)',
    resistanceTraining: '대근육군 중심 하체(스쿼트, 레그프레스) 및 코어 근력 운동 주 3회',
    weeklySchedule: [
      '월: 하체 웨이트 40분 + Zone 2 트레드밀 30분',
      '화: 실내 자전거 45분 + 복근 루틴',
      '수: 휴식 및 가벼운 스트레칭',
      '목: 상체/코어 근력 40분 + 경사도 걷기 30분',
      '금: 전신 순환 서킷 35분',
      '토: 야외 걷기 60분',
      '일: 완전 휴식 및 수분 섭취',
    ],
  },
  ragTrajectory: {
    estimatedWeeksToGoal: 16,
    targetFatLossRatePerWeek: 0.6,
    milestones: [
      { week: 4, expectedWeight: 77.2, note: '내장지방 9 → 8 진입 목표' },
      { week: 8, expectedWeight: 75.0, note: '체지방률 28%대 진입' },
      { week: 12, expectedWeight: 72.8, note: '골격근 30.5kg 유지' },
      { week: 16, expectedWeight: 70.0, note: '복부지방률 0.88 달성' },
    ],
  },
};
