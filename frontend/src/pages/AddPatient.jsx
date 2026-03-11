import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import Icon from '../components/Icon'

export default function AddPatient() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name:'', age:'', gender:'male', phone:'', email:'', bloodGroup:'',
    department:'', diagnosis:'', ward:'', bed:'', status:'stable',
    address:'', allergies:'', medicalHistory:''
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = {
        ...form,
        age:            Number(form.age),
        allergies:      form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        medicalHistory: form.medicalHistory.split(',').map(s => s.trim()).filter(Boolean),
      }
      const { data } = await API.post('/patients', payload)
      navigate(`/patients/${data.patient._id}`)
    } catch(err) {
      setError(err.response?.data?.message || 'Failed to create patient.')
    } finally { setLoading(false) }
  }

  const Section = ({ title, icon }) => (
    <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', margin:'24px 0 4px', display:'flex', alignItems:'center', gap:7 }}>
      <Icon name={icon} size={15} color="var(--accent)" /> {title}
    </div>
  )

  return (
    <div style={{ maxWidth:800 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }} className="fade-up">
        <button className="btn-ghost" onClick={() => navigate('/patients')}>
          <Icon name="arrowLeft" size={15} /> Back
        </button>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.4px', marginBottom:3 }}>Add New Patient</h1>
          <p style={{ fontSize:13, color:'var(--text2)' }}>Fill in patient details to create a new record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card fade-up-1">

        <Section title="Personal Information" icon="user" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:12 }}>
          <div>
            <label className="inp-label">Full Name *</label>
            <input className="inp" value={form.name} onChange={set('name')} required placeholder="Arjun Sharma" />
          </div>
          <div>
            <label className="inp-label">Phone Number *</label>
            <input className="inp" value={form.phone} onChange={set('phone')} required placeholder="9876543210" />
          </div>
          <div>
            <label className="inp-label">Age *</label>
            <input className="inp" type="number" value={form.age} onChange={set('age')} required placeholder="45" min="0" max="150" />
          </div>
          <div>
            <label className="inp-label">Email</label>
            <input className="inp" type="email" value={form.email} onChange={set('email')} placeholder="patient@email.com" />
          </div>
          <div>
            <label className="inp-label">Gender *</label>
            <select className="inp" value={form.gender} onChange={set('gender')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="inp-label">Blood Group</label>
            <select className="inp" value={form.bloodGroup} onChange={set('bloodGroup')}>
              <option value="">Select blood group</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="inp-label">Address</label>
            <input className="inp" value={form.address} onChange={set('address')} placeholder="Chennai, Tamil Nadu" />
          </div>
        </div>

        <Section title="Medical Information" icon="stethoscope" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:12 }}>
          <div>
            <label className="inp-label">Department *</label>
            <select className="inp" value={form.department} onChange={set('department')} required>
              <option value="">Select department</option>
              {['Cardiology','Neurology','OB-GYN','General','Orthopedics','Pediatrics','Dermatology','ENT','Oncology','ICU'].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="inp-label">Status</label>
            <select className="inp" value={form.status} onChange={set('status')}>
              {['stable','admitted','critical','monitoring','discharged'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="inp-label">Ward</label>
            <input className="inp" value={form.ward} onChange={set('ward')} placeholder="ICU, Maternity, General..." />
          </div>
          <div>
            <label className="inp-label">Bed Number</label>
            <input className="inp" value={form.bed} onChange={set('bed')} placeholder="IC-01, G-12..." />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="inp-label">Primary Diagnosis</label>
            <input className="inp" value={form.diagnosis} onChange={set('diagnosis')} placeholder="e.g. Acute Myocardial Infarction" />
          </div>
          <div>
            <label className="inp-label">Allergies <span style={{ color:'var(--text3)', textTransform:'none', letterSpacing:0 }}>(comma separated)</span></label>
            <input className="inp" value={form.allergies} onChange={set('allergies')} placeholder="Penicillin, Sulfa drugs" />
          </div>
          <div>
            <label className="inp-label">Medical History <span style={{ color:'var(--text3)', textTransform:'none', letterSpacing:0 }}>(comma separated)</span></label>
            <input className="inp" value={form.medicalHistory} onChange={set('medicalHistory')} placeholder="Hypertension, Type 2 Diabetes" />
          </div>
        </div>

        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--red-soft)', border:'1px solid var(--red)', borderRadius:10, padding:'11px 14px', color:'var(--red)', fontSize:13, marginTop:20 }}>
            <Icon name="alert" size={15} color="var(--red)" /> {error}
          </div>
        )}

        <div style={{ display:'flex', gap:12, marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <button className="btn-primary" type="submit" disabled={loading} style={{ fontSize:14, padding:'11px 28px' }}>
            {loading
              ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} /> Saving...</>
              : <><Icon name="check" size={16} color="#fff" /> Save Patient</>}
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate('/patients')} style={{ fontSize:14, padding:'11px 20px' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}