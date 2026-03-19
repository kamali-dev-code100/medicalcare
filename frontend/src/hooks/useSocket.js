import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socket = null

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const useSocket = () => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],  // fallback to polling if websocket fails
      })
      socket.on('connect', () => console.log('🔌 Socket connected'))
      socket.on('disconnect', () => console.log('❌ Socket disconnected'))
      socket.on('connect_error', () => {}) // suppress console errors silently
    }
    socketRef.current = socket
    return () => {}
  }, [])

  const joinPatientRoom = (patientId) => {
    socket?.emit('join_patient', patientId)
  }

  const onVitalsUpdate = (callback) => {
    socket?.on('vitals_update', callback)
    return () => socket?.off('vitals_update', callback)
  }

  const onCriticalAlert = (callback) => {
    socket?.on('ai_critical_alert', callback)
    return () => socket?.off('ai_critical_alert', callback)
  }

  return { joinPatientRoom, onVitalsUpdate, onCriticalAlert }
}
```

Then make sure `frontend/.env.production` has:
```
VITE_API_URL=https://medicalcare-production.up.railway.app/api
VITE_SOCKET_URL=https://medicalcare-production.up.railway.app