// adminSampleData.js
// Static examples for admin pages that have not yet been connected to the API.

export const adminUser = { name: "Kumar Shan", role: "Super Admin • BT Dispatch" };

// 3500 -> "Rs. 3,500"
export function formatRs(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-US");
}

// "Fathima Zahra" -> "FZ"
export function getInitials(name) {
  const words = name.split(" ");
  return words[0].charAt(0) + (words[1] ? words[1].charAt(0) : "");
}

// ---------- Dashboard ----------
// tab: "completed", "dispatched" or "cancelled" (used by the tab buttons)
export const liveRequests = [
  { id: "#RM-84918", customer: "Fatima Z.", plate: "EP WP-4412", mechanic: "Ravi Kumar", shop: "Auto Electrician • 4.8★", service: "Battery Jumpstart", location: "Puliyanthivu Clock Tower", status: "Completed", amount: 2000, tab: "completed" },
  { id: "#RM-84915", customer: "Suresh N.", plate: "EP CAR-2309", mechanic: "Siva Auto Care", shop: "Workshop Team A", service: "Engine Overheating", location: "Bar Road, Kallady", status: "Completed", amount: 5800, tab: "completed" },
  { id: "#RM-84908", customer: "Mohan R.", plate: "EP CAK-3341", mechanic: "Needs Dispatcher", shop: "", service: "Transmission Lock", location: "Chenkalady Jn", status: "Pending Assignment", amount: 3500, tab: "dispatched" },
  { id: "#RM-84899", customer: "Arul K.", plate: "EP KD-9012", mechanic: "Eastern Tow Service", shop: "", service: "Accident Recovery", location: "Trinco Highway, Urani", status: "Cancelled by User", amount: 0, tab: "cancelled" },
];

// status: "pending" or "approved"
export const verificationQueue = [
  { id: 1, name: "Ravi Kumar", tag: "Auto Electricals", info: "Kallady Sub-hub • Experience: 6 yrs", chips: ["NIC Verified", "NVQ Level 4"], status: "pending" },
  { id: 2, name: "Batti Turbo Care", tag: "K. Selvam", info: "Puliyanthivu • Fleet Recovery Specialist", chips: ["Business Reg", "Workshop Insurance"], status: "pending" },
  { id: 3, name: "Navalady QuickFix", tag: "M. Farook", info: "Navalady Sector • Driving License & Police Clearance", chips: [], status: "approved" },
];

// ---------- Customers ----------
export const customers = [
  { id: 1, name: "Kumar Shan", plate: "EP CAB-1234", vehicle: "Toyota Aqua", phone: "+94 77 123 4567", phoneNote: "Verified Mobile", email: "kumar.r@gmail.com", area: "Kallady, Batticaloa", joined: "12 Jan 2024, 10:45 AM", requests: "6 Requests", spent: "Rs. 18,200", status: "Active" },
  { id: 2, name: "Fathima Zahra", plate: "EP BAC-8921", vehicle: "Honda Fit GP5", phone: "+94 71 884 9201", phoneNote: "Verified Mobile", email: "fathima.z@outlook.com", area: "Puliyanthivu", joined: "28 Feb 2024, 03:12 PM", requests: "3 Requests", spent: "Rs. 6,800", status: "Active" },
  { id: 3, name: "Suresh Nadarajah", plate: "EP CAD-4491", vehicle: "Suzuki Alto", phone: "+94 76 341 5529", phoneNote: "Verified Mobile", email: "suresh.n@yahoo.com", area: "Bar Road Sector", joined: "05 Mar 2024, 08:20 AM", requests: "4 Requests", spent: "Rs. 12,400", status: "Active" },
  { id: 4, name: "Thilak Mayuran", plate: "EP WP-5531", vehicle: "Bajaj RE 4S", phone: "+94 75 992 1104", phoneNote: "Verified Mobile", email: "thilak.auto@gmail.com", area: "Navalady Beach", joined: "19 Apr 2024, 06:14 PM", requests: "1 Request", spent: "Rs. 1,600", status: "Active" },
  { id: 5, name: "Mohan Rajendran", plate: "EP CAH-7701", vehicle: "Nissan Sunny", phone: "+94 77 402 8831", phoneNote: "Verified Mobile", email: "mohan.ep@gmail.com", area: "Chenkalady", joined: "02 Jun 2024, 01:55 PM", requests: "2 Requests", spent: "Rs. 7,200", status: "Active" },
  // { id: 6, name: "Arul Kumaran", plate: "EP BAP-3012", vehicle: "Fake SOS dispatch alert", phone: "+94 70 519 3342", phoneNote: "Flagged Number", email: "arul.k90@gmail.com", area: "Batticaloa Outer", joined: "15 Aug 2024 (Suspended: 22 Aug)", requests: "5 Fake Callouts", spent: "Rs. 0 (Fraud investigation)", status: "Blocked" },
  // { id: 7, name: "Vithushan Sivakumar", plate: "EP CBC-9104", vehicle: "Hilux D-Cab", phone: "+94 77 661 2230", phoneNote: "Verified Mobile", email: "vithu.siva@gmail.com", area: "Kallady Upriver", joined: "01 Sep 2024, 11:04 AM", requests: "8 Requests", spent: "Rs. 24,500", status: "Active" },
  // { id: 8, name: "Priya Selvaraj", plate: "EP BD-1189", vehicle: "Suzuki Wagon R", phone: "+94 72 310 9944", phoneNote: "Verified Mobile", email: "priya.s@gmail.com", area: "Puliyanthivu Market Rd", joined: "10 Oct 2024, 05:40 PM", requests: "2 Requests", spent: "Rs. 4,500", status: "Active" },
];

// ---------- Mechanics ----------
export const mechanics = [
  { id: 1, name: "Siva Ramanan", specialty: "NVQ-4 Auto", garage: "Siva Auto Care", phone: "+94 65 222 4190", area: "Kallady Bridge Rd", rating: "4.9", reviews: "142", jobs: "184 Jobs", earned: "Rs. 438,200 total", status: "Approved" },
  { id: 2, name: "Ravi Kumar", specialty: "Master Electric", garage: "Ravi Auto Electric", phone: "+94 77 412 8892", area: "Puliyanthivu Clock Tower", rating: "4.8", reviews: "96", jobs: "112 Jobs", earned: "Rs. 248,000 total", status: "Approved" },
  { id: 3, name: "M. Farook", specialty: "Tyre Specialist", garage: "Navalady QuickFix", phone: "+94 71 832 9001", area: "Bar Road, Navalady", rating: "4.7", reviews: "89", jobs: "78 Jobs", earned: "Rs. 165,400 total", status: "Approved" },
  { id: 4, name: "K. Selvam", specialty: "Diesel Mechanic", garage: "Batti Turbo Care", phone: "+94 65 224 8122", area: "Urani Central Junction", rating: "4.6", reviews: "54", jobs: "45 Jobs", earned: "Rs. 104,500 total", status: "Approved" },
  // { id: 5, name: "Suresh Nadarajah", specialty: "Tow Fleet Owner", garage: "Eastern Tow Service", phone: "+94 77 990 1243", area: "Puliyanthivu West", rating: "4.9", reviews: "168", jobs: "192 Jobs", earned: "Rs. 625,000 total", status: "Approved" },
  // { id: 6, name: "Thilakshan Mohan", specialty: "Two-Wheeler", garage: "Kallady Mobile Bike Rescue", phone: "+94 76 544 3210", area: "Kallady Upriver Sector", rating: "4.5", reviews: "38", jobs: "34 Jobs", earned: "Rs. 51,000 total", status: "Approved" },
  // { id: 7, name: "Arul Kumaran", specialty: "Flagged Account", garage: "Kallady Speed Motors", phone: "+94 77 110 9940", area: "Batticaloa Outer Bypass", rating: "2.8", reviews: "14 complaints", jobs: "12 Jobs", earned: "Rs. 28,000 total", status: "Blocked", note: "Repeated roadside overcharging" },
];

// ---------- Verification list ----------
export const pendingApplications = [
  { id: 1, name: "Ravi Kumar", tag: "Auto Electrical & Battery Specialist", garage: "Ravi Auto Electricals", place: "Urani Central Junction, Batticaloa", phone: "+94 77 345 8920", submitted: "Submitted Today, 08:30 AM (2 hours ago)", chips: ["NIC: 198824109281 (Sri Lanka)", "NVQ Level 4 - Auto Electrician", "Workshop Reg: BR-BT-8491"] },
  { id: 2, name: "K. Selvam", tag: "Heavy Recovery & Towing", garage: "Batti Turbo Care", place: "Main Street, Puliyanthivu, Batticaloa", phone: "+94 71 892 3411", submitted: "Submitted Yesterday, 04:15 PM", chips: ["NIC: 198210492810", "Heavy Vehicle Recovery Endorsement", "Insurance Liability Valid"] },
  { id: 3, name: "M. Farook", tag: "Engine & Transmission Mechanic", garage: "Navalady QuickFix", place: "Bar Road, Navalady, Batticaloa", phone: "+94 76 554 1290", submitted: "Submitted Yesterday, 11:20 AM", chips: ["NIC: 199148201948", "NVQ Level 3 - Motor Vehicle Craft", "Police Clearance Certificate Attached"] },
  { id: 4, name: "S. Thanabalasingam", tag: "Two-Wheeler & Light Vehicle Specialist", garage: "Singam Auto Works", place: "Chenkalady Central Bus Stand Rd", phone: "+94 77 612 9940", submitted: "2 days ago (24 Oct 2024)", chips: ["NIC: 198539201940", "NVQ Level 4 Mechanical", "Trade License Renewed 2024/25"] },
  { id: 5, name: "J. Anthony", tag: "Tire Specialist & Mobile Vulcanizing", garage: "Kallady Rapid Tire Care", place: "Near Kallady Bridge, Batticaloa", phone: "+94 75 993 4102", submitted: "3 days ago (23 Oct 2024)", chips: ["NIC: 199340192831", "Tire & Wheel Alignment Tech Cert", "Mobile Van Inspection: Passed"] },
];

// ---------- One application in detail ----------
export const application = {
  code: "VR-2024-089",
  name: "Kandasamy Thavendran",
  nic: "198824103921",
  personal: [
    ["FULL LEGAL NAME", "Kandasamy Thavendran"],
    ["MOBILE PHONE NUMBER", "+94 77 345 6789 (OTP Verified)"],
    ["EMAIL ADDRESS", "k.thavendran.auto@gmail.com"],
    ["DATE OF BIRTH & AGE", "14 Aug 1988 (Age: 36 Years)"],
    ["RESIDENTIAL ADDRESS", "42/B, Arasady Road, Kallady, Batticaloa, Eastern Province (Postal Code: 30000)"],
    ["REGISTRATION TIMESTAMP", "24 Oct 2024, 09:30 AM SLST"],
    ["EMERGENCY CONTACT", "+94 71 889 0123 (Brother: K. Sivalingam)"],
  ],
  garage: "Thaven Auto Repairs & Diagnostics",
  garageType: "Registered Sole Proprietor",
  hub: "Kallady & Bar Road Sector",
  radius: "15 km Dynamic Roadside Radius",
  workshop: "Main Street, Kallady 2nd Cross, Batticaloa",
  landmark: "Landmark: 350m south of historic Kallady Lady Manning Bridge • Direct access to Lagoon Road",
  skills: ["Tyre Puncture & Replacement", "Engine Diagnostics", "Battery Jumpstart & Inverter", "Brake Pad Servicing", "Emergency Fuel Delivery", "Towing Hookup", "Two-Wheeler / Three-Wheeler QuickFix"],
  tools: ["Hydraulic Floor Jack (3-Ton)", "OBD-II Diagnostic Scanner", "Heavy Duty Jump Starter (12V/24V)", "Tyre Bead Breaker & Inflator", "Mobile Tool Chest & Wrenches", "Safety Cones & Hazard Flares"],
  liveChecks: [
    ["Liveness detection passed (3D motion frame)", "Active"],
    ["GPS Geofence match during capture", "Kallady (EP)"],
    ["Ambient sunlight index", "Optimal (Outdoor)"],
  ],
  certificates: [
    { name: "NVQ Level 4 Automotive Mechanic", detail: "VTA Batticaloa / TVEC Sri Lanka • PDF (1.8 MB)" },
    { name: "BMC Garage Trade License 2024", detail: "Batticaloa Municipal Council • PDF (2.1 MB)" },
    { name: "Sri Lanka Driving License (Class B & C)", detail: "Valid through 2029 • JPEG (850 KB)" },
  ],
  checklist: [
    { title: "1. NIC clear & valid", text: "Verified against Sri Lanka Persons Registry format, correct 12-digit format, no signs of tampering." },
    { title: "2. Selfie matches NIC", text: "Biometric face match verified above 95% threshold. Real-time liveness confirmed without spoofing." },
    { title: "3. Certificates authentic", text: "NVQ Level 4 certificate validated with VTA Batticaloa. BMC municipal license active for 2024." },
  ],
};

// ---------- Payments ----------
export const payments = [
  { id: "#PAY-94821", job: "#RO-4102", customer: "Kumar Shan", plate: "EP CAB-1234", vehicle: "Toyota Corolla", mechanic: "Siva Auto Care", place: "Kallady Bridge Road", amount: 2500, fee: 250, method: "LankaQR Online", date: "Oct 24, 2024", time: "11:42 AM • SLST" },
  { id: "#PAY-94819", job: "#RO-4099", customer: "Fathima Zeenath", plate: "EP WP-8921", vehicle: "Suzuki WagonR", mechanic: "Navalady QuickFix", place: "Bar Road, Navalady", amount: 2000, fee: 200, method: "LankaQR Online", date: "Oct 24, 2024", time: "10:15 AM • SLST" },
  { id: "#PAY-94815", job: "#RO-4091", customer: "Suresh Nadarajah", plate: "EP DA-6701", vehicle: "Isuzu D-Max", mechanic: "Eastern Tow Service", place: "Puliyanthivu West", amount: 5800, fee: 580, method: "Visa / Mastercard", date: "Oct 23, 2024", time: "08:50 PM • SLST" },
  { id: "#PAY-94810", job: "#RO-4085", customer: "Thilak Mohan", plate: "EP BCL-3320", vehicle: "Bajaj RE Tuk", mechanic: "Ravi Auto Electric", place: "Urani Central Junction", amount: 1600, fee: 160, method: "LankaQR Web", date: "Oct 23, 2024", time: "04:12 PM • SLST" },
  { id: "#PAY-94808", job: "#RO-4078", customer: "Mohan Rasiah", plate: "EP KY-1044", vehicle: "Nissan Caravan", mechanic: "Batti Turbo Care", place: "Main Street, Batticaloa", amount: 3500, fee: 350, method: "LankaQR Online", date: "Oct 23, 2024", time: "01:30 PM • SLST" },
  { id: "#PAY-94801", job: "#RO-4069", customer: "Arul Kumarasamy", plate: "EP CAD-7719", vehicle: "Honda Vezel", mechanic: "Siva Auto Care", place: "Kallady Bridge Road", amount: 4500, fee: 450, method: "Visa Card", date: "Oct 22, 2024", time: "06:22 PM • SLST" },
  { id: "#PAY-94795", job: "#RO-4061", customer: "Priya Daniel", plate: "EP CBA-9012", vehicle: "Mitsubishi L200", mechanic: "Eastern Tow Service", place: "Puliyanthivu West", amount: 8200, fee: 820, method: "Direct Transfer", date: "Oct 22, 2024", time: "11:08 AM • SLST" },
];