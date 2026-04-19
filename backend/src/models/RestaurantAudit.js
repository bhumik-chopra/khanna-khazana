const mongoose = require("mongoose");

const restaurantAuditSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    actionType: {
      type: String,
      enum: [
        "profile_updated",
        "document_uploaded",
        "inspection_submitted",
        "complaint_reviewed",
        "score_recalculated",
        "approval_reviewed"
      ],
      required: true
    },
    changedBy: { type: String, default: "admin" },
    previousScore: { type: Number, default: null },
    newScore: { type: Number, default: null },
    previousRemarks: { type: String, default: "" },
    newRemarks: { type: String, default: "" },
    previousStatus: { type: String, default: "" },
    newStatus: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantAudit", restaurantAuditSchema);
