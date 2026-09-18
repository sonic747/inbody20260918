import { useState, useEffect, useMemo } from 'react';
import { ActiveTab, InBodyRecord, HistoricalDataPoint } from './types';
import { INITIAL_RECORD, INITIAL_RECORDS_LIST } from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AnalyticsTrendsView } from './components/AnalyticsTrendsView';
import { OcrVerificationView } from './components/OcrVerificationView';
import { RecordsManagementView } from './components/RecordsManagementView';
import { AiReportView } from './components/AiReportView';

const STORAGE_KEY = 'inbody_user_records_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ocr-verification');
  const [records, setRecords] = useState<InBodyRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    return [];
  });

  const [activeRecordId, setActiveRecordId] = useState<string>('');

  // Sync records from server on mount
  useEffect(() => {
    fetch('/api/records')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.records)) {
          setRecords(data.records);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.records));
          if (data.records.length > 0) {
            setActiveRecordId((prev) => {
              if (data.records.some((r: InBodyRecord) => r.id === prev)) return prev;
              return data.records[data.records.length - 1].id;
            });
          } else {
            setActiveRecordId('');
          }
        }
      })
      .catch((err) => console.warn('Could not fetch server records, using local cache:', err));
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [records]);

  // Helper to parse measurement date for chronological sorting
  const getRecordTimestamp = (r: InBodyRecord): number => {
    if (r.displayDate) {
      // Handles formats like "2024.08.26 20:47", "2024. 8. 20 20:47:33", "2026.09.01"
      const cleaned = r.displayDate.replace(/\./g, '-').replace(/\s+/g, ' ').trim();
      const parsed = Date.parse(cleaned);
      if (!isNaN(parsed)) return parsed;
    }
    const t = Date.parse(r.timestamp);
    return isNaN(t) ? 0 : t;
  };

  // Chronologically sorted records (oldest -> newest for time series charts)
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => getRecordTimestamp(a) - getRecordTimestamp(b));
  }, [records]);

  // Active record
  const currentRecord = useMemo(() => {
    return records.find((r) => r.id === activeRecordId) || sortedRecords[sortedRecords.length - 1] || INITIAL_RECORD;
  }, [records, activeRecordId, sortedRecords]);

  // Derived historical data points for the Analytics Trends Chart
  const history: HistoricalDataPoint[] = useMemo(() => {
    return sortedRecords.map((r) => {
      let dateLabel = r.dateShort;
      if (!dateLabel && r.displayDate) {
        const parts = r.displayDate.split(' ')[0].split('.');
        if (parts.length >= 3) {
          dateLabel = `${parts[1].padStart(2, '0')}.${parts[2].padStart(2, '0')}`;
        }
      }
      return {
        date: dateLabel || '기록',
        timestamp: r.timestamp,
        weight: r.metrics.weightKg,
        pbf: r.metrics.percentBodyFat,
        smm: r.metrics.skeletalMuscleKg,
        bfm: r.metrics.bodyFatKg,
        recordId: r.id,
      };
    });
  }, [sortedRecords]);

  // Handler: Save new record from OCR Verification
  const handleSaveRecord = (newRecord: InBodyRecord) => {
    setRecords((prev) => {
      const existsIndex = prev.findIndex((r) => r.id === newRecord.id);
      let updated: InBodyRecord[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = newRecord;
      } else {
        updated = [...prev, newRecord];
      }
      return updated.sort((a, b) => getRecordTimestamp(a) - getRecordTimestamp(b));
    });
    setActiveRecordId(newRecord.id);
  };

  // Handler: Delete single record
  const handleDeleteRecord = async (id: string) => {
    // 1. Immediate optimistic UI update
    setRecords((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      if (activeRecordId === id) {
        setActiveRecordId(remaining.length > 0 ? remaining[remaining.length - 1].id : '');
      }
      return remaining;
    });

    // 2. Delete on backend server
    try {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        setRecords(data.records);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.records));
      }
    } catch (e) {
      console.warn('Server delete failed, deleted locally:', e);
    }
  };

  // Handler: Delete all records (wipe database clean)
  const handleDeleteAllRecords = async () => {
    setRecords([]);
    setActiveRecordId('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    try {
      await fetch('/api/records', { method: 'DELETE' });
    } catch (e) {
      console.warn('Server delete all failed:', e);
    }
  };

  // Handler: Select record
  const handleSelectRecord = (rec: InBodyRecord) => {
    setActiveRecordId(rec.id);
  };

  // Handler: Batch import records
  const handleImportRecords = (imported: InBodyRecord[]) => {
    setRecords((prev) => {
      const map = new Map<string, InBodyRecord>();
      prev.forEach((r) => map.set(r.id, r));
      imported.forEach((r) => map.set(r.id, r));
      const merged = Array.from(map.values()).sort(
        (a, b) => getRecordTimestamp(a) - getRecordTimestamp(b)
      );
      return merged;
    });
    if (imported.length > 0) {
      setActiveRecordId(imported[imported.length - 1].id);
    }
  };

  return (
    <div className="bg-[#0b1326] font-['Manrope'] text-[#dae2fd] flex flex-col min-h-screen selection:bg-[#93ccff]/30 selection:text-[#93ccff]">
      {/* Top Fixed Header */}
      <Header
        recordCount={records.length}
        onNavigateTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-[#0b1326] min-h-screen">
        {activeTab === 'ocr-verification' && (
          <OcrVerificationView
            record={currentRecord}
            onSaveRecord={handleSaveRecord}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'records-management' && (
          <RecordsManagementView
            records={records}
            activeRecordId={activeRecordId}
            onSelectRecord={handleSelectRecord}
            onDeleteRecord={handleDeleteRecord}
            onDeleteAllRecords={handleDeleteAllRecords}
            onNavigateTab={setActiveTab}
            onImportRecords={handleImportRecords}
          />
        )}

        {activeTab === 'analytics-trends' && (
          <AnalyticsTrendsView
            record={currentRecord}
            records={sortedRecords}
            activeRecordId={activeRecordId}
            history={history}
            onSelectRecord={handleSelectRecord}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'ai-report' && (
          <AiReportView record={currentRecord} />
        )}
      </main>

      {/* Bottom Fixed Navigation Bar */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}
