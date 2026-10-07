import { Injectable, signal, effect } from '@angular/core';
import { NearMissRecord } from '../models/hseq.models';

const STORAGE_KEY = 'hseq-nearmiss-v4';

const INITIAL_DEMO_DATA: NearMissRecord[] = [
  {
    id: 'NM-2026-001',
    referenceNo: 'NM-2026-001',
    vesselName: 'MV Pacific Voyager',
    date: '26-Dec-25',
    nearMissDescription: 'Calorifier heating coils in auxiliary compartment indicated insulation drop during routine megger testing, preventing potential electrical cabinet short circuit.',
    correctiveAction: 'Calorifier isolated immediately; spare heating element installed and verified within safe megger thresholds.',
    location: 'Auxiliary Machinery Flat (Starboard)',
    closeOutDate: '09-Jan-26',
    status: 'Closed',
    reportedBy: 'Chief Engineer M. Rossi',
    recommendation: 'Incorporate bi-weekly megger testing in PMS schedule and maintain 2 spare coil sets in vessel store.',
    actionTakenByVessel: 'Procured manufacturer-certified replacement coils and performed comprehensive continuity assessment.',
    aramcoMomsSubmission: 'SUB-2026-0891'
  },
  {
    id: 'NM-2026-002',
    referenceNo: 'NM-2026-002',
    vesselName: 'MT Nordic Titan',
    date: '24-Jan-26',
    nearMissDescription: 'Defective quick-release safety clip observed on Emergency Escape Breathing Device (EEBD) harness during scheduled emergency drill.',
    correctiveAction: 'Defective unit replaced immediately from certified bonded safety locker; all remaining units inspected.',
    location: 'Forward Muster Station No. 1',
    closeOutDate: '26-Jan-26',
    status: 'Closed',
    reportedBy: 'Safety Officer T. Campbell',
    recommendation: 'Include harness clip tension and locking pin verification in weekly safety equipment checklist.',
    actionTakenByVessel: 'Defective unit tagged out, serviced by authorized shore technician, and returned to ship inventory.',
    aramcoMomsSubmission: 'SUB-2026-0902'
  },
  {
    id: 'NM-2026-003',
    referenceNo: 'NM-2026-003',
    vesselName: 'AHTS Ocean Guardian',
    date: '14-Feb-26',
    nearMissDescription: 'Mooring line tension surge during offshore barge approach. Line chafed against roller fairlead due to missing sacrificial sleeve.',
    correctiveAction: 'Vessel winches slackened, heave line redirected, and high-density polyurethane chafing guard installed.',
    location: 'Aft Mooring Station & Towing Deck',
    closeOutDate: '',
    status: 'Open',
    reportedBy: 'Chief Officer D. Larson',
    recommendation: 'Ensure all forward and aft mooring lines have certified protective chafe guards positioned prior to lock-in.',
    actionTakenByVessel: 'Replaced chafed line section and ordered four additional heavy-duty sleeves from shore store.',
    aramcoMomsSubmission: ''
  },
  {
    id: 'NM-2026-004',
    referenceNo: 'NM-2026-004',
    vesselName: 'PSV Crest Horizon',
    date: '02-Mar-26',
    nearMissDescription: 'Crew member ascending accommodation internal ladder while carrying handheld transceiver without utilizing 3-point contact.',
    correctiveAction: 'Work paused; crew instructed to secure radio inside pouch harness and always maintain 3 points of contact on ladder.',
    location: 'Main Deck Accommodation Central Stairwell',
    closeOutDate: '03-Mar-26',
    status: 'Closed',
    reportedBy: 'Capt. R. Sterling',
    recommendation: 'Reinforce 3-point contact safety rule during daily morning toolbox meetings.',
    actionTakenByVessel: 'Conducted safety stand-down with deck and galley crew regarding staircase and ladder ergonomics.',
    aramcoMomsSubmission: ''
  },
  {
    id: 'NM-2026-005',
    referenceNo: 'NM-2026-005',
    vesselName: 'AHTS Gulf Sentinel',
    date: '18-Mar-26',
    nearMissDescription: 'Unsecured hand tool left on crane boom rest platform at height following hydraulic valve replacement.',
    correctiveAction: 'Tool retrieved with fall-arrest lanyard and placed in secured tool bag; perimeter inspected.',
    location: 'Starboard Pedestal Crane Rest Platform',
    closeOutDate: '',
    status: 'Open',
    reportedBy: 'Bosun A. Morales',
    recommendation: 'Enforce 100% tool tethering policy for all work elevated higher than 1.8 meters.',
    actionTakenByVessel: 'Tool pouch with wrist lanyards issued to all technicians working on deck cranes.',
    aramcoMomsSubmission: ''
  },
  {
    id: 'NM-2026-006',
    referenceNo: 'NM-2026-006',
    vesselName: 'MV Atlantic Pioneer',
    date: '05-Apr-26',
    nearMissDescription: 'Chemical cleaning solvent bottle found stored inside paint locker without proper secondary containment tray.',
    correctiveAction: 'Chemical container moved to designated approved chemical locker with flame-retardant tray.',
    location: 'Forecastle Paint Locker Port',
    closeOutDate: '06-Apr-26',
    status: 'Closed',
    reportedBy: '2nd Officer S. Petrov',
    recommendation: 'Audit all vessel paint and chemical storage lockers weekly against SDS guidelines.',
    actionTakenByVessel: 'Affixed GHS chemical compatibility matrix inside both paint locker and deck store.',
    aramcoMomsSubmission: 'SUB-2026-1044'
  },
  {
    id: 'NM-2026-007',
    referenceNo: 'NM-2026-007',
    vesselName: 'MV Polaris Star',
    date: '21-Apr-26',
    nearMissDescription: 'Oil mist detector alarm activated momentarily during auxiliary generator speed ramp test due to sensor lens dust.',
    correctiveAction: 'Auxiliary engine load reduced to idle; detector optical lens cleaned with lint-free swab and recalibrated.',
    location: 'Engine Room Auxiliary Generator Flat',
    closeOutDate: '',
    status: 'Open',
    reportedBy: '2nd Engineer L. Gomez',
    recommendation: 'Clean and verify optical sensors monthly during scheduled PMS engine round checks.',
    actionTakenByVessel: 'Cleaning routine added to PMS job card; manufacturer lens cleaning kit verified on board.',
    aramcoMomsSubmission: ''
  },
  {
    id: 'NM-2026-008',
    referenceNo: 'NM-2026-008',
    vesselName: 'MT Seaking Mariner',
    date: '04-May-26',
    nearMissDescription: 'Secondary nitrogen inert gas deck seal water level gauge glass obscured by mineral deposits during pre-discharge check.',
    correctiveAction: 'Seal level confirmed via manual dip tube; glass column dismantled, descaled and returned to service.',
    location: 'Main Deck IG Deck Seal House',
    closeOutDate: '05-May-26',
    status: 'Closed',
    reportedBy: 'Cargo Officer R. Chen',
    recommendation: 'Flush gauge glasses weekly with fresh water to avoid scale crystallization.',
    actionTakenByVessel: 'Completed chemical flush and posted routine maintenance tag on sight glass.',
    aramcoMomsSubmission: 'SUB-2026-1180'
  }
];

@Injectable({
  providedIn: 'root'
})
export class NearMissStore {
  readonly records = signal<NearMissRecord[]>(this.loadInitial());

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records()));
      } catch (err) {
        console.error('Error persisting Near Miss records:', err);
      }
    });
  }

  private loadInitial(): NearMissRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored near-miss data, using defaults', e);
    }
    return INITIAL_DEMO_DATA;
  }

  getAll(): NearMissRecord[] {
    return this.records();
  }

  getById(id: string): NearMissRecord | undefined {
    return this.records().find(r => r.id === id || r.referenceNo === id);
  }

  create(data: Partial<NearMissRecord>): NearMissRecord {
    const id = `NM-${Date.now().toString().slice(-6)}`;
    const newRecord: NearMissRecord = {
      id,
      referenceNo: id,
      vesselName: data.vesselName || 'MV Pacific Voyager',
      date: data.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-'),
      nearMissDescription: data.nearMissDescription || '',
      description: data.nearMissDescription || '',
      correctiveAction: data.correctiveAction || '',
      location: data.location || '',
      closeOutDate: data.closeOutDate || '',
      status: (data.status as 'Open' | 'Closed') || 'Open',
      reportedBy: data.reportedBy || 'HSEQ Officer',
      recommendation: data.recommendation || '',
      actionTakenByVessel: data.actionTakenByVessel || '',
      aramcoMomsSubmission: data.aramcoMomsSubmission || ''
    };

    this.records.update(list => [newRecord, ...list]);
    return newRecord;
  }

  update(id: string, updates: Partial<NearMissRecord>): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id || item.referenceNo === id) {
          return {
            ...item,
            ...updates,
            nearMissDescription: updates.nearMissDescription ?? item.nearMissDescription,
            description: updates.nearMissDescription ?? item.nearMissDescription
          };
        }
        return item;
      })
    );
  }

  delete(id: string): void {
    this.records.update(list => list.filter(item => item.id !== id && item.referenceNo !== id));
  }

  resetToDefaults(): void {
    this.records.set(INITIAL_DEMO_DATA);
  }
}
