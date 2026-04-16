const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, unique: true, sparse: true },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    fssaiLicenseNumber: { type: String, default: "" },
    fssaiExpiryDate: { type: Date, default: null },
    kitchenVerificationStatus: {
      type: String,
      enum: ["verified", "pending", "rejected", "expired", "needs_reinspection"],
      default: "pending"
    },
    lastInspectionDate: { type: Date, default: null },
    nextInspectionDate: { type: Date, default: null },
    lastVerifiedDate: { type: Date, default: null },
    hygieneScore: { type: Number, default: 0, min: 0, max: 100 },
    scoreBand: {
      type: String,
      enum: ["excellent", "good", "needs_improvement", "poor"],
      default: "poor"
    },
    packagingStatus: {
      type: String,
      enum: ["good", "average", "poor", "unchecked"],
      default: "unchecked"
    },
    staffHygieneStatus: {
      type: String,
      enum: ["good", "average", "poor", "unchecked"],
      default: "unchecked"
    },
    foodHandlingStatus: {
      type: String,
      enum: ["good", "average", "poor", "unchecked"],
      default: "unchecked"
    },
    remarksByAdmin: { type: String, default: "" },
    verifiedBy: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
