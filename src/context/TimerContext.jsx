import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const TimerContext = createContext(null)

const ALARM_SOUND_PATH = '/alarm.mp3'

export const TIMER_STATE = {
  IDLE:     'idle',
  RUNNING:  'running',
  PAUSED:   'paused',
  FINISHED: 'finished',
}

export function TimerProvider({ children }) {
  const [timerSeconds,        setTimerSeconds]        = useState(0)
  const [timerState,          setTimerState]           = useState(TIMER_STATE.IDLE)
  const [timerInitialMinutes, setTimerInitialMinutes]  = useState(5)
  const [isAlarmPlaying,      setIsAlarmPlaying]       = useState(false)

  const alarmRef  = useRef(null)
  const delTimers = useRef(new Map())

  useEffect(() => {
    try {
      const a = new Audio(ALARM_SOUND_PATH)
      a.loop = true
      a.preload = 'auto'
      a.addEventListener('error', () => { alarmRef.current = null })
      a.addEventListener('canplaythrough', () => { alarmRef.current = a })
      a.load()
      alarmRef.current = a
    } catch {
      alarmRef.current = null
    }
    return () => {
      if (alarmRef.current) { alarmRef.current.pause(); alarmRef.current = null }
    }
  }, [])

  useEffect(() => {
    if (timerState === TIMER_STATE.FINISHED) playAlarm()
    else stopAlarm()
  }, [timerState])

  useEffect(() => {
    const t = delTimers.current
    return () => { t.forEach(clearTimeout); t.clear() }
  }, [])

  useEffect(() => {
    if (timerState !== TIMER_STATE.RUNNING) return
    const id = setInterval(() => {
      setTimerSeconds(p => {
        if (p <= 1) { setTimerState(TIMER_STATE.FINISHED); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerState])

  function playAlarm() {
    const a = alarmRef.current
    if (!a) return
    try {
      a.currentTime = 0
      const p = a.play()
      if (p) p.then(() => setIsAlarmPlaying(true)).catch(() => {})
    } catch {}
  }

  function stopAlarm() {
    const a = alarmRef.current
    if (a && !a.paused) { try { a.pause(); a.currentTime = 0 } catch {} }
    setIsAlarmPlaying(false)
  }

  const startGlobalTimer = useCallback((m) => {
    const mins = Math.max(1, Math.min(120, m || timerInitialMinutes))
    setTimerInitialMinutes(mins)
    setTimerSeconds(mins * 60)
    setTimerState(TIMER_STATE.RUNNING)
  }, [timerInitialMinutes])

  const pauseGlobalTimer = useCallback(() => {
    if (timerState === TIMER_STATE.RUNNING) setTimerState(TIMER_STATE.PAUSED)
  }, [timerState])

  const resumeGlobalTimer = useCallback(() => {
    if (timerState === TIMER_STATE.PAUSED && timerSeconds > 0) setTimerState(TIMER_STATE.RUNNING)
  }, [timerState, timerSeconds])

  const resetGlobalTimer = useCallback(() => {
    stopAlarm()
    setTimerState(TIMER_STATE.IDLE)
    setTimerSeconds(0)
  }, [])

  const setTimerInputMinutes = useCallback((m) => {
    setTimerInitialMinutes(Math.max(1, Math.min(120, m)))
  }, [])

  const stopAlarmCb = useCallback(() => stopAlarm(), [])

  const value = {
    timerSeconds,
    timerState,
    timerInitialMinutes,
    isAlarmPlaying,
    isTimerRunning:  timerState === TIMER_STATE.RUNNING,
    isTimerPaused:   timerState === TIMER_STATE.PAUSED,
    isTimerFinished: timerState === TIMER_STATE.FINISHED,
    isTimerIdle:     timerState === TIMER_STATE.IDLE,
    startGlobalTimer,
    pauseGlobalTimer,
    resumeGlobalTimer,
    resetGlobalTimer,
    setTimerInputMinutes,
    stopAlarm: stopAlarmCb,
    TIMER_STATE,
  }

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider')
  return ctx
}
