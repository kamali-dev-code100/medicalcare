import { useEffect, useState } from 'react'
import API from '../api/axios'
import Icon from '../components/Icon'

const statusClass = {
  scheduled: 'badge-scheduled', completed: 'badge-completed',
  cancelled: 'badge-cancelled', 'no-show': 'badge-discharged'
}

export default function Appointments() {
  const [appts,    setAppts]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [patients, setPatients] = useState([])
  const [msg,      setMsg]      = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ patient:'', date:'', timeSlot:'', type:'', department:'', notes:'' })

  useEffect(() => {
    const load = async () => {
      try {
        const [a, p] = await Promise.all([
          API.get('/appointments'),
          API.get('/patients?limit=100'),
        ])
        setAppts(a.data.appointments)
        setPatients(p.data.patients)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const me = await API.get('/auth/me')
      const { data } = await API.post('/appointments', { ...form, doctor: me.data.user._id })
      setAppts(prev => [data.appointment, ...prev])
      setMsg('success:Appointment booked successfully!')
      setForm({ patient:'', date:'', timeSlot:'', type:'', department:'', notes:'' })
      setShowForm(false)
      setTimeout(() => setMsg(''), 3000)
    } catch(er) {
      setMsg('error:' + (er.response?.data?.message || 'Failed to book'))
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/appointments/${id}`, { status })
      setAppts(prev => prev.map(a => a._id === id ? { ...a, status } : a))
    } catch(e) { console.error(e) }
  }

  const msgType   = msg.startsWith('success:') ? 'success' : 'error'
  const msgText   = msg.replace(/^(success|error):/, '')
  const msgColor  = msgType === 'success' ? 'var(--green)' : 'var(--red)'
  const msgBg     = msgType === 'success' ? 'var(--green-soft)' : 'var(--red-soft)'
  const msgBorder = msgType === 'success' ? 'var(--green)' : 'var(--red)'

  const timeSlots   = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM']
  const departments = ['Cardiology','Neurology','OB-GYN','General','Orthopedics','Pediatrics','Dermatology','ENT','Oncology','ICU']

  const BookingForm = () => (
    <div className="card fade-up-2">
      <div style={{ fontWeight:700, fontSize:15, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
        <Icon name="plus" size={17} color="var(--accent)" /> Book Appointment
      </div>

      {msg && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:msgBg, border:`1px solid ${msgBorder}`, borderRadius:10, padding:'10px 14px', color:msgColor, fontSize:13, marginBottom:12 }}>
          <Icon name={msgType === 'success' ? 'check' : 'alert'} size={14} color={msgColor} />
          {msgText}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="inp-label">Patient *</label>
        <select className="inp" value={form.patient} onChange={e => setForm(p => ({ ...p, patient: e.target.value }))} required>
          <option value="">Select patient</option>
          {patients.map(p => (
            <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>
          ))}
        </select>

        <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:0 }}>
          <div>
            <label className="inp-label">Date *</label>
            <input className="inp" type="date" value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
          </div>
          <div>
            <label className="inp-label">Time Slot *</label>
            <select className="inp" value={form.timeSlot}
              onChange={e => setForm(p => ({ ...p, timeSlot: e.target.value }))} required>
              <option value="">Select time</option>
              {timeSlots.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <label className="inp-label">Appointment Type *</label>
        <input className="inp" value={form.type}
          onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
          required placeholder="e.g. ECG Follow-up, Blood Test" />

        <label className="inp-label">Department</label>
        <select className="inp" value={form.department}
          onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
          <option value="">Select department</option>
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>

        <label className="inp-label">Notes</label>
        <input className="inp" value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          placeholder="Additional notes (optional)" />

        <div style={{ display:'flex', gap:10, marginTop:18 }}>
          <button className="btn-primary" type="submit" style={{ flex:1, justifyContent:'center', padding:12, fontSize:14 }}>
            <Icon name="calendar" size={16} color="#fff" /> Book Appointment
          </button>
          <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ padding:'12px 16px' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }} className="fade-up">
        <div>
          <h1 style={{ fontSize:'clamp(20px, 4vw, 24px)', fontWeight:800, letterSpacing:'-0.5px', marginBottom:4 }}>Appointments</h1>
          <p style={{ fontSize:14, color:'var(--text2)' }}>{appts.length} total appointments</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Icon name="plus" size={15} color="#fff" /> Book Appointment
        </button>
      </div>

      {/* Success/Error message (mobile) */}
      {msg && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:msgBg, border:`1px solid ${msgBorder}`, borderRadius:10, padding:'10px 14px', color:msgColor, fontSize:13, marginBottom:14 }}>
          <Icon name={msgType === 'success' ? 'check' : 'alert'} size={14} color={msgColor} />
          {msgText}
        </div>
      )}

      {/* Mobile: show form when toggled */}
      <div className="show-mobile-block">
        {showForm && <div style={{ marginBottom:16 }}><BookingForm /></div>}
      </div>

      <div className="appt-layout" style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:20 }}>

        {/* Appointments List */}
        <div className="card fade-up-1" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
              <Icon name="calendar" size={17} color="var(--accent)" /> All Appointments
            </div>
            <span style={{ fontSize:12, color:'var(--text3)' }}>{appts.length} records</span>
          </div>

          <div style={{ maxHeight:'65vh', overflowY:'auto' }}>
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:40, color:'var(--text3)' }}>
                <div style={{ width:16, height:16, border:'2px solid var(--accent)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                Loading...
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : appts.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
                <Icon name="calendar" size={36} color="var(--text3)" />
                <div style={{ marginTop:10, fontSize:13 }}>No appointments found</div>
              </div>
            ) : appts.map(a => (
              <div key={a._id}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                {/* Time block */}
                <div style={{ width:48, textAlign:'center', background:'var(--surface2)', borderRadius:10, padding:'7px 4px', flexShrink:0, border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:'var(--accent)', lineHeight:1 }}>
                    {a.timeSlot?.split(':')[0] || '--'}
                  </div>
                  <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', marginTop:1 }}>
                    {a.timeSlot?.includes('PM') ? 'PM' : 'AM'}
                  </div>
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.patient?.name || 'Patient'}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>
                    {a.type} · {a.doctor?.name || 'Doctor'}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>
                    {new Date(a.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                  <span className={`badge ${statusClass[a.status]}`}>{a.status}</span>
                  {a.status === 'scheduled' && (
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => updateStatus(a._id, 'completed')}
                        style={{ fontSize:10, padding:'3px 7px', borderRadius:6, border:'1px solid var(--green)', background:'var(--green-soft)', color:'var(--green)', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
                        Done
                      </button>
                      <button onClick={() => updateStatus(a._id, 'cancelled')}
                        style={{ fontSize:10, padding:'3px 7px', borderRadius:6, border:'1px solid var(--red)', background:'var(--red-soft)', color:'var(--red)', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Book Form — desktop only (shown inline on mobile via toggle) */}
        <div className="hide-mobile-block">
          <BookingForm />
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .show-mobile-block { display: none; }
        .hide-mobile-block { display: block; }
        @media (max-width: 768px) {
          .appt-layout { grid-template-columns: 1fr !important; }
          .show-mobile-block { display: block; }
          .hide-mobile-block { display: none; }
          .form-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}