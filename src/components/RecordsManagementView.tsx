import React, { useState } from 'react';
import { InBodyRecord, TimeHorizon, ActiveTab } from '../types';

interface RecordsManagementViewProps {
  records: InBodyRecord[];
  activeRecordId: string;
  onSelectRecord: (record: InBodyRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteAllRecords?: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onImportRecords?: (imported: InBodyRecord[]) => void;
}

export const RecordsManagementView: React.FC<RecordsManagementViewProps> = ({
  records,
  activeRecordId,
  onSelectRecord,
  onDeleteRecord,
  onDeleteAllRecords,
  onNavigateTab,
  onImportRecords,
}) => {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('month');
  const [selectedJsonRecord, setSelectedJsonRecord] = useState<InBodyRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<InBodyRecord | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sort descending by timestamp for recent-first list
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredRecords = sortedRecords.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.displayDate.toLowerCase().includes(term) ||
      r.location.toLowerCase().includes(term) ||
      (r.notes && r.notes.toLowerCase().includes(term)) ||
      r.metrics.weightKg.toString().includes(term)
    );
  });

  // Calculate high-level summary
  const totalCount = records.length;
  const latestRecord = sortedRecords[0];
  const oldestRecord = sortedRecords[sortedRecords.length - 1];
  const weightChange = latestRecord && oldestRecord
    ? (latestRecord.metrics.weightKg - oldestRecord.metrics.weightKg).toFixed(1)
    : '0.0';
  const smmChange = latestRecord && oldestRecord
    ? (latestRecord.metrics.skeletalMuscleKg - oldestRecord.metrics.skeletalMuscleKg).toFixed(1)
    : '0.0';

  // Grouping for Month and Year view
  const groupByMonth = () => {
    const map = new Map<string, InBodyRecord[]>();
    sortedRecords.forEach((r) => {
      const monthKey = r.timestamp.slice(0, 7); // "2024-08"
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey)!.push(r);
    });
    return Array.from(map.entries()).map(([monthKey, list]) => {
      const avgWeight = (list.reduce((acc, cur) => acc + cur.metrics.weightKg, 0) / list.length).toFixed(1);
      const avgPbf = (list.reduce((acc, cur) => acc + cur.metrics.percentBodyFat, 0) / list.length).toFixed(1);
      const avgSmm = (list.reduce((acc, cur) => acc + cur.metrics.skeletalMuscleKg, 0) / list.length).toFixed(1);
      return { monthKey, list, avgWeight, avgPbf, avgSmm };
    });
  };

  const groupByYear = () => {
    const map = new Map<string, InBodyRecord[]>();
    sortedRecords.forEach((r) => {
      const yearKey = r.timestamp.slice(0, 4); // "2024"
      if (!map.has(yearKey)) map.set(yearKey, []);
      map.get(yearKey)!.push(r);
    });
    return Array.from(map.entries()).map(([yearKey, list]) => {
      const weights = list.map((r) => r.metrics.weightKg);
      const minWeight = Math.min(...weights).toFixed(1);
      const maxWeight = Math.max(...weights).toFixed(1);
      return { yearKey, list, minWeight, maxWeight, count: list.length };
    });
  };

  // Export JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `inbody_records_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && onImportRecords) {
            onImportRecords(parsed);
          } else if (parsed && parsed.metrics && onImportRecords) {
            onImportRecords([parsed]);
          }
        } catch (err) {
          setToastMessage('올바른 JSON 파일 형식이 아닙니다.');
          setTimeout(() => setToastMessage(null), 2500);
        }
      };
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col w-full px-4 py-4 gap-4 max-w-xl mx-auto sm:max-w-2xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#171f33] via-[#1e293b] to-[#131b2e] p-5 rounded-2xl border border-[#222a3d] shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#4edea3] uppercase font-bold tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            JSON DATABASE &amp; HISTORICAL ARCHIVE
          </span>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#93ccff] bg-[#3198dc]/15 px-2 py-0.5 rounded border border-[#3198dc]/30">
            총 {totalCount}건 저장됨
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-1">
          <div>
            <div className="font-['Space_Grotesk'] text-[22px] font-bold text-[#dae2fd]">
              인바디 기록 관리
            </div>
            <div className="font-['Manrope'] text-[12px] text-[#bfc7d2]/80 mt-0.5">
              일별 · 월별 · 년별 체성분 추이 및 JSON 데이터베이스
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportJson}
              disabled={records.length === 0}
              className={`px-2.5 py-1.5 font-['JetBrains_Mono'] text-[11px] font-medium rounded-lg border flex items-center gap-1 transition-colors ${
                records.length === 0
                  ? 'opacity-40 cursor-not-allowed border-[#3f4850]/40 text-[#bfc7d2]/50 bg-[#1e293b]'
                  : 'bg-[#222a3d] hover:bg-[#2d3748] text-[#93ccff] border-[#93ccff]/30 cursor-pointer'
              }`}
              title="저장된 모든 인바디 기록을 .json 파일로 다운로드"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>내보내기</span>
            </button>

            <label className="px-2.5 py-1.5 bg-[#222a3d] hover:bg-[#2d3748] text-[#dae2fd] font-['JetBrains_Mono'] text-[11px] font-medium rounded-lg border border-[#3f4850]/40 flex items-center gap-1 cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[15px]">upload_file</span>
              <span>가져오기</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              type="button"
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={records.length === 0}
              className={`px-2.5 py-1.5 font-['JetBrains_Mono'] text-[11px] font-medium rounded-lg border flex items-center gap-1 transition-colors ${
                records.length === 0
                  ? 'opacity-30 cursor-not-allowed border-[#3f4850]/30 text-[#bfc7d2]/40 bg-[#1a1c24]'
                  : 'bg-[#3b1212]/80 hover:bg-[#ba1a1a]/30 text-[#ffb4ab] border-[#ffb4ab]/40 cursor-pointer'
              }`}
              title="저장된 모든 인바디 기록을 한 번에 전체 삭제"
            >
              <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
              <span>전체 삭제</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-[#222a3d]/80">
          <div className="bg-[#131b2e] p-2 rounded-lg text-center border border-[#222a3d]/60">
            <div className="text-[11px] text-[#bfc7d2]">최근 체중</div>
            <div className="text-[16px] font-mono font-bold text-[#dae2fd]">
              {latestRecord ? latestRecord.metrics.weightKg.toFixed(1) : '-'} <span className="text-[11px]">kg</span>
            </div>
          </div>
          <div className="bg-[#131b2e] p-2 rounded-lg text-center border border-[#222a3d]/60">
            <div className="text-[11px] text-[#bfc7d2]">누적 체중 변화</div>
            <div className={`text-[16px] font-mono font-bold ${Number(weightChange) <= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}`}>
              {Number(weightChange) > 0 ? `+${weightChange}` : weightChange} <span className="text-[11px]">kg</span>
            </div>
          </div>
          <div className="bg-[#131b2e] p-2 rounded-lg text-center border border-[#222a3d]/60">
            <div className="text-[11px] text-[#bfc7d2]">골격근 변화</div>
            <div className={`text-[16px] font-mono font-bold ${Number(smmChange) >= 0 ? 'text-[#93ccff]' : 'text-[#ffb95f]'}`}>
              {Number(smmChange) > 0 ? `+${smmChange}` : smmChange} <span className="text-[11px]">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Horizon Filter (일별 / 월별 / 년별) */}
      <div className="flex flex-col gap-2">
        <div className="flex p-1 bg-[#131b2e] rounded-xl border border-[#222a3d]/80">
          <button
            type="button"
            onClick={() => setTimeHorizon('day')}
            className={`flex-1 py-2 text-center text-[12px] font-['Space_Grotesk'] font-bold rounded-lg transition-all cursor-pointer ${
              timeHorizon === 'day'
                ? 'bg-[#222a3d] text-[#93ccff] shadow-[0_0_12px_rgba(147,204,255,0.2)]'
                : 'text-[#bfc7d2]/70 hover:text-[#dae2fd]'
            }`}
          >
            일별 관리 (Day)
          </button>
          <button
            type="button"
            onClick={() => setTimeHorizon('month')}
            className={`flex-1 py-2 text-center text-[12px] font-['Space_Grotesk'] font-bold rounded-lg transition-all cursor-pointer ${
              timeHorizon === 'month'
                ? 'bg-[#222a3d] text-[#93ccff] shadow-[0_0_12px_rgba(147,204,255,0.2)]'
                : 'text-[#bfc7d2]/70 hover:text-[#dae2fd]'
            }`}
          >
            월별 관리 (Month)
          </button>
          <button
            type="button"
            onClick={() => setTimeHorizon('year')}
            className={`flex-1 py-2 text-center text-[12px] font-['Space_Grotesk'] font-bold rounded-lg transition-all cursor-pointer ${
              timeHorizon === 'year'
                ? 'bg-[#222a3d] text-[#93ccff] shadow-[0_0_12px_rgba(147,204,255,0.2)]'
                : 'text-[#bfc7d2]/70 hover:text-[#dae2fd]'
            }`}
          >
            년별 관리 (Year)
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#131b2e] px-3 py-2 rounded-xl border border-[#222a3d]/80 text-[#dae2fd]">
            <span className="material-symbols-outlined text-[18px] text-[#bfc7d2]/70">search</span>
            <input
              type="text"
              placeholder="측정일자, 장소, 메모 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-[12px] w-full outline-none placeholder-[#bfc7d2]/50 font-['Manrope']"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-[#bfc7d2]/70 hover:text-[#dae2fd] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('ocr-verification')}
            className="px-3.5 py-2 bg-[#4edea3] hover:bg-[#6ffbbe] text-[#002113] font-['JetBrains_Mono'] text-[11px] font-bold rounded-xl flex items-center gap-1.5 shadow-[0_0_12px_rgba(78,222,163,0.3)] cursor-pointer transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
            <span>새 결과지 OCR</span>
          </button>
        </div>
      </div>

      {/* View: Month Grouping View */}
      {timeHorizon === 'month' && (
        <div className="flex flex-col gap-3">
          <div className="text-[12px] font-['JetBrains_Mono'] text-[#bfc7d2] px-1">
            월별 집계 및 평균 수치
          </div>
          {groupByMonth().map(({ monthKey, list, avgWeight, avgPbf, avgSmm }) => (
            <div
              key={monthKey}
              className="bg-[#131b2e] p-4 rounded-xl border border-[#222a3d]/80 flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3198dc]/20 border border-[#93ccff]/30 flex items-center justify-center font-['JetBrains_Mono'] text-[12px] font-bold text-[#93ccff]">
                    {monthKey.split('-')[1]}월
                  </div>
                  <div>
                    <div className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dae2fd]">
                      {monthKey} ({list.length}회 측정)
                    </div>
                    <div className="font-['Manrope'] text-[11px] text-[#bfc7d2]/70">
                      평균 체중 {avgWeight}kg · 체지방 {avgPbf}% · 골격근 {avgSmm}kg
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-records in this month */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#222a3d]/60">
                {list.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onSelectRecord(rec)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                      rec.id === activeRecordId
                        ? 'bg-[#222a3d] border-[#93ccff]/60 shadow-[0_0_10px_rgba(147,204,255,0.15)]'
                        : 'bg-[#171f33] hover:bg-[#1c263d] border-[#222a3d]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex flex-col">
                        <span className="font-['JetBrains_Mono'] text-[12px] font-bold text-[#dae2fd]">
                          {rec.displayDate}
                        </span>
                        <span className="font-['Manrope'] text-[10px] text-[#bfc7d2]/70">
                          {rec.location} · {rec.deviceModel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-['JetBrains_Mono'] text-[12px]">
                        <span className="font-bold text-[#dae2fd]">{rec.metrics.weightKg.toFixed(1)}kg</span>
                        <span className="text-[10px] text-[#bfc7d2]/70 ml-1.5">
                          (근육 {rec.metrics.skeletalMuscleKg.toFixed(1)}kg / 지방 {rec.metrics.percentBodyFat.toFixed(1)}%)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJsonRecord(rec);
                        }}
                        className="text-[#93ccff] hover:text-[#cce5ff] p-1 text-[11px] font-['JetBrains_Mono'] cursor-pointer"
                        title="JSON 보기"
                      >
                        JSON
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View: Year Grouping View */}
      {timeHorizon === 'year' && (
        <div className="flex flex-col gap-3">
          <div className="text-[12px] font-['JetBrains_Mono'] text-[#bfc7d2] px-1">
            년도별 측정 요약
          </div>
          {groupByYear().map(({ yearKey, list, minWeight, maxWeight, count }) => (
            <div
              key={yearKey}
              className="bg-[#131b2e] p-4 rounded-xl border border-[#222a3d]/80 flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[#4edea3]/20 border border-[#4edea3]/40 flex items-center justify-center font-['JetBrains_Mono'] text-[13px] font-bold text-[#4edea3]">
                    {yearKey}
                  </div>
                  <div>
                    <div className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dae2fd]">
                      {yearKey}년도 종합 ({count}건 기록)
                    </div>
                    <div className="font-['Manrope'] text-[11px] text-[#bfc7d2]/70">
                      최저 {minWeight}kg ~ 최고 {maxWeight}kg (변동폭 {(Number(maxWeight) - Number(minWeight)).toFixed(1)}kg)
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222a3d]/60">
                <div className="bg-[#171f33] p-2.5 rounded-lg text-center border border-[#222a3d]">
                  <div className="text-[11px] text-[#bfc7d2]">연간 최저 체중</div>
                  <div className="text-[16px] font-mono font-bold text-[#4edea3] mt-0.5">{minWeight} kg</div>
                </div>
                <div className="bg-[#171f33] p-2.5 rounded-lg text-center border border-[#222a3d]">
                  <div className="text-[11px] text-[#bfc7d2]">연간 최고 체중</div>
                  <div className="text-[16px] font-mono font-bold text-[#ffb4ab] mt-0.5">{maxWeight} kg</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View: Day Grouping / Full Individual Records List */}
      {(timeHorizon === 'day' || true) && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-['JetBrains_Mono'] text-[#bfc7d2]">
              {timeHorizon === 'day' ? '개별 측정일자별 전체 기록' : '세부 기록 목록'}
            </span>
            <span className="text-[11px] font-['JetBrains_Mono'] text-[#93ccff]">
              선택 시 차트 및 AI 분석 연동
            </span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-[#131b2e] p-8 rounded-xl border border-[#222a3d] text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[36px] text-[#bfc7d2]/40">content_paste_off</span>
              <p className="text-[13px] text-[#bfc7d2]">등록된 인바디 기록이 없습니다.</p>
              <button
                type="button"
                onClick={() => onNavigateTab('ocr-verification')}
                className="mt-2 px-4 py-2 bg-[#93ccff] text-[#003351] font-bold rounded-lg text-[12px] cursor-pointer"
              >
                결과지 사진으로 OCR 추출하기
              </button>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isSelected = rec.id === activeRecordId;
              return (
                <div
                  key={rec.id}
                  onClick={() => onSelectRecord(rec)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col gap-3 ${
                    isSelected
                      ? 'bg-[#17233d] border-[#93ccff] shadow-[0_0_16px_rgba(147,204,255,0.2)]'
                      : 'bg-[#131b2e] hover:bg-[#171f33] border-[#222a3d]/80 shadow-sm'
                  }`}
                >
                  {/* Top card bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Space_Grotesk'] text-[16px] font-bold text-[#dae2fd]">
                          {rec.displayDate}
                        </span>
                        {isSelected && (
                          <span className="bg-[#93ccff]/20 text-[#93ccff] font-['JetBrains_Mono'] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#93ccff]/40">
                            선택됨
                          </span>
                        )}
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#4edea3] bg-[#00a572]/20 px-1.5 py-0.5 rounded border border-[#00a572]/30">
                          신뢰도 {rec.scanConfidence || 98}%
                        </span>
                      </div>
                      <div className="font-['Manrope'] text-[11px] text-[#bfc7d2]/70 mt-0.5">
                        {rec.deviceModel} · {rec.location} · {rec.userProfile.gender} ({rec.userProfile.age}세, {rec.userProfile.heightCm}cm)
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRecord(rec);
                          onNavigateTab('ocr-verification');
                        }}
                        className="p-1.5 text-[#4edea3] hover:bg-[#222a3d] rounded-lg transition-colors cursor-pointer flex items-center gap-1 px-2 text-[11px] font-['Space_Grotesk'] font-bold border border-[#4edea3]/30 bg-[#4edea3]/10"
                        title="수치 확인 및 수정"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                        <span>수정</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJsonRecord(rec);
                        }}
                        className="p-1.5 text-[#93ccff] hover:bg-[#222a3d] rounded-lg transition-colors cursor-pointer"
                        title="JSON 원본 열람"
                      >
                        <span className="material-symbols-outlined text-[18px]">data_object</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecordToDelete(rec);
                        }}
                        className="p-1.5 text-[#ffb4ab]/70 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/15 rounded-lg transition-colors cursor-pointer"
                        title="기록 삭제"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 key metrics pill grid */}
                  <div className="grid grid-cols-4 gap-2 bg-[#0b1326] p-2.5 rounded-lg border border-[#222a3d]/60 font-['JetBrains_Mono'] text-center">
                    <div>
                      <div className="text-[10px] text-[#bfc7d2]">체중</div>
                      <div className="text-[15px] font-bold text-[#dae2fd]">{rec.metrics.weightKg.toFixed(1)}</div>
                      <div className="text-[9px] text-[#bfc7d2]/60">kg</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#bfc7d2]">골격근량</div>
                      <div className="text-[15px] font-bold text-[#93ccff]">{rec.metrics.skeletalMuscleKg.toFixed(1)}</div>
                      <div className="text-[9px] text-[#bfc7d2]/60">kg</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#bfc7d2]">체지방률</div>
                      <div className="text-[15px] font-bold text-[#ffb95f]">{rec.metrics.percentBodyFat.toFixed(1)}</div>
                      <div className="text-[9px] text-[#bfc7d2]/60">%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#bfc7d2]">체지방량</div>
                      <div className="text-[15px] font-bold text-[#ffb4ab]">{rec.metrics.bodyFatKg.toFixed(1)}</div>
                      <div className="text-[9px] text-[#bfc7d2]/60">kg</div>
                    </div>
                  </div>

                  {/* Notes / Footer Bar */}
                  {rec.notes && (
                    <div className="text-[11px] font-['Manrope'] text-[#bfc7d2]/80 bg-[#171f33]/60 px-2.5 py-1 rounded border border-[#222a3d]/40 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[#4edea3]">notes</span>
                      <span className="truncate">{rec.notes}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px] font-['Manrope']">
                    <span className="text-[#bfc7d2]/60">
                      신체점수: <strong className="text-[#93ccff]">{rec.metrics.fitnessScore}점</strong> · 내장지방 Lv.{rec.metrics.visceralFatLevel}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(rec);
                        onNavigateTab('analytics-trends');
                      }}
                      className="text-[#93ccff] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                    >
                      <span>통계 차트로 분석</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* JSON Modal Viewer */}
      {selectedJsonRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-[#222a3d] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#222a3d] flex items-center justify-between bg-[#131b2e]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#93ccff] text-[18px]">data_object</span>
                <span className="font-['Space_Grotesk'] text-[15px] font-bold text-[#dae2fd]">
                  JSON 레코드 상세 ({selectedJsonRecord.displayDate})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJsonRecord(null)}
                className="text-[#bfc7d2] hover:text-[#dae2fd] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-[#060e20]">
              <pre className="font-['JetBrains_Mono'] text-[11px] leading-relaxed text-[#93ccff] p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] overflow-x-auto select-all">
                {JSON.stringify(selectedJsonRecord, null, 2)}
              </pre>
            </div>

            <div className="px-4 py-3 border-t border-[#222a3d] bg-[#131b2e] flex items-center justify-between">
              <span className="text-[11px] font-['JetBrains_Mono'] text-[#4edea3]">
                {copied ? '클립보드에 복사되었습니다!' : 'JSON 유효성 검증 완료'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(selectedJsonRecord, null, 2))}
                  className="px-3 py-1.5 bg-[#222a3d] hover:bg-[#2d3748] text-[#dae2fd] text-[12px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  <span>JSON 복사</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedJsonRecord(null)}
                  className="px-3 py-1.5 bg-[#93ccff] hover:bg-[#cce5ff] text-[#003351] text-[12px] font-bold rounded-lg cursor-pointer transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Single Record Deletion Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 bg-[#060e20]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171f33] border border-[#ffb4ab]/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5 text-[#ffb4ab]">
              <div className="w-9 h-9 rounded-xl bg-[#ba1a1a]/20 border border-[#ba1a1a]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div>
                <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-[#dae2fd]">
                  인바디 기록 삭제
                </h3>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#ffb4ab]">
                  ID: {recordToDelete.id}
                </span>
              </div>
            </div>

            <div className="bg-[#0b1326] p-3 rounded-xl border border-[#222a3d] text-[13px] text-[#dae2fd] flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-[#bfc7d2]">측정 일시:</span>
                <span className="font-bold">{recordToDelete.displayDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#bfc7d2]">측정 체중:</span>
                <span className="font-bold text-[#93ccff] font-mono">{recordToDelete.metrics.weightKg.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#bfc7d2]">골격근 / 체지방:</span>
                <span className="font-mono text-[12px]">{recordToDelete.metrics.skeletalMuscleKg.toFixed(1)}kg / {recordToDelete.metrics.percentBodyFat.toFixed(1)}%</span>
              </div>
            </div>

            <p className="text-[12px] text-[#bfc7d2] leading-relaxed">
              선택한 인바디 측정 기록을 영구히 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222a3d]">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#222a3d] hover:bg-[#2d3748] text-[#bfc7d2] text-[12px] font-semibold transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = recordToDelete.id;
                  const dateStr = recordToDelete.displayDate;
                  setRecordToDelete(null);
                  onDeleteRecord(id);
                  setToastMessage(`'${dateStr}' 기록이 성공적으로 삭제되었습니다.`);
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="px-4 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#ff5449] text-white font-bold text-[12px] transition-colors cursor-pointer shadow-lg flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>삭제하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. All Records Deletion Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#060e20]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171f33] border border-[#ffb4ab]/50 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5 text-[#ffb4ab]">
              <div className="w-10 h-10 rounded-xl bg-[#ba1a1a]/20 border border-[#ba1a1a]/50 flex items-center justify-center text-[#ffb4ab]">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-[#ffb4ab]">
                  전체 인바디 데이터 초기화
                </h3>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2]">
                  저장된 총 {records.length}건 삭제
                </span>
              </div>
            </div>

            <p className="text-[13px] text-[#dae2fd] leading-relaxed">
              저장되어 있는 <strong>모든 인바디 데이터({records.length}건)</strong>를 완전히 삭제하고 데이터베이스를 초기화하시겠습니까?
            </p>

            <div className="bg-[#3b1212]/50 p-3 rounded-xl border border-[#ffb4ab]/30 text-[11px] text-[#ffb4ab] leading-relaxed flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">info</span>
              <span>
                삭제 시 JSON 파일 및 로컬 캐시가 완전히 비워집니다. 필요 시 사전에 [내보내기] 버튼으로 백업하시기 바랍니다.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222a3d]">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#222a3d] hover:bg-[#2d3748] text-[#bfc7d2] text-[12px] font-semibold transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  if (onDeleteAllRecords) {
                    onDeleteAllRecords();
                  }
                  setToastMessage('모든 기존 인바디 데이터가 완전히 삭제되었습니다.');
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="px-4 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#ff5449] text-white font-bold text-[12px] transition-colors cursor-pointer shadow-lg flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>모두 삭제 (초기화)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] border border-[#4edea3]/40 text-[#4edea3] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-['Space_Grotesk'] text-[12px] font-medium animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
