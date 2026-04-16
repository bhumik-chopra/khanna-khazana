const mongoose = require("mongoose");

const restaurantDocumentSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "fssai_certificate",
        "kitchen_photo",
        "inspection_report",
        "pest_control_proof",
        "staff_hygiene_proof",
        "compliance_document"
      ],
      required: true
    },
    label: { type: String, default: "" },
    fileUrl: { type: String, required: true },
    filePublicId: { type: String, required: true },
    mimeType: { type: String, default: "" },
    uploadedBy: { type: String, default: "admin" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantDocument", restaurantDocumentSchema);
