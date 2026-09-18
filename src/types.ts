export interface InBodyMetrics {
  weightKg: number;
  weightDelta: number;
  skeletalMuscleKg: number;
  smmDelta: number;
  bodyFatKg: number;
  bfmDelta: number;
  percentBodyFat: number;
  pbfDelta: number;
  bmi: number;
  waistHipRatio: number;
  visceralFatLevel: number;
  basalMetabolismKcal: number;
  fitnessScore: number;
  targetWeightKg: number;
  targetFatKg: number;
  targetMuscleKg: number;
}

export interface SegmentalAnalysis {
  rightArm: '표준이하' | '표준' | '표준이상';
  leftArm: '표준이하' | '표준' | '표준이상';
  trunk: '표준이하' | '표준' | '표준이상';
  rightLeg: '표준이하' | '표준' | '표준이상';
  leftLeg: '표준이하' | '표준' | '표준이상';
}

export interface InBodyRecord {
  id: string;
  telemetryId?: string;
  timestamp: string;
  displayDate: string;
  dateShort: string;
  deviceModel: string;
  location: string;
  userProfile: {
    gender: '남성' | '여성';
    age: number;
    heightCm: number;
  };
  metrics: InBodyMetrics;
  segmentalLean?: SegmentalAnalysis;
  segmentalFat?: SegmentalAnalysis;
  verified: boolean;
  scanConfidence: number;
  imageUrl?: string;
  fileName?: string;
  notes?: string;
  createdAt?: string;
  // Keep optional for backwards compatibility
  commitHash?: string;
  syncedTimeAgo?: string;
}

export interface HistoricalDataPoint {
  date: string;
  timestamp: string;
  weight: number;
  pbf: number;
  smm: number;
  bfm: number;
  recordId?: string;
}

export type ActiveTab = 'ocr-verification' | 'records-management' | 'analytics-trends' | 'ai-report' | 'dashboard';
export type TimeHorizon = 'day' | 'month' | 'year';

export interface OCRExtractedData {
  deviceModel?: string;
  testDate?: string;
  gender?: '남성' | '여성';
  age?: number;
  heightCm?: number;
  weightKg: number;
  skeletalMuscleKg: number;
  bodyFatKg: number;
  percentBodyFat: number;
  bmi: number;
  waistHipRatio: number;
  visceralFatLevel: number;
  basalMetabolismKcal: number;
  fitnessScore: number;
  targetWeightKg?: number;
  targetFatKg?: number;
  targetMuscleKg?: number;
}

export interface AIReportResult {
  generatedAt: string;
  model: string;
  summary: string;
  bodyTypeDiagnosis: string;
  nutritionPrescription: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    mealStrategy: string;
  };
  exercisePrescription: {
    aerobicZone2: string;
    resistanceTraining: string;
    weeklySchedule: string[];
  };
  ragTrajectory: {
    estimatedWeeksToGoal: number;
    targetFatLossRatePerWeek: number;
    milestones: { week: number; expectedWeight: number; note: string }[];
  };
}
