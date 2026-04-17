const CHECKLIST_WEIGHTS = {
  kitchenClean: 10,
  cookingAreaClean: 8,
  storageProper: 8,
  staffWearingGlovesCaps: 7,
  wasteDisposalProper: 6,
  packagingAreaHygienic: 5,
  refrigerationProper: 6
};

const DOCUMENT_WEIGHTS = {
  fssai_certificate: 8,
  kitchen_cooking_area_photo: 2,
  kitchen_preparation_area_photo: 2,
  kitchen_storage_area_photo: 2,
  kitchen_utensils_cleaning_area_photo: 2,
  storage_fridge_photo: 2,
  packaging_photo: 2,
  pest_control_proof: 2,
  staff_hygiene_photo: 1,
  inspection_report: 3,
  staff_hygiene_proof: 2,
  kitchen_photo: 1,
  compliance_document: 4
};

const STATUS_TO_MULTIPLIER = {
  pass: 1,
  partial: 0.5,
  fail: 0
};

const QUALITY_TO_POINTS = {
  good: 1,
  average: 0.5,
  poor: 0,
  unchecked: 0
};

function normalizeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeChecklistScore(checklist = {}) {
  return Object.entries(CHECKLIST_WEIGHTS).reduce((sum, [key, weight]) => {
    const state = STATUS_TO_MULTIPLIER[checklist[key]] ?? 0;
    return sum + weight * state;
  }, 0);
}

function computeDocumentScore(documents = [], fssaiExpiryDate) {
  const activeTypes = new Set(
    documents.filter((doc) => doc && doc.isActive !== false).map((doc) => doc.type)
  );

  let score = 0;

  Object.entries(DOCUMENT_WEIGHTS).forEach(([type, weight]) => {
    if (activeTypes.has(type)) score += weight;
  });

  const expiryDate = normalizeDate(fssaiExpiryDate);
  if (activeTypes.has("fssai_certificate") && expiryDate && expiryDate >= new Date()) {
    score += 4;
  }

  return Math.min(20, score);
}

function computeOperationalScore(restaurant = {}) {
  const profileScore =
    (restaurant.staffUsesProtectiveGear ? 1 : QUALITY_TO_POINTS[restaurant.staffHygieneStatus || "unchecked"]) * 5 +
    (restaurant.rawAndCookedStoredSeparately ? 1 : 0) * 4 +
    (restaurant.temperatureMaintainedProperly ? 1 : QUALITY_TO_POINTS[restaurant.foodHandlingStatus || "unchecked"]) * 4 +
    (restaurant.sealedPackaging ? 1 : QUALITY_TO_POINTS[restaurant.packagingStatus || "unchecked"]) * 3 +
    (restaurant.cleanWaterUsedForCooking ? 1 : 0) * 2;

  const verificationBonus = restaurant.kitchenVerificationStatus === "verified" ? 6 : 0;

  return Math.min(20, profileScore + verificationBonus);
}

function computeComplaintScore(complaints = []) {
  let score = 10;

  complaints.forEach((complaint) => {
    if (!complaint) return;
    if (complaint.status === "resolved" || complaint.status === "rejected") return;
    if (complaint.complaintType === "suspicious_food_safety") {
      score -= 5;
      return;
    }
    score -= 2;
  });

  return Math.max(0, score);
}

function deriveScoreBand(score) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "needs_improvement";
  return "poor";
}

function calculateRestaurantSafety({ restaurant, inspection, documents, complaints }) {
  const checklistScore = computeChecklistScore(inspection?.checklist || {});
  const documentScore = computeDocumentScore(documents, restaurant?.fssaiExpiryDate);
  const operationalScore = computeOperationalScore(restaurant);
  const complaintScore = computeComplaintScore(complaints);
  const totalScore = Math.round(
    Math.min(100, checklistScore + documentScore + operationalScore + complaintScore)
  );

  return {
    checklistScore,
    documentScore,
    operationalScore,
    complaintScore,
    totalScore,
    scoreBand: deriveScoreBand(totalScore)
  };
}

module.exports = {
  CHECKLIST_WEIGHTS,
  calculateRestaurantSafety,
  normalizeDate
};
