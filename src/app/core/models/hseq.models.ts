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
  | 'Rejected'
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
  scope: 'Inspection Finding' | 'Near Miss' | 'Permit to Work' | 'Injury Classification' | 'Risk Assessment';
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

export type LikelihoodLetter = 'A' | 'B' | 'C' | 'D' | 'E';
export type SeverityLevel = 'I' | 'II' | 'III' | 'IV' | 'V';
export type MarineRiskFactor = 'High' | 'Moderate' | 'Low';

export interface RiskAssessmentTeamMember {
  name: string;
  rank: string;
  signature?: string;
  briefed: boolean;
}

export interface RiskAssessmentStep {
  stepNumber: number;
  stepDescription: string;
  hazardCategory?: 'Personal Protection' | 'Body Positions / Line of Fire' | 'Environments / Housekeeping' | 'Procedures / Safe Work' | 'Tools / Equipment' | string;
  hazards: string;
  affectedEntities?: string;
  likelihoodLetter?: LikelihoodLetter;
  severityLevel?: SeverityLevel;
  riskFactor?: MarineRiskFactor;
  initialLikelihood: number;
  initialConsequence: number;
  initialRating: number;
  existingControls: string;
  documentReference?: string;
  ptwRequired?: boolean;
  ptwType?: string;
  additionalControls: string;
  residualLikelihoodLetter?: LikelihoodLetter;
  residualSeverityLevel?: SeverityLevel;
  residualRiskFactor?: MarineRiskFactor;
  residualLikelihood: number;
  residualConsequence: number;
  residualRating: number;
  remedialAction?: string;
  hierarchy: 'Elimination' | 'Substitution' | 'Engineering' | 'Administrative' | 'PPE';
  alarpAchieved: boolean;
}

export interface RiskAssessmentRecord {
  id: string;
  referenceNo: string;
  formReference?: string; // '07F-001-01' or '07F-001-02'
  vesselId: string;
  vesselName: string;
  charterer?: string;
  department: string;
  location?: string;
  activityTitle: string;
  assessmentType: 'Routine Operation' | 'Non-Routine High Risk' | 'Emergency Preparedness' | 'Task-Based' | 'Operational' | 'Dynamic' | string;
  assessmentDate: string;
  assessmentTime?: string;
  validityExpiryDate: string;
  lastAssessmentDate?: string;
  similarTaskReference?: string;
  leadAssessor: string;
  leadAssessorRank?: string;
  teamMembers: string[];
  assessmentTeam?: RiskAssessmentTeamMember[];
  approver: string;
  approverRank?: string;
  approvedAt?: string;
  reviewDate?: string;
  additionalComments?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  requiredApproverRole?: string;
  escalationRequired?: boolean;
  escalationRole?: string;
  maxInitialRisk: RiskLevel | MarineRiskFactor;
  maxResidualRisk: RiskLevel | MarineRiskFactor;
  steps: RiskAssessmentStep[];
  linkedProcedures: string[];
  linkedPermits: string[];
  status: RecordStatus;
  auditTrail: AuditEntry[];
}

export interface RiskApprovalRule {
  id: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' | string;
  requiredRole: string;
  escalationRequired: boolean;
  escalatedToRole?: string;
  requiresDualSignOff: boolean;
  dualSignOffRole?: string;
  minReviewFrequencyDays: number;
  approvalRequired?: 'Mandatory' | 'Conditional' | 'Advisory' | string;
  status?: 'Active' | 'Inactive' | string;
}

export interface GasTestReading {
  id?: string;
  gasType: string;
  reading: string;
  safePermissibleRange?: string;
  testerName: string;
  timestamp: string;
  retestFrequency?: string;
  passed: boolean;
  status?: 'Safe' | 'Hazardous' | string;
}

export interface ElectricalCheckItem {
  id: string;
  description: string;
  before: boolean;
  after: boolean;
  isCustom?: boolean;
}

export interface ElectricalEquipmentChecklist {
  system?: string;
  section?: string;
  components?: string;
  companyCrew?: string;
  engineers?: string;
  startDate?: string;
  startTime?: string;
  durationDays?: string | number;
  finishDate?: string;
  finishTime?: string;
  durationHours?: string | number;
  durationMins?: string | number;
  chiefEngineer?: string;
  chiefEngineerDate?: string;
  chiefEngineerSignature?: string;
  highVoltageChecks: ElectricalCheckItem[];
  lowVoltageChecks?: ElectricalCheckItem[];
}

export interface LotoRecord {
  id: string;
  equipmentId?: string;
  description?: string;
  isolationDeviceMethod?: string;
  isolatedBy?: string;
  isolatedDate?: string;
  deIsolatedBy?: string;
  deIsolatedDate?: string;
  isolationPoint: string;
  energySource: string;
  lockNumber: string;
  lotoNotes?: string;
  isolatedTime?: string;
  status?: 'Isolated' | 'De-isolated';
}

export interface PermitWorkflowProgress {
  areaSafetyReviewed: boolean;
  areaReviewedBy?: string;
  areaReviewDate?: string;
  areaReviewNotes?: string;

  controlsVerified: boolean;
  controlsVerifiedBy?: string;
  controlsVerifyDate?: string;
  controlsVerifyNotes?: string;

  masterApproved: boolean;
  masterApprovedBy?: string;
  masterApproveDate?: string;
  masterApproveNotes?: string;

  workCompleted: boolean;
  workCompletedBy?: string;
  workCompleteDate?: string;

  siteRestored: boolean;
  siteRestoredBy?: string;
  siteRestoreDate?: string;
  siteRestoreNotes?: string;
}

export interface PtwChecklistItem {
  id: string;
  question: string;
  category?: string;
  requiredAnswer?: 'YES' | 'NO' | 'NA';
  isMandatory?: boolean;
  clientFormRef?: string;
}

export interface PtwChecklistTemplate {
  id: string;
  permitType: string;
  title: string;
  formReference: string;
  description: string;
  items: PtwChecklistItem[];
  defaultPpe: string[];
  specificValidations: string[];
}

export interface PtwWorkCrewMember {
  name: string;
  rank: string;
  briefed?: boolean;
}

export interface PermitTypeSectionsConfig {
  requiresWorkCrew: boolean;             // Personnel Carrying Out Work table
  requiresSafetyWatch: boolean;          // Safety Watch Monitoring table (Hot Work, Asbestos)
  requiresMasterChecklist: boolean;      // Master Data Safety Verification Questions
  requiresGasTesting: boolean;           // Atmospheric Gas Testing Log
  requiresMultiLevelGas: boolean;        // Top / Middle / Bottom simultaneous limits (Enclosed Space)
  requiresPeriodicGasLog: boolean;       // Periodical Checks every 2h (Enclosed Space)
  requiresLotoIsolation: boolean;        // LOTO Padlock Register table
  requiresIsolationPointsTable: boolean; // Machinery / High Pressure Isolation Points table (Electrical, Cold Work)
  requiresEnergySources: boolean;        // Sources of Energy table (Electrical)
  requiresElectricalChecklist: boolean;  // Electrical Equipment Checklist Before/After (Electrical)
  requiresColdWorkSubChecklists: boolean;// Machinery, Pressure Vessels, Cold Work, Outboard, Aloft, Small Craft (Cold Work)
  requiresEmergencyEquipment: boolean;   // Emergency Equipment at entrance (Enclosed Space, Hot Work)
  requiresSimops: boolean;               // SIMOPS Assessment section
  requiresDivingControls: boolean;       // Diving Supervisor, Surveyor, Client Rep, A-Flag (Diving)
  requiresAsbestosControls: boolean;     // DPA Permission, BS 4555 mask, Sealed Waste (Asbestos)
  allowCustomChecks: boolean;            // Single unified custom check adder
}

export interface PermitTypeItem {
  id: string;
  code: string;
  displayName: string;
  formRef: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  badgeColor: string;
  associatedTemplateId: string;
  sections: PermitTypeSectionsConfig;
  defaultHazards: string;
  defaultControls: string;
  defaultPpe: string[];
  simopsDefaultNotes?: string;
}

export interface HotWorkSafetyWatchMember {
  name: string;
  rank: string;
  briefedRadioTested?: boolean;
  monitoringStationArea?: string;
  actionOnAlarm?: string;
  fromTime?: string;
  toTime?: string;
  signature?: string;
}

export interface HotWorkEmergencyEquipment {
  item: string;
  location: string;
  readyOnScene: boolean;
  inspectedBy: string;
}

export interface MachineryIsolationRecord {
  equipment: string;
  isolationPoint: string;
  isolationMethod: string;
  isolatedBy: string;
  isolatedDateTime: string;
  deIsolatedBy?: string;
  deIsolatedDateTime?: string;
}

export interface ColdWorkSubChecklistItem {
  id: string;
  question: string;
  category?: string;
  answer?: 'YES' | 'NO' | 'NA';
  clientFormRef?: string;
}

export interface PermitToWorkRecord {
  id: string;
  referenceNo: string;
  permitType: string;
  vesselId: string;
  vesselName: string;
  areaFieldLocation?: string;
  locationOfWork?: string;
  worksiteLocation: string;
  location?: string;
  worksite?: string;
  workDescription: string;
  startDateTime: string;
  expiryDateTime: string;
  requestedStartTime?: string;
  requestedEndTime?: string;
  duration?: string | number;
  validityPeriod?: string;
  validityHours: number;
  performingAuthority: string;
  areaAuthority: string;
  responsibleSupervisor?: string;
  approvingAuthority: string;
  responsiblePersonInAttendance?: string;
  personnelCarryingOutWork?: PtwWorkCrewMember[];
  hazards?: string;
  ppe?: string[];
  controlMeasures?: string;
  linkedRaNumber: string;
  linkedJsa?: string;
  toolboxTalkCompleted: boolean;
  toolboxTalkDate?: string;
  toolboxTalkTopic?: string;
  isolationLotoRequired: boolean;
  isolationDetails?: string;
  lotoRecords?: LotoRecord[];
  gasTestingRequired: boolean;
  gasTestReadings: GasTestReading[];
  simopsRequired?: boolean;
  simopsCheckDone: boolean;
  simopsNotes?: string;
  precautionsChecklist: { item: string; checked: boolean }[];
  checklistAnswers?: Record<string, 'YES' | 'NO' | 'NA'>;
  
  // Client Form Specific Conditional Sections
  spaceType?: 'Enclosed' | 'Connected' | 'Adjacent' | string;
  connectedAdjacentSpaces?: string;
  lastCargo?: string;
  reasonForEntry?: string;
  attendantAtEntrance?: string;
  ventilationType?: string;
  
  // Hot Work Client Form 09F-006-03 specifics
  fireWatchmanName?: string;
  fireWatchBridgeComm?: string | boolean;
  fireWatchBridgeCommMethod?: string;
  fireMainPressurized?: boolean;
  adjacentSpacesGasFreeDetails?: string;
  safetyWatchPersonnel?: HotWorkSafetyWatchMember[];
  hotWorkEmergencyEquipment?: HotWorkEmergencyEquipment[];
  
  // Electrical Form 09F-006-05 specifics
  energySources?: string[];
  voltageClassification?: '0 to 440V' | '440V to 6.6 kV' | 'Both' | 'None' | string;
  isolationType?: 'Short term' | 'Long term' | 'Machinery';
  electricalEquipmentChecklist?: ElectricalEquipmentChecklist;
  customChecklistItems?: PtwChecklistItem[];
  
  // Cold Work Form 09F-006-06 specifics
  machineryIsolationRecords?: MachineryIsolationRecord[];
  coldWorkActiveSubScopes?: string[];
  coldWorkSubChecklistAnswers?: Record<string, 'YES' | 'NO' | 'NA'>;
  
  // Diving Form 09F-006-04 specifics
  divingSupervisor?: string;
  classSurveyor?: string;
  clientRep?: string;
  flagAlphaHoisted?: boolean;
  
  // Asbestos Form 09F-006-08 specifics
  dpaPermissionReceived?: boolean;
  wasteDisposalSealed?: boolean;
  emergencyEquipmentCounts?: Record<string, number | boolean>;
  
  status: 'Draft' | 'Requested' | 'Approved' | 'Active' | 'Suspended' | 'Extended' | 'Cancelled' | 'Expired' | 'Closed';
  auditTrail: AuditEntry[];
  workflowProgress?: PermitWorkflowProgress;
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

// ==========================================================
// HOURS OF REST (HoR) & MARITIME REST COMPLIANCE (STCW / MLC 2006)
// ==========================================================

export interface VesselCrewMember {
  id: string;
  employeeId?: string;
  name: string;
  rank: string;
  department: string;
  vesselId: string;
  vesselName: string;
  seafarerId?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  watchkeeper: boolean;
  status: 'Onboard' | 'Signed Off' | 'On Leave' | 'Active' | 'Inactive' | string;
  signedOnDate?: string;
}

export type HoRActivityType = 'Work' | 'Rest';

export interface HoRPeriodEntry {
  id: string;
  startTime: string; // e.g. "06:00"
  endTime: string;   // e.g. "12:00"
  activityType: HoRActivityType; // "Work" | "Rest"
  durationHours: number;
}

export interface DailyCrewRestRecord {
  id: string; // e.g. "HOR-CRW-PV-01-2026-10-05"
  crewId: string;
  crewName: string;
  rank: string;
  department: string;
  vesselId: string;
  vesselName: string;
  date: string; // "YYYY-MM-DD" e.g. "2026-10-05"
  periods: HoRPeriodEntry[];
  totalWorkHours: number;
  totalRestHours: number;
  complianceStatus: 'Compliant' | 'Non-Compliant';
  recordStatus: 'Entered' | 'Pending';
  remarks?: string;
  lastUpdated?: string;
}

export interface WorkPeriod {
  id: string;
  startTime: string; // "HH:mm" e.g. "08:00"
  endTime: string;   // "HH:mm" e.g. "12:00"
  durationHours: number;
  activityType?: 'Navigation Watch' | 'Engine Watch' | 'Maintenance / Deck Work' | 'Cargo Operations' | 'Safety Drill / Inspection' | 'Mooring / Unmooring' | 'Administrative / Paperwork' | 'General Duty';
  notes?: string;
}

export interface RestPeriod {
  startTime: string;
  endTime: string;
  durationHours: number;
}

export interface MaritimeComplianceEvaluation {
  isCompliant: boolean;
  totalWorkHours: number;
  totalRestHours: number;
  rolling7DayRestHours: number;
  // Specific STCW / MLC rule checks
  min10HoursRestIn24h: boolean;
  max2RestPeriodsIn24h: boolean;
  hasOnePeriodAtLeast6h: boolean;
  maxIntervalBetweenRestExceeded14h: boolean; // true if violated (interval > 14)
  min77HoursRestIn7Days: boolean;
  violations: string[];
  warnings: string[];
}

export interface DailyRestRecord {
  date: string; // "YYYY-MM-DD"
  dayNumber: number; // 1..31
  dayOfWeek: string; // "Mon", "Tue", ...
  workPeriods: WorkPeriod[];
  totalWorkHours: number;
  totalRestHours: number;
  rolling7DayRestHours: number;
  isCompliant: boolean;
  violations: string[];
  comments?: string; // Form 05F-006-03 Column BB
  isOverridden?: boolean; // Emergency / drill exception
  overrideReason?: string;
}

export interface HoursOfRestMonthlyRecord {
  id: string;
  recordNo: string; // Form No 05F-006-03 ref, e.g. "HOR-2026-10-VES01-CRW02"
  formNumber: string; // "05F-006-03"
  revision: string; // "Rev 0"
  issueDate: string; // "05-Feb-2025"
  vesselId: string;
  vesselName: string;
  crewMemberId: string;
  crewName: string;
  rank: string;
  department: string;
  month: string; // "YYYY-MM" e.g. "2026-10"
  monthName: string; // "October 2026"
  year: number;
  monthIndex: number; // 1-12
  daysInMonth: number;
  days: DailyRestRecord[];
  totalMonthlyWorkHours: number;
  totalMonthlyRestHours: number;
  averageDailyRestHours: number;
  compliantDaysCount: number;
  violationDaysCount: number;
  complianceStatus: 'Compliant' | 'Violation' | 'Under Review';
  status: 'Draft' | 'Submitted' | 'Verified' | 'Approved';
  officerSignature?: {
    signed: boolean;
    name: string;
    signedAt?: string;
  };
  departmentHeadSignature?: {
    signed: boolean;
    name: string;
    signedAt?: string;
  };
  masterSignature?: {
    signed: boolean;
    name: string;
    signedAt?: string;
  };
  lastUpdated: string;
}

// ============================================================================
// MASTER DATA & SYSTEM CONFIGURATION ENHANCED ENTITY MODELS
// ============================================================================

export interface ProjectItem {
  id: string;
  code: string;
  name: string;
  client: string;
  vesselId?: string;
  vesselName?: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Inactive' | 'Completed' | 'Pending';
  description?: string;
}

export interface SystemUser {
  id: string;
  employeeId: string;
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  roles: string[];           // One User -> Multiple Roles (e.g. Lead Assessor, Chief Officer)
  departments: string[];     // One User -> Multiple Departments (e.g. Deck, Safety)
  assignedVessels: string[]; // One User -> Multiple Vessels (e.g. MV Pacific Voyager)
  status: 'Active' | 'Inactive';
  designation?: string;
  lastLogin?: string;
}

export type MasterListType = 
  | 'Finding Categories'
  | 'Near Miss Categories'
  | 'Incident Classifications'
  | 'Injury Types'
  | 'Body Part Lists'
  | 'Observation Categories'
  | 'Safe Observation Categories'
  | 'Observation Types'
  | 'Permit Types'
  | 'Certificate Categories'
  | 'Issuing Authorities'
  | 'CAPA Categories'
  | 'Hazard Categories';

export interface MasterListItem {
  id: string;
  listType: MasterListType;
  code: string;
  name: string;
  description?: string;
  severityWeight?: string; // e.g. Critical, High, Medium, Low
  status: 'Active' | 'Inactive';
  sortOrder?: number;
}

export interface RiskLikelihoodConfig {
  score: number;
  label: string;
  description: string;
}

export interface RiskSeverityConfig {
  score: number;
  label: string;
  description: string;
}

export interface RiskBandConfig {
  level: RiskLevel; // 'Low' | 'Medium' | 'High' | 'Critical'
  minScore: number;
  maxScore: number;
  color: string;
  bgColor: string;
  mandate: string;
}

export interface RiskMatrixConfig {
  gridSize: '5x5';
  likelihoods: RiskLikelihoodConfig[];
  severities: RiskSeverityConfig[];
  bands: RiskBandConfig[];
}

export interface WorkflowStageItem {
  id: number;
  sequence: number;
  name: string;
  defaultActor: string;
  sla: string;
  description: string;
}

export interface WorkflowEscalationRule {
  id: string;
  reportType: 'Risk Assessment' | 'Permit to Work' | 'Near Miss' | 'Incident' | 'Injury' | 'Inspection Finding' | 'Safe Observation' | 'CAPA Action';
  severity: RiskLevel;
  stageName: string;
  escalationRole: string;
  overdueThresholdDays: number;
  notificationTrigger: 'Immediate Alert' | 'Daily Digest' | 'Overdue Breach' | 'Sign-off Escalation';
  requiresDualSignOff: boolean;
  status: 'Active' | 'Inactive';
}

export interface NotificationThresholdTemplate {
  id: string;
  templateName: string;
  triggerEvent: 'Certificate Expiry' | 'PTW Expiry' | 'Risk Assessment Review Due' | 'Hours Of Rest Violation' | 'Inspection Overdue' | 'Near Miss Escalation' | 'CAPA Action Overdue';
  reminderDays: number[]; // e.g. [90, 60, 30, 15, 7, 3, 1]
  escalationDays: number; // e.g. 3 days overdue
  roleRecipients: string[]; // e.g. ['Master', 'HSEQ Manager', 'DPA']
  emailSubjectTemplate: string;
  bodyTemplate: string;
  status: 'Active' | 'Inactive';
}

export interface BulkImportRowError {
  rowNumber: number;
  field: string;
  value: string;
  message: string;
}

export interface BulkImportResult {
  totalRows: number;
  validRows: number;
  errorCount: number;
  errors: BulkImportRowError[];
}



