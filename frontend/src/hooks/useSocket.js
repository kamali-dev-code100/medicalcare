import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

let socket = null

export const useSocket = () => {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!socket) {
      socket = io('http://localhost:5000', { transports: ['websocket'] })
      socket.on('connect', () => console.log('🔌 Socket connected'))
      socket.on('disconnect', () => console.log('❌ Socket disconnected'))
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