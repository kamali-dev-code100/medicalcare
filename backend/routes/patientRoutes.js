const express = require("express");
const r = express.Router();
const {
  getPatients, getPatient, createPatient, updatePatient, deletePatient,
  addVitals, getVitals, addPrescription, getDashboardStats,
} = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/auth");

r.use(protect);
r.get("/stats/dashboard", getDashboardStats);
r.route("/").get(getPatients).post(authorize("admin","doctor"), createPatient);
r.route("/:id")
  .get(getPatient)
  .put(authorize("admin","doctor"), updatePatient)
  .delete(authorize("admin"), deletePatient);
r.route("/:id/vitals").get(getVitals).post(authorize("admin","doctor","nurse"), addVitals);
r.post("/:id/prescriptions", authorize("admin","doctor"), addPrescription);

module.exports = r;