import { Injectable, signal, effect } from '@angular/core';

export interface SafeObservationCard {
  id: string;
  vesselName: string;
  date: string;
  time: string;
  cardType: string;
  department?: string;
  hazardHuntCategory?: string;
  whatWasObserved: string;
  detailedDescription: string;
  stoppedWork: string;
  situationDiscussed: string;
  workContinuedSafely: string;
  attitudeOfPersons: string;
  proceduresCommunications?: string;
  engineering?: string;
  environment?: string;
  people?: string;
  ppeNotUsed?: string;
  toolsAndEquipment?: string;
  correctiveActionTaken: string;
  actionsTaken: string;
}

const STORAGE_KEY = 'hseq-observations-v4';

const INITIAL_DEMO_DATA: SafeObservationCard[] = [
  {
    id: 'SOC-001',
    vesselName: 'MV Pacific Voyager',
    date: '18-Apr-25',
    time: '07:30',
    cardType: 'Unsafe Condition',
    whatWasObserved: 'Galley Storage Integrity',
    detailedDescription: 'Catering storage container in provision chiller left partially unsealed, creating potential food contamination hazard.',
    stoppedWork: 'Yes',
    situationDiscussed: 'Yes',
    workContinuedSafely: 'Yes',
    attitudeOfPersons: 'Receptive',
    correctiveActionTaken: 'Yes',
    actionsTaken: 'Container sealed with date-marked lid and storage area disinfected.'
  },
  {
    id: 'SOC-002',
    vesselName: 'MT Nordic Titan',
    date: '17-Apr-25',
    time: '18:45',
    cardType: 'Unsafe Act',
    whatWasObserved: 'Electrical Maintenance PPE',
    detailedDescription: 'Electrician replacing crew mess fluorescent tube without utilizing certified insulating safety gloves.',
    stoppedWork: 'Yes',
    situationDiscussed: 'Yes',
    workContinuedSafely: 'Yes',
    attitudeOfPersons: 'Receptive',
    correctiveActionTaken: 'Yes',
    actionsTaken: 'Task stopped immediately; certified 1000V rated insulated gloves donned prior to resuming replacement.'
  },
  {
    id: 'SOC-003',
    vesselName: 'AHTS Ocean Guardian',
    date: '17-Apr-25',
    time: '07:10',
    cardType: 'Unsafe Condition',
    whatWasObserved: 'Hazardous Chemical SDS Missing',
    detailedDescription: 'Degreaser solvent container in paint store missing corresponding Safety Data Sheet (SDS) binder sheet.',
    stoppedWork: 'Yes',
    situationDiscussed: 'Yes',
    workContinuedSafely: 'Yes',
    attitudeOfPersons: 'Receptive',
    correctiveActionTaken: 'Yes',
    actionsTaken: 'SDS sheet reprinted from vessel intranet DMS and inserted into locker safety folder.'
  },
  {
    id: 'SOC-004',
    vesselName: 'PSV Crest Horizon',
    date: '16-Apr-25',
    time: '16:00',
    cardType: 'Unsafe Act',
    whatWasObserved: 'Radar Mast Working at Height',
    detailedDescription: 'Crew climbing onto monkey island to inspect communication antenna without informing the Officer of the Watch (OOW) or securing radar interlock.',
    stoppedWork: 'Yes',
    situationDiscussed: 'Yes',
    workContinuedSafely: 'Yes',
    attitudeOfPersons: 'Receptive',
    correctiveActionTaken: 'Yes',
    actionsTaken: 'Radar transmission immediately halted on bridge, permit-to-work completed and signed before climbing resumed.'
  },
  {
    id: 'SOC-005',
    vesselName: 'MV Atlantic Pioneer',
    date: '16-Apr-25',
    time: '09:30',
    cardType: 'Unsafe Condition',
    whatWasObserved: 'Lifebuoy Marking Weathered',
    detailedDescription: 'Port side bridge wing lifebuoy vessel name and port of registry stenciling weathered and difficult to read.',
    stoppedWork: 'No',
    situationDiscussed: 'Yes',
    workContinuedSafely: 'Yes',
    attitudeOfPersons: 'Receptive',
    correctiveActionTaken: 'Yes',
    actionsTaken: 'Markings restenciled using black marine grade waterproof paint and retro-reflective tape renewed.'
  },
  {
    id: 'SOC-006',
    vesselName: 'AHTS Gulf Sentinel',
    date: '15-Apr-25',
    time: '11:15',
    cardType: 'Safe Act',
    whatWasObserved: 'Proactive Fall Arrest Inspection',
    detailedDescription: 'Bosun conducted full thorough inspection of safety harness webbing and karabiners prior to working over the side.',
    stoppedWork: 'No',
    situationDiscussed: 'Yes',
    workContinuedSafely: 'Yes',
    attitudeOfPersons: 'Receptive',
    correctiveActionTaken: 'Yes',
    actionsTaken: 'Commended during evening safety meeting as best practice.'
  },
  {
    id: 'SOC-007',
    vesselName: 'MV Polaris Star',
    date: '14-Apr-25',
    time: '14:20',
    cardType: 'Safe Condition',
    whatWasObserved: 'Clean Workshop & Tool Tethering',
    detailedDescription: 'Engine room workshop fully tidied with all pneumatic hoses reeled, fire doors shut, and tools returned to shadow boards.',
    stoppedWork: 'No',
    situationDiscussed: 'Yes',
    workContinuedSafely: 'Yes',
    attitudeOfPersons: 'Receptive',
    correctiveActionTaken: 'Yes',
    actionsTaken: 'Noted as exemplary housekeeping standard during weekly shipboard inspection.'
  }
];

@Injectable({
  providedIn: 'root'
})
export class ObservationStore {
  readonly records = signal<SafeObservationCard[]>(this.loadInitial());

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records()));
      } catch (err) {
        console.error('Error persisting Observation records:', err);
      }
    });
  }

  private loadInitial(): SafeObservationCard[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored observation data, using defaults', e);
    }
    return INITIAL_DEMO_DATA;
  }

  getAll(): SafeObservationCard[] {
    return this.records();
  }

  getById(id: string): SafeObservationCard | undefined {
    return this.records().find(r => r.id === id);
  }

  create(data: Partial<SafeObservationCard>): SafeObservationCard {
    const id = `SOC-${Date.now().toString().slice(-4)}`;
    const newRecord: SafeObservationCard = {
      id,
      vesselName: data.vesselName || 'MV Pacific Voyager',
      date: data.date || new Date().toISOString().substring(0, 10),
      time: data.time || '12:00',
      cardType: data.cardType || 'Unsafe Act',
      department: data.department || '',
      hazardHuntCategory: data.hazardHuntCategory || '',
      whatWasObserved: data.whatWasObserved || '',
      detailedDescription: data.detailedDescription || '',
      stoppedWork: data.stoppedWork || 'Yes',
      situationDiscussed: data.situationDiscussed || 'Yes',
      workContinuedSafely: data.workContinuedSafely || 'Yes',
      attitudeOfPersons: data.attitudeOfPersons || 'Receptive',
      proceduresCommunications: data.proceduresCommunications || '',
      engineering: data.engineering || '',
      environment: data.environment || '',
      people: data.people || '',
      ppeNotUsed: data.ppeNotUsed || '',
      toolsAndEquipment: data.toolsAndEquipment || '',
      correctiveActionTaken: data.correctiveActionTaken || 'Yes',
      actionsTaken: data.actionsTaken || ''
    };

    this.records.update(list => [newRecord, ...list]);
    return newRecord;
  }

  update(id: string, updates: Partial<SafeObservationCard>): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id) {
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
    this.records.update(list => list.filter(item => item.id !== id));
  }

  resetToDefaults(): void {
    this.records.set(INITIAL_DEMO_DATA);
  }
}
