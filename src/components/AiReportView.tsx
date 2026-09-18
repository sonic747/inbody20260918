import React, { useState } from 'react';
import { InBodyRecord, AIReportResult } from '../types';
import { INITIAL_AI_REPORT } from '../data/mockData';

interface AiReportViewProps {
  record: InBodyRecord;
}

export const AiReportView: React.FC<AiReportViewProps> = ({ record }) => {
  const [report, setReport] = useState<AIReportResult>(INITIAL_AI_REPORT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTabSection, setActiveTabSection] = useState<'all' | 'nutrition' | 'exercise' | 'trajectory'>('all');

  const handleRegenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate-ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport({
          ...data.report,
          model: data.model || 'gemini-3.8-flash (Clinical RAG Engine)',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 py-4 gap-4 max-w-xl mx-auto sm:max-w-2xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#171f33] via-[#1b263b] to-[#131b2e] p-5 rounded-2xl border border-[#222a3d] shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3198dc]/20 border border-[#93ccff]/40 flex items-center justify-center text-[#93ccff]">
              <span className="material-symbols-outlined text-[18px]">neurology</span>
            </div>
            <div>
              <span className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dae2fd]">
                AI 맞춤 식단 &amp; 운동 리포트
              </span>
              <div className="font-['JetBrains_Mono'] text-[10px] text-[#4edea3] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                {report.model}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#93ccff] hover:bg-[#cce5ff] text-[#003351] font-['JetBrains_Mono'] text-[11px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer disabled:opacity-60 shadow-[0_0_12px_rgba(147,204,255,0.3)]"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#003351] border-t-transparent rounded-full animate-spin" />
                <span>분석 중...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px]">autorenew</span>
                <span>AI 재진단</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[#bfc7d2]/80 font-['JetBrains_Mono'] text-[11px] pt-1 border-t border-[#222a3d]/80">
          <span>생성일시: {report.generatedAt}</span>
          <span className="text-[#93ccff]">InBody 770 원판 연동</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: '전체 리포트' },
          { id: 'nutrition', label: '영양 & 식단 처방' },
          { id: 'exercise', label: '운동 프로토콜' },
          { id: 'trajectory', label: '24주 감량 로드맵' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabSection(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-['Manrope'] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTabSection === tab.id
                ? 'bg-[#222a3d] text-[#93ccff] border border-[#93ccff]/40 shadow-sm'
                : 'bg-[#131b2e] text-[#bfc7d2] hover:text-[#dae2fd] border border-[#222a3d]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Executive Summary Card */}
      {(activeTabSection === 'all' || activeTabSection === 'nutrition') && (
        <div className="bg-[#131b2e] p-4 rounded-xl border border-[#222a3d]/80 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">verified</span>
            <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dae2fd]">
              체형 및 대사 분석 총평
            </span>
          </div>
          <p className="font-['Manrope'] text-[13px] text-[#dae2fd] leading-relaxed bg-[#171f33] p-3 rounded-lg border border-[#222a3d]/60">
            {report.summary}
          </p>
          <div className="font-['Manrope'] text-[12px] text-[#bfc7d2] leading-relaxed pt-1">
            <strong className="text-[#ffb95f]">임상 진단: </strong> {report.bodyTypeDiagnosis}
          </div>
        </div>
      )}

      {/* Nutrition Prescription */}
      {(activeTabSection === 'all' || activeTabSection === 'nutrition') && (
        <div className="bg-[#171f33] p-4 rounded-xl border border-[#222a3d]/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#ffb95f] text-[18px]">restaurant</span>
              <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dae2fd]">
                1일 권장 영양 &amp; 매크로 구성
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#4edea3]">
              {report.nutritionPrescription.calories} kcal
            </span>
          </div>

          {/* Macro grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#131b2e] p-2.5 rounded-lg border border-[#222a3d]/60 text-center">
              <span className="text-[11px] text-[#bfc7d2] font-semibold">단백질</span>
              <div className="text-[18px] font-mono font-bold text-[#93ccff] mt-0.5">
                {report.nutritionPrescription.proteinGrams}g
              </div>
              <span className="text-[10px] text-[#bfc7d2]/60 font-mono">체중 1.6g/kg</span>
            </div>

            <div className="bg-[#131b2e] p-2.5 rounded-lg border border-[#222a3d]/60 text-center">
              <span className="text-[11px] text-[#bfc7d2] font-semibold">복합 탄수화물</span>
              <div className="text-[18px] font-mono font-bold text-[#ffb95f] mt-0.5">
                {report.nutritionPrescription.carbsGrams}g
              </div>
              <span className="text-[10px] text-[#bfc7d2]/60 font-mono">운동 전후 공급</span>
            </div>

            <div className="bg-[#131b2e] p-2.5 rounded-lg border border-[#222a3d]/60 text-center">
              <span className="text-[11px] text-[#bfc7d2] font-semibold">불포화 지방</span>
              <div className="text-[18px] font-mono font-bold text-[#4edea3] mt-0.5">
                {report.nutritionPrescription.fatGrams}g
              </div>
              <span className="text-[10px] text-[#bfc7d2]/60 font-mono">호르몬 항상성</span>
            </div>
          </div>

          <div className="font-['Manrope'] text-[12px] text-[#bfc7d2] bg-[#060e20] p-3 rounded-lg border border-[#222a3d] leading-relaxed">
            <span className="text-[#93ccff] font-bold block mb-1">섭취 타이밍 가이드:</span>
            {report.nutritionPrescription.mealStrategy}
          </div>
        </div>
      )}

      {/* Exercise Prescription */}
      {(activeTabSection === 'all' || activeTabSection === 'exercise') && (
        <div className="bg-[#171f33] p-4 rounded-xl border border-[#222a3d]/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#93ccff] text-[18px]">fitness_center</span>
            <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dae2fd]">
              운동 처방 &amp; 주간 프로토콜
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="bg-[#131b2e] p-3 rounded-lg border border-[#222a3d]/60">
              <span className="text-[12px] font-bold text-[#4edea3] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">directions_run</span>
                Zone 2 유산소 지방 연소 처방
              </span>
              <p className="text-[12px] text-[#bfc7d2] mt-1 leading-relaxed">
                {report.exercisePrescription.aerobicZone2}
              </p>
            </div>

            <div className="bg-[#131b2e] p-3 rounded-lg border border-[#222a3d]/60">
              <span className="text-[12px] font-bold text-[#93ccff] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">exercise</span>
                근육량 보존 웨이트 트레이닝
              </span>
              <p className="text-[12px] text-[#bfc7d2] mt-1 leading-relaxed">
                {report.exercisePrescription.resistanceTraining}
              </p>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-[12px] font-bold text-[#dae2fd]">주간 7일 트레이닝 스케줄</span>
            <div className="flex flex-col gap-1 bg-[#060e20] p-2.5 rounded-lg border border-[#222a3d]">
              {report.exercisePrescription.weeklySchedule.map((day, idx) => (
                <div
                  key={idx}
                  className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2] py-1 border-b border-[#222a3d]/50 last:border-0 flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#93ccff] mt-1.5 shrink-0" />
                  <span>{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RAG Trajectory Milestones */}
      {(activeTabSection === 'all' || activeTabSection === 'trajectory') && (
        <div className="bg-[#131b2e] p-4 rounded-xl border border-[#222a3d]/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4edea3] text-[18px]">timeline</span>
              <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dae2fd]">
                24주 감량 로드맵 (목표: 63.0kg)
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#4edea3] bg-[#00a572]/20 px-2 py-0.5 rounded border border-[#00a572]/30">
              주당 -{report.ragTrajectory.targetFatLossRatePerWeek}kg 권장
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {report.ragTrajectory.milestones.map((m) => (
              <div
                key={m.week}
                className="bg-[#171f33] p-3 rounded-lg border border-[#222a3d]/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#222a3d] border border-[#3f4850]/40 flex items-center justify-center font-['JetBrains_Mono'] text-[11px] font-bold text-[#93ccff]">
                    {m.week}W
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Manrope'] text-[12px] font-bold text-[#dae2fd]">
                      예상 체중 {m.expectedWeight} kg
                    </span>
                    <span className="font-['Manrope'] text-[11px] text-[#bfc7d2]/70">{m.note}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#4edea3] text-[18px]">check</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
