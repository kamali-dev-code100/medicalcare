import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useState, useEffect } from 'react'
import { useSocket } from '../hooks/useSocket'
import Icon from './Icon'

const navLinks = [
  { to: '/',             icon: 'dashboard', label: 'Dashboard'    },
  { to: '/patients',     icon: 'patients',  label: 'Patients'     },
  { to: '/appointments', icon: 'calendar',  label: 'Appointments' },
]

export default function Layout() {
  const { user, logout }        = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate                = useNavigate()
  const { onCriticalAlert }     = useSocket()
  const [alert,    setAlert]    = useState(null)
  const [time,     setTime]     = useState(new Date())
  const [sideOpen, setSideOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const off = onCriticalAlert((data) => {
      setAlert(data)
      setTimeout(() => setAlert(null), 7000)
    })
    return off
  }, [])

  // Close sidebar on route change (mobile)
  const handleNav = () => setSideOpen(false)

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'
  const timeStr  = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr  = time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Critical Alert Toast ──────────────────────────────────────────── */}
      {alert && (
        <div style={{
          position: 'fixed', top: 16, right: 16, left: 16, zIndex: 9999,
          background: 'var(--surface)', border: '1px solid var(--red)',
          borderRadius: 'var(--radius-lg)', padding: '14px 16px',
          maxWidth: 380, margin: '0 auto',
          boxShadow: '0 8px 32px rgba(239,68,68,0.25)',
          animation: 'slideInRight 0.35s ease',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="alert" size={17} color="var(--red)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--red)', marginBottom: 2 }}>Critical AI Alert</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{alert.patientName}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, lineHeight: 1.5 }}>
                Risk Score: <strong style={{ color: 'var(--red)' }}>{alert.riskScore}%</strong> — {alert.summary?.slice(0, 70)}...
              </div>
            </div>
            <div onClick={() => setAlert(null)} style={{ cursor: 'pointer', color: 'var(--text3)', flexShrink: 0 }}>
              <Icon name="xCircle" size={16} />
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Overlay ────────────────────────────────────────────────── */}
      {sideOpen && (
        <div onClick={() => setSideOpen(false)} className="sidebar-overlay" />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${sideOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="hospital" size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>
                MedAI <span style={{ color: 'var(--accent)' }}>Care</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase' }}>HMS v2.0</div>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button onClick={() => setSideOpen(false)} className="sidebar-close-btn">
            <Icon name="xCircle" size={20} color="var(--text3)" />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', padding: '6px 10px', fontWeight: 600 }}>
            Main Menu
          </div>

          {navLinks.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={handleNav}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                cursor: 'pointer', fontSize: 14, fontWeight: 500,
                textDecoration: 'none', marginBottom: 2,
                transition: 'all 0.18s',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                border: isActive ? '1px solid var(--accent-glow)' : '1px solid transparent',
              })}>
              <Icon name={icon} size={17} color="currentColor" />
              {label}
            </NavLink>
          ))}

          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text3)', padding: '14px 10px 6px', fontWeight: 600 }}>
            System
          </div>

          <div onClick={() => { logout(); navigate('/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text2)', transition: 'all 0.18s', border: '1px solid transparent', marginBottom: 2 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-soft)'; e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' }}>
            <Icon name="logout" size={17} color="currentColor" />
            Logout
          </div>
        </nav>

        {/* User card */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>{user?.role} · {user?.department}</div>
            </div>
            <div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%', flexShrink: 0, boxShadow: '0 0 6px var(--green)' }} />
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="main-content">

        {/* Topbar */}
        <header className="topbar">
          {/* Hamburger (mobile only) */}
          <button onClick={() => setSideOpen(true)} className="hamburger-btn">
            <Icon name="menu" size={20} color="var(--text2)" />
          </button>

          {/* Date + time */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }} className="hide-mobile">
              {dateStr} &nbsp;·&nbsp;
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)' }}>
                {timeStr}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }} className="show-mobile">
              MedAI <span style={{ color: 'var(--accent)' }}>Care</span>
            </div>
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)', flexShrink: 0 }}>
            <Icon name={isDark ? 'sun' : 'moon'} size={17} color="currentColor" />
          </button>

          {/* Bell */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)' }}>
              <Icon name="bell" size={17} color="currentColor" />
            </button>
            <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, background: 'var(--red)', borderRadius: '50%', border: '2px solid var(--surface)' }} />
          </div>

          {/* Add Patient */}
          <button className="btn-primary add-patient-btn" onClick={() => navigate('/patients/add')}>
            <Icon name="plus" size={15} color="#fff" />
            <span className="hide-mobile">Add Patient</span>
          </button>
        </header>

        {/* Page content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}