import React from 'react'
import { useRecipes } from '../context/RecipeContext'

// ============================================
// COOKING TIMER COMPONENT (View Only)
//
// UPDATED FOR LAB 4:
// - All state and logic moved to RecipeContext
// - This component is now a pure "view"
// - Timer persists across page navigation
// - clearInterval cleanup is in RecipeContext
//
// UPDATED: Added alarm sound controls
// - Stop Alarm button when timer finishes
// - Visual indicator when alarm is playing
//
// LAB 3 REQUIREMENT (clearInterval) is satisfied
// in RecipeContext.jsx where the useEffect lives
// ============================================

export default function CookingTimer() {
  // Get all timer state and actions from global Context
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
  } = useRecipes()

  // Format time display as MM:SS
  const mins = Math.floor(timerSeconds / 60)
  const secs = timerSeconds % 60
  const displayTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // Determine if time is low (under 30 seconds) for urgent styling
  const isLowTime = isTimerRunning && timerSeconds > 0 && timerSeconds <= 30

  // Handle input change
  function handleInputChange(e) {
    const value = Number(e.target.value)
    setTimerInputMinutes(value)
  }

  // Handle start button click
  function handleStart() {
    startGlobalTimer(timerInitialMinutes)
  }

  // Handle stop alarm only (keeps finished state)
  function handleStopAlarm() {
    stopAlarm()
  }

  return (
    <div className={`timer-box ${isAlarmPlaying ? 'alarm-active' : ''}`}>
      <h3>Cooking Timer</h3>

      {/* Timer Display */}
      <div
        className={`timer-display ${isTimerRunning ? 'running' : ''} ${isTimerFinished ? 'finished' : ''} ${isLowTime ? 'low-time' : ''} ${isAlarmPlaying ? 'alarm-ringing' : ''}`}
      >
        {displayTime}
      </div>

      {/* Input - only shown when timer is IDLE (never started or reset) */}
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

      {/* Paused info - only shown when timer is PAUSED */}
      {isTimerPaused && (
        <div className="timer-paused-info">
          Paused - {mins}m {secs}s remaining
        </div>
      )}

      {/* Alarm playing indicator */}
      {isAlarmPlaying && (
        <div className="timer-alarm-indicator">
          🔔 Alarm ringing...
        </div>
      )}

      {/* Action Buttons */}
      <div className="timer-actions">
        {/* Start button - only in IDLE state */}
        {isTimerIdle && (
          <button className="btn primary" onClick={handleStart}>
            Start
          </button>
        )}

        {/* Pause button - only when RUNNING */}
        {isTimerRunning && (
          <button className="btn" onClick={pauseGlobalTimer}>
            Pause
          </button>
        )}

        {/* Resume button - only when PAUSED */}
        {isTimerPaused && (
          <button className="btn primary" onClick={resumeGlobalTimer}>
            Resume
          </button>
        )}

        {/* Stop Alarm button - only when alarm is playing */}
        {isAlarmPlaying && (
          <button className="btn alarm-stop" onClick={handleStopAlarm}>
            🔇 Stop Alarm
          </button>
        )}

        {/* Reset button - when RUNNING, PAUSED, or FINISHED */}
        {(isTimerRunning || isTimerPaused || isTimerFinished) && (
          <button className="btn danger" onClick={resetGlobalTimer}>
            Reset
          </button>
        )}
      </div>

      {/* Finished message - only in FINISHED state */}
      {isTimerFinished && (
        <div className="timer-finished-msg">
          Time is up!
        </div>
      )}

      {/* Persistence indicator */}
      {(isTimerRunning || isTimerPaused) && (
        <div className="timer-persist-note">
          Timer runs globally - switch pages freely!
        </div>
      )}
    </div>
  )
}
