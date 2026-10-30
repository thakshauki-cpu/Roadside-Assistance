// requestSampleData.js
// Sample data shared by the Tracking and Summary pages.
// Later this will come from the backend (API). For now we keep it in one place,
// so both pages show the same mechanic.

// The mechanic who accepted the request (same name/rating as MechanicFound.jsx)
export const mechanic = {
  name: "Siva Auto Care",
  owner: "Siva Vigneshwaran",
  role: "Master Technician",
  rating: 4.6,
  rescues: 142,
  unit: "Tata Ace Heavy Rescue Van",
  plate: "EP DA 5521",
  equipment: "Alternator Test & Jump Pack",
  depot: "Batticaloa Central Field Depot",
  // Placeholder phone number. Replace it with the real number later.
  phone: "+94650000000",
};

// Short text for each problem name saved by the Problem page
export const issueDetails = {
  Puncture: { title: "Tyre Puncture", work: "Mobile Jack & Bead Seal Replacement" },
  Battery: { title: "Battery Problem", work: "12V Jump Start & Terminal Check" },
  Engine: { title: "Engine Overheating", work: "Coolant & Belt Inspection" },
  "Won't Start": { title: "Vehicle Won't Start", work: "Starter & Ignition Diagnosis" },
  Fuel: { title: "Out of Fuel", work: "Emergency Fuel Delivery" },
  Accident: { title: "Accident Recovery", work: "Priority Dispatch & Safe Extraction" },
  Towing: { title: "Towing Required", work: "Flatbed Carrier Recovery" },
  Other: { title: "Other Mechanical Issue", work: "General Mechanic Inspection" },
};

// Prices used when nothing was saved by the Quotation step
export const defaultPrices = { labour: 1500, parts: 2000 };

// 3500 -> "Rs. 3,500"
export function formatRs(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-US");
}

// Current time as text, e.g. "10:32 AM". Pass minutes to add (for "estimated" times).
export function timeText(addMinutes = 0) {
  const date = new Date(Date.now() + addMinutes * 60000);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Reads the request saved by the earlier steps (or an empty object)
export function readRequest() {
  try {
    return JSON.parse(localStorage.getItem("serviceRequest")) || {};
  } catch {
    return {};
  }
}