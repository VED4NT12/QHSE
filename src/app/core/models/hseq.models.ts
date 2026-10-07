export type UserRole = 
  | 'Vessel Crew' 
  | 'Inspector' 
  | 'HSEQ Officer' 
  | 'Department Head' 
  | 'Approver' 
  | 'HSEQ Admin' 
  | 'Management Executive';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type RecordStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Under Review' 
  | 'Action Pending' 
  | 'Verification Pending' 
  | 'Approved' 
  | 'Active' 
  | 'Suspended' 
  | 'Extended' 
  | 'Completed' 
  | 'Closed' 
  | 'Cancelled' 
  | 'Expired';

export interface AuditEntry {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  notes?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Vessel {
  id: string;
  name: string;
  imoNumber: string;
  flag: string;
  vesselType: 'Bulk Carrier' | 'Crude Oil Tanker' | 'Container Vessel' | 'LNG Carrier' | 'Offshore Support' | 'Utility & Crew Vessel' | 'Mooring Support Tug' | 'AHTS Vessel' | 'Offshore Supply Vessel' | string;
  departmentCount: number;
  crewCount: number;
  status: 'Active' | 'In Drydock' | 'Under Maintenance';
}

export interface Department {
  id: string;
  name: string;
  head: string;
  code: string;
}

export interface VesselTypeItem {
  id: string;
  code: string;
  name: string;
  classCategory: string;
  typicalDwt: string;
  activeCount: number;
  status: 'Active' | 'Inactive';
}

export interface PortItem {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string;
  mouRegime: string;
  status: 'Active' | 'Restricted' | 'Inactive';
}

export interface CategoryItem {
  id: string;
  scope: 'Inspection Finding' | 'Near Miss' | 'Permit to Work' | 'Injury Classification';
  code: string;
  name: string;
  severityWeight: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  status: 'Active' | 'Deprecated';
}

export interface InspectorItem {
  id: string;
  name: string;
  organization: string;
  role: string;
  status: 'Active' | 'Inactive';
}

export interface Finding {
  id: string;
  description: string;
  category: string;
  severity: RiskLevel;
  riskRating: number;
  immediateAction: string;
  capaRequired: boolean;
  responsiblePerson: string;
  targetDate: string;
  status: 'Open' | 'Action Logged' | 'Verified' | 'Closed' | 'Overdue';
}

export interface InspectionRecord {
  id: string;
  referenceNo: string;
  vesselId: string;
  vesselName: string;
  department: string;
  location: string;
  inspectionDate: string;
  inspectionType: 'Internal ISM Audit' | 'Pre-vetting Inspection' | 'Navigational Audit' | 'Engine Room Survey' | 'Port State Control Prep';
  leadInspector: string;
  teamMembers: string[];
  findings: Finding[];
  overallStatus: RecordStatus;
  escalated: boolean;
  scorePercentage: number;
  attachments: Attachment[];
  auditTrail: AuditEntry[];
}

export interface NearMissRecord {
  id: string;
  referenceNo?: string;
  vesselId?: string;
  vesselName: string;
  department?: string;
  location: string;
  date: string;
  dateTime?: string;
  category?: 'Slip/Trip/Fall Hazard' | 'Dropped Object' | 'Line of Fire' | 'Pinch Point' | 'Chemical Vapour' | 'Mooring Hazard' | 'PPE Non-compliance' | string;
  nearMissDescription: string;
  description?: string;
  correctiveAction?: string;
  closeOutDate?: string;
  status: 'Open' | 'Closed' | RecordStatus;
  reportedBy?: string;
  recommendation?: string;
  actionTakenByVessel?: string;
  aramcoMomsSubmission?: string;
  potentialConsequence?: string;
  riskLevel?: RiskLevel;
  riskRating?: number;
  immediateControlTaken?: string;
  investigationNotes?: string;
  rootCause?: string;
  lessonsLearned?: string;
  broadcastFleetWide?: boolean;
  capaReferenceId?: string;
  attachments?: Attachment[];
  auditTrail?: AuditEntry[];
}

export interface IncidentRecord {
  id: string;
  referenceNo: string;
  vesselId: string;
  vesselName: string;
  department: string;
  location: string;
  dateTime: string;
  classification: 'Equipment Breakdown' | 'Pollution / Bunker Leak' | 'Cargo Contamination' | 'Navigational Near-Collision' | 'Machinery Fire';
  description: string;
  immediateResponse: string;
  actualSeverity: RiskLevel;
  potentialSeverity: RiskLevel;
  escalationRequired: boolean;
  investigationTeam: string[];
  fiveWhyAnalysis: {
    why1: string;
    why2: string;
    why3: string;
    why4: string;
    rootCause: string;
  };
  capaIds: string[];
  finalReviewNotes: string;
  status: RecordStatus;
  attachments: Attachment[];
  auditTrail: AuditEntry[];
}

export interface InjuryRecord {
  id: string;
  referenceNo: string;
  vesselId: string;
  vesselName: string;
  injuredPersonName: string;
  rank: string;
  dateTime: string;
  location: string;
  workActivity: string;
  injuryType: 'Laceration / Cut' | 'Chemical Burn' | 'Sprain / Strain' | 'Eye Foreign Object' | 'Contusion / Bruise' | 'Fracture';
  affectedBodyPart: 'Hand / Fingers' | 'Back / Spine' | 'Eye / Face' | 'Foot / Ankle' | 'Head' | 'Shoulder / Arm';
  severityClassification: 'First Aid Case (FAC)' | 'Medical Treatment Case (MTC)' | 'Restricted Work Case (RWC)' | 'Lost Time Injury (LTI)';
  daysLost: number;
  restrictedDays: number;
  treatmentDetails: string;
  returnToWorkStatus: 'Pending Clearance' | 'Restricted Duty' | 'Full Duty Resumed';
  status: RecordStatus;
  attachments: Attachment[];
  auditTrail: AuditEntry[];
}

export interface SafeCardRecord {
  id: string;
  referenceNo: string;
  vesselId: string;
  vesselName: string;
  department: string;
  location: string;
  dateTime: string;
  type: 'Safe Act' | 'Unsafe Act' | 'Unsafe Condition' | 'Positive Observation' | 'Stop Work Authority (SWA)' | 'Hazard Hunt';
  isAnonymous: boolean;
  reporterName: string;
  category: 'Housekeeping' | 'PPE Use' | 'Working Aloft' | 'Electrical Safety' | 'Tools & Machinery' | 'Situational Awareness';
  description: string;
  riskLevel: RiskLevel;
  immediateActionTaken: string;
  positiveRecognitionFlag: boolean;
  recognitionNote?: string;
  capaId?: string;
  status: 'Logged' | 'Under Review' | 'CAPA Raised' | 'Closed';
  attachments: Attachment[];
  auditTrail: AuditEntry[];
}

export interface RiskAssessmentStep {
  stepNumber: number;
  stepDescription: string;
  hazards: string;
  affectedEntities: string;
  initialLikelihood: number;
  initialConsequence: number;
  initialRating: number;
  existingControls: string;
  additionalControls: string;
  residualLikelihood: number;
  residualConsequence: number;
  residualRating: number;
  hierarchy: 'Elimination' | 'Substitution' | 'Engineering' | 'Administrative' | 'PPE';
  alarpAchieved: boolean;
}

export interface RiskAssessmentRecord {
  id: string;
  referenceNo: string;
  vesselId: string;
  vesselName: string;
  department: string;
  activityTitle: string;
  assessmentType: 'Routine Operation' | 'Non-Routine High Risk' | 'Emergency Preparedness';
  assessmentDate: string;
  validityExpiryDate: string;
  leadAssessor: string;
  teamMembers: string[];
  approver: string;
  maxInitialRisk: RiskLevel;
  maxResidualRisk: RiskLevel;
  steps: RiskAssessmentStep[];
  linkedProcedures: string[];
  linkedPermits: string[];
  status: RecordStatus;
  auditTrail: AuditEntry[];
}

export interface GasTestReading {
  gasType: 'Oxygen (O2)' | 'Flammable (LEL)' | 'Carbon Monoxide (CO)' | 'Hydrogen Sulfide (H2S)';
  reading: string;
  safePermissibleRange: string;
  testerName: string;
  timestamp: string;
  passed: boolean;
}

export interface PermitToWorkRecord {
  id: string;
  referenceNo: string;
  permitType: 'Hot Work (Enclosed/Open)' | 'Cold Work' | 'Confined Space Entry' | 'Electrical Isolation Work' | 'Working Aloft / Overboard';
  vesselId: string;
  vesselName: string;
  worksiteLocation: string;
  workDescription: string;
  startDateTime: string;
  expiryDateTime: string;
  validityHours: number;
  performingAuthority: string;
  areaAuthority: string;
  approvingAuthority: string;
  linkedRaNumber: string;
  toolboxTalkCompleted: boolean;
  isolationLotoRequired: boolean;
  isolationDetails?: string;
  gasTestingRequired: boolean;
  gasTestReadings: GasTestReading[];
  simopsCheckDone: boolean;
  simopsNotes?: string;
  precautionsChecklist: { item: string; checked: boolean }[];
  status: 'Draft' | 'Requested' | 'Approved' | 'Active' | 'Suspended' | 'Extended' | 'Cancelled' | 'Expired' | 'Closed';
  auditTrail: AuditEntry[];
}

export interface CertificateRecord {
  id: string;
  vesselId: string;
  vesselName: string;
  certificateName: string;
  certificateNumber: string;
  category: 'Statutory' | 'Classification Society' | 'Flag State' | 'Crew Mandatory';
  issuingAuthority: 'DNV' | "Lloyd's Register" | 'ABS' | 'Bureau Veritas' | 'Marshall Islands Registry';
  issueDate: string;
  expiryDate: string;
  renewalDueDate: string;
  daysToExpiry: number;
  status: 'Valid' | 'Due Soon' | 'Expired' | 'Renewal in Progress';
  responsibleDepartment: string;
  attachmentFileName: string;
  renewalHistory: { renewedDate: string; certNumber: string; authority: string }[];
}

export interface DmsDocument {
  id: string;
  documentNumber: string;
  title: string;
  category: 'Safety Management Manual' | 'Standard Operating Procedure (SOP)' | 'Checklist & Form' | 'Emergency Contingency Plan' | 'Fleet Policy';
  department: string;
  confidentiality: 'Public' | 'Restricted' | 'Confidential';
  revision: string;
  effectiveDate: string;
  nextReviewDate: string;
  documentOwner: string;
  status: 'Draft' | 'Under Review' | 'Approved & Issued' | 'Superseded' | 'Archived';
  readAndAcknowledgeRequired: boolean;
  acknowledgedCount: number;
  totalRequiredCrew: number;
  fileSize: string;
}

export interface ManagementVisitRecord {
  id: string;
  referenceNo: string;
  vesselId: string;
  vesselName: string;
  portLocation: string;
  categoryRole: 'Port Captain' | 'Port Engineer' | 'HSEQ Superintendent';
  visitorName: string;
  teamMembers: string[];
  plannedDate: string;
  dueDate: string;
  actualCompletedDate?: string;
  purposeScope: string;
  checklistTemplate: string;
  findingsCount: number;
  openCapaCount: number;
  status: 'Planned' | 'Due' | 'Completed' | 'Rescheduled' | 'Missed / Overdue' | 'Cancelled';
  rescheduleReason?: string;
  executiveSummary?: string;
}

export interface CapaRecord {
  id: string;
  referenceNo: string;
  sourceModule: 'Inspection' | 'Near Miss' | 'Incident' | 'Injury' | 'Safe Card' | 'Risk Assessment' | 'Permit to Work' | 'Management Visit';
  sourceReferenceNo: string;
  actionDescription: string;
  actionCategory: 'Engineering Control' | 'Procedure Update' | 'Equipment Maintenance' | 'Crew Training & Coaching' | 'Physical Safeguard';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  vesselId: string;
  vesselName: string;
  department: string;
  responsiblePerson: string;
  targetDate: string;
  revisedDate?: string;
  extensionJustification?: string;
  completionEvidence?: string;
  progressNotes: string;
  status: 'Open' | 'In Progress' | 'Verification Pending' | 'Closed' | 'Overdue';
  verifiedBy?: string;
  closedDate?: string;
}

export interface DashboardKpis {
  totalInspections: number;
  inspectionComplianceRate: number;
  openFindingsCount: number;
  criticalFindingsCount: number;
  nearMissCount: number;
  incidentsCount: number;
  injuryLtiCount: number;
  safeCardsCount: number;
  safeActsRatio: number;
  activePermitsCount: number;
  certificatesValidPercentage: number;
  certificatesExpiring30Days: number;
  certificatesExpired: number;
  openCapas: number;
  overdueCapas: number;
  capaOnTimeClosureRate: number;
  plannedVisitsCompletedRate: number;
}

export interface FleetNotification {
  id: string;
  title: string;
  message: string;
  category: 'warning' | 'alert' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  link?: string;
  vesselName?: string;
}

