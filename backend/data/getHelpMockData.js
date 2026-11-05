export const mockQuotation = {
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
