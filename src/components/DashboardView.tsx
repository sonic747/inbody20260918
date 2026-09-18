import React from 'react';
import { InBodyRecord, ActiveTab } from '../types';

interface DashboardViewProps {
  record: InBodyRecord;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ record, onNavigateTab }) => {
  return (
    <div className="flex flex-col w-full px-4 py-4 gap-4 max-w-xl mx-auto sm:max-w-2xl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#171f33] via-[#1e293b] to-[#131b2e] p-5 rounded-2xl border border-[#222a3d] shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#4edea3] uppercase font-bold tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            LIVE TELEMETRY DASHBOARD
          </span>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#93ccff] bg-[#3198dc]/15 px-2 py-0.5 rounded border border-[#3198dc]/30">
            {record.deviceModel}
          </span>
        </div>

        <div className="flex items-end justify-between mt-1">
          <div>
            <div className="font-['Space_Grotesk'] text-[24px] font-bold text-[#dae2fd]">
              {record.userProfile.gender} · {record.userProfile.age}세
            </div>
            <div className="font-['Manrope'] text-[13px] text-[#bfc7d2]/80 mt-0.5">
              최근 측정: {record.displayDate} ({record.location})
            </div>
          </div>

          <div className="text-right">
            <div className="font-['JetBrains_Mono'] text-[32px] font-bold text-[#93ccff] leading-none">
              {record.metrics.fitnessScore}
            </div>
            <div className="font-['Manrope'] text-[11px] text-[#bfc7d2]/80 mt-1">
              신체발달점수 / 100
            </div>
          </div>
        </div>

        {/* Quick Progress Indicator */}
        <div className="mt-1 pt-3 border-t border-[#222a3d]/80 flex items-center justify-between font-['JetBrains_Mono'] text-[11px]">
          <span className="text-[#bfc7d2]">체중조절 목표 63.0kg 진행률</span>
          <span className="text-[#4edea3] font-bold">62% 달성 (체지방 -2.3% 감소 중)</span>
        </div>
      </div>

      {/* 4 Core Quick Metric Tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={() => onNavigateTab('analytics-trends')}
          className="bg-[#171f33] hover:bg-[#1e293b] p-3.5 rounded-xl border border-[#222a3d]/70 cursor-pointer transition-colors"
        >
          <div className="flex justify-between text-[#bfc7d2] text-[12px] font-medium">
            <span>체중</span>
            <span className="text-[#4edea3] font-mono text-[11px]">{record.metrics.weightDelta}kg</span>
          </div>
          <div className="text-[26px] font-mono font-bold text-[#dae2fd] mt-1">
            {record.metrics.weightKg.toFixed(1)} <span className="text-[13px] text-[#bfc7d2]">kg</span>
          </div>
          <span className="text-[11px] text-[#ffb95f] font-mono mt-1 block">표준이상</span>
        </div>

        <div
          onClick={() => onNavigateTab('analytics-trends')}
          className="bg-[#171f33] hover:bg-[#1e293b] p-3.5 rounded-xl border border-[#222a3d]/70 cursor-pointer transition-colors"
        >
          <div className="flex justify-between text-[#bfc7d2] text-[12px] font-medium">
            <span>골격근량</span>
            <span className="text-[#93ccff] font-mono text-[11px]">+{record.metrics.smmDelta}kg</span>
          </div>
          <div className="text-[26px] font-mono font-bold text-[#93ccff] mt-1">
            {record.metrics.skeletalMuscleKg.toFixed(1)} <span className="text-[13px] text-[#bfc7d2]">kg</span>
          </div>
          <span className="text-[11px] text-[#4edea3] font-mono mt-1 block">표준 (108%)</span>
        </div>

        <div
          onClick={() => onNavigateTab('analytics-trends')}
          className="bg-[#171f33] hover:bg-[#1e293b] p-3.5 rounded-xl border border-[#222a3d]/70 cursor-pointer transition-colors"
        >
          <div className="flex justify-between text-[#bfc7d2] text-[12px] font-medium">
            <span>체지방률</span>
            <span className="text-[#4edea3] font-mono text-[11px]">{record.metrics.pbfDelta}%</span>
          </div>
          <div className="text-[26px] font-mono font-bold text-[#ffb95f] mt-1">
            {record.metrics.percentBodyFat.toFixed(1)} <span className="text-[13px] text-[#bfc7d2]">%</span>
          </div>
          <span className="text-[11px] text-[#ffb4ab] font-mono mt-1 block">경도비만</span>
        </div>

        <div
          onClick={() => onNavigateTab('analytics-trends')}
          className="bg-[#171f33] hover:bg-[#1e293b] p-3.5 rounded-xl border border-[#222a3d]/70 cursor-pointer transition-colors"
        >
          <div className="flex justify-between text-[#bfc7d2] text-[12px] font-medium">
            <span>체지방량</span>
            <span className="text-[#4edea3] font-mono text-[11px]">{record.metrics.bfmDelta}kg</span>
          </div>
          <div className="text-[26px] font-mono font-bold text-[#ffb95f] mt-1">
            {record.metrics.bodyFatKg.toFixed(1)} <span className="text-[13px] text-[#bfc7d2]">kg</span>
          </div>
          <span className="text-[11px] text-[#ffb4ab] font-mono mt-1 block">표준이상 (160%)</span>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="flex flex-col gap-2.5">
        <div
          onClick={() => onNavigateTab('ocr-verification')}
          className="bg-[#131b2e] hover:bg-[#171f33] p-4 rounded-xl border border-[#222a3d]/80 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00a572]/20 border border-[#00a572]/40 flex items-center justify-center text-[#4edea3] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">document_scanner</span>
            </div>
            <div>
              <div className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dae2fd]">
                OCR 결과지 검수 및 GitHub 동기화
              </div>
              <div className="font-['Manrope'] text-[11px] text-[#bfc7d2]/70">
                인바디 770 결과지 사진 촬영 및 수치 교차 대조
              </div>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#93ccff] text-[20px] group-hover:translate-x-1 transition-transform">
            chevron_right
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('analytics-trends')}
          className="bg-[#131b2e] hover:bg-[#171f33] p-4 rounded-xl border border-[#222a3d]/80 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3198dc]/20 border border-[#93ccff]/40 flex items-center justify-center text-[#93ccff] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">monitoring</span>
            </div>
            <div>
              <div className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dae2fd]">
                시계열 체성분 추이 &amp; 부위별 발달 진단
              </div>
              <div className="font-['Manrope'] text-[11px] text-[#bfc7d2]/70">
                C형→I형 밸런스 게이지 및 부위별 근육/체지방 지도
              </div>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#93ccff] text-[20px] group-hover:translate-x-1 transition-transform">
            chevron_right
          </span>
        </div>

        <div
          onClick={() => onNavigateTab('ai-report')}
          className="bg-[#131b2e] hover:bg-[#171f33] p-4 rounded-xl border border-[#222a3d]/80 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ca8100]/20 border border-[#ffb95f]/40 flex items-center justify-center text-[#ffb95f] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">neurology</span>
            </div>
            <div>
              <div className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dae2fd]">
                AI 임상 리포트 및 식단/운동 처방
              </div>
              <div className="font-['Manrope'] text-[11px] text-[#bfc7d2]/70">
                Gemini 3.8 Flash 기반 RAG 체중 감량 궤적 분석
              </div>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#93ccff] text-[20px] group-hover:translate-x-1 transition-transform">
            chevron_right
          </span>
        </div>
      </div>
    </div>
  );
};
