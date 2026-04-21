const express = require("express");
const multer = require("multer");

const Restaurant = require("../models/Restaurant");
const RestaurantDocument = require("../models/RestaurantDocument");
const RestaurantInspection = require("../models/RestaurantInspection");
const RestaurantComplaint = require("../models/RestaurantComplaint");
const RestaurantAudit = require("../models/RestaurantAudit");
const { canAccessRestaurant, requireAdmin, requireDashboardUser } = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const {
  createAuditEntry,
  ensureDefaultRestaurant,
  enrichRestaurantForResponse,
  getPublicRestaurantIds,
  recalculateRestaurantSafety,
  slugify
} = require("../services/restaurantSafety.service");
const { calculateRestaurantSafety } = require("../utils/restaurantSafety");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const VERIFICATION_SECTION_IDS = [
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
const SECTION_WORKFLOW_STATUSES = ["draft", "pending", "rejected", "approved"];
const DOCUMENT_REVIEW_STATUSES = ["pending", "approved", "rejected"];

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "on";
  }
  return false;
}

function normalizeVerificationSections(states = {}) {
  return VERIFICATION_SECTION_IDS.reduce((acc, sectionId) => {
    const current = states?.[sectionId] || {};
    acc[sectionId] = {
      status: SECTION_WORKFLOW_STATUSES.includes(current.status) ? current.status : "draft",
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

function markSectionSubmitted(states = {}, sectionId) {
  const next = normalizeVerificationSections(states);
  if (!VERIFICATION_SECTION_IDS.includes(sectionId)) return next;

  const now = new Date();
  next[sectionId] = {
    ...next[sectionId],
    status: "pending",
    submittedAt: next[sectionId].submittedAt || now,
    reviewedAt: null,
    lastUpdatedAt: now,
    adminRemarks: ""
  };
  return next;
}

function applyApprovalDecisionToSections(states = {}, decision, remarks = "") {
  const next = normalizeVerificationSections(states);
  const now = new Date();

  Object.keys(next).forEach((sectionId) => {
    if (next[sectionId].status === "draft") return;
    next[sectionId] = {
      ...next[sectionId],
      status: decision === "approve" ? "approved" : "rejected",
      reviewedAt: now,
      lastUpdatedAt: now,
      adminRemarks: decision === "reject" ? remarks : ""
    };
  });

  return next;
}

function syncSectionStatusFromDocuments(states = {}, sectionId, documents = []) {
  const next = normalizeVerificationSections(states);
  if (!VERIFICATION_SECTION_IDS.includes(sectionId)) return next;

  const sectionDocs = documents.filter((doc) => doc.sectionId === sectionId && doc.isActive !== false);
  if (!sectionDocs.length) {
    next[sectionId] = {
      ...next[sectionId],
      status: "rejected",
      reviewedAt: new Date(),
      lastUpdatedAt: new Date()
    };
    return next;
  }

  const hasRejected = sectionDocs.some((doc) => doc.reviewStatus === "rejected");
  const allApproved = sectionDocs.every((doc) => doc.reviewStatus === "approved");
  const latestRemarks = sectionDocs.find((doc) => doc.reviewStatus === "rejected" && doc.adminRemarks)?.adminRemarks || "";

  next[sectionId] = {
    ...next[sectionId],
    status: hasRejected ? "rejected" : allApproved ? "approved" : "pending",
    reviewedAt: new Date(),
    lastUpdatedAt: new Date(),
    adminRemarks: hasRejected ? latestRemarks : ""
  };

  return next;
}

function computeRestaurantStatusFromSections(states = {}) {
  const normalized = normalizeVerificationSections(states);
  const values = Object.values(normalized);

  const submittedValues = values.filter((item) => item.status !== "draft");
  if (submittedValues.length && submittedValues.every((item) => item.status === "approved")) return "verified";
  if (values.some((item) => item.status === "pending" || item.status === "approved")) return "pending";
  return "pending";
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

function uploadToCloudinary(buffer, folder = "khanna-khazana/compliance") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

router.get("/", async (req, res) => {
  try {
    await ensureDefaultRestaurant();
    let filter = {};

    if (!req.auth) {
      filter = { _id: { $in: await getPublicRestaurantIds() } };
    } else if (!req.auth.isPlatformAdmin) {
      filter = { ownerClerkUserId: req.auth.clerkUserId };
    }

    const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 });
    const restaurantIds = restaurants.map((restaurant) => restaurant._id);

    const [documents, complaints] = await Promise.all([
      RestaurantDocument.aggregate([
        { $match: { restaurantId: { $in: restaurantIds }, isActive: true } },
        { $group: { _id: "$restaurantId", count: { $sum: 1 } } }
      ]),
      RestaurantComplaint.aggregate([
        {
          $match: {
            restaurantId: { $in: restaurantIds },
            status: { $in: ["open", "in_review", "reinspection_triggered"] }
          }
        },
        { $group: { _id: "$restaurantId", count: { $sum: 1 } } }
      ])
    ]);

    const documentMap = new Map(documents.map((item) => [String(item._id), item.count]));
    const complaintMap = new Map(complaints.map((item) => [String(item._id), item.count]));

    res.json(
      restaurants.map((restaurant) =>
        enrichRestaurantForResponse(restaurant, {
          documentCount: documentMap.get(String(restaurant._id)) || 0,
          openComplaintCount: complaintMap.get(String(restaurant._id)) || 0
        })
      )
    );
  } catch (err) {
    console.error("restaurants list:", err);
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!req.auth) {
      const publicRestaurantIds = await getPublicRestaurantIds();
      const isPublicRestaurant = publicRestaurantIds.some((id) => String(id) === String(restaurant._id));
      if (!isPublicRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
    }

    const isOwnerView = canAccessRestaurant(req, restaurant);

    const [documents, latestInspection, complaints] = await Promise.all([
      isOwnerView
        ? RestaurantDocument.find({ restaurantId: restaurant._id, isActive: true }).sort({ createdAt: -1 })
        : Promise.resolve([]),
      RestaurantInspection.findOne({ restaurantId: restaurant._id }).sort({ inspectedAt: -1, createdAt: -1 }),
      isOwnerView
        ? RestaurantComplaint.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).limit(25)
        : Promise.resolve([])
    ]);

    res.json({
      ...enrichRestaurantForResponse(restaurant, {
        documentCount: documents.length,
        openComplaintCount: complaints.filter(
          (item) => item.status !== "resolved" && item.status !== "rejected"
        ).length
      }),
      documents: isOwnerView ? documents.map((doc) => ({ ...doc.toObject(), id: String(doc._id) })) : [],
      latestInspection: latestInspection
        ? { ...latestInspection.toObject(), id: String(latestInspection._id) }
        : null,
      complaints: isOwnerView ? complaints.map((item) => ({ ...item.toObject(), id: String(item._id) })) : []
    });
  } catch (err) {
    console.error("restaurant get:", err);
    res.status(500).json({ message: "Failed to fetch restaurant" });
  }
});

router.post("/", requireDashboardUser, async (req, res) => {
  try {
    const {
      id,
      name,
      ownerName,
      contactNumber,
      restaurantAddress,
      description,
      location,
      gstnNumber,
      fssaiLicenseNumber,
      fssaiExpiryDate,
      staffUsesProtectiveGear,
      rawAndCookedStoredSeparately,
      temperatureMaintainedProperly,
      packagingType,
      sealedPackaging,
      lastPestControlDate,
      wasteDisposalMethod,
      waterSource,
      cleanWaterUsedForCooking,
      selfDeclarationAccepted,
      kitchenVerificationStatus,
      lastInspectionDate,
      nextInspectionDate,
      packagingStatus,
      staffHygieneStatus,
      foodHandlingStatus,
      remarksByAdmin,
      verifiedBy,
      submittedSectionId
    } = req.body;

    if (!String(name || "").trim()) {
      return res.status(400).json({ message: "Restaurant name is required" });
    }

    const existing = id ? await Restaurant.findById(id) : null;
    if (existing && !canAccessRestaurant(req, existing)) {
      return res.status(403).json({ message: "You can only update your own restaurant" });
    }

    if (!req.auth.isPlatformAdmin && !id) {
      const ownedRestaurant = await Restaurant.findOne({ ownerClerkUserId: req.auth.clerkUserId });
      if (ownedRestaurant) {
        return res.status(400).json({ message: "You already have a restaurant profile" });
      }
    }

    const previous = existing ? existing.toObject() : null;
    const staffUsesProtection = parseBoolean(staffUsesProtectiveGear);
    const storesFoodSeparately = parseBoolean(rawAndCookedStoredSeparately);
    const maintainsTemperature = parseBoolean(temperatureMaintainedProperly);
    const usesSealedPackaging = parseBoolean(sealedPackaging);
    const usesCleanWater = parseBoolean(cleanWaterUsedForCooking);
    const acceptedDeclaration = parseBoolean(selfDeclarationAccepted);

    const isPlatformAdmin = req.auth.isPlatformAdmin;
    const submittedSection = String(submittedSectionId || "").trim();
    const nextVerificationSections = applyLegalComplianceExpiry(
      submittedSection
        ? markSectionSubmitted(existing?.verificationSections, submittedSection)
        : normalizeVerificationSections(existing?.verificationSections),
      fssaiExpiryDate
    );
    const payload = {
      name: String(name).trim(),
      slug: slugify(name),
      ownerName: String(ownerName || "").trim(),
      contactNumber: String(contactNumber || "").trim(),
      restaurantAddress: String(restaurantAddress || location || "").trim(),
      description: String(description || "").trim(),
      location: String(restaurantAddress || location || "").trim(),
      gstnNumber: String(gstnNumber || "").trim(),
      fssaiLicenseNumber: String(fssaiLicenseNumber || "").trim(),
      fssaiExpiryDate: fssaiExpiryDate || null,
      staffUsesProtectiveGear: staffUsesProtection,
      rawAndCookedStoredSeparately: storesFoodSeparately,
      temperatureMaintainedProperly: maintainsTemperature,
      packagingType: String(packagingType || "").trim(),
      sealedPackaging: usesSealedPackaging,
      lastPestControlDate: lastPestControlDate || null,
      wasteDisposalMethod: String(wasteDisposalMethod || "").trim(),
      waterSource: ["RO", "Filtered", "Municipal"].includes(waterSource) ? waterSource : "",
      cleanWaterUsedForCooking: usesCleanWater,
      selfDeclarationAccepted: acceptedDeclaration,
      kitchenVerificationStatus: isPlatformAdmin
        ? kitchenVerificationStatus || computeRestaurantStatusFromSections(nextVerificationSections)
        : computeRestaurantStatusFromSections(nextVerificationSections),
      lastInspectionDate: lastInspectionDate || null,
      nextInspectionDate: nextInspectionDate || null,
      packagingStatus:
        packagingStatus || (usesSealedPackaging ? "good" : "poor"),
      staffHygieneStatus:
        staffHygieneStatus || (staffUsesProtection ? "good" : "poor"),
      foodHandlingStatus:
        foodHandlingStatus || (storesFoodSeparately && maintainsTemperature ? "good" : "poor"),
      remarksByAdmin: String(remarksByAdmin || "").trim(),
      verifiedBy: String(verifiedBy || "admin").trim(),
      verificationSections: nextVerificationSections,
      ownerClerkUserId: req.auth.isPlatformAdmin
        ? existing?.ownerClerkUserId || ""
        : req.auth.clerkUserId,
      ownerEmail: req.auth.isPlatformAdmin ? existing?.ownerEmail || "" : req.auth.email || "",
      ownerDisplayName: req.auth.isPlatformAdmin
        ? existing?.ownerDisplayName || ""
        : String(ownerName || req.body.ownerDisplayName || req.auth.email || "Restaurant Owner").trim()
    };

    if (!isPlatformAdmin) {
      payload.hygieneScore = 0;
      payload.scoreBand = "poor";
      payload.lastVerifiedDate = null;
      payload.verifiedBy = "";
    }

    const restaurant = existing
      ? await Restaurant.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      : await Restaurant.create(payload);

    await createAuditEntry({
      restaurantId: restaurant._id,
      actionType: "profile_updated",
      changedBy: payload.verifiedBy || "admin",
      previousScore: previous?.hygieneScore ?? null,
      newScore: restaurant.hygieneScore ?? null,
      previousRemarks: previous?.remarksByAdmin || "",
      newRemarks: restaurant.remarksByAdmin || "",
      previousStatus: previous?.kitchenVerificationStatus || "",
      newStatus: restaurant.kitchenVerificationStatus || "",
      metadata: { profileFieldsUpdated: Object.keys(payload) }
    });

    if (isPlatformAdmin) {
      const refreshed = await recalculateRestaurantSafety(restaurant._id, {
        changedBy: payload.verifiedBy || "admin",
        reason: "profile_saved",
        previousRemarks: previous?.remarksByAdmin || ""
      });

      return res.status(existing ? 200 : 201).json(enrichRestaurantForResponse(refreshed.restaurant));
    }

    res.status(existing ? 200 : 201).json(enrichRestaurantForResponse(restaurant));
  } catch (err) {
    console.error("restaurant save:", err);
    res.status(500).json({ message: "Failed to save restaurant" });
  }
});

router.post("/:id/documents", requireDashboardUser, upload.single("file"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!canAccessRestaurant(req, restaurant)) {
      return res.status(403).json({ message: "You can only upload documents for your own restaurant" });
    }
    if (!req.file) return res.status(400).json({ message: "Document file is required" });

    const type = String(req.body.type || "").trim();
    if (!type) return res.status(400).json({ message: "Document type is required" });

    const uploaded = await uploadToCloudinary(req.file.buffer);

    await RestaurantDocument.updateMany(
      {
        restaurantId: restaurant._id,
        type,
        isActive: true
      },
      { $set: { isActive: false } }
    );

    const document = await RestaurantDocument.create({
      restaurantId: restaurant._id,
      type,
      sectionId: String(req.body.sectionId || "").trim(),
      label: String(req.body.label || req.file.originalname || type).trim(),
      fileUrl: uploaded.secure_url,
      filePublicId: uploaded.public_id,
      mimeType: req.file.mimetype,
      uploadedBy: String(req.body.uploadedBy || "admin").trim(),
      reviewStatus: "pending",
      reviewedAt: null,
      reviewedBy: "",
      adminRemarks: ""
    });

    const previousScore = restaurant.hygieneScore;
    const previousStatus = restaurant.kitchenVerificationStatus || "";

    if (!req.auth.isPlatformAdmin) {
      restaurant.kitchenVerificationStatus = "pending";
      restaurant.hygieneScore = 0;
      restaurant.scoreBand = "poor";
      restaurant.lastVerifiedDate = null;
      await restaurant.save();
    }

    await createAuditEntry({
      restaurantId: restaurant._id,
      actionType: "document_uploaded",
      changedBy: document.uploadedBy,
      previousScore,
      newScore: restaurant.hygieneScore,
      previousRemarks: restaurant.remarksByAdmin || "",
      newRemarks: restaurant.remarksByAdmin || "",
      previousStatus,
      newStatus: restaurant.kitchenVerificationStatus || "",
      metadata: { documentType: type, documentId: String(document._id) }
    });

    if (req.auth.isPlatformAdmin) {
      await recalculateRestaurantSafety(restaurant._id, {
        changedBy: document.uploadedBy,
        reason: "document_uploaded"
      });
    }

    res.status(201).json({ ...document.toObject(), id: String(document._id) });
  } catch (err) {
    console.error("document upload:", err);
    res.status(500).json({ message: "Failed to upload document" });
  }
});

router.patch("/:id/documents/:documentId/review", requireAdmin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const document = await RestaurantDocument.findOne({
      _id: req.params.documentId,
      restaurantId: req.params.id,
      isActive: true
    });
    if (!document) return res.status(404).json({ message: "Document not found" });

    const decision = String(req.body.decision || "").trim().toLowerCase();
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "decision must be approve or reject" });
    }

    const reviewer = String(req.body.reviewedBy || "platform_admin").trim();
    const remarks = String(req.body.adminRemarks || "").trim();
    const previousStatus = document.reviewStatus || "pending";

    document.reviewStatus = decision === "approve" ? "approved" : "rejected";
    document.reviewedAt = new Date();
    document.reviewedBy = reviewer;
    document.adminRemarks = decision === "reject" ? remarks : "";
    document.isActive = decision === "approve";
    await document.save();

    const activeDocuments = await RestaurantDocument.find({
      restaurantId: restaurant._id,
      isActive: true
    }).sort({ createdAt: -1 });

    restaurant.verificationSections = syncSectionStatusFromDocuments(
      restaurant.verificationSections,
      document.sectionId,
      activeDocuments
    );

    if (decision === "reject") {
      restaurant.verificationSections = {
        ...restaurant.verificationSections,
        [document.sectionId]: {
          ...(restaurant.verificationSections?.[document.sectionId] || {}),
          status: "rejected",
          reviewedAt: new Date(),
          lastUpdatedAt: new Date(),
          adminRemarks: remarks
        }
      };
    }

    if (decision === "reject") {
      restaurant.kitchenVerificationStatus = "rejected";
      restaurant.remarksByAdmin = remarks || restaurant.remarksByAdmin || "";
      restaurant.hygieneScore = 0;
      restaurant.scoreBand = "poor";
      restaurant.lastVerifiedDate = null;
    } else {
      const hasAnyRejected = activeDocuments.some((item) => item.reviewStatus === "rejected");
      const hasPendingDocs = activeDocuments.some((item) => item.reviewStatus !== "approved");
      if (hasAnyRejected) {
        restaurant.kitchenVerificationStatus = "rejected";
      } else if (hasPendingDocs) {
        restaurant.kitchenVerificationStatus = "pending";
      }
    }

    await restaurant.save();

    await createAuditEntry({
      restaurantId: restaurant._id,
      actionType: "approval_reviewed",
      changedBy: reviewer,
      previousScore: restaurant.hygieneScore ?? null,
      newScore: restaurant.hygieneScore ?? null,
      previousRemarks: "",
      newRemarks: restaurant.remarksByAdmin || "",
      previousStatus,
      newStatus: document.reviewStatus,
      metadata: {
        decision,
        documentId: String(document._id),
        documentType: document.type,
        sectionId: document.sectionId
      }
    });

    res.json({
      document: { ...document.toObject(), id: String(document._id) },
      restaurant: enrichRestaurantForResponse(restaurant)
    });
  } catch (err) {
    console.error("document review:", err);
    res.status(500).json({ message: "Failed to review document" });
  }
});

router.patch("/:id/sections/:sectionId/review", requireAdmin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const sectionId = String(req.params.sectionId || "").trim();
    if (!VERIFICATION_SECTION_IDS.includes(sectionId)) {
      return res.status(400).json({ message: "Invalid section id" });
    }

    const decision = String(req.body.decision || "").trim().toLowerCase();
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "decision must be approve or reject" });
    }

    const reviewer = String(req.body.reviewedBy || "platform_admin").trim();
    const remarks = String(req.body.adminRemarks || "").trim();
    const sectionStates = normalizeVerificationSections(restaurant.verificationSections);
    const previousStatus = sectionStates[sectionId]?.status || "draft";
    const now = new Date();

    sectionStates[sectionId] = {
      ...sectionStates[sectionId],
      status: decision === "approve" ? "approved" : "rejected",
      reviewedAt: now,
      lastUpdatedAt: now,
      adminRemarks: decision === "reject" ? remarks : ""
    };

    const activeSectionDocuments = await RestaurantDocument.find({
      restaurantId: restaurant._id,
      sectionId,
      isActive: true
    }).sort({ createdAt: -1 });

    if (activeSectionDocuments.length) {
      for (const document of activeSectionDocuments) {
        document.reviewStatus = decision === "approve" ? "approved" : "rejected";
        document.reviewedAt = now;
        document.reviewedBy = reviewer;
        document.adminRemarks = decision === "reject" ? remarks : "";
        if (decision === "reject") document.isActive = false;
        await document.save();
      }
    }

    restaurant.verificationSections = sectionStates;
    restaurant.remarksByAdmin = decision === "reject" ? remarks || restaurant.remarksByAdmin || "" : restaurant.remarksByAdmin || "";
    restaurant.kitchenVerificationStatus = computeRestaurantStatusFromSections(sectionStates);

    if (restaurant.kitchenVerificationStatus === "verified") {
      restaurant.verifiedBy = reviewer;
      await restaurant.save();
      const refreshed = await recalculateRestaurantSafety(restaurant._id, {
        changedBy: reviewer,
        reason: "section_approved",
        previousRemarks: restaurant.remarksByAdmin || ""
      });
      return res.json({
        restaurant: enrichRestaurantForResponse(refreshed.restaurant),
        section: {
          id: sectionId,
          status: sectionStates[sectionId].status,
          adminRemarks: sectionStates[sectionId].adminRemarks
        }
      });
    }

    if (decision === "reject") {
      restaurant.hygieneScore = 0;
      restaurant.scoreBand = "poor";
      restaurant.lastVerifiedDate = null;
    }

    await restaurant.save();

    await createAuditEntry({
      restaurantId: restaurant._id,
      actionType: "approval_reviewed",
      changedBy: reviewer,
      previousScore: restaurant.hygieneScore ?? null,
      newScore: restaurant.hygieneScore ?? null,
      previousRemarks: "",
      newRemarks: restaurant.remarksByAdmin || "",
      previousStatus,
      newStatus: sectionStates[sectionId].status,
      metadata: { sectionId, decision }
    });

    res.json({
      restaurant: enrichRestaurantForResponse(restaurant),
      section: {
        id: sectionId,
        status: sectionStates[sectionId].status,
        adminRemarks: sectionStates[sectionId].adminRemarks
      }
    });
  } catch (err) {
    console.error("section review:", err);
    res.status(500).json({ message: "Failed to review section" });
  }
});

router.post("/:id/approval", requireAdmin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const decision = String(req.body.decision || "").trim().toLowerCase();
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "decision must be approve or reject" });
    }

    const reviewer = String(req.body.verifiedBy || "platform_admin").trim();
    const remarks = String(req.body.remarksByAdmin || "").trim();
    const previousScore = restaurant.hygieneScore ?? null;
    const previousStatus = restaurant.kitchenVerificationStatus || "";

    restaurant.remarksByAdmin = remarks;
    restaurant.verifiedBy = reviewer;
    restaurant.verificationSections = applyApprovalDecisionToSections(
      restaurant.verificationSections,
      decision,
      remarks
    );

    if (decision === "approve") {
      restaurant.kitchenVerificationStatus = "verified";
      await restaurant.save();

      const refreshed = await recalculateRestaurantSafety(restaurant._id, {
        changedBy: reviewer,
        reason: "admin_approval",
        previousRemarks: restaurant.remarksByAdmin || ""
      });

      await createAuditEntry({
        restaurantId: restaurant._id,
        actionType: "approval_reviewed",
        changedBy: reviewer,
        previousScore,
        newScore: refreshed.restaurant.hygieneScore ?? null,
        previousRemarks: "",
        newRemarks: refreshed.restaurant.remarksByAdmin || "",
        previousStatus,
        newStatus: refreshed.restaurant.kitchenVerificationStatus || "",
        metadata: { decision: "approved" }
      });

      return res.json({
        restaurant: enrichRestaurantForResponse(refreshed.restaurant),
        safety: refreshed.safety
      });
    }

    restaurant.kitchenVerificationStatus = "rejected";
    restaurant.hygieneScore = 0;
    restaurant.scoreBand = "poor";
    restaurant.lastVerifiedDate = null;
    await restaurant.save();

    await createAuditEntry({
      restaurantId: restaurant._id,
      actionType: "approval_reviewed",
      changedBy: reviewer,
      previousScore,
      newScore: restaurant.hygieneScore ?? null,
      previousRemarks: "",
      newRemarks: restaurant.remarksByAdmin || "",
      previousStatus,
      newStatus: restaurant.kitchenVerificationStatus || "",
      metadata: { decision: "rejected" }
    });

    res.json({
      restaurant: enrichRestaurantForResponse(restaurant),
      safety: null
    });
  } catch (err) {
    console.error("restaurant approval:", err);
    res.status(500).json({ message: "Failed to review restaurant approval" });
  }
});

router.post("/:id/inspections", requireDashboardUser, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!canAccessRestaurant(req, restaurant)) {
      return res.status(403).json({ message: "You can only inspect your own restaurant" });
    }

    const [documents, complaints] = await Promise.all([
      RestaurantDocument.find({ restaurantId: restaurant._id, isActive: true }).sort({ createdAt: -1 }),
      RestaurantComplaint.find({
        restaurantId: restaurant._id,
        createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) }
      }).sort({ createdAt: -1 })
    ]);

    const inspectionPayload = {
      checklist: {
        kitchenClean: req.body.kitchenClean || "fail",
        cookingAreaClean: req.body.cookingAreaClean || "fail",
        storageProper: req.body.storageProper || "fail",
        staffWearingGlovesCaps: req.body.staffWearingGlovesCaps || "fail",
        wasteDisposalProper: req.body.wasteDisposalProper || "fail",
        packagingAreaHygienic: req.body.packagingAreaHygienic || "fail",
        refrigerationProper: req.body.refrigerationProper || "fail"
      },
      notes: String(req.body.notes || "").trim(),
      statusAfterInspection: req.body.statusAfterInspection || "pending",
      inspectedBy: String(req.body.inspectedBy || "admin").trim(),
      nextInspectionDate: req.body.nextInspectionDate || null
    };

    const safety = calculateRestaurantSafety({
      restaurant: {
        ...restaurant.toObject(),
        kitchenVerificationStatus: inspectionPayload.statusAfterInspection
      },
      inspection: { checklist: inspectionPayload.checklist },
      documents,
      complaints
    });

    const inspection = await RestaurantInspection.create({
      restaurantId: restaurant._id,
      ...inspectionPayload,
      calculatedScore: safety.totalScore,
      scoreBreakdown: {
        checklistScore: safety.checklistScore,
        documentScore: safety.documentScore,
        operationalScore: safety.operationalScore,
        complaintScore: safety.complaintScore
      }
    });

    const previousScore = restaurant.hygieneScore;
    const previousStatus = restaurant.kitchenVerificationStatus;

    restaurant.kitchenVerificationStatus = inspectionPayload.statusAfterInspection;
    restaurant.lastInspectionDate = inspection.inspectedAt;
    restaurant.nextInspectionDate = inspection.nextInspectionDate;
    restaurant.hygieneScore = safety.totalScore;
    restaurant.scoreBand = safety.scoreBand;
    if (inspectionPayload.statusAfterInspection === "verified") {
      restaurant.lastVerifiedDate = inspection.inspectedAt;
      restaurant.verifiedBy = inspectionPayload.inspectedBy;
    }
    await restaurant.save();

    await createAuditEntry({
      restaurantId: restaurant._id,
      actionType: "inspection_submitted",
      changedBy: inspectionPayload.inspectedBy,
      previousScore,
      newScore: safety.totalScore,
      previousRemarks: restaurant.remarksByAdmin || "",
      newRemarks: restaurant.remarksByAdmin || "",
      previousStatus,
      newStatus: restaurant.kitchenVerificationStatus,
      metadata: { inspectionId: String(inspection._id), scoreBreakdown: safety }
    });

    res.status(201).json({
      ...inspection.toObject(),
      id: String(inspection._id),
      safety
    });
  } catch (err) {
    console.error("inspection submit:", err);
    res.status(500).json({ message: "Failed to submit inspection" });
  }
});

router.get("/:id/audit-history", requireDashboardUser, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!canAccessRestaurant(req, restaurant)) {
      return res.status(403).json({ message: "You can only view your own audit history" });
    }
    const history = await RestaurantAudit.find({ restaurantId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(history.map((item) => ({ ...item.toObject(), id: String(item._id) })));
  } catch (err) {
    console.error("audit history:", err);
    res.status(500).json({ message: "Failed to fetch audit history" });
  }
});

router.get("/:id/documents", requireDashboardUser, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!canAccessRestaurant(req, restaurant)) {
      return res.status(403).json({ message: "You can only view your own documents" });
    }
    const documents = await RestaurantDocument.find({ restaurantId: req.params.id }).sort({ createdAt: -1 });
    res.json(documents.map((doc) => ({ ...doc.toObject(), id: String(doc._id) })));
  } catch (err) {
    console.error("documents list:", err);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

module.exports = router;
