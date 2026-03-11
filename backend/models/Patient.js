const mongoose = require("mongoose");

const vitalSchema = new mongoose.Schema({
  bpSystolic:  { type: Number },
  bpDiastolic: { type: Number },
  heartRate:   { type: Number },
  temperature: { type: Number },
  spo2:        { type: Number },
  weight:      { type: Number },
  recordedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recordedAt:  { type: Date, default: Date.now },
});

const prescriptionSchema = new mongoose.Schema({
  medicine:     { type: String, required: true },
  dosage:       { type: String },
  frequency:    { type: String },
  duration:     { type: String },
  notes:        { type: String },
  prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  prescribedAt: { type: Date, default: Date.now },
});

const patientSchema = new mongoose.Schema({
  patientId:      { type: String, unique: true },
  name:           { type: String, required: true, trim: true },
  age:            { type: Number, required: true },
  gender:         { type: String, enum: ["male", "female", "other"], required: true },
  phone:          { type: String, required: true },
  email:          { type: String, default: "" },
  address:        { type: String, default: "" },
  bloodGroup:     { type: String, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-",""] , default: "" },
  department:     { type: String, required: true },
  diagnosis:      { type: String, default: "" },
  allergies:      [{ type: String }],
  medicalHistory: [{ type: String }],
  prescriptions:  [prescriptionSchema],
  vitals:         [vitalSchema],
  status: {
    type: String,
    enum: ["admitted", "stable", "critical", "monitoring", "discharged"],
    default: "stable",
  },
  ward:           { type: String, default: "" },
  bed:            { type: String, default: "" },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  aiRiskScore:    { type: Number, default: 0 },
  aiRiskSummary:  { type: String, default: "" },
  aiLastAnalyzed: { type: Date },
  admittedAt:     { type: Date, default: Date.now },
  dischargedAt:   { type: Date },
}, { timestamps: true });

// Auto-generate patient ID
patientSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("Patient").countDocuments();
    this.patientId = `P-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Patient", patientSchema);