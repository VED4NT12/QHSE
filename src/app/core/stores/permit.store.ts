import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { PermitToWorkRecord, GasTestReading, LotoRecord, AuditEntry } from '../models/hseq.models';
import { HseqStateService } from '../services/hseq-state.service';

const STORAGE_KEY = 'hseq-permits-v2';

const INITIAL_DEMO_PERMITS: PermitToWorkRecord[] = [
  {
    id: 'PTW-01',
    referenceNo: 'PTW-2026-0189',
    permitType: 'Confined Space Entry',
    vesselId: 'VES-02',
    vesselName: 'MT Nordic Titan',
    worksiteLocation: 'Cargo Tank 3 Port (Wing Tank)',
    location: 'Cargo Area',
    worksite: 'Cargo Tank 3 Port',
    workDescription: 'Ultrasonic thickness gauging and sacrificial zinc anode condition assessment inside cargo wing tank.',
    startDateTime: '2026-10-08 08:00',
    expiryDateTime: '2026-10-08 16:00',
    requestedStartTime: '2026-10-08 08:00',
    requestedEndTime: '2026-10-08 16:00',
    validityHours: 8,
    validityPeriod: '8 Hours (Single Shift)',
    duration: 8,
    performingAuthority: 'Pumpman G. Patel',
    areaAuthority: 'Chief Officer K. Hansen',
    responsibleSupervisor: '2nd Officer A. Vance',
    approvingAuthority: 'Capt. H. Miller (Master)',
    hazards: 'Toxic gas pockets (H2S, VOC), oxygen depletion, slip/fall from staging, restricted egress path.',
    ppe: ['Safety Helmet', 'Gas Detector 4-Way', 'Full Body Safety Harness', 'Chemical Boots', 'Intrinsically Safe Torch', 'Escape SCBA EEBD'],
    controlMeasures: 'Continuous mechanical forced ventilation running, standby watch with extraction tripod, certified communication radio channel.',
    linkedRaNumber: 'RA-2026-0057',
    linkedJsa: 'JSA-CS-004: Tank Entry & Internal Inspection',
    toolboxTalkCompleted: true,
    toolboxTalkDate: '2026-10-08 07:15',
    toolboxTalkTopic: 'Confined space rescue plan & emergency signals',
    isolationLotoRequired: true,
    isolationDetails: 'Cargo discharge valve CV-3P and IG inert gas branch valve isolated with mechanical padlock and warning tags.',
    lotoRecords: [
      {
        id: 'LOTO-01',
        isolationPoint: 'Manifold Isolation Valve V-102',
        energySource: 'Hydraulic / Fluid Pressure',
        lockNumber: 'LCK-HYD-402',
        lotoNotes: 'Double block and bleed secured with chain lock.',
        isolatedBy: 'Pumpman G. Patel',
        isolatedTime: '2026-10-08 07:20',
        status: 'Isolated'
      },
      {
        id: 'LOTO-02',
        isolationPoint: 'Inert Gas Branch Valve IG-03P',
        energySource: 'Pneumatic / Gas Stream',
        lockNumber: 'LCK-GAS-119',
        lotoNotes: 'Blind flange inserted and tagged.',
        isolatedBy: 'Chief Officer K. Hansen',
        isolatedTime: '2026-10-08 07:25',
        status: 'Isolated'
      }
    ],
    gasTestingRequired: true,
    gasTestReadings: [
      {
        id: 'GT-01',
        gasType: 'Oxygen (O2)',
        reading: '20.9%',
        safePermissibleRange: '20.8% - 21.0%',
        testerName: 'Safety Officer A. Roy',
        timestamp: '2026-10-08 07:30',
        retestFrequency: 'Continuous Monitoring',
        passed: true,
        status: 'Safe'
      },
      {
        id: 'GT-02',
        gasType: 'Flammable (LEL)',
        reading: '0.0%',
        safePermissibleRange: '< 1% LEL',
        testerName: 'Safety Officer A. Roy',
        timestamp: '2026-10-08 07:32',
        retestFrequency: 'Every 2 Hours',
        passed: true,
        status: 'Safe'
      },
      {
        id: 'GT-03',
        gasType: 'Carbon Monoxide (CO)',
        reading: '0 ppm',
        safePermissibleRange: '< 25 ppm',
        testerName: 'Safety Officer A. Roy',
        timestamp: '2026-10-08 07:33',
        retestFrequency: 'Every 2 Hours',
        passed: true,
        status: 'Safe'
      },
      {
        id: 'GT-04',
        gasType: 'Hydrogen Sulfide (H2S)',
        reading: '0 ppm',
        safePermissibleRange: '< 5 ppm',
        testerName: 'Safety Officer A. Roy',
        timestamp: '2026-10-08 07:35',
        retestFrequency: 'Continuous Monitoring',
        passed: true,
        status: 'Safe'
      }
    ],
    simopsRequired: true,
    simopsCheckDone: true,
    simopsNotes: 'No hot work or bunkering operations permitted on port deck during tank entry window.',
    precautionsChecklist: [
      { item: 'Forced ventilation running continuously during entire entry', checked: true },
      { item: 'Dedicated standby crew member stationed at tank entrance with VHF radio', checked: true },
      { item: 'Emergency SCBA, revival apparatus and extraction winch tested on site', checked: true },
      { item: 'Intrinsically safe Ex-rated communication and lighting deployed', checked: true },
      { item: 'Entry log sheet posted at hatch entrance for in/out sign-in', checked: true }
    ],
    areaFieldLocation: 'Zuluf Offshore Field - Sector B',
    locationOfWork: 'Cargo Tank 3 Port (Wing Tank)',
    responsiblePersonInAttendance: '2nd Officer A. Vance',
    personnelCarryingOutWork: [
      { name: 'G. Patel', rank: 'Pumpman' },
      { name: 'J. Smith', rank: 'AB Seaman' },
      { name: 'R. Kouris', rank: 'OS Seaman' }
    ],
    spaceType: 'Cargo Tank',
    connectedAdjacentSpaces: 'Adjacent to Cargo Tank 3 Center & Port Bunker Tank',
    lastCargo: 'Heavy Fuel Oil (HFO)',
    reasonForEntry: 'Ultrasonic thickness gauging & zinc anode replacement',
    attendantAtEntrance: 'AB O. Santos',
    ventilationType: 'Continuous Forced Draft Fan',
    checklistAnswers: {
      'cse-01': 'YES',
      'cse-02': 'YES',
      'cse-03': 'YES',
      'cse-04': 'YES',
      'cse-05': 'YES',
      'cse-06': 'YES',
      'cse-07': 'YES',
      'cse-08': 'YES',
      'cse-09': 'YES',
      'cse-10': 'YES',
      'cse-11': 'YES',
      'cse-12': 'YES',
      'cse-13': 'YES',
      'cse-14': 'YES'
    },
    status: 'Active',
    auditTrail: [
      { timestamp: '2026-10-07 17:00', user: 'Pumpman G. Patel', role: 'Performing Authority', action: 'Permit Created as Draft' },
      { timestamp: '2026-10-07 18:00', user: 'Pumpman G. Patel', role: 'Performing Authority', action: 'Permit Requested with Linked RA & TBT' },
      { timestamp: '2026-10-08 06:45', user: 'Chief Officer K. Hansen', role: 'Area Authority', action: 'Area Safety Review & Atmosphere Endorsed' },
      { timestamp: '2026-10-08 07:00', user: '2nd Officer A. Vance', role: 'Responsible Supervisor', action: 'Controls & Rescue Plan Verified' },
      { timestamp: '2026-10-08 07:45', user: 'Capt. H. Miller', role: 'Approving Authority', action: 'Permit Approved & Activated' }
    ]
  },
  {
    id: 'PTW-02',
    referenceNo: 'PTW-2026-0190',
    permitType: 'Hot Work',
    vesselId: 'VES-01',
    vesselName: 'MV Pacific Voyager',
    worksiteLocation: 'Workshop Intermediate Level',
    location: 'Engine Room',
    worksite: 'Workshop Stanchion Frame',
    workDescription: 'MIG welding bracket reinforcement on hatch cover lashing bin support frame.',
    startDateTime: '2026-10-08 09:00',
    expiryDateTime: '2026-10-08 17:00',
    requestedStartTime: '2026-10-08 09:00',
    requestedEndTime: '2026-10-08 17:00',
    validityHours: 8,
    validityPeriod: '8 Hours (Single Shift)',
    duration: 8,
    performingAuthority: 'Fitter S. Kouris',
    areaAuthority: 'Chief Engineer M. Rossi',
    responsibleSupervisor: '2nd Engineer J. Kowalski',
    approvingAuthority: 'Capt. R. Sterling (Master)',
    hazards: 'Hot sparks, combustible paint ignition, UV radiation, fume inhalation.',
    ppe: ['Welding Helmet', 'Leather Apron & Gauntlets', 'Safety Boots', 'Fume Extractor Mask'],
    controlMeasures: 'Fire watch standing by with 2x 9L foam extinguisher and charged hose, fire retardant blankets covering area.',
    linkedRaNumber: 'RA-2026-0044',
    linkedJsa: 'JSA-HW-012: Enclosed Space Hot Work & Grinding',
    toolboxTalkCompleted: true,
    toolboxTalkDate: '2026-10-08 08:30',
    toolboxTalkTopic: 'Hot work fire watch protocols and post-work monitoring',
    isolationLotoRequired: false,
    isolationDetails: 'Electrical isolation of welding socket via dedicated breaker with earth leak trip.',
    lotoRecords: [],
    gasTestingRequired: false,
    gasTestReadings: [],
    simopsRequired: true,
    simopsCheckDone: true,
    simopsNotes: 'Surrounding combustible materials cleared within 10 meter radius.',
    precautionsChecklist: [
      { item: 'Fire watch standing by with 2x 9L foam extinguisher & charged fire hose', checked: true },
      { item: 'Combustible materials shielded with fire retardant blankets', checked: true },
      { item: 'Fire watch mandatory for 60 minutes after hot work completion', checked: true }
    ],
    areaFieldLocation: 'Tanajib Anchorage Anchor Position B-4',
    locationOfWork: 'Engine Room Workshop Intermediate Level',
    responsiblePersonInAttendance: '2nd Engineer J. Kowalski',
    personnelCarryingOutWork: [
      { name: 'S. Kouris', rank: 'Fitter' },
      { name: 'M. Tariq', rank: 'Motorman / Fire Watch' }
    ],
    fireWatchmanName: 'AB M. Tariq',
    fireWatchBridgeComm: 'VHF Ch 14 / Working Ch 16',
    fireMainPressurized: true,
    checklistAnswers: {
      'hw-01': 'YES',
      'hw-02': 'YES',
      'hw-03': 'YES',
      'hw-04': 'YES',
      'hw-05': 'YES',
      'hw-06': 'YES',
      'hw-07': 'YES',
      'hw-08': 'YES',
      'hw-09': 'YES',
      'hw-10': 'YES',
      'hw-11': 'YES',
      'hw-12': 'YES'
    },
    status: 'Approved',
    auditTrail: [
      { timestamp: '2026-10-07 10:00', user: 'Fitter S. Kouris', role: 'Performing Authority', action: 'Permit Created as Draft' },
      { timestamp: '2026-10-07 14:00', user: 'Fitter S. Kouris', role: 'Performing Authority', action: 'Permit Requested' },
      { timestamp: '2026-10-08 07:30', user: 'Chief Engineer M. Rossi', role: 'Area Authority', action: 'Area Safety Review Completed' },
      { timestamp: '2026-10-08 08:00', user: 'Capt. R. Sterling', role: 'Approving Authority', action: 'Permit Approved (Pre-Work Ready)' }
    ]
  },
  {
    id: 'PTW-03',
    referenceNo: 'PTW-2026-0191',
    permitType: 'Electrical Work',
    vesselId: 'VES-02',
    vesselName: 'MT Nordic Titan',
    worksiteLocation: 'Main Switchboard Room 440V Section',
    location: 'Engine Control Room',
    worksite: 'MSB Generator 2 Breaker Cubicle',
    workDescription: 'Main circuit breaker secondary contact overhaul and insulation resistance test.',
    startDateTime: '2026-10-07 13:00',
    expiryDateTime: '2026-10-07 19:00',
    requestedStartTime: '2026-10-07 13:00',
    requestedEndTime: '2026-10-07 19:00',
    validityHours: 6,
    validityPeriod: '6 Hours',
    duration: 6,
    performingAuthority: 'Electro-Technical Officer (ETO) L. Chen',
    areaAuthority: 'Chief Engineer M. Rossi',
    responsibleSupervisor: '1st Engineer D. Santos',
    approvingAuthority: 'Capt. H. Miller (Master)',
    hazards: 'High voltage electrical shock, arc flash, unintended remote start.',
    ppe: ['Arc Flash Shield 40 cal', 'Dielectric Insulated Gloves 1000V', 'Anti-static Safety Boots'],
    controlMeasures: 'Breaker racked out to disconnected position, busbar earth switch closed, padlock applied to rack shutter.',
    linkedRaNumber: 'RA-2026-0062',
    linkedJsa: 'JSA-ELEC-008: High Voltage Switchboard Maintenance',
    toolboxTalkCompleted: true,
    toolboxTalkDate: '2026-10-07 12:30',
    toolboxTalkTopic: 'Lockout tagout and zero electrical energy verification',
    isolationLotoRequired: true,
    isolationType: 'Short term',
    isolationDetails: 'Gen 2 prime mover starting air valve locked shut, 24V starting circuit isolated, MSB cubicle padlock applied.',
    lotoRecords: [
      {
        id: 'LOTO-03',
        equipmentId: 'GEN-02-AIR-VLV',
        description: 'Gen 2 Prime Mover Starting Air Valve',
        isolationDeviceMethod: 'Wheel lock clamped with Master padlock',
        isolatedBy: 'ETO L. Chen',
        isolatedDate: '2026-10-07 12:45',
        deIsolatedBy: '',
        deIsolatedDate: '',
        isolationPoint: 'Gen 2 Prime Mover Starting Air Valve',
        energySource: 'Pneumatic / 30 Bar Air',
        lockNumber: 'LCK-AIR-08',
        lotoNotes: 'Wheel lock clamped with Master padlock.',
        isolatedTime: '2026-10-07 12:45',
        status: 'Isolated'
      },
      {
        id: 'LOTO-04',
        equipmentId: 'MSB-440-ACB-02',
        description: 'Gen 2 ACB Racking Shutter & Bus Isolator',
        isolationDeviceMethod: 'Mechanical shutter lock + Danger Tag',
        isolatedBy: 'ETO L. Chen',
        isolatedDate: '2026-10-07 12:50',
        deIsolatedBy: '',
        deIsolatedDate: '',
        isolationPoint: 'Gen 2 ACB Racking Shutter',
        energySource: 'Electrical 440V',
        lockNumber: 'LCK-ELEC-77',
        lotoNotes: 'Mechanical shutter lock engaged.',
        isolatedTime: '2026-10-07 12:50',
        status: 'Isolated'
      }
    ],
    electricalEquipmentChecklist: {
      system: 'Main Switchboard & 440V Generation Distribution',
      section: 'Engine Room Starboard Switchboard 440V',
      components: 'Main Circuit Breaker ACB-02, Busbars & Feeder Shutter',
      companyCrew: 'Vessel Engineering Crew',
      engineers: 'ETO L. Chen, 1st Engineer D. Santos',
      startDate: '2026-10-07',
      startTime: '13:00',
      durationDays: '1',
      finishDate: '2026-10-07',
      finishTime: '19:00',
      durationHours: '6',
      durationMins: '00',
      chiefEngineer: 'Chief Engineer M. Rossi',
      chiefEngineerDate: '2026-10-07',
      chiefEngineerSignature: 'M. Rossi',
      highVoltageChecks: [
        { id: 'EHV-01', description: 'Safety distance known for the switchboard / Working area', before: true, after: true },
        { id: 'EHV-02', description: 'Warning signs displayed', before: true, after: true },
        { id: 'EHV-03', description: 'Authorized Person and Person in charge to be appointed', before: true, after: true },
        { id: 'EHV-04', description: 'Approved tools and insulating rubber equipment available', before: true, after: true },
        { id: 'EHV-05', description: 'Fire appliances suitable for electrical equipment in readiness', before: true, after: true },
        { id: 'EHV-06', description: 'Circuit isolated, supply breaker removed to park position (Authorized Person/Person in charge)', before: true, after: true },
        { id: 'EHV-07', description: 'Exposure to dangerous parts is reduced to the minimum possible', before: true, after: true },
        { id: 'EHV-08', description: 'High voltage measuring device functionality confirmed (Authorized Person/Person in charge)', before: true, after: true },
        { id: 'EHV-09', description: '"No Voltage" measurement performed on isolated circuit (Authorized Person/Person in charge)', before: true, after: true },
        { id: 'EHV-10', description: 'Earthing switch connected and visually checked (Authorized Person)', before: true, after: true },
        { id: 'EHV-11', description: '"In Service" keys removed and handed over to Authorized Person.', before: true, after: true },
        { id: 'EHV-12', description: '"No Voltage" measurement performed where work is to be carried out (Authorized Person/Person in charge)', before: true, after: true },
        { id: 'EHV-13', description: 'Portable earth cables connected and checked (Authorized Person/Person in charge)', before: true, after: true },
        { id: 'EHV-14', description: 'Working area cleared for tools', before: true, after: true },
        { id: 'EHV-15', description: 'Portable working earth-cables disconnected', before: false, after: true },
        { id: 'EHV-16', description: 'Removed covers and doors secured in place', before: false, after: true },
        { id: 'EHV-17', description: 'Earthing switch disconnected', before: false, after: true },
        { id: 'EHV-18', description: 'Earthing switch visually checked for disconnection', before: false, after: true },
        { id: 'EHV-19', description: 'In service keys in normal position', before: false, after: true },
        { id: 'EHV-20', description: 'Supply breaker gas pressure on and open / moved to normal position', before: false, after: true },
        { id: 'EHV-21', description: 'Power re-established by Authorized Person', before: false, after: true }
      ]
    },
    gasTestingRequired: false,
    gasTestReadings: [],
    simopsRequired: false,
    simopsCheckDone: true,
    simopsNotes: 'No parallel generator synchronization tests during isolation.',
    precautionsChecklist: [
      { item: 'Live voltage test probe verification conducted before touching conductors', checked: true },
      { item: 'Insulated rubber matting deployed at cubicle front', checked: true }
    ],
    areaFieldLocation: 'North Sea Oil Field - Sector C',
    locationOfWork: 'Main Switchboard Room 440V Section',
    responsiblePersonInAttendance: 'Chief Engineer M. Rossi',
    personnelCarryingOutWork: [
      { name: 'L. Chen', rank: 'Electro-Technical Officer' },
      { name: 'D. Santos', rank: '1st Engineer' }
    ],
    energySources: ['Electrical 440V', 'Pneumatic'],
    voltageClassification: '440V to 6.6 kV',
    checklistAnswers: {
      'elec-01': 'YES',
      'elec-02': 'YES',
      'elec-03': 'YES',
      'elec-04': 'YES',
      'elec-05': 'YES',
      'elec-06': 'YES',
      'elec-07': 'YES',
      'elec-08': 'YES',
      'elec-09': 'YES',
      'elec-10': 'YES'
    },
    status: 'Suspended',
    auditTrail: [
      { timestamp: '2026-10-07 12:00', user: 'ETO L. Chen', role: 'Performing Authority', action: 'Permit Created & Requested' },
      { timestamp: '2026-10-07 12:45', user: 'Chief Engineer M. Rossi', role: 'Area Authority', action: 'LOTO Isolation Verified' },
      { timestamp: '2026-10-07 13:00', user: 'Capt. H. Miller', role: 'Approving Authority', action: 'Permit Authorized & Activated' },
      { timestamp: '2026-10-07 15:30', user: 'Chief Engineer M. Rossi', role: 'Area Authority', action: 'Permit Suspended: Emergency maneuvering required auxiliary load restart' }
    ]
  },
  {
    id: 'PTW-04',
    referenceNo: 'PTW-2026-0192',
    permitType: 'Working Aloft',
    vesselId: 'VES-01',
    vesselName: 'MV Pacific Voyager',
    worksiteLocation: 'Forward Radar Mast Platform',
    location: 'Bridge Deck / Mast',
    worksite: 'Main Mast Upper Cross-Tree',
    workDescription: 'X-band radar scanner drive belt inspection and navigation light bracket greasing.',
    startDateTime: '2026-10-08 10:00',
    expiryDateTime: '2026-10-08 14:00',
    requestedStartTime: '2026-10-08 10:00',
    requestedEndTime: '2026-10-08 14:00',
    validityHours: 4,
    validityPeriod: '4 Hours',
    duration: 4,
    performingAuthority: 'Bosun D. Silva',
    areaAuthority: 'Chief Officer K. Hansen',
    responsibleSupervisor: '2nd Officer A. Vance',
    approvingAuthority: 'Capt. R. Sterling (Master)',
    hazards: 'Fall from height (>2 meters), dropped objects onto wheelhouse, microwave radiation from radar, wind gusts.',
    ppe: ['Full Body Harness with Twin Shock-absorbing Lanyard', 'Safety Helmet with Chin Strap', 'Tool Lanyard Tether', 'Safety Boots'],
    controlMeasures: 'Radar transmitters switched off and circuit breakers locked; whistle and radio radar warning tags affixed; safety net deployed.',
    linkedRaNumber: 'RA-2026-0018',
    linkedJsa: 'JSA-WA-003: Mast Aloft Working & RF Radiation Protection',
    toolboxTalkCompleted: true,
    toolboxTalkDate: '2026-10-08 09:15',
    toolboxTalkTopic: 'Fall arrest tie-off points and RF transmitter lockout',
    isolationLotoRequired: true,
    isolationDetails: 'X-Band & S-Band radar power switches in wheelhouse locked off with danger tags.',
    lotoRecords: [
      {
        id: 'LOTO-05',
        isolationPoint: 'X-Band Radar Main Power Breaker',
        energySource: 'Electrical 230V / RF Radiation',
        lockNumber: 'LCK-RF-01',
        lotoNotes: 'Toggle lock applied on radar supply breaker.',
        isolatedBy: 'Bosun D. Silva',
        isolatedTime: '2026-10-08 09:30',
        status: 'Isolated'
      }
    ],
    gasTestingRequired: false,
    gasTestReadings: [],
    simopsRequired: true,
    simopsCheckDone: true,
    simopsNotes: 'Bridge wing lookout cautioned; no crew beneath mast area.',
    precautionsChecklist: [
      { item: 'Wind speed checked (< 20 knots) and ship roll within stable limits', checked: true },
      { item: 'All tools secured to harness with wrist tethers', checked: true }
    ],
    areaFieldLocation: 'Arabian Gulf Transit Corridor',
    locationOfWork: 'Forward Radar Mast Platform',
    responsiblePersonInAttendance: '2nd Officer A. Vance',
    personnelCarryingOutWork: [
      { name: 'D. Silva', rank: 'Bosun' },
      { name: 'K. Patel', rank: 'AB Seaman' }
    ],
    checklistAnswers: {
      'aloft-01': 'YES',
      'aloft-02': 'YES',
      'aloft-03': 'YES',
      'aloft-04': 'YES',
      'aloft-05': 'YES',
      'aloft-06': 'YES',
      'aloft-07': 'YES',
      'aloft-08': 'YES',
      'aloft-09': 'YES',
      'aloft-10': 'YES'
    },
    status: 'Draft',
    auditTrail: [
      { timestamp: '2026-10-08 09:00', user: 'Bosun D. Silva', role: 'Performing Authority', action: 'Permit Draft Initialized' }
    ]
  },
  {
    id: 'PTW-05',
    referenceNo: 'PTW-2026-0193',
    permitType: 'Cold Work',
    vesselId: 'VES-03',
    vesselName: 'MV Arabian Pioneer',
    worksiteLocation: 'Poop Deck Mooring Winch No. 2',
    location: 'Aft Mooring Station',
    worksite: 'Winch Drum Hydraulic Brake Band',
    workDescription: 'Replacement of worn brake lining segments on starboard stern mooring winch.',
    startDateTime: '2026-10-08 11:00',
    expiryDateTime: '2026-10-08 17:00',
    requestedStartTime: '2026-10-08 11:00',
    requestedEndTime: '2026-10-08 17:00',
    validityHours: 6,
    validityPeriod: '6 Hours',
    duration: 6,
    performingAuthority: 'Able Seaman M. Tariq',
    areaAuthority: 'Chief Officer K. Hansen',
    responsibleSupervisor: 'Bosun D. Silva',
    approvingAuthority: 'Capt. R. Sterling (Master)',
    hazards: 'Pinch points, heavy mechanical parts drop, hydraulic fluid release.',
    ppe: ['Safety Helmet', 'Heavy Duty Mechanical Gloves', 'Steel-toe Boots', 'Safety Glasses'],
    controlMeasures: 'Mooring line tension released, hydraulic power pack depressurized and tagged, drum mechanically chocked.',
    linkedRaNumber: 'RA-2026-0071',
    linkedJsa: 'JSA-CW-019: Mooring Equipment Brake Overhaul',
    toolboxTalkCompleted: true,
    toolboxTalkDate: '2026-10-08 10:15',
    toolboxTalkTopic: 'Pinch point awareness and hydraulic depressurization',
    isolationLotoRequired: true,
    isolationDetails: 'Hydraulic winch supply valve shut and locked.',
    lotoRecords: [
      {
        id: 'LOTO-06',
        isolationPoint: 'Aft Mooring Hydraulic Power Pack Valve V-8',
        energySource: 'Hydraulic 180 Bar',
        lockNumber: 'LCK-HYD-55',
        lotoNotes: 'Control handle locked in neutral with tag.',
        isolatedBy: 'Able Seaman M. Tariq',
        isolatedTime: '2026-10-08 10:30',
        status: 'Isolated'
      }
    ],
    gasTestingRequired: false,
    gasTestReadings: [],
    simopsRequired: false,
    simopsCheckDone: true,
    precautionsChecklist: [
      { item: 'Mechanical chain hoist certified and SWL marked', checked: true },
      { item: 'Drum brake wedge blocks inserted to prevent accidental rotation', checked: true }
    ],
    areaFieldLocation: 'Ras Tanura Terminal Anchorage',
    locationOfWork: 'Poop Deck Mooring Winch No. 2',
    responsiblePersonInAttendance: 'Bosun D. Silva',
    personnelCarryingOutWork: [
      { name: 'M. Tariq', rank: 'Able Seaman' },
      { name: 'A. Rahman', rank: 'Ordinary Seaman' }
    ],
    checklistAnswers: {
      'cw-01': 'YES',
      'cw-02': 'YES',
      'cw-03': 'YES',
      'cw-04': 'YES',
      'cw-05': 'YES',
      'cw-06': 'YES',
      'cw-07': 'YES',
      'cw-08': 'YES'
    },
    status: 'Requested',
    auditTrail: [
      { timestamp: '2026-10-08 09:30', user: 'Able Seaman M. Tariq', role: 'Performing Authority', action: 'Permit Draft Created' },
      { timestamp: '2026-10-08 10:00', user: 'Able Seaman M. Tariq', role: 'Performing Authority', action: 'Permit Submitted for Area Safety Review' }
    ]
  },
  {
    id: 'PTW-06',
    referenceNo: 'PTW-2026-0185',
    permitType: 'Working Overboard',
    vesselId: 'VES-01',
    vesselName: 'MV Pacific Voyager',
    worksiteLocation: 'Starboard Shipside Draft Marks',
    location: 'Midships Hull Shell',
    worksite: 'Draft Marks at Sea Level',
    workDescription: 'Touching up white epoxy coating on starboard midship draft marks using pilot stage.',
    startDateTime: '2026-10-06 08:00',
    expiryDateTime: '2026-10-06 14:00',
    requestedStartTime: '2026-10-06 08:00',
    requestedEndTime: '2026-10-06 14:00',
    validityHours: 6,
    validityPeriod: '6 Hours',
    duration: 6,
    performingAuthority: 'Bosun D. Silva',
    areaAuthority: 'Chief Officer K. Hansen',
    responsibleSupervisor: '2nd Officer A. Vance',
    approvingAuthority: 'Capt. R. Sterling (Master)',
    hazards: 'Falling into water, man overboard risk, vessel drift, solvent fumes.',
    ppe: ['SOLAS Approved Work Vest / Lifejacket', 'Safety Harness with Safety Line', 'Safety Helmet', 'Chemical Splash Goggles'],
    controlMeasures: 'Lifebuoy with 30m buoyant lifeline and self-igniting light on stand-by; deck watchman continuously stationed.',
    linkedRaNumber: 'RA-2026-0012',
    linkedJsa: 'JSA-OB-002: Overboard Painting & Stage Suspension',
    toolboxTalkCompleted: true,
    toolboxTalkDate: '2026-10-06 07:30',
    toolboxTalkTopic: 'Man overboard rescue procedure and stage rope security',
    isolationLotoRequired: false,
    isolationDetails: '',
    lotoRecords: [],
    gasTestingRequired: false,
    gasTestReadings: [],
    simopsRequired: true,
    simopsCheckDone: true,
    simopsNotes: 'No propeller turning or shipside discharge on starboard side during stage deployment.',
    precautionsChecklist: [
      { item: 'Rescue boat ready for immediate launching with crew on call', checked: true },
      { item: 'Overboard stage ropes inspected and tested with 2x body weight', checked: true },
      { item: 'Officer of the Watch notified on wheelhouse before rigging', checked: true }
    ],
    areaFieldLocation: 'Arabian Gulf Anchorage Spot 12',
    locationOfWork: 'Starboard Shipside Main Deck Midship',
    responsiblePersonInAttendance: 'Chief Officer K. Hansen',
    personnelCarryingOutWork: [
      { name: 'D. Silva', rank: 'Bosun' },
      { name: 'K. Patel', rank: 'AB Seaman' }
    ],
    checklistAnswers: {
      'over-01': 'YES',
      'over-02': 'YES',
      'over-03': 'YES',
      'over-04': 'YES',
      'over-05': 'YES',
      'over-06': 'YES',
      'over-07': 'YES',
      'over-08': 'YES',
      'over-09': 'YES',
      'over-10': 'YES'
    },
    status: 'Closed',
    auditTrail: [
      { timestamp: '2026-10-05 16:00', user: 'Bosun D. Silva', role: 'Performing Authority', action: 'Permit Requested' },
      { timestamp: '2026-10-06 07:45', user: 'Capt. R. Sterling', role: 'Approving Authority', action: 'Permit Authorized & Activated' },
      { timestamp: '2026-10-06 13:30', user: 'Bosun D. Silva', role: 'Performing Authority', action: 'Work Completed: Stage Recovered' },
      { timestamp: '2026-10-06 13:50', user: 'Chief Officer K. Hansen', role: 'Area Authority', action: 'Site Restoration Verified: Overboard area cleared' },
      { timestamp: '2026-10-06 14:00', user: 'Capt. R. Sterling', role: 'Approving Authority', action: 'Permit Signed Off & Officially Closed' }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class PermitStore {
  private state = inject(HseqStateService);

  readonly records = signal<PermitToWorkRecord[]>(this.loadInitial());

  constructor() {
    // Automatically save to localStorage and sync central state
    effect(() => {
      const data = this.records();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not persist PTW records', e);
      }
      this.state.permits.set(data);
    });
  }

  private loadInitial(): PermitToWorkRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            ...p,
            areaFieldLocation: p.areaFieldLocation || 'Zuluf Field / Tanajib Anchorage',
            locationOfWork: p.locationOfWork || p.worksiteLocation || 'Main Cargo Tank Area',
            responsiblePersonInAttendance: p.responsiblePersonInAttendance || p.areaAuthority || 'Chief Officer K. Hansen',
            personnelCarryingOutWork: (p.personnelCarryingOutWork && p.personnelCarryingOutWork.length > 0)
              ? p.personnelCarryingOutWork
              : [
                  { name: p.performingAuthority || 'Lead Technician', rank: 'Specialist' },
                  { name: 'J. Smith', rank: 'AB Seaman' }
                ],
            spaceType: p.spaceType || (p.permitType === 'Confined Space Entry' ? 'Cargo Tank' : undefined),
            attendantAtEntrance: p.attendantAtEntrance || (p.permitType === 'Confined Space Entry' ? 'AB O. Santos' : undefined),
            ventilationType: p.ventilationType || (p.permitType === 'Confined Space Entry' ? 'Continuous Forced Draft Fan' : undefined),
            fireWatchmanName: p.fireWatchmanName || (p.permitType === 'Hot Work' ? 'AB M. Tariq' : undefined),
            fireWatchBridgeComm: p.fireWatchBridgeComm ?? (p.permitType === 'Hot Work' ? true : undefined),
            fireMainPressurized: p.fireMainPressurized ?? (p.permitType === 'Hot Work' ? true : undefined)
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load permits from localStorage', e);
    }
    return INITIAL_DEMO_PERMITS;
  }

  // Computed metrics for dashboard
  readonly totalCount = computed(() => this.records().length);
  readonly activeCount = computed(() => this.records().filter(p => p.status === 'Active').length);
  readonly approvedCount = computed(() => this.records().filter(p => p.status === 'Approved').length);
  readonly requestedCount = computed(() => this.records().filter(p => p.status === 'Requested').length);
  readonly suspendedCount = computed(() => this.records().filter(p => p.status === 'Suspended').length);
  readonly closedCount = computed(() => this.records().filter(p => p.status === 'Closed').length);
  readonly draftCount = computed(() => this.records().filter(p => p.status === 'Draft').length);

  readonly expiringSoonCount = computed(() => {
    return this.records().filter(p => p.status === 'Active' && p.validityHours <= 4).length;
  });

  readonly typeBreakdown = computed(() => {
    const map: Record<string, number> = {};
    for (const p of this.records()) {
      map[p.permitType] = (map[p.permitType] || 0) + 1;
    }
    return map;
  });

  readonly vesselBreakdown = computed(() => {
    const map: Record<string, number> = {};
    for (const p of this.records()) {
      map[p.vesselName] = (map[p.vesselName] || 0) + 1;
    }
    return map;
  });

  getPermit(id: string): PermitToWorkRecord | undefined {
    return this.records().find(p => p.id === id);
  }

  addPermit(data: Partial<PermitToWorkRecord>): PermitToWorkRecord {
    const currentList = this.records();
    const count = currentList.length + 1;
    const autoRefNo = `PTW-${new Date().getFullYear()}-0${190 + count}`;
    const id = `PTW-${String(count).padStart(2, '0')}`;

    let vesselName = data.vesselName;
    let vesselId = data.vesselId;

    if (vesselId && !vesselName) {
      const found = this.state.vessels().find(v => v.id === vesselId);
      if (found) vesselName = found.name;
    } else if (vesselName && !vesselId) {
      const found = this.state.vessels().find(v => v.name === vesselName);
      if (found) vesselId = found.id;
    }

    if (!vesselName) {
      const defaultV = this.state.vessels()[0];
      vesselName = defaultV?.name || 'Fleet Vessel';
      vesselId = defaultV?.id || 'VES-01';
    }
    if (!vesselId) {
      const defaultV = this.state.vessels()[0];
      vesselId = defaultV?.id || 'VES-01';
    }

    const newRecord: PermitToWorkRecord = {
      id,
      referenceNo: autoRefNo,
      permitType: data.permitType || 'Hot Work',
      vesselId,
      vesselName,
      areaFieldLocation: data.areaFieldLocation || 'Zuluf Field / Tanajib Anchorage',
      locationOfWork: data.locationOfWork || data.worksiteLocation || data.worksite || 'Main Deck Area',
      worksiteLocation: data.worksiteLocation || (data.location ? `${data.location} • ${data.worksite || 'Worksite'}` : 'Deck Area'),
      location: data.location || 'Deck Area',
      worksite: data.worksite || 'Worksite 1',
      workDescription: data.workDescription || '',
      startDateTime: data.startDateTime || data.requestedStartTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
      expiryDateTime: data.expiryDateTime || data.requestedEndTime || new Date(Date.now() + 8 * 3600000).toISOString().replace('T', ' ').substring(0, 16),
      requestedStartTime: data.requestedStartTime || data.startDateTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
      requestedEndTime: data.requestedEndTime || data.expiryDateTime || new Date(Date.now() + 8 * 3600000).toISOString().replace('T', ' ').substring(0, 16),
      duration: data.duration || data.validityHours || 8,
      validityHours: data.validityHours || 8,
      validityPeriod: data.validityPeriod || `${data.validityHours || 8} Hours`,
      performingAuthority: data.performingAuthority || 'Performing Officer',
      areaAuthority: data.areaAuthority || 'Area Authority',
      responsibleSupervisor: data.responsibleSupervisor || 'Responsible Supervisor',
      approvingAuthority: data.approvingAuthority || 'Master / Approver',
      responsiblePersonInAttendance: data.responsiblePersonInAttendance || data.responsibleSupervisor || 'Chief Officer K. Hansen',
      personnelCarryingOutWork: data.personnelCarryingOutWork || [
        { name: data.performingAuthority || 'Performing Officer', rank: 'Work Party Lead', briefed: true }
      ],
      checklistAnswers: data.checklistAnswers || {},
      spaceType: data.spaceType,
      connectedAdjacentSpaces: data.connectedAdjacentSpaces,
      lastCargo: data.lastCargo,
      reasonForEntry: data.reasonForEntry,
      attendantAtEntrance: data.attendantAtEntrance,
      ventilationType: data.ventilationType,
      fireWatchmanName: data.fireWatchmanName,
      fireWatchBridgeComm: data.fireWatchBridgeComm,
      fireMainPressurized: data.fireMainPressurized,
      energySources: data.energySources,
      voltageClassification: data.voltageClassification,
      divingSupervisor: data.divingSupervisor,
      classSurveyor: data.classSurveyor,
      clientRep: data.clientRep,
      flagAlphaHoisted: data.flagAlphaHoisted,
      dpaPermissionReceived: data.dpaPermissionReceived,
      wasteDisposalSealed: data.wasteDisposalSealed,
      emergencyEquipmentCounts: data.emergencyEquipmentCounts,
      hazards: data.hazards || 'General workplace hazards identified during safety briefing.',
      ppe: data.ppe || ['Safety Helmet', 'Safety Boots', 'High-Vis Vest', 'Gloves'],
      controlMeasures: data.controlMeasures || 'Toolbox talk conducted and area controls established.',
      linkedRaNumber: data.linkedRaNumber || 'RA-2026-0018',
      linkedJsa: data.linkedJsa || 'JSA-STD-001: General Shipboard Maintenance',
      toolboxTalkCompleted: data.toolboxTalkCompleted ?? true,
      toolboxTalkDate: data.toolboxTalkDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
      toolboxTalkTopic: data.toolboxTalkTopic || 'Safety scope briefing & control verification',
      isolationLotoRequired: data.isolationLotoRequired ?? false,
      isolationDetails: data.isolationDetails || '',
      lotoRecords: data.lotoRecords || [],
      gasTestingRequired: data.gasTestingRequired ?? false,
      gasTestReadings: data.gasTestReadings || [],
      simopsRequired: data.simopsRequired ?? false,
      simopsCheckDone: data.simopsCheckDone ?? true,
      simopsNotes: data.simopsNotes || '',
      precautionsChecklist: data.precautionsChecklist || [
        { item: 'Toolbox safety talk conducted and signed by work party', checked: true },
        { item: 'Appropriate PPE inspected and worn by all personnel', checked: true },
        { item: 'Emergency stop and evacuation route identified and clear', checked: true }
      ],
      status: (data.status as any) || 'Draft',
      workflowProgress: data.workflowProgress || {
        areaSafetyReviewed: false,
        controlsVerified: false,
        masterApproved: false,
        workCompleted: false,
        siteRestored: false
      },
      auditTrail: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: data.performingAuthority || 'Performing Authority',
          role: 'Performing Authority',
          action: 'Permit Created as Draft'
        }
      ]
    };

    this.records.update(list => [newRecord, ...list]);
    return newRecord;
  }

  updatePermit(id: string, updates: Partial<PermitToWorkRecord>): void {
    this.records.update(list =>
      list.map(p => {
        if (p.id === id) {
          let vesselName = updates.vesselName || p.vesselName;
          if (updates.vesselId && updates.vesselId !== p.vesselId && !updates.vesselName) {
            const v = this.state.vessels().find(x => x.id === updates.vesselId);
            if (v) vesselName = v.name;
          }
          const updated: PermitToWorkRecord = {
            ...p,
            ...updates,
            vesselName,
            auditTrail: [
              ...p.auditTrail,
              {
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                user: updates.performingAuthority || p.performingAuthority || 'User',
                role: 'System / User',
                action: 'Permit Details Updated',
                notes: 'Administrative modifications applied'
              }
            ]
          };
          return updated;
        }
        return p;
      })
    );
  }

  deletePermit(id: string): void {
    this.records.update(list => list.filter(p => p.id !== id));
  }

  updateStatus(
    id: string,
    newStatus: PermitToWorkRecord['status'],
    user: string = 'Authorized Officer',
    role: string = 'Approving Authority',
    notes?: string
  ): void {
    this.records.update(list =>
      list.map(p => {
        if (p.id === id) {
          return {
            ...p,
            status: newStatus,
            auditTrail: [
              ...p.auditTrail,
              {
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                user,
                role,
                action: `Permit transitioned to ${newStatus}`,
                notes
              }
            ]
          };
        }
        return p;
      })
    );
  }

  // Specialized Sequential Workflow Actions
  submitPermit(id: string, user?: string, notes?: string): void {
    const p = this.getPermit(id);
    this.updateStatus(id, 'Requested', user || p?.performingAuthority || 'Performing Authority', 'Performing Authority', notes || 'Submitted for Area Authority & Supervisor review');
  }

  reviewAreaSafety(id: string, user?: string, notes?: string): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id) {
          const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const wp = item.workflowProgress || {
            areaSafetyReviewed: false,
            controlsVerified: false,
            masterApproved: false,
            workCompleted: false,
            siteRestored: false
          };
          return {
            ...item,
            workflowProgress: {
              ...wp,
              areaSafetyReviewed: true,
              areaReviewedBy: user || item.areaAuthority || 'Area Authority',
              areaReviewDate: now,
              areaReviewNotes: notes
            },
            auditTrail: [
              ...item.auditTrail,
              {
                timestamp: now,
                user: user || item.areaAuthority || 'Area Authority',
                role: 'Area Authority',
                action: 'Area Safety Review Completed & Endorsed',
                notes: notes || 'Worksite physical safety verified, hazards isolated.'
              }
            ]
          };
        }
        return item;
      })
    );
  }

  verifyControls(id: string, user?: string, notes?: string): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id) {
          const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const wp = item.workflowProgress || {
            areaSafetyReviewed: true,
            controlsVerified: false,
            masterApproved: false,
            workCompleted: false,
            siteRestored: false
          };
          return {
            ...item,
            workflowProgress: {
              ...wp,
              controlsVerified: true,
              controlsVerifiedBy: user || item.responsibleSupervisor || 'Responsible Supervisor',
              controlsVerifyDate: now,
              controlsVerifyNotes: notes
            },
            auditTrail: [
              ...item.auditTrail,
              {
                timestamp: now,
                user: user || item.responsibleSupervisor || 'Responsible Supervisor',
                role: 'Responsible Supervisor',
                action: 'Controls & Work Plan Verified',
                notes: notes || 'Hierarchy of controls and JSA precautions verified on site.'
              }
            ]
          };
        }
        return item;
      })
    );
  }

  approvePermit(id: string, user?: string, notes?: string): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id) {
          const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const wp = item.workflowProgress || {
            areaSafetyReviewed: true,
            controlsVerified: true,
            masterApproved: false,
            workCompleted: false,
            siteRestored: false
          };
          return {
            ...item,
            status: 'Approved',
            workflowProgress: {
              ...wp,
              masterApproved: true,
              masterApprovedBy: user || item.approvingAuthority || 'Approving Authority',
              masterApproveDate: now,
              masterApproveNotes: notes
            },
            auditTrail: [
              ...item.auditTrail,
              {
                timestamp: now,
                user: user || item.approvingAuthority || 'Approving Authority',
                role: 'Approving Authority',
                action: 'Permit Formally Approved by Master',
                notes: notes || 'Master / Designated Approver authorized permit for execution.'
              }
            ]
          };
        }
        return item;
      })
    );
  }

  activatePermit(id: string, user?: string, notes?: string): void {
    const p = this.getPermit(id);
    this.updateStatus(id, 'Active', user || p?.performingAuthority || 'Performing Authority', 'Work Party', notes || 'Pre-work toolbox talk done; work commences now.');
  }

  suspendPermit(id: string, reason: string, user?: string): void {
    const p = this.getPermit(id);
    this.updateStatus(id, 'Suspended', user || p?.areaAuthority || 'Area Authority', 'Area Authority', `Work suspended: ${reason}`);
  }

  resumePermit(id: string, remarks: string = 'Safety re-verified, work resumed.', user?: string): void {
    const p = this.getPermit(id);
    this.updateStatus(id, 'Active', user || p?.performingAuthority || 'Performing Authority', 'Work Party', remarks);
  }

  extendPermit(id: string, additionalHours: number, reason: string, user?: string): void {
    this.records.update(list =>
      list.map(p => {
        if (p.id === id) {
          const newHours = (p.validityHours || 8) + additionalHours;
          const currentExp = new Date(p.expiryDateTime || Date.now());
          const newExpDate = new Date(currentExp.getTime() + additionalHours * 3600000);
          const newExpStr = newExpDate.toISOString().replace('T', ' ').substring(0, 16);

          return {
            ...p,
            status: 'Extended',
            validityHours: newHours,
            expiryDateTime: newExpStr,
            auditTrail: [
              ...p.auditTrail,
              {
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                user: user || p.approvingAuthority || 'Approving Authority',
                role: 'Approving Authority',
                action: `Permit Extended by ${additionalHours} Hours`,
                notes: `Reason: ${reason}. New expiry: ${newExpStr}`
              }
            ]
          };
        }
        return p;
      })
    );
  }

  declareWorkComplete(id: string, user?: string, remarks?: string): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id) {
          const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const wp = item.workflowProgress || {
            areaSafetyReviewed: true,
            controlsVerified: true,
            masterApproved: true,
            workCompleted: false,
            siteRestored: false
          };
          return {
            ...item,
            workflowProgress: {
              ...wp,
              workCompleted: true,
              workCompletedBy: user || item.performingAuthority || 'Performing Authority',
              workCompleteDate: now
            },
            auditTrail: [
              ...item.auditTrail,
              {
                timestamp: now,
                user: user || item.performingAuthority || 'Performing Authority',
                role: 'Performing Authority',
                action: 'Work Declared Complete',
                notes: remarks || 'Tools returned, work crew withdrawn from site.'
              }
            ]
          };
        }
        return item;
      })
    );
  }

  verifySiteRestoration(id: string, user?: string, remarks?: string): void {
    this.records.update(list =>
      list.map(item => {
        if (item.id === id) {
          const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const restoredLoto = (item.lotoRecords || []).map(l => ({ ...l, status: 'De-isolated' as const }));
          const wp = item.workflowProgress || {
            areaSafetyReviewed: true,
            controlsVerified: true,
            masterApproved: true,
            workCompleted: true,
            siteRestored: false
          };
          return {
            ...item,
            lotoRecords: restoredLoto,
            workflowProgress: {
              ...wp,
              siteRestored: true,
              siteRestoredBy: user || item.areaAuthority || 'Area Authority',
              siteRestoreDate: now,
              siteRestoreNotes: remarks
            },
            auditTrail: [
              ...item.auditTrail,
              {
                timestamp: now,
                user: user || item.areaAuthority || 'Area Authority',
                role: 'Area Authority',
                action: 'Site Restoration Verified: All isolations de-isolated',
                notes: remarks || 'Good housekeeping confirmed, energy isolations removed, site returned to safe operational status.'
              }
            ]
          };
        }
        return item;
      })
    );
  }

  closePermit(id: string, user?: string, remarks?: string): void {
    const p = this.getPermit(id);
    this.updateStatus(id, 'Closed', user || p?.approvingAuthority || 'Approving Authority', 'Approving Authority', remarks || 'Final inspection satisfactory. Permit officially closed.');
  }

  // Gas Testing Sub-Records
  addGasTest(permitId: string, test: Partial<GasTestReading>): void {
    this.records.update(list =>
      list.map(p => {
        if (p.id === permitId) {
          const newTest: GasTestReading = {
            id: `GT-${Date.now()}`,
            gasType: test.gasType || 'Oxygen (O2)',
            reading: test.reading || '20.9%',
            safePermissibleRange: test.safePermissibleRange || '20.8% - 21.0%',
            testerName: test.testerName || 'Certified Tester',
            timestamp: test.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16),
            retestFrequency: test.retestFrequency || 'Every 2 Hours',
            passed: test.passed ?? true,
            status: test.status || (test.passed !== false ? 'Safe' : 'Hazardous')
          };
          return {
            ...p,
            gasTestReadings: [...(p.gasTestReadings || []), newTest],
            auditTrail: [
              ...p.auditTrail,
              {
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                user: newTest.testerName,
                role: 'Gas Tester',
                action: `Gas Test Logged: ${newTest.gasType} = ${newTest.reading} (${newTest.status})`
              }
            ]
          };
        }
        return p;
      })
    );
  }

  deleteGasTest(permitId: string, testIndex: number): void {
    this.records.update(list =>
      list.map(p => {
        if (p.id === permitId && p.gasTestReadings) {
          const updated = [...p.gasTestReadings];
          updated.splice(testIndex, 1);
          return { ...p, gasTestReadings: updated };
        }
        return p;
      })
    );
  }

  // LOTO Sub-Records
  addLotoRecord(permitId: string, loto: Partial<LotoRecord>): void {
    this.records.update(list =>
      list.map(p => {
        if (p.id === permitId) {
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
          const newLoto: LotoRecord = {
            id: `LOTO-${Date.now()}`,
            equipmentId: loto.equipmentId || loto.isolationPoint || `EQP-${Math.floor(100 + Math.random() * 900)}`,
            description: loto.description || loto.isolationPoint || 'Circuit / Valve Isolation',
            isolationDeviceMethod: loto.isolationDeviceMethod || loto.lotoNotes || 'Master Padlock & Danger Tag',
            isolatedBy: loto.isolatedBy || p.areaAuthority || 'Chief Engineer',
            isolatedDate: loto.isolatedDate || nowStr,
            deIsolatedBy: loto.deIsolatedBy || '',
            deIsolatedDate: loto.deIsolatedDate || '',
            isolationPoint: loto.isolationPoint || loto.description || 'Valve / Breaker',
            energySource: loto.energySource || 'Electrical',
            lockNumber: loto.lockNumber || `LCK-${Math.floor(100 + Math.random() * 900)}`,
            lotoNotes: loto.lotoNotes || loto.isolationDeviceMethod || '',
            isolatedTime: loto.isolatedTime || nowStr,
            status: 'Isolated'
          };
          return {
            ...p,
            lotoRecords: [...(p.lotoRecords || []), newLoto],
            auditTrail: [
              ...p.auditTrail,
              {
                timestamp: nowStr,
                user: newLoto.isolatedBy || 'Safety Officer',
                role: 'Isolation Authority',
                action: `LOTO Applied: ${newLoto.equipmentId} - ${newLoto.description} (${newLoto.lockNumber})`
              }
            ]
          };
        }
        return p;
      })
    );
  }

  toggleLotoStatus(permitId: string, lotoId: string): void {
    this.records.update(list =>
      list.map(p => {
        if (p.id === permitId && p.lotoRecords) {
          const updated = p.lotoRecords.map(l => {
            if (l.id === lotoId) {
              const newStatus = l.status === 'Isolated' ? 'De-isolated' : 'Isolated';
              return { ...l, status: newStatus as any };
            }
            return l;
          });
          return { ...p, lotoRecords: updated };
        }
        return p;
      })
    );
  }

  updateLotoStatus(permitId: string, lotoId: string, status: 'Isolated' | 'De-isolated'): void {
    this.records.update(list =>
      list.map(p => {
        if (p.id === permitId && p.lotoRecords) {
          const updated = p.lotoRecords.map(l => {
            if (l.id === lotoId) {
              return { ...l, status };
            }
            return l;
          });
          return { ...p, lotoRecords: updated };
        }
        return p;
      })
    );
  }

  deleteLotoRecord(permitId: string, lotoId: string): void {
    this.records.update(list =>
      list.map(p => {
        if (p.id === permitId && p.lotoRecords) {
          return {
            ...p,
            lotoRecords: p.lotoRecords.filter(l => l.id !== lotoId)
          };
        }
        return p;
      })
    );
  }

  resetToDemo(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.records.set(INITIAL_DEMO_PERMITS);
  }
}
