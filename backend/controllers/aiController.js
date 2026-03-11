// ── Mock AI Engine (no OpenAI key needed) ────────────────────────────────────
const Patient = require("../models/Patient");

// Calculate risk score from patient vitals + history locally
const calculateRiskScore = (patient) => {
  let score = 0;
  const reasons = [];
  const recommendations = [];

  const latest = patient.vitals[patient.vitals.length - 1] || {};

  // ── Age risk ────────────────────────────────────────────────────────────────
  if (patient.age >= 70)      { score += 20; reasons.push("advanced age (70+)"); }
  else if (patient.age >= 55) { score += 12; reasons.push("age above 55"); }
  else if (patient.age >= 40) { score += 5; }

  // ── Blood Pressure ──────────────────────────────────────────────────────────
  if (latest.bpSystolic) {
    if (latest.bpSystolic > 180)      { score += 25; reasons.push("severely high BP"); recommendations.push("Immediate BP management required"); }
    else if (latest.bpSystolic > 160) { score += 18; reasons.push("high BP (Stage 2)"); recommendations.push("Antihypertensive medication review"); }
    else if (latest.bpSystolic > 140) { score += 10; reasons.push("elevated BP (Stage 1)"); recommendations.push("Monitor blood pressure every 4 hours"); }
  }

  // ── Heart Rate ──────────────────────────────────────────────────────────────
  if (latest.heartRate) {
    if (latest.heartRate > 130)      { score += 20; reasons.push("severe tachycardia"); recommendations.push("ECG and cardiac monitoring urgently"); }
    else if (latest.heartRate > 110) { score += 12; reasons.push("tachycardia"); recommendations.push("Cardiology review recommended"); }
    else if (latest.heartRate < 50)  { score += 15; reasons.push("bradycardia"); recommendations.push("Cardiac pacing evaluation needed"); }
  }

  // ── SpO2 ────────────────────────────────────────────────────────────────────
  if (latest.spo2) {
    if (latest.spo2 < 88)      { score += 25; reasons.push("critical oxygen saturation"); recommendations.push("Immediate oxygen therapy required"); }
    else if (latest.spo2 < 92) { score += 15; reasons.push("low oxygen saturation"); recommendations.push("Supplemental oxygen and pulmonology consult"); }
    else if (latest.spo2 < 95) { score += 8;  reasons.push("borderline SpO2"); recommendations.push("Monitor oxygen levels hourly"); }
  }

  // ── Temperature ─────────────────────────────────────────────────────────────
  if (latest.temperature) {
    if (latest.temperature > 39.5)      { score += 15; reasons.push("high fever"); recommendations.push("Blood cultures and IV antibiotics"); }
    else if (latest.temperature > 38.5) { score += 8;  reasons.push("fever"); recommendations.push("Antipyretics and hydration"); }
    else if (latest.temperature < 35)   { score += 18; reasons.push("hypothermia"); recommendations.push("Warming protocol and urgent evaluation"); }
  }

  // ── Medical History ─────────────────────────────────────────────────────────
  const history = (patient.medicalHistory || []).map(h => h.toLowerCase());
  if (history.some(h => h.includes("diabetes")))      { score += 8;  reasons.push("diabetes mellitus"); }
  if (history.some(h => h.includes("hypertension")))  { score += 7;  reasons.push("hypertension history"); }
  if (history.some(h => h.includes("cardiac") || h.includes("heart"))) { score += 12; reasons.push("cardiac history"); recommendations.push("Cardiology follow-up essential"); }
  if (history.some(h => h.includes("stroke")))        { score += 12; reasons.push("stroke history"); recommendations.push("Neurology review and anticoagulation check"); }
  if (history.some(h => h.includes("cancer") || h.includes("oncology"))) { score += 15; reasons.push("oncology history"); }

  // ── Current Status ──────────────────────────────────────────────────────────
  if (patient.status === "critical")   { score += 15; reasons.push("currently critical"); }
  else if (patient.status === "monitoring") { score += 8; }

  // ── Allergies ───────────────────────────────────────────────────────────────
  if (patient.allergies?.length > 2) { score += 5; recommendations.push("Review allergy list before any new medication"); }

  // Cap score at 100
  score = Math.min(score, 100);

  // ── Risk Level ──────────────────────────────────────────────────────────────
  let riskLevel;
  if (score >= 75)      riskLevel = "critical";
  else if (score >= 50) riskLevel = "high";
  else if (score >= 25) riskLevel = "moderate";
  else                  riskLevel = "low";

  // ── Default recommendations ─────────────────────────────────────────────────
  if (recommendations.length === 0) {
    recommendations.push("Continue current treatment plan");
    recommendations.push("Schedule routine follow-up in 7 days");
    recommendations.push("Monitor vitals twice daily");
  } else if (recommendations.length < 3) {
    recommendations.push("Regular vitals monitoring every 6 hours");
    recommendations.push("Keep patient hydrated and comfortable");
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const reasonText = reasons.length > 0
    ? `Risk factors identified: ${reasons.slice(0, 3).join(", ")}.`
    : "No significant risk factors detected from current data.";

  const summary = `Patient ${patient.name} (Age ${patient.age}) shows a ${riskLevel} risk profile with a score of ${score}/100. ${reasonText} ${score >= 75 ? "Immediate medical attention is recommended." : score >= 50 ? "Close monitoring and proactive intervention advised." : "Continue routine care and monitoring."}`;

  return { riskScore: score, riskLevel, summary, recommendations: recommendations.slice(0, 3) };
};

// POST /api/ai/analyze/:patientId
exports.analyzePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId).populate("assignedDoctor", "name");
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });

    const analysis = calculateRiskScore(patient);

    // Save AI results to patient record
    patient.aiRiskScore    = analysis.riskScore;
    patient.aiRiskSummary  = analysis.summary;
    patient.aiLastAnalyzed = new Date();
    if (analysis.riskScore >= 80 && patient.status !== "discharged") {
      patient.status = "critical";
    }
    await patient.save();

    // Broadcast critical alert via Socket.io
    if (analysis.riskScore >= 75) {
      const io = req.app.get("io");
      io.emit("ai_critical_alert", {
        patientId:   patient._id,
        patientName: patient.name,
        riskScore:   analysis.riskScore,
        summary:     analysis.summary,
      });
    }

    res.json({ success: true, analysis, patientId: patient._id });
  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ success: false, message: "AI analysis failed: " + err.message });
  }
};

// POST /api/ai/summarize/:patientId
exports.summarizeHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });

    const latest = patient.vitals[patient.vitals.length - 1] || {};
    const summary = `
**Patient Summary: ${patient.name}**
- Age: ${patient.age} | Gender: ${patient.gender} | Blood Group: ${patient.bloodGroup || "Unknown"}
- Department: ${patient.department} | Status: ${patient.status.toUpperCase()}
- Primary Diagnosis: ${patient.diagnosis || "Not specified"}
- Medical History: ${patient.medicalHistory?.join(", ") || "None recorded"}
- Known Allergies: ${patient.allergies?.join(", ") || "None"}
- Current Medications: ${patient.prescriptions?.map(p => p.medicine).join(", ") || "None prescribed"}
- Latest Vitals: BP ${latest.bpSystolic || "N/A"}/${latest.bpDiastolic || "N/A"} mmHg | HR ${latest.heartRate || "N/A"} bpm | SpO2 ${latest.spo2 || "N/A"}% | Temp ${latest.temperature || "N/A"}°C
- AI Risk Score: ${patient.aiRiskScore}/100
    `.trim();

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ai/prescription-check
exports.prescriptionCheck = async (req, res) => {
  try {
    const { medicines = [], patientAllergies = [], diagnosis = "" } = req.body;

    const conflicts = [];
    const warnings  = [];

    // Common drug interaction rules
    const dangerousCombos = [
      { drugs: ["warfarin", "aspirin"],     msg: "Warfarin + Aspirin increases bleeding risk significantly" },
      { drugs: ["metformin", "contrast"],   msg: "Metformin should be held before contrast procedures" },
      { drugs: ["ssri", "tramadol"],        msg: "SSRI + Tramadol risk of serotonin syndrome" },
      { drugs: ["ace inhibitor", "potassium"], msg: "ACE inhibitor + Potassium supplements risk hyperkalemia" },
    ];

    const medLower = medicines.map(m => m.toLowerCase());
    const allergyLower = patientAllergies.map(a => a.toLowerCase());

    // Check drug combos
    dangerousCombos.forEach(combo => {
      if (combo.drugs.every(d => medLower.some(m => m.includes(d)))) {
        conflicts.push(combo.msg);
      }
    });

    // Check allergies
    medLower.forEach(med => {
      allergyLower.forEach(allergy => {
        if (med.includes(allergy) || allergy.includes(med.split(" ")[0])) {
          conflicts.push(`Patient is allergic to ${allergy} — review ${med}`);
        }
      });
    });

    // General warnings
    if (medLower.some(m => m.includes("nsaid") || m.includes("ibuprofen"))) {
      warnings.push("NSAIDs may worsen renal function — monitor kidney markers");
    }
    if (medLower.some(m => m.includes("steroid") || m.includes("prednisolone"))) {
      warnings.push("Steroids can elevate blood glucose — monitor sugar levels");
    }
    if (medicines.length > 5) {
      warnings.push("Polypharmacy detected (5+ medications) — review for simplification");
    }

    const safe = conflicts.length === 0;
    const suggestion = safe
      ? "No major interactions detected. Proceed with standard monitoring."
      : "Review flagged interactions before dispensing. Consult senior physician if needed.";

    res.json({ success: true, result: { safe, conflicts, warnings, suggestion } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};