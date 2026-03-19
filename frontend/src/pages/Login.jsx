import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Icon from '../components/Icon'

const accounts = [
  { label: 'Admin',  email: 'admin@medai.com',   pass: 'Admin@123'  },
  { label: 'Doctor', email: 'priya@medai.com',   pass: 'Doctor@123' },
  { label: 'Nurse',  email: 'kavitha@medai.com', pass: 'Nurse@123'  },
]

export default function Login() {
  const [email,    setEmail]    = useState('admin@medai.com')
  const [password, setPassword] = useState('Admin@123')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login }              = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate               = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)', fontFamily:'Outfit, sans-serif' }}>

      {/* ── Left Panel (Login Form) ────────────────────────────────────── */}
      <div className="login-left-panel" style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'40px 24px', position:'relative', overflow:'hidden',
        minWidth:0,
      }}>
        {/* Background blobs */}
        <div style={{ position:'absolute', top:-100, left:-100, width:350, height:350, borderRadius:'50%', background:'var(--accent-soft)', filter:'blur(80px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, right:-80, width:280, height:280, borderRadius:'50%', background:'var(--purple-soft)', filter:'blur(60px)', pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:400, position:'relative', zIndex:1 }} className="fade-up">

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:36 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px var(--accent-glow)', flexShrink:0 }}>
              <Icon name="hospital" size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px' }}>
                MedAI <span style={{ color:'var(--accent)' }}>Care</span>
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1.5, textTransform:'uppercase' }}>
                Hospital Management System
              </div>
            </div>
          </div>

          <div style={{ fontSize:'clamp(22px, 5vw, 28px)', fontWeight:800, marginBottom:6, letterSpacing:'-0.5px' }}>
            Welcome back
          </div>
          <div style={{ fontSize:14, color:'var(--text2)', marginBottom:28 }}>
            Sign in to access your dashboard
          </div>

          <form onSubmit={handleSubmit}>
            <label className="inp-label">Email Address</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', display:'flex' }}>
                <Icon name="user" size={16} />
              </span>
              <input
                className="inp"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft:38 }}
                placeholder="doctor@medai.com"
                required
                autoComplete="email"
              />
            </div>

            <label className="inp-label">Password</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', display:'flex' }}>
                <Icon name="shield" size={16} />
              </span>
              <input
                className="inp"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft:38 }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--red-soft)', border:'1px solid var(--red)', borderRadius:10, padding:'10px 14px', marginTop:14, color:'var(--red)', fontSize:13 }}>
                <Icon name="alert" size={15} color="var(--red)" /> {error}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ width:'100%', justifyContent:'center', marginTop:22, padding:'13px', fontSize:15, borderRadius:12 }}>
              {loading ? 'Signing in...' : <>Sign In <Icon name="chevronRight" size={16} color="#fff" /></>}
            </button>
          </form>

          {/* Quick Demo Login */}
          <div style={{ marginTop:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'var(--text3)', marginBottom:10 }}>
              Quick Demo Login
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {accounts.map(acc => (
                <button key={acc.label}
                  onClick={() => { setEmail(acc.email); setPassword(acc.pass) }}
                  style={{ flex:1, padding:'8px 6px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--surface2)', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--accent)', fontFamily:'Outfit, sans-serif', transition:'all 0.2s', minWidth:0 }}>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme toggle */}
          <div style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
            <button onClick={toggleTheme} className="btn-ghost" style={{ fontSize:12 }}>
              <Icon name={isDark ? 'sun' : 'moon'} size={14} color="currentColor" />
              Switch to {isDark ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Features) — hidden on mobile ────────────────── */}
      <div className="login-right-panel" style={{
        width:400, background:'var(--surface)',
        borderLeft:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'48px 36px',
      }}>
        <div style={{ fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:'var(--accent)', marginBottom:24 }}>
          Platform Features
        </div>

        {[
          { icon:'activity',    title:'Real-time Vitals',    desc:'Live patient monitoring with socket alerts' },
          { icon:'robot',       title:'AI Risk Scoring',     desc:'Automated clinical risk assessment engine' },
          { icon:'stethoscope', title:'Patient Management',  desc:'Complete EMR with prescriptions & history' },
          { icon:'calendar',    title:'Smart Scheduling',    desc:'Appointment booking and management' },
          { icon:'shield',      title:'Role-Based Access',   desc:'Admin, Doctor, Nurse, Reception roles' },
          { icon:'chart',       title:'Analytics Dashboard', desc:'Department stats and admission trends' },
        ].map((f, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:18 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name={f.icon} size={17} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{f.title}</div>
              <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-right-panel { display: none !important; }
          .login-left-panel { padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  )
}