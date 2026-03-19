import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import Icon from '../components/Icon'

const statusClass = {
  critical: 'badge-critical', stable: 'badge-stable',
  monitoring: 'badge-monitoring', admitted: 'badge-admitted', discharged: 'badge-discharged'
}

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      const { data } = await API.get(`/patients?${params}`)
      setPatients(data.patients)
      setTotal(data.total)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPatients() }, [page, status])

  const riskColor = (s) => s > 70 ? 'var(--red)' : s > 40 ? 'var(--yellow)' : 'var(--green)'

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:12 }} >
        <div>
          <h1 style={{ fontSize:'clamp(20px, 4vw, 24px)', fontWeight:800, letterSpacing:'-0.5px', marginBottom:4 }}>Patients</h1>
          <p style={{ fontSize:14, color:'var(--text2)' }}>{total} total records</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/patients/add')}>
          <Icon name="plus" size={15} color="#fff" /> Add Patient
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }} className="fade-up-1">
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', display:'flex' }}>
            <Icon name="search" size={15} />
          </span>
          <input className="inp" style={{ paddingLeft:38 }}
            placeholder="Search name, ID, phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPatients()} />
        </div>
        <select className="inp" style={{ width:140, flexShrink:0 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          {['admitted','stable','critical','monitoring','discharged'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={fetchPatients} style={{ flexShrink:0 }}>
          <Icon name="search" size={14} color="#fff" />
          {!isMobile && ' Search'}
        </button>
        {(search || status) && (
          <button className="btn-ghost" onClick={() => { setSearch(''); setStatus(''); setPage(1) }} style={{ flexShrink:0 }}>
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div className="card fade-up-2" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:48, color:'var(--text3)' }}>
            <div style={{ width:18, height:18, border:'2px solid var(--accent)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
            Loading patients...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>
            <Icon name="patients" size={40} color="var(--text3)" />
            <div style={{ marginTop:12, fontSize:14 }}>No patients found</div>
          </div>
        ) : isMobile ? (
          /* ── Mobile Card View ── */
          <div style={{ padding:12, display:'flex', flexDirection:'column', gap:10 }}>
            {patients.map(p => (
              <div key={p._id}
                onClick={() => navigate(`/patients/${p._id}`)}
                style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:14, padding:'14px', cursor:'pointer', transition:'all 0.2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{p.patientId} · {p.age} yrs · {p.gender}</div>
                  </div>
                  <span className={`badge ${statusClass[p.status]}`}>{p.status}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>
                    <Icon name="hospital" size={12} color="var(--text3)" /> {p.department}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11, color:'var(--text3)' }}>AI Risk:</span>
                    <div style={{ width:50, height:5, background:'var(--surface3)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${p.aiRiskScore}%`, background:riskColor(p.aiRiskScore), borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:riskColor(p.aiRiskScore) }}>{p.aiRiskScore}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Desktop Table View ── */
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr style={{ background:'var(--surface2)' }}>
                  {['Patient', 'Age / Gender', 'Department', 'Status', 'AI Risk', 'Action'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/patients/${p._id}`)}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>{p.patientId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color:'var(--text2)', fontSize:13 }}>{p.age} yrs / {p.gender}</td>
                    <td style={{ color:'var(--text2)', fontSize:13 }}>{p.department}</td>
                    <td><span className={`badge ${statusClass[p.status]}`}>{p.status}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:56, height:5, background:'var(--surface3)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${p.aiRiskScore}%`, background:riskColor(p.aiRiskScore), borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:riskColor(p.aiRiskScore) }}>{p.aiRiskScore}%</span>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn-ghost" style={{ fontSize:12, padding:'6px 12px' }} onClick={() => navigate(`/patients/${p._id}`)}>
                        <Icon name="eye" size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--surface2)', flexWrap:'wrap', gap:8 }}>
          <span style={{ fontSize:13, color:'var(--text3)' }}>
            Page <strong style={{ color:'var(--text)' }}>{page}</strong> of <strong style={{ color:'var(--text)' }}>{Math.ceil(total / 10) || 1}</strong>
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-ghost" style={{ fontSize:12, padding:'7px 14px' }}
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              ← Prev
            </button>
            <button className="btn-primary" style={{ fontSize:12, padding:'7px 14px' }}
              onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 10)}>
              Next →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .page-header { flex-direction: column !important; align-items: flex-start !important; }
          .page-header .btn-primary { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  )
}