import { Injectable, signal, computed, inject } from '@angular/core';
import { NearMissStore } from '../stores/near-miss.store';
import { 
  UserRole, Vessel, Department, InspectionRecord, NearMissRecord, IncidentRecord,
  InjuryRecord, SafeCardRecord, RiskAssessmentRecord, PermitToWorkRecord, CertificateRecord,
  DmsDocument, ManagementVisitRecord, CapaRecord, DashboardKpis, RecordStatus, FleetNotification,
  VesselTypeItem, PortItem, CategoryItem, InspectorItem
} from '../models/hseq.models';

@Injectable({
  providedIn: 'root'
})
export class HseqStateService {
  // Current user context & role simulation
  readonly currentUserRole = signal<UserRole>('HSEQ Officer');
  readonly selectedVesselFilter = signal<string>('ALL');
  readonly searchQuery = signal<string>('');

  readonly isAuthenticated = signal<boolean>(true);
  readonly currentUserInfo = signal({
    name: 'Capt. R. Sterling',
    email: 'r.sterling@navishseq.com',
    rank: 'HSEQ Superintendent',
    role: 'HSEQ Officer' as UserRole,
    avatar: 'RS'
  });

  readonly notifications = signal<FleetNotification[]>([
    {
      id: 'NOTIF-01',
      title: 'Statutory Certificate Due Soon',
      message: 'Document of Compliance (ISM) for MV Pacific Voyager expires in 34 days.',
      category: 'warning',
      timestamp: '10 mins ago',
      read: false,
      link: '/certificates',
      vesselName: 'MV Pacific Voyager'
    },
    {
      id: 'NOTIF-02',
      title: 'Active High-Risk Permit (Hot Work)',
      message: 'PTW-2026-0089 Hot Work in Engine Room Upper Flat is active on MT Nordic Titan.',
      category: 'alert',
      timestamp: '45 mins ago',
      read: false,
      link: '/permits',
      vesselName: 'MT Nordic Titan'
    },
    {
      id: 'NOTIF-03',
      title: 'New High Priority CAPA Assigned',
      message: 'CAPA-2026-0105 assigned to Chief Officer K. Hansen requires verification.',
      category: 'info',
      timestamp: '2 hours ago',
      read: false,
      link: '/capa',
      vesselName: 'MV Pacific Voyager'
    },
    {
      id: 'NOTIF-04',
      title: 'Near Miss Broadcast Published',
      message: 'Dropped shackle pin during crane maintenance broadcasted to entire fleet.',
      category: 'info',
      timestamp: 'Yesterday',
      read: true,
      link: '/near-miss',
      vesselName: 'MV Atlantic Pioneer'
    }
  ]);

  readonly unreadNotificationsCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  // ==========================================================
  // MASTER DATA - SOURCE OF TRUTH ACROSS ENTIRE APPLICATION
  // ==========================================================

  // 1. Fleet Vessels
  readonly vessels = signal<Vessel[]>([
    { id: 'VES-01', name: 'MV Pacific Voyager', imoNumber: '9482103', flag: 'Marshall Islands', vesselType: 'Container Vessel', departmentCount: 4, crewCount: 24, status: 'Active' },
    { id: 'VES-02', name: 'MT Nordic Titan', imoNumber: '9624519', flag: 'Panama', vesselType: 'Crude Oil Tanker', departmentCount: 4, crewCount: 26, status: 'Active' },
    { id: 'VES-03', name: 'MV Atlantic Pioneer', imoNumber: '9310842', flag: 'Singapore', vesselType: 'Bulk Carrier', departmentCount: 4, crewCount: 22, status: 'Active' },
    { id: 'VES-04', name: 'AHTS Ocean Guardian', imoNumber: '9648210', flag: 'Bahamas', vesselType: 'AHTS Vessel', departmentCount: 4, crewCount: 22, status: 'Active' },
    { id: 'VES-05', name: 'PSV Crest Horizon', imoNumber: '9512046', flag: 'Liberia', vesselType: 'Platform Supply Vessel', departmentCount: 4, crewCount: 18, status: 'Active' },
    { id: 'VES-06', name: 'AHTS Gulf Sentinel', imoNumber: '9523190', flag: 'Marshall Islands', vesselType: 'Offshore Support Vessel', departmentCount: 4, crewCount: 16, status: 'Active' },
    { id: 'VES-07', name: 'MV Polaris Star', imoNumber: '9610501', flag: 'Panama', vesselType: 'Multi-Purpose Vessel', departmentCount: 4, crewCount: 20, status: 'Active' },
    { id: 'VES-08', name: 'MT Seaking Mariner', imoNumber: '9650507', flag: 'Singapore', vesselType: 'Chemical Carrier', departmentCount: 4, crewCount: 24, status: 'Active' },
    { id: 'VES-09', name: 'MV Arctic Aurora', imoNumber: '9841209', flag: 'Norway', vesselType: 'LNG Carrier', departmentCount: 4, crewCount: 28, status: 'Under Maintenance' },
  ]);

  readonly vesselNames = computed(() => this.vessels().map(v => v.name));

  // 2. Vessel Types & Classifications
  readonly vesselTypes = signal<VesselTypeItem[]>([
    { id: 'VT-01', code: 'VT-CONT', name: 'Container Vessel', classCategory: 'Cellular Container', typicalDwt: '14,000 TEU / 130,000 DWT', activeCount: 1, status: 'Active' },
    { id: 'VT-02', code: 'VT-VLCC', name: 'Crude Oil Tanker', classCategory: 'VLCC / Suezmax', typicalDwt: '160,000 - 320,000 DWT', activeCount: 1, status: 'Active' },
    { id: 'VT-03', code: 'VT-BULK', name: 'Bulk Carrier', classCategory: 'Capesize / Panamax', typicalDwt: '82,000 - 180,000 DWT', activeCount: 1, status: 'Active' },
    { id: 'VT-04', code: 'VT-AHTS', name: 'AHTS Vessel', classCategory: 'Anchor Handling Tug Supply', typicalDwt: '8,000 BHP / 2,500 DWT', activeCount: 2, status: 'Active' },
    { id: 'VT-05', code: 'VT-PSV', name: 'Platform Supply Vessel', classCategory: 'Offshore Supply', typicalDwt: '3,800 - 5,000 DWT', activeCount: 1, status: 'Active' },
    { id: 'VT-06', code: 'VT-LNG', name: 'LNG Carrier', classCategory: 'Liquefied Gas Carrier', typicalDwt: '174,000 cbm / Membrane', activeCount: 1, status: 'Active' }
  ]);

  readonly vesselTypeNames = computed(() => this.vesselTypes().map(vt => vt.name));

  // 3. Operating Ports & Locations
  readonly ports = signal<PortItem[]>([
    { id: 'PRT-01', code: 'SGSIN', name: 'Port of Singapore (PSA)', country: 'Singapore', region: 'Southeast Asia', mouRegime: 'Tokyo MOU', status: 'Active' },
    { id: 'PRT-02', code: 'NLRTM', name: 'Port of Rotterdam', country: 'Netherlands', region: 'Northwest Europe', mouRegime: 'Paris MOU', status: 'Active' },
    { id: 'PRT-03', code: 'AEFJR', name: 'Fujairah Anchorage & Port', country: 'United Arab Emirates', region: 'Middle East Gulf', mouRegime: 'Riyadh MOU', status: 'Active' },
    { id: 'PRT-04', code: 'USHOU', name: 'Port of Houston (Bayport)', country: 'United States', region: 'US Gulf Coast', mouRegime: 'USCG', status: 'Active' },
    { id: 'PRT-05', code: 'KRPUS', name: 'Port of Busan', country: 'South Korea', region: 'East Asia', mouRegime: 'Tokyo MOU', status: 'Active' },
    { id: 'PRT-06', code: 'SADMM', name: 'King Abdulaziz Port (Dammam)', country: 'Saudi Arabia', region: 'Arabian Gulf', mouRegime: 'Riyadh MOU', status: 'Active' },
    { id: 'PRT-07', code: 'SARAS', name: 'Ras Tanura Terminal', country: 'Saudi Arabia', region: 'Arabian Gulf', mouRegime: 'Riyadh MOU', status: 'Active' },
    { id: 'PRT-08', code: 'SASAF', name: 'Safaniyah Pier', country: 'Saudi Arabia', region: 'Arabian Gulf', mouRegime: 'Riyadh MOU', status: 'Active' }
  ]);

  readonly portNames = computed(() => this.ports().map(p => p.name));

  // 4. Departments
  readonly departments = signal<Department[]>([
    { id: 'DEP-01', name: 'Deck Department', head: 'Chief Officer K. Hansen', code: 'DEC' },
    { id: 'DEP-02', name: 'Engine Department', head: 'Chief Engineer M. Rossi', code: 'ENG' },
    { id: 'DEP-03', name: 'Catering & Galley', head: 'Chief Cook A. Sharma', code: 'CAT' },
    { id: 'DEP-04', name: 'HSEQ & Compliance', head: 'Capt. R. Sterling', code: 'HSQ' },
    { id: 'DEP-05', name: 'Marine Operations', head: 'Superintendent D. Vance', code: 'OPS' },
  ]);

  readonly departmentNames = computed(() => this.departments().map(d => d.name));

  // 5. Configurable Categories
  readonly categories = signal<CategoryItem[]>([
    { id: 'CAT-01', scope: 'Inspection Finding', code: 'FND-MOOR', name: 'Mooring & Towing Equipment', severityWeight: 'High', status: 'Active' },
    { id: 'CAT-02', scope: 'Inspection Finding', code: 'FND-FIRE', name: 'Fire Safety & Fixed Systems', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-03', scope: 'Inspection Finding', code: 'FND-ENG', name: 'Machinery Space Housekeeping', severityWeight: 'Medium', status: 'Active' },
    { id: 'CAT-04', scope: 'Inspection Finding', code: 'FND-LSA', name: 'Lifesaving Appliances (LSA)', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-05', scope: 'Near Miss', code: 'NM-PINCH', name: 'Pinch Point Hazard', severityWeight: 'High', status: 'Active' },
    { id: 'CAT-06', scope: 'Near Miss', code: 'NM-DROP', name: 'Dropped Object Risk', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-07', scope: 'Near Miss', code: 'NM-SLIP', name: 'Slip / Trip / Fall', severityWeight: 'Medium', status: 'Active' },
    { id: 'CAT-08', scope: 'Permit to Work', code: 'PTW-HOT', name: 'Hot Work (Enclosed / Open)', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-09', scope: 'Permit to Work', code: 'PTW-CONF', name: 'Confined Space Entry', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-10', scope: 'Injury Classification', code: 'INJ-LTI', name: 'Lost Time Injury (LTI)', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-11', scope: 'Injury Classification', code: 'INJ-MTC', name: 'Medical Treatment Case (MTC)', severityWeight: 'High', status: 'Active' }
  ]);

  readonly categoryNames = computed(() => this.categories().map(c => c.name));

  // 6. Fleet Inspectors & Auditors
  readonly inspectors = signal<InspectorItem[]>([
    { id: 'INS-P01', name: 'Capt. J. Vance', organization: 'Independent Marine Auditor', role: 'Lead Auditor', status: 'Active' },
    { id: 'INS-P02', name: 'Superintendent P. Thorne', organization: 'Navis Fleet Management', role: 'Marine Superintendent', status: 'Active' },
    { id: 'INS-P03', name: 'Capt. R. Sterling', organization: 'HSEQ Department', role: 'HSEQ Lead Auditor', status: 'Active' },
    { id: 'INS-P04', name: 'Surveyor A. Moreau', organization: 'DNV Classification', role: 'Class Surveyor', status: 'Active' },
    { id: 'INS-P05', name: 'Inspector K. Tanaka', organization: 'Tokyo MOU PSC', role: 'Port State Control Officer', status: 'Active' },
    { id: 'INS-P06', name: 'Auditor M. Al-Ghamdi', organization: 'Saudi Aramco MOMs', role: 'Oil Major Vetting Auditor', status: 'Active' },
    { id: 'INS-P07', name: 'Chief Officer K. Hansen', organization: 'Onboard Fleet Crew', role: 'Safety Officer', status: 'Active' }
  ]);

  readonly inspectorNames = computed(() => this.inspectors().map(i => i.name));

  // 1. Inspections
  readonly inspections = signal<InspectionRecord[]>([
    {
      id: 'INS-01',
      referenceNo: 'INS-2026-0042',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      department: 'Deck Department',
      location: 'Forward Mooring Station & Forecastle',
      inspectionDate: '2026-09-28',
      inspectionType: 'Pre-vetting Inspection',
      leadInspector: 'Capt. J. Vance (Auditor)',
      teamMembers: ['Chief Officer K. Hansen', 'Bosun D. Silva'],
      findings: [
        {
          id: 'FND-01',
          description: 'Emergency towing wire messenger line heavily chafed near fairlead roller',
          category: 'Mooring & Towing Equipment',
          severity: 'High',
          riskRating: 15,
          immediateAction: 'Messenger line taken out of service; spare line rigged immediately',
          capaRequired: true,
          responsiblePerson: 'Chief Officer K. Hansen',
          targetDate: '2026-10-15',
          status: 'Action Logged'
        },
        {
          id: 'FND-02',
          description: 'Paint locker sprinkler head isolation valve tag missing seal integrity wire',
          category: 'Fire Safety & Fixed Systems',
          severity: 'Medium',
          riskRating: 9,
          immediateAction: 'Valve verified locked open; new tamper-evident security seal installed',
          capaRequired: false,
          responsiblePerson: 'Safety Officer A. Roy',
          targetDate: '2026-10-02',
          status: 'Closed'
        }
      ],
      overallStatus: 'Action Pending',
      escalated: false,
      scorePercentage: 91,
      attachments: [
        { id: 'ATT-01', fileName: 'Chafed_Towing_Wire_Photo.jpg', fileSize: '2.4 MB', fileType: 'image/jpeg', uploadedBy: 'Capt. J. Vance', uploadedAt: '2026-09-28' },
        { id: 'ATT-02', fileName: 'Pre-vetting_Checklist_Summary.pdf', fileSize: '1.1 MB', fileType: 'application/pdf', uploadedBy: 'Capt. J. Vance', uploadedAt: '2026-09-28' }
      ],
      auditTrail: [
        { timestamp: '2026-09-28 14:30', user: 'Capt. J. Vance', role: 'Inspector', action: 'Inspection Report Submitted' },
        { timestamp: '2026-09-29 09:15', user: 'Capt. R. Sterling', role: 'HSEQ Officer', action: 'Reviewed & Action Plan Approved' }
      ]
    },
    {
      id: 'INS-02',
      referenceNo: 'INS-2026-0043',
      vesselId: 'VES-02',
      vesselName: 'MT Nordic Titan',
      department: 'Engine Department',
      location: 'Auxiliary Boiler Flat & Incinerator Room',
      inspectionDate: '2026-10-01',
      inspectionType: 'Internal ISM Audit',
      leadInspector: 'Superintendent P. Thorne',
      teamMembers: ['2nd Engineer L. Gomez'],
      findings: [
        {
          id: 'FND-03',
          description: 'Fuel oil drip tray drain pipe choked with oily sludge deposits',
          category: 'Machinery Space Housekeeping',
          severity: 'Medium',
          riskRating: 8,
          immediateAction: 'Drain line blown clear and tested with fresh water flow',
          capaRequired: true,
          responsiblePerson: 'Chief Engineer M. Rossi',
          targetDate: '2026-10-10',
          status: 'Open'
        }
      ],
      overallStatus: 'Under Review',
      escalated: false,
      scorePercentage: 88,
      attachments: [],
      auditTrail: [
        { timestamp: '2026-10-01 16:45', user: 'P. Thorne', role: 'Inspector', action: 'Inspection Logged' }
      ]
    }
  ]);

  // 2. Near Misses (Delegated to NearMissStore with LocalStorage sync)
  private readonly nearMissStore = inject(NearMissStore);
  readonly nearMisses = this.nearMissStore.records;

  // 3. Incidents
  readonly incidents = signal<IncidentRecord[]>([
    {
      id: 'INC-01',
      referenceNo: 'INC-2026-0031',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      department: 'Deck Department',
      location: 'Container Bay 42 Starboard',
      dateTime: '2026-09-14 04:30',
      classification: 'Equipment Breakdown',
      description: 'Lashing bridge turnbuckle tensioner failed during heavy weather in North Pacific (Beaufort 8), causing minor shift of two empty containers.',
      immediateResponse: 'Vessel altered course to ease motion; speed reduced; temporary chain lashings applied once safe conditions permitted.',
      actualSeverity: 'Medium',
      potentialSeverity: 'Critical',
      escalationRequired: true,
      investigationTeam: ['Capt. H. Miller (Master)', 'Chief Officer K. Hansen', 'Marine Superintendent D. Vance'],
      fiveWhyAnalysis: {
        why1: 'Turnbuckle spindle thread sheared under cyclical dynamic lashing load.',
        why2: 'Thread suffered micro-fractures due to fatigue wear.',
        why3: 'Turnbuckle exceeded operational hours without non-destructive ultrasonic testing.',
        why4: 'Planned maintenance schedule had lashing gear marked for visual inspection only.',
        rootCause: 'PMS inspection criteria inadequate for high-cycle lashing gear in trans-Pacific heavy weather corridors.'
      },
      capaIds: ['CAPA-2026-0309', 'CAPA-2026-0310'],
      finalReviewNotes: 'Fleet-wide inspection circular issued. Revised PMS job cards to include batch proof-load tests.',
      status: 'Action Pending',
      attachments: [
        { id: 'ATT-INC-1', fileName: 'Sheared_Turnbuckle_Macro.jpg', fileSize: '4.2 MB', fileType: 'image/jpeg', uploadedBy: 'Chief Officer', uploadedAt: '2026-09-15' },
        { id: 'ATT-INC-2', fileName: 'Incident_Master_Report.pdf', fileSize: '1.8 MB', fileType: 'application/pdf', uploadedBy: 'Master H. Miller', uploadedAt: '2026-09-15' }
      ],
      auditTrail: [
        { timestamp: '2026-09-14 06:00', user: 'Master H. Miller', role: 'Approver', action: 'Incident Escalated to Shore Emergency Response' },
        { timestamp: '2026-09-18 10:30', user: 'Capt. R. Sterling', role: 'HSEQ Officer', action: '5-Why Analysis Finalized' }
      ]
    }
  ]);

  // 4. Injuries
  readonly injuries = signal<InjuryRecord[]>([
    {
      id: 'INJ-01',
      referenceNo: 'INJ-2026-0014',
      vesselId: 'VES-03',
      vesselName: 'MV Atlantic Pioneer',
      injuredPersonName: 'Carlos Mendoza',
      rank: 'Able Seaman (AB)',
      dateTime: '2026-09-19 14:10',
      location: 'Main Deck Hatch Coaming No. 3',
      workActivity: 'Hatch coaming drain channel descaling and rust chipping',
      injuryType: 'Eye Foreign Object',
      affectedBodyPart: 'Eye / Face',
      severityClassification: 'Medical Treatment Case (MTC)',
      daysLost: 0,
      restrictedDays: 3,
      treatmentDetails: 'Small paint scale lodged in left cornea under eyelid. Eye flushed with sterile saline station; examined by shore ophthalmic doctor at Singapore anchorage.',
      returnToWorkStatus: 'Restricted Duty',
      status: 'Action Pending',
      attachments: [{ id: 'ATT-INJ-1', fileName: 'Medical_Shore_Report_SG.pdf', fileSize: '850 KB', fileType: 'application/pdf', uploadedBy: 'Safety Officer', uploadedAt: '2026-09-20' }],
      auditTrail: [
        { timestamp: '2026-09-19 15:30', user: 'Safety Officer', role: 'HSEQ Officer', action: 'Injury Logged & First Aid Administered' }
      ]
    },
    {
      id: 'INJ-02',
      referenceNo: 'INJ-2026-0015',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      injuredPersonName: 'Devan Nair',
      rank: '2nd Cook',
      dateTime: '2026-08-11 11:20',
      location: 'Galley Deep Fryer & Preparation Counter',
      workActivity: 'Deep frying food items for crew lunch service',
      injuryType: 'Chemical Burn',
      affectedBodyPart: 'Hand / Fingers',
      severityClassification: 'First Aid Case (FAC)',
      daysLost: 0,
      restrictedDays: 0,
      treatmentDetails: 'Hot oil splash on right forearm while preparing lunch. Burn gel applied; dressing changed daily. Fully healed.',
      returnToWorkStatus: 'Full Duty Resumed',
      status: 'Closed',
      attachments: [],
      auditTrail: [
        { timestamp: '2026-08-11 12:00', user: 'Chief Cook A. Sharma', role: 'Department Head', action: 'Reported FAC' },
        { timestamp: '2026-08-15 09:00', user: 'Capt. R. Sterling', role: 'HSEQ Officer', action: 'Case Closed after Full Recovery' }
      ]
    }
  ]);

  // 5. Safe Cards / Observations
  readonly safeCards = signal<SafeCardRecord[]>([
    {
      id: 'SC-01',
      referenceNo: 'SC-2026-0294',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      department: 'Deck Department',
      location: 'Cross Deck Catwalk Bay 18',
      dateTime: '2026-10-02 09:30',
      type: 'Safe Act',
      isAnonymous: false,
      reporterName: 'Bosun D. Silva',
      category: 'PPE Use',
      description: 'Deck cadet observed re-adjusting chin strap and securing fall arrest safety harness dual-lanyard correctly before stepping onto high container tier.',
      riskLevel: 'Low',
      immediateActionTaken: 'Commended cadet during daily debriefing.',
      positiveRecognitionFlag: true,
      recognitionNote: 'Exemplary safety behaviour in proactive fall protection protocol.',
      status: 'Closed',
      attachments: [],
      auditTrail: [{ timestamp: '2026-10-02 10:00', user: 'Bosun D. Silva', role: 'Vessel Crew', action: 'Safe Card Submitted' }]
    },
    {
      id: 'SC-02',
      referenceNo: 'SC-2026-0295',
      vesselId: 'VES-02',
      vesselName: 'MT Nordic Titan',
      department: 'Engine Department',
      location: 'Steering Gear Flat',
      dateTime: '2026-10-03 15:10',
      type: 'Unsafe Condition',
      isAnonymous: true,
      reporterName: 'Anonymous Reporter',
      category: 'Electrical Safety',
      description: 'Emergency steering stand halogen floodlight cable insulation cracked exposing internal conductor wires near vibration damper bracket.',
      riskLevel: 'High',
      immediateActionTaken: 'Circuit breaker opened and LOTO tag applied. Temporary 24V LED lamp placed.',
      positiveRecognitionFlag: false,
      capaId: 'CAPA-2026-0315',
      status: 'CAPA Raised',
      attachments: [{ id: 'ATT-SC-1', fileName: 'Cable_Cracking_Floodlight.jpg', fileSize: '2.1 MB', fileType: 'image/jpeg', uploadedBy: 'Anonymous', uploadedAt: '2026-10-03' }],
      auditTrail: [{ timestamp: '2026-10-03 15:40', user: 'System (Anonymous)', role: 'Vessel Crew', action: 'Observation Logged' }]
    },
    {
      id: 'SC-03',
      referenceNo: 'SC-2026-0296',
      vesselId: 'VES-03',
      vesselName: 'MV Atlantic Pioneer',
      department: 'Deck Department',
      location: 'Port Gangway Netting',
      dateTime: '2026-10-04 08:20',
      type: 'Stop Work Authority (SWA)',
      isAnonymous: false,
      reporterName: 'Duty Officer S. Chen',
      category: 'Situational Awareness',
      description: 'Stevedores attempted to embark gangway while bunker barge was mooring alongside with high wash swell.',
      riskLevel: 'Critical',
      immediateActionTaken: 'SWA exercised. Gangway gate secured until bunker barge was fully secured and swell settled.',
      positiveRecognitionFlag: true,
      recognitionNote: 'Decisive intervention preventing potential fall overboard hazard.',
      status: 'Closed',
      attachments: [],
      auditTrail: [{ timestamp: '2026-10-04 09:00', user: 'S. Chen', role: 'Vessel Crew', action: 'SWA Logged & Closed' }]
    }
  ]);

  // 6. Risk Assessments
  readonly riskAssessments = signal<RiskAssessmentRecord[]>([
    {
      id: 'RA-01',
      referenceNo: 'RA-2026-0057',
      vesselId: 'VES-02',
      vesselName: 'MT Nordic Titan',
      department: 'Deck Department',
      activityTitle: 'Cargo Tank 3 Port Confined Space Entry for Internal Anode Inspection',
      assessmentType: 'Non-Routine High Risk',
      assessmentDate: '2026-10-02',
      validityExpiryDate: '2026-10-08',
      leadAssessor: 'Chief Officer K. Hansen',
      teamMembers: ['Safety Officer A. Roy', 'Pumpman G. Patel'],
      approver: 'Capt. H. Miller (Master)',
      maxInitialRisk: 'Critical',
      maxResidualRisk: 'Low',
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Atmospheric cleaning, mechanical ventilation and continuous gas testing',
          hazards: 'Oxygen deficiency, toxic hydrocarbon vapour pockets, H2S residue',
          affectedEntities: 'Entry team, standby watch',
          initialLikelihood: 4,
          initialConsequence: 5,
          initialRating: 20,
          existingControls: 'Forced draft air blowers running 48 hours; calibrated multi-gas detector deployed on multiple tank levels',
          additionalControls: 'Continuous personal 4-gas monitors for all entrants; tripod recovery winch and SCBA on deck standby',
          residualLikelihood: 1,
          residualConsequence: 4,
          residualRating: 4,
          hierarchy: 'Engineering',
          alarpAchieved: true
        },
        {
          stepNumber: 2,
          stepDescription: 'Vertical ladder descent and internal staging traversal',
          hazards: 'Slips on oily film residue, fall from height (>12 meters)',
          affectedEntities: 'Inspectors',
          initialLikelihood: 3,
          initialConsequence: 4,
          initialRating: 12,
          existingControls: 'Non-slip safety boots, full body safety harness with twin fall arrest lanyards',
          additionalControls: 'Inspection path pre-washed with degreaser and dry-wiped; intrinsically safe high-lumen headlamps',
          residualLikelihood: 1,
          residualConsequence: 3,
          residualRating: 3,
          hierarchy: 'Administrative',
          alarpAchieved: true
        }
      ],
      linkedProcedures: ['SMS-SOP-018: Confined Space Entry Protocol', 'SMS-SOP-024: Gas Testing & Calibration'],
      linkedPermits: ['PTW-2026-0189'],
      status: 'Approved',
      auditTrail: [
        { timestamp: '2026-10-02 11:00', user: 'Chief Officer K. Hansen', role: 'Department Head', action: 'Risk Assessment Drafted' },
        { timestamp: '2026-10-02 16:30', user: 'Capt. H. Miller', role: 'Approver', action: 'Risk Assessment Approved & Authorized' }
      ]
    }
  ]);

  // 7. Permits to Work (PTW)
  readonly permits = signal<PermitToWorkRecord[]>([
    {
      id: 'PTW-01',
      referenceNo: 'PTW-2026-0189',
      permitType: 'Confined Space Entry',
      vesselId: 'VES-02',
      vesselName: 'MT Nordic Titan',
      worksiteLocation: 'Cargo Tank 3 Port (Wing Tank)',
      workDescription: 'Ultrasonic thickness gauging and sacrificial sacrificial zinc anode condition assessment',
      startDateTime: '2026-10-05 08:00',
      expiryDateTime: '2026-10-05 16:00',
      validityHours: 8,
      performingAuthority: 'Pumpman G. Patel',
      areaAuthority: 'Chief Officer K. Hansen',
      approvingAuthority: 'Capt. H. Miller (Master)',
      linkedRaNumber: 'RA-2026-0057',
      toolboxTalkCompleted: true,
      isolationLotoRequired: true,
      isolationDetails: 'Cargo discharge valve CV-3P and IG inert gas branch valve isolated with mechanical padlock and warning tags.',
      gasTestingRequired: true,
      gasTestReadings: [
        { gasType: 'Oxygen (O2)', reading: '20.9%', safePermissibleRange: '20.8% - 21.0%', testerName: 'Safety Officer A. Roy', timestamp: '2026-10-05 07:30', passed: true },
        { gasType: 'Flammable (LEL)', reading: '0.0%', safePermissibleRange: '< 1% LEL', testerName: 'Safety Officer A. Roy', timestamp: '2026-10-05 07:32', passed: true },
        { gasType: 'Carbon Monoxide (CO)', reading: '0 ppm', safePermissibleRange: '< 25 ppm', testerName: 'Safety Officer A. Roy', timestamp: '2026-10-05 07:33', passed: true },
        { gasType: 'Hydrogen Sulfide (H2S)', reading: '0 ppm', safePermissibleRange: '< 5 ppm', testerName: 'Safety Officer A. Roy', timestamp: '2026-10-05 07:35', passed: true }
      ],
      simopsCheckDone: true,
      simopsNotes: 'No hot work or bunkering operations permitted on port deck during tank entry window.',
      precautionsChecklist: [
        { item: 'Forced ventilation running continuously during entire entry', checked: true },
        { item: 'Dedicated standby crew member stationed at tank entrance with VHF radio', checked: true },
        { item: 'Emergency SCBA, revival apparatus and extraction winch tested on site', checked: true },
        { item: 'Intrinsically safe Ex-rated communication and lighting deployed', checked: true },
        { item: 'Entry log sheet posted at hatch entrance for in/out sign-in', checked: true }
      ],
      status: 'Active',
      auditTrail: [
        { timestamp: '2026-10-04 17:00', user: 'Pumpman G. Patel', role: 'Vessel Crew', action: 'Permit Requested' },
        { timestamp: '2026-10-05 07:45', user: 'Capt. H. Miller', role: 'Approver', action: 'Permit Authorized & Activated' }
      ]
    },
    {
      id: 'PTW-02',
      referenceNo: 'PTW-2026-0190',
      permitType: 'Hot Work (Enclosed/Open)',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      worksiteLocation: 'Workshop Intermediate Level',
      workDescription: 'MIG welding bracket reinforcement on hatch cover lashing bin support frame',
      startDateTime: '2026-10-06 09:00',
      expiryDateTime: '2026-10-06 17:00',
      validityHours: 8,
      performingAuthority: 'Fitter S. Kouris',
      areaAuthority: 'Chief Engineer M. Rossi',
      approvingAuthority: 'Master H. Miller',
      linkedRaNumber: 'RA-2026-0044',
      toolboxTalkCompleted: true,
      isolationLotoRequired: false,
      gasTestingRequired: false,
      gasTestReadings: [],
      simopsCheckDone: true,
      simopsNotes: 'Surrounding combustible materials cleared within 10 meter radius.',
      precautionsChecklist: [
        { item: 'Fire watch standing by with 2x 9L foam extinguisher & charged fire hose', checked: true },
        { item: 'Combustible materials shielded with fire retardant blankets', checked: true },
        { item: 'Fire watch mandatory for 60 minutes after hot work completion', checked: true }
      ],
      status: 'Approved',
      auditTrail: [
        { timestamp: '2026-10-05 10:00', user: 'Fitter S. Kouris', role: 'Vessel Crew', action: 'Permit Submitted' },
        { timestamp: '2026-10-05 11:30', user: 'Master H. Miller', role: 'Approver', action: 'Permit Approved for Tomorrow' }
      ]
    }
  ]);

  // 8. Certificates
  readonly certificates = signal<CertificateRecord[]>([
    {
      id: 'CERT-01',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      certificateName: 'Safety Management Certificate (SMC)',
      certificateNumber: 'SMC-DNV-2021-99812',
      category: 'Statutory',
      issuingAuthority: 'DNV',
      issueDate: '2021-11-15',
      expiryDate: '2026-11-14',
      renewalDueDate: '2026-10-15',
      daysToExpiry: 40,
      status: 'Due Soon',
      responsibleDepartment: 'HSEQ & Compliance',
      attachmentFileName: 'SMC_Pacific_Voyager_DNV.pdf',
      renewalHistory: [
        { renewedDate: '2021-11-15', certNumber: 'SMC-DNV-2021-99812', authority: 'DNV' },
        { renewedDate: '2016-11-20', certNumber: 'SMC-DNV-2016-44120', authority: 'DNV' }
      ]
    },
    {
      id: 'CERT-02',
      vesselId: 'VES-02',
      vesselName: 'MT Nordic Titan',
      certificateName: 'International Oil Pollution Prevention (IOPP)',
      certificateNumber: 'IOPP-LR-88412-B',
      category: 'Statutory',
      issuingAuthority: "Lloyd's Register",
      issueDate: '2023-04-10',
      expiryDate: '2028-04-09',
      renewalDueDate: '2028-03-01',
      daysToExpiry: 550,
      status: 'Valid',
      responsibleDepartment: 'Engine Department',
      attachmentFileName: 'IOPP_Nordic_Titan_LR.pdf',
      renewalHistory: []
    },
    {
      id: 'CERT-03',
      vesselId: 'VES-03',
      vesselName: 'MV Atlantic Pioneer',
      certificateName: 'Document of Compliance (DOC - Company)',
      certificateNumber: 'DOC-ML-2025-001',
      category: 'Flag State',
      issuingAuthority: 'Marshall Islands Registry',
      issueDate: '2025-01-10',
      expiryDate: '2026-10-20',
      renewalDueDate: '2026-09-20',
      daysToExpiry: 15,
      status: 'Due Soon',
      responsibleDepartment: 'HSEQ & Compliance',
      attachmentFileName: 'DOC_Company_MarshallIslands.pdf',
      renewalHistory: []
    },
    {
      id: 'CERT-04',
      vesselId: 'VES-04',
      vesselName: 'MV Arctic Aurora',
      certificateName: 'Maritime Labour Convention Certificate (MLC 2006)',
      certificateNumber: 'MLC-ABS-2021-081',
      category: 'Crew Mandatory',
      issuingAuthority: 'ABS',
      issueDate: '2021-09-01',
      expiryDate: '2026-09-01',
      renewalDueDate: '2026-08-01',
      daysToExpiry: -34,
      status: 'Expired',
      responsibleDepartment: 'HSEQ & Compliance',
      attachmentFileName: 'MLC_Certificate_Expired.pdf',
      renewalHistory: []
    }
  ]);

  // 9. DMS Documents
  readonly dmsDocuments = signal<DmsDocument[]>([
    {
      id: 'DOC-01',
      documentNumber: 'SMS-SOP-018',
      title: 'Enclosed & Confined Space Entry Safe Working Procedure',
      category: 'Standard Operating Procedure (SOP)',
      department: 'HSEQ & Compliance',
      confidentiality: 'Restricted',
      revision: 'Rev 4.2',
      effectiveDate: '2026-01-15',
      nextReviewDate: '2027-01-14',
      documentOwner: 'Capt. R. Sterling',
      status: 'Approved & Issued',
      readAndAcknowledgeRequired: true,
      acknowledgedCount: 88,
      totalRequiredCrew: 100,
      fileSize: '1.4 MB'
    },
    {
      id: 'DOC-02',
      documentNumber: 'SMS-SOP-044',
      title: 'Bunkering Operations & Oil Spill Contingency Plan',
      category: 'Emergency Contingency Plan',
      department: 'Marine Operations',
      confidentiality: 'Restricted',
      revision: 'Rev 5.0',
      effectiveDate: '2026-03-01',
      nextReviewDate: '2027-02-28',
      documentOwner: 'Superintendent D. Vance',
      status: 'Approved & Issued',
      readAndAcknowledgeRequired: true,
      acknowledgedCount: 95,
      totalRequiredCrew: 100,
      fileSize: '3.2 MB'
    },
    {
      id: 'DOC-03',
      documentNumber: 'SMS-POL-003',
      title: 'Fleet Drug and Alcohol Prohibition Policy',
      category: 'Fleet Policy',
      department: 'HSEQ & Compliance',
      confidentiality: 'Public',
      revision: 'Rev 6.1',
      effectiveDate: '2025-06-01',
      nextReviewDate: '2026-11-30',
      documentOwner: 'HSEQ Director',
      status: 'Approved & Issued',
      readAndAcknowledgeRequired: true,
      acknowledgedCount: 100,
      totalRequiredCrew: 100,
      fileSize: '512 KB'
    }
  ]);

  // 10. Management Visits
  readonly managementVisits = signal<ManagementVisitRecord[]>([
    {
      id: 'MVS-01',
      referenceNo: 'MVS-2026-0023',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      portLocation: 'Port of Rotterdam, Netherlands',
      categoryRole: 'Port Captain',
      visitorName: 'Capt. Brian McDonald',
      teamMembers: ['Safety Inspector L. Zhang'],
      plannedDate: '2026-10-12',
      dueDate: '2026-10-15',
      purposeScope: 'Quarterly Superintendent Safety & Navigational Audit (90-day cycle requirement)',
      checklistTemplate: 'Standard Shore Management Vessel Visit Checklist v4',
      findingsCount: 0,
      openCapaCount: 0,
      status: 'Planned',
      executiveSummary: 'Upcoming scheduled visit covering bridge team management, mooring safety and ballast water management compliance.'
    },
    {
      id: 'MVS-02',
      referenceNo: 'MVS-2026-0022',
      vesselId: 'VES-02',
      vesselName: 'MT Nordic Titan',
      portLocation: 'Singapore Anchorage (Eastern Bunkering)',
      categoryRole: 'Port Engineer',
      visitorName: 'Chief Superintendent Alex Petrov',
      teamMembers: ['Automation Specialist K. Wong'],
      plannedDate: '2026-09-18',
      dueDate: '2026-09-20',
      actualCompletedDate: '2026-09-19',
      purposeScope: 'Main engine turbocharger overhaul verification and inert gas generator calibration',
      checklistTemplate: 'Technical & Engineering Superintendent Audit Checklist',
      findingsCount: 3,
      openCapaCount: 1,
      status: 'Completed',
      executiveSummary: 'Technical condition satisfactory. Two housekeeping items rectified on the spot; one CAPA raised for auxiliary boiler damper recalibration.'
    }
  ]);

  // 11. Consolidated Universal CAPA Tracker
  readonly capas = signal<CapaRecord[]>([
    {
      id: 'CAPA-01',
      referenceNo: 'CAPA-2026-0312',
      sourceModule: 'Near Miss',
      sourceReferenceNo: 'NM-2026-0118',
      actionDescription: 'Procure high-visibility braided tag lines with quick-release handles for all manifold crane hoisting operations.',
      actionCategory: 'Physical Safeguard',
      priority: 'High',
      vesselId: 'VES-02',
      vesselName: 'MT Nordic Titan',
      department: 'Deck Department',
      responsiblePerson: 'Chief Officer K. Hansen',
      targetDate: '2026-10-15',
      progressNotes: 'Supplier quotation approved. Delivery scheduled at Singapore bunkering call on Oct 11.',
      status: 'In Progress'
    },
    {
      id: 'CAPA-02',
      referenceNo: 'CAPA-2026-0309',
      sourceModule: 'Incident',
      sourceReferenceNo: 'INC-2026-0031',
      actionDescription: 'Update PMS job card DEC-LSH-04 to mandate ultrasonic non-destructive testing on turnbuckles every 24 months.',
      actionCategory: 'Procedure Update',
      priority: 'Critical',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      department: 'HSEQ & Compliance',
      responsiblePerson: 'Superintendent D. Vance',
      targetDate: '2026-10-08',
      progressNotes: 'Draft PMS amendment prepared and awaiting HSEQ Director electronic signature.',
      status: 'Verification Pending'
    },
    {
      id: 'CAPA-03',
      referenceNo: 'CAPA-2026-0315',
      sourceModule: 'Safe Card',
      sourceReferenceNo: 'SC-2026-0295',
      actionDescription: 'Rewire steering gear flat emergency floodlight with marine-grade armoured flame-retardant cable.',
      actionCategory: 'Engineering Control',
      priority: 'High',
      vesselId: 'VES-02',
      vesselName: 'MT Nordic Titan',
      department: 'Engine Department',
      responsiblePerson: 'Chief Engineer M. Rossi',
      targetDate: '2026-10-10',
      progressNotes: 'Electrician has commenced rewiring work. Cable pulled through bulkhead gland.',
      status: 'In Progress'
    },
    {
      id: 'CAPA-04',
      referenceNo: 'CAPA-2026-0298',
      sourceModule: 'Inspection',
      sourceReferenceNo: 'INS-2026-0040',
      actionDescription: 'Replace uncalibrated oxygen analyzer sensor cells on deck workshop kit.',
      actionCategory: 'Equipment Maintenance',
      priority: 'Medium',
      vesselId: 'VES-03',
      vesselName: 'MV Atlantic Pioneer',
      department: 'Deck Department',
      responsiblePerson: 'Safety Officer S. Chen',
      targetDate: '2026-09-25',
      revisedDate: '2026-10-02',
      extensionJustification: 'Customs customs clearance delay in Port Kelang.',
      progressNotes: 'New sensor cells received, installed and bump test record attached.',
      completionEvidence: 'Calibration_Certificate_O2_Sensor.pdf',
      status: 'Closed',
      verifiedBy: 'Capt. R. Sterling (HSEQ Officer)',
      closedDate: '2026-10-03'
    }
  ]);

  // Computed KPIs for Dashboard
  readonly dashboardKpis = computed<DashboardKpis>(() => {
    const allInspections = this.inspections();
    const allNearMiss = this.nearMisses();
    const allIncidents = this.incidents();
    const allInjuries = this.injuries();
    const allCards = this.safeCards();
    const allCerts = this.certificates();
    const allCapas = this.capas();
    const allPermits = this.permits();
    const allVisits = this.managementVisits();

    const openFindings = allInspections.flatMap(i => i.findings).filter(f => f.status !== 'Closed').length;
    const criticalFindings = allInspections.flatMap(i => i.findings).filter(f => f.severity === 'Critical' || f.severity === 'High').length;
    const safeActs = allCards.filter(c => c.type === 'Safe Act' || c.type === 'Positive Observation').length;
    const validCerts = allCerts.filter(c => c.status === 'Valid').length;
    const certsValidPct = Math.round((validCerts / (allCerts.length || 1)) * 100);
    const expiringCerts = allCerts.filter(c => c.status === 'Due Soon').length;
    const expiredCerts = allCerts.filter(c => c.status === 'Expired').length;
    const openCapasCount = allCapas.filter(c => c.status !== 'Closed').length;
    const overdueCapasCount = allCapas.filter(c => c.status === 'Overdue').length;

    return {
      totalInspections: allInspections.length,
      inspectionComplianceRate: 94,
      openFindingsCount: openFindings,
      criticalFindingsCount: criticalFindings,
      nearMissCount: allNearMiss.length,
      incidentsCount: allIncidents.length,
      injuryLtiCount: allInjuries.filter(i => i.severityClassification === 'Lost Time Injury (LTI)').length,
      safeCardsCount: allCards.length,
      safeActsRatio: Math.round((safeActs / (allCards.length || 1)) * 100),
      activePermitsCount: allPermits.filter(p => p.status === 'Active').length,
      certificatesValidPercentage: certsValidPct,
      certificatesExpiring30Days: expiringCerts,
      certificatesExpired: expiredCerts,
      openCapas: openCapasCount,
      overdueCapas: overdueCapasCount,
      capaOnTimeClosureRate: 92,
      plannedVisitsCompletedRate: 85
    };
  });

  // State actions
  setUserRole(role: UserRole) {
    this.currentUserRole.set(role);
  }

  setVesselFilter(vesselId: string) {
    this.selectedVesselFilter.set(vesselId);
  }

  setSearchQuery(q: string) {
    this.searchQuery.set(q);
  }

  addSafeCard(card: Omit<SafeCardRecord, 'id' | 'referenceNo' | 'auditTrail'>) {
    const count = this.safeCards().length + 1;
    const ref = `SC-2026-0${300 + count}`;
    const newRecord: SafeCardRecord = {
      ...card,
      id: `SC-${count}`,
      referenceNo: ref,
      auditTrail: [{
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user: this.currentUserRole(),
        role: this.currentUserRole(),
        action: 'Safety Observation Created'
      }]
    };
    this.safeCards.update(list => [newRecord, ...list]);
    return newRecord;
  }

  updateCapaStatus(id: string, newStatus: CapaRecord['status'], progressNotes?: string) {
    this.capas.update(list => list.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: newStatus,
          progressNotes: progressNotes || c.progressNotes,
          verifiedBy: newStatus === 'Closed' ? `${this.currentUserRole()}` : c.verifiedBy,
          closedDate: newStatus === 'Closed' ? new Date().toISOString().split('T')[0] : c.closedDate
        };
      }
      return c;
    }));
  }

  updatePermitStatus(id: string, newStatus: PermitToWorkRecord['status']) {
    this.permits.update(list => list.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: newStatus,
          auditTrail: [
            ...p.auditTrail,
            {
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              user: this.currentUserRole(),
              role: this.currentUserRole(),
              action: `Permit transitioned to ${newStatus}`
            }
          ]
        };
      }
      return p;
    }));
  }

  updateInspectionStatus(id: string, newStatus: RecordStatus) {
    this.inspections.update(list => list.map(ins => {
      if (ins.id === id) {
        return {
          ...ins,
          overallStatus: newStatus,
          auditTrail: [
            ...ins.auditTrail,
            {
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              user: this.currentUserRole(),
              role: this.currentUserRole(),
              action: `Inspection updated to ${newStatus}`
            }
          ]
        };
      }
      return ins;
    }));
  }

  updateIncidentStatus(id: string, newStatus: RecordStatus) {
    this.incidents.update(list => list.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status: newStatus,
          auditTrail: [
            ...(inc.auditTrail || []),
            {
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              user: this.currentUserRole(),
              role: this.currentUserRole(),
              action: `Incident updated to ${newStatus}`
            }
          ]
        };
      }
      return inc;
    }));
  }

  // Notification management
  markNotificationRead(id: string) {
    this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAllNotificationsRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  // Authentication simulation
  login(email: string, role: UserRole = 'HSEQ Officer', name: string = 'Capt. R. Sterling', rank: string = 'HSEQ Superintendent') {
    this.isAuthenticated.set(true);
    this.currentUserRole.set(role);
    const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    this.currentUserInfo.set({
      name,
      email,
      rank,
      role,
      avatar: initials
    });
  }

  logout() {
    this.isAuthenticated.set(false);
  }

  // Add methods for all remaining registers to ensure no dead buttons!
  addInspection(data: Partial<InspectionRecord>) {
    const count = this.inspections().length + 1;
    const refNo = `INS-2026-00${45 + count}`;
    const newRecord: InspectionRecord = {
      id: `INS-0${count + 2}`,
      referenceNo: refNo,
      vesselId: data.vesselId || 'VES-01',
      vesselName: data.vesselName || 'MV Pacific Voyager',
      department: data.department || 'Deck Department',
      location: data.location || 'Main Deck & Cargo Holds',
      inspectionDate: data.inspectionDate || new Date().toISOString().split('T')[0],
      inspectionType: data.inspectionType || 'Internal ISM Audit',
      leadInspector: data.leadInspector || `${this.currentUserInfo().name} (Auditor)`,
      teamMembers: data.teamMembers || ['Chief Officer', 'Bosun'],
      findings: data.findings || [],
      overallStatus: 'Action Pending',
      escalated: false,
      scorePercentage: data.scorePercentage || 92,
      attachments: [],
      auditTrail: [{
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user: this.currentUserInfo().name,
        role: this.currentUserRole(),
        action: 'Inspection Audit Logged'
      }]
    };
    this.inspections.update(list => [newRecord, ...list]);
    return newRecord;
  }

  getNearMissById(id: string): NearMissRecord | undefined {
    return this.nearMissStore.getById(id);
  }

  addNearMiss(data: Partial<NearMissRecord>): NearMissRecord {
    return this.nearMissStore.create(data);
  }

  updateNearMiss(id: string, updates: Partial<NearMissRecord>): void {
    this.nearMissStore.update(id, updates);
  }

  deleteNearMiss(id: string): void {
    this.nearMissStore.delete(id);
  }

  addIncident(data: Partial<IncidentRecord>) {
    const count = this.incidents().length + 1;
    const refNo = `INC-2026-00${12 + count}`;
    const newRecord: IncidentRecord = {
      id: `INC-0${count + 1}`,
      referenceNo: refNo,
      vesselId: data.vesselId || 'VES-01',
      vesselName: data.vesselName || 'MV Pacific Voyager',
      department: data.department || 'Engine Department',
      location: data.location || 'Engine Room Flat',
      dateTime: data.dateTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
      classification: data.classification || 'Equipment Breakdown',
      description: data.description || 'Reported marine event under 5-why root cause investigation.',
      immediateResponse: data.immediateResponse || 'System isolated, containment deployed.',
      actualSeverity: data.actualSeverity || 'Medium',
      potentialSeverity: data.potentialSeverity || 'High',
      escalationRequired: data.escalationRequired || false,
      investigationTeam: ['Chief Engineer', 'HSEQ Superintendent'],
      fiveWhyAnalysis: {
        why1: 'Equipment failed during operation',
        why2: 'Operating pressure exceeded tolerance',
        why3: 'Filter screen partially clogged',
        why4: 'Inspection interval not updated in PMS',
        rootCause: 'Preventive maintenance schedule synchronization error'
      },
      capaIds: [`CAPA-2026-0${104 + count}`],
      finalReviewNotes: 'Preliminary investigation in progress.',
      status: 'Under Review',
      attachments: [],
      auditTrail: [{
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user: this.currentUserInfo().name,
        role: this.currentUserRole(),
        action: 'Incident Investigation Logged'
      }]
    };
    this.incidents.update(list => [newRecord, ...list]);
    return newRecord;
  }

  addPermit(data: Partial<PermitToWorkRecord>) {
    const count = this.permits().length + 1;
    const refNo = `PTW-2026-00${90 + count}`;
    const newRecord: PermitToWorkRecord = {
      id: `PTW-0${count + 1}`,
      referenceNo: refNo,
      permitType: data.permitType || 'Hot Work (Enclosed/Open)',
      vesselId: data.vesselId || 'VES-01',
      vesselName: data.vesselName || 'MV Pacific Voyager',
      worksiteLocation: data.worksiteLocation || 'Deck Area Station 3',
      workDescription: data.workDescription || 'Maintenance welding and structural repair.',
      linkedRaNumber: 'RA-2026-0018',
      performingAuthority: data.performingAuthority || 'Bosun D. Silva',
      areaAuthority: 'Chief Engineer M. Rossi',
      approvingAuthority: data.approvingAuthority || 'Chief Officer K. Hansen',
      validityHours: data.validityHours || 8,
      startDateTime: data.startDateTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
      expiryDateTime: data.expiryDateTime || '2026-10-06 18:00',
      toolboxTalkCompleted: true,
      isolationLotoRequired: data.isolationLotoRequired || false,
      gasTestingRequired: data.gasTestingRequired || false,
      gasTestReadings: [],
      simopsCheckDone: true,
      precautionsChecklist: [{ item: 'Area inspected & verified clear of fire risks', checked: true }],
      status: 'Active',
      auditTrail: [{
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user: this.currentUserInfo().name,
        role: this.currentUserRole(),
        action: 'Permit Authorized and Activated'
      }]
    };
    this.permits.update(list => [newRecord, ...list]);
    return newRecord;
  }

  addRiskAssessment(data: Partial<RiskAssessmentRecord>) {
    const count = this.riskAssessments().length + 1;
    const refNo = `RA-2026-00${20 + count}`;
    const newRecord: RiskAssessmentRecord = {
      id: `RA-0${count + 1}`,
      referenceNo: refNo,
      activityTitle: data.activityTitle || 'New Marine Operation Risk Assessment',
      vesselId: data.vesselId || 'VES-01',
      vesselName: data.vesselName || 'MV Pacific Voyager',
      department: data.department || 'Deck Department',
      assessmentType: 'Non-Routine High Risk',
      assessmentDate: new Date().toISOString().split('T')[0],
      validityExpiryDate: '2027-10-05',
      leadAssessor: `${this.currentUserInfo().name}`,
      teamMembers: ['Chief Officer', 'Bosun'],
      approver: 'Capt. R. Sterling (Master/Superintendent)',
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Pre-operational safety briefing and tool verification',
          hazards: 'Misunderstanding of work scope, defective tools',
          affectedEntities: 'Deck Personnel',
          initialLikelihood: 3,
          initialConsequence: 3,
          initialRating: 9,
          existingControls: 'Certified safety gear, calibrated tools',
          additionalControls: 'Toolbox talk conducted; all safety gear signed off',
          residualLikelihood: 1,
          residualConsequence: 2,
          residualRating: 2,
          hierarchy: 'Administrative',
          alarpAchieved: true
        }
      ],
      maxInitialRisk: 'Medium',
      maxResidualRisk: 'Low',
      linkedProcedures: ['SMS-SOP-01'],
      linkedPermits: ['PTW-01'],
      status: 'Active',
      auditTrail: [{
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user: this.currentUserInfo().name,
        role: this.currentUserRole(),
        action: 'Risk Assessment Approved'
      }]
    };
    this.riskAssessments.update(list => [newRecord, ...list]);
    return newRecord;
  }

  addInjury(data: Partial<InjuryRecord>) {
    const count = this.injuries().length + 1;
    const refNo = `INJ-2026-00${15 + count}`;
    const newRecord: InjuryRecord = {
      id: `INJ-0${count + 1}`,
      referenceNo: refNo,
      vesselId: data.vesselId || 'VES-01',
      vesselName: data.vesselName || 'MV Pacific Voyager',
      location: data.location || 'Forward Deck',
      workActivity: 'Mooring operations & line handling',
      dateTime: data.dateTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
      injuredPersonName: data.injuredPersonName || 'Crew Member',
      rank: data.rank || 'Ordinary Seaman (OS)',
      severityClassification: data.severityClassification || 'First Aid Case (FAC)',
      injuryType: 'Laceration / Cut',
      affectedBodyPart: 'Hand / Fingers',
      treatmentDetails: 'Cleaned with antiseptic dressing applied in ship hospital.',
      daysLost: data.daysLost || 0,
      restrictedDays: data.restrictedDays || 0,
      returnToWorkStatus: data.returnToWorkStatus || 'Full Duty Resumed',
      status: 'Closed',
      attachments: [],
      auditTrail: [{
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user: this.currentUserInfo().name,
        role: this.currentUserRole(),
        action: 'Injury Record Filed'
      }]
    };
    this.injuries.update(list => [newRecord, ...list]);
    return newRecord;
  }

  addManagementVisit(data: Partial<ManagementVisitRecord>) {
    const count = this.managementVisits().length + 1;
    const refNo = `VIS-2026-00${10 + count}`;
    const newRecord: ManagementVisitRecord = {
      id: `VIS-0${count + 1}`,
      referenceNo: refNo,
      vesselId: data.vesselId || 'VES-01',
      vesselName: data.vesselName || 'MV Pacific Voyager',
      portLocation: data.portLocation || 'Port of Singapore',
      categoryRole: data.categoryRole || 'Port Captain',
      visitorName: data.visitorName || `${this.currentUserInfo().name}`,
      teamMembers: ['Safety Superintendent'],
      plannedDate: data.plannedDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || '2026-11-15',
      actualCompletedDate: undefined,
      purposeScope: data.purposeScope || 'Routine ISM Management Oversight & Safety Walkaround',
      checklistTemplate: data.checklistTemplate || 'Standard 90-Day Marine Visit Protocol',
      findingsCount: 0,
      openCapaCount: 0,
      status: 'Planned'
    };
    this.managementVisits.update(list => [newRecord, ...list]);
    return newRecord;
  }

  addDmsDocument(data: Partial<DmsDocument>) {
    const count = this.dmsDocuments().length + 1;
    const docNo = `SMS-SOP-0${10 + count}`;
    const newRecord: DmsDocument = {
      id: `DMS-0${count + 1}`,
      documentNumber: docNo,
      title: data.title || 'Marine Operating Safety Procedure',
      category: 'Standard Operating Procedure (SOP)',
      department: 'HSEQ & Compliance',
      revision: data.revision || 'Rev 1.0',
      effectiveDate: new Date().toISOString().split('T')[0],
      nextReviewDate: '2027-10-05',
      confidentiality: 'Restricted',
      documentOwner: 'Capt. R. Sterling (HSEQ)',
      readAndAcknowledgeRequired: data.readAndAcknowledgeRequired ?? true,
      acknowledgedCount: 0,
      totalRequiredCrew: 24,
      status: 'Approved & Issued',
      fileSize: '1.8 MB'
    };
    this.dmsDocuments.update(list => [newRecord, ...list]);
    return newRecord;
  }

  acknowledgeDms(docId: string) {
    this.dmsDocuments.update(list => list.map(doc => {
      if (doc.id === docId) {
        const newCount = Math.min(doc.totalRequiredCrew, doc.acknowledgedCount + 1);
        return {
          ...doc,
          acknowledgedCount: newCount
        };
      }
      return doc;
    }));
  }

  // ==========================================================
  // MASTER DATA MANAGEMENT METHODS
  // ==========================================================

  // Vessels
  addVessel(vessel: Vessel) {
    this.vessels.update(list => [...list, vessel]);
  }

  updateVessel(vessel: Vessel) {
    this.vessels.update(list => list.map(v => v.id === vessel.id ? vessel : v));
  }

  deleteVessel(id: string) {
    this.vessels.update(list => list.filter(v => v.id !== id));
  }

  // Vessel Types
  addVesselType(vt: VesselTypeItem) {
    this.vesselTypes.update(list => [...list, vt]);
  }

  updateVesselType(vt: VesselTypeItem) {
    this.vesselTypes.update(list => list.map(item => item.id === vt.id ? vt : item));
  }

  deleteVesselType(id: string) {
    this.vesselTypes.update(list => list.filter(item => item.id !== id));
  }

  // Ports & Locations
  addPort(port: PortItem) {
    this.ports.update(list => [...list, port]);
  }

  updatePort(port: PortItem) {
    this.ports.update(list => list.map(item => item.id === port.id ? port : item));
  }

  deletePort(id: string) {
    this.ports.update(list => list.filter(item => item.id !== id));
  }

  // Departments
  addDepartment(dept: Department) {
    this.departments.update(list => [...list, dept]);
  }

  updateDepartment(department: Department) {
    this.departments.update(list => list.map(d => d.id === department.id ? department : d));
  }

  deleteDepartment(id: string) {
    this.departments.update(list => list.filter(d => d.id !== id));
  }

  // Categories
  addCategory(category: CategoryItem) {
    this.categories.update(list => [...list, category]);
  }

  updateCategory(category: CategoryItem) {
    this.categories.update(list => list.map(c => c.id === category.id ? category : c));
  }

  deleteCategory(id: string) {
    this.categories.update(list => list.filter(c => c.id !== id));
  }

  // Inspectors & Auditors
  addInspector(inspector: InspectorItem) {
    this.inspectors.update(list => [...list, inspector]);
  }

  updateInspector(inspector: InspectorItem) {
    this.inspectors.update(list => list.map(i => i.id === inspector.id ? inspector : i));
  }

  deleteInspector(id: string) {
    this.inspectors.update(list => list.filter(i => i.id !== id));
  }

  // Bulk Master Data Import Handler
  bulkImportMasterData(data: {
    vessels?: Vessel[];
    ports?: PortItem[];
    departments?: Department[];
    categories?: CategoryItem[];
    inspectors?: InspectorItem[];
  }) {
    if (data.vessels && data.vessels.length > 0) {
      this.vessels.update(list => {
        const existingIds = new Set(list.map(v => v.name.toLowerCase()));
        const newOnes = data.vessels!.filter(v => !existingIds.has(v.name.toLowerCase()));
        return [...list, ...newOnes];
      });
    }
    if (data.ports && data.ports.length > 0) {
      this.ports.update(list => {
        const existingCodes = new Set(list.map(p => p.code.toLowerCase()));
        const newOnes = data.ports!.filter(p => !existingCodes.has(p.code.toLowerCase()));
        return [...list, ...newOnes];
      });
    }
    if (data.departments && data.departments.length > 0) {
      this.departments.update(list => {
        const existingNames = new Set(list.map(d => d.name.toLowerCase()));
        const newOnes = data.departments!.filter(d => !existingNames.has(d.name.toLowerCase()));
        return [...list, ...newOnes];
      });
    }
    if (data.categories && data.categories.length > 0) {
      this.categories.update(list => {
        const existingNames = new Set(list.map(c => c.name.toLowerCase()));
        const newOnes = data.categories!.filter(c => !existingNames.has(c.name.toLowerCase()));
        return [...list, ...newOnes];
      });
    }
    if (data.inspectors && data.inspectors.length > 0) {
      this.inspectors.update(list => {
        const existingNames = new Set(list.map(i => i.name.toLowerCase()));
        const newOnes = data.inspectors!.filter(i => !existingNames.has(i.name.toLowerCase()));
        return [...list, ...newOnes];
      });
    }
  }
}

