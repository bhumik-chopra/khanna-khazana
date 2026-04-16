const mongoose = require("mongoose");

const restaurantComplaintSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    orderId: { type: String, default: "" },
    complaintType: {
      type: String,
      enum: ["hygiene_issue", "stale_food", "bad_packaging", "suspicious_food_safety"],
      required: true
    },
    description: { type: String, required: true, trim: true },
    reporterName: { type: String, default: "" },
    reporterContact: { type: String, default: "" },
    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "reinspection_triggered", "rejected"],
      default: "open"
    },
    resolutionNote: { type: String, default: "" },
    triggeredReinspection: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantComplaint", restaurantComplaintSchema);
