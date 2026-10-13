import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { NearMissStore } from '../stores/near-miss.store';
import { 
  UserRole, Vessel, Department, InspectionRecord, NearMissRecord, IncidentRecord,
  InjuryRecord, SafeCardRecord, RiskAssessmentRecord, PermitToWorkRecord, CertificateRecord,
  DmsDocument, ManagementVisitRecord, CapaRecord, DashboardKpis, RecordStatus, FleetNotification,
  VesselTypeItem, PortItem, CategoryItem, InspectorItem, PtwChecklistTemplate, PtwChecklistItem,
  PermitTypeItem, PermitTypeSectionsConfig, LikelihoodLetter, SeverityLevel, MarineRiskFactor,
  RiskAssessmentTeamMember, RiskAssessmentStep, RiskApprovalRule, VesselCrewMember,
  RiskLevel, ProjectItem, SystemUser, MasterListType, MasterListItem, RiskLikelihoodConfig,
  RiskSeverityConfig, RiskBandConfig, RiskMatrixConfig, WorkflowStageItem, WorkflowEscalationRule,
  NotificationThresholdTemplate, BulkImportRowError, BulkImportResult
} from '../models/hseq.models';

export function calculateMarineRiskFactor(likelihood: LikelihoodLetter, severity: SeverityLevel): MarineRiskFactor {
  const matrix: Record<SeverityLevel, Record<LikelihoodLetter, MarineRiskFactor>> = {
    'I':   { 'A': 'High',     'B': 'High',     'C': 'High',     'D': 'High',     'E': 'Moderate' },
    'II':  { 'A': 'High',     'B': 'High',     'C': 'High',     'D': 'Moderate', 'E': 'Moderate' },
    'III': { 'A': 'High',     'B': 'High',     'C': 'Moderate', 'D': 'Moderate', 'E': 'Low' },
    'IV':  { 'A': 'High',     'B': 'Moderate', 'C': 'Moderate', 'D': 'Low',      'E': 'Low' },
    'V':   { 'A': 'Moderate', 'B': 'Moderate', 'C': 'Low',      'D': 'Low',      'E': 'Low' }
  };
  return matrix[severity]?.[likelihood] || 'Moderate';
}

export const CREW_STORAGE_KEY = 'hseq-crew-members-v2';
export const RISK_RULES_STORAGE_KEY = 'hseq-risk-approval-rules-v2';
export const PROJECTS_STORAGE_KEY = 'hseq-projects-v1';
export const USERS_STORAGE_KEY = 'hseq-system-users-v1';
export const MASTER_LISTS_STORAGE_KEY = 'hseq-master-lists-v1';
export const RISK_MATRIX_STORAGE_KEY = 'hseq-risk-matrix-config-v1';
export const WORKFLOW_RULES_STORAGE_KEY = 'hseq-workflow-escalation-rules-v1';
export const NOTIFICATION_TEMPLATES_STORAGE_KEY = 'hseq-notification-templates-v1';

export const INITIAL_CREW_MEMBERS: VesselCrewMember[] = [
  // MV Pacific Voyager (VES-01) Complement
  { id: 'CRW-PV-01', employeeId: 'EMP-PV-01', name: 'Capt. Robert Sterling', rank: 'Master', department: 'Deck Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-88201', nationality: 'British', email: 'r.sterling@pacific-voyager.com', phone: '+44 7700 900101', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-PV-02', employeeId: 'EMP-PV-02', name: 'Chief Officer K. Hansen', rank: 'Chief Officer', department: 'Deck Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-77142', nationality: 'Danish', email: 'k.hansen@pacific-voyager.com', phone: '+45 20 12 34 56', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-PV-03', employeeId: 'EMP-PV-03', name: 'Chief Engineer M. Rossi', rank: 'Chief Engineer', department: 'Engine Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-66419', nationality: 'Italian', email: 'm.rossi@pacific-voyager.com', phone: '+39 02 6789 0123', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-PV-04', employeeId: 'EMP-PV-04', name: 'Second Officer Liam Gallagher', rank: 'Second Officer', department: 'Deck Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-55320', nationality: 'Irish', email: 'l.gallagher@pacific-voyager.com', phone: '+353 1 234 5678', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-PV-05', employeeId: 'EMP-PV-05', name: 'Second Engineer J. Kowalski', rank: 'Second Engineer', department: 'Engine Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-99812', nationality: 'Polish', email: 'j.kowalski@pacific-voyager.com', phone: '+48 22 123 4567', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-PV-06', employeeId: 'EMP-PV-06', name: 'Bosun D. Silva', rank: 'Bosun', department: 'Deck Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-44120', nationality: 'Filipino', email: 'd.silva@pacific-voyager.com', phone: '+63 2 8123 4567', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-PV-07', employeeId: 'EMP-PV-07', name: 'AB Seaman S. Gomez', rank: 'Able Seaman (AB)', department: 'Deck Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-33104', nationality: 'Filipino', email: 's.gomez@pacific-voyager.com', phone: '+63 2 8234 5678', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-PV-08', employeeId: 'EMP-PV-08', name: 'AB Seaman Tariq Al-Hassan', rank: 'Able Seaman (AB)', department: 'Deck Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-33108', nationality: 'Egyptian', email: 't.alhassan@pacific-voyager.com', phone: '+20 2 2345 6789', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-PV-09', employeeId: 'EMP-PV-09', name: 'Electrician L. Chen', rank: 'Electrician', department: 'Engine Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-22998', nationality: 'Singaporean', email: 'l.chen@pacific-voyager.com', phone: '+65 6123 4567', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-PV-10', employeeId: 'EMP-PV-10', name: 'Fitter A. Morales', rank: 'Fitter', department: 'Engine Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-22871', nationality: 'Filipino', email: 'a.morales@pacific-voyager.com', phone: '+63 2 8345 6789', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-PV-11', employeeId: 'EMP-PV-11', name: 'Chief Cook A. Sharma', rank: 'Chief Cook', department: 'Catering & Galley', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-11002', nationality: 'Indian', email: 'a.sharma@pacific-voyager.com', phone: '+91 22 2345 6789', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-PV-12', employeeId: 'EMP-PV-12', name: 'Oiler P. Santos', rank: 'Oiler / Motorman', department: 'Engine Department', vesselId: 'VES-01', vesselName: 'MV Pacific Voyager', seafarerId: 'SB-11984', nationality: 'Filipino', email: 'p.santos@pacific-voyager.com', phone: '+63 2 8456 7890', watchkeeper: true, status: 'Onboard' },

  // MT Nordic Titan (VES-02) Complement
  { id: 'CRW-NT-01', employeeId: 'EMP-NT-01', name: 'Capt. Henrik Miller', rank: 'Master', department: 'Deck Department', vesselId: 'VES-02', vesselName: 'MT Nordic Titan', seafarerId: 'SB-91021', nationality: 'Norwegian', email: 'h.miller@nordic-titan.com', phone: '+47 21 00 11 22', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-NT-02', employeeId: 'EMP-NT-02', name: 'Chief Officer S. Petroff', rank: 'Chief Officer', department: 'Deck Department', vesselId: 'VES-02', vesselName: 'MT Nordic Titan', seafarerId: 'SB-81044', nationality: 'Bulgarian', email: 's.petroff@nordic-titan.com', phone: '+359 2 912 3456', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-NT-03', employeeId: 'EMP-NT-03', name: 'Chief Engineer Viktor Volkov', rank: 'Chief Engineer', department: 'Engine Department', vesselId: 'VES-02', vesselName: 'MT Nordic Titan', seafarerId: 'SB-71900', nationality: 'Latvian', email: 'v.volkov@nordic-titan.com', phone: '+371 67 123 456', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-NT-04', employeeId: 'EMP-NT-04', name: 'Pumpman G. Patel', rank: 'Pumpman', department: 'Deck Department', vesselId: 'VES-02', vesselName: 'MT Nordic Titan', seafarerId: 'SB-61552', nationality: 'Indian', email: 'g.patel@nordic-titan.com', phone: '+91 22 3456 7890', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-NT-05', employeeId: 'EMP-NT-05', name: 'Bosun Tomas Ramos', rank: 'Bosun', department: 'Deck Department', vesselId: 'VES-02', vesselName: 'MT Nordic Titan', seafarerId: 'SB-51441', nationality: 'Spanish', email: 't.ramos@nordic-titan.com', phone: '+34 91 123 4567', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-NT-06', employeeId: 'EMP-NT-06', name: 'AB Seaman Carlos Reyes', rank: 'Able Seaman (AB)', department: 'Deck Department', vesselId: 'VES-02', vesselName: 'MT Nordic Titan', seafarerId: 'SB-41229', nationality: 'Filipino', email: 'c.reyes@nordic-titan.com', phone: '+63 2 8567 8901', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-NT-07', employeeId: 'EMP-NT-07', name: 'Second Engineer Dmitry Sokolov', rank: 'Second Engineer', department: 'Engine Department', vesselId: 'VES-02', vesselName: 'MT Nordic Titan', seafarerId: 'SB-31008', nationality: 'Ukrainian', email: 'd.sokolov@nordic-titan.com', phone: '+380 44 123 4567', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-NT-08', employeeId: 'EMP-NT-08', name: 'Chief Cook Manuel Diaz', rank: 'Chief Cook', department: 'Catering & Galley', vesselId: 'VES-02', vesselName: 'MT Nordic Titan', seafarerId: 'SB-21045', nationality: 'Mexican', email: 'm.diaz@nordic-titan.com', phone: '+52 55 1234 5678', watchkeeper: false, status: 'Onboard' },

  // MV Atlantic Pioneer (VES-03) Complement
  { id: 'CRW-AP-01', employeeId: 'EMP-AP-01', name: 'Capt. Erik Lindqvist', rank: 'Master', department: 'Deck Department', vesselId: 'VES-03', vesselName: 'MV Atlantic Pioneer', seafarerId: 'SB-95511', nationality: 'Swedish', email: 'e.lindqvist@atlantic-pioneer.com', phone: '+46 8 123 4567', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-AP-02', employeeId: 'EMP-AP-02', name: 'Chief Officer Nikolay Petrov', rank: 'Chief Officer', department: 'Deck Department', vesselId: 'VES-03', vesselName: 'MV Atlantic Pioneer', seafarerId: 'SB-85522', nationality: 'Russian', email: 'n.petrov@atlantic-pioneer.com', phone: '+7 495 123 4567', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-AP-03', employeeId: 'EMP-AP-03', name: 'Chief Engineer Lars Lindstrom', rank: 'Chief Engineer', department: 'Engine Department', vesselId: 'VES-03', vesselName: 'MV Atlantic Pioneer', seafarerId: 'SB-75533', nationality: 'Swedish', email: 'l.lindstrom@atlantic-pioneer.com', phone: '+46 8 234 5678', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-AP-04', employeeId: 'EMP-AP-04', name: 'Bosun Paolo Cruz', rank: 'Bosun', department: 'Deck Department', vesselId: 'VES-03', vesselName: 'MV Atlantic Pioneer', seafarerId: 'SB-65544', nationality: 'Filipino', email: 'p.cruz@atlantic-pioneer.com', phone: '+63 2 8678 9012', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-AP-05', employeeId: 'EMP-AP-05', name: 'AB Seaman Juan Dela Cruz', rank: 'Able Seaman (AB)', department: 'Deck Department', vesselId: 'VES-03', vesselName: 'MV Atlantic Pioneer', seafarerId: 'SB-55566', nationality: 'Filipino', email: 'j.delacruz@atlantic-pioneer.com', phone: '+63 2 8789 0123', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-AP-06', employeeId: 'EMP-AP-06', name: 'Fitter Rajesh Rao', rank: 'Fitter', department: 'Engine Department', vesselId: 'VES-03', vesselName: 'MV Atlantic Pioneer', seafarerId: 'SB-45577', nationality: 'Indian', email: 'r.rao@atlantic-pioneer.com', phone: '+91 22 4567 8901', watchkeeper: false, status: 'Onboard' },

  // AHTS Ocean Guardian (VES-04) Complement
  { id: 'CRW-OG-01', employeeId: 'EMP-OG-01', name: 'Capt. David Vance', rank: 'Master', department: 'Deck Department', vesselId: 'VES-04', vesselName: 'AHTS Ocean Guardian', seafarerId: 'SB-97701', nationality: 'Scottish', email: 'd.vance@ocean-guardian.com', phone: '+44 141 123 4567', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-OG-02', employeeId: 'EMP-OG-02', name: 'Chief Officer Alan Walker', rank: 'Chief Officer', department: 'Deck Department', vesselId: 'VES-04', vesselName: 'AHTS Ocean Guardian', seafarerId: 'SB-87702', nationality: 'British', email: 'a.walker@ocean-guardian.com', phone: '+44 141 234 5678', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-OG-03', employeeId: 'EMP-OG-03', name: 'Chief Engineer Sean O’Connor', rank: 'Chief Engineer', department: 'Engine Department', vesselId: 'VES-04', vesselName: 'AHTS Ocean Guardian', seafarerId: 'SB-77703', nationality: 'Irish', email: 's.oconnor@ocean-guardian.com', phone: '+353 1 345 6789', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-OG-04', employeeId: 'EMP-OG-04', name: 'Bosun Ramon Aquino', rank: 'Bosun', department: 'Deck Department', vesselId: 'VES-04', vesselName: 'AHTS Ocean Guardian', seafarerId: 'SB-67704', nationality: 'Filipino', email: 'r.aquino@ocean-guardian.com', phone: '+63 2 8890 1234', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-OG-05', employeeId: 'EMP-OG-05', name: 'AB Seaman Kenji Sato', rank: 'Able Seaman (AB)', department: 'Deck Department', vesselId: 'VES-04', vesselName: 'AHTS Ocean Guardian', seafarerId: 'SB-57705', nationality: 'Japanese', email: 'k.sato@ocean-guardian.com', phone: '+81 3 1234 5678', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-OG-06', employeeId: 'EMP-OG-06', name: 'Electrician Marko Ivanovic', rank: 'Electrician', department: 'Engine Department', vesselId: 'VES-04', vesselName: 'AHTS Ocean Guardian', seafarerId: 'SB-47706', nationality: 'Croatian', email: 'm.ivanovic@ocean-guardian.com', phone: '+385 1 123 4567', watchkeeper: false, status: 'Onboard' },

  // PSV Crest Horizon (VES-05) Complement
  { id: 'CRW-CH-01', employeeId: 'EMP-CH-01', name: 'Capt. Laurent Bonelli', rank: 'Master', department: 'Deck Department', vesselId: 'VES-05', vesselName: 'PSV Crest Horizon', seafarerId: 'SB-93311', nationality: 'French', email: 'l.bonelli@crest-horizon.com', phone: '+33 1 23 45 67 89', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-CH-02', employeeId: 'EMP-CH-02', name: 'Chief Officer Daniel Larson', rank: 'Chief Officer', department: 'Deck Department', vesselId: 'VES-05', vesselName: 'PSV Crest Horizon', seafarerId: 'SB-83322', nationality: 'American', email: 'd.larson@crest-horizon.com', phone: '+1 713 555 0123', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-CH-03', employeeId: 'EMP-CH-03', name: 'Chief Engineer Jean Dupont', rank: 'Chief Engineer', department: 'Engine Department', vesselId: 'VES-05', vesselName: 'PSV Crest Horizon', seafarerId: 'SB-73333', nationality: 'French', email: 'j.dupont@crest-horizon.com', phone: '+33 1 34 56 78 90', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-CH-04', employeeId: 'EMP-CH-04', name: 'Bosun Mateo Fernandez', rank: 'Bosun', department: 'Deck Department', vesselId: 'VES-05', vesselName: 'PSV Crest Horizon', seafarerId: 'SB-63344', nationality: 'Filipino', email: 'm.fernandez@crest-horizon.com', phone: '+63 2 8901 2345', watchkeeper: false, status: 'Onboard' },
  { id: 'CRW-CH-05', employeeId: 'EMP-CH-05', name: 'AB Seaman Aris Bautista', rank: 'Able Seaman (AB)', department: 'Deck Department', vesselId: 'VES-05', vesselName: 'PSV Crest Horizon', seafarerId: 'SB-53355', nationality: 'Filipino', email: 'a.bautista@crest-horizon.com', phone: '+63 2 8912 3456', watchkeeper: true, status: 'Onboard' },
  { id: 'CRW-CH-06', employeeId: 'EMP-CH-06', name: 'Chief Cook Somchai Prasert', rank: 'Chief Cook', department: 'Catering & Galley', vesselId: 'VES-05', vesselName: 'PSV Crest Horizon', seafarerId: 'SB-43366', nationality: 'Thai', email: 's.prasert@crest-horizon.com', phone: '+66 2 123 4567', watchkeeper: false, status: 'Onboard' }
];

export const INITIAL_RISK_APPROVAL_RULES: RiskApprovalRule[] = [
  {
    id: 'RULE-LOW',
    riskLevel: 'Low',
    requiredRole: 'Supervisor / Watch Officer',
    escalationRequired: false,
    escalatedToRole: 'Supervisor',
    requiresDualSignOff: false,
    minReviewFrequencyDays: 365,
    approvalRequired: 'Mandatory',
    status: 'Active'
  },
  {
    id: 'RULE-MOD',
    riskLevel: 'Moderate',
    requiredRole: 'Department Head (C/O / C/E)',
    escalationRequired: false,
    escalatedToRole: 'Department Head',
    requiresDualSignOff: false,
    minReviewFrequencyDays: 180,
    approvalRequired: 'Mandatory',
    status: 'Active'
  },
  {
    id: 'RULE-HIGH',
    riskLevel: 'High',
    requiredRole: 'HSEQ Manager / Superintendent',
    escalationRequired: true,
    escalatedToRole: 'Master + HSEQ Manager',
    requiresDualSignOff: false,
    minReviewFrequencyDays: 90,
    approvalRequired: 'Mandatory',
    status: 'Active'
  },
  {
    id: 'RULE-CRIT',
    riskLevel: 'Critical',
    requiredRole: 'Master & HSEQ Manager (Dual Sign-Off)',
    escalationRequired: true,
    escalatedToRole: 'Executive Management',
    requiresDualSignOff: true,
    dualSignOffRole: 'Master & HSEQ Manager',
    minReviewFrequencyDays: 30,
    approvalRequired: 'Mandatory',
    status: 'Active'
  }
];

export const INITIAL_PROJECTS: ProjectItem[] = [
  { id: 'PRJ-01', code: 'PRJ-SA-SAF', name: 'Aramco Safaniya Field Support', client: 'Saudi Aramco', vesselId: 'VES-04', vesselName: 'AHTS Ocean Guardian', startDate: '2026-01-15', endDate: '2026-12-31', status: 'Active', description: 'Offshore support & anchor handling operations in Safaniya field' },
  { id: 'PRJ-02', code: 'PRJ-AD-RIG', name: 'ADNOC Offshore Rig Towage', client: 'ADNOC Offshore', vesselId: 'VES-05', vesselName: 'PSV Crest Horizon', startDate: '2026-02-01', endDate: '2026-11-30', status: 'Active', description: 'Platform supply and cargo transport to Upper Zakum field' },
  { id: 'PRJ-03', code: 'PRJ-ST-CAB', name: 'Red Sea Subsea Cable Installation', client: 'Subsea 7 / Saudi Telecom', vesselId: 'VES-06', vesselName: 'AHTS Gulf Sentinel', startDate: '2026-03-10', endDate: '2026-08-30', status: 'Active', description: 'ROV survey and deepwater fiber cable positioning support' },
  { id: 'PRJ-04', code: 'PRJ-QE-LNG', name: 'Ras Laffan LNG Escort & Mooring', client: 'QatarEnergy LNG', vesselId: 'VES-09', vesselName: 'MV Arctic Aurora', startDate: '2026-01-01', endDate: '2027-01-01', status: 'Active', description: 'Dedicated cryogenic LNG carrier transport charter' },
  { id: 'PRJ-05', code: 'PRJ-SB-JUB', name: 'Jubail Industrial Berth Expansion', client: 'SABIC / Mawani', vesselId: 'VES-07', vesselName: 'MV Polaris Star', startDate: '2025-06-01', endDate: '2026-02-28', status: 'Completed', description: 'Heavy lift modular breakbulk cargo discharge' }
];

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'USR-01',
    employeeId: 'EMP-1001',
    fullName: 'K. Hansen',
    email: 'k.hansen@pacific-voyager.com',
    phone: '+45 20 12 34 56',
    roles: ['Lead Assessor', 'Chief Officer'],
    departments: ['Deck Department'],
    assignedVessels: ['MV Pacific Voyager'],
    status: 'Active',
    designation: 'Chief Officer',
    lastLogin: '2026-10-12 08:30'
  },
  {
    id: 'USR-02',
    employeeId: 'EMP-1002',
    fullName: 'Capt. Robert Sterling',
    email: 'r.sterling@pacific-voyager.com',
    phone: '+44 7700 900101',
    roles: ['Master', 'Approver', 'Lead Assessor'],
    departments: ['Deck Department', 'HSEQ & Compliance'],
    assignedVessels: ['MV Pacific Voyager'],
    status: 'Active',
    designation: 'Master Mariner',
    lastLogin: '2026-10-12 09:15'
  },
  {
    id: 'USR-03',
    employeeId: 'EMP-1003',
    fullName: 'Chief Engineer M. Rossi',
    email: 'm.rossi@pacific-voyager.com',
    phone: '+39 02 6789 0123',
    roles: ['Department Head', 'Area Authority', 'Approver'],
    departments: ['Engine Department'],
    assignedVessels: ['MV Pacific Voyager', 'MT Nordic Titan'],
    status: 'Active',
    designation: 'Chief Engineer',
    lastLogin: '2026-10-11 16:40'
  },
  {
    id: 'USR-04',
    employeeId: 'EMP-1004',
    fullName: 'Superintendent D. Vance',
    email: 'd.vance@hseq-fleet.com',
    phone: '+44 141 123 4567',
    roles: ['HSEQ Officer', 'Inspector', 'Lead Assessor', 'Approver'],
    departments: ['HSEQ & Compliance', 'Marine Operations'],
    assignedVessels: ['MV Pacific Voyager', 'MT Nordic Titan', 'MV Atlantic Pioneer', 'AHTS Ocean Guardian', 'PSV Crest Horizon'],
    status: 'Active',
    designation: 'Fleet Marine Superintendent',
    lastLogin: '2026-10-12 07:50'
  },
  {
    id: 'USR-05',
    employeeId: 'EMP-1005',
    fullName: 'Bosun D. Silva',
    email: 'd.silva@pacific-voyager.com',
    phone: '+63 2 8123 4567',
    roles: ['Responsible Supervisor', 'Safety Watch', 'Vessel Crew'],
    departments: ['Deck Department'],
    assignedVessels: ['MV Pacific Voyager'],
    status: 'Active',
    designation: 'Bosun',
    lastLogin: '2026-10-10 12:10'
  },
  {
    id: 'USR-06',
    employeeId: 'EMP-1006',
    fullName: 'Capt. Henrik Miller',
    email: 'h.miller@nordic-titan.com',
    phone: '+47 21 00 11 22',
    roles: ['Master', 'Approver'],
    departments: ['Deck Department'],
    assignedVessels: ['MT Nordic Titan'],
    status: 'Active',
    designation: 'Master Mariner',
    lastLogin: '2026-10-11 19:22'
  },
  {
    id: 'USR-07',
    employeeId: 'EMP-1007',
    fullName: 'Elena Rostova',
    email: 'e.rostova@hseq-fleet.com',
    phone: '+357 25 123456',
    roles: ['HSEQ Admin', 'Approver'],
    departments: ['HSEQ & Compliance'],
    assignedVessels: ['All Fleet Vessels'],
    status: 'Active',
    designation: 'Designated Person Ashore (DPA)',
    lastLogin: '2026-10-12 09:45'
  },
  {
    id: 'USR-08',
    employeeId: 'EMP-1008',
    fullName: 'Tariq Al-Mansoor',
    email: 't.mansoor@hseq-fleet.com',
    phone: '+966 13 888 1234',
    roles: ['Management Executive', 'Approver'],
    departments: ['Marine Operations'],
    assignedVessels: ['All Fleet Vessels'],
    status: 'Active',
    designation: 'Vice President - Marine Operations',
    lastLogin: '2026-10-09 14:00'
  }
];

export const INITIAL_MASTER_LISTS: MasterListItem[] = [
  // Finding Categories (Inspection)
  { id: 'ML-01', listType: 'Finding Categories', code: 'FC-MOOR', name: 'Mooring & Towing Equipment', description: 'Winch drums, fairleads, tow wires, mooring bitts', severityWeight: 'High', status: 'Active', sortOrder: 1 },
  { id: 'ML-02', listType: 'Finding Categories', code: 'FC-FIRE', name: 'Fire Safety & Fixed Systems', description: 'CO2 smothering, fire dampers, foam monitors, SCBA', severityWeight: 'Critical', status: 'Active', sortOrder: 2 },
  { id: 'ML-03', listType: 'Finding Categories', code: 'FC-ENG', name: 'Machinery Space Housekeeping', description: 'Oil leaks, bilge cleanliness, hot spot insulation', severityWeight: 'Medium', status: 'Active', sortOrder: 3 },
  { id: 'ML-04', listType: 'Finding Categories', code: 'FC-LSA', name: 'Lifesaving Appliances (LSA)', description: 'Lifeboats, rescue boats, davits, hydrostatic release units', severityWeight: 'Critical', status: 'Active', sortOrder: 4 },
  { id: 'ML-05', listType: 'Finding Categories', code: 'FC-NAV', name: 'Navigation & Bridge Integration', description: 'ECDIS charts, radar ARPA, magnetic compass deviation', severityWeight: 'High', status: 'Active', sortOrder: 5 },
  { id: 'ML-06', listType: 'Finding Categories', code: 'FC-MARPOL', name: 'Pollution Prevention (MARPOL)', description: 'Oily water separator 15ppm, garbage log, sewage plant', severityWeight: 'Critical', status: 'Active', sortOrder: 6 },

  // Near Miss Categories
  { id: 'ML-10', listType: 'Near Miss Categories', code: 'NM-PINCH', name: 'Pinch Point Hazard', description: 'Unprotected rotating machinery, nip points, hatch edges', severityWeight: 'High', status: 'Active', sortOrder: 1 },
  { id: 'ML-11', listType: 'Near Miss Categories', code: 'NM-DROP', name: 'Dropped Object Risk', description: 'Unsecured tools aloft, overhead crane load swing', severityWeight: 'Critical', status: 'Active', sortOrder: 2 },
  { id: 'ML-12', listType: 'Near Miss Categories', code: 'NM-SLIP', name: 'Slip / Trip / Fall', description: 'Wet deck, oil patch, uneven threshold, poor illumination', severityWeight: 'Medium', status: 'Active', sortOrder: 3 },
  { id: 'ML-13', listType: 'Near Miss Categories', code: 'NM-LINE', name: 'Line of Fire Exposure', description: 'Standing within snap-back zone or pressurized hose path', severityWeight: 'High', status: 'Active', sortOrder: 4 },
  { id: 'ML-14', listType: 'Near Miss Categories', code: 'NM-PPE', name: 'Inadequate or Missing PPE', description: 'Operating grinding wheel without face shield / ear defenders', severityWeight: 'Medium', status: 'Active', sortOrder: 5 },

  // Incident Classifications
  { id: 'ML-20', listType: 'Incident Classifications', code: 'IC-HIPO', name: 'High Potential Event (HIPO)', description: 'Event that under slightly different conditions could have caused severe injury or loss', severityWeight: 'Critical', status: 'Active', sortOrder: 1 },
  { id: 'ML-21', listType: 'Incident Classifications', code: 'IC-ASSET', name: 'Asset / Equipment Damage', description: 'Physical damage to hull, machinery, cargo gear, or third-party structure', severityWeight: 'High', status: 'Active', sortOrder: 2 },
  { id: 'ML-22', listType: 'Incident Classifications', code: 'IC-SPILL', name: 'Environmental Spillage (< 1 Bbl)', description: 'Contained bunkering overflow or deck hydraulic hose burst', severityWeight: 'High', status: 'Active', sortOrder: 3 },
  { id: 'ML-23', listType: 'Incident Classifications', code: 'IC-COLL', name: 'Navigation Near Collision / Grounding', description: 'Close-quarters situation breaching CPA threshold', severityWeight: 'Critical', status: 'Active', sortOrder: 4 },

  // Injury Types
  { id: 'ML-30', listType: 'Injury Types', code: 'INJ-FAC', name: 'First Aid Case (FAC)', description: 'Minor scratch, superficial burn or contusion requiring only first aid treatment', severityWeight: 'Low', status: 'Active', sortOrder: 1 },
  { id: 'ML-31', listType: 'Injury Types', code: 'INJ-MTC', name: 'Medical Treatment Case (MTC)', description: 'Injury requiring shore doctor or prescription treatment beyond first aid', severityWeight: 'Medium', status: 'Active', sortOrder: 2 },
  { id: 'ML-32', listType: 'Injury Types', code: 'INJ-RWDC', name: 'Restricted Work Day Case (RWDC)', description: 'Injured crew assigned to modified light duties or alternate watch', severityWeight: 'High', status: 'Active', sortOrder: 3 },
  { id: 'ML-33', listType: 'Injury Types', code: 'INJ-LTI', name: 'Lost Time Injury (LTI)', description: 'Inability to resume normal shift work on subsequent day', severityWeight: 'Critical', status: 'Active', sortOrder: 4 },
  { id: 'ML-34', listType: 'Injury Types', code: 'INJ-FAT', name: 'Fatality', description: 'Work-related loss of life', severityWeight: 'Critical', status: 'Active', sortOrder: 5 },

  // Body Part Lists
  { id: 'ML-40', listType: 'Body Part Lists', code: 'BP-HEAD', name: 'Head & Face', description: 'Skull, forehead, jaw, ears', severityWeight: 'High', status: 'Active', sortOrder: 1 },
  { id: 'ML-41', listType: 'Body Part Lists', code: 'BP-EYE', name: 'Eyes', description: 'Foreign body, chemical splash, UV arc flash', severityWeight: 'High', status: 'Active', sortOrder: 2 },
  { id: 'ML-42', listType: 'Body Part Lists', code: 'BP-HAND', name: 'Hands & Fingers', description: 'Cuts, pinch injury, fractures, burns', severityWeight: 'Medium', status: 'Active', sortOrder: 3 },
  { id: 'ML-43', listType: 'Body Part Lists', code: 'BP-BACK', name: 'Back & Spine', description: 'Manual handling strain, lumbar injury, slip shock', severityWeight: 'High', status: 'Active', sortOrder: 4 },
  { id: 'ML-44', listType: 'Body Part Lists', code: 'BP-LEG', name: 'Legs & Knees', description: 'Ligament sprain, fracture, trip impact', severityWeight: 'Medium', status: 'Active', sortOrder: 5 },
  { id: 'ML-45', listType: 'Body Part Lists', code: 'BP-FOOT', name: 'Feet & Toes', description: 'Crushed toes, sole puncture, twisted ankle', severityWeight: 'Medium', status: 'Active', sortOrder: 6 },
  { id: 'ML-46', listType: 'Body Part Lists', code: 'BP-TORSO', name: 'Torso & Chest', description: 'Rib fracture, abdominal blunt trauma', severityWeight: 'High', status: 'Active', sortOrder: 7 },

  // Observation Categories
  { id: 'ML-50', listType: 'Observation Categories', code: 'OC-PPE', name: 'PPE Compliance', description: 'Correct usage of helmet, safety goggles, gloves, harness', severityWeight: 'Medium', status: 'Active', sortOrder: 1 },
  { id: 'ML-51', listType: 'Observation Categories', code: 'OC-HOUSE', name: 'Housekeeping & Walkways', description: 'Clear escape routes, secured lashings, oil-free walkways', severityWeight: 'Low', status: 'Active', sortOrder: 2 },
  { id: 'ML-52', listType: 'Observation Categories', code: 'OC-ELEC', name: 'Electrical Safety', description: 'Grounding wires, portable tool insulation, panel locks', severityWeight: 'High', status: 'Active', sortOrder: 3 },
  { id: 'ML-53', listType: 'Observation Categories', code: 'OC-ALOFT', name: 'Working Aloft / Overboard', description: 'Inertia reel safety harness, boatswain chair, life jacket', severityWeight: 'Critical', status: 'Active', sortOrder: 4 },
  { id: 'ML-54', listType: 'Observation Categories', code: 'OC-TOOLS', name: 'Tools & Equipment Condition', description: 'Defective cables, mushroomed chisels, guardless grinder', severityWeight: 'Medium', status: 'Active', sortOrder: 5 },

  // Observation Types
  { id: 'ML-60', listType: 'Observation Types', code: 'OT-SAFE', name: 'Safe Act', description: 'Exemplary behavior upholding company safety rules', severityWeight: 'Low', status: 'Active', sortOrder: 1 },
  { id: 'ML-61', listType: 'Observation Types', code: 'OT-UNACT', name: 'Unsafe Act', description: 'Action breaching safe operational procedures', severityWeight: 'High', status: 'Active', sortOrder: 2 },
  { id: 'ML-62', listType: 'Observation Types', code: 'OT-UNCOND', name: 'Unsafe Condition', description: 'Physical hazard in environment requiring corrective intervention', severityWeight: 'High', status: 'Active', sortOrder: 3 },
  { id: 'ML-63', listType: 'Observation Types', code: 'OT-POS', name: 'Positive Observation', description: 'Proactive hazard identification and intervention', severityWeight: 'Low', status: 'Active', sortOrder: 4 },
  { id: 'ML-64', listType: 'Observation Types', code: 'OT-SWA', name: 'Stop Work Authority (SWA)', description: 'Exercising Stop Work Authority due to imminent danger', severityWeight: 'Critical', status: 'Active', sortOrder: 5 },
  { id: 'ML-65', listType: 'Observation Types', code: 'OT-HH', name: 'Hazard Hunt', description: 'Systematic proactive walkthrough finding hidden hazards', severityWeight: 'Medium', status: 'Active', sortOrder: 6 },

  // Permit Types
  { id: 'ML-70', listType: 'Permit Types', code: 'PT-HOT', name: 'Hot Work', description: 'Welding, burning, cutting, brazing, open flame', severityWeight: 'Critical', status: 'Active', sortOrder: 1 },
  { id: 'ML-71', listType: 'Permit Types', code: 'PT-CONF', name: 'Confined Space Entry', description: 'Cargo tanks, ballast tanks, cofferdams, chain lockers', severityWeight: 'Critical', status: 'Active', sortOrder: 2 },
  { id: 'ML-72', listType: 'Permit Types', code: 'PT-COLD', name: 'Cold Work', description: 'Maintenance with zero thermal ignition or hot sparks', severityWeight: 'Medium', status: 'Active', sortOrder: 3 },
  { id: 'ML-73', listType: 'Permit Types', code: 'PT-ELEC', name: 'Electrical Work', description: 'Work on live or high-voltage circuits > 50V AC/DC', severityWeight: 'High', status: 'Active', sortOrder: 4 },
  { id: 'ML-74', listType: 'Permit Types', code: 'PT-ALOFT', name: 'Working Aloft', description: 'Work at height > 2m above deck or on mast / funnel', severityWeight: 'High', status: 'Active', sortOrder: 5 },
  { id: 'ML-75', listType: 'Permit Types', code: 'PT-OVER', name: 'Working Overboard', description: 'Work outside ship shipside railings or near water surface', severityWeight: 'High', status: 'Active', sortOrder: 6 },
  { id: 'ML-76', listType: 'Permit Types', code: 'PT-DIVE', name: 'Diving Operation', description: 'Subsea hull cleaning, propeller inspection, rudder clearance', severityWeight: 'Critical', status: 'Active', sortOrder: 7 },
  { id: 'ML-77', listType: 'Permit Types', code: 'PT-ASB', name: 'Asbestos Work', description: 'Handling asbestos insulation or gaskets under BS 4555', severityWeight: 'Critical', status: 'Active', sortOrder: 8 },

  // Certificate Categories
  { id: 'ML-80', listType: 'Certificate Categories', code: 'CC-STAT', name: 'Statutory Ship Certificates', description: 'SOLAS, MARPOL, Load Line, Safety Construction, SMC, ISSC', severityWeight: 'Critical', status: 'Active', sortOrder: 1 },
  { id: 'ML-81', listType: 'Certificate Categories', code: 'CC-CLASS', name: 'Classification Society Certificates', description: 'Hull & Machinery Class Certificate, Continuous Machinery Survey', severityWeight: 'High', status: 'Active', sortOrder: 2 },
  { id: 'ML-82', listType: 'Certificate Categories', code: 'CC-FLAG', name: 'Flag State Documentation', description: 'Certificate of Registry, Minimum Safe Manning, Radio Station License', severityWeight: 'Critical', status: 'Active', sortOrder: 3 },
  { id: 'ML-83', listType: 'Certificate Categories', code: 'CC-EQUIP', name: 'Equipment Test & Calibration', description: 'Crane wire load tests, lifeboat release gear, fixed gas detector calibration', severityWeight: 'High', status: 'Active', sortOrder: 4 },
  { id: 'ML-84', listType: 'Certificate Categories', code: 'CC-CREW', name: 'Crew Competencies & STCW', description: 'Medical fitness, GMDSS endorsement, advanced firefighting, crowd mgmt', severityWeight: 'High', status: 'Active', sortOrder: 5 },

  // Issuing Authorities
  { id: 'ML-90', listType: 'Issuing Authorities', code: 'IA-ABS', name: 'American Bureau of Shipping (ABS)', description: 'IACS classification society', severityWeight: 'High', status: 'Active', sortOrder: 1 },
  { id: 'ML-91', listType: 'Issuing Authorities', code: 'IA-DNV', name: 'DNV Maritime', description: 'IACS classification society', severityWeight: 'High', status: 'Active', sortOrder: 2 },
  { id: 'ML-92', listType: 'Issuing Authorities', code: 'IA-LR', name: 'Lloyds Register (LR)', description: 'IACS classification society', severityWeight: 'High', status: 'Active', sortOrder: 3 },
  { id: 'ML-93', listType: 'Issuing Authorities', code: 'IA-BV', name: 'Bureau Veritas (BV)', description: 'IACS classification society', severityWeight: 'High', status: 'Active', sortOrder: 4 },
  { id: 'ML-94', listType: 'Issuing Authorities', code: 'IA-NKK', name: 'ClassNK (Nippon Kaiji Kyokai)', description: 'IACS classification society', severityWeight: 'High', status: 'Active', sortOrder: 5 },
  { id: 'ML-95', listType: 'Issuing Authorities', code: 'IA-FLAG', name: 'Flag State Maritime Administration', description: 'Marshall Islands / Panama / Singapore / Bahamas registry', severityWeight: 'Critical', status: 'Active', sortOrder: 6 },
  { id: 'ML-96', listType: 'Issuing Authorities', code: 'IA-ARAMCO', name: 'Saudi Aramco Marine Department', description: 'Client vetting authority & charter approval body', severityWeight: 'High', status: 'Active', sortOrder: 7 },

  // CAPA Categories
  { id: 'ML-100', listType: 'CAPA Categories', code: 'CAP-ENG', name: 'Engineering & Modification', description: 'Physical redesign, guard installation, piping rerouting', severityWeight: 'High', status: 'Active', sortOrder: 1 },
  { id: 'ML-101', listType: 'CAPA Categories', code: 'CAP-SMS', name: 'Safety Management System (SMS) Revision', description: 'Updating company standard operating procedures or checklists', severityWeight: 'Medium', status: 'Active', sortOrder: 2 },
  { id: 'ML-102', listType: 'CAPA Categories', code: 'CAP-TRAIN', name: 'Crew Training & Retraining', description: 'Conducting drills, simulator sessions, or safety briefings', severityWeight: 'Medium', status: 'Active', sortOrder: 3 },
  { id: 'ML-103', listType: 'CAPA Categories', code: 'CAP-MAINT', name: 'Preventive Maintenance Task (PMS)', description: 'Rescheduling or shortening overhaul intervals in PMS', severityWeight: 'Medium', status: 'Active', sortOrder: 4 },
  { id: 'ML-104', listType: 'CAPA Categories', code: 'CAP-EQUIP', name: 'Equipment Replacement & Procurement', description: 'Purchasing upgraded safety-rated components or tools', severityWeight: 'High', status: 'Active', sortOrder: 5 },

  // Hazard Categories
  { id: 'ML-110', listType: 'Hazard Categories', code: 'HAZ-ROT', name: 'Mechanical & Rotating Parts', description: 'Nip points, shafts, unguarded belts, winch drums', severityWeight: 'High', status: 'Active', sortOrder: 1 },
  { id: 'ML-111', listType: 'Hazard Categories', code: 'HAZ-ELEC', name: 'High Voltage Electricity', description: '440V switchboard, live busbars, portable cables', severityWeight: 'Critical', status: 'Active', sortOrder: 2 },
  { id: 'ML-112', listType: 'Hazard Categories', code: 'HAZ-GAS', name: 'Flammable & Toxic Atmospheres', description: 'H2S, Hydrocarbon gas (LEL), Carbon Monoxide, Oxygen deficiency', severityWeight: 'Critical', status: 'Active', sortOrder: 3 },
  { id: 'ML-113', listType: 'Hazard Categories', code: 'HAZ-PRESS', name: 'Hydraulic & Steam Pressure Release', description: 'Boiler steam lines, steering gear hydraulics > 150 bar', severityWeight: 'High', status: 'Active', sortOrder: 4 },
  { id: 'ML-114', listType: 'Hazard Categories', code: 'HAZ-LIFT', name: 'Heavy Lifting & Rigging', description: 'Overhead crane, spreader bars, wire rope fatigue', severityWeight: 'High', status: 'Active', sortOrder: 5 }
];

export const INITIAL_RISK_MATRIX_CONFIG: RiskMatrixConfig = {
  gridSize: '5x5',
  likelihoods: [
    { score: 1, label: 'Rare (1)', description: 'Practically impossible / Has never occurred in fleet' },
    { score: 2, label: 'Unlikely (2)', description: 'Conceivable but rare (< once per 5 years)' },
    { score: 3, label: 'Possible (3)', description: 'Might occur occasionally (once per 1-2 years)' },
    { score: 4, label: 'Likely (4)', description: 'Occurs regularly in fleet (> 2 times per year)' },
    { score: 5, label: 'Almost Certain (5)', description: 'Continuous exposure / Expected in almost all tasks' }
  ],
  severities: [
    { score: 1, label: 'Insignificant (1)', description: 'No injury or first aid only; No asset damage; Contained spill' },
    { score: 2, label: 'Minor (2)', description: 'Minor injury / MTC; Minor localized damage (< $5,000)' },
    { score: 3, label: 'Moderate (3)', description: 'Lost time injury (< 3 days); Moderate damage ($5,000 - $50,000)' },
    { score: 4, label: 'Major (4)', description: 'Severe injury / Permanent disability; Severe damage ($50,000 - $250,000)' },
    { score: 5, label: 'Catastrophic (5)', description: 'Fatality or multiple severe casualties; Total loss of vessel; Major pollution' }
  ],
  bands: [
    { level: 'Low', minScore: 1, maxScore: 4, color: '#059669', bgColor: '#d1fae5', mandate: 'Routine Controls & Standard PPE. Proceed under routine watchkeeping.' },
    { level: 'Medium', minScore: 5, maxScore: 9, color: '#d97706', bgColor: '#fef3c7', mandate: 'Toolbox Talk mandatory before task execution. Designated supervisor review.' },
    { level: 'High', minScore: 10, maxScore: 16, color: '#ea580c', bgColor: '#ffedd5', mandate: 'Permit to Work (PTW) required with written Superintendent sign-off prior to task authorization.' },
    { level: 'Critical', minScore: 17, maxScore: 25, color: '#dc2626', bgColor: '#fee2e2', mandate: 'IMMEDIATE STOP WORK. Master and Shore DPA notification mandatory before any work can proceed.' }
  ]
};

export const INITIAL_WORKFLOW_ESCALATION_RULES: WorkflowEscalationRule[] = [
  { id: 'WFR-01', reportType: 'Risk Assessment', severity: 'Critical', stageName: 'Investigation/Assessment', escalationRole: 'Master + HSEQ Manager', overdueThresholdDays: 1, notificationTrigger: 'Immediate Alert', requiresDualSignOff: true, status: 'Active' },
  { id: 'WFR-02', reportType: 'Risk Assessment', severity: 'High', stageName: 'Investigation/Assessment', escalationRole: 'Department Head + Master', overdueThresholdDays: 2, notificationTrigger: 'Immediate Alert', requiresDualSignOff: true, status: 'Active' },
  { id: 'WFR-03', reportType: 'Risk Assessment', severity: 'Medium', stageName: 'Review', escalationRole: 'Department Head', overdueThresholdDays: 3, notificationTrigger: 'Daily Digest', requiresDualSignOff: false, status: 'Active' },
  { id: 'WFR-04', reportType: 'Risk Assessment', severity: 'Low', stageName: 'Review', escalationRole: 'Lead Assessor / Supervisor', overdueThresholdDays: 7, notificationTrigger: 'Daily Digest', requiresDualSignOff: false, status: 'Active' },
  { id: 'WFR-05', reportType: 'Permit to Work', severity: 'Critical', stageName: 'Review', escalationRole: 'Master + Shore DPA', overdueThresholdDays: 1, notificationTrigger: 'Immediate Alert', requiresDualSignOff: true, status: 'Active' },
  { id: 'WFR-06', reportType: 'Permit to Work', severity: 'High', stageName: 'Review', escalationRole: 'Master / Approving Authority', overdueThresholdDays: 1, notificationTrigger: 'Immediate Alert', requiresDualSignOff: false, status: 'Active' },
  { id: 'WFR-07', reportType: 'Near Miss', severity: 'Critical', stageName: 'Investigation/Assessment', escalationRole: 'Executive Management / DPA', overdueThresholdDays: 2, notificationTrigger: 'Immediate Alert', requiresDualSignOff: true, status: 'Active' },
  { id: 'WFR-08', reportType: 'Near Miss', severity: 'High', stageName: 'Investigation/Assessment', escalationRole: 'HSEQ Manager', overdueThresholdDays: 3, notificationTrigger: 'Immediate Alert', requiresDualSignOff: false, status: 'Active' },
  { id: 'WFR-09', reportType: 'Inspection Finding', severity: 'High', stageName: 'Corrective Action', escalationRole: 'Superintendent + Master', overdueThresholdDays: 3, notificationTrigger: 'Overdue Breach', requiresDualSignOff: false, status: 'Active' },
  { id: 'WFR-10', reportType: 'CAPA Action', severity: 'Critical', stageName: 'Verification', escalationRole: 'HSEQ Manager + Lead Auditor', overdueThresholdDays: 3, notificationTrigger: 'Overdue Breach', requiresDualSignOff: true, status: 'Active' }
];

export const INITIAL_NOTIFICATION_TEMPLATES: NotificationThresholdTemplate[] = [
  {
    id: 'NOTIF-01',
    templateName: 'Statutory Certificate Expiry Alert',
    triggerEvent: 'Certificate Expiry',
    reminderDays: [90, 60, 30, 15, 7],
    escalationDays: 1,
    roleRecipients: ['Master', 'HSEQ Manager', 'DPA'],
    emailSubjectTemplate: 'URGENT: Statutory Certificate {record_id} Expiring on {vessel}',
    bodyTemplate: 'Statutory certificate {record_id} for vessel {vessel} is due to expire in {days_remaining} days. Please ensure renewal survey is scheduled with class society.',
    status: 'Active'
  },
  {
    id: 'NOTIF-02',
    templateName: 'High-Risk PTW Validity Expiry Warning',
    triggerEvent: 'PTW Expiry',
    reminderDays: [2, 1],
    escalationDays: 1,
    roleRecipients: ['Performing Authority', 'Area Authority', 'Master'],
    emailSubjectTemplate: 'PTW #{record_id} approaching expiry on {vessel}',
    bodyTemplate: 'Permit #{record_id} for {activity} is approaching expiration. Ensure safe worksite closure or submit revalidation.',
    status: 'Active'
  },
  {
    id: 'NOTIF-03',
    templateName: 'Mandatory Risk Assessment Review Window Due',
    triggerEvent: 'Risk Assessment Review Due',
    reminderDays: [30, 15, 7],
    escalationDays: 3,
    roleRecipients: ['Lead Assessor', 'Department Head'],
    emailSubjectTemplate: 'Annual RA Review Required: {record_id} - {activity}',
    bodyTemplate: 'Risk assessment #{record_id} review cycle has reached its scheduled review window. Review existing control measures.',
    status: 'Active'
  },
  {
    id: 'NOTIF-04',
    templateName: 'STCW / MLC 2006 Hours of Rest Violation Warning',
    triggerEvent: 'Hours Of Rest Violation',
    reminderDays: [1],
    escalationDays: 1,
    roleRecipients: ['Master', 'Chief Engineer', 'HSEQ Officer'],
    emailSubjectTemplate: 'STCW / MLC 2006 Hours of Rest Breach: {crew_name}',
    bodyTemplate: 'A work/rest hour violation was detected for seafarer {crew_name} on {vessel}. Minimum rest period breached.',
    status: 'Active'
  },
  {
    id: 'NOTIF-05',
    templateName: 'Audit Finding Past Target Date Escalation',
    triggerEvent: 'Inspection Overdue',
    reminderDays: [7, 3, 1],
    escalationDays: 3,
    roleRecipients: ['Assigned Actionee', 'HSEQ Officer', 'Technical Superintendent'],
    emailSubjectTemplate: 'OVERDUE AUDIT FINDING: #{record_id} on {vessel}',
    bodyTemplate: 'Finding #{record_id} target closure date has lapsed. Immediate corrective action and CAPA submission required.',
    status: 'Active'
  },
  {
    id: 'NOTIF-06',
    templateName: 'High Potential (HIPO) Near Miss Fleet Alert',
    triggerEvent: 'Near Miss Escalation',
    reminderDays: [1],
    escalationDays: 2,
    roleRecipients: ['HSEQ Manager', 'DPA', 'Management Executive'],
    emailSubjectTemplate: 'HIPO Near Miss Reported on {vessel}: #{record_id}',
    bodyTemplate: 'A high-potential near-miss event was logged on {vessel}. Designated investigation team assigned.',
    status: 'Active'
  }
];

@Injectable({
  providedIn: 'root'
})
export class HseqStateService {
  constructor() {
    effect(() => {
      try {
        localStorage.setItem(CREW_STORAGE_KEY, JSON.stringify(this.crewMembers()));
      } catch (e) {
        console.error('Error persisting crew members', e);
      }
    });
    effect(() => {
      try {
        localStorage.setItem(RISK_RULES_STORAGE_KEY, JSON.stringify(this.riskApprovalRules()));
      } catch (e) {
        console.error('Error persisting risk approval rules', e);
      }
    });
    effect(() => {
      try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(this.projects()));
      } catch (e) {
        console.error('Error persisting projects', e);
      }
    });
    effect(() => {
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users()));
      } catch (e) {
        console.error('Error persisting system users', e);
      }
    });
    effect(() => {
      try {
        localStorage.setItem(MASTER_LISTS_STORAGE_KEY, JSON.stringify(this.masterLists()));
      } catch (e) {
        console.error('Error persisting master lists', e);
      }
    });
    effect(() => {
      try {
        localStorage.setItem(RISK_MATRIX_STORAGE_KEY, JSON.stringify(this.riskMatrixConfig()));
      } catch (e) {
        console.error('Error persisting risk matrix config', e);
      }
    });
    effect(() => {
      try {
        localStorage.setItem(WORKFLOW_RULES_STORAGE_KEY, JSON.stringify(this.workflowEscalationRules()));
      } catch (e) {
        console.error('Error persisting workflow escalation rules', e);
      }
    });
    effect(() => {
      try {
        localStorage.setItem(NOTIFICATION_TEMPLATES_STORAGE_KEY, JSON.stringify(this.notificationTemplates()));
      } catch (e) {
        console.error('Error persisting notification templates', e);
      }
    });

    this.syncPermitTypesWithMasterLists();
  }

  private loadInitialCrewMembers(): VesselCrewMember[] {
    try {
      const stored = localStorage.getItem(CREW_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed parsing stored crew members, fallback to default', e);
    }
    return INITIAL_CREW_MEMBERS;
  }

  private loadInitialRiskApprovalRules(): RiskApprovalRule[] {
    try {
      const stored = localStorage.getItem(RISK_RULES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed parsing stored risk approval rules, fallback to default', e);
    }
    return INITIAL_RISK_APPROVAL_RULES;
  }

  private loadInitialProjects(): ProjectItem[] {
    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed parsing stored projects, fallback to default', e);
    }
    return INITIAL_PROJECTS;
  }

  private loadInitialUsers(): SystemUser[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: any) => ({ ...u, name: u.name || u.fullName }));
        }
      }
    } catch (e) {
      console.warn('Failed parsing stored users, fallback to default', e);
    }
    return INITIAL_USERS.map(u => ({ ...u, name: u.fullName }));
  }

  private loadInitialMasterLists(): MasterListItem[] {
    try {
      const stored = localStorage.getItem(MASTER_LISTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed parsing stored master lists, fallback to default', e);
    }
    return INITIAL_MASTER_LISTS;
  }

  private loadInitialRiskMatrixConfig(): RiskMatrixConfig {
    try {
      const stored = localStorage.getItem(RISK_MATRIX_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.bands) && parsed.bands.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed parsing stored risk matrix config, fallback to default', e);
    }
    return INITIAL_RISK_MATRIX_CONFIG;
  }

  private loadInitialWorkflowEscalationRules(): WorkflowEscalationRule[] {
    try {
      const stored = localStorage.getItem(WORKFLOW_RULES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed parsing stored workflow rules, fallback to default', e);
    }
    return INITIAL_WORKFLOW_ESCALATION_RULES;
  }

  private loadInitialNotificationTemplates(): NotificationThresholdTemplate[] {
    try {
      const stored = localStorage.getItem(NOTIFICATION_TEMPLATES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed parsing stored notification templates, fallback to default', e);
    }
    return INITIAL_NOTIFICATION_TEMPLATES;
  }
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

  // Maritime Ranks (STCW Compliant Master Data)
  readonly crewRanks = signal<string[]>([
    'Master',
    'Chief Officer',
    'Second Officer',
    'Third Officer',
    'Chief Engineer',
    'Second Engineer',
    'Third Engineer',
    'Fourth Engineer',
    'Electro-Technical Officer (ETO)',
    'Electrician',
    'Bosun',
    'Able Seaman (AB)',
    'Ordinary Seaman (OS)',
    'Fitter',
    'Pumpman',
    'Oiler / Motorman',
    'Wiper',
    'Chief Cook',
    'Messman / Steward'
  ]);

  // Master Data: Fleet Vessel Crew Complements (Assigned Strictly by Vessel)
  readonly crewMembers = signal<VesselCrewMember[]>(this.loadInitialCrewMembers());

  // Helper method: strictly get crew assigned to a vessel
  getCrewByVessel(vesselName: string): VesselCrewMember[] {
    if (!vesselName || vesselName === 'ALL') {
      return this.crewMembers();
    }
    return this.crewMembers().filter(c => c.vesselName.toLowerCase() === vesselName.toLowerCase());
  }

  // Master Data: Projects
  readonly projects = signal<ProjectItem[]>(this.loadInitialProjects());
  readonly projectNames = computed(() => this.projects().map(p => p.name));

  // Master Data: System Users (Multi-role, Multi-department, Multi-vessel)
  readonly users = signal<SystemUser[]>(this.loadInitialUsers());
  readonly userNames = computed(() => this.users().map(u => u.fullName));

  // Master Data: Reusable Master Lists Framework (12 Standard Domains)
  readonly masterLists = signal<MasterListItem[]>(this.loadInitialMasterLists());

  // Master Data: Risk Matrix Configuration (Single Source of Truth)
  readonly riskMatrixConfig = signal<RiskMatrixConfig>(this.loadInitialRiskMatrixConfig());

  // Master Data: Workflow & Escalation Rules
  readonly workflowEscalationRules = signal<WorkflowEscalationRule[]>(this.loadInitialWorkflowEscalationRules());

  // Master Data: Notification & Threshold Templates
  readonly notificationTemplates = signal<NotificationThresholdTemplate[]>(this.loadInitialNotificationTemplates());

  getMasterList(listType: MasterListType): MasterListItem[] {
    const target = (listType === 'Safe Observation Categories' || listType === 'Observation Categories')
      ? ['Observation Categories', 'Safe Observation Categories']
      : [listType];
    return this.masterLists().filter(item => target.includes(item.listType) && item.status === 'Active');
  }

  getLeadAssessors(): SystemUser[] {
    return this.users().filter(u => u.status === 'Active' && u.roles.some(r => r.toLowerCase().includes('lead') || r.toLowerCase().includes('assessor') || r.toLowerCase().includes('officer') || r.toLowerCase().includes('master')));
  }

  getApprovers(): SystemUser[] {
    return this.users().filter(u => u.status === 'Active' && u.roles.some(r => r.toLowerCase().includes('approver') || r.toLowerCase().includes('master') || r.toLowerCase().includes('head') || r.toLowerCase().includes('executive') || r.toLowerCase().includes('admin')));
  }

  getInspectorsList(): SystemUser[] {
    return this.users().filter(u => u.status === 'Active' && u.roles.some(r => r.toLowerCase().includes('inspector') || r.toLowerCase().includes('auditor') || r.toLowerCase().includes('superintendent') || r.toLowerCase().includes('officer')));
  }

  getSupervisors(): SystemUser[] {
    return this.users().filter(u => u.status === 'Active' && u.roles.some(r => r.toLowerCase().includes('supervisor') || r.toLowerCase().includes('bosun') || r.toLowerCase().includes('officer') || r.toLowerCase().includes('engineer')));
  }

  // Dynamic 5x5 Risk Calculator reading directly from configured Risk Matrix Master
  calculateRiskLevel(likelihoodScore: number, severityScore: number): { score: number; level: RiskLevel; mandate: string; color: string; bgColor: string } {
    const score = Math.max(1, Math.min(25, (likelihoodScore || 1) * (severityScore || 1)));
    const config = this.riskMatrixConfig();
    const matchedBand = config.bands.find(b => score >= b.minScore && score <= b.maxScore) || config.bands[0];
    return {
      score,
      level: matchedBand.level,
      mandate: matchedBand.mandate,
      color: matchedBand.color,
      bgColor: matchedBand.bgColor
    };
  }

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
    { id: 'CAT-08', scope: 'Permit to Work', code: 'PTW-HOT', name: 'Hot Work', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-09', scope: 'Permit to Work', code: 'PTW-CONF', name: 'Confined Space Entry', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-12', scope: 'Permit to Work', code: 'PTW-COLD', name: 'Cold Work', severityWeight: 'Medium', status: 'Active' },
    { id: 'CAT-13', scope: 'Permit to Work', code: 'PTW-ELEC', name: 'Electrical Work', severityWeight: 'High', status: 'Active' },
    { id: 'CAT-14', scope: 'Permit to Work', code: 'PTW-ALOFT', name: 'Working Aloft', severityWeight: 'High', status: 'Active' },
    { id: 'CAT-15', scope: 'Permit to Work', code: 'PTW-OVER', name: 'Working Overboard', severityWeight: 'High', status: 'Active' },
    { id: 'CAT-16', scope: 'Permit to Work', code: 'PTW-DIVE', name: 'Diving Operation', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-17', scope: 'Permit to Work', code: 'PTW-ASB', name: 'Asbestos Work', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-10', scope: 'Injury Classification', code: 'INJ-LTI', name: 'Lost Time Injury (LTI)', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-11', scope: 'Injury Classification', code: 'INJ-MTC', name: 'Medical Treatment Case (MTC)', severityWeight: 'High', status: 'Active' },
    { id: 'CAT-18', scope: 'Risk Assessment', code: 'RA-ROUT', name: 'Routine Operation', severityWeight: 'Medium', status: 'Active' },
    { id: 'CAT-19', scope: 'Risk Assessment', code: 'RA-NONROUT', name: 'Non-Routine High Risk', severityWeight: 'Critical', status: 'Active' },
    { id: 'CAT-20', scope: 'Risk Assessment', code: 'RA-TBSA', name: 'Task-Based JSA', severityWeight: 'High', status: 'Active' },
    { id: 'CAT-21', scope: 'Risk Assessment', code: 'RA-EMERG', name: 'Emergency Preparedness', severityWeight: 'High', status: 'Active' },
    { id: 'CAT-22', scope: 'Risk Assessment', code: 'RA-DYN', name: 'Dynamic Operation', severityWeight: 'Medium', status: 'Active' }
  ]);

  readonly categoryNames = computed(() => this.categories().map(c => c.name));

  // Dynamic Assessment Types derived strictly from Master Data Categories
  readonly assessmentTypes = computed(() => {
    const raCats = this.categories().filter(c => c.scope === 'Risk Assessment' && c.status === 'Active').map(c => c.name);
    return raCats.length > 0 ? raCats : ['Routine Operation', 'Non-Routine High Risk', 'Task-Based JSA', 'Emergency Preparedness', 'Dynamic Operation'];
  });

  // Configurable Risk Assessment Approval Routing Matrix (Master Data Configured)
  readonly riskApprovalRules = signal<RiskApprovalRule[]>(this.loadInitialRiskApprovalRules());

  getRequiredApproverForRisk(riskLevel?: string): RiskApprovalRule {
    const norm = (riskLevel || '').toLowerCase().trim();
    const rules = this.riskApprovalRules();
    const activeRules = rules.filter(r => (r.status || 'Active').toLowerCase() === 'active');
    const pool = activeRules.length > 0 ? activeRules : rules;

    // Exact or normalized match first
    const matched = pool.find(r => r.riskLevel.toLowerCase() === norm);
    if (matched) return matched;

    if (norm.includes('crit')) {
      return pool.find(r => r.riskLevel.toLowerCase().includes('crit')) || pool[pool.length - 1];
    }
    if (norm.includes('high')) {
      return pool.find(r => r.riskLevel.toLowerCase().includes('high')) || pool[Math.min(2, pool.length - 1)];
    }
    if (norm.includes('mod') || norm.includes('med')) {
      return pool.find(r => r.riskLevel.toLowerCase().includes('mod') || r.riskLevel.toLowerCase().includes('med')) || pool[Math.min(1, pool.length - 1)];
    }
    return pool.find(r => r.riskLevel.toLowerCase().includes('low')) || pool[0];
  }

  // 6. Master Data PTW Checklist Templates (Sourced directly from Client Forms 09F-006-02 to 09F-006-08)
  readonly ptwTemplates = signal<PtwChecklistTemplate[]>([
    {
      id: 'TMPL-HOT',
      permitType: 'Hot Work',
      title: 'Hot Work Safety Verification Checklist',
      formReference: '09F-006-03 (Rev. 2)',
      description: 'Pre-ignition checks, atmosphere verification, continuous ventilation, fire watch standing by, and pressurized fire fighting appliances.',
      defaultPpe: ['Welding Shield / Face Visor', 'Leather Welding Apron', 'Heat Resistant Gloves', 'Safety Boots (Steel Toe)', 'Safety Helmet'],
      specificValidations: [
        'All answers must be "YES" for completion of permit',
        'Permit validity SHALL NOT exceed 8 hours. Re-validation is NOT permitted.',
        'Continuous fire watch must remain stationed at worksite throughout operation and 30 mins after'
      ],
      items: [
        { id: 'HW-01', question: 'Has ventilation been thorough and complete?', category: 'Ventilation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-02', question: 'Is ventilation continuous throughout the hot work operation?', category: 'Ventilation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-03', question: 'Type of ventilation verified (e.g. Electric explosion-proof blower)?', category: 'Ventilation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-04', question: 'Is suitable and adequate lighting provided (EX rated where required)?', category: 'Worksite Preparation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-05', question: 'Is safe access and unobstructed emergency egress confirmed?', category: 'Worksite Preparation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-06', question: 'Is work area clean, dry and completely free of combustible materials within 15 meters?', category: 'Fire Precaution', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-07', question: 'Are adjacent compartments and spaces verified Gas Free?', category: 'Atmospheric Safety', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-08', question: 'Has atmosphere in adjacent spaces been instrumentally checked?', category: 'Atmospheric Safety', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-09', question: 'Are all liquid, fuel, and vapor lines in the area isolated with blinds/closed valves?', category: 'Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-10', question: 'Is Fire Fighting equipment in readiness and Fire Main pressurized with 2x charged hoses?', category: 'Fire Fighting Appliances', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-11', question: 'Are Fire-Watchmen nominated, instructed, and standing by with portable extinguishers?', category: 'Fire Watch', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-12', question: 'Is direct two-way radio communication between Fire-Watchmen and Bridge established?', category: 'Communications', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-13', question: 'Have Emergency Response Procedures and alarm signals been discussed?', category: 'Emergency Response', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' },
        { id: 'HW-14', question: 'Has Toolbox Meeting / JSA been conducted and risk analysis record verified?', category: 'Toolbox Talk & RA', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-03' }
      ]
    },
    {
      id: 'TMPL-CONF',
      permitType: 'Confined Space Entry',
      title: 'Enclosed Space Entry Safety Checklist',
      formReference: '09F-006-02 (Rev. 3)',
      description: 'Single-person entry prohibited. Multi-level atmosphere testing (Top, Middle, Bottom), continuous ventilation, entrance attendant stationed, and rescue gear verified.',
      defaultPpe: ['Personal 4-Gas Detector (Worn by entrants)', 'Full Body Safety Harness', 'Safety Helmet', 'Intrinsically Safe Torch', 'Chemical/Safety Boots', 'EEBD Escape Set'],
      specificValidations: [
        'Single-person entry PROHIBITED under all circumstances',
        'Permit validity SHALL NOT exceed 8 hours. Re-validation is NOT permitted.',
        'Permit valid date/time should be only after Master approval date/time',
        'Periodical atmospheric checks required at intervals not exceeding 2 hours'
      ],
      items: [
        { id: 'CS-01', question: 'Space assumed hazardous until proven safe?', category: 'Pre-Entry Assessment', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-02', question: 'Space identified under Enclosed Space Register and Register reviewed?', category: 'Pre-Entry Assessment', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-03', question: 'Forced mechanical ventilation completed (minimum ≥ 3 air changes)?', category: 'Ventilation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-04', question: 'Forced ventilation maintained continuous throughout entry duration?', category: 'Ventilation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-05', question: 'Suitable lighting provided (certified intrinsically safe EX lighting where required)?', category: 'Worksite Safety', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-06', question: 'Safe access, descent ladder, and clear egress path confirmed?', category: 'Access & Egress', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-07', question: 'Communication established between those in space, entrance attendant, and bridge?', category: 'Communications', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-08', question: 'Portable gas detector calibrated, bump-tested, and verified within test validity?', category: 'Gas Equipment', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-09', question: 'Personal multi-gas detector worn by all entrants throughout entry?', category: 'Gas Equipment', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-10', question: 'Multi-level atmosphere testing (Top, Middle, Bottom) confirmed safe: O2 ≥ 20.9%, CO2 < 0.5%, CO ≤ 10ppm, LEL < 1%?', category: 'Atmospheric Safety', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-11', question: 'Ship-specific Enclosed Space Emergency Response Plan reviewed and posted at entrance?', category: 'Emergency Preparedness', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-12', question: 'Responsible Attendant stationed at entrance with entrant tracking board and direct radio?', category: 'Attendant at Entrance', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-13', question: 'Emergency rescue equipment in place at entrance: SCBA + spare cylinders, EEBD, resuscitation gear, safety lines, rescue stretcher?', category: 'Emergency Equipment', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' },
        { id: 'CS-14', question: 'Toolbox Meeting / JSA conducted and all personnel briefed before entry?', category: 'Toolbox Talk & RA', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-02' }
      ]
    },
    {
      id: 'TMPL-ELEC',
      permitType: 'Electrical Work',
      title: 'Electrical Systems Work & Isolation Checklist',
      formReference: '09F-006-05 (Rev. 1)',
      description: 'Low voltage (0-440V) and High voltage (440V-6.6kV) systems safety, zero-energy state verification, earthing switches, and LOTO logs.',
      defaultPpe: ['Insulating Rubber Gloves (Class tested)', 'Electrical Arc-Flash Face Shield', 'Non-conductive Safety Boots', 'Flame Retardant Coverall', 'Safety Helmet with Chin Strap'],
      specificValidations: [
        '\"No Voltage\" measurement MUST be verified prior to touching any component',
        'Earthing switches or portable earth leads must be clamped and checked',
        'Supply breaker racked out to park position and locked with danger tags'
      ],
      items: [
        { id: 'EL-01', question: 'Safety distance known and demarcated for switchboard / working area?', category: 'Worksite Demarcation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-02', question: 'Warning signs and danger notices prominently displayed on breaker & cubicle?', category: 'Worksite Demarcation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-03', question: 'Authorized Person and Person in Charge appointed by Chief Engineer?', category: 'Authority Delegation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-04', question: 'Approved insulated tools and insulating rubber PPE available and inspected?', category: 'Tools & PPE', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-05', question: 'Fire appliances suitable for electrical equipment in readiness (CO2 / Dry Powder)?', category: 'Fire Precaution', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-06', question: 'Circuit isolated, supply breaker removed to racked-out / park position?', category: 'Isolation Procedure', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-07', question: 'High voltage measuring device functionality confirmed (proven on live source first)?', category: 'Testing & Verification', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-08', question: '\"No Voltage\" test performed on isolated circuit and verified zero potential?', category: 'Testing & Verification', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-09', question: 'Earthing switch connected or portable working earth-cables securely clamped?', category: 'Earthing & Safety', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-10', question: '\"In Service\" interlock keys removed and handed over to Authorized Person?', category: 'Interlocks & Keys', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' },
        { id: 'EL-11', question: 'Risk assessment completed, JSA / TBT conducted, and LOTO Log signed?', category: 'Linkages & LOTO', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-05' }
      ]
    },
    {
      id: 'TMPL-ALOFT',
      permitType: 'Working Aloft',
      title: 'Working Aloft Safety Checklist',
      formReference: '09F-006-06 (Section Aloft)',
      description: 'Fall arrest protection, radio transmitter disablement, radar scanner isolation, funnel exhaust reduction, and ladder safety.',
      defaultPpe: ['Full Body Fall Arrest Harness', 'Inertia Reel Fall Arrester', 'Safety Helmet with Chin Strap', 'Tool Lanyards & Pouches', 'Non-slip Safety Boots'],
      specificValidations: [
        'Operator under 18 years or less than 12 months sea time not allowed, or must be directly supervised',
        'Radar scanners and radio transmitters MUST have power disconnected and warning notices posted',
        'Work aloft prohibited during severe weather, heavy swell, or in conflict with cargo operations'
      ],
      items: [
        { id: 'AL-01', question: 'Operator qualified (over 18 yrs & >12 months sea time, or under direct supervision)?', category: 'Personnel Competency', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-02', question: 'Weather conditions suitable, taking into account sea swell and vessel movement?', category: 'Environmental Assessment', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-03', question: 'Officer of the Watch (OOW) informed and passage plan consulted?', category: 'Bridge Coordination', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-04', question: 'Safety harness with inertia reel lifeline inspected and donned correctly?', category: 'Fall Protection', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-05', question: 'Work near radio aerials: transmitters turned off and warning notices securely posted?', category: 'Radiation & Electrical Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-06', question: 'Radar scanners turned off, O.O.W. informed, and warning notices securely posted on consoles?', category: 'Machinery Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-07', question: 'Work near whistle: whistle power turned off and warning notices securely posted on bridge & ECR?', category: 'Acoustic Hazard Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-08', question: 'Work on funnel: duty engineer informed and emissions from funnel reduced as far as practicable?', category: 'Exhaust Hazards', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-09', question: 'Work aloft not in vicinity of or in conflict with ongoing cargo operations?', category: 'SIMOPS Separation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-10', question: 'Access adequate, deck area below roped off and warning notices securely posted?', category: 'Drop Object Prevention', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-11', question: 'All tools, shackles, and equipment secured with lanyards to prevent falling?', category: 'Drop Object Prevention', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-12', question: 'Staging / Bosun\'s chair / Gantlines inspected, tested, and in good order?', category: 'Equipment Integrity', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'AL-13', question: 'Portable ladders inspected, secured at top/bottom, and set at 65-70 degree angle?', category: 'Ladder Safety', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' }
      ]
    },
    {
      id: 'TMPL-OVER',
      permitType: 'Working Overboard',
      title: 'Working Outboard / Overboard Safety Checklist',
      formReference: '09F-006-06 (Section Outboard)',
      description: 'Overside safety, MOB GPS tested, auto-inflate lifejackets, standby man stationed, rescue boat standby, and propulsion/thruster immobilization.',
      defaultPpe: ['Auto-inflate SOLAS Lifejacket', 'Full Body Safety Harness with Lifeline', 'Inertia Reel Fall Arrester', 'Safety Helmet with Chin Strap', 'Non-slip Safety Boots'],
      specificValidations: [
        'WORKING OUTBOARD SHOULD BE AVOIDED WHILE VESSEL MAKING WAY',
        'Vessel must be stopped, lee made, or speed reduced with Master approval',
        'Propeller and thrusters MUST be immobilized with Chief Engineer confirmation'
      ],
      items: [
        { id: 'OB-01', question: 'Vessel stopped, lee made, or speed reduced (overside work avoided while making way)?', category: 'Vessel Condition', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-02', question: 'Adequate sea room available to allow departure from passage plan?', category: 'Navigation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-03', question: 'Master\'s approval received and Officer of the Watch informed?', category: 'Bridge Coordination', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-04', question: 'Man Overboard (MOB) function on GPS navigator operational and tested?', category: 'Bridge Coordination', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-05', question: 'Weather conditions suitable, taking into account sea swell, wind, and vessel movement?', category: 'Environmental Assessment', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-06', question: 'Safety harness with inertia reel line and auto-inflate lifejacket donned by all crew?', category: 'Lifesaving & Fall Arrest', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-07', question: 'Standby man in attendance with direct radio communication to O.O.W. / Duty Officer?', category: 'Safety Watch', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-08', question: 'Engine Room duty engineer informed; propeller and thrusters immobilized?', category: 'Propulsion Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-09', question: 'Aware of overboard discharges; scuppers and cooling water shut off or diverted?', category: 'Discharge Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-10', question: 'Rescue boat / Lifeboat checked, manned, and ready for immediate deployment?', category: 'Emergency Rescue', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-11', question: 'Pilot ladder / Jacobs ladder rigged to water line for emergency re-boarding?', category: 'Emergency Rescue', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'OB-12', question: 'Tools, paints, and equipment secured with lanyards to prevent loss?', category: 'Equipment Security', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' }
      ]
    },
    {
      id: 'TMPL-COLD',
      permitType: 'Cold Work',
      title: 'Cold Work & Mechanical Isolation Checklist',
      formReference: '09F-006-06 (Rev. 2)',
      description: 'Pipelines blanking/deblanking, pump overhauls, pressure vessel isolation, zero-energy release, and roped-off area safety.',
      defaultPpe: ['Chemical Resistant Gloves', 'Safety Glasses / Goggles', 'Safety Helmet', 'Steel Toe Boots', 'Close Fitting Protective Overalls'],
      specificValidations: [
        'If work is to be carried out in enclosed spaces, mandatory Enclosed Space permit required',
        'Equipment or pipeline must be completely depressurized and drained of cargo prior to opening'
      ],
      items: [
        { id: 'CW-01', question: 'Is work to be carried out in enclosed spaces? (If Yes, mandatory Enclosed Space permit)', category: 'Pre-check', requiredAnswer: 'NO', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'CW-02', question: 'Equipment or pipeline drained, washed, and purged with nitrogen/inert gas where required?', category: 'Preparation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'CW-03', question: 'Equipment vented with air and atmosphere verified safe?', category: 'Preparation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'CW-04', question: 'Isolated from other pipelines by means of closed valves, spades inserted, or disconnected lines?', category: 'Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'CW-05', question: 'Electrical equipment included isolated from power supply with LOTO tags?', category: 'Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'CW-06', question: 'Equipment or pipeline confirmed free of cargo and completely depressurized?', category: 'Zero-Energy Verification', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'CW-07', question: 'Drip trays provided and waste containment in place?', category: 'Environmental Protection', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'CW-08', question: 'Area roped off, illumination adequate, and warning notices displayed?', category: 'Demarcation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'CW-09', question: 'Revolving machinery clear of obstructions and loose material?', category: 'Machinery Safety', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' },
        { id: 'CW-10', question: 'Close fitting protective clothes, protective glasses, and gloves issued?', category: 'PPE Verification', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-06' }
      ]
    },
    {
      id: 'TMPL-DIVE',
      permitType: 'Diving Operation',
      title: 'Diving Operation Safety Checklist',
      formReference: '09F-006-04 (Synergy Diving)',
      description: 'Underwater hull cleaning/inspection, sea chest isolation, propeller/thruster LOTO, ECR warning signs, and Alpha flag verification.',
      defaultPpe: ['Full Diving Rig (Contractor)', 'Deck VHF Radios', 'SOLAS Lifebuoy with Line', 'Safety Helmet & Boots (Deck Team)'],
      specificValidations: [
        'All answers must be "YES" for completion of permit',
        'Main propulsion, thrusters, and steering gear MUST be immobilized and LOTO tagged',
        'Alpha Flag (Diver Down) must be hoisted on the foremast'
      ],
      items: [
        { id: 'DV-01', question: 'Has the vessel\'s Main Propulsion been made safe against startup with LOTO padlocks?', category: 'Propulsion Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-02', question: 'Has prominent warning sign been posted in ECR: \"DIVERS AT WORK - DO NOT START\"?', category: 'ECR Notification', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-03', question: 'Have all tunnel thrusters (bow/stern) been made safe against startup with LOTO?', category: 'Thruster Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-04', question: 'Have Steering Gear Motors been made safe with electrical breaker isolation?', category: 'Steering Isolation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-05', question: 'Have all non-critical sea water intake pumps been isolated with LOTO?', category: 'Suction Hazards', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-06', question: 'Has remaining sea water intake been reduced to operating minimum safe level?', category: 'Suction Hazards', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-07', question: 'Have echo sounder hull transducers been switched off during the operation?', category: 'Acoustic Hazards', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-08', question: 'Has Impressed Current Cathodic Protection (ICCP) system been switched off?', category: 'Electrical Current', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-09', question: 'Have all over-the-side operations been stopped (including cargo transfer & bunkering)?', category: 'SIMOPS Control', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-10', question: 'Has Alpha-flag (Flag A: \"I have a diver down\") been hoisted prominently on mast?', category: 'Navigation Signaling', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-11', question: 'Is direct communication established between Deck-watch, Diving Supervisor, and Bridge?', category: 'Communications', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' },
        { id: 'DV-12', question: 'Have Emergency Procedures and decompression protocols been discussed and verified?', category: 'Emergency Procedures', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-04' }
      ]
    },
    {
      id: 'TMPL-ASB',
      permitType: 'Asbestos Work',
      title: 'Asbestos Work Safety Checklist',
      formReference: '09F-006-08 (Rev. 1)',
      description: 'DPA explicit authorization, pocket-less disposable overalls, BS 4555 respiratory protection, and sealed container shore disposal.',
      defaultPpe: ['Pocket-less Disposable Coverall', 'Approved Respirator Face Mask BS 4555:1970', 'Disposable Headgear', 'Disposable Gloves', 'Rubber Safety Boots'],
      specificValidations: [
        'Explicit written permission from Designated Person Ashore (DPA) mandatory',
        'All asbestos garbage must be kept in sealed containers and marked for shore disposal'
      ],
      items: [
        { id: 'AS-01', question: 'Has explicit written permission from Designated Person Ashore (DPA) been received?', category: 'Management Approval', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' },
        { id: 'AS-02', question: 'Has the option of alternate means of non-asbestos repair been exhausted?', category: 'Repair Evaluation', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' },
        { id: 'AS-03', question: 'Is pocket-less disposable overall suitable for asbestos work worn by all personnel?', category: 'Protective Clothing', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' },
        { id: 'AS-04', question: 'Is approved face-mask BS 4555:1970 or equivalent worn with confirmed facial seal?', category: 'Respiratory Protection', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' },
        { id: 'AS-05', question: 'Are disposable headgear and disposable gloves issued and donned?', category: 'PPE Verification', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' },
        { id: 'AS-06', question: 'Is suitable lighting and safe access/egress provided?', category: 'Worksite Safety', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' },
        { id: 'AS-07', question: 'Is work area clean, dry, and sealed off with plastic sheeting?', category: 'Containment', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' },
        { id: 'AS-08', question: 'Are Watchmen nominated, instructed, and standing by at decontamination boundary?', category: 'Safety Watch', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' },
        { id: 'AS-09', question: 'Has Toolbox Meeting / JSA been conducted and risk assessment verified?', category: 'Briefing', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' },
        { id: 'AS-10', question: 'All asbestos waste kept in heavy-duty sealed containers suitably marked for shore disposal?', category: 'Waste Disposal', requiredAnswer: 'YES', isMandatory: true, clientFormRef: '09F-006-08' }
      ]
    }
  ]);

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

  // 7. Configurable Permit Types (Master Data Governance - 100% Client Forms Aligned)
  readonly permitTypes = signal<PermitTypeItem[]>([
    {
      id: 'PT-HOT',
      code: 'PTW-HOT',
      displayName: 'Hot Work',
      formRef: '09F-006-03 (Rev. 2)',
      description: 'Hot work, open flame, electric welding, oxygen/acetylene burning, and spark-producing grinding operations.',
      sortOrder: 1,
      isActive: true,
      badgeColor: '#d97706',
      associatedTemplateId: 'TMPL-HOT',
      sections: {
        requiresWorkCrew: true,
        requiresSafetyWatch: true,
        requiresMasterChecklist: true,
        requiresGasTesting: false,
        requiresMultiLevelGas: false,
        requiresPeriodicGasLog: false,
        requiresLotoIsolation: false,
        requiresIsolationPointsTable: false,
        requiresEnergySources: false,
        requiresElectricalChecklist: false,
        requiresColdWorkSubChecklists: false,
        requiresEmergencyEquipment: true,
        requiresSimops: true,
        requiresDivingControls: false,
        requiresAsbestosControls: false,
        allowCustomChecks: true
      },
      defaultHazards: 'Hot sparks, molten slag, flammable paint/coating ignition, toxic welding fumes, UV arc radiation, burn injury.',
      defaultControls: 'Nominated fire watch stationed with charged fire hose & 2x 9L foam extinguishers. 15m radius cleared of combustibles. Mandatory 30-minute post-work fire monitoring.',
      defaultPpe: ['Welding Shield / Face Visor', 'Leather Welding Apron', 'Heat Resistant Gloves', 'Safety Boots (Steel Toe)', 'Safety Helmet'],
      simopsDefaultNotes: 'No bunkering, fuel transfer, or painting within 15 meters during hot work operations.'
    },
    {
      id: 'PT-CONF',
      code: 'PTW-CONF',
      displayName: 'Confined Space Entry',
      formRef: '09F-006-02 (Rev. 3)',
      description: 'Entry into enclosed, connected, or adjacent spaces with restricted ventilation (single-person entry prohibited).',
      sortOrder: 2,
      isActive: true,
      badgeColor: '#2563eb',
      associatedTemplateId: 'TMPL-CONF',
      sections: {
        requiresWorkCrew: true,
        requiresSafetyWatch: false,
        requiresMasterChecklist: true,
        requiresGasTesting: true,
        requiresMultiLevelGas: true,
        requiresPeriodicGasLog: true,
        requiresLotoIsolation: true,
        requiresIsolationPointsTable: false,
        requiresEnergySources: false,
        requiresElectricalChecklist: false,
        requiresColdWorkSubChecklists: false,
        requiresEmergencyEquipment: true,
        requiresSimops: true,
        requiresDivingControls: false,
        requiresAsbestosControls: false,
        allowCustomChecks: true
      },
      defaultHazards: 'Oxygen deficiency (<20.9%), toxic gas pockets (H2S, VOC, CO, CO2), flammable hydrocarbons (>1% LEL), entrapment.',
      defaultControls: 'Continuous forced mechanical draft ventilation running. Dedicated attendant stationed at tank entrance with radio and entry logboard. Multi-level atmospheric tests verified at top, middle, and bottom.',
      defaultPpe: ['Personal 4-Gas Detector', 'Full Body Safety Harness', 'Safety Helmet', 'Intrinsically Safe Torch', 'Chemical/Safety Boots', 'EEBD Escape Set'],
      simopsDefaultNotes: 'No hot work, tank washing, or cargo manifold operations permitted on connected or adjacent tanks.'
    },
    {
      id: 'PT-ELEC',
      code: 'PTW-ELEC',
      displayName: 'Electrical Work',
      formRef: '09F-006-05 (Rev. 1)',
      description: 'Work on low voltage (0-440V) and high voltage (440V-6.6kV) electrical systems, switchboards, and power isolation.',
      sortOrder: 3,
      isActive: true,
      badgeColor: '#7c3aed',
      associatedTemplateId: 'TMPL-ELEC',
      sections: {
        requiresWorkCrew: true,
        requiresSafetyWatch: false,
        requiresMasterChecklist: true,
        requiresGasTesting: false,
        requiresMultiLevelGas: false,
        requiresPeriodicGasLog: false,
        requiresLotoIsolation: true,
        requiresIsolationPointsTable: true,
        requiresEnergySources: true,
        requiresElectricalChecklist: true,
        requiresColdWorkSubChecklists: false,
        requiresEmergencyEquipment: false,
        requiresSimops: false,
        requiresDivingControls: false,
        requiresAsbestosControls: false,
        allowCustomChecks: true
      },
      defaultHazards: 'High voltage electrical shock (440V / 6.6kV), arc flash explosion, unintended remote start, residual capacitance charge.',
      defaultControls: 'Circuit breaker racked out to disconnected test position. Busbar earthing switch closed and locked. "In Service" keys removed. Calibrated high-voltage probe verification before touching conductors.',
      defaultPpe: ['Insulating Rubber Gloves', 'Electrical Arc-Flash Face Shield', 'Non-conductive Safety Boots', 'Flame Retardant Coverall', 'Safety Helmet with Chin Strap'],
      simopsDefaultNotes: 'No parallel generator synchronization or bus tie connection tests during switchboard work.'
    },
    {
      id: 'PT-COLD',
      code: 'PTW-COLD',
      displayName: 'Cold Work',
      formRef: '09F-006-06 (Rev. 2)',
      description: 'Mechanical overhauls, pipeline blanking/deblanking, pressure vessel maintenance, and non-sparking cutting.',
      sortOrder: 4,
      isActive: true,
      badgeColor: '#475569',
      associatedTemplateId: 'TMPL-COLD',
      sections: {
        requiresWorkCrew: true,
        requiresSafetyWatch: false,
        requiresMasterChecklist: true,
        requiresGasTesting: false,
        requiresMultiLevelGas: false,
        requiresPeriodicGasLog: false,
        requiresLotoIsolation: true,
        requiresIsolationPointsTable: true,
        requiresEnergySources: false,
        requiresElectricalChecklist: false,
        requiresColdWorkSubChecklists: true,
        requiresEmergencyEquipment: false,
        requiresSimops: false,
        requiresDivingControls: false,
        requiresAsbestosControls: false,
        allowCustomChecks: true
      },
      defaultHazards: 'Mechanical pinch points, high pressure fluid injection, flying metal debris, heavy dropped objects, chemical splashes.',
      defaultControls: 'Mechanical lifting chain hoists inspected. Pneumatic lines secured with whip-checks. System lines disconnected and blanked off. Drip trays provided.',
      defaultPpe: ['Safety Helmet', 'Safety Glasses / Goggles', 'Leather Work Gloves', 'Safety Boots (Steel Toe)', 'Close Fitting Protective Overalls'],
      simopsDefaultNotes: 'Adjacent work areas notified of heavy mechanical disassembly.'
    },
    {
      id: 'PT-ALOFT',
      code: 'PTW-ALOFT',
      displayName: 'Working Aloft',
      formRef: '09F-006-06 (Section Aloft)',
      description: 'Work at heights exceeding 2 meters on masts, funnels, cranes, radar platforms, and monkey islands.',
      sortOrder: 5,
      isActive: true,
      badgeColor: '#0284c7',
      associatedTemplateId: 'TMPL-ALOFT',
      sections: {
        requiresWorkCrew: true,
        requiresSafetyWatch: false,
        requiresMasterChecklist: true,
        requiresGasTesting: false,
        requiresMultiLevelGas: false,
        requiresPeriodicGasLog: false,
        requiresLotoIsolation: true,
        requiresIsolationPointsTable: false,
        requiresEnergySources: false,
        requiresElectricalChecklist: false,
        requiresColdWorkSubChecklists: false,
        requiresEmergencyEquipment: false,
        requiresSimops: true,
        requiresDivingControls: false,
        requiresAsbestosControls: false,
        allowCustomChecks: true
      },
      defaultHazards: 'Fall from height (>2m), dropped objects onto wheelhouse/deck, radar RF radiation, whistle acoustic shock, funnel exhaust gas.',
      defaultControls: 'Full body harness with inertia reel lifeline. Radar scanners turned off and tagged. Transmitters disabled. Whistle disabled. Funnel emissions reduced.',
      defaultPpe: ['Full Body Fall Arrest Harness', 'Inertia Reel Fall Arrester', 'Safety Helmet with Chin Strap', 'Tool Lanyards & Pouches', 'Non-slip Safety Boots'],
      simopsDefaultNotes: 'Deck area directly below mast roped off with warning tape. Bridge lookout informed.'
    },
    {
      id: 'PT-OVER',
      code: 'PTW-OVER',
      displayName: 'Working Overboard',
      formRef: '09F-006-06 (Section Outboard)',
      description: 'Work over the shipside, outboard painting, staging, hull inspection, and draft mark checking.',
      sortOrder: 6,
      isActive: true,
      badgeColor: '#0369a1',
      associatedTemplateId: 'TMPL-OVER',
      sections: {
        requiresWorkCrew: true,
        requiresSafetyWatch: true,
        requiresMasterChecklist: true,
        requiresGasTesting: false,
        requiresMultiLevelGas: false,
        requiresPeriodicGasLog: false,
        requiresLotoIsolation: true,
        requiresIsolationPointsTable: false,
        requiresEnergySources: false,
        requiresElectricalChecklist: false,
        requiresColdWorkSubChecklists: false,
        requiresEmergencyEquipment: false,
        requiresSimops: true,
        requiresDivingControls: false,
        requiresAsbestosControls: false,
        allowCustomChecks: true
      },
      defaultHazards: 'Fall into sea, cold shock, drowning, hypothermia, propeller/thruster wash, overboard discharges.',
      defaultControls: 'Vessel stopped / lee made. GPS Navigator MOB function tested. Auto-inflate lifejacket donned. Standby man in attendance. Propeller/thrusters immobilized. Rescue boat standby.',
      defaultPpe: ['Auto-inflate SOLAS Lifejacket', 'Full Body Safety Harness with Lifeline', 'Inertia Reel Fall Arrester', 'Safety Helmet with Chin Strap', 'Non-slip Safety Boots'],
      simopsDefaultNotes: 'No bilge/ballast discharge, crane slewing, or small boat operations on the active outboard side.'
    },
    {
      id: 'PT-DIVE',
      code: 'PTW-DIVE',
      displayName: 'Diving Operation',
      formRef: '09F-006-04 (Synergy Diving)',
      description: 'Underwater hull cleaning, propeller polishing, sea chest inspection, and subsea maritime repairs.',
      sortOrder: 7,
      isActive: true,
      badgeColor: '#0d9488',
      associatedTemplateId: 'TMPL-DIVE',
      sections: {
        requiresWorkCrew: false,
        requiresSafetyWatch: false,
        requiresMasterChecklist: true,
        requiresGasTesting: false,
        requiresMultiLevelGas: false,
        requiresPeriodicGasLog: false,
        requiresLotoIsolation: true,
        requiresIsolationPointsTable: false,
        requiresEnergySources: false,
        requiresElectricalChecklist: false,
        requiresColdWorkSubChecklists: false,
        requiresEmergencyEquipment: false,
        requiresSimops: true,
        requiresDivingControls: true,
        requiresAsbestosControls: false,
        allowCustomChecks: true
      },
      defaultHazards: 'Differential pressure (Delta P), thruster entrainment, vessel movement, decompression sickness, umbilical fouling.',
      defaultControls: 'Commercial Diving Supervisor on site. Flag Alpha hoisted. Propulsion, thrusters, steering gear immobilized. Sea water suctions throttled. ECR sign posted.',
      defaultPpe: ['Full Diving Rig (Contractor)', 'Deck VHF Radios', 'SOLAS Lifebuoy with Line', 'Safety Helmet & Boots (Deck Team)'],
      simopsDefaultNotes: 'No vessel maneuvers, anchor handling, or overboard discharge during active dive window.'
    },
    {
      id: 'PT-ASB',
      code: 'PTW-ASB',
      displayName: 'Asbestos Work',
      formRef: '09F-006-08 (Rev. 1)',
      description: 'Controlled maintenance, handling, or removal of asbestos-containing insulation or gasket materials.',
      sortOrder: 8,
      isActive: true,
      badgeColor: '#e11d48',
      associatedTemplateId: 'TMPL-ASB',
      sections: {
        requiresWorkCrew: true,
        requiresSafetyWatch: true,
        requiresMasterChecklist: true,
        requiresGasTesting: false,
        requiresMultiLevelGas: false,
        requiresPeriodicGasLog: false,
        requiresLotoIsolation: false,
        requiresIsolationPointsTable: false,
        requiresEnergySources: false,
        requiresElectricalChecklist: false,
        requiresColdWorkSubChecklists: false,
        requiresEmergencyEquipment: false,
        requiresSimops: true,
        requiresDivingControls: false,
        requiresAsbestosControls: true,
        allowCustomChecks: true
      },
      defaultHazards: 'Inhalation of hazardous airborne asbestos fibers, accommodation contamination, chronic pulmonary disease.',
      defaultControls: 'Explicit written permission from DPA. Alternate repair means exhausted. Pocket-less disposable overalls. Approved respirator BS 4555:1970. Sealed waste containers for shore disposal.',
      defaultPpe: ['Pocket-less Disposable Coverall', 'Approved Respirator Face Mask BS 4555:1970', 'Disposable Headgear', 'Disposable Gloves', 'Rubber Safety Boots'],
      simopsDefaultNotes: 'Work area isolated; ventilation intake to living quarters sealed during removal.'
    }
  ]);

  readonly activePermitTypes = computed(() => 
    this.permitTypes().filter(pt => pt.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  );

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

  // 6. Risk Assessments (100% Client Forms 07F-001-01 and 07F-001-02 Aligned)
  readonly riskAssessments = signal<RiskAssessmentRecord[]>([
    {
      id: 'RA-01',
      referenceNo: 'RA-2026-0057',
      formReference: 'Marine 5x5 Risk Matrix',
      vesselId: 'VES-02',
      vesselName: 'MT Nordic Titan',
      charterer: 'Saudi Aramco MOMs',
      department: 'Deck Department',
      location: 'Cargo Tank 3 Port (Wing Tank)',
      activityTitle: 'Cargo Tank 3 Port Confined Space Entry for Internal Anode Inspection',
      assessmentType: 'Non-Routine High Risk',
      assessmentDate: '2026-10-02',
      assessmentTime: '08:30',
      validityExpiryDate: '2026-10-08',
      lastAssessmentDate: '2026-04-12',
      similarTaskReference: 'RA-2026-0019',
      leadAssessor: 'Chief Officer K. Hansen',
      leadAssessorRank: 'Chief Officer',
      teamMembers: ['Chief Officer K. Hansen', 'Safety Officer A. Roy', 'Pumpman G. Patel'],
      assessmentTeam: [
        { name: 'K. Hansen', rank: 'Chief Officer', signature: 'K. Hansen (Verified)', briefed: true },
        { name: 'A. Roy', rank: 'Safety Officer', signature: 'A. Roy (Verified)', briefed: true },
        { name: 'G. Patel', rank: 'Pumpman', signature: 'G. Patel (Verified)', briefed: true }
      ],
      approver: 'Capt. H. Miller (Master)',
      approverRank: 'Master',
      requiredApproverRole: 'HSEQ Manager / Superintendent',
      escalationRequired: true,
      escalationRole: 'HSEQ Manager',
      approvedAt: '2026-10-02 16:30',
      reviewDate: '2026-10-08',
      additionalComments: 'Strict adherence to 3-level atmospheric gas checks and continuous extraction ventilation mandated.',
      maxInitialRisk: 'High',
      maxResidualRisk: 'Low',
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Atmospheric cleaning, mechanical ventilation and continuous gas testing',
          hazardCategory: 'Environments / Housekeeping',
          hazards: 'Oxygen deficiency (<20.8%), toxic hydrocarbon vapour pockets, H2S residual contamination',
          affectedEntities: 'Entry team, standby watch',
          likelihoodLetter: 'B',
          severityLevel: 'I',
          riskFactor: 'High',
          initialLikelihood: 4,
          initialConsequence: 5,
          initialRating: 20,
          existingControls: 'Forced draft air blowers running 48 hours; multi-gas detector deployed on top/middle/bottom levels',
          documentReference: 'PTW-CONF-01, SMS-SOP-018',
          ptwRequired: true,
          ptwType: 'Confined Space Entry',
          additionalControls: 'Continuous personal 4-gas monitors for all entrants; tripod recovery winch & SCBA on deck standby',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'III',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 3,
          residualRating: 3,
          remedialAction: 'Inspect calibration logs prior to hatch break',
          hierarchy: 'Engineering',
          alarpAchieved: true
        },
        {
          stepNumber: 2,
          stepDescription: 'Vertical ladder descent and internal staging traversal',
          hazardCategory: 'Body Positions / Line of Fire',
          hazards: 'Slips on oily film residue, fall from height (>12 meters)',
          affectedEntities: 'Inspectors & entry team',
          likelihoodLetter: 'C',
          severityLevel: 'II',
          riskFactor: 'High',
          initialLikelihood: 3,
          initialConsequence: 4,
          initialRating: 12,
          existingControls: 'Non-slip safety boots, full body safety harness with twin fall arrest lanyards',
          documentReference: 'SMS-SOP-024',
          ptwRequired: false,
          additionalControls: 'Inspection path pre-washed with degreaser and dry-wiped; intrinsically safe high-lumen headlamps deployed',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'IV',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 2,
          residualRating: 2,
          remedialAction: 'Rig secondary lifeline at stringer platform',
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
    },
    {
      id: 'RA-02',
      referenceNo: 'RA-2026-0044',
      formReference: 'Marine 5x5 Risk Matrix',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      charterer: 'ADNOC Logistics & Services',
      department: 'Engine Department',
      location: 'Engine Room Workshop Intermediate Level',
      activityTitle: 'MIG Welding & Structural Bracket Reinforcement on Hatch Cover Lashing Bin',
      assessmentType: 'Routine Operation',
      assessmentDate: '2026-10-05',
      assessmentTime: '09:00',
      validityExpiryDate: '2026-10-12',
      lastAssessmentDate: '2026-07-15',
      similarTaskReference: 'RA-2026-0012',
      leadAssessor: 'Chief Engineer M. Rossi',
      leadAssessorRank: 'Chief Engineer',
      teamMembers: ['Chief Engineer M. Rossi', '2nd Engineer J. Kowalski', 'Fitter S. Kouris', 'Bosun D. Silva'],
      assessmentTeam: [
        { name: 'M. Rossi', rank: 'Chief Engineer', signature: 'M. Rossi (Verified)', briefed: true },
        { name: 'J. Kowalski', rank: '2nd Engineer', signature: 'J. Kowalski (Verified)', briefed: true },
        { name: 'S. Kouris', rank: 'Fitter', signature: 'S. Kouris (Verified)', briefed: true },
        { name: 'D. Silva', rank: 'Bosun', signature: 'D. Silva (Verified)', briefed: true }
      ],
      approver: 'Capt. R. Sterling (Master)',
      approverRank: 'Master',
      requiredApproverRole: 'Department Head (C/O / C/E)',
      escalationRequired: false,
      approvedAt: '2026-10-05 11:30',
      reviewDate: '2026-10-12',
      additionalComments: 'Nominated fire watch with 30-minute post-work continuous damp monitoring mandatory.',
      maxInitialRisk: 'High',
      maxResidualRisk: 'Low',
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Area preparation, combustible removal and boundary shielding',
          hazardCategory: 'Environments / Housekeeping',
          hazards: 'Hot sparks, molten slag, flammable paint/coating ignition, adjacent oil bilge vapours',
          affectedEntities: 'Workshop team & surrounding machinery spaces',
          likelihoodLetter: 'B',
          severityLevel: 'I',
          riskFactor: 'High',
          initialLikelihood: 4,
          initialConsequence: 5,
          initialRating: 20,
          existingControls: '15-meter radius cleared of all combustibles; scuppers and savealls plugged',
          documentReference: 'PTW-HOT-01, Form 09F-006-03',
          ptwRequired: true,
          ptwType: 'Hot Work',
          additionalControls: 'Heavy-duty certified fire blankets draped over switchgear; nominated dedicated fire watch with charged fire hose & 2x 9L foam extinguishers',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'III',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 3,
          residualRating: 3,
          remedialAction: 'Verify fire main line pressurized to 7.5 bar before hot work starts',
          hierarchy: 'Engineering',
          alarpAchieved: true
        },
        {
          stepNumber: 2,
          stepDescription: 'MIG welding arc execution and hot slag chipping',
          hazardCategory: 'Personal Protection',
          hazards: 'UV/IR arc radiation, toxic welding fumes, electrical shock, flying slag eye trauma',
          affectedEntities: 'Fitter S. Kouris, Fire watch',
          likelihoodLetter: 'C',
          severityLevel: 'III',
          riskFactor: 'Moderate',
          initialLikelihood: 3,
          initialConsequence: 3,
          initialRating: 9,
          existingControls: 'Leather welding apron, gauntlets, auto-darkening welding shield, steel-toe boots',
          documentReference: 'SMS-SOP-011',
          ptwRequired: false,
          additionalControls: 'Local portable fume extraction trunking positioned 30cm from weld pool; dielectric rubber matting under operator',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'IV',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 2,
          residualRating: 2,
          remedialAction: 'Inspect return earth clamp directly attached to workpiece',
          hierarchy: 'PPE',
          alarpAchieved: true
        }
      ],
      linkedProcedures: ['SMS-SOP-011: Hot Work Safety Guidelines', 'SMS-SOP-029: Fire Watch Protocols'],
      linkedPermits: ['PTW-2026-0190'],
      status: 'Approved',
      auditTrail: [
        { timestamp: '2026-10-05 10:00', user: 'Chief Engineer M. Rossi', role: 'Department Head', action: 'Risk Assessment Drafted' },
        { timestamp: '2026-10-05 11:30', user: 'Capt. R. Sterling', role: 'Approver', action: 'Risk Assessment Formally Approved' }
      ]
    },
    {
      id: 'RA-03',
      referenceNo: 'RA-2026-0091',
      formReference: 'Simplified JSA',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      charterer: 'ADNOC Logistics & Services',
      department: 'Deck Department',
      location: 'Forecastle Fore & Aft Main Mast Aloft Platform',
      activityTitle: 'Main Mast S-Band Radar Scanner Drive Motor Replacement & Gearbox Lubrication',
      assessmentType: 'Non-Routine High Risk',
      assessmentDate: '2026-10-08',
      assessmentTime: '14:00',
      validityExpiryDate: '2026-10-15',
      lastAssessmentDate: '2026-02-18',
      similarTaskReference: 'RA-2026-0008',
      leadAssessor: 'Chief Officer K. Hansen',
      leadAssessorRank: 'Chief Officer',
      teamMembers: ['Chief Officer K. Hansen', 'ETO L. Chen', 'Bosun D. Silva'],
      assessmentTeam: [
        { name: 'K. Hansen', rank: 'Chief Officer', signature: 'K. Hansen', briefed: true },
        { name: 'L. Chen', rank: 'ETO', signature: 'L. Chen', briefed: true },
        { name: 'D. Silva', rank: 'Bosun', signature: 'D. Silva', briefed: true }
      ],
      approver: 'Department Head (C/O / C/E)',
      approverRank: 'Department Head',
      requiredApproverRole: 'Department Head (C/O / C/E)',
      escalationRequired: false,
      additionalComments: 'Work aloft strictly prohibited in sea state > 3 or winds > 18 knots.',
      maxInitialRisk: 'High',
      maxResidualRisk: 'Moderate',
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Radar power isolation, RF antenna deactivation and LOTO lock out',
          hazardCategory: 'Procedures / Safe Work',
          hazards: 'High-frequency microwave RF radiation, unexpected antenna rotation, 440V electrical shock',
          affectedEntities: 'Technicians climbing mast',
          likelihoodLetter: 'B',
          severityLevel: 'II',
          riskFactor: 'High',
          initialLikelihood: 4,
          initialConsequence: 4,
          initialRating: 16,
          existingControls: 'Radar circuit breakers opened on Bridge switchboard; warning signs posted',
          documentReference: 'PTW-ALOFT-01, SMS-SOP-014',
          ptwRequired: true,
          ptwType: 'Working Aloft',
          additionalControls: 'Physical padlock key tagged in Master safe; scanner drive mechanically pinned with locking pin; Officer of Watch logged',
          residualLikelihoodLetter: 'D',
          residualSeverityLevel: 'III',
          residualRiskFactor: 'Moderate',
          residualLikelihood: 2,
          residualConsequence: 3,
          residualRating: 6,
          remedialAction: 'Bridge watchkeeper confirmation sign-off prior to ascent',
          hierarchy: 'Engineering',
          alarpAchieved: true
        },
        {
          stepNumber: 2,
          stepDescription: 'Climbing vertical mast ladder and component hoists to 18m platform',
          hazardCategory: 'Body Positions / Line of Fire',
          hazards: 'Fall from extreme height (>18 meters), dropped motor parts onto Wheelhouse roof',
          affectedEntities: 'Aloft team and personnel on monkey island',
          likelihoodLetter: 'B',
          severityLevel: 'I',
          riskFactor: 'High',
          initialLikelihood: 4,
          initialConsequence: 5,
          initialRating: 20,
          existingControls: 'Safety harness with inertia reel fall arrester; monkey island barricaded with red tape',
          documentReference: 'SMS-SOP-014',
          ptwRequired: true,
          ptwType: 'Working Aloft',
          additionalControls: 'Certified double-lanyard 100% tie-off; canvas hoist tool bag with wrist lanyards for all hand tools; weather limit verified (<15 kts)',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'III',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 3,
          residualRating: 3,
          remedialAction: 'Verify harness inspection tag date valid within 6 months',
          hierarchy: 'Administrative',
          alarpAchieved: true
        }
      ],
      linkedProcedures: ['SMS-SOP-014: Working Aloft & Overboard Safety', 'SMS-SOP-009: Electrical Isolation & LOTO'],
      linkedPermits: [],
      status: 'Under Review',
      auditTrail: [
        { timestamp: '2026-10-08 14:15', user: 'Chief Officer K. Hansen', role: 'Assessor', action: 'Risk Assessment Submitted for Department Head Review' }
      ]
    },
    {
      id: 'RA-04',
      referenceNo: 'RA-2026-0104',
      formReference: 'Simplified JSA',
      vesselId: 'VES-04',
      vesselName: 'AHTS Ocean Guardian',
      charterer: 'Saudi Aramco MOMs',
      department: 'Deck Department',
      location: 'Aft Working Deck & Stern Roller Area',
      activityTitle: 'Anchor Handling Pennant Wire Spooling and Karm Fork Lockout Operations',
      assessmentType: 'Task-Based JSA',
      assessmentDate: '2026-10-09',
      assessmentTime: '07:30',
      validityExpiryDate: '2026-10-16',
      leadAssessor: 'Chief Officer N. Petrov',
      leadAssessorRank: 'Chief Officer',
      teamMembers: ['Chief Officer N. Petrov', 'Bosun T. Ramos', 'AB S. Gomez'],
      assessmentTeam: [
        { name: 'N. Petrov', rank: 'Chief Officer', signature: 'N. Petrov', briefed: true },
        { name: 'T. Ramos', rank: 'Bosun', signature: 'T. Ramos', briefed: true },
        { name: 'S. Gomez', rank: 'Able Seaman', signature: 'S. Gomez', briefed: true }
      ],
      approver: 'Supervisor / Watch Officer',
      approverRank: 'Supervisor',
      requiredApproverRole: 'Supervisor / Watch Officer',
      escalationRequired: false,
      additionalComments: 'Deck crew to maintain clear line of fire at all times outside hydraulic tow pin release zones.',
      maxInitialRisk: 'Moderate',
      maxResidualRisk: 'Low',
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Deployment of hydraulic shark jaws and pennant wire alignment',
          hazardCategory: 'Line of Fire / Snapback',
          hazards: 'Parting wire rope snapback, pinch point between karm fork jaws',
          affectedEntities: 'Deck crew on crash barrier',
          likelihoodLetter: 'C',
          severityLevel: 'II',
          riskFactor: 'Moderate',
          initialLikelihood: 3,
          initialConsequence: 4,
          initialRating: 12,
          existingControls: 'Personnel positioned behind safety crash barrier; remote bridge operation controls',
          documentReference: 'SMS-SOP-033',
          ptwRequired: false,
          additionalControls: 'Clear verbal communication via dedicated VHF Ch. 72; hard hats, high-vis flotation vests',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'IV',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 2,
          residualRating: 2,
          remedialAction: 'Deck camera operational check on bridge screen',
          hierarchy: 'Engineering',
          alarpAchieved: true
        }
      ],
      linkedProcedures: ['SMS-SOP-033: Anchor Handling & Towing Operations'],
      linkedPermits: [],
      status: 'Draft',
      auditTrail: [
        { timestamp: '2026-10-09 07:30', user: 'Chief Officer N. Petrov', role: 'Department Head', action: 'Initial Draft Created' }
      ]
    },
    {
      id: 'RA-05',
      referenceNo: 'RA-2026-0082',
      formReference: 'Marine 5x5 Risk Matrix',
      vesselId: 'VES-05',
      vesselName: 'PSV Crest Horizon',
      charterer: 'ADNOC Logistics & Services',
      department: 'Marine Operations',
      location: 'Subsea Moonpool & Dive Launch Staging',
      activityTitle: 'Deep Water Subsea Intervention & Diver Umbilical Wet Deployment',
      assessmentType: 'Non-Routine High Risk',
      assessmentDate: '2026-10-04',
      assessmentTime: '10:00',
      validityExpiryDate: '2026-10-10',
      leadAssessor: 'Dive Superintendent M. Clarke',
      leadAssessorRank: 'Superintendent',
      teamMembers: ['Dive Superintendent M. Clarke', 'Dive Supervisor R. Kelly'],
      assessmentTeam: [
        { name: 'M. Clarke', rank: 'Superintendent', signature: 'M. Clarke', briefed: true },
        { name: 'R. Kelly', rank: 'Supervisor', signature: 'R. Kelly', briefed: true }
      ],
      approver: 'HSEQ Manager / Superintendent',
      approverRank: 'HSEQ Manager',
      requiredApproverRole: 'HSEQ Manager / Superintendent',
      escalationRequired: true,
      escalationRole: 'DPA',
      rejectionReason: 'Secondary hydraulic backup and hyperbaric chamber evacuation protocol insufficient. Thruster DP physical cage verification missing.',
      rejectedBy: 'HSEQ Manager S. Al-Mansoor',
      rejectedAt: '2026-10-04 15:45',
      additionalComments: 'REJECTED: Secondary hydraulic backup and hyperbaric chamber evacuation protocol insufficient.',
      maxInitialRisk: 'Critical',
      maxResidualRisk: 'High',
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'LARS A-Frame launch and umbilical payout over stern',
          hazardCategory: 'Subsea Entanglement',
          hazards: 'Thruster suction, dynamic positioning drift, loss of diver air umbilical',
          affectedEntities: 'Divers and launch crew',
          likelihoodLetter: 'A',
          severityLevel: 'I',
          riskFactor: 'High',
          initialLikelihood: 5,
          initialConsequence: 5,
          initialRating: 25,
          existingControls: 'DP2 capability maintained',
          documentReference: 'IMCA D014',
          ptwRequired: true,
          ptwType: 'Diving Operation',
          additionalControls: 'Requires additional physical propeller cage verification before re-submission',
          residualLikelihoodLetter: 'C',
          residualSeverityLevel: 'II',
          residualRiskFactor: 'High',
          residualLikelihood: 3,
          residualConsequence: 4,
          residualRating: 12,
          remedialAction: 'Revise risk mitigations with DPA and class surveyor',
          hierarchy: 'Administrative',
          alarpAchieved: false
        }
      ],
      linkedProcedures: ['SMS-SOP-041: Diving Safety Operations'],
      linkedPermits: [],
      status: 'Rejected',
      auditTrail: [
        { timestamp: '2026-10-04 10:00', user: 'Dive Superintendent M. Clarke', role: 'Superintendent', action: 'Submitted for Approval' },
        { timestamp: '2026-10-04 15:45', user: 'HSEQ Manager S. Al-Mansoor', role: 'Approver', action: 'Rejected due to inadequate thruster isolation safeguard' }
      ]
    },
    {
      id: 'RA-06',
      referenceNo: 'RA-2026-0015',
      formReference: 'Marine 5x5 Risk Matrix',
      vesselId: 'VES-03',
      vesselName: 'MV Atlantic Pioneer',
      charterer: 'Saudi Aramco MOMs',
      department: 'Deck Department',
      location: 'Mooring Deck Forward & Aft',
      activityTitle: 'Mooring Winch Brake Rendering & Brake Holding Capacity Annual Verification',
      assessmentType: 'Routine Operation',
      assessmentDate: '2025-09-15',
      assessmentTime: '09:00',
      validityExpiryDate: '2026-09-15',
      leadAssessor: 'Chief Officer K. Hansen',
      leadAssessorRank: 'Chief Officer',
      teamMembers: ['Chief Officer K. Hansen', 'Bosun J. Alvarez'],
      assessmentTeam: [
        { name: 'K. Hansen', rank: 'Chief Officer', signature: 'K. Hansen', briefed: true },
        { name: 'J. Alvarez', rank: 'Bosun', signature: 'J. Alvarez', briefed: true }
      ],
      approver: 'Capt. F. Larson (Master)',
      approverRank: 'Master',
      requiredApproverRole: 'Supervisor / Watch Officer',
      escalationRequired: false,
      approvedAt: '2025-09-15 14:00',
      additionalComments: 'Expired annual cycle. Re-assessment required prior to next mooring test.',
      maxInitialRisk: 'Moderate',
      maxResidualRisk: 'Low',
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Hydraulic jack test rig setup on brake band drum',
          hazardCategory: 'High Pressure Hydraulics',
          hazards: 'High pressure hydraulic oil injection, pin release under tension',
          affectedEntities: 'Test team',
          likelihoodLetter: 'C',
          severityLevel: 'III',
          riskFactor: 'Moderate',
          initialLikelihood: 3,
          initialConsequence: 3,
          initialRating: 9,
          existingControls: 'Pressure relief valve calibrated; whip check on hydraulic hose',
          documentReference: 'OCIMF MEG4',
          ptwRequired: false,
          additionalControls: 'Protective shroud fitted around hydraulic ram',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'IV',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 2,
          residualRating: 2,
          remedialAction: 'Torque gauge certification check',
          hierarchy: 'Engineering',
          alarpAchieved: true
        }
      ],
      linkedProcedures: ['SMS-SOP-019: Mooring Safety Protocol'],
      linkedPermits: [],
      status: 'Expired',
      auditTrail: [
        { timestamp: '2025-09-15 14:00', user: 'Capt. F. Larson', role: 'Approver', action: 'Approved for 12 months' },
        { timestamp: '2026-09-15 00:00', user: 'System (Scheduler)', role: 'System', action: 'Record marked Expired' }
      ]
    },
    {
      id: 'RA-07',
      referenceNo: 'RA-2026-0112',
      formReference: 'Marine 5x5 Risk Matrix',
      vesselId: 'VES-07',
      vesselName: 'MV Polaris Star',
      charterer: 'ADNOC Logistics & Services',
      department: 'Engine Department',
      location: 'Steering Gear Flat & Emergency Generator Room',
      activityTitle: 'Emergency Steering Local Control Takeover & Blackout Generator Manual Start Drill',
      assessmentType: 'Emergency Preparedness',
      assessmentDate: '2026-10-07',
      assessmentTime: '11:00',
      validityExpiryDate: '2026-10-21',
      leadAssessor: 'Chief Engineer M. Rossi',
      leadAssessorRank: 'Chief Engineer',
      teamMembers: ['Chief Engineer M. Rossi', '2nd Engineer J. Kowalski', 'Electrician T. Wu'],
      assessmentTeam: [
        { name: 'M. Rossi', rank: 'Chief Engineer', signature: 'M. Rossi', briefed: true },
        { name: 'J. Kowalski', rank: '2nd Engineer', signature: 'J. Kowalski', briefed: true },
        { name: 'T. Wu', rank: 'Electrician', signature: 'T. Wu', briefed: true }
      ],
      approver: 'Capt. R. Sterling (Master)',
      approverRank: 'Master',
      approvedAt: '2026-10-07 15:30',
      additionalComments: 'Satisfies SOLAS Chapter V Reg 26 requirements. All emergency hand pumps tested.',
      maxInitialRisk: 'High',
      maxResidualRisk: 'Low',
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Isolating bridge telemotor and engaging steering gear trick wheel',
          hazardCategory: 'Loss of Propulsion / Rudder Drift',
          hazards: 'Rudder rapid swing due to sea wash, pinching hands on hunting gear',
          affectedEntities: 'Watchkeeping engineers',
          likelihoodLetter: 'B',
          severityLevel: 'II',
          riskFactor: 'High',
          initialLikelihood: 4,
          initialConsequence: 4,
          initialRating: 16,
          existingControls: 'Vessel in open sea, speed reduced to steerage way; Bridge-to-Steering phone established',
          documentReference: 'SMS-SOP-007',
          ptwRequired: false,
          additionalControls: 'Protective finger guards over linkage; standby engineer on power unit breaker switch',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'III',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 3,
          residualRating: 3,
          remedialAction: 'Verify gyro repeater alignment with bridge master gyro',
          hierarchy: 'Engineering',
          alarpAchieved: true
        }
      ],
      linkedProcedures: ['SMS-SOP-007: Emergency Steering Drill Procedure'],
      linkedPermits: ['PTW-2026-0195'],
      status: 'Approved',
      auditTrail: [
        { timestamp: '2026-10-07 11:30', user: 'Chief Engineer M. Rossi', role: 'Department Head', action: 'Drafted' },
        { timestamp: '2026-10-07 15:30', user: 'Capt. R. Sterling', role: 'Approver', action: 'Approved and Certified' }
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

  getRiskAssessment(idOrRef: string): RiskAssessmentRecord | undefined {
    const item = this.riskAssessments().find(r => r.id === idOrRef || r.referenceNo === idOrRef);
    if (item && !item.requiredApproverRole) {
      const rule = this.getRequiredApproverForRisk(item.maxResidualRisk || item.maxInitialRisk);
      item.requiredApproverRole = rule.requiredRole;
      item.escalationRequired = rule.escalationRequired;
      item.escalationRole = rule.escalatedToRole;
    }
    return item;
  }

  addRiskAssessment(data: Partial<RiskAssessmentRecord>): RiskAssessmentRecord {
    const count = this.riskAssessments().length + 1;
    const refNo = data.referenceNo || `RA-2026-00${30 + count}`;
    const initRisk = data.maxInitialRisk || 'Moderate';
    const routingRule = this.getRequiredApproverForRisk(initRisk);
    const requiredApproverRole = data.requiredApproverRole || routingRule.requiredRole;
    const escalationRequired = data.escalationRequired ?? routingRule.escalationRequired;
    const escalationRole = data.escalationRole || routingRule.escalatedToRole;

    const newRecord: RiskAssessmentRecord = {
      id: data.id || `RA-0${count + 1}`,
      referenceNo: refNo,
      formReference: data.formReference || 'Marine 5x5 Risk Matrix',
      activityTitle: data.activityTitle || 'New Marine Operational Risk Assessment',
      vesselId: data.vesselId || 'VES-01',
      vesselName: data.vesselName || 'MV Pacific Voyager',
      charterer: data.charterer || 'ADNOC Logistics & Services',
      department: data.department || 'Deck Department',
      location: data.location || 'Deck Area',
      assessmentType: data.assessmentType || 'Task-Based',
      assessmentDate: data.assessmentDate || new Date().toISOString().split('T')[0],
      assessmentTime: data.assessmentTime || new Date().toTimeString().substring(0, 5),
      validityExpiryDate: data.validityExpiryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      lastAssessmentDate: data.lastAssessmentDate || '',
      similarTaskReference: data.similarTaskReference || '',
      leadAssessor: data.leadAssessor || `${this.currentUserInfo().name}`,
      leadAssessorRank: data.leadAssessorRank || this.currentUserInfo().rank,
      teamMembers: data.teamMembers || ['Chief Officer', 'Bosun'],
      assessmentTeam: data.assessmentTeam || [
        { name: this.currentUserInfo().name, rank: this.currentUserInfo().rank, signature: `${this.currentUserInfo().name} (Signed)`, briefed: true }
      ],
      approver: data.approver || requiredApproverRole,
      approverRank: data.approverRank || requiredApproverRole,
      requiredApproverRole,
      escalationRequired,
      escalationRole,
      approvedAt: data.status === 'Approved' ? new Date().toISOString().replace('T', ' ').substring(0, 16) : undefined,
      reviewDate: data.reviewDate || data.validityExpiryDate || '',
      additionalComments: data.additionalComments || '',
      rejectionReason: data.rejectionReason,
      rejectedBy: data.rejectedBy,
      rejectedAt: data.rejectedAt,
      maxInitialRisk: initRisk,
      maxResidualRisk: data.maxResidualRisk || 'Low',
      steps: data.steps && data.steps.length > 0 ? data.steps : [
        {
          stepNumber: 1,
          stepDescription: 'Pre-task briefing and equipment inspection',
          hazardCategory: 'Procedures / Safe Work',
          hazards: 'Unclear job scope, unauthorized execution, improper safety gear',
          affectedEntities: 'Work crew',
          likelihoodLetter: 'C',
          severityLevel: 'III',
          riskFactor: 'Moderate',
          initialLikelihood: 3,
          initialConsequence: 3,
          initialRating: 9,
          existingControls: 'Daily safety toolbox talk conducted; mandatory PPE verified',
          documentReference: 'SMS-SOP-001',
          ptwRequired: false,
          additionalControls: 'Task step-by-step review with all hands; stop work authority reaffirmed',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'IV',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 2,
          residualRating: 2,
          remedialAction: 'Verify all crew sign attendance briefing sheet',
          hierarchy: 'Administrative',
          alarpAchieved: true
        }
      ],
      linkedProcedures: data.linkedProcedures || ['SMS-SOP-001: General Safety Protocol'],
      linkedPermits: data.linkedPermits || [],
      status: data.status || 'Draft',
      auditTrail: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: this.currentUserInfo().name,
          role: this.currentUserRole(),
          action: data.status === 'Approved' ? 'Risk Assessment Created & Approved' : 'Risk Assessment Created'
        }
      ]
    };
    this.riskAssessments.update(list => [newRecord, ...list]);
    return newRecord;
  }

  updateRiskAssessment(id: string, updates: Partial<RiskAssessmentRecord>) {
    this.riskAssessments.update(list => list.map(r => {
      if (r.id === id || r.referenceNo === id) {
        return {
          ...r,
          ...updates,
          auditTrail: [
            ...r.auditTrail,
            {
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              user: this.currentUserInfo().name,
              role: this.currentUserRole(),
              action: updates.status ? `Risk Assessment updated (Status: ${updates.status})` : 'Risk Assessment updated'
            }
          ]
        };
      }
      return r;
    }));
  }

  approveRiskAssessment(id: string, approverName: string, approverRank: string = 'Master') {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.riskAssessments.update(list => list.map(r => {
      if (r.id === id || r.referenceNo === id) {
        return {
          ...r,
          status: 'Approved' as RecordStatus,
          approver: approverName,
          approverRank: approverRank,
          approvedAt: timestamp,
          rejectionReason: undefined,
          auditTrail: [
            ...r.auditTrail,
            {
              timestamp,
              user: approverName,
              role: approverRank,
              action: `Risk Assessment formally Approved & Authorized by ${approverName} (${approverRank})`
            }
          ]
        };
      }
      return r;
    }));
  }

  rejectRiskAssessment(id: string, reason: string, rejectedBy: string, rejectedRole: string = 'Approver') {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.riskAssessments.update(list => list.map(r => {
      if (r.id === id || r.referenceNo === id) {
        return {
          ...r,
          status: 'Rejected' as RecordStatus,
          rejectionReason: reason,
          rejectedBy,
          rejectedAt: timestamp,
          auditTrail: [
            ...r.auditTrail,
            {
              timestamp,
              user: rejectedBy,
              role: rejectedRole,
              action: `Risk Assessment Rejected: ${reason}`
            }
          ]
        };
      }
      return r;
    }));
  }

  resubmitRiskAssessment(id: string, user: string, notes?: string) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.riskAssessments.update(list => list.map(r => {
      if (r.id === id || r.referenceNo === id) {
        return {
          ...r,
          status: 'Under Review' as RecordStatus,
          auditTrail: [
            ...r.auditTrail,
            {
              timestamp,
              user,
              role: this.currentUserRole(),
              action: 'Risk Assessment Revised & Resubmitted for Review',
              notes: notes || 'Updated hazard mitigations following review comments'
            }
          ]
        };
      }
      return r;
    }));
  }

  linkPermitToRiskAssessment(raRefOrId: string, ptwRef: string) {
    this.riskAssessments.update(list => list.map(r => {
      if ((r.id === raRefOrId || r.referenceNo === raRefOrId) && !r.linkedPermits.includes(ptwRef)) {
        return {
          ...r,
          linkedPermits: [...r.linkedPermits, ptwRef],
          auditTrail: [
            ...r.auditTrail,
            {
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              user: this.currentUserInfo().name,
              role: this.currentUserRole(),
              action: `Permit ${ptwRef} linked to this Risk Assessment`
            }
          ]
        };
      }
      return r;
    }));
  }

  deleteRiskAssessment(id: string) {
    this.riskAssessments.update(list => list.filter(r => r.id !== id && r.referenceNo !== id));
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

  // Crew Management
  addCrewMember(crew: VesselCrewMember) {
    this.crewMembers.update(list => [crew, ...list]);
  }

  updateCrewMember(crew: VesselCrewMember) {
    this.crewMembers.update(list => list.map(c => c.id === crew.id ? crew : c));
  }

  deleteCrewMember(id: string) {
    this.crewMembers.update(list => list.filter(c => c.id !== id));
  }

  // Risk Approval Rules Management
  addRiskApprovalRule(rule: RiskApprovalRule) {
    this.riskApprovalRules.update(list => [...list, rule]);
  }

  updateRiskApprovalRule(updated: RiskApprovalRule) {
    this.riskApprovalRules.update(list => list.map(r => r.id === updated.id ? updated : r));
  }

  deleteRiskApprovalRule(id: string) {
    this.riskApprovalRules.update(list => list.filter(r => r.id !== id));
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

  // PTW Checklist Templates Management
  addPtwTemplate(template: PtwChecklistTemplate) {
    this.ptwTemplates.update(list => [...list, template]);
  }

  updatePtwTemplate(template: PtwChecklistTemplate) {
    this.ptwTemplates.update(list => list.map(t => t.id === template.id ? template : t));
  }

  deletePtwTemplate(id: string) {
    this.ptwTemplates.update(list => list.filter(t => t.id !== id));
  }

  addPtwChecklistItem(templateId: string, item: PtwChecklistItem) {
    this.ptwTemplates.update(list => list.map(t => {
      if (t.id === templateId) {
        return { ...t, items: [...t.items, item] };
      }
      return t;
    }));
  }

  updatePtwChecklistItem(templateId: string, item: PtwChecklistItem) {
    this.ptwTemplates.update(list => list.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          items: t.items.map(i => i.id === item.id ? item : i)
        };
      }
      return t;
    }));
  }

  deletePtwChecklistItem(templateId: string, itemId: string) {
    this.ptwTemplates.update(list => list.map(t => {
      if (t.id === templateId) {
        return { ...t, items: t.items.filter(i => i.id !== itemId) };
      }
      return t;
    }));
  }

  // Permit Types Master Governance
  addPermitType(pt: PermitTypeItem) {
    this.permitTypes.update(list => [...list, pt]);
  }

  updatePermitType(pt: PermitTypeItem) {
    this.permitTypes.update(list => list.map(item => item.id === pt.id ? pt : item));
  }

  togglePermitTypeActive(id: string) {
    this.permitTypes.update(list => list.map(pt => pt.id === id ? { ...pt, isActive: !pt.isActive } : pt));
  }

  deletePermitType(id: string) {
    this.permitTypes.update(list => list.filter(pt => pt.id !== id));
  }

  // ==========================================================
  // PROJECT MASTER MANAGEMENT
  // ==========================================================
  addProject(proj: ProjectItem) {
    this.projects.update(list => [proj, ...list]);
  }

  updateProject(proj: ProjectItem) {
    this.projects.update(list => list.map(p => p.id === proj.id ? proj : p));
  }

  deleteProject(id: string) {
    this.projects.update(list => list.filter(p => p.id !== id));
  }

  toggleProjectStatus(id: string) {
    this.projects.update(list => list.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p));
  }

  // ==========================================================
  // USER MASTER MANAGEMENT (MULTI-ROLE, MULTI-VESSEL, MULTI-DEPT)
  // ==========================================================
  addUser(user: SystemUser) {
    this.users.update(list => [user, ...list]);
  }

  updateUser(user: SystemUser) {
    this.users.update(list => list.map(u => u.id === user.id ? user : u));
  }

  deleteUser(id: string) {
    this.users.update(list => list.filter(u => u.id !== id));
  }

  toggleUserStatus(id: string) {
    this.users.update(list => list.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
  }

  // ==========================================================
  // REUSABLE MASTER LIST MANAGEMENT FRAMEWORK (WITH FULL PTW & SYSTEM SYNC)
  // ==========================================================
  addMasterListItem(item: MasterListItem) {
    this.masterLists.update(list => [item, ...list]);
    if (item.listType === 'Permit Types') {
      const exists = this.ptwTemplates().some(t => t.permitType.toLowerCase() === item.name.toLowerCase());
      if (!exists) {
        const newTmpl: PtwChecklistTemplate = {
          id: `TMPL-${item.code || Date.now().toString().slice(-4)}`,
          permitType: item.name,
          title: `${item.name} Safety Verification Checklist`,
          formReference: `09F-${item.code || 'PTW'}`,
          description: item.description || `Statutory safety verification controls and precautions for ${item.name}.`,
          defaultPpe: ['Safety Helmet', 'Safety Boots', 'High Visibility Vest', 'Work Gloves'],
          specificValidations: [
            'All answers must be "YES" for completion of permit',
            'Permit validity SHALL NOT exceed 8 hours. Re-validation is NOT permitted.'
          ],
          items: [
            { id: `${item.code || 'CHK'}-01`, question: `Has work area and equipment for ${item.name} been inspected and made safe?`, category: 'Worksite Preparation', requiredAnswer: 'YES', isMandatory: true },
            { id: `${item.code || 'CHK'}-02`, question: 'Have all designated personnel received JSA/Toolbox Talk briefing?', category: 'Toolbox Talk & RA', requiredAnswer: 'YES', isMandatory: true },
            { id: `${item.code || 'CHK'}-03`, question: 'Are emergency communications and response equipment standing by?', category: 'Communications', requiredAnswer: 'YES', isMandatory: true }
          ]
        };
        this.ptwTemplates.update(tmpls => [...tmpls, newTmpl]);
      }
      const ptExists = this.permitTypes().some(p => p.displayName.toLowerCase() === item.name.toLowerCase());
      if (!ptExists) {
        const newPt: PermitTypeItem = {
          id: `PT-${item.code || Date.now().toString().slice(-4)}`,
          code: `PTW-${item.code || 'GEN'}`,
          displayName: item.name,
          formRef: `09F-${item.code || 'PTW'}`,
          description: item.description || `Permit for ${item.name}`,
          sortOrder: this.permitTypes().length + 1,
          isActive: item.status === 'Active',
          badgeColor: '#0284c7',
          associatedTemplateId: `TMPL-${item.code || Date.now().toString().slice(-4)}`,
          sections: {
            requiresWorkCrew: true,
            requiresSafetyWatch: true,
            requiresMasterChecklist: true,
            requiresGasTesting: false,
            requiresMultiLevelGas: false,
            requiresPeriodicGasLog: false,
            requiresLotoIsolation: false,
            requiresIsolationPointsTable: false,
            requiresEnergySources: false,
            requiresElectricalChecklist: false,
            requiresColdWorkSubChecklists: false,
            requiresEmergencyEquipment: false,
            requiresSimops: false,
            requiresDivingControls: false,
            requiresAsbestosControls: false,
            allowCustomChecks: true
          },
          defaultHazards: `Identified hazards associated with ${item.name}`,
          defaultControls: `Standard risk mitigations and safety checklist for ${item.name}`,
          defaultPpe: ['Safety Helmet', 'Safety Boots', 'High Visibility Vest', 'Work Gloves'],
          simopsDefaultNotes: 'Verify adjacent worksites before initiating work.'
        };
        this.permitTypes.update(pts => [...pts, newPt]);
      }
    }
  }

  updateMasterListItem(item: MasterListItem) {
    const old = this.masterLists().find(i => i.id === item.id);
    this.masterLists.update(list => list.map(i => i.id === item.id ? item : i));
    if (item.listType === 'Permit Types' && old) {
      this.ptwTemplates.update(list => list.map(t => t.permitType.toLowerCase() === old.name.toLowerCase() ? { ...t, permitType: item.name, title: `${item.name} Safety Verification Checklist` } : t));
      this.permitTypes.update(list => list.map(p => p.displayName.toLowerCase() === old.name.toLowerCase() ? { ...p, displayName: item.name, description: item.description || p.description } : p));
    }
  }

  deleteMasterListItem(id: string) {
    const item = this.masterLists().find(i => i.id === id);
    this.masterLists.update(list => list.filter(i => i.id !== id));
    if (item && item.listType === 'Permit Types') {
      this.ptwTemplates.update(list => list.filter(t => t.permitType.toLowerCase() !== item.name.toLowerCase()));
      this.permitTypes.update(list => list.filter(p => p.displayName.toLowerCase() !== item.name.toLowerCase()));
    }
  }

  toggleMasterListItemStatus(id: string) {
    const item = this.masterLists().find(i => i.id === id);
    const newStatus = item?.status === 'Active' ? 'Inactive' : 'Active';
    this.masterLists.update(list => list.map(i => i.id === id ? { ...i, status: newStatus } : i));
    if (item && item.listType === 'Permit Types') {
      this.permitTypes.update(list => list.map(p => p.displayName.toLowerCase() === item.name.toLowerCase() ? { ...p, isActive: newStatus === 'Active' } : p));
    }
  }

  syncPermitTypesWithMasterLists() {
    const permitTypeItems = this.masterLists().filter(item => item.listType === 'Permit Types');
    for (const item of permitTypeItems) {
      const tmplExists = this.ptwTemplates().some(t => t.permitType.toLowerCase() === item.name.toLowerCase());
      if (!tmplExists) {
        const newTmpl: PtwChecklistTemplate = {
          id: `TMPL-${item.code || item.name.replace(/\s+/g, '-').toUpperCase()}`,
          permitType: item.name,
          title: `${item.name} Safety Verification Checklist`,
          formReference: `09F-${item.code || 'PTW'}`,
          description: item.description || `Statutory safety verification controls for ${item.name}.`,
          defaultPpe: ['Safety Helmet', 'Safety Boots', 'High Visibility Vest', 'Work Gloves'],
          specificValidations: [
            'All answers must be "YES" for completion of permit',
            'Permit validity SHALL NOT exceed 8 hours. Re-validation is NOT permitted.'
          ],
          items: [
            { id: `${item.code || 'CHK'}-01`, question: `Has work area and equipment for ${item.name} been inspected and made safe?`, category: 'Worksite Preparation', requiredAnswer: 'YES', isMandatory: true },
            { id: `${item.code || 'CHK'}-02`, question: 'Have all designated personnel received JSA/Toolbox Talk briefing?', category: 'Toolbox Talk & RA', requiredAnswer: 'YES', isMandatory: true },
            { id: `${item.code || 'CHK'}-03`, question: 'Are emergency communications and response equipment standing by?', category: 'Communications', requiredAnswer: 'YES', isMandatory: true }
          ]
        };
        this.ptwTemplates.update(tmpls => [...tmpls, newTmpl]);
      }
      const ptExists = this.permitTypes().some(p => p.displayName.toLowerCase() === item.name.toLowerCase());
      if (!ptExists) {
        const newPt: PermitTypeItem = {
          id: `PT-${item.code || item.name.replace(/\s+/g, '-').toUpperCase()}`,
          code: `PTW-${item.code || 'GEN'}`,
          displayName: item.name,
          formRef: `09F-${item.code || 'PTW'}`,
          description: item.description || `Permit for ${item.name}`,
          sortOrder: this.permitTypes().length + 1,
          isActive: item.status === 'Active',
          badgeColor: '#0284c7',
          associatedTemplateId: `TMPL-${item.code || item.name.replace(/\s+/g, '-').toUpperCase()}`,
          sections: {
            requiresWorkCrew: true,
            requiresSafetyWatch: true,
            requiresMasterChecklist: true,
            requiresGasTesting: false,
            requiresMultiLevelGas: false,
            requiresPeriodicGasLog: false,
            requiresLotoIsolation: false,
            requiresIsolationPointsTable: false,
            requiresEnergySources: false,
            requiresElectricalChecklist: false,
            requiresColdWorkSubChecklists: false,
            requiresEmergencyEquipment: false,
            requiresSimops: false,
            requiresDivingControls: false,
            requiresAsbestosControls: false,
            allowCustomChecks: true
          },
          defaultHazards: `Identified hazards associated with ${item.name}`,
          defaultControls: `Standard risk mitigations and safety checklist for ${item.name}`,
          defaultPpe: ['Safety Helmet', 'Safety Boots', 'High Visibility Vest', 'Work Gloves'],
          simopsDefaultNotes: 'Verify adjacent worksites before initiating work.'
        };
        this.permitTypes.update(pts => [...pts, newPt]);
      }
    }
  }

  // ==========================================================
  // RISK MATRIX CONFIGURATION MANAGEMENT
  // ==========================================================
  updateRiskMatrixConfig(config: RiskMatrixConfig) {
    this.riskMatrixConfig.set(config);
  }

  // ==========================================================
  // WORKFLOW & ESCALATION RULES CONFIGURATION
  // ==========================================================
  addWorkflowEscalationRule(rule: WorkflowEscalationRule) {
    this.workflowEscalationRules.update(list => [...list, rule]);
  }

  updateWorkflowEscalationRule(rule: WorkflowEscalationRule) {
    this.workflowEscalationRules.update(list => list.map(r => r.id === rule.id ? rule : r));
  }

  deleteWorkflowEscalationRule(id: string) {
    this.workflowEscalationRules.update(list => list.filter(r => r.id !== id));
  }

  toggleWorkflowRuleStatus(id: string) {
    this.workflowEscalationRules.update(list => list.map(r => r.id === id ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' } : r));
  }

  // ==========================================================
  // NOTIFICATION & THRESHOLD TEMPLATES MANAGEMENT
  // ==========================================================
  addNotificationTemplate(tmpl: NotificationThresholdTemplate) {
    this.notificationTemplates.update(list => [...list, tmpl]);
  }

  updateNotificationTemplate(tmpl: NotificationThresholdTemplate) {
    this.notificationTemplates.update(list => list.map(t => t.id === tmpl.id ? tmpl : t));
  }

  deleteNotificationTemplate(id: string) {
    this.notificationTemplates.update(list => list.filter(t => t.id !== id));
  }

  toggleNotificationTemplateStatus(id: string) {
    this.notificationTemplates.update(list => list.map(t => t.id === id ? { ...t, status: t.status === 'Active' ? 'Inactive' : 'Active' } : t));
  }

  // ==========================================================
  // BULK IMPORT FOR USERS & VESSELS
  // ==========================================================
  bulkImportUsers(newUsers: SystemUser[]) {
    this.users.update(list => {
      const existingIds = new Set(list.map(u => (u.employeeId || u.id).toLowerCase()));
      const filtered = newUsers.filter(u => !existingIds.has((u.employeeId || u.id).toLowerCase()));
      return [...filtered, ...list];
    });
  }

  bulkImportVessels(newVessels: Vessel[]) {
    this.vessels.update(list => {
      const existingNames = new Set(list.map(v => v.name.toLowerCase()));
      const filtered = newVessels.filter(v => !existingNames.has(v.name.toLowerCase()));
      return [...filtered, ...list];
    });
  }
}

