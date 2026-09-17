// PGI indicator configuration: bit maps, District PGI-D and State PGI 2.0 indicator sets.
// Extracted verbatim from the original single-file dashboard.

// ---- Bit maps ----
const BIT_ORDER = ['2.2.1','2.2.2','2.2.3','2.2.4','2.2.5','2.2.6','2.2.7','2.2.9','2.2.10',
             '2.2.11','2.1.8','3.4','3.5','3.6','3.7','3.11','4.1','4.2','4.3','4.4',
             '4.5','4.6','4.7','5.1','5.2','5.3','6.3','6.4'];
const BIT = {}; BIT_ORDER.forEach((c,i)=>BIT[c]=i);
const BIT2_ORDER = ['S3.2b','S3.2c','S3.3b','S3.8','S3.9a','S3.9b','S3.11','S3.15','S4.12','S5.4','ELEC','S3.1a','S3.1b'];
const BIT2 = {}; BIT2_ORDER.forEach((c,i)=>BIT2[c]=i);

function bitOf(row, field, code){
  const val = field===1 ? row[6] : row[8]; // 1=met, 2=met2
  const map = field===1 ? BIT : BIT2;
  return ((val >> map[code]) & 1) === 1;
}

// ---- District PGI-D indicator set ----
const DISTRICT_INDICATORS = [
  {code:'2.2.1', name:'Girls Toilet (Functional)', cat:'ECT', wt:2, base:'total', src:1, bitCode:'2.2.1'},
  {code:'2.2.2', name:'Boys Toilet (Functional)', cat:'ECT', wt:2, base:'total', src:1, bitCode:'2.2.2'},
  {code:'2.2.3', name:'CWSN Friendly Toilet', cat:'ECT', wt:2, base:'total', src:1, bitCode:'2.2.3'},
  {code:'2.2.4', name:'Drinking Water Facility', cat:'ECT', wt:2, base:'total', src:1, bitCode:'2.2.4'},
  {code:'2.2.5', name:'Hand Wash Area', cat:'ECT', wt:2, base:'total', src:1, bitCode:'2.2.5'},
  {code:'2.2.6', name:'Rainwater Harvesting', cat:'ECT', wt:2, base:'total', src:1, bitCode:'2.2.6'},
  {code:'2.2.7', name:'Playground', cat:'ECT', wt:4, base:'total', src:1, bitCode:'2.2.7'},
  {code:'2.2.9', name:'Fit India Certified', cat:'ECT', wt:4, base:'total5', src:1, bitCode:'2.2.9'},
  {code:'2.2.10', name:'EBSB Activity Conducted', cat:'ECT', wt:2, base:'total5', src:1, bitCode:'2.2.10'},
  {code:'2.2.11', name:'SDMC Constituted', cat:'ECT', wt:4, base:'ga_total5', src:1, bitCode:'2.2.11'},
  {code:'2.1.8', name:'Holistic Report Card', cat:'ECT', wt:10, base:'ga_total5', src:1, bitCode:'2.1.8'},
  {code:'3.4', name:'Library / Reading Corner', cat:'IFSE', wt:4, base:'total', src:1, bitCode:'3.4'},
  {code:'3.5', name:'Ramp with Railing', cat:'IFSE', wt:4, base:'total', src:1, bitCode:'3.5'},
  {code:'3.6', name:'Integrated Science Lab', cat:'IFSE', wt:4, base:'sec_hsec', src:1, bitCode:'3.6'},
  {code:'3.7', name:'Kitchen Garden', cat:'IFSE', wt:4, base:'total', src:1, bitCode:'3.7'},
  {code:'3.11', name:'Eco / Youth Club', cat:'IFSE', wt:2, base:'total', src:1, bitCode:'3.11'},
  {code:'4.1', name:'First-Level Counselor Teacher', cat:'SSCP', wt:5, base:'total', src:1, bitCode:'4.1'},
  {code:'4.2', name:'Safety Audit (Struc+Non-struc)', cat:'SSCP', wt:5, base:'total', src:1, bitCode:'4.2'},
  {code:'4.3', name:'Safety / Disaster Training', cat:'SSCP', wt:5, base:'total', src:1, bitCode:'4.3'},
  {code:'4.4', name:'Annual Health Record', cat:'SSCP', wt:5, base:'total', src:1, bitCode:'4.4'},
  {code:'4.5', name:'Girls Self-Defense Training', cat:'SSCP', wt:5, base:'up_sec_hsec', src:1, bitCode:'4.5'},
  {code:'4.6', name:'School Disaster Mgmt Plan', cat:'SSCP', wt:5, base:'total', src:1, bitCode:'4.6'},
  {code:'4.7', name:'SSSA Self-Certification', cat:'SSCP', wt:5, base:'total', src:1, bitCode:'4.7'},
  {code:'5.1', name:'Internet (Pedagogical Use)', cat:'DL', wt:10, base:'total', src:1, bitCode:'5.1'},
  {code:'5.2', name:'Computer/Laptop (Pedagogical)', cat:'DL', wt:10, base:'total', src:1, bitCode:'5.2'},
  {code:'5.3', name:'Smart Class / Digital Board', cat:'DL', wt:10, base:'total', src:1, bitCode:'5.3'},
  {code:'6.3', name:'Digital Teacher Attendance', cat:'GP', wt:15, base:'ga_total', src:1, bitCode:'6.3'},
  {code:'6.4', name:'Digital Student Attendance', cat:'GP', wt:15, base:'ga_total', src:1, bitCode:'6.4'},
];
const DISTRICT_CATS = {
  ECT:{label:'Effective Classroom Transaction', full:90},
  IFSE:{label:'Infra, Facilities & Entitlements', full:51},
  SSCP:{label:'School Safety & Child Protection', full:35},
  DL:{label:'Digital Learning', full:50},
  GP:{label:'Governance Processes', full:84},
};

// ---- State PGI 2.0 indicator set ----
const STATE_INDICATORS = [
  {code:'3.1a', name:'ICT Lab', cat:'IF', wt:10, base:'ga_uprpri', src:2, bitCode:'S3.1a'},
  {code:'3.1b', name:'Smart Classes', cat:'IF', wt:10, base:'total', src:2, bitCode:'S3.1b'},
  {code:'3.2a', name:'Integrated Science Lab', cat:'IF', wt:5, base:'sec_hsec', src:1, bitCode:'3.6'},
  {code:'3.2b', name:'Separate Science Lab', cat:'IF', wt:5, base:'hsec_only', src:2, bitCode:'S3.2b'},
  {code:'3.2c', name:'Co-curricular / Arts Room', cat:'IF', wt:5, base:'sec_hsec', src:2, bitCode:'S3.2c'},
  {code:'3.3a', name:'Library/Book Bank/Reading Corner', cat:'IF', wt:5, base:'total', src:1, bitCode:'3.4'},
  {code:'3.3b', name:'Separate Library Room', cat:'IF', wt:5, base:'total', src:2, bitCode:'S3.3b'},
  {code:'3.8', name:'Health Check-up (last year)', cat:'IF', wt:10, base:'total', src:2, bitCode:'S3.8'},
  {code:'3.9a', name:'Sanitary Pad Vending Machine', cat:'IF', wt:10, base:'sec_hsec_not_boys', src:2, bitCode:'S3.9a'},
  {code:'3.9b', name:'Functional Incinerator (Girls Toilet)', cat:'IF', wt:10, base:'sec_hsec_not_boys', src:2, bitCode:'S3.9b'},
  {code:'3.11', name:'Balvatika (Co-located Anganwadi)', cat:'IF', wt:10, base:'ga_total', src:2, bitCode:'S3.11'},
  {code:'3.12', name:'Kitchen Garden', cat:'IF', wt:10, base:'total', src:1, bitCode:'3.7'},
  {code:'3.13', name:'Rainwater Harvesting', cat:'IF', wt:10, base:'total', src:1, bitCode:'2.2.6'},
  {code:'3.14', name:'Functional Drinking Water', cat:'IF', wt:10, base:'total', src:1, bitCode:'2.2.4'},
  {code:'3.15', name:'Functional Solar Panel', cat:'IF', wt:10, base:'total', src:2, bitCode:'S3.15'},
  {code:'4.12', name:'Assistive Tech for CWSN', cat:'EQ', wt:10, base:'total', src:2, bitCode:'S4.12'},
  {code:'4.14', name:'Ramp with Railing', cat:'EQ', wt:10, base:'total', src:1, bitCode:'3.5'},
  {code:'4.15', name:'CWSN-friendly Functional Toilet', cat:'EQ', wt:10, base:'total', src:1, bitCode:'2.2.3'},
  {code:'4.16a', name:'Functional Boys Toilet', cat:'EQ', wt:10, base:'total', src:1, bitCode:'2.2.2'},
  {code:'4.16b', name:'Functional Girls Toilet', cat:'EQ', wt:10, base:'total', src:1, bitCode:'2.2.1'},
  {code:'5.2', name:'Digital Student Attendance', cat:'GOV', wt:5, base:'ga_total', src:1, bitCode:'6.4'},
  {code:'5.3', name:'Digital Teacher Attendance', cat:'GOV', wt:5, base:'ga_total', src:1, bitCode:'6.3'},
  {code:'5.4', name:'Anganwadi Co-located', cat:'GOV', wt:10, base:'ga_total', src:2, bitCode:'S5.4'},
  {code:'5.11', name:'Internet for Pedagogical Use', cat:'GOV', wt:10, base:'total', src:1, bitCode:'5.1'},
];
const STATE_CATS = {
  IF:{label:'Infrastructure & Facilities', full:190},
  EQ:{label:'Equity', full:260},
  GOV:{label:'Governance Processes', full:130},
};

export { BIT_ORDER, BIT, BIT2_ORDER, BIT2, bitOf, DISTRICT_INDICATORS, DISTRICT_CATS, STATE_INDICATORS, STATE_CATS };
