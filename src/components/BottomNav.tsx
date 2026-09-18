import React from 'react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'ocr-verification', label: 'OCR 추출', icon: 'document_scanner' },
    { id: 'records-management', label: '기록 관리', icon: 'calendar_month' },
    { id: 'analytics-trends', label: '통계·차트', icon: 'monitoring' },
    { id: 'ai-report', label: 'AI 리포트', icon: 'neurology' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#0b1326]/95 backdrop-blur-xl border-t border-[#222a3d]/70 shadow-[0_-2px_16px_rgba(0,0,0,0.5)]">
      <div className="h-16 px-2 flex items-center justify-around max-w-xl mx-auto sm:max-w-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center w-20 h-12 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#93ccff] bg-[#222a3d] shadow-[0_0_12px_rgba(147,204,255,0.18)] font-bold'
                  : 'text-[#bfc7d2]/70 hover:text-[#dae2fd] hover:bg-[#171f33]/60'
              }`}
            >
              <span className="material-symbols-outlined text-[21px] leading-none mb-0.5">
                {tab.icon}
              </span>
              <span className="font-['Manrope'] text-[11px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
