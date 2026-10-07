import { Injectable, signal, effect } from '@angular/core';

export interface InspectionFinding {
  id: string;
  findingId?: string;
  findingDescription: string;
  description?: string;
  findings?: string;
  dateOfInspection?: string;
  aoc: string;                // Area of Concern (e.g. Technical, Operations, Safety, Navigation)
  subAoc: string;             // Sub Area of Concern (e.g. Machinery Maintenance, Record Keeping, Services)
  dept?: string;              // Department
  rating: 'High' | 'Medium' | 'Low' | string; // Observation on rating
  observationRating?: string;
  correctiveAction: string;   // Corrective Action plan
  picDetails: string;         // PIC Details (Person In Charge)
  dueDate?: string;           // Due date
  closureDate?: string;       // Closure date
  status: 'Open' | 'Closed' | string;
}

export interface InspectionTrackerRecord {
  id: string;
  vesselName: string;
  takeoverDate: string;                    // Takeover Date
  vesselType: string;                      // Vessel Type
  typeOfInspection: string;                // Type of Inspection (Internal / External)
  categoryOfInspection: string;            // Category of Inspection (CEHA, QSI, NAVIGATIONAL AUDIT, DRILL, etc.)
  period: string;                          // Period (e.g. Q3 2025)
  dateOfInspection: string;                // Date of Inspection
  // Findings Breakdown (Excel: High, Medium, Low, Total)
  findingsHigh: number;
  findingsMedium: number;
  findingsLow: number;
  findingsTotal: number;
  // Closed Breakdown (Excel: High Closed, Medium Closed, Low Closed, Total Closed)
  closedHigh: number;
  closedMedium: number;
  closedLow: number;
  closedTotal: number;
  status: string;                          // Status of Inspection (Open / Closed / Completed)
  intervalDays?: number;                   // Interval of Next Inspection (Days)
  windowOpening?: string;                  // Window opening for Next Inspection
  dueWindow?: string;                      // Due Window
  dueDate?: string;                        // Due Date (Expected date for Next Inspection)
  nameOfInspectors?: string;               // Name Of the Inspectors
  typeOfInspectors?: string;               // Type Of Inspectors
  statusNextInspection?: string;           // Status Of Next Inspection
  // Backward compatibility aliases
  nextDue?: string;
  inspectorName?: string;
  inspectorType?: string;
  inspectionType?: string;
  inspectionCategory?: string;
  nextInspectionDate?: string;
  windowPeriod?: string;
  statusNext?: string;
  picName?: string;
  picRole?: string;
  score?: number | null;
  findings?: InspectionFinding[];
}

const STORAGE_KEY = 'hseq-inspections-v6';

const INITIAL_DEMO_DATA: InspectionTrackerRecord[] = [
  {
    id: 'INS-2026-001',
    vesselName: 'MV Pacific Voyager',
    takeoverDate: '10-Jan-2025',
    vesselType: 'Container Vessel',
    typeOfInspection: 'External',
    categoryOfInspection: 'Annual Class Survey',
    period: 'Q3 2025 (Jul–Sep)',
    dateOfInspection: '2025-08-15',
    findingsHigh: 0,
    findingsMedium: 2,
    findingsLow: 3,
    findingsTotal: 5,
    closedHigh: 0,
    closedMedium: 2,
    closedLow: 3,
    closedTotal: 5,
    status: 'Completed',
    intervalDays: 365,
    windowOpening: '15-May-2026',
    dueWindow: 'Q3 2026 (Jul–Sep)',
    dueDate: '15-Aug-2026',
    nextDue: '15-Aug-2026',
    nameOfInspectors: 'Surveyor H. Vance (DNV)',
    typeOfInspectors: 'Classification Society',
    statusNextInspection: 'Scheduled',
    inspectorName: 'Surveyor H. Vance (DNV)',
    inspectorType: 'Classification Society',
    score: 94,
    findings: [
      {
        id: 'FND-INS-001',
        findingDescription: 'Emergency generator auto-start relay tested with 2-second delay beyond specification; re-calibrated and certified.',
        description: 'Emergency generator auto-start relay tested with 2-second delay beyond specification; re-calibrated and certified.',
        aoc: 'Technical',
        subAoc: 'Machinery Maintenance',
        dept: 'Engine Room',
        rating: 'Medium',
        correctiveAction: 'Re-calibrated relay contactor timing circuit and performed 3 sequential load step trials under surveyor supervision.',
        picDetails: 'Chief Engineer M. Rossi / Surveyor H. Vance',
        dueDate: '2025-08-30',
        closureDate: '2025-08-28',
        status: 'Closed'
      },
      {
        id: 'FND-INS-002',
        findingDescription: 'Lifeboat No. 1 release hook visual indicator label faded; replaced with approved IMO luminescent marking.',
        description: 'Lifeboat No. 1 release hook visual indicator label faded; replaced with approved IMO luminescent marking.',
        aoc: 'Safety',
        subAoc: 'LSA & Signage',
        dept: 'Deck',
        rating: 'Medium',
        correctiveAction: 'Renewed photoluminescent direction & lock indication decals and re-verified reset mechanism release pin.',
        picDetails: 'Chief Officer K. Hansen',
        dueDate: '2025-08-25',
        closureDate: '2025-08-22',
        status: 'Closed'
      },
      {
        id: 'FND-INS-003',
        findingDescription: 'Paint locker fire dampening flap seal rubber showing minor cosmetic hairline hardening.',
        description: 'Paint locker fire dampening flap seal rubber showing minor cosmetic hairline hardening.',
        aoc: 'Technical',
        subAoc: 'General Maintenance',
        dept: 'Hull & Deck',
        rating: 'Low',
        correctiveAction: 'Replaced neoprene gasket seal strip and lubricated release handle mechanism.',
        picDetails: 'Bosun P. Cruz / Chief Officer K. Hansen',
        dueDate: '2025-09-15',
        closureDate: '2025-09-02',
        status: 'Closed'
      },
      {
        id: 'FND-INS-004',
        findingDescription: 'Bridge wing repeater compass illumination bulb low brightness; replaced with OEM spare bulb.',
        description: 'Bridge wing repeater compass illumination bulb low brightness; replaced with OEM spare bulb.',
        aoc: 'Navigation',
        subAoc: 'Equipment Services',
        dept: 'Bridge',
        rating: 'Low',
        correctiveAction: 'Installed OEM halogen display bulb and tested dimmer potentiometer response.',
        picDetails: '2nd Officer D. Nair',
        dueDate: '2025-08-20',
        closureDate: '2025-08-16',
        status: 'Closed'
      },
      {
        id: 'FND-INS-005',
        findingDescription: 'Emergency fire pump suction valve gland packing adjusted and tested under working pressure.',
        description: 'Emergency fire pump suction valve gland packing adjusted and tested under working pressure.',
        aoc: 'Safety',
        subAoc: 'Fire Safety Systems',
        dept: 'Engine Room',
        rating: 'Low',
        correctiveAction: 'Tightened gland follower to spec and ran seawater delivery pressure trial with 2 hoses.',
        picDetails: '2nd Engineer J. Kowalski',
        dueDate: '2025-09-01',
        closureDate: '2025-08-29',
        status: 'Closed'
      }
    ]
  },
  {
    id: 'INS-2026-002',
    vesselName: 'MT Nordic Titan',
    takeoverDate: '01-Feb-2025',
    vesselType: 'Crude Oil Tanker',
    typeOfInspection: 'External',
    categoryOfInspection: 'SIRE 2.0 Vetting Inspection',
    period: 'Q4 2025 (Oct–Dec)',
    dateOfInspection: '2025-11-20',
    findingsHigh: 1,
    findingsMedium: 1,
    findingsLow: 4,
    findingsTotal: 6,
    closedHigh: 0,
    closedMedium: 1,
    closedLow: 4,
    closedTotal: 5,
    status: 'Open',
    intervalDays: 180,
    windowOpening: '20-Apr-2026',
    dueWindow: 'Q2 2026 (Apr–Jun)',
    dueDate: '20-May-2026',
    nextDue: '20-May-2026',
    nameOfInspectors: 'Capt. E. Lindqvist',
    typeOfInspectors: 'OCIMF Accredited Auditor',
    statusNextInspection: 'In Window',
    inspectorName: 'Capt. E. Lindqvist (OCIMF)',
    inspectorType: 'External Auditor',
    score: 88,
    findings: [
      {
        id: 'FND-INS-006',
        findingDescription: 'Cargo manifold drip tray drain valve plug locking pin missing stainless steel cotter ring.',
        description: 'Cargo manifold drip tray drain valve plug locking pin missing stainless steel cotter ring.',
        aoc: 'Operations',
        subAoc: 'Cargo Deck Systems',
        dept: 'Deck',
        rating: 'High',
        correctiveAction: 'Requisitioned replacement marine-grade 316 cotter pins; interim secured with approved locking wire.',
        picDetails: 'Chief Officer S. Petroff / Capt. E. Lindqvist',
        dueDate: '2025-11-25',
        closureDate: '',
        status: 'Open'
      },
      {
        id: 'FND-INS-007',
        findingDescription: 'ECDIS primary and secondary software backup maintenance log entry overdue by 3 days.',
        description: 'ECDIS primary and secondary software backup maintenance log entry overdue by 3 days.',
        aoc: 'Navigation',
        subAoc: 'Record Keeping',
        dept: 'Bridge',
        rating: 'Medium',
        correctiveAction: 'Synchronized weekly chart corrections and executed full system configuration snapshot to secure storage.',
        picDetails: '2nd Officer D. Nair',
        dueDate: '2025-11-30',
        closureDate: '2025-11-26',
        status: 'Closed'
      },
      {
        id: 'FND-INS-008',
        findingDescription: 'Pumproom bilge high-level alarm sensor float test certificate requires updating.',
        description: 'Pumproom bilge high-level alarm sensor float test certificate requires updating.',
        aoc: 'Technical',
        subAoc: 'Services & Certification',
        dept: 'Engine Room',
        rating: 'Low',
        correctiveAction: 'Conducted manual lift float sensor alarm test; documented in weekly machinery safety log.',
        picDetails: '2nd Engineer J. Kowalski',
        dueDate: '2025-12-05',
        closureDate: '2025-12-01',
        status: 'Closed'
      },
      {
        id: 'FND-INS-009',
        findingDescription: 'Deck foam monitor No. 3 swivel joint greasing point showing hardened grease.',
        description: 'Deck foam monitor No. 3 swivel joint greasing point showing hardened grease.',
        aoc: 'Safety',
        subAoc: 'Fire Fighting Systems',
        dept: 'Deck',
        rating: 'Low',
        correctiveAction: 'Purged old grease, re-packed swivel bearings with high-temp waterproof marine grease.',
        picDetails: '3rd Engineer / Bosun',
        dueDate: '2025-12-01',
        closureDate: '2025-11-27',
        status: 'Closed'
      },
      {
        id: 'FND-INS-010',
        findingDescription: 'Hospital oxygen resuscitator cylinder hydrostatic pressure test due next month; replacement requisitioned.',
        description: 'Hospital oxygen resuscitator cylinder hydrostatic pressure test due next month; replacement requisitioned.',
        aoc: 'Safety',
        subAoc: 'Medical & First Aid',
        dept: 'Medical',
        rating: 'Low',
        correctiveAction: 'Replacement hydro-tested cylinder delivered on board at Fujairah anchorage.',
        picDetails: 'Ship Medical Officer / Chief Officer',
        dueDate: '2025-12-10',
        closureDate: '2025-12-05',
        status: 'Closed'
      },
      {
        id: 'FND-INS-011',
        findingDescription: 'Inert Gas System (IGS) oxygen content recorder trace calibration verification countersigned.',
        description: 'Inert Gas System (IGS) oxygen content recorder trace calibration verification countersigned.',
        aoc: 'Operations',
        subAoc: 'Cargo Equipment',
        dept: 'Engine Room',
        rating: 'Low',
        correctiveAction: 'Calibrated span gas at 20.9% and zero point with certified nitrogen test gas.',
        picDetails: 'Chief Engineer M. Rossi',
        dueDate: '2025-11-28',
        closureDate: '2025-11-25',
        status: 'Closed'
      }
    ]
  },
  {
    id: 'INS-2026-003',
    vesselName: 'AHTS Ocean Guardian',
    takeoverDate: '15-Mar-2025',
    vesselType: 'AHTS Vessel',
    typeOfInspection: 'Internal',
    categoryOfInspection: 'NAVIGATIONAL AUDIT',
    period: 'Q1 2026 (Jan–Mar)',
    dateOfInspection: '2026-02-10',
    findingsHigh: 0,
    findingsMedium: 1,
    findingsLow: 2,
    findingsTotal: 3,
    closedHigh: 0,
    closedMedium: 1,
    closedLow: 2,
    closedTotal: 3,
    status: 'Completed',
    intervalDays: 180,
    windowOpening: '10-Jul-2026',
    dueWindow: 'Q3 2026 (Jul–Sep)',
    dueDate: '10-Aug-2026',
    nextDue: '10-Aug-2026',
    nameOfInspectors: 'Capt. R. Sterling',
    typeOfInspectors: 'Internal Lead Auditor',
    statusNextInspection: 'Scheduled',
    inspectorName: 'Capt. R. Sterling',
    inspectorType: 'HSEQ Superintendent',
    score: 96,
    findings: [
      {
        id: 'FND-INS-012',
        findingDescription: 'Passage plan safety contour settings verification documented; checklist signature countersigned.',
        description: 'Passage plan safety contour settings verification documented; checklist signature countersigned.',
        aoc: 'Navigation',
        subAoc: 'SMS Compliance',
        dept: 'Bridge',
        rating: 'Medium',
        correctiveAction: 'Updated bridge standing orders with cross-track limit and safety depth alarm verification protocol.',
        picDetails: 'Master / Chief Officer',
        dueDate: '2026-02-15',
        closureDate: '2026-02-12',
        status: 'Closed'
      },
      {
        id: 'FND-INS-013',
        findingDescription: 'Bridge wing repeater gyro compass azimuth ring optical prism cleaned and lubricated.',
        description: 'Bridge wing repeater gyro compass azimuth ring optical prism cleaned and lubricated.',
        aoc: 'Technical',
        subAoc: 'Machinery Maintenance',
        dept: 'Deck',
        rating: 'Low',
        correctiveAction: 'Cleaned azimuth sight prism with specialized optical solvent and calibrated true north heading.',
        picDetails: '2nd Officer',
        dueDate: '2026-02-20',
        closureDate: '2026-02-14',
        status: 'Closed'
      },
      {
        id: 'FND-INS-014',
        findingDescription: 'Chart table emergency lantern battery replaced with new rechargeable cell.',
        description: 'Chart table emergency lantern battery replaced with new rechargeable cell.',
        aoc: 'Safety',
        subAoc: 'Emergency Lighting',
        dept: 'Bridge',
        rating: 'Low',
        correctiveAction: 'Fitted OEM nickel-metal hydride cell and verified 4-hour continuous illumination runtime.',
        picDetails: '3rd Officer',
        dueDate: '2026-02-18',
        closureDate: '2026-02-13',
        status: 'Closed'
      }
    ]
  },
  {
    id: 'INS-2026-004',
    vesselName: 'PSV Crest Horizon',
    takeoverDate: '11-Sep-2025',
    vesselType: 'Platform Supply Vessel',
    typeOfInspection: 'External',
    categoryOfInspection: 'QSI',
    period: 'Q2 2026 (Apr–Jun)',
    dateOfInspection: '2026-04-05',
    findingsHigh: 1,
    findingsMedium: 4,
    findingsLow: 5,
    findingsTotal: 10,
    closedHigh: 1,
    closedMedium: 2,
    closedLow: 3,
    closedTotal: 6,
    status: 'Open',
    intervalDays: 90,
    windowOpening: '25-Jun-2026',
    dueWindow: 'Q3 2026 (Jul–Sep)',
    dueDate: '05-Jul-2026',
    nextDue: '05-Jul-2026',
    nameOfInspectors: 'Third-party Marine Surveyor',
    typeOfInspectors: 'External Warranty Surveyor',
    statusNextInspection: 'In Window',
    inspectorName: 'Third-party Marine Surveyor',
    inspectorType: 'External Assessor',
    score: 82,
    findings: [
      {
        id: 'FND-INS-015',
        findingDescription: 'Dynamic Positioning (DP) annual trial FMEA gap analysis items 4.2 & 4.3 pending verification.',
        description: 'Dynamic Positioning (DP) annual trial FMEA gap analysis items 4.2 & 4.3 pending verification.',
        aoc: 'Technical',
        subAoc: 'DP Systems',
        dept: 'Technical',
        rating: 'High',
        correctiveAction: 'Conducted vendor DP trial verification with field engineer and updated class endorsement certificate.',
        picDetails: 'Chief Engineer / Technical Superintendent',
        dueDate: '2026-05-01',
        closureDate: '2026-04-28',
        status: 'Closed'
      },
      {
        id: 'FND-INS-016',
        findingDescription: 'Rescue zone boarding ladder rungs non-skid coating renewal required prior to charter renewal.',
        description: 'Rescue zone boarding ladder rungs non-skid coating renewal required prior to charter renewal.',
        aoc: 'Safety',
        subAoc: 'Housekeeping & Deck Equipment',
        dept: 'Deck',
        rating: 'Medium',
        correctiveAction: 'Applied international marine anti-slip aggregate epoxy to all 12 rungs; inspection pending.',
        picDetails: 'Chief Officer',
        dueDate: '2026-05-15',
        closureDate: '',
        status: 'Open'
      },
      {
        id: 'FND-INS-017',
        findingDescription: 'Bulk mud tank high-level sensor audible alarm test certificate signed by Chief Engineer.',
        description: 'Bulk mud tank high-level sensor audible alarm test certificate signed by Chief Engineer.',
        aoc: 'Operations',
        subAoc: 'Cargo Equipment',
        dept: 'Engine Room',
        rating: 'Medium',
        correctiveAction: 'Checked sensor trip threshold and countersigned annual calibration certificate.',
        picDetails: 'Chief Engineer',
        dueDate: '2026-04-20',
        closureDate: '2026-04-18',
        status: 'Closed'
      },
      {
        id: 'FND-INS-018',
        findingDescription: 'Aft deck capstan emergency stop button shroud cover latch tension loosened.',
        description: 'Aft deck capstan emergency stop button shroud cover latch tension loosened.',
        aoc: 'Technical',
        subAoc: 'Deck Machinery',
        dept: 'Deck',
        rating: 'Low',
        correctiveAction: 'Adjusted spring latch and replaced stainless steel retaining pin.',
        picDetails: 'Bosun',
        dueDate: '2026-04-25',
        closureDate: '2026-04-22',
        status: 'Closed'
      }
    ]
  },
  {
    id: 'INS-2026-005',
    vesselName: 'MV Atlantic Pioneer',
    takeoverDate: '01-Jul-2025',
    vesselType: 'Bulk Carrier',
    typeOfInspection: 'Internal',
    categoryOfInspection: 'CEHA',
    period: 'Q2 2026 (Apr–Jun)',
    dateOfInspection: '2026-05-18',
    findingsHigh: 0,
    findingsMedium: 0,
    findingsLow: 1,
    findingsTotal: 1,
    closedHigh: 0,
    closedMedium: 0,
    closedLow: 1,
    closedTotal: 1,
    status: 'Completed',
    intervalDays: 90,
    windowOpening: '01-Aug-2026',
    dueWindow: 'Q3 2026 (Jul–Sep)',
    dueDate: '18-Aug-2026',
    nextDue: '18-Aug-2026',
    nameOfInspectors: 'Safety Officer T. Campbell',
    typeOfInspectors: 'Internal HSEQ Auditor',
    statusNextInspection: 'Scheduled',
    inspectorName: 'Safety Officer T. Campbell',
    inspectorType: 'HSEQ Officer',
    score: 98,
    findings: [
      {
        id: 'FND-INS-019',
        findingDescription: 'Mess room drinking water filtration cartridge renewed according to scheduled preventive maintenance.',
        description: 'Mess room drinking water filtration cartridge renewed according to scheduled preventive maintenance.',
        aoc: 'Health & Hygiene',
        subAoc: 'Galley & Catering',
        dept: 'Accommodation',
        rating: 'Low',
        correctiveAction: 'Fitted new carbon filtration cartridge and logged potability water test kit sample results.',
        picDetails: 'Chief Cook / Safety Officer',
        dueDate: '2026-05-25',
        closureDate: '2026-05-20',
        status: 'Closed'
      }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class InspectionStore {
  readonly records = signal<InspectionTrackerRecord[]>(this.loadInitial());

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records()));
      } catch (err) {
        console.error('Error persisting Inspection Tracker records:', err);
      }
    });
  }

  private loadInitial(): InspectionTrackerRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored inspections data, using defaults', e);
    }
    return INITIAL_DEMO_DATA;
  }

  getAll(): InspectionTrackerRecord[] {
    return this.records();
  }

  getById(id: string): InspectionTrackerRecord | undefined {
    return this.records().find(r => r.id === id);
  }

  static calculateFindingsSummary(findings: InspectionFinding[]) {
    const list = findings || [];
    const getRating = (f: any): string => (f.rating || f.observationRating || 'Low').toString().trim().toLowerCase();
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

  create(data: Partial<InspectionTrackerRecord>): InspectionTrackerRecord {
    const id = `INS-${Date.now().toString().slice(-4)}`;
    const findings = (data.findings || []).map((f: any, idx: number) => ({
      ...f,
      id: f.id || `${id}-F${String(idx + 1).padStart(2, '0')}`,
      findingDescription: f.findingDescription || f.description || '',
      description: f.description || f.findingDescription || '',
      rating: f.rating || 'Medium',
      status: f.status || 'Open'
    }));

    const counts = InspectionStore.calculateFindingsSummary(findings);

    const newRecord: InspectionTrackerRecord = {
      id,
      vesselName: data.vesselName || 'MV Pacific Voyager',
      takeoverDate: data.takeoverDate || '',
      vesselType: data.vesselType || 'Crew Boat',
      typeOfInspection: data.typeOfInspection || (data as any).inspectionType || 'QSI',
      categoryOfInspection: data.categoryOfInspection || (data as any).inspectionCategory || 'Internal',
      period: data.period || 'Q3 2026',
      dateOfInspection: data.dateOfInspection || new Date().toISOString().substring(0, 10),
      nextInspectionDate: data.nextInspectionDate || '',
      findingsLow: findings.length > 0 ? counts.findingsLow : Number(data.findingsLow || 0),
      findingsMedium: findings.length > 0 ? counts.findingsMedium : Number(data.findingsMedium || 0),
      findingsHigh: findings.length > 0 ? counts.findingsHigh : Number(data.findingsHigh || 0),
      findingsTotal: findings.length > 0 ? counts.findingsTotal : Number(data.findingsTotal || 0),
      closedLow: findings.length > 0 ? counts.closedLow : Number(data.closedLow || 0),
      closedMedium: findings.length > 0 ? counts.closedMedium : Number(data.closedMedium || 0),
      closedHigh: findings.length > 0 ? counts.closedHigh : Number(data.closedHigh || 0),
      closedTotal: findings.length > 0 ? counts.closedTotal : Number(data.closedTotal || 0),
      status: data.status || (findings.length > 0 && counts.closedTotal === counts.findingsTotal ? 'Completed' : 'Open'),
      nextDue: data.nextDue || data.nextInspectionDate || 'TBD',
      picName: data.picName || '',
      picRole: data.picRole || 'HSEQ Officer',
      score: data.score !== undefined ? Number(data.score) : 90,
      findings
    };

    this.records.update(list => [newRecord, ...list]);
    return newRecord;
  }

  update(id: string, updates: Partial<InspectionTrackerRecord>): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id) {
          const findings = updates.findings !== undefined ? updates.findings : (item.findings || []);
          const counts = findings.length > 0
            ? InspectionStore.calculateFindingsSummary(findings)
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
            typeOfInspection: updates.typeOfInspection || (updates as any).inspectionType || item.typeOfInspection,
            categoryOfInspection: updates.categoryOfInspection || (updates as any).inspectionCategory || item.categoryOfInspection,
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

  addFinding(inspectionId: string, findingData: Partial<InspectionFinding>): InspectionFinding {
    let createdFinding!: InspectionFinding;

    this.records.update(list =>
      list.map(item => {
        if (item.id === inspectionId) {
          const existingFindings = item.findings || [];
          const findingId = `${inspectionId}-F${String(existingFindings.length + 1).padStart(2, '0')}`;
          const desc = findingData.findingDescription || findingData.description || '';
          const ratingVal = (findingData.rating || 'Medium') as 'High' | 'Medium' | 'Low';
          const statusVal = (findingData.status || 'Open') as 'Open' | 'Closed';
          const dueDateVal = findingData.dueDate || '';
          const closureDateVal = statusVal === 'Closed' ? (findingData.closureDate || new Date().toISOString().substring(0, 10)) : '';

          createdFinding = {
            id: findingId,
            findingId,
            findingDescription: desc,
            description: desc,
            dateOfInspection: findingData.dateOfInspection || item.dateOfInspection,
            aoc: findingData.aoc || 'Technical',
            subAoc: findingData.subAoc || 'Machinery Maintenance',
            dept: findingData.dept || 'Engineering',
            rating: ratingVal,
            observationRating: ratingVal,
            correctiveAction: findingData.correctiveAction || '',
            picDetails: findingData.picDetails || 'Chief Engineer',
            dueDate: dueDateVal,
            closureDate: closureDateVal,
            status: statusVal
          };

          const newFindings = [...existingFindings, createdFinding];
          const counts = InspectionStore.calculateFindingsSummary(newFindings);
          const autoStatus = counts.findingsTotal > 0 && counts.closedTotal === counts.findingsTotal ? 'Completed' : 'Open';

          return {
            ...item,
            findings: newFindings,
            status: item.status === 'Completed' && autoStatus === 'Open' ? 'Open' : (autoStatus === 'Completed' ? 'Completed' : item.status),
            ...counts
          };
        }
        return item;
      })
    );

    return createdFinding;
  }

  updateFinding(inspectionId: string, findingId: string, updates: Partial<InspectionFinding>): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === inspectionId && item.findings) {
          const updatedFindings = item.findings.map(f => {
            if (f.id === findingId) {
              const desc: string = updates.findingDescription ?? updates.description ?? f.findingDescription ?? f.description ?? '';
              const ratingVal = (updates.rating || f.rating || 'Medium') as 'High' | 'Medium' | 'Low';
              const statusVal = (updates.status || f.status || 'Open') as 'Open' | 'Closed';
              const dueDateVal = updates.dueDate !== undefined ? updates.dueDate : f.dueDate;
              const closureDateVal = statusVal === 'Closed' ? (updates.closureDate || f.closureDate || new Date().toISOString().substring(0, 10)) : '';

              const updatedFinding: InspectionFinding = {
                ...f,
                ...updates,
                findingDescription: desc,
                description: desc,
                rating: ratingVal,
                observationRating: ratingVal,
                status: statusVal,
                dueDate: dueDateVal,
                closureDate: closureDateVal,
                aoc: updates.aoc ?? f.aoc ?? 'Technical',
                subAoc: updates.subAoc ?? f.subAoc ?? '',
                picDetails: updates.picDetails ?? f.picDetails ?? '',
                correctiveAction: updates.correctiveAction ?? f.correctiveAction ?? ''
              };

              return updatedFinding;
            }
            return f;
          });

          const counts = InspectionStore.calculateFindingsSummary(updatedFindings);
          const autoStatus = counts.findingsTotal > 0 && counts.closedTotal === counts.findingsTotal ? 'Completed' : 'Open';

          return {
            ...item,
            findings: updatedFindings,
            status: autoStatus === 'Completed' ? 'Completed' : item.status,
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
          const counts = InspectionStore.calculateFindingsSummary(updatedFindings);
          const autoStatus = counts.findingsTotal > 0 && counts.closedTotal === counts.findingsTotal ? 'Completed' : item.status;

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
