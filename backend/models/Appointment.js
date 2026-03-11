const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patient:    { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctor:     { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  date:       { type: Date, required: true },
  timeSlot:   { type: String, required: true },
  type:       { type: String, required: true },
  department: { type: String, default: "" },
  notes:      { type: String, default: "" },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled", "no-show"],
    default: "scheduled",
  },
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);