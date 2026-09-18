import React, { useState, useMemo, useEffect } from 'react';
import { InBodyRecord, HistoricalDataPoint, TimeHorizon, ActiveTab } from '../types';

interface AnalyticsTrendsViewProps {
  record: InBodyRecord;
  records?: InBodyRecord[];
  activeRecordId?: string;
  history?: HistoricalDataPoint[];
  onSelectRecord?: (rec: InBodyRecord) => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const AnalyticsTrendsView: React.FC<AnalyticsTrendsViewProps> = ({
  record,
  records = [],
  activeRecordId,
  onSelectRecord,
  onNavigateTab,
}) => {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('day');

  // Ensure records are available (fallback to single record if records array is empty)
  const availableRecords = useMemo(() => {
    if (records && records.length > 0) return records;
    if (record) return [record];
    return [];
  }, [records, record]);

  // Initial selected point index matching activeRecordId or latest record
  const initialIndex = useMemo(() => {
    if (availableRecords.length === 0) return 0;
    if (activeRecordId) {
      const idx = availableRecords.findIndex((r) => r.id === activeRecordId);
      if (idx >= 0) return idx;
    }
    return availableRecords.length - 1;
  }, [availableRecords, activeRecordId]);

  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(initialIndex);

  // Sync selected index whenever activeRecordId or records change
  useEffect(() => {
    if (availableRecords.length > 0) {
      if (activeRecordId) {
        const idx = availableRecords.findIndex((r) => r.id === activeRecordId);
        if (idx >= 0) {
          setSelectedPointIndex(idx);
          return;
        }
      }
      setSelectedPointIndex(availableRecords.length - 1);
    }
  }, [activeRecordId, availableRecords]);

  // Filter or aggregate records based on timeHorizon
  const displayedRecords = useMemo(() => {
    if (availableRecords.length <= 1) return availableRecords;

    if (timeHorizon === 'month') {
      // Pick the latest record of each month for monthly trend
      const monthMap = new Map<string, InBodyRecord>();
      availableRecords.forEach((r) => {
        const key = r.displayDate ? r.displayDate.slice(0, 7) : r.timestamp.slice(0, 7);
        monthMap.set(key, r);
      });
      return Array.from(monthMap.values());
    }

    if (timeHorizon === 'year') {
      // Pick the latest record of each year for yearly trend
      const yearMap = new Map<string, InBodyRecord>();
      availableRecords.forEach((r) => {
        const key = r.displayDate ? r.displayDate.slice(0, 4) : r.timestamp.slice(0, 4);
        yearMap.set(key, r);
      });
      return Array.from(yearMap.values());
    }

    // Default 'day': all individual records in chronological sequence
    return availableRecords;
  }, [availableRecords, timeHorizon]);

  // Clamp selected point index within displayed records
  const safeIndex = Math.min(Math.max(0, selectedPointIndex), Math.max(0, displayedRecords.length - 1));
  const activeRecord = displayedRecords[safeIndex] || availableRecords[0] || record;

  if (availableRecords.length === 0) {
    return (
      <div className="flex flex-col w-full px-4 py-8 gap-4 max-w-xl mx-auto sm:max-w-2xl">
        <div className="bg-[#131b2e] p-8 rounded-2xl border border-[#222a3d] text-center flex flex-col items-center gap-3 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-[#3198dc]/15 border border-[#3198dc]/30 flex items-center justify-center text-[#93ccff]">
            <span className="material-symbols-outlined text-[32px]">query_stats</span>
          </div>
          <h2 className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dae2fd]">
            등록된 시계열 인바디 기록이 없습니다
          </h2>
          <p className="text-[13px] text-[#bfc7d2] max-w-xs leading-relaxed">
            새로운 인바디 결과지를 등록하거나 기록 관리에서 데이터를 추가하면 시계열 추이 분석 차트가 자동으로 생성됩니다.
          </p>
          <button
            type="button"
            onClick={() => onNavigateTab('ocr-verification')}
            className="mt-3 px-5 py-2.5 bg-[#4edea3] hover:bg-[#3ec48e] text-[#003822] font-['Space_Grotesk'] font-bold rounded-xl text-[13px] flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
            <span>첫 인바디 기록 등록하기</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate step-to-step biometric deltas for hero cards
  const prevRecord = safeIndex > 0 ? displayedRecords[safeIndex - 1] : null;
  const weightDelta = prevRecord
    ? activeRecord.metrics.weightKg - prevRecord.metrics.weightKg
    : activeRecord.metrics.weightDelta;
  const pbfDelta = prevRecord
    ? activeRecord.metrics.percentBodyFat - prevRecord.metrics.percentBodyFat
    : activeRecord.metrics.pbfDelta;
  const smmDelta = prevRecord
    ? activeRecord.metrics.skeletalMuscleKg - prevRecord.metrics.skeletalMuscleKg
    : activeRecord.metrics.smmDelta;
  const bfmDelta = prevRecord
    ? activeRecord.metrics.bodyFatKg - prevRecord.metrics.bodyFatKg
    : activeRecord.metrics.bfmDelta;

  // Cumulative stats between earliest and latest available records
  const cumulativeStats = useMemo(() => {
    if (availableRecords.length < 2) return null;
    const earliest = availableRecords[0];
    const latest = availableRecords[availableRecords.length - 1];
    return {
      weightChange: latest.metrics.weightKg - earliest.metrics.weightKg,
      pbfChange: latest.metrics.percentBodyFat - earliest.metrics.percentBodyFat,
      smmChange: latest.metrics.skeletalMuscleKg - earliest.metrics.skeletalMuscleKg,
      earliestDate: earliest.displayDate.split(' ')[0],
      latestDate: latest.displayDate.split(' ')[0],
      totalCount: availableRecords.length,
    };
  }, [availableRecords]);

  // Chart Title and Subtitle
  const chartSubtitle = useMemo(() => {
    if (displayedRecords.length >= 2) {
      const start = displayedRecords[0].displayDate.split(' ')[0];
      const end = displayedRecords[displayedRecords.length - 1].displayDate.split(' ')[0];
      return `${start} ~ ${end} 시계열 측정 비교 (${displayedRecords.length}회 기록)`;
    }
    return `${activeRecord.displayDate.split(' ')[0]} 단일 측정 기록`;
  }, [displayedRecords, activeRecord]);

  // Mathematical SVG Coordinate Mapping
  const N = displayedRecords.length;
  const SVG_WIDTH = 340;
  const SVG_HEIGHT = 150;
  const PLOT_LEFT = 35;
  const PLOT_RIGHT = 305;
  const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT; // 270

  const weights = displayedRecords.map((r) => r.metrics.weightKg);
  const pbfs = displayedRecords.map((r) => r.metrics.percentBodyFat);

  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const spanW = maxW - minW > 0.5 ? maxW - minW : 2;
  const minWBound = minW - spanW * 0.25;
  const maxWBound = maxW + spanW * 0.25;

  const minP = Math.min(...pbfs);
  const maxP = Math.max(...pbfs);
  const spanP = maxP - minP > 0.5 ? maxP - minP : 2;
  const minPBound = minP - spanP * 0.25;
  const maxPBound = maxP + spanP * 0.25;

  // Coordinate functions
  const getWeightY = (w: number) => {
    const ratio = (w - minWBound) / (maxWBound - minWBound);
    return 105 - ratio * 75; // Maps between y=30 and y=105
  };

  const getPbfY = (p: number) => {
    const ratio = (p - minPBound) / (maxPBound - minPBound);
    return 115 - ratio * 70; // Maps between y=45 and y=115
  };

  const svgNodes = displayedRecords.map((r, i) => {
    const x = N <= 1 ? SVG_WIDTH / 2 : PLOT_LEFT + i * (PLOT_WIDTH / (N - 1));
    const wy = getWeightY(r.metrics.weightKg);
    const py = getPbfY(r.metrics.percentBodyFat);

    // Format date label for X axis
    let dateStr = r.dateShort;
    if (!dateStr && r.displayDate) {
      const parts = r.displayDate.split(' ')[0].split('.');
      if (parts.length >= 3) {
        dateStr = `${parts[1].padStart(2, '0')}.${parts[2].padStart(2, '0')}`;
      } else {
        dateStr = r.displayDate.split(' ')[0];
      }
    }

    return {
      index: i,
      recordId: r.id,
      record: r,
      x,
      wy,
      py,
      date: dateStr || '기록',
      weight: r.metrics.weightKg,
      pbf: r.metrics.percentBodyFat,
    };
  });

  const selectedNode = svgNodes[safeIndex] || svgNodes[svgNodes.length - 1];

  // SVG Polylines and Polygons
  const weightPolyline = svgNodes.map((p) => `${p.x.toFixed(1)},${p.wy.toFixed(1)}`).join(' ');
  const pbfPolyline = svgNodes.map((p) => `${p.x.toFixed(1)},${p.py.toFixed(1)}`).join(' ');
  const weightPolygon = N >= 2 ? `${svgNodes[0].x.toFixed(1)},125 ${weightPolyline} ${svgNodes[N - 1].x.toFixed(1)},125` : '';
  const pbfPolygon = N >= 2 ? `${svgNodes[0].x.toFixed(1)},125 ${pbfPolyline} ${svgNodes[N - 1].x.toFixed(1)},125` : '';

  // SMM & BFM dynamic balance ratios
  const smmVal = activeRecord.metrics.skeletalMuscleKg;
  const bfmVal = activeRecord.metrics.bodyFatKg;
  const smmPercent = Math.round((smmVal / 27.2) * 100);
  const bfmPercent = Math.round((bfmVal / 10.4) * 100);

  let balanceShape = 'C자형 (체지방 우세형)';
  let balanceColor = '#ffb95f';
  if (smmPercent >= bfmPercent + 5) {
    balanceShape = 'D자형 (골격근 우세 강인형)';
    balanceColor = '#4edea3';
  } else if (Math.abs(smmPercent - bfmPercent) <= 5) {
    balanceShape = 'I자형 (균형 표준형)';
    balanceColor = '#93ccff';
  }

  // Segmental fallbacks
  const segmentalLean = activeRecord.segmentalLean || {
    rightArm: '표준',
    leftArm: '표준',
    trunk: '표준',
    rightLeg: '표준',
    leftLeg: '표준',
  };
  const segmentalFat = activeRecord.segmentalFat || {
    rightArm: '표준이상',
    leftArm: '표준이상',
    trunk: '표준이상',
    rightLeg: '표준이상',
    leftLeg: '표준이상',
  };

  return (
    <div className="flex flex-col w-full px-4 py-4 gap-4 max-w-xl mx-auto sm:max-w-2xl">
      {/* Top Profile Telemetry Banner */}
      <div className="flex flex-col gap-1 bg-[#131b2e] p-4 rounded-xl border border-[#222a3d]/70 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex w-2 h-2 rounded-full bg-[#4edea3] animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
            <span className="font-['JetBrains_Mono'] text-[11px] font-medium text-[#4edea3] tracking-wide uppercase">
              TELEMETRY ID: {activeRecord.telemetryId || `${activeRecord.userProfile.age}-SWING`}
            </span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#93ccff] font-semibold">
            측정일자: {activeRecord.displayDate}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-['Space_Grotesk'] text-[22px] font-bold text-[#dae2fd] tracking-tight">
              {activeRecord.userProfile.gender} · {activeRecord.userProfile.age}세
            </span>
            <span className="font-['JetBrains_Mono'] text-[20px] font-bold text-[#93ccff]">
              {activeRecord.userProfile.heightCm}cm
            </span>
          </div>
          <div className="flex items-center gap-1 bg-[#2d3449]/70 border border-[#3f4850]/50 px-2 py-0.5 rounded">
            <span className="material-symbols-outlined text-[15px] text-[#ffb95f]">fitness_center</span>
            <span className="font-['Manrope'] text-[12px] font-semibold text-[#ffb95f]">
              {activeRecord.location || 'SWING GYM'}
            </span>
          </div>
        </div>

        {/* JSON Database Telemetry Capsule */}
        <div className="flex items-center justify-between bg-[#060e20]/80 px-2.5 py-1.5 rounded border border-[#222a3d]/60 mt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[#4edea3] text-[15px] shrink-0">verified</span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2] truncate">
              inbody_records.json (총 {availableRecords.length}개 기록 연동됨)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('records-management')}
            className="font-['JetBrains_Mono'] text-[11px] text-[#93ccff] hover:underline shrink-0 ml-2 cursor-pointer flex items-center gap-0.5"
          >
            <span>기록 관리 ({availableRecords.length})</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Time Horizon Filter Tabs */}
      <div className="flex p-1 bg-[#131b2e] rounded-lg border border-[#222a3d]/80">
        <button
          type="button"
          onClick={() => setTimeHorizon('day')}
          className={`tab-pill flex-1 py-1.5 text-center font-['Manrope'] text-[12px] font-semibold rounded transition-all cursor-pointer ${
            timeHorizon === 'day'
              ? 'bg-[#222a3d] text-[#93ccff] shadow-sm flex items-center justify-center gap-1'
              : 'text-[#bfc7d2] hover:text-[#dae2fd]'
          }`}
        >
          {timeHorizon === 'day' && <span className="w-1.5 h-1.5 rounded-full bg-[#93ccff]" />}
          <span>일별 (전체 {availableRecords.length}건)</span>
        </button>

        <button
          type="button"
          onClick={() => setTimeHorizon('month')}
          className={`tab-pill flex-1 py-1.5 text-center font-['Manrope'] text-[12px] font-semibold rounded transition-all cursor-pointer ${
            timeHorizon === 'month'
              ? 'bg-[#222a3d] text-[#93ccff] shadow-sm flex items-center justify-center gap-1'
              : 'text-[#bfc7d2] hover:text-[#dae2fd]'
          }`}
        >
          {timeHorizon === 'month' && <span className="w-1.5 h-1.5 rounded-full bg-[#93ccff]" />}
          <span>월별 집계 (Month)</span>
        </button>

        <button
          type="button"
          onClick={() => setTimeHorizon('year')}
          className={`tab-pill flex-1 py-1.5 text-center font-['Manrope'] text-[12px] font-semibold rounded transition-all cursor-pointer ${
            timeHorizon === 'year'
              ? 'bg-[#222a3d] text-[#93ccff] shadow-sm flex items-center justify-center gap-1'
              : 'text-[#bfc7d2] hover:text-[#dae2fd]'
          }`}
        >
          {timeHorizon === 'year' && <span className="w-1.5 h-1.5 rounded-full bg-[#93ccff]" />}
          <span>년별 집계 (Year)</span>
        </button>
      </div>

      {/* Hero Metrics Bento Grid for Selected Point */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Weight Card */}
        <div className="flex flex-col bg-[#171f33] p-3.5 rounded-xl border border-[#222a3d]/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-['Manrope'] text-[12px] font-semibold text-[#bfc7d2]">
              체중 (Weight)
            </span>
            <span
              className={`font-['JetBrains_Mono'] text-[11px] font-semibold px-1.5 py-0.5 rounded flex items-center ${
                weightDelta <= 0
                  ? 'bg-[#00a572]/20 text-[#4edea3]'
                  : 'bg-[#ffb95f]/20 text-[#ffb95f]'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] mr-0.5">
                {weightDelta <= 0 ? 'trending_down' : 'trending_up'}
              </span>
              {weightDelta > 0 ? `+${weightDelta.toFixed(1)}` : `${weightDelta.toFixed(1)}`}kg
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-['JetBrains_Mono'] text-[30px] font-bold text-[#dae2fd] tracking-tight">
              {activeRecord.metrics.weightKg.toFixed(1)}
            </span>
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#bfc7d2]">kg</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 bg-[#060e20]/40 px-2 py-1 rounded border border-[#222a3d]/50">
            <span className="font-['JetBrains_Mono'] text-[11px] font-semibold text-[#ffb95f]">
              {activeRecord.metrics.weightKg > 66.4 ? '표준이상' : '표준'}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/70">표준: 49.1~66.4</span>
          </div>
        </div>

        {/* Body Fat Percentage Card */}
        <div className="flex flex-col bg-[#171f33] p-3.5 rounded-xl border border-[#222a3d]/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-['Manrope'] text-[12px] font-semibold text-[#bfc7d2]">
              체지방률 (PBF)
            </span>
            <span
              className={`font-['JetBrains_Mono'] text-[11px] font-semibold px-1.5 py-0.5 rounded flex items-center ${
                pbfDelta <= 0
                  ? 'bg-[#00a572]/20 text-[#4edea3]'
                  : 'bg-[#ffb95f]/20 text-[#ffb95f]'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] mr-0.5">
                {pbfDelta <= 0 ? 'trending_down' : 'trending_up'}
              </span>
              {pbfDelta > 0 ? `+${pbfDelta.toFixed(1)}` : `${pbfDelta.toFixed(1)}`}%
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-['JetBrains_Mono'] text-[30px] font-bold text-[#ffb95f] tracking-tight">
              {activeRecord.metrics.percentBodyFat.toFixed(1)}
            </span>
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#bfc7d2]">%</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 bg-[#060e20]/40 px-2 py-1 rounded border border-[#222a3d]/50">
            <span className="font-['JetBrains_Mono'] text-[11px] font-semibold text-[#ffb4ab]">
              {activeRecord.metrics.percentBodyFat >= 28 ? '비만' : activeRecord.metrics.percentBodyFat >= 20 ? '과체중' : '표준'}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/70">표준: 10.0~20.0</span>
          </div>
        </div>

        {/* SMM Card */}
        <div className="flex flex-col bg-[#171f33] p-3.5 rounded-xl border border-[#222a3d]/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-['Manrope'] text-[12px] font-semibold text-[#bfc7d2]">
              골격근량 (SMM)
            </span>
            <span
              className={`font-['JetBrains_Mono'] text-[11px] font-semibold px-1.5 py-0.5 rounded flex items-center ${
                smmDelta >= 0
                  ? 'bg-[#3198dc]/20 text-[#93ccff]'
                  : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] mr-0.5">
                {smmDelta >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              {smmDelta > 0 ? `+${smmDelta.toFixed(1)}` : `${smmDelta.toFixed(1)}`}kg
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-['JetBrains_Mono'] text-[30px] font-bold text-[#93ccff] tracking-tight">
              {activeRecord.metrics.skeletalMuscleKg.toFixed(1)}
            </span>
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#bfc7d2]">kg</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 bg-[#060e20]/40 px-2 py-1 rounded border border-[#222a3d]/50">
            <span className="font-['JetBrains_Mono'] text-[11px] font-semibold text-[#4edea3]">
              {activeRecord.metrics.skeletalMuscleKg >= 24.5 ? '표준(우수)' : '표준이하'}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/70">표준: 24.5~29.9</span>
          </div>
        </div>

        {/* Body Fat Mass Card */}
        <div className="flex flex-col bg-[#171f33] p-3.5 rounded-xl border border-[#222a3d]/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-['Manrope'] text-[12px] font-semibold text-[#bfc7d2]">
              체지방량 (BFM)
            </span>
            <span
              className={`font-['JetBrains_Mono'] text-[11px] font-semibold px-1.5 py-0.5 rounded flex items-center ${
                bfmDelta <= 0
                  ? 'bg-[#00a572]/20 text-[#4edea3]'
                  : 'bg-[#ffb95f]/20 text-[#ffb95f]'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] mr-0.5">
                {bfmDelta <= 0 ? 'trending_down' : 'trending_up'}
              </span>
              {bfmDelta > 0 ? `+${bfmDelta.toFixed(1)}` : `${bfmDelta.toFixed(1)}`}kg
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-['JetBrains_Mono'] text-[30px] font-bold text-[#ffb95f] tracking-tight">
              {activeRecord.metrics.bodyFatKg.toFixed(1)}
            </span>
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#bfc7d2]">kg</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 bg-[#060e20]/40 px-2 py-1 rounded border border-[#222a3d]/50">
            <span className="font-['JetBrains_Mono'] text-[11px] font-semibold text-[#ffb4ab]">
              {activeRecord.metrics.bodyFatKg > 13.9 ? '표준이상' : '표준'}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/70">표준: 6.9~13.9</span>
          </div>
        </div>
      </div>

      {/* Primary Dynamic Multi-axis Chart (Weight & Fat Rate) */}
      <div className="flex flex-col bg-[#131b2e] p-4 rounded-xl gap-2 border border-[#222a3d]/80 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-['Manrope'] text-[17px] font-bold text-[#dae2fd]">
              시계열 체성분 추이
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2]/80">
              {chartSubtitle}
            </span>
          </div>
          <div className="flex items-center gap-3 font-['JetBrains_Mono'] text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#93ccff]" />
              <span className="text-[#bfc7d2]">체중</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#ffb95f]" />
              <span className="text-[#bfc7d2]">체지방률</span>
            </div>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="w-full bg-[#060e20]/90 rounded-lg p-2.5 relative border border-[#222a3d]/60">
          <svg className="w-full h-44 overflow-visible" fill="none" viewBox="0 0 340 150">
            <defs>
              <linearGradient id="primaryArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#93ccff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#93ccff" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="tertiaryArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffb95f" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            <line stroke="#2d3449" strokeDasharray="3 3" strokeWidth="0.8" x1="20" x2="320" y1="25" y2="25" />
            <line stroke="#2d3449" strokeDasharray="3 3" strokeWidth="0.8" x1="20" x2="320" y1="65" y2="65" />
            <line stroke="#2d3449" strokeDasharray="3 3" strokeWidth="0.8" x1="20" x2="320" y1="105" y2="105" />

            {/* Dynamic Area Gradients for multi-records */}
            {N >= 2 && weightPolygon && (
              <polygon fill="url(#primaryArea)" points={weightPolygon} />
            )}
            {N >= 2 && pbfPolygon && (
              <polygon fill="url(#tertiaryArea)" points={pbfPolygon} />
            )}

            {/* Dynamic Polylines */}
            {N >= 2 && weightPolyline && (
              <polyline
                points={weightPolyline}
                stroke="#93ccff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            )}
            {N >= 2 && pbfPolyline && (
              <polyline
                points={pbfPolyline}
                stroke="#ffb95f"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            )}

            {/* Interactive Data Points (Nodes) */}
            {svgNodes.map((pt) => {
              const isSelected = selectedNode.index === pt.index;
              return (
                <g
                  key={pt.recordId || pt.index}
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedPointIndex(pt.index);
                    if (onSelectRecord) {
                      onSelectRecord(pt.record);
                    }
                  }}
                >
                  {/* Invisible generous touch/click hit area */}
                  <circle cx={pt.x} cy={(pt.wy + pt.py) / 2} r="18" fill="transparent" />

                  {/* Weight Node */}
                  <circle
                    cx={pt.x}
                    cy={pt.wy}
                    fill={isSelected ? '#93ccff' : '#171f33'}
                    r={isSelected ? 6 : 3.5}
                    stroke="#93ccff"
                    strokeWidth="2"
                  />
                  {isSelected && (
                    <circle
                      className="animate-ping origin-center"
                      cx={pt.x}
                      cy={pt.wy}
                      r="8"
                      stroke="#93ccff"
                      strokeOpacity="0.6"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* PBF Node */}
                  <circle
                    cx={pt.x}
                    cy={pt.py}
                    fill={isSelected ? '#ffb95f' : '#171f33'}
                    r={isSelected ? 5 : 3}
                    stroke="#ffb95f"
                    strokeWidth="2"
                  />

                  {/* X Axis Date Label */}
                  <text
                    fill={isSelected ? '#93ccff' : '#89929b'}
                    fontFamily="JetBrains Mono"
                    fontSize="10"
                    fontWeight={isSelected ? '700' : '400'}
                    textAnchor="middle"
                    x={pt.x}
                    y="138"
                  >
                    {pt.date}
                  </text>
                </g>
              );
            })}

            {/* Selected Focus Node Badges (Pin Tooltips) */}
            {selectedNode && (
              <g>
                {/* Weight Pin */}
                <rect
                  fill="#171f33"
                  height="17"
                  rx="3.5"
                  width="50"
                  x={Math.max(10, Math.min(selectedNode.x - 25, SVG_WIDTH - 60))}
                  y={Math.max(6, selectedNode.wy - 23)}
                  stroke="#3198dc"
                  strokeWidth="1"
                />
                <text
                  fill="#93ccff"
                  fontFamily="JetBrains Mono"
                  fontSize="9.5"
                  fontWeight="700"
                  textAnchor="middle"
                  x={Math.max(10, Math.min(selectedNode.x - 25, SVG_WIDTH - 60)) + 25}
                  y={Math.max(6, selectedNode.wy - 23) + 12}
                >
                  {selectedNode.weight.toFixed(1)}kg
                </text>

                {/* PBF Pin */}
                <rect
                  fill="#171f33"
                  height="17"
                  rx="3.5"
                  width="46"
                  x={Math.max(10, Math.min(selectedNode.x - 23, SVG_WIDTH - 56))}
                  y={Math.min(112, selectedNode.py + 8)}
                  stroke="#ffb95f"
                  strokeWidth="1"
                />
                <text
                  fill="#ffb95f"
                  fontFamily="JetBrains Mono"
                  fontSize="9.5"
                  fontWeight="700"
                  textAnchor="middle"
                  x={Math.max(10, Math.min(selectedNode.x - 23, SVG_WIDTH - 56)) + 23}
                  y={Math.min(112, selectedNode.py + 8) + 12}
                >
                  {selectedNode.pbf.toFixed(1)}%
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Dynamic Cumulative Loss / Change Badge */}
        {cumulativeStats ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[#bfc7d2] font-['JetBrains_Mono'] text-[11px] bg-[#2d3449]/40 px-3 py-2 rounded-lg border border-[#3f4850]/40 gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#4edea3]">verified</span>
              <span>
                {cumulativeStats.earliestDate} ~ {cumulativeStats.latestDate} ({cumulativeStats.totalCount}회 측정 누적 변화):
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-bold text-[12px] ${
                  cumulativeStats.weightChange <= 0 ? 'text-[#4edea3]' : 'text-[#ffb95f]'
                }`}
              >
                체중 {cumulativeStats.weightChange > 0 ? `+${cumulativeStats.weightChange.toFixed(1)}` : `${cumulativeStats.weightChange.toFixed(1)}`}kg
              </span>
              <span className="text-[#3f4850]">·</span>
              <span
                className={`font-bold text-[12px] ${
                  cumulativeStats.pbfChange <= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                }`}
              >
                체지방 {cumulativeStats.pbfChange > 0 ? `+${cumulativeStats.pbfChange.toFixed(1)}` : `${cumulativeStats.pbfChange.toFixed(1)}`}%
              </span>
              <span className="text-[#3f4850]">·</span>
              <span
                className={`font-bold text-[12px] ${
                  cumulativeStats.smmChange >= 0 ? 'text-[#93ccff]' : 'text-[#ffb4ab]'
                }`}
              >
                골격근 {cumulativeStats.smmChange > 0 ? `+${cumulativeStats.smmChange.toFixed(1)}` : `${cumulativeStats.smmChange.toFixed(1)}`}kg
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[#bfc7d2] font-['JetBrains_Mono'] text-[11px] bg-[#2d3449]/40 px-3 py-2 rounded-lg border border-[#3f4850]/40">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#93ccff]">info</span>
              <span>기준 측정 기록 등록 완료 (1건)</span>
            </div>
            <span className="text-[#93ccff] font-bold text-[11px]">
              새 결과지를 등록하면 기간별 누적 변화가 자동 연산됩니다
            </span>
          </div>
        )}
      </div>

      {/* Body Balance (SMM vs Fat) Horizontal Gauge Bars */}
      <div className="flex flex-col bg-[#171f33] p-4 rounded-xl gap-3 border border-[#222a3d]/70 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-['Manrope'] text-[17px] font-bold text-[#dae2fd]">
            골격근 · 지방 밸런스 ({activeRecord.displayDate.split(' ')[0]})
          </span>
          <span
            className="font-['JetBrains_Mono'] text-[11px] font-semibold px-2 py-0.5 rounded border"
            style={{
              color: balanceColor,
              backgroundColor: `${balanceColor}20`,
              borderColor: `${balanceColor}40`,
            }}
          >
            {balanceShape}
          </span>
        </div>

        {/* SMM Range Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-['Manrope'] text-[12px] font-medium">
            <span className="text-[#dae2fd]">골격근량 (SMM)</span>
            <span className="font-['JetBrains_Mono'] text-[14px] font-bold text-[#93ccff]">
              {smmVal.toFixed(1)} kg{' '}
              <span className="text-[11px] font-normal text-[#bfc7d2]/80">({smmPercent}%)</span>
            </span>
          </div>
          <div className="w-full bg-[#060e20] h-3.5 rounded flex overflow-hidden p-0.5 border border-[#222a3d]">
            <div className="h-full bg-[#2d3449] rounded-l" style={{ width: '30%' }} />
            <div
              className="h-full bg-[#93ccff] rounded shadow-[0_0_8px_rgba(147,204,255,0.6)]"
              style={{ width: `${Math.min(70, Math.max(20, (smmVal / 40) * 100 - 30))}%` }}
            />
            <div className="h-full bg-[#060e20]" style={{ width: '15%' }} />
          </div>
          <div className="flex justify-between font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/60">
            <span>표준이하 (24.5)</span>
            <span className="text-[#93ccff] font-semibold">표준 (24.5 ~ 29.9)</span>
            <span>표준이상</span>
          </div>
        </div>

        {/* Fat Mass Range Bar */}
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between font-['Manrope'] text-[12px] font-medium">
            <span className="text-[#dae2fd]">체지방량 (BFM)</span>
            <span className="font-['JetBrains_Mono'] text-[14px] font-bold text-[#ffb95f]">
              {bfmVal.toFixed(1)} kg{' '}
              <span className="text-[11px] font-semibold text-[#ffb4ab]">({bfmPercent}%)</span>
            </span>
          </div>
          <div className="w-full bg-[#060e20] h-3.5 rounded flex overflow-hidden p-0.5 border border-[#222a3d]">
            <div className="h-full bg-[#2d3449] rounded-l" style={{ width: '25%' }} />
            <div className="h-full bg-[#222a3d]" style={{ width: '25%' }} />
            <div
              className="h-full bg-[#ffb95f] rounded shadow-[0_0_8px_rgba(255,185,95,0.6)]"
              style={{ width: `${Math.min(50, Math.max(15, (bfmVal / 35) * 100 - 20))}%` }}
            />
          </div>
          <div className="flex justify-between font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/60">
            <span>표준이하 (6.9)</span>
            <span>표준 (6.9 ~ 13.9)</span>
            <span className="text-[#ffb95f] font-semibold">표준이상 (13.9+)</span>
          </div>
        </div>
      </div>

      {/* Segmental Lean & Fat Anatomy Map (InBody Sheet Match) */}
      <div className="flex flex-col bg-[#131b2e] p-4 rounded-xl gap-3 border border-[#222a3d]/80 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-['Manrope'] text-[17px] font-bold text-[#dae2fd]">
              부위별 발달 진단
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2]/80">
              Segmental Lean &amp; Fat Analysis ({activeRecord.displayDate.split(' ')[0]})
            </span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[11px] font-semibold px-2 py-0.5 rounded bg-[#00a572]/20 text-[#4edea3] border border-[#00a572]/40">
            근육 표준·양호
          </span>
        </div>

        {/* Dual Silhouette Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Lean Mass Diagram */}
          <div className="flex flex-col items-center bg-[#060e20]/80 p-3 rounded-lg relative border border-[#222a3d]/60">
            <span className="font-['Manrope'] text-[12px] font-semibold text-[#93ccff] mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">vital_signs</span>
              부위별 근육
            </span>

            {/* Stylized Body Diagram Vector */}
            <div className="relative w-32 h-44 flex items-center justify-center">
              <svg className="w-full h-full opacity-35 text-[#31394d]" fill="currentColor" viewBox="0 0 100 150">
                <circle cx="50" cy="18" r="12" />
                <path d="M38 34 H62 L60 85 H40 Z" />
                <rect height="42" rx="4.5" width="9" x="25" y="35" />
                <rect height="42" rx="4.5" width="9" x="66" y="35" />
                <rect height="52" rx="4.5" width="9" x="39" y="88" />
                <rect height="52" rx="4.5" width="9" x="52" y="88" />
              </svg>

              {/* Arm Labels */}
              <div className="absolute left-0 top-10 flex flex-col items-center">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">오른팔</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#93ccff] font-bold">
                  {segmentalLean.rightArm}
                </span>
              </div>
              <div className="absolute right-0 top-10 flex flex-col items-center">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">왼팔</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#93ccff] font-bold">
                  {segmentalLean.leftArm}
                </span>
              </div>

              {/* Trunk Label */}
              <div className="absolute top-14 flex flex-col items-center bg-[#222a3d]/90 px-1.5 py-0.5 rounded border border-[#3f4850]/40">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">몸통</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#93ccff] font-bold">
                  {segmentalLean.trunk}
                </span>
              </div>

              {/* Leg Labels */}
              <div className="absolute left-1 bottom-1 flex flex-col items-center">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">오른다리</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#93ccff] font-bold">
                  {segmentalLean.rightLeg}
                </span>
              </div>
              <div className="absolute right-1 bottom-1 flex flex-col items-center">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">왼다리</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#93ccff] font-bold">
                  {segmentalLean.leftLeg}
                </span>
              </div>
            </div>
          </div>

          {/* Segmental Fat Diagram */}
          <div className="flex flex-col items-center bg-[#060e20]/80 p-3 rounded-lg relative border border-[#222a3d]/60">
            <span className="font-['Manrope'] text-[12px] font-semibold text-[#ffb95f] mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">water_loss</span>
              부위별 체지방
            </span>

            <div className="relative w-32 h-44 flex items-center justify-center">
              <svg className="w-full h-full opacity-35 text-[#31394d]" fill="currentColor" viewBox="0 0 100 150">
                <circle cx="50" cy="18" r="12" />
                <path d="M36 34 H64 L62 85 H38 Z" />
                <rect height="42" rx="5" width="10" x="23" y="35" />
                <rect height="42" rx="5" width="10" x="67" y="35" />
                <rect height="52" rx="5" width="10" x="38" y="88" />
                <rect height="52" rx="5" width="10" x="52" y="88" />
              </svg>

              {/* Arm Labels */}
              <div className="absolute left-0 top-10 flex flex-col items-center">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">오른팔</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb4ab] font-bold">
                  {segmentalFat.rightArm}
                </span>
              </div>
              <div className="absolute right-0 top-10 flex flex-col items-center">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">왼팔</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb4ab] font-bold">
                  {segmentalFat.leftArm}
                </span>
              </div>

              {/* Trunk Label */}
              <div className="absolute top-14 flex flex-col items-center bg-[#222a3d]/90 px-1.5 py-0.5 rounded border border-[#3f4850]/40">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">몸통</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb4ab] font-bold">
                  {segmentalFat.trunk}
                </span>
              </div>

              {/* Leg Labels */}
              <div className="absolute left-1 bottom-1 flex flex-col items-center">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">오른다리</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb4ab] font-bold">
                  {segmentalFat.rightLeg}
                </span>
              </div>
              <div className="absolute right-1 bottom-1 flex flex-col items-center">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]">왼다리</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb4ab] font-bold">
                  {segmentalFat.leftLeg}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Obesity & Telemetry Diagnostic Matrix */}
      <div className="flex flex-col bg-[#171f33] p-4 rounded-xl gap-2.5 border border-[#222a3d]/70 shadow-sm">
        <span className="font-['Manrope'] text-[17px] font-bold text-[#dae2fd]">
          종합 비만 및 대사 분석 ({activeRecord.displayDate.split(' ')[0]})
        </span>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#131b2e] p-2.5 rounded border border-[#222a3d]/60">
            <span className="font-['Manrope'] text-[11px] font-semibold text-[#bfc7d2]">BMI</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-['JetBrains_Mono'] text-[19px] font-bold text-[#dae2fd]">
                {activeRecord.metrics.bmi}
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#ffb95f] font-semibold">
                {activeRecord.metrics.bmi >= 25 ? '과체중' : '표준'}
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/60 block mt-0.5">
              표준 18.5~25.0
            </span>
          </div>

          <div className="bg-[#131b2e] p-2.5 rounded border border-[#222a3d]/60">
            <span className="font-['Manrope'] text-[11px] font-semibold text-[#bfc7d2]">복부지방률 (WHR)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-['JetBrains_Mono'] text-[19px] font-bold text-[#dae2fd]">
                {activeRecord.metrics.waistHipRatio}
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#4edea3] font-semibold">
                {activeRecord.metrics.waistHipRatio > 0.9 ? '주의' : '표준'}
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/60 block mt-0.5">
              표준 0.80~0.90
            </span>
          </div>

          <div className="bg-[#131b2e] p-2.5 rounded border border-[#222a3d]/60">
            <span className="font-['Manrope'] text-[11px] font-semibold text-[#bfc7d2]">내장지방레벨</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-['JetBrains_Mono'] text-[19px] font-bold text-[#ffb95f]">
                Lv. {activeRecord.metrics.visceralFatLevel}
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#ffb95f] font-semibold">
                {activeRecord.metrics.visceralFatLevel >= 10 ? '위험' : '주의'}
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/60 block mt-0.5">
              권장 레벨 1~9 이하
            </span>
          </div>

          <div className="bg-[#131b2e] p-2.5 rounded border border-[#222a3d]/60">
            <span className="font-['Manrope'] text-[11px] font-semibold text-[#bfc7d2]">기초대사량 (BMR)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-['JetBrains_Mono'] text-[19px] font-bold text-[#93ccff]">
                {activeRecord.metrics.basalMetabolismKcal.toLocaleString()}
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2]">kcal</span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/60 block mt-0.5">
              표준 1,500~1,895
            </span>
          </div>
        </div>

        {/* Fitness Score Highlight */}
        <div className="flex items-center justify-between bg-[#2d3449]/70 p-3 rounded-lg mt-1 border border-[#3f4850]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#3198dc]/20 border border-[#93ccff]/40 flex items-center justify-center text-[#93ccff]">
              <span className="material-symbols-outlined text-[20px]">award_star</span>
            </div>
            <div>
              <div className="font-['Manrope'] text-[12px] font-semibold text-[#dae2fd]">
                신체발달점수 (Fitness Score)
              </div>
              <div className="font-['JetBrains_Mono'] text-[11px] text-[#4edea3] font-medium">
                {balanceShape}
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-['JetBrains_Mono'] text-[28px] font-bold text-[#93ccff]">
              {activeRecord.metrics.fitnessScore}
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2]">/ 100점</span>
          </div>
        </div>
      </div>

      {/* Goal Control Targets Prescription */}
      <div className="flex flex-col bg-[#131b2e] p-4 rounded-xl gap-2.5 border border-[#222a3d]/80 shadow-md">
        <div className="flex items-center justify-between">
          <span className="font-['Manrope'] text-[17px] font-bold text-[#dae2fd]">
            체중조절 권장치
          </span>
          <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#93ccff]">
            목표: {activeRecord.metrics.targetWeightKg.toFixed(1)} kg
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col bg-[#171f33] p-3 rounded border border-[#222a3d]/70">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2]">지방 조절량</span>
            <span className="font-['JetBrains_Mono'] text-[20px] font-bold text-[#ffb4ab] mt-0.5">
              {activeRecord.metrics.targetFatKg.toFixed(1)} kg
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#bfc7d2]/70 mt-0.5">
              유산소 운동 권장
            </span>
          </div>

          <div className="flex flex-col bg-[#171f33] p-3 rounded border border-[#222a3d]/70">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2]">근육 조절량</span>
            <span className="font-['JetBrains_Mono'] text-[20px] font-bold text-[#4edea3] mt-0.5">
              +{activeRecord.metrics.targetMuscleKg.toFixed(1)} kg
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#4edea3]/80 mt-0.5">
              현재 근육량 유지
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => onNavigateTab('ai-report')}
            className="w-full py-2.5 px-4 bg-[#93ccff] hover:bg-[#cce5ff] text-[#003351] font-['JetBrains_Mono'] text-[12px] uppercase font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-[0_0_16px_rgba(147,204,255,0.3)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">neurology</span>
            AI 리포트 심층 진단 보기
          </button>
        </div>
      </div>
    </div>
  );
};
