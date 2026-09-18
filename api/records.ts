import fs from 'fs';
import path from 'path';

// On Vercel Serverless, only /tmp is writable
const TMP_DATA_FILE = path.join('/tmp', 'inbody_records.json');

function getRecords(): any[] {
  try {
    if (fs.existsSync(TMP_DATA_FILE)) {
      const content = fs.readFileSync(TMP_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Vercel read tmp records error:', e);
  }
  return [];
}

function saveRecords(records: any[]) {
  try {
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Vercel write tmp records error:', e);
  }
}

export default async function handler(req: any, res: any) {
  // CORS
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

  if (req.method === 'GET') {
    const records = getRecords();
    return res.status(200).json({ success: true, records });
  }

  if (req.method === 'POST') {
    try {
      const { record } = req.body || {};
      if (!record) {
        return res.status(400).json({ success: false, error: 'Record is required' });
      }
      const records = getRecords();
      const newRecord = {
        ...record,
        id: record.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: record.createdAt || new Date().toISOString(),
      };
      const existingIdx = records.findIndex((r) => r.id === newRecord.id);
      if (existingIdx >= 0) {
        records[existingIdx] = newRecord;
      } else {
        records.push(newRecord);
      }
      saveRecords(records);
      return res.status(200).json({ success: true, record: newRecord, records });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e?.message });
    }
  }

  if (req.method === 'DELETE') {
    saveRecords([]);
    return res.status(200).json({ success: true, records: [] });
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
