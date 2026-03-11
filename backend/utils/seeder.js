const mongoose = require("mongoose");
require("dotenv").config();
const User        = require("../models/User");
const Patient     = require("../models/Patient");
const Appointment = require("../models/Appointment");

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB Connected");

  // Drop entire database — clears ALL indexes and data cleanly
  await mongoose.connection.db.dropDatabase();
  console.log("🗑️  Dropped database (fresh start)");

  const users = await User.create([
    { name: "Dr. Rajesh Verma",  email: "admin@medai.com",    password: "Admin@123",  role: "admin",        department: "Administration" },
    { name: "Dr. Priya Sharma",  email: "priya@medai.com",    password: "Doctor@123", role: "doctor",       department: "Cardiology" },
    { name: "Dr. Anand Kumar",   email: "anand@medai.com",    password: "Doctor@123", role: "doctor",       department: "Neurology" },
    { name: "Dr. Sunita Rao",    email: "sunita@medai.com",   password: "Doctor@123", role: "doctor",       department: "OB-GYN" },
    { name: "Nurse Kavitha",     email: "kavitha@medai.com",  password: "Nurse@123",  role: "nurse",        department: "ICU" },
    { name: "Reception Rema",    email: "rema@medai.com",     password: "Recep@123",  role: "receptionist", department: "Front Desk" },
  ]);
  console.log(`Created ${users.length} staff accounts`);

  // Create patients one by one to avoid patientId index race condition
  const p1 = await Patient.create({
    name: "Arjun Sharma", age: 54, gender: "male", phone: "9876543210",
    email: "arjun@email.com", bloodGroup: "B+", department: "Cardiology",
    status: "critical", diagnosis: "Acute Myocardial Infarction",
    ward: "ICU", bed: "IC-01",
    medicalHistory: ["Hypertension", "Type 2 Diabetes"],
    allergies: ["Penicillin"],
    assignedDoctor: users[1]._id,
    aiRiskScore: 87, aiRiskSummary: "High cardiac risk due to elevated BP and irregular heart rate.",
    vitals: [{ bpSystolic: 165, bpDiastolic: 100, heartRate: 112, spo2: 94, temperature: 38.5, weight: 78, recordedBy: users[1]._id }],
    prescriptions: [
      { medicine: "Aspirin 75mg",  dosage: "75mg", frequency: "Once daily",  duration: "30 days", prescribedBy: users[1]._id },
      { medicine: "Metoprolol",    dosage: "25mg", frequency: "Twice daily", duration: "60 days", prescribedBy: users[1]._id },
    ],
  });

  const p2 = await Patient.create({
    name: "Meena Iyer", age: 32, gender: "female", phone: "9123456780",
    email: "meena@email.com", bloodGroup: "O+", department: "OB-GYN",
    status: "stable", diagnosis: "Prenatal Care - 28 Weeks",
    ward: "Maternity", bed: "M-04",
    assignedDoctor: users[3]._id, aiRiskScore: 12,
    vitals: [{ bpSystolic: 110, bpDiastolic: 70, heartRate: 78, spo2: 99, temperature: 36.8, weight: 65, recordedBy: users[4]._id }],
  });

  const p3 = await Patient.create({
    name: "Ravi Kumar", age: 67, gender: "male", phone: "9988776655",
    email: "ravi@email.com", bloodGroup: "A+", department: "Neurology",
    status: "monitoring", diagnosis: "Ischemic Stroke - Recovery Phase",
    ward: "Neuro", bed: "N-02",
    medicalHistory: ["Atrial Fibrillation", "Hypertension"],
    assignedDoctor: users[2]._id, aiRiskScore: 61,
    aiRiskSummary: "Moderate risk. Monitor for secondary stroke indicators.",
    vitals: [{ bpSystolic: 148, bpDiastolic: 88, heartRate: 89, spo2: 97, temperature: 37.2, weight: 70, recordedBy: users[4]._id }],
  });

  const p4 = await Patient.create({
    name: "Priya Nair", age: 28, gender: "female", phone: "9876501234",
    bloodGroup: "AB+", department: "General",
    status: "stable", diagnosis: "Viral Fever",
    assignedDoctor: users[0]._id, aiRiskScore: 8,
    vitals: [{ bpSystolic: 118, bpDiastolic: 76, heartRate: 82, spo2: 98, temperature: 38.1, weight: 55, recordedBy: users[4]._id }],
  });

  const p5 = await Patient.create({
    name: "Suresh Patel", age: 71, gender: "male", phone: "9988001122",
    bloodGroup: "O-", department: "Orthopedics",
    status: "discharged", diagnosis: "Knee Replacement - Post Op",
    assignedDoctor: users[0]._id, aiRiskScore: 20, vitals: [],
  });

  console.log("Created 5 patients");

  const today = new Date();
  await Appointment.create([
    { patient: p1._id, doctor: users[1]._id, date: today, timeSlot: "09:00 AM", type: "ECG Follow-up",  department: "Cardiology",  status: "scheduled" },
    { patient: p2._id, doctor: users[3]._id, date: today, timeSlot: "10:30 AM", type: "Prenatal Check",  department: "OB-GYN",     status: "scheduled" },
    { patient: p3._id, doctor: users[2]._id, date: today, timeSlot: "11:00 AM", type: "MRI Review",      department: "Neurology",   status: "scheduled" },
    { patient: p4._id, doctor: users[0]._id, date: today, timeSlot: "02:00 PM", type: "Blood Panel",     department: "General",     status: "scheduled" },
    { patient: p5._id, doctor: users[0]._id, date: today, timeSlot: "04:00 PM", type: "Post-op Checkup", department: "Orthopedics", status: "completed" },
  ]);
  console.log("Created 5 appointments");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("DATABASE SEEDED SUCCESSFULLY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Login Credentials:");
  console.log("   Admin        -> admin@medai.com   / Admin@123");
  console.log("   Doctor(Card) -> priya@medai.com   / Doctor@123");
  console.log("   Nurse        -> kavitha@medai.com / Nurse@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  mongoose.disconnect();
};

seed().catch(err => {
  console.error("Seed error:", err.message);
  mongoose.disconnect();
  process.exit(1);
});