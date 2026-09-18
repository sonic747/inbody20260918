import React from 'react';
import { ActiveTab } from '../types';

interface HeaderProps {
  recordCount?: number;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  recordCount = 4,
  onNavigateTab,
}) => {
  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-[#0b1326]/90 backdrop-blur-xl border-b border-[#222a3d]/60 shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
      <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-xl mx-auto sm:max-w-2xl">
        <div
          onClick={() => onNavigateTab && onNavigateTab('records-management')}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1e293b] border border-[#3198dc]/40 flex items-center justify-center text-[#93ccff] shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-['Space_Grotesk'] text-[19px] font-bold text-[#dae2fd] tracking-tight shrink-0">
                인바디
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] font-semibold text-[#4edea3] uppercase shrink-0 bg-[#00a572]/20 px-1.5 py-0.5 rounded border border-[#00a572]/30">
                JSON DB
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] shrink-0 animate-pulse" />
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#bfc7d2] truncate max-w-[150px] sm:max-w-[240px]">
                {recordCount}건의 인바디 기록 저장됨
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('ocr-verification')}
            className="px-2.5 py-1.5 bg-[#4edea3]/20 hover:bg-[#4edea3]/30 text-[#4edea3] border border-[#4edea3]/40 rounded-lg font-['Space_Grotesk'] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">add_a_photo</span>
            <span className="hidden sm:inline">OCR 추출</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('records-management')}
            className="w-8 h-8 rounded-full bg-[#222a3d] hover:bg-[#3198dc]/30 text-[#93ccff] transition-colors flex items-center justify-center shrink-0 border border-[#222a3d] cursor-pointer"
            title="기록 관리"
          >
            <span className="material-symbols-outlined text-[18px]">folder</span>
          </button>
        </div>
      </div>
    </header>
  );
};
