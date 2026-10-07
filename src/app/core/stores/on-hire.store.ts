import { Injectable, signal, effect } from '@angular/core';

export interface OnHireFinding {
  id: string;
  vesselName?: string;
  takeoverDate?: string;
  vesselType?: string;
  typeOfInspection?: string;
  dateOfInspection?: string;
  findings: string;
  description?: string;
  dept?: string;
  category?: string;
  riskRating: 'High' | 'Medium' | 'Low';
  rating?: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Closed';
  targetDate?: string;
  dueDate?: string;
  completionDate?: string;
  closureDate?: string;
  correctiveAction?: string;
}

export interface OnHireRecord {
  id: string;
  vesselName: string;
  takeoverDate: string;
  vesselType: string;
  categoryOfInspection: string;
  dateOfInspection: string;
  findingsHigh: number;
  findingsMedium: number;
  findingsLow: number;
  findingsTotal: number;
  closedHigh: number;
  closedMedium: number;
  closedLow: number;
  closedTotal: number;
  status: 'Open' | 'Closed';
  inspectors: string;
  findings?: any[];
}

export type OnHireInspection = OnHireRecord;

const STORAGE_KEY = 'hseq-onhire-v4';

const INITIAL_DEMO_DATA: OnHireRecord[] = [
  {
    id: 'OHI-001',
    vesselName: 'MV Pacific Voyager',
    takeoverDate: '16-Jun-26',
    vesselType: 'Container Vessel',
    categoryOfInspection: 'On-Hire',
    dateOfInspection: '12-Mar-26',
    findingsHigh: 1,
    findingsMedium: 4,
    findingsLow: 3,
    findingsTotal: 8,
    closedHigh: 1,
    closedMedium: 3,
    closedLow: 3,
    closedTotal: 7,
    status: 'Open',
    inspectors: 'Capt. R. Sterling / HSEQ Team',
    findings: [
      {
        id: 'FND-101',
        vesselName: 'MV Pacific Voyager',
        takeoverDate: '16-Jun-26',
        vesselType: 'Container Vessel',
        typeOfInspection: 'On-Hire Audit',
        dateOfInspection: '12-Mar-26',
        findings: 'Engine room fire damper operational lever stiff to actuate.',
        category: 'Fire Safety',
        riskRating: 'High',
        status: 'Closed',
        targetDate: '18-Mar-26',
        completionDate: '16-Mar-26'
      },
      {
        id: 'FND-102',
        vesselName: 'MV Pacific Voyager',
        takeoverDate: '16-Jun-26',
        vesselType: 'Container Vessel',
        typeOfInspection: 'On-Hire Audit',
        dateOfInspection: '12-Mar-26',
        findings: 'Emergency lighting battery backup in mess room below 90-min runtime standard.',
        category: 'Electrical',
        riskRating: 'Medium',
        status: 'Open',
        targetDate: '25-Apr-26'
      }
    ]
  },
  {
    id: 'OHI-002',
    vesselName: 'AHTS Ocean Guardian',
    takeoverDate: '01-Jul-25',
    vesselType: 'AHTS Vessel',
    categoryOfInspection: 'On-Hire',
    dateOfInspection: '04-Nov-25',
    findingsHigh: 0,
    findingsMedium: 3,
    findingsLow: 5,
    findingsTotal: 8,
    closedHigh: 0,
    closedMedium: 3,
    closedLow: 5,
    closedTotal: 8,
    status: 'Closed',
    inspectors: 'Port Capt. Andriy / Marine Surveyor',
    findings: [
      {
        id: 'FND-103',
        vesselName: 'AHTS Ocean Guardian',
        takeoverDate: '01-Jul-25',
        vesselType: 'AHTS Vessel',
        typeOfInspection: 'On-Hire Acceptance',
        dateOfInspection: '04-Nov-25',
        findings: 'Bridge magnetic compass light dimmer switch flickering.',
        category: 'Navigation',
        riskRating: 'Low',
        status: 'Closed',
        targetDate: '10-Nov-25',
        completionDate: '08-Nov-25'
      }
    ]
  },
  {
    id: 'OHI-003',
    vesselName: 'MT Nordic Titan',
    takeoverDate: '11-Sep-25',
    vesselType: 'Crude Oil Tanker',
    categoryOfInspection: 'On-Hire',
    dateOfInspection: '17-Oct-25',
    findingsHigh: 2,
    findingsMedium: 6,
    findingsLow: 4,
    findingsTotal: 12,
    closedHigh: 2,
    closedMedium: 6,
    closedLow: 4,
    closedTotal: 12,
    status: 'Closed',
    inspectors: 'Lead Surveyor P. Thorne',
    findings: [
      {
        id: 'FND-104',
        vesselName: 'MT Nordic Titan',
        takeoverDate: '11-Sep-25',
        vesselType: 'Crude Oil Tanker',
        typeOfInspection: 'On-Hire Condition',
        dateOfInspection: '17-Oct-25',
        findings: 'High-pressure hydraulic manifold pressure relief calibration overdue.',
        category: 'Machinery',
        riskRating: 'High',
        status: 'Closed',
        targetDate: '24-Oct-25',
        completionDate: '22-Oct-25'
      }
    ]
  },
  {
    id: 'OHI-004',
    vesselName: 'PSV Crest Horizon',
    takeoverDate: '05-May-26',
    vesselType: 'Platform Supply Vessel',
    categoryOfInspection: 'On-Hire',
    dateOfInspection: '19-Jan-26',
    findingsHigh: 0,
    findingsMedium: 2,
    findingsLow: 3,
    findingsTotal: 5,
    closedHigh: 0,
    closedMedium: 1,
    closedLow: 3,
    closedTotal: 4,
    status: 'Open',
    inspectors: 'HSEQ Superintendent D. Vance',
    findings: [
      {
        id: 'FND-105',
        vesselName: 'PSV Crest Horizon',
        takeoverDate: '05-May-26',
        vesselType: 'Platform Supply Vessel',
        typeOfInspection: 'Vessel Takeover Audit',
        dateOfInspection: '19-Jan-26',
        findings: 'Aft deck scupper non-return flap valves require replacement rubber gaskets.',
        category: 'Hull & Deck',
        riskRating: 'Medium',
        status: 'Open',
        targetDate: '10-May-26'
      }
    ]
  },
  {
    id: 'OHI-005',
    vesselName: 'AHTS Gulf Sentinel',
    takeoverDate: '15-Aug-25',
    vesselType: 'Offshore Support Vessel',
    categoryOfInspection: 'On-Hire',
    dateOfInspection: '28-Sep-25',
    findingsHigh: 1,
    findingsMedium: 3,
    findingsLow: 2,
    findingsTotal: 6,
    closedHigh: 1,
    closedMedium: 3,
    closedLow: 2,
    closedTotal: 6,
    status: 'Closed',
    inspectors: 'QA/QC Marine Assessor',
    findings: []
  }
];

@Injectable({
  providedIn: 'root'
})
export class OnHireStore {
  readonly records = signal<OnHireRecord[]>(this.loadInitial());

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records()));
      } catch (err) {
        console.error('Error persisting On-Hire records:', err);
      }
    });
  }

  private loadInitial(): OnHireRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored on-hire data, using defaults', e);
    }
    return INITIAL_DEMO_DATA;
  }

  getAll(): OnHireRecord[] {
    return this.records();
  }

  getById(id: string): OnHireRecord | undefined {
    return this.records().find(r => r.id === id);
  }

  static calculateFindingsSummary(findings: OnHireFinding[]) {
    const list = findings || [];
    const getRating = (f: any): string => (f.riskRating || f.rating || 'Low').toString().trim().toLowerCase();
    const isClosed = (f: any): boolean => (f.status || '').toLowerCase() === 'closed';

    const findingsHigh = list.filter(f => getRating(f) === 'high').length;
    const findingsMedium = list.filter(f => getRating(f) === 'medium' || getRating(f) === 'med').length;
    const findingsLow = list.filter(f => getRating(f) === 'low').length;
    const findingsTotal = list.length;

    const closedHigh = list.filter(f => getRating(f) === 'high' && isClosed(f)).length;
    const closedMedium = list.filter(f => (getRating(f) === 'medium' || getRating(f) === 'med') && isClosed(f)).length;
    const closedLow = list.filter(f => getRating(f) === 'low' && isClosed(f)).length;
    const closedTotal = list.filter(f => isClosed(f)).length;

    return {
      findingsHigh,
      findingsMedium,
      findingsLow,
      findingsTotal,
      closedHigh,
      closedMedium,
      closedLow,
      closedTotal
    };
  }

  create(data: Partial<OnHireRecord>): OnHireRecord {
    const id = `OHI-${Date.now().toString().slice(-4)}`;
    const findings = (data.findings || []).map((f: any, idx: number) => ({
      ...f,
      id: f.id || `${id}-F${String(idx + 1).padStart(2, '0')}`,
      description: f.description || f.findings || '',
      findings: f.findings || f.description || '',
      riskRating: f.riskRating || f.rating || 'Medium',
      rating: f.rating || f.riskRating || 'Medium',
      status: f.status || 'Open'
    }));

    const counts = OnHireStore.calculateFindingsSummary(findings);

    const newRecord: OnHireRecord = {
      id,
      vesselName: data.vesselName || 'MV Pacific Voyager',
      takeoverDate: data.takeoverDate || new Date().toISOString().substring(0, 10),
      vesselType: data.vesselType || 'Crew Boat',
      categoryOfInspection: data.categoryOfInspection || 'On-Hire',
      dateOfInspection: data.dateOfInspection || new Date().toISOString().substring(0, 10),
      findingsHigh: findings.length > 0 ? counts.findingsHigh : Number(data.findingsHigh || 0),
      findingsMedium: findings.length > 0 ? counts.findingsMedium : Number(data.findingsMedium || 0),
      findingsLow: findings.length > 0 ? counts.findingsLow : Number(data.findingsLow || 0),
      findingsTotal: findings.length > 0 ? counts.findingsTotal : Number(data.findingsTotal || 0),
      closedHigh: findings.length > 0 ? counts.closedHigh : Number(data.closedHigh || 0),
      closedMedium: findings.length > 0 ? counts.closedMedium : Number(data.closedMedium || 0),
      closedLow: findings.length > 0 ? counts.closedLow : Number(data.closedLow || 0),
      closedTotal: findings.length > 0 ? counts.closedTotal : Number(data.closedTotal || 0),
      status: (data.status as 'Open' | 'Closed') || (findings.length > 0 && counts.closedTotal === counts.findingsTotal ? 'Closed' : 'Open'),
      inspectors: data.inspectors || 'HSEQ Team',
      findings
    };

    this.records.update(list => [newRecord, ...list]);
    return newRecord;
  }

  update(id: string, updates: Partial<OnHireRecord>): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id) {
          const findings = updates.findings !== undefined ? updates.findings : (item.findings || []);
          const counts = findings.length > 0 
            ? OnHireStore.calculateFindingsSummary(findings)
            : {
                findingsHigh: updates.findingsHigh !== undefined ? Number(updates.findingsHigh) : item.findingsHigh,
                findingsMedium: updates.findingsMedium !== undefined ? Number(updates.findingsMedium) : item.findingsMedium,
                findingsLow: updates.findingsLow !== undefined ? Number(updates.findingsLow) : item.findingsLow,
                findingsTotal: updates.findingsTotal !== undefined ? Number(updates.findingsTotal) : item.findingsTotal,
                closedHigh: updates.closedHigh !== undefined ? Number(updates.closedHigh) : item.closedHigh,
                closedMedium: updates.closedMedium !== undefined ? Number(updates.closedMedium) : item.closedMedium,
                closedLow: updates.closedLow !== undefined ? Number(updates.closedLow) : item.closedLow,
                closedTotal: updates.closedTotal !== undefined ? Number(updates.closedTotal) : item.closedTotal,
              };

          return {
            ...item,
            ...updates,
            findings,
            ...counts
          };
        }
        return item;
      })
    );
  }

  delete(id: string): void {
    this.records.update(list => list.filter(item => item.id !== id));
  }

  addFinding(inspectionId: string, findingData: Partial<OnHireFinding>): OnHireFinding {
    let createdFinding!: OnHireFinding;

    this.records.update(list =>
      list.map(item => {
        if (item.id === inspectionId) {
          const existingFindings = item.findings || [];
          const findingId = `${inspectionId}-F${String(existingFindings.length + 1).padStart(2, '0')}`;
          const desc = findingData.description || findingData.findings || '';
          const ratingVal = (findingData.riskRating || findingData.rating || 'Medium') as 'High' | 'Medium' | 'Low';
          const statusVal = (findingData.status || 'Open') as 'Open' | 'Closed';
          const dueDateVal = findingData.targetDate || findingData.dueDate || '';
          const closureDateVal = statusVal === 'Closed' ? (findingData.completionDate || findingData.closureDate || new Date().toISOString().substring(0, 10)) : '';

          createdFinding = {
            id: findingId,
            vesselName: item.vesselName,
            takeoverDate: item.takeoverDate,
            vesselType: item.vesselType,
            typeOfInspection: item.categoryOfInspection || 'On-Hire',
            dateOfInspection: item.dateOfInspection,
            findings: desc,
            description: desc,
            dept: findingData.dept || 'deck',
            category: findingData.category || 'Hull & Deck',
            riskRating: ratingVal,
            rating: ratingVal,
            status: statusVal,
            targetDate: dueDateVal,
            dueDate: dueDateVal,
            completionDate: closureDateVal,
            closureDate: closureDateVal,
            correctiveAction: findingData.correctiveAction || ''
          };

          const newFindings = [...existingFindings, createdFinding];
          const counts = OnHireStore.calculateFindingsSummary(newFindings);
          const autoStatus = counts.findingsTotal > 0 && counts.closedTotal === counts.findingsTotal ? 'Closed' : 'Open';

          return {
            ...item,
            findings: newFindings,
            status: autoStatus,
            ...counts
          };
        }
        return item;
      })
    );

    return createdFinding;
  }

  updateFinding(inspectionId: string, findingId: string, updates: Partial<OnHireFinding>): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === inspectionId && item.findings) {
          const updatedFindings = item.findings.map(f => {
            if (f.id === findingId) {
              const desc = updates.description !== undefined ? updates.description : (updates.findings !== undefined ? updates.findings : f.description || f.findings);
              const ratingVal = (updates.riskRating || updates.rating || f.riskRating || f.rating || 'Medium') as 'High' | 'Medium' | 'Low';
              const statusVal = (updates.status || f.status || 'Open') as 'Open' | 'Closed';
              const dueDateVal = updates.targetDate !== undefined ? updates.targetDate : (updates.dueDate !== undefined ? updates.dueDate : f.targetDate || f.dueDate);
              const closureDateVal = statusVal === 'Closed'
                ? (updates.completionDate || updates.closureDate || f.completionDate || f.closureDate || new Date().toISOString().substring(0, 10))
                : '';

              return {
                ...f,
                ...updates,
                description: desc,
                findings: desc,
                riskRating: ratingVal,
                rating: ratingVal,
                status: statusVal,
                targetDate: dueDateVal,
                dueDate: dueDateVal,
                completionDate: closureDateVal,
                closureDate: closureDateVal
              };
            }
            return f;
          });

          const counts = OnHireStore.calculateFindingsSummary(updatedFindings);
          const autoStatus = counts.findingsTotal > 0 && counts.closedTotal === counts.findingsTotal ? 'Closed' : 'Open';

          return {
            ...item,
            findings: updatedFindings,
            status: autoStatus,
            ...counts
          };
        }
        return item;
      })
    );
  }

  deleteFinding(inspectionId: string, findingId: string): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === inspectionId && item.findings) {
          const updatedFindings = item.findings.filter(f => f.id !== findingId);
          const counts = OnHireStore.calculateFindingsSummary(updatedFindings);
          const autoStatus = counts.findingsTotal > 0 && counts.closedTotal === counts.findingsTotal ? 'Closed' : item.status;

          return {
            ...item,
            findings: updatedFindings,
            status: autoStatus,
            ...counts
          };
        }
        return item;
      })
    );
  }

  resetToDefaults(): void {
    this.records.set(INITIAL_DEMO_DATA);
  }
}
