export const mockMechanics = [
  {
    id: "mechanic-siva",
    name: "Siva Auto Care",
    owner: "Siva Vigneshwaran",
    role: "Master Technician",
    latitude: 7.7220,
    longitude: 81.7000,
    rating: 4.6,
    reviews: 142,
    rescues: 142,
    address: "Kallady Beach Road, Batticaloa",
    unit: "Tata Ace Heavy Rescue Van",
    plate: "EP DA 5521",
    equipment: "Alternator Test & Jump Pack",
    phone: "+94650000000",
    depot: "Batticaloa Central Field Depot",
    verified: true,
    phoneVerified: true,
    policeCleared: true,
    experienceYears: 12,
    specialties: [
      "Emergency Tyre & Brake Specialist",
      "Mobile 150 PSI Air Compressor",
      "3-Ton Rapid Hydraulic Jacks",
      "12V/24V Heavy Duty Jump Starters",
    ],
    available: true,
  },
  {
    id: "mechanic-kumaran",
    name: "Kumaran Motor Works",
    owner: "Kumaran Rajan",
    role: "Roadside Technician",
    latitude: 7.7150,
    longitude: 81.6850,
    rating: 4.8,
    reviews: 96,
    rescues: 96,
    address: "Bar Road, Batticaloa",
    unit: "Toyota TownAce Service Van",
    plate: "EP BA 4410",
    equipment: "Portable Diagnostic Scanner",
    phone: "+94650000001",
    depot: "Batticaloa North Service Point",
    verified: true,
    phoneVerified: true,
    policeCleared: true,
    experienceYears: 9,
    specialties: ["Engine Diagnostics", "Battery Jumpstart", "General Repair"],
    available: true,
  },
  {
    id: "mechanic-fathima",
    name: "Fathima Auto Assist",
    owner: "Fathima Naleem",
    role: "Mobile Mechanic",
    latitude: 7.7300,
    longitude: 81.6905,
    rating: 4.7,
    reviews: 81,
    rescues: 81,
    address: "New Kalmunai Road, Batticaloa",
    unit: "Mahindra Bolero Rescue Unit",
    plate: "EP CA 2190",
    equipment: "Heavy-Duty Tow and Recovery Kit",
    phone: "+94650000002",
    depot: "Batticaloa South Service Point",
    verified: true,
    phoneVerified: true,
    policeCleared: true,
    experienceYears: 8,
    specialties: ["Towing", "Fuel Delivery", "Accident Recovery"],
    available: true,
  },
];

export const mockQuotation = {
  mechanicId: "mechanic-siva",
  labour: 1500,
  parts: 2000,
  additionalCharges: 0,
  total: 3500,
  estimatedServiceMinutes: 45,
  quotationHoldSeconds: 286,
  labourDescription:
    "Diagnostic inspection, rapid dispatch and on-site repair labour",
  partsDescription: "Repair parts and consumables",
};

export const mockTracking = {
  startingLocation: "Batticaloa Central Field Depot",
  distanceRemainingKm: 2.1,
  etaMinutes: 10,
  speedKmh: 34,
  traffic: "Light Flow",
  routeDescription: "Heading South on A15 via Kallady Causeway",
  vanPosition: { x: 38, y: 55 },
  breakdownPosition: { x: 71.5, y: 33.5 },
  roadPath: { start: { x: 24, y: 80 }, end: { x: 85, y: 22 } },
};

export const mockWorkByProblem = {
  Puncture: {
    title: "Tyre Puncture",
    work: "Mobile Jack & Bead Seal Replacement",
  },
  Battery: {
    title: "Battery Problem",
    work: "12V Jump Start & Terminal Check",
  },
  Engine: {
    title: "Engine Overheating",
    work: "Coolant & Belt Inspection",
  },
  "Won't Start": {
    title: "Vehicle Won't Start",
    work: "Starter & Ignition Diagnosis",
  },
  Fuel: {
    title: "Out of Fuel",
    work: "Emergency Fuel Delivery",
  },
  Accident: {
    title: "Accident Recovery",
    work: "Priority Dispatch & Safe Extraction",
  },
  Towing: {
    title: "Towing Required",
    work: "Flatbed Carrier Recovery",
  },
  Other: {
    title: "Other Mechanical Issue",
    work: "General Mechanic Inspection",
  },
};

// Workflow choices and payment confirmations intentionally remain in memory.
export const mockWorkflowState = new Map();
