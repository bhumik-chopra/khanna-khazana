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
        "kitchen_cooking_area_photo",
        "kitchen_preparation_area_photo",
        "kitchen_storage_area_photo",
        "kitchen_utensils_cleaning_area_photo",
        "staff_hygiene_photo",
        "storage_fridge_photo",
        "packaging_photo",
        "pest_control_proof",
        "kitchen_photo",
        "inspection_report",
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
