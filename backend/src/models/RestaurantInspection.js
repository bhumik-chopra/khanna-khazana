const mongoose = require("mongoose");

const inspectionChecklistSchema = new mongoose.Schema(
  {
    kitchenClean: { type: String, enum: ["pass", "partial", "fail"], default: "fail" },
    cookingAreaClean: { type: String, enum: ["pass", "partial", "fail"], default: "fail" },
    storageProper: { type: String, enum: ["pass", "partial", "fail"], default: "fail" },
    staffWearingGlovesCaps: { type: String, enum: ["pass", "partial", "fail"], default: "fail" },
    wasteDisposalProper: { type: String, enum: ["pass", "partial", "fail"], default: "fail" },
    packagingAreaHygienic: { type: String, enum: ["pass", "partial", "fail"], default: "fail" },
    refrigerationProper: { type: String, enum: ["pass", "partial", "fail"], default: "fail" }
  },
  { _id: false }
);

const restaurantInspectionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    checklist: { type: inspectionChecklistSchema, required: true },
    notes: { type: String, default: "" },
    calculatedScore: { type: Number, default: 0 },
    scoreBreakdown: {
      checklistScore: { type: Number, default: 0 },
      documentScore: { type: Number, default: 0 },
      operationalScore: { type: Number, default: 0 },
      complaintScore: { type: Number, default: 0 }
    },
    statusAfterInspection: {
      type: String,
      enum: ["verified", "pending", "rejected", "expired", "needs_reinspection"],
      default: "pending"
    },
    inspectedBy: { type: String, default: "admin" },
    inspectedAt: { type: Date, default: Date.now },
    nextInspectionDate: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantInspection", restaurantInspectionSchema);
