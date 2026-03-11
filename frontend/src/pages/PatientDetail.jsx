import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api/axios'
import { useSocket } from '../hooks/useSocket'
import Icon from '../components/Icon'

const statusClass = { critical:'badge-critical', stable:'badge-stable', monitoring:'badge-monitoring', admitted:'badge-admitted', discharged:'badge-discharged' }

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { joinPatientRoom, onVitalsUpdate } = useSocket()

  const [patient,    setPatient]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiResult,   setAiResult]   = useState(null)
  const [vitalsForm, setVitalsForm] = useState({ bpSystolic:'', bpDiastolic:'', heartRate:'', temperature:'', spo2:'', weight:'' })
  const [rxForm,     setRxForm]     = useState({ medicine:'', dosage:'', frequency:'', duration:'' })
  const [vitalsMsg,  setVitalsMsg]  = useState('')
  const [rxMsg,      setRxMsg]      = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get(`/patients/${id}`)
        setPatient(data.patient)
        joinPatientRoom(id)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
    const off = onVitalsUpdate((update) => {
      if (update.patientId === id) {
        setPatient(prev => ({ ...prev, vitals:[...prev.vitals, update.vitals], status: update.status }))
        setVitalsMsg('Live vitals updated!')
        setTimeout(() => setVitalsMsg(''), 3000)
      }
    })
    return off
  }, [id])

  const runAI = async () => {
    setAiLoading(true)
    try {
      const { data } = await API.post(`/ai/analyze/${id}`)
      setAiResult(data.analysis)
      setPatient(p => ({ ...p, aiRiskScore: data.analysis.riskScore, aiRiskSummary: data.analysis.summary }))
    } catch(e) { console.error(e) }
    finally { setAiLoading(false) }
  }

  const submitVitals = async (e) => {
    e.preventDefault()
    try {
      await API.post(`/patients/${id}/vitals`, vitalsForm)
      setVitalsMsg('Vitals saved successfully!')
      setVitalsForm({ bpSystolic:'', bpDiastolic:'', heartRate:'', temperature:'', spo2:'', weight:'' })
      setTimeout(() => setVitalsMsg(''), 3000)
    } catch(er) { setVitalsMsg('Failed: ' + (er.response?.data?.message || 'Error')) }
  }

  const submitRx = async (e) => {
    e.preventDefault()
    try {
      await API.post(`/patients/${id}/prescriptions`, rxForm)
      setRxMsg('Prescription added!')
      setRxForm({ medicine:'', dosage:'', frequency:'', duration:'' })
      const { data } = await API.get(`/patients/${id}`)
      setPatient(data.patient)
      setTimeout(() => setRxMsg(''), 3000)
    } catch(er) { setRxMsg('Failed to add prescription') }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, gap:10, color:'var(--text3)' }}>
      <div style={{ width:18, height:18, border:'2px solid var(--accent)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      Loading patient...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!patient) return <div style={{ padding:40, color:'var(--red)' }}>Patient not found.</div>

  const latest = patient.vitals[patient.vitals.length - 1]
  const riskColor = patient.aiRiskScore > 70 ? 'var(--red)' : patient.aiRiskScore > 40 ? 'var(--yellow)' : 'var(--green)'

  const vitalFields = [
    { key:'bpSystolic',  label:'BP Systolic',  unit:'mmHg', warn: v => v > 140, danger: v => v > 180 },
    { key:'bpDiastolic', label:'BP Diastolic', unit:'mmHg', warn: v => v > 90,  danger: v => v > 110 },
    { key:'heartRate',   label:'Heart Rate',   unit:'bpm',  warn: v => v > 100, danger: v => v > 120 },
    { key:'spo2',        label:'SpO₂',         unit:'%',    warn: v => v < 95,  danger: v => v < 90  },
    { key:'temperature', label:'Temp',          unit:'°C',   warn: v => v > 37.5,danger: v => v > 39  },
    { key:'weight',      label:'Weight',        unit:'kg',   warn: () => false,  danger: () => false  },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }} className="fade-up">
        <button className="btn-ghost" onClick={() => navigate('/patients')}>
          <Icon name="arrowLeft" size={15} /> Back
        </button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.4px', marginBottom:3 }}>{patient.name}</h1>
          <p style={{ fontSize:13, color:'var(--text2)' }}>{patient.patientId} · Age {patient.age} · {patient.gender} · Blood {patient.bloodGroup || 'N/A'}</p>
        </div>
        <span className={`badge ${statusClass[patient.status]}`} style={{ fontSize:12, padding:'5px 14px' }}>
          {patient.status.toUpperCase()}
        </span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Patient Info */}
        <div className="card fade-up-1">
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <Icon name="user" size={17} color="var(--accent)" /> Patient Information
          </div>
          {[
            ['Phone',      patient.phone],
            ['Email',      patient.email || 'N/A'],
            ['Department', patient.department],
            ['Diagnosis',  patient.diagnosis || 'N/A'],
            ['Ward / Bed', `${patient.ward || 'N/A'} / ${patient.bed || 'N/A'}`],
            ['Doctor',     patient.assignedDoctor?.name || 'N/A'],
            ['Allergies',  patient.allergies?.join(', ') || 'None'],
            ['History',    patient.medicalHistory?.join(', ') || 'None'],
          ].map(([label, val]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'9px 0', borderBottom:'1px solid var(--border)', fontSize:13, gap:12 }}>
              <span style={{ color:'var(--text3)', flexShrink:0 }}>{label}</span>
              <span style={{ fontWeight:500, textAlign:'right', color:'var(--text)' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* AI Risk */}
        <div className="card fade-up-2">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
              <Icon name="robot" size={17} color="var(--accent)" /> AI Risk Assessment
            </div>
            <button className="btn-primary" style={{ fontSize:12, padding:'7px 14px' }} onClick={runAI} disabled={aiLoading}>
              {aiLoading
                ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} /> Analyzing...</>
                : <><Icon name="activity" size={14} color="#fff" /> Run Analysis</>}
            </button>
          </div>

          {/* Gauge */}
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:60, fontWeight:800, color: riskColor, lineHeight:1, letterSpacing:'-2px' }}>
              {patient.aiRiskScore}<span style={{ fontSize:28 }}>%</span>
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:4, fontWeight:500 }}>Risk Score</div>
            <div style={{ height:8, background:'var(--surface3)', borderRadius:4, margin:'14px 0', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${patient.aiRiskScore}%`, background: riskColor, borderRadius:4, transition:'width 0.6s ease' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)' }}>
              <span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
            </div>
          </div>

          {(aiResult || patient.aiRiskSummary) && (
            <div style={{ background:'var(--accent-soft)', border:'1px solid var(--accent-glow)', borderRadius:10, padding:14, fontSize:13, color:'var(--text2)', lineHeight:1.7, marginTop:8 }}>
              <div style={{ fontWeight:600, color:'var(--text)', marginBottom:6 }}>Clinical Summary</div>
              {aiResult?.summary || patient.aiRiskSummary}
              {aiResult?.recommendations?.length > 0 && (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontWeight:600, color:'var(--text)', marginBottom:6, fontSize:12 }}>Recommendations</div>
                  {aiResult.recommendations.map((r, i) => (
                    <div key={i} style={{ display:'flex', gap:8, marginBottom:5 }}>
                      <Icon name="check" size={13} color="var(--green)" style={{ flexShrink:0, marginTop:2 }} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vitals */}
        <div className="card fade-up-3">
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Icon name="activity" size={17} color="var(--accent)" /> Live Vitals
              {vitalsMsg && <span style={{ fontSize:11, color:'var(--green)', fontWeight:500 }}>{vitalsMsg}</span>}
            </div>
            {latest && <span style={{ fontSize:11, color:'var(--green)', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:6, height:6, background:'var(--green)', borderRadius:'50%', display:'inline-block', animation:'pulse 1.5s infinite' }} />
              Live
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            </span>}
          </div>

          {latest ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
              {vitalFields.map(v => {
                const val = latest[v.key]
                const color = val && v.danger(val) ? 'var(--red)' : val && v.warn(val) ? 'var(--yellow)' : 'var(--green)'
                return (
                  <div key={v.key} style={{ background:'var(--surface2)', borderRadius:10, padding:14, textAlign:'center', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:24, fontWeight:800, color, lineHeight:1 }}>{val ?? '—'}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:4, fontWeight:500 }}>{v.label}</div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>{v.unit}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ color:'var(--text3)', fontSize:13, marginBottom:16, padding:'16px', background:'var(--surface2)', borderRadius:10, textAlign:'center' }}>
              No vitals recorded yet
            </div>
          )}

          {/* Add Vitals */}
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
              <Icon name="plus" size={14} color="var(--accent)" /> Record New Vitals
            </div>
            <form onSubmit={submitVitals}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
                {vitalFields.map(v => (
                  <div key={v.key}>
                    <label className="inp-label">{v.label}</label>
                    <input className="inp" type="number" placeholder={v.unit}
                      value={vitalsForm[v.key]} onChange={e => setVitalsForm(p => ({ ...p, [v.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <button className="btn-primary" type="submit" style={{ fontSize:13 }}>
                <Icon name="check" size={14} color="#fff" /> Save Vitals
              </button>
            </form>
          </div>
        </div>

        {/* Prescriptions */}
        <div className="card fade-up-4">
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Icon name="pill" size={17} color="var(--accent)" /> Prescriptions
              {rxMsg && <span style={{ fontSize:11, color:'var(--green)', fontWeight:500 }}>{rxMsg}</span>}
            </div>
            <span style={{ fontSize:12, color:'var(--text3)' }}>{patient.prescriptions?.length || 0} active</span>
          </div>

          <div style={{ marginBottom:16, maxHeight:200, overflowY:'auto' }}>
            {patient.prescriptions?.length === 0 && (
              <div style={{ color:'var(--text3)', fontSize:13, padding:'12px', background:'var(--surface2)', borderRadius:10, textAlign:'center' }}>
                No prescriptions yet
              </div>
            )}
            {patient.prescriptions?.map((rx, i) => (
              <div key={i} style={{ background:'var(--surface2)', borderRadius:10, padding:'12px 14px', marginBottom:8, border:'1px solid var(--border)' }}>
                <div style={{ fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
                  <Icon name="pill" size={13} color="var(--accent)" /> {rx.medicine}
                </div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>
                  {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
              <Icon name="plus" size={14} color="var(--accent)" /> Add Prescription
            </div>
            <form onSubmit={submitRx}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                {[
                  { key:'medicine',  ph:'Medicine name *', req:true  },
                  { key:'dosage',    ph:'Dosage (50mg)',   req:false },
                  { key:'frequency', ph:'Frequency',       req:false },
                  { key:'duration',  ph:'Duration',        req:false },
                ].map(f => (
                  <div key={f.key}>
                    <label className="inp-label">{f.ph.replace(' *','')}</label>
                    <input className="inp" placeholder={f.ph} required={f.req}
                      value={rxForm[f.key]} onChange={e => setRxForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <button className="btn-primary" type="submit" style={{ fontSize:13, background:'var(--green)' }}>
                <Icon name="plus" size={14} color="#fff" /> Add Prescription
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}