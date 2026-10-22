
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporterName: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    leakType: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    photoUrl: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
