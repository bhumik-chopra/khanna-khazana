const express = require("express");
const multer = require("multer");

const Restaurant = require("../models/Restaurant");
const RestaurantDocument = require("../models/RestaurantDocument");
const RestaurantInspection = require("../models/RestaurantInspection");
const RestaurantComplaint = require("../models/RestaurantComplaint");
const RestaurantAudit = require("../models/RestaurantAudit");
const { canAccessRestaurant, requireDashboardUser } = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const {
  createAuditEntry,
  ensureDefaultRestaurant,
  enrichRestaurantForResponse,
  recalculateRestaurantSafety,
  slugify
} = require("../services/restaurantSafety.service");
const { calculateRestaurantSafety } = require("../utils/restaurantSafety");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
    const filter =
      req.auth?.isPlatformAdmin || !req.auth
        ? {}
        : { ownerClerkUserId: req.auth.clerkUserId };

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
      description,
      location,
      gstnNumber,
      fssaiLicenseNumber,
      fssaiExpiryDate,
      kitchenVerificationStatus,
      lastInspectionDate,
      nextInspectionDate,
      packagingStatus,
      staffHygieneStatus,
      foodHandlingStatus,
      remarksByAdmin,
      verifiedBy
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

    const payload = {
      name: String(name).trim(),
      slug: slugify(name),
      description: String(description || "").trim(),
      location: String(location || "").trim(),
      gstnNumber: String(gstnNumber || "").trim(),
      fssaiLicenseNumber: String(fssaiLicenseNumber || "").trim(),
      fssaiExpiryDate: fssaiExpiryDate || null,
      kitchenVerificationStatus: kitchenVerificationStatus || "pending",
      lastInspectionDate: lastInspectionDate || null,
      nextInspectionDate: nextInspectionDate || null,
      packagingStatus: packagingStatus || "unchecked",
      staffHygieneStatus: staffHygieneStatus || "unchecked",
      foodHandlingStatus: foodHandlingStatus || "unchecked",
      remarksByAdmin: String(remarksByAdmin || "").trim(),
      verifiedBy: String(verifiedBy || "admin").trim(),
      ownerClerkUserId: req.auth.isPlatformAdmin
        ? existing?.ownerClerkUserId || ""
        : req.auth.clerkUserId,
      ownerEmail: req.auth.isPlatformAdmin ? existing?.ownerEmail || "" : req.auth.email || "",
      ownerDisplayName: req.auth.isPlatformAdmin
        ? existing?.ownerDisplayName || ""
        : String(req.body.ownerDisplayName || req.auth.email || "Restaurant Owner").trim()
    };

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

    const refreshed = await recalculateRestaurantSafety(restaurant._id, {
      changedBy: payload.verifiedBy || "admin",
      reason: "profile_saved",
      previousRemarks: previous?.remarksByAdmin || ""
    });

    res.status(existing ? 200 : 201).json(enrichRestaurantForResponse(refreshed.restaurant));
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

    const document = await RestaurantDocument.create({
      restaurantId: restaurant._id,
      type,
      label: String(req.body.label || req.file.originalname || type).trim(),
      fileUrl: uploaded.secure_url,
      filePublicId: uploaded.public_id,
      mimeType: req.file.mimetype,
      uploadedBy: String(req.body.uploadedBy || "admin").trim()
    });

    await createAuditEntry({
      restaurantId: restaurant._id,
      actionType: "document_uploaded",
      changedBy: document.uploadedBy,
      previousScore: restaurant.hygieneScore,
      newScore: restaurant.hygieneScore,
      previousRemarks: restaurant.remarksByAdmin || "",
      newRemarks: restaurant.remarksByAdmin || "",
      previousStatus: restaurant.kitchenVerificationStatus || "",
      newStatus: restaurant.kitchenVerificationStatus || "",
      metadata: { documentType: type, documentId: String(document._id) }
    });

    await recalculateRestaurantSafety(restaurant._id, {
      changedBy: document.uploadedBy,
      reason: "document_uploaded"
    });

    res.status(201).json({ ...document.toObject(), id: String(document._id) });
  } catch (err) {
    console.error("document upload:", err);
    res.status(500).json({ message: "Failed to upload document" });
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
