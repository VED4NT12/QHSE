import { Injectable, signal, effect } from '@angular/core';

export interface CertificateRecord {
  id: string;
  code: string;
  description: string;
  category: 'Statutory' | 'Operational';
  frequency: string;
  vesselName: string;
  issueDate: string;
  window: string;
  expiryDate: string;
  remainingDays: number;
  status: 'Valid' | 'In Window' | 'Expiring Soon' | 'Expired';
  dateLastReceived: string;
  remarks?: string;
  issuingAuthority?: string;
  certificateType?: string;
  lastEndorsementDate?: string;
}

const STORAGE_KEY = 'hseq-certificates-v5';

const INITIAL_DEMO_DATA: CertificateRecord[] = [
  {
    id: 'CERT-001',
    code: 'A01',
    description: 'Cargo Ship Safety Construction Certificate',
    category: 'Statutory',
    frequency: '5',
    vesselName: 'MV Pacific Voyager',
    issueDate: '2022-04-10',
    window: '10-Jan-2027 to 10-Jul-2027',
    expiryDate: '2027-04-10',
    remainingDays: 375,
    status: 'Valid',
    dateLastReceived: '2022-04-15',
    issuingAuthority: 'American Bureau of Shipping (ABS)',
    certificateType: 'Full term',
    lastEndorsementDate: '2025-04-02'
  },
  {
    id: 'CERT-002',
    code: 'A02',
    description: 'Cargo Ship Safety Equipment Certificate',
    category: 'Statutory',
    frequency: '1',
    vesselName: 'MT Nordic Titan',
    issueDate: '2023-06-15',
    window: '15-Mar-2026 to 15-Sep-2026',
    expiryDate: '2026-06-15',
    remainingDays: 45,
    status: 'In Window',
    dateLastReceived: '2023-06-20',
    issuingAuthority: 'Bureau Veritas (BV)',
    certificateType: 'Full term',
    lastEndorsementDate: '2025-06-10'
  },
  {
    id: 'CERT-003',
    code: 'A03',
    description: 'Cargo Ship Safety Radio Certificate',
    category: 'Statutory',
    frequency: '1',
    vesselName: 'AHTS Ocean Guardian',
    issueDate: '2024-01-20',
    window: '20-Oct-2026 to 20-Apr-2027',
    expiryDate: '2027-01-20',
    remainingDays: 295,
    status: 'Valid',
    dateLastReceived: '2024-01-25',
    issuingAuthority: 'DNV Maritime',
    certificateType: 'Full term',
    lastEndorsementDate: '2025-01-18'
  },
  {
    id: 'CERT-004',
    code: 'A05',
    description: 'International Load Line Certificate',
    category: 'Statutory',
    frequency: '5',
    vesselName: 'PSV Crest Horizon',
    issueDate: '2021-11-05',
    window: '05-Aug-2026 to 05-Feb-2027',
    expiryDate: '2026-11-05',
    remainingDays: 22,
    status: 'Expiring Soon',
    dateLastReceived: '2021-11-12',
    issuingAuthority: 'Lloyds Register (LR)',
    certificateType: 'Full term',
    lastEndorsementDate: '2024-11-01'
  },
  {
    id: 'CERT-005',
    code: 'B01',
    description: 'Safe Manning Document (Minimum Safe Manning)',
    category: 'Operational',
    frequency: '10',
    vesselName: 'MV Atlantic Pioneer',
    issueDate: '2020-05-01',
    window: 'Permanent',
    expiryDate: '2030-05-01',
    remainingDays: 1480,
    status: 'Valid',
    dateLastReceived: '2020-05-05',
    issuingAuthority: 'Flag State Administration',
    certificateType: 'Permanent'
  },
  {
    id: 'CERT-006',
    code: 'B04',
    description: 'International Anti-Fouling System Certificate',
    category: 'Operational',
    frequency: '5',
    vesselName: 'AHTS Gulf Sentinel',
    issueDate: '2021-03-12',
    window: '12-Dec-2025 to 12-Jun-2026',
    expiryDate: '2026-03-12',
    remainingDays: 0,
    status: 'Expired',
    dateLastReceived: '2021-03-18',
    issuingAuthority: 'ABS',
    certificateType: 'Full term',
    lastEndorsementDate: '2024-03-10'
  },
  {
    id: 'CERT-007',
    code: 'A08',
    description: 'Document of Compliance (ISM Code)',
    category: 'Statutory',
    frequency: '1',
    vesselName: 'MV Pacific Voyager',
    issueDate: '2023-09-01',
    window: '01-Jun-2026 to 01-Dec-2026',
    expiryDate: '2026-09-01',
    remainingDays: 78,
    status: 'In Window',
    dateLastReceived: '2023-09-05',
    issuingAuthority: 'Flag State / Recognized Org',
    certificateType: 'Full term'
  }
];

@Injectable({
  providedIn: 'root'
})
export class CertificateStore {
  readonly records = signal<CertificateRecord[]>(this.loadInitial());

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records()));
      } catch (err) {
        console.error('Error persisting Certificate records:', err);
      }
    });
  }

  private loadInitial(): CertificateRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored certificates data, using defaults', e);
    }
    return INITIAL_DEMO_DATA;
  }

  getAll(): CertificateRecord[] {
    return this.records();
  }

  getById(id: string): CertificateRecord | undefined {
    return this.records().find(r => r.id === id || r.code === id);
  }

  create(data: Partial<CertificateRecord>): CertificateRecord {
    const id = `CERT-${Date.now().toString().slice(-4)}`;
    
    // Calculate remaining days if expiryDate is provided
    let remainingDays = 365;
    if (data.expiryDate) {
      const exp = new Date(data.expiryDate).getTime();
      const now = new Date().getTime();
      remainingDays = Math.max(0, Math.round((exp - now) / (1000 * 60 * 60 * 24)));
    }

    const newRecord: CertificateRecord = {
      id,
      code: data.code || 'A00',
      description: data.description || 'Maritime Certificate',
      category: data.category || 'Statutory',
      frequency: data.frequency || 'Annual',
      vesselName: data.vesselName || 'MV Pacific Voyager',
      issueDate: data.issueDate || new Date().toISOString().substring(0, 10),
      window: data.window || 'Active Window',
      expiryDate: data.expiryDate || '',
      remainingDays,
      status: (data.status as any) || (remainingDays > 60 ? 'Valid' : remainingDays > 0 ? 'Expiring Soon' : 'Expired'),
      dateLastReceived: data.dateLastReceived || new Date().toISOString().substring(0, 10),
      issuingAuthority: data.issuingAuthority || 'Recognized Organization',
      certificateType: data.certificateType || 'Full term',
      lastEndorsementDate: data.lastEndorsementDate || ''
    };

    this.records.update(list => [newRecord, ...list]);
    return newRecord;
  }

  update(id: string, updates: Partial<CertificateRecord>): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id || item.code === id) {
          return {
            ...item,
            ...updates
          };
        }
        return item;
      })
    );
  }

  delete(id: string): void {
    this.records.update(list => list.filter(item => item.id !== id && item.code !== id));
  }

  resetToDefaults(): void {
    this.records.set(INITIAL_DEMO_DATA);
  }
}
