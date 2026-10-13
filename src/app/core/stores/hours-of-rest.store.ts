import { Injectable, signal, computed, effect } from '@angular/core';
import { 
  VesselCrewMember, 
  HoRPeriodEntry, 
  DailyCrewRestRecord, 
  HoRActivityType 
} from '../models/hseq.models';

const STORAGE_KEY = 'hseq-daily-hor-records-v2';

/**
 * Calculates duration in decimal hours between two "HH:mm" strings within a 24h day.
 * Example: "06:00" to "12:00" -> 6.0 hours.
 * Supports "24:00" for midnight end.
 */
export function calculatePeriodDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  const parseMinutes = (t: string): number => {
    if (t === '24:00') return 24 * 60;
    const [h, m] = t.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  };

  const startMin = parseMinutes(startTime);
  let endMin = parseMinutes(endTime);

  if (endMin < startMin) {
    endMin += 24 * 60; // Overnight wrap
  }

  return Math.round(((endMin - startMin) / 60) * 10) / 10;
}

/**
 * Calculates total work hours, total rest hours, and simple STCW compliance for entered periods
 */
export function evaluateDailyCompliance(periods: HoRPeriodEntry[]): {
  totalWorkHours: number;
  totalRestHours: number;
  complianceStatus: 'Compliant' | 'Non-Compliant';
  violationMessage?: string;
} {
  let workHrs = 0;
  let restHrs = 0;

  for (const p of periods) {
    const dur = calculatePeriodDuration(p.startTime, p.endTime);
    if (p.activityType === 'Work') {
      workHrs += dur;
    } else {
      restHrs += dur;
    }
  }

  workHrs = Math.round(workHrs * 10) / 10;
  restHrs = Math.round(restHrs * 10) / 10;

  // If only work was logged and no explicit rest periods entered yet,
  // rest defaults to the remaining hours of the 24-hour cycle.
  if (restHrs === 0 && workHrs > 0 && workHrs <= 24) {
    restHrs = Math.round((24 - workHrs) * 10) / 10;
  }

  // STCW prototype rule: Minimum 10 hours of rest in 24-hour period (and maximum 14 hours of work)
  const isCompliant = restHrs >= 10.0 && workHrs <= 14.0;
  let violationMessage: string | undefined;

  if (!isCompliant) {
    if (restHrs < 10.0) {
      violationMessage = `Rest hours shortfall: ${restHrs} hrs logged (Minimum required: 10.0 hrs in 24h).`;
    } else if (workHrs > 14.0) {
      violationMessage = `Maximum work hours exceeded: ${workHrs} hrs logged (Maximum permitted: 14.0 hrs in 24h).`;
    }
  }

  return {
    totalWorkHours: workHrs,
    totalRestHours: restHrs,
    complianceStatus: isCompliant ? 'Compliant' : 'Non-Compliant',
    violationMessage
  };
}

@Injectable({
  providedIn: 'root'
})
export class HoursOfRestStore {
  // Master Filter Signals
  readonly selectedVessel = signal<string>('MV Pacific Voyager');
  readonly selectedDate = signal<string>('2026-10-05'); // Default: 05-Oct-2026 per requirement
  readonly selectedDepartment = signal<string>('ALL');
  readonly searchQuery = signal<string>('');

  // Daily records repository: key = `${crewId}_${date}`
  readonly dailyRecords = signal<DailyCrewRestRecord[]>([]);

  constructor() {
    this.initStore();

    // Auto-save to localStorage
    effect(() => {
      const records = this.dailyRecords();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch (err) {
        console.warn('Failed to save HoR records to localStorage:', err);
      }
    });
  }

  private initStore() {
    let saved: DailyCrewRestRecord[] | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {
      saved = null;
    }

    if (saved && Array.isArray(saved) && saved.length > 0) {
      this.dailyRecords.set(saved);
    } else {
      // Seed realistic initial prototype records for date 2026-10-05
      const initial: DailyCrewRestRecord[] = [
        {
          id: 'HOR-CRW-PV-01-2026-10-05',
          crewId: 'CRW-PV-01',
          crewName: 'Capt. Robert Sterling',
          rank: 'Master',
          department: 'Deck Department',
          vesselId: 'VES-01',
          vesselName: 'MV Pacific Voyager',
          date: '2026-10-05',
          periods: [
            { id: 'p1', startTime: '08:00', endTime: '12:00', activityType: 'Work', durationHours: 4.0 },
            { id: 'p2', startTime: '12:00', endTime: '14:00', activityType: 'Rest', durationHours: 2.0 },
            { id: 'p3', startTime: '14:00', endTime: '18:00', activityType: 'Work', durationHours: 4.0 },
            { id: 'p4', startTime: '18:00', endTime: '24:00', activityType: 'Rest', durationHours: 6.0 },
            { id: 'p5', startTime: '00:00', endTime: '08:00', activityType: 'Rest', durationHours: 8.0 }
          ],
          totalWorkHours: 8.0,
          totalRestHours: 16.0,
          complianceStatus: 'Compliant',
          recordStatus: 'Entered',
          lastUpdated: '2026-10-05 18:30',
          remarks: 'Standard navigation oversight and master duty.'
        },
        {
          id: 'HOR-CRW-PV-02-2026-10-05',
          crewId: 'CRW-PV-02',
          crewName: 'Chief Officer K. Hansen',
          rank: 'Chief Officer',
          department: 'Deck Department',
          vesselId: 'VES-01',
          vesselName: 'MV Pacific Voyager',
          date: '2026-10-05',
          periods: [
            { id: 'p1', startTime: '06:00', endTime: '12:00', activityType: 'Work', durationHours: 6.0 },
            { id: 'p2', startTime: '12:00', endTime: '14:00', activityType: 'Rest', durationHours: 2.0 },
            { id: 'p3', startTime: '14:00', endTime: '18:00', activityType: 'Work', durationHours: 4.0 },
            { id: 'p4', startTime: '18:00', endTime: '24:00', activityType: 'Rest', durationHours: 6.0 }
          ],
          totalWorkHours: 10.0,
          totalRestHours: 14.0,
          complianceStatus: 'Compliant',
          recordStatus: 'Entered',
          lastUpdated: '2026-10-05 18:45',
          remarks: 'Morning watch and afternoon cargo deck supervision.'
        },
        {
          id: 'HOR-CRW-PV-03-2026-10-05',
          crewId: 'CRW-PV-03',
          crewName: 'Chief Engineer M. Rossi',
          rank: 'Chief Engineer',
          department: 'Engine Department',
          vesselId: 'VES-01',
          vesselName: 'MV Pacific Voyager',
          date: '2026-10-05',
          periods: [
            { id: 'p1', startTime: '08:00', endTime: '12:00', activityType: 'Work', durationHours: 4.0 },
            { id: 'p2', startTime: '12:00', endTime: '13:00', activityType: 'Rest', durationHours: 1.0 },
            { id: 'p3', startTime: '13:00', endTime: '17:00', activityType: 'Work', durationHours: 4.0 },
            { id: 'p4', startTime: '17:00', endTime: '24:00', activityType: 'Rest', durationHours: 7.0 },
            { id: 'p5', startTime: '00:00', endTime: '08:00', activityType: 'Rest', durationHours: 8.0 }
          ],
          totalWorkHours: 8.0,
          totalRestHours: 16.0,
          complianceStatus: 'Compliant',
          recordStatus: 'Entered',
          lastUpdated: '2026-10-05 17:15',
          remarks: 'Machinery space inspection and daily maintenance.'
        },
        {
          id: 'HOR-CRW-PV-06-2026-10-05',
          crewId: 'CRW-PV-06',
          crewName: 'Bosun D. Silva',
          rank: 'Bosun',
          department: 'Deck Department',
          vesselId: 'VES-01',
          vesselName: 'MV Pacific Voyager',
          date: '2026-10-05',
          periods: [
            { id: 'p1', startTime: '06:00', endTime: '13:00', activityType: 'Work', durationHours: 7.0 },
            { id: 'p2', startTime: '13:00', endTime: '14:00', activityType: 'Rest', durationHours: 1.0 },
            { id: 'p3', startTime: '14:00', endTime: '22:30', activityType: 'Work', durationHours: 8.5 },
            { id: 'p4', startTime: '22:30', endTime: '24:00', activityType: 'Rest', durationHours: 1.5 }
          ],
          totalWorkHours: 15.5,
          totalRestHours: 8.5,
          complianceStatus: 'Non-Compliant',
          recordStatus: 'Entered',
          lastUpdated: '2026-10-05 23:00',
          remarks: 'Adverse weather deck lashing securing & emergency mooring overtime.'
        },
        {
          id: 'HOR-CRW-PV-07-2026-10-05',
          crewId: 'CRW-PV-07',
          crewName: 'AB Seaman S. Gomez',
          rank: 'Able Seaman (AB)',
          department: 'Deck Department',
          vesselId: 'VES-01',
          vesselName: 'MV Pacific Voyager',
          date: '2026-10-05',
          periods: [
            { id: 'p1', startTime: '00:00', endTime: '04:00', activityType: 'Work', durationHours: 4.0 },
            { id: 'p2', startTime: '04:00', endTime: '12:00', activityType: 'Rest', durationHours: 8.0 },
            { id: 'p3', startTime: '12:00', endTime: '16:00', activityType: 'Work', durationHours: 4.0 },
            { id: 'p4', startTime: '16:00', endTime: '24:00', activityType: 'Rest', durationHours: 8.0 }
          ],
          totalWorkHours: 8.0,
          totalRestHours: 16.0,
          complianceStatus: 'Compliant',
          recordStatus: 'Entered',
          lastUpdated: '2026-10-05 16:30',
          remarks: 'Standard 4-on / 8-off sea watch schedule.'
        },
        {
          id: 'HOR-CRW-PV-09-2026-10-05',
          crewId: 'CRW-PV-09',
          crewName: 'Electrician L. Chen',
          rank: 'Electrician',
          department: 'Engine Department',
          vesselId: 'VES-01',
          vesselName: 'MV Pacific Voyager',
          date: '2026-10-05',
          periods: [
            { id: 'p1', startTime: '08:00', endTime: '12:00', activityType: 'Work', durationHours: 4.0 },
            { id: 'p2', startTime: '12:00', endTime: '13:00', activityType: 'Rest', durationHours: 1.0 },
            { id: 'p3', startTime: '13:00', endTime: '17:00', activityType: 'Work', durationHours: 4.0 },
            { id: 'p4', startTime: '17:00', endTime: '24:00', activityType: 'Rest', durationHours: 7.0 }
          ],
          totalWorkHours: 8.0,
          totalRestHours: 16.0,
          complianceStatus: 'Compliant',
          recordStatus: 'Entered',
          lastUpdated: '2026-10-05 17:00',
          remarks: 'Main switchboard insulation checks.'
        },
        {
          id: 'HOR-CRW-PV-10-2026-10-05',
          crewId: 'CRW-PV-10',
          crewName: 'Fitter A. Morales',
          rank: 'Fitter',
          department: 'Engine Department',
          vesselId: 'VES-01',
          vesselName: 'MV Pacific Voyager',
          date: '2026-10-05',
          periods: [
            { id: 'p1', startTime: '06:00', endTime: '12:00', activityType: 'Work', durationHours: 6.0 },
            { id: 'p2', startTime: '12:00', endTime: '13:00', activityType: 'Rest', durationHours: 1.0 },
            { id: 'p3', startTime: '13:00', endTime: '21:30', activityType: 'Work', durationHours: 8.5 },
            { id: 'p4', startTime: '21:30', endTime: '24:00', activityType: 'Rest', durationHours: 2.5 }
          ],
          totalWorkHours: 14.5,
          totalRestHours: 9.5,
          complianceStatus: 'Non-Compliant',
          recordStatus: 'Entered',
          lastUpdated: '2026-10-05 22:00',
          remarks: 'Urgent auxiliary generator cooling pump repair.'
        }
      ];

      this.dailyRecords.set(initial);
    }
  }

  // ==========================================================
  // QUERY & ACCESS METHODS
  // ==========================================================

  getRecord(crewId: string, date: string): DailyCrewRestRecord | undefined {
    return this.dailyRecords().find(r => r.crewId === crewId && r.date === date);
  }

  saveRecord(record: DailyCrewRestRecord): void {
    const evalRes = evaluateDailyCompliance(record.periods);
    const updated: DailyCrewRestRecord = {
      ...record,
      totalWorkHours: evalRes.totalWorkHours,
      totalRestHours: evalRes.totalRestHours,
      complianceStatus: evalRes.complianceStatus,
      recordStatus: 'Entered',
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    this.dailyRecords.update(list => {
      const idx = list.findIndex(r => r.crewId === record.crewId && r.date === record.date);
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = updated;
        return copy;
      } else {
        return [updated, ...list];
      }
    });
  }

  deleteRecord(crewId: string, date: string): void {
    this.dailyRecords.update(list => list.filter(r => !(r.crewId === crewId && r.date === date)));
  }

  // Number of open violations across the fleet (for badges)
  readonly fleetViolationCount = computed(() => {
    return this.dailyRecords().filter(r => r.complianceStatus === 'Non-Compliant').length;
  });
}
