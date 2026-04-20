const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, unique: true, sparse: true },
    ownerClerkUserId: { type: String, default: "", index: true },
    ownerEmail: { type: String, default: "" },
    ownerDisplayName: { type: String, default: "" },
    ownerName: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    restaurantAddress: { type: String, default: "" },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    gstnNumber: { type: String, default: "" },
    fssaiLicenseNumber: { type: String, default: "" },
    fssaiExpiryDate: { type: Date, default: null },
    staffUsesProtectiveGear: { type: Boolean, default: false },
    rawAndCookedStoredSeparately: { type: Boolean, default: false },
    temperatureMaintainedProperly: { type: Boolean, default: false },
    packagingType: { type: String, default: "" },
    sealedPackaging: { type: Boolean, default: false },
    lastPestControlDate: { type: Date, default: null },
    wasteDisposalMethod: { type: String, default: "" },
    waterSource: {
      type: String,
      enum: ["RO", "Filtered", "Municipal", ""],
      default: ""
    },
    cleanWaterUsedForCooking: { type: Boolean, default: false },
    selfDeclarationAccepted: { type: Boolean, default: false },
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
    verifiedBy: { type: String, default: "" },
    verificationSections: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
