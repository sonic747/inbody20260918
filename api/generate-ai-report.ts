import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getAIClient(apiKey: string): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { record } = req.body || {};

    if (!apiKey) {
      // Fallback simulated report if no key
      return res.status(200).json({
        success: true,
        model: 'Simulated Coaching Engine (GEMINI_API_KEY 미설정)',
        report: {
          generatedAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
          summary: `현재 체중 ${record?.metrics?.weightKg || 75.5}kg, 골격근량 ${record?.metrics?.skeletalMuscleKg || 30.1}kg, 체지방률 ${record?.metrics?.percentBodyFat || 30.2}% 상태입니다.`,
          bodyTypeDiagnosis: `Vercel Settings → Environment Variables에 GEMINI_API_KEY를 등록하시면 맞춤형 정밀 AI 리포트가 생성됩니다.`,
          nutritionPrescription: {
            calories: Math.round((record?.metrics?.basalMetabolismKcal || 1515) * 1.2),
            proteinGrams: Math.round((record?.metrics?.weightKg || 75.5) * 1.6),
            carbsGrams: 185,
            fatGrams: 42,
            mealStrategy: '양질의 단백질 분할 섭취 및 정제 탄수화물 제한 권장.',
          },
          exercisePrescription: {
            aerobicZone2: '인클라인 트레드밀 40분 주 4회',
            resistanceTraining: '대근육 복합운동 주 3회',
            weeklySchedule: ['월: 상체 근력', '화: 유산소', '수: 하체 근력', '목: 휴식', '금: 전신 덤벨', '토: 러닝', '일: 휴식'],
          },
          ragTrajectory: {
            estimatedWeeksToGoal: 24,
            targetFatLossRatePerWeek: 0.5,
            milestones: [
              { week: 4, expectedWeight: 73.5, note: '내장지방 안정화' },
              { week: 12, expectedWeight: 69.5, note: '체지방률 25% 진입' },
              { week: 24, expectedWeight: 63.0, note: '최종 목표 도달' },
            ],
          },
        },
      });
    }

    const client = getAIClient(apiKey);
    const prompt = `
당신은 대한민국 최고 수준의 스포츠의학 전문의이자 엘리트 체성분 분석 AI입니다.
아래의 인바디 검사 데이터를 정밀 분석하여 임상적/운동학적 맞춤 코칭 리포트를 JSON 형식으로만 작성하세요.

[바이오 데이터]
- 성별/나이/신장: ${record?.userProfile?.gender || '남성'} / ${record?.userProfile?.age || 49}세 / ${record?.userProfile?.heightCm || 162}cm
- 현재 체중: ${record?.metrics?.weightKg} kg
- 골격근량: ${record?.metrics?.skeletalMuscleKg} kg
- 체지방량: ${record?.metrics?.bodyFatKg} kg (체지방률: ${record?.metrics?.percentBodyFat}%)
- BMI: ${record?.metrics?.bmi}, 복부지방률: ${record?.metrics?.waistHipRatio}, 내장지방레벨: ${record?.metrics?.visceralFatLevel}
- 기초대사량: ${record?.metrics?.basalMetabolismKcal} kcal, 신체발달점수: ${record?.metrics?.fitnessScore}점
- 체중조절 목표: 체중 ${record?.metrics?.targetWeightKg}kg (지방 ${record?.metrics?.targetFatKg}kg, 근육 +${record?.metrics?.targetMuscleKg}kg)

반드시 아래 JSON 스키마 구조로만 작성해 반환하세요:
{
  "generatedAt": "YYYY.MM.DD HH:mm",
  "summary": "핵심 요약 한 문단",
  "bodyTypeDiagnosis": "체형 및 비만도 심층 분석",
  "nutritionPrescription": {
    "calories": 숫자,
    "proteinGrams": 숫자,
    "carbsGrams": 숫자,
    "fatGrams": 숫자,
    "mealStrategy": "구체적인 식단 전략 가이드"
  },
  "exercisePrescription": {
    "aerobicZone2": "유산소 처방",
    "resistanceTraining": "근력운동 처방",
    "weeklySchedule": ["월: ...", "화: ...", "수: ...", "목: ...", "금: ...", "토: ...", "일: ..."]
  },
  "ragTrajectory": {
    "estimatedWeeksToGoal": 숫자,
    "targetFatLossRatePerWeek": 숫자,
    "milestones": [
      { "week": 4, "expectedWeight": 숫자, "note": "설명" },
      { "week": 8, "expectedWeight": 숫자, "note": "설명" },
      { "week": 16, "expectedWeight": 숫자, "note": "설명" },
      { "week": 24, "expectedWeight": 숫자, "note": "설명" }
    ]
  }
}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const reportJson = JSON.parse(response.text?.replace(/```json\s*|\s*```/g, '').trim() || '{}');
    return res.status(200).json({
      success: true,
      model: 'gemini-2.5-flash',
      report: reportJson,
    });
  } catch (error: any) {
    console.error('AI Report error on Vercel:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || '리포트 생성 중 오류가 발생했습니다.',
    });
  }
}
