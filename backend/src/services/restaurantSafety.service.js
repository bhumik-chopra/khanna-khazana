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

  if (restaurant.fssaiExpiryDate && new Date(restaurant.fssaiExpiryDate) < new Date()) {
    restaurant.kitchenVerificationStatus = "expired";
  } else if (restaurant.kitchenVerificationStatus === "verified" && safety.totalScore < 80) {
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

  return {
    ...json,
    id: String(json._id || json.id),
    documentCount: extras.documentCount ?? json.documentCount ?? 0,
    openComplaintCount: extras.openComplaintCount ?? json.openComplaintCount ?? 0,
    badges: {
      verifiedKitchen: json.kitchenVerificationStatus === "verified",
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
