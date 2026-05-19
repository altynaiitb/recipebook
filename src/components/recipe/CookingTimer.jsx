import React from 'react'

import { useTimer } from '../../context/TimerContext'

const CookingTimer = React.memo(function CookingTimer() {

  const {
    timerSeconds,
    timerInitialMinutes,
    isTimerRunning,
    isTimerPaused,
    isTimerFinished,
    isTimerIdle,
    isAlarmPlaying,
    startGlobalTimer,
    pauseGlobalTimer,
    resumeGlobalTimer,
    resetGlobalTimer,
    setTimerInputMinutes,
    stopAlarm
  } = useTimer()

  const mins = Math.floor(timerSeconds / 60)
  const secs = timerSeconds % 60
  const displayTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const isLowTime = isTimerRunning && timerSeconds > 0 && timerSeconds <= 30

  function handleInputChange(e) {
    const value = Number(e.target.value)
    setTimerInputMinutes(value)
  }

  function handleStart() {
    startGlobalTimer(timerInitialMinutes)
  }

  function handleStopAlarm() {
    stopAlarm()
  }

  return (
    <div className={`timer-box ${isAlarmPlaying ? 'alarm-active' : ''}`}>
      <h3>Cooking Timer</h3>

      {/* */}
      <div
        className={`timer-display ${isTimerRunning ? 'running' : ''} ${isTimerFinished ? 'finished' : ''} ${isLowTime ? 'low-time' : ''} ${isAlarmPlaying ? 'alarm-ringing' : ''}`}
      >
        {displayTime}
      </div>

      {/*  */}
      {isTimerIdle && (
        <div className="timer-input">
          <input
            type="number"
            min="1"
            max="120"
            value={timerInitialMinutes}
            onChange={handleInputChange}
            aria-label="Timer minutes"
          />
          <span>minutes</span>
        </div>
      )}

      {/*  */}
      {isTimerPaused && (
        <div className="timer-paused-info">
          Paused - {mins}m {secs}s remaining
        </div>
      )}

      {/* */}
      {isAlarmPlaying && (
        <div className="timer-alarm-indicator">
          🔔 Alarm ringing...
        </div>
      )}

      {/*  */}
      <div className="timer-actions">
        {/* */}
        {isTimerIdle && (
          <button className="btn primary" onClick={handleStart}>
            Start
          </button>
        )}

        {/* */}
        {isTimerRunning && (
          <button className="btn" onClick={pauseGlobalTimer}>
            Pause
          </button>
        )}

        {/*  */}
        {isTimerPaused && (
          <button className="btn primary" onClick={resumeGlobalTimer}>
            Resume
          </button>
        )}

        {/* */}
        {isAlarmPlaying && (
          <button className="btn alarm-stop" onClick={handleStopAlarm}>
            🔇 Stop Alarm
          </button>
        )}

        {/* */}
        {(isTimerRunning || isTimerPaused || isTimerFinished) && (
          <button className="btn danger" onClick={resetGlobalTimer}>
            Reset
          </button>
        )}
      </div>

      {/*  */}
      {isTimerFinished && (
        <div className="timer-finished-msg">
          Time is up!
        </div>
      )}

      {/* */}
      {(isTimerRunning || isTimerPaused) && (
        <div className="timer-persist-note">
          Timer runs globally - switch pages freely!
        </div>
      )}
    </div>
  )
})

export default CookingTimer
