import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import Icon from '../components/Icon'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const statusClass = { critical:'badge-critical', stable:'badge-stable', monitoring:'badge-monitoring', admitted:'badge-admitted', discharged:'badge-discharged' }

const weekData = [
  { day:'Mon', v:12 },{ day:'Tue', v:19 },{ day:'Wed', v:14 },
  { day:'Thu', v:24 },{ day:'Fri', v:18 },{ day:'Sat', v:9 },{ day:'Sun', v:6 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      <div style={{ color:'var(--text3)', marginBottom:2 }}>{label}</div>
      <div style={{ fontWeight:700, color:'var(--accent)' }}>{payload[0].value} admissions</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats,    setStats]    = useState(null)
  const [patients, setPatients] = useState([])
  const [appts,    setAppts]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p, a] = await Promise.all([
          API.get('/patients/stats/dashboard'),
          API.get('/patients?limit=5'),
          API.get('/appointments'),
        ])
        setStats(s.data.stats)
        setPatients(p.data.patients)
        setAppts(a.data.appointments.slice(0, 5))
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, gap:12, color:'var(--text3)' }}>
      <div style={{ width:18, height:18, border:'2px solid var(--accent)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      Loading dashboard...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const statCards = [
    { label:'Total Patients',  value: stats?.total     || 0, icon:'patients',   color:'var(--accent)',  bg:'var(--accent-soft)',  change:'+8 this week',    up:true  },
    { label:'Critical Cases',  value: stats?.critical  || 0, icon:'alert',      color:'var(--red)',     bg:'var(--red-soft)',     change:'Needs attention', up:false },
    { label:'Discharged',      value: stats?.discharged|| 0, icon:'check',      color:'var(--green)',   bg:'var(--green-soft)',   change:'+3 today',        up:true  },
    { label:'Monitoring',      value: stats?.monitoring|| 0, icon:'activity',   color:'var(--yellow)',  bg:'var(--yellow-soft)',  change:'Under observation',up:null },
  ]

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom:28 }} className="fade-up">
        <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.5px', marginBottom:4 }}>Dashboard</h1>
        <p style={{ fontSize:14, color:'var(--text2)' }}>Overview of hospital operations and patient status</p>
      </div>

      {/* AI Banner */}
      <div className="fade-up-1" style={{ background:'linear-gradient(135deg, var(--accent-soft), var(--purple-soft))', border:'1px solid var(--accent-glow)', borderRadius:'var(--radius-lg)', padding:'16px 20px', marginBottom:24, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px var(--accent-glow)' }}>
          <Icon name="robot" size={22} color="#fff" />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:3, display:'flex', alignItems:'center', gap:8 }}>
            AI Diagnostics Active
            <span style={{ fontSize:10, fontWeight:700, background:'var(--green)', color:'#fff', padding:'2px 8px', borderRadius:20, letterSpacing:1 }}>LIVE</span>
          </div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>
            {stats?.critical > 0
              ? `${stats.critical} patient(s) in critical condition — AI risk monitoring active across all wards`
              : 'All patients stable — AI monitoring running in background'}
          </div>
        </div>
        <button className="btn-ghost" style={{ fontSize:12, flexShrink:0 }} onClick={() => navigate('/patients')}>
          View Patients <Icon name="chevronRight" size={14} />
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {statCards.map((s, i) => (
          <div key={i} className={`card fade-up-${i+1}`} style={{ cursor:'pointer', position:'relative', overflow:'hidden' }} onClick={() => navigate('/patients')}>
            <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:s.bg, opacity:0.8 }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'var(--text3)' }}>{s.label}</div>
              <div style={{ width:34, height:34, borderRadius:9, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name={s.icon} size={17} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize:38, fontWeight:800, color:s.color, lineHeight:1, marginBottom:10 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:5 }}>
              {s.up !== null && <Icon name={s.up ? 'trendUp' : 'trendDown'} size={13} color={s.up ? 'var(--green)' : 'var(--red)'} />}
              <span style={{ color: s.up ? 'var(--green)' : s.up === false ? 'var(--red)' : 'var(--text3)' }}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table + Appointments */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20, marginBottom:24 }}>

        {/* Patients */}
        <div className="card fade-up-2">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>Recent Patients</div>
            <button className="btn-ghost" style={{ fontSize:12 }} onClick={() => navigate('/patients')}>
              View all <Icon name="chevronRight" size={13} />
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                {['Patient', 'Department', 'Status', 'Risk', ''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/patients/${p._id}`)}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:`var(--accent-soft)`, color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                        {p.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{p.patientId} · Age {p.age}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:13, color:'var(--text2)' }}>{p.department}</td>
                  <td><span className={`badge ${statusClass[p.status]}`}>{p.status}</span></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:50, height:5, background:'var(--surface3)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${p.aiRiskScore}%`, background: p.aiRiskScore>70?'var(--red)':p.aiRiskScore>40?'var(--yellow)':'var(--green)', borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color: p.aiRiskScore>70?'var(--red)':p.aiRiskScore>40?'var(--yellow)':'var(--green)' }}>{p.aiRiskScore}%</span>
                    </div>
                  </td>
                  <td><Icon name="chevronRight" size={15} color="var(--text3)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Today's Schedule */}
        <div className="card fade-up-3">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>Today's Schedule</div>
            <button className="btn-ghost" style={{ fontSize:12 }} onClick={() => navigate('/appointments')}>
              Full <Icon name="chevronRight" size={13} />
            </button>
          </div>
          {appts.length === 0 && <div style={{ color:'var(--text3)', fontSize:13 }}>No appointments today.</div>}
          {appts.map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:46, textAlign:'center', background:'var(--surface2)', borderRadius:10, padding:'7px 4px', flexShrink:0, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--accent)', lineHeight:1 }}>
                  {a.timeSlot?.split(':')[0] || '--'}
                </div>
                <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', marginTop:1 }}>
                  {a.timeSlot?.includes('PM') ? 'PM' : 'AM'}
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{a.patient?.name || 'Patient'}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{a.type}</div>
              </div>
              <span className={`badge badge-${a.status}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card fade-up-4">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>Weekly Admissions</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Patient admission trend this week</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--accent)' }}>
            <Icon name="trendUp" size={14} color="var(--green)" />
            <span style={{ color:'var(--green)', fontWeight:600 }}>+18% vs last week</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekData} barSize={32}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill:'var(--text3)', fontSize:12, fontFamily:'Outfit' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill:'var(--surface2)' }} />
            <Bar dataKey="v" fill="var(--accent)" radius={[5,5,0,0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}