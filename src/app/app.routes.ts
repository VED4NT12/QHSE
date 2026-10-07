import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { NearMissListComponent } from './features/near-miss/near-miss-list.component';
import { NearMissFormComponent } from './features/near-miss/near-miss-form.component';
import { NearMissDetailComponent } from './features/near-miss/near-miss-detail.component';

// Newly Integrated Modules (from Client Excel Spreadsheets)
import { OnHireInspectionListComponent } from './features/on-hire-inspection/on-hire-inspection-list.component';
import { OnHireInspectionFormComponent } from './features/on-hire-inspection/on-hire-inspection-form.component';
import { OnHireInspectionDetailComponent } from './features/on-hire-inspection/on-hire-inspection-detail.component';

import { InspectionTrackerListComponent } from './features/inspection-tracker/inspection-tracker-list.component';
import { InspectionTrackerFormComponent } from './features/inspection-tracker/inspection-tracker-form.component';
import { InspectionTrackerDetailComponent } from './features/inspection-tracker/inspection-tracker-detail.component';

import { CertificateTrackerListComponent } from './features/certificate-tracker/certificate-tracker-list.component';
import { CertificateTrackerFormComponent } from './features/certificate-tracker/certificate-tracker-form.component';
import { CertificateTrackerDetailComponent } from './features/certificate-tracker/certificate-tracker-detail.component';

import { SafeObservationListComponent } from './features/safe-observations/safe-observation-list.component';
import { SafeObservationFormComponent } from './features/safe-observations/safe-observation-form.component';
import { SafeObservationDetailComponent } from './features/safe-observations/safe-observation-detail.component';

// Preserved module imports (Ready for subsequent Excel requirements)
import { ReportsComponent } from './features/reports/reports.component';
import { InspectionListComponent } from './features/inspections/inspection-list.component';
import { InspectionDetailComponent } from './features/inspections/inspection-detail.component';
import { IncidentListComponent } from './features/incidents/incident-list.component';
import { IncidentDetailComponent } from './features/incidents/incident-detail.component';
import { InjuryListComponent } from './features/injuries/injury-list.component';
import { SafeCardListComponent } from './features/safe-cards/safe-card-list.component';
import { SafeCardCreateComponent } from './features/safe-cards/safe-card-create.component';
import { RiskAssessmentListComponent } from './features/risk-assessment/risk-assessment-list.component';
import { RiskAssessmentDetailComponent } from './features/risk-assessment/risk-assessment-detail.component';
import { PermitListComponent } from './features/permits/permit-list.component';
import { PermitDetailComponent } from './features/permits/permit-detail.component';
import { CertificateListComponent } from './features/certificates/certificate-list.component';
import { DmsListComponent } from './features/dms/dms-list.component';
import { VisitsListComponent } from './features/visits/visits-list.component';
import { CapaListComponent } from './features/capa/capa-list.component';
import { MasterDataComponent } from './features/admin/master-data.component';
import { RiskMatrixConfigComponent } from './features/admin/risk-matrix-config.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      
      // 1. ACTIVE MODULES FOR CLIENT DEMO
      { path: 'dashboard', component: DashboardComponent },
      { path: 'near-miss', component: NearMissListComponent },
      { path: 'near-miss/create', component: NearMissFormComponent },
      { path: 'near-miss/edit/:id', component: NearMissFormComponent },
      { path: 'near-miss/:id', component: NearMissDetailComponent },

      // Client Excel Modules
      { path: 'on-hire-inspection', component: OnHireInspectionListComponent },
      { path: 'on-hire-inspection/create', component: OnHireInspectionFormComponent },
      { path: 'on-hire-inspection/edit/:id', component: OnHireInspectionFormComponent },
      { path: 'on-hire-inspection/:id', redirectTo: 'on-hire-inspection', pathMatch: 'full' },

      { path: 'inspection-tracker', component: InspectionTrackerListComponent },
      { path: 'inspection-tracker/create', component: InspectionTrackerFormComponent },
      { path: 'inspection-tracker/edit/:id', component: InspectionTrackerFormComponent },
      { path: 'inspection-tracker/:id', component: InspectionTrackerDetailComponent },

      { path: 'certificate-tracker', component: CertificateTrackerListComponent },
      { path: 'certificate-tracker/create', component: CertificateTrackerFormComponent },
      { path: 'certificate-tracker/edit/:id', component: CertificateTrackerFormComponent },
      { path: 'certificate-tracker/:id', component: CertificateTrackerDetailComponent },

      { path: 'safe-observations', component: SafeObservationListComponent },
      { path: 'safe-observations/create', component: SafeObservationFormComponent },
      { path: 'safe-observations/edit/:id', component: SafeObservationFormComponent },
      { path: 'safe-observations/:id', component: SafeObservationDetailComponent },

      // 2. PRESERVED MODULE ROUTES (Architecturally intact for future Excel rollout)
      { path: 'reports', component: ReportsComponent },
      { path: 'inspections', component: InspectionListComponent },
      { path: 'inspections/:id', component: InspectionDetailComponent },
      { path: 'incidents', component: IncidentListComponent },
      { path: 'incidents/create', redirectTo: 'incidents', pathMatch: 'full' },
      { path: 'incidents/:id', component: IncidentDetailComponent },
      { path: 'injuries', component: InjuryListComponent },
      { path: 'safe-cards', component: SafeCardListComponent },
      { path: 'safe-cards/create', component: SafeCardCreateComponent },
      { path: 'risk-assessment', component: RiskAssessmentListComponent },
      { path: 'risk-assessment/:id', component: RiskAssessmentDetailComponent },
      { path: 'permits', component: PermitListComponent },
      { path: 'permits/create', redirectTo: 'permits', pathMatch: 'full' },
      { path: 'permits/:id', component: PermitDetailComponent },
      { path: 'certificates', component: CertificateListComponent },
      { path: 'dms', component: DmsListComponent },
      { path: 'visits', component: VisitsListComponent },
      { path: 'capa', component: CapaListComponent },
      { path: 'admin/master-data', component: MasterDataComponent },
      { path: 'admin/risk-matrix', component: RiskMatrixConfigComponent },

      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
