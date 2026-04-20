const Restaurant = require("../models/Restaurant");
const RestaurantDocument = require("../models/RestaurantDocument");
const RestaurantInspection = require("../models/RestaurantInspection");
const RestaurantComplaint = require("../models/RestaurantComplaint");
const RestaurantAudit = require("../models/RestaurantAudit");
const Dish = require("../models/Dish");
const { calculateRestaurantSafety } = require("../utils/restaurantSafety");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeVerificationSections(states = {}) {
  const sectionIds = [
    "basic_business",
    "legal_compliance",
    "kitchen_proof",
    "staff_hygiene",
    "food_handling",
    "packaging_safety",
    "pest_control",
    "water_safety",
    "self_declaration"
  ];

  return sectionIds.reduce((acc, sectionId) => {
    const current = states?.[sectionId] || {};
    acc[sectionId] = {
      status: ["draft", "pending", "rejected", "approved"].includes(current.status) ? current.status : "draft",
      submittedAt: current.submittedAt || null,
      reviewedAt: current.reviewedAt || null,
      lastUpdatedAt: current.lastUpdatedAt || null,
      adminRemarks: current.adminRemarks || ""
    };
    return acc;
  }, {});
}

function isPastDate(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date < new Date();
}

function applyLegalComplianceExpiry(states = {}, fssaiExpiryDate) {
  const next = normalizeVerificationSections(states);

  if (isPastDate(fssaiExpiryDate)) {
    next.legal_compliance = {
      ...next.legal_compliance,
      status: "rejected",
      reviewedAt: new Date(),
      lastUpdatedAt: new Date(),
      adminRemarks: "FSSAI expiry date has passed. Update the legal/FSSAI heading."
    };
    return next;
  }

  if (next.legal_compliance.status === "rejected" && String(next.legal_compliance.adminRemarks || "").includes("FSSAI expiry date has passed")) {
    next.legal_compliance = {
      ...next.legal_compliance,
      status: next.legal_compliance.submittedAt ? "pending" : "draft",
      reviewedAt: null,
      lastUpdatedAt: new Date(),
      adminRemarks: ""
    };
  }

  return next;
}

function computeRestaurantStatusFromSections(states = {}) {
  const normalized = normalizeVerificationSections(states);
  const values = Object.values(normalized);
  const submittedValues = values.filter((item) => item.status !== "draft");

  if (submittedValues.length && submittedValues.every((item) => item.status === "approved")) return "verified";
  return "pending";
}

async function createAuditEntry({
  restaurantId,
  actionType,
  changedBy = "admin",
  previousScore = null,
  newScore = null,
  previousRemarks = "",
  newRemarks = "",
  previousStatus = "",
  newStatus = "",
  metadata = {}
}) {
  return RestaurantAudit.create({
    restaurantId,
    actionType,
    changedBy,
    previousScore,
    newScore,
    previousRemarks,
    newRemarks,
    previousStatus,
    newStatus,
    metadata
  });
}

async function ensureDefaultRestaurant() {
  let restaurant = await Restaurant.findOne().sort({ createdAt: 1 });

  if (!restaurant) {
    restaurant = await Restaurant.create({
      name: "Khanna Khazana Signature Kitchen",
      slug: "khanna-khazana-signature-kitchen",
      description: "The default restaurant used by the live storefront.",
      location: "Main service zone",
      kitchenVerificationStatus: "pending",
      packagingStatus: "unchecked",
      staffHygieneStatus: "unchecked",
      foodHandlingStatus: "unchecked"
    });
  }

  await Dish.updateMany(
    { $or: [{ restaurantId: { $exists: false } }, { restaurantId: null }] },
    { $set: { restaurantId: restaurant._id } }
  );

  return restaurant;
}

async function recalculateRestaurantSafety(restaurantId, metadata = {}) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return null;

  const [documents, inspection, complaints] = await Promise.all([
    RestaurantDocument.find({ restaurantId, isActive: true }).sort({ createdAt: -1 }),
    RestaurantInspection.findOne({ restaurantId }).sort({ inspectedAt: -1, createdAt: -1 }),
    RestaurantComplaint.find({
      restaurantId,
      createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) }
    }).sort({ createdAt: -1 })
  ]);

  const safety = calculateRestaurantSafety({
    restaurant,
    inspection,
    documents,
    complaints
  });

  const previousScore = restaurant.hygieneScore ?? null;
  const previousStatus = restaurant.kitchenVerificationStatus || "";

  restaurant.hygieneScore = safety.totalScore;
  restaurant.scoreBand = safety.scoreBand;
  restaurant.verificationSections = applyLegalComplianceExpiry(
    restaurant.verificationSections,
    restaurant.fssaiExpiryDate
  );
  restaurant.kitchenVerificationStatus = computeRestaurantStatusFromSections(
    restaurant.verificationSections
  );

  if (restaurant.kitchenVerificationStatus === "verified" && safety.totalScore < 80) {
    restaurant.kitchenVerificationStatus = "needs_reinspection";
  }

  if (inspection?.inspectedAt) restaurant.lastInspectionDate = inspection.inspectedAt;
  if (inspection?.nextInspectionDate) restaurant.nextInspectionDate = inspection.nextInspectionDate;
  if (restaurant.kitchenVerificationStatus === "verified") {
    restaurant.lastVerifiedDate = new Date();
  }

  await restaurant.save();

  await createAuditEntry({
    restaurantId,
    actionType: "score_recalculated",
    changedBy: metadata.changedBy || "system",
    previousScore,
    newScore: safety.totalScore,
    previousRemarks: metadata.previousRemarks || restaurant.remarksByAdmin || "",
    newRemarks: restaurant.remarksByAdmin || "",
    previousStatus,
    newStatus: restaurant.kitchenVerificationStatus,
    metadata: {
      reason: metadata.reason || "automatic_recalculation",
      scoreBreakdown: safety
    }
  });

  return {
    restaurant,
    safety,
    inspection,
    documents,
    complaints
  };
}

function enrichRestaurantForResponse(restaurant, extras = {}) {
  if (!restaurant) return null;

  const json = restaurant.toObject ? restaurant.toObject() : { ...restaurant };
  const displayStatus = json.kitchenVerificationStatus === "expired" ? "pending" : json.kitchenVerificationStatus;

  return {
    ...json,
    kitchenVerificationStatus: displayStatus,
    id: String(json._id || json.id),
    documentCount: extras.documentCount ?? json.documentCount ?? 0,
    openComplaintCount: extras.openComplaintCount ?? json.openComplaintCount ?? 0,
    badges: {
      verifiedKitchen: displayStatus === "verified",
      hygieneChecked: Boolean(json.lastInspectionDate),
      recentlyAudited: Boolean(
        json.lastInspectionDate &&
          new Date(json.lastInspectionDate) >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
      ),
      safePackaging: json.packagingStatus === "good"
    }
  };
}

module.exports = {
  createAuditEntry,
  ensureDefaultRestaurant,
  enrichRestaurantForResponse,
  recalculateRestaurantSafety,
  slugify
};
