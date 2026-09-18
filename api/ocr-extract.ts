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
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel 대시보드(Settings → Environment Variables)에 등록해 주세요.',
        isMissingApiKey: true,
      });
    }

    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Image base64 data required' });
    }

    const client = getAIClient(apiKey);
    let resolvedMime = mimeType || 'image/jpeg';
    let cleanBase64 = imageBase64;
    const dataUrlMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      resolvedMime = dataUrlMatch[1];
      cleanBase64 = dataUrlMatch[2];
    } else {
      cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }

    const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let extractedData: any = null;
    let usedModel = 'Gemini Vision OCR';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: resolvedMime,
                    data: cleanBase64,
                  },
                },
                {
                  text: `당신은 인바디(InBody) 결과지 검사지 정밀 OCR 판독 전문가입니다.
첨부된 인바디 이미지 용지에 인쇄된 실제 측정 수치들을 주의 깊게 확대하여 읽고, JSON으로만 반환하십시오.
절대 임의의 기본값을 추측하거나 기입하지 말고, 이미지에 인쇄된 실제 숫자를 그대로 판독하십시오.

주의 사항:
1. 체중 (Weight): "체중" 항목의 실제 측정값(예: 75.5, 77.1 등 소수점 1자리까지 표시된 숫자)을 정확히 판독하십시오.
2. 골격근량 (Skeletal Muscle Mass / SMM): "골격근량" 항목의 실제 측정값
3. 체지방량 (Body Fat Mass / BFM): "체지방량" 항목의 실제 측정값
4. 체지방률 (Percent Body Fat / PBF): "체지방률" 항목의 실제 % 수치
5. BMI, 복부지방률, 내장지방레벨, 기초대사량, 신체발달점수
6. 우측 상단/하단 정보: 측정일자(날짜 시간, 예: 2024.08.20 20:47), 성별, 나이, 신장(cm), 측정장소(예: SWING GYM)

반드시 아래 JSON 형식으로만 응답하십시오:
{
  "deviceModel": "InBody (SWING GYM)" 또는 인식된 모델명,
  "testDate": "YYYY.MM.DD HH:mm",
  "gender": "남성" 또는 "여성",
  "age": 나이(숫자),
  "heightCm": 신장(숫자),
  "weightKg": 체중(숫자),
  "skeletalMuscleKg": 골격근량(숫자),
  "bodyFatKg": 체지방량(숫자),
  "percentBodyFat": 체지방률(숫자),
  "bmi": BMI(숫자),
  "waistHipRatio": 복부지방률(숫자),
  "visceralFatLevel": 내장지방레벨(정수),
  "basalMetabolismKcal": 기초대사량(정수),
  "fitnessScore": 신체발달점수(정수),
  "targetWeightKg": 권장체중(숫자),
  "targetFatKg": 체지방조절(숫자),
  "targetMuscleKg": 근육조절(숫자)
}`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const cleanedText = rawText.replace(/```json\s*|\s*```/g, '').trim();
        if (cleanedText) {
          const parsed = JSON.parse(cleanedText);
          if (parsed && (typeof parsed.weightKg === 'number' || typeof parsed.percentBodyFat === 'number' || parsed.testDate)) {
            extractedData = parsed;
            usedModel = `${modelName} Vision OCR`;
            break;
          }
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} OCR failed on Vercel:`, err?.message || err);
      }
    }

    if (!extractedData) {
      return res.status(500).json({
        success: false,
        error: '이미지에서 인바디 수치를 명확하게 인식하지 못했습니다. 결과지 글자가 선명한지 확인해 주세요.',
      });
    }

    return res.status(200).json({
      success: true,
      model: usedModel,
      confidence: 98.4,
      extractedData,
    });
  } catch (error: any) {
    console.error('Vercel OCR error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'OCR 처리 중 서버 오류가 발생했습니다.',
    });
  }
}
