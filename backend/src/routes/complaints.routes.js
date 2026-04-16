const express = require("express");

const RestaurantComplaint = require("../models/RestaurantComplaint");
const Restaurant = require("../models/Restaurant");
const { requireAdmin } = require("../middleware/auth");
const {
  createAuditEntry,
  recalculateRestaurantSafety
} = require("../services/restaurantSafety.service");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { restaurantId, orderId, complaintType, description, reporterName, reporterContact } = req.body;

    if (!restaurantId || !complaintType || !String(description || "").trim()) {
      return res.status(400).json({ message: "restaurantId, complaintType and description are required" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const complaint = await RestaurantComplaint.create({
      restaurantId,
      orderId: String(orderId || "").trim(),
      complaintType,
      description: String(description || "").trim(),
      reporterName: String(reporterName || "").trim(),
      reporterContact: String(reporterContact || "").trim()
    });

    await recalculateRestaurantSafety(restaurantId, {
      changedBy: "customer",
      reason: "complaint_created"
    });

    res.status(201).json({ ...complaint.toObject(), id: String(complaint._id) });
  } catch (err) {
    console.error("complaint create:", err);
    res.status(500).json({ message: "Failed to submit complaint" });
  }
});

router.get("/", requireAdmin, async (req, res) => {
  try {
    const complaints = await RestaurantComplaint.find({})
      .populate("restaurantId", "name")
      .sort({ createdAt: -1 });

    res.json(
      complaints.map((complaint) => ({
        ...complaint.toObject(),
        id: String(complaint._id),
        restaurant: complaint.restaurantId
          ? {
              id: String(complaint.restaurantId._id),
              name: complaint.restaurantId.name
            }
          : null
      }))
    );
  } catch (err) {
    console.error("complaints list:", err);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const complaint = await RestaurantComplaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const restaurant = await Restaurant.findById(complaint.restaurantId);
    const previousStatus = complaint.status;

    complaint.status = req.body.status || complaint.status;
    complaint.resolutionNote = String(req.body.resolutionNote || complaint.resolutionNote || "").trim();
    complaint.triggeredReinspection =
      String(req.body.triggeredReinspection || complaint.triggeredReinspection) === "true" ||
      req.body.triggeredReinspection === true;

    if (complaint.triggeredReinspection) {
      complaint.status = "reinspection_triggered";
      if (restaurant) {
        restaurant.kitchenVerificationStatus = "needs_reinspection";
        await restaurant.save();
      }
    }

    await complaint.save();

    if (restaurant) {
      await createAuditEntry({
        restaurantId: restaurant._id,
        actionType: "complaint_reviewed",
        changedBy: String(req.body.reviewedBy || "admin").trim(),
        previousScore: restaurant.hygieneScore,
        newScore: restaurant.hygieneScore,
        previousRemarks: restaurant.remarksByAdmin || "",
        newRemarks: restaurant.remarksByAdmin || "",
        previousStatus,
        newStatus: complaint.status,
        metadata: {
          complaintId: String(complaint._id),
          triggeredReinspection: complaint.triggeredReinspection
        }
      });

      await recalculateRestaurantSafety(restaurant._id, {
        changedBy: String(req.body.reviewedBy || "admin").trim(),
        reason: "complaint_reviewed"
      });
    }

    res.json({ ...complaint.toObject(), id: String(complaint._id) });
  } catch (err) {
    console.error("complaint patch:", err);
    res.status(500).json({ message: "Failed to update complaint" });
  }
});

module.exports = router;
