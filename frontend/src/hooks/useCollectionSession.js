import { useState, useEffect, useCallback, useRef } from "react";
import { checkCollectionSession } from "../services/bins";

/**
 * Session states representing the lifecycle of a collection session
 */
export const SESSION_STATUS = {
  IDLE: "idle",
  ACTIVE: "active",
  COMPLETED: "completed",
  EXPIRED: "expired",
  ERROR: "error",
};

/**
 * Custom hook to manage a 15-minute collection session with automatic monitoring
 *
 * Features:
 * - Automatic session monitoring every 10 seconds
 * - Countdown timer for remaining time
 * - Automatic detection of bin level reduction
 * - Session expiration handling
 *
 * @param {string|null} binId - The ID of the bin being collected
 * @param {boolean} isActive - Whether the session should be active
 * @returns {Object} Session state and control functions
 */
export function useCollectionSession(binId, isActive) {
  const [sessionStatus, setSessionStatus] = useState(SESSION_STATUS.IDLE);
  const [sessionData, setSessionData] = useState(null);
  const [remainingMinutes, setRemainingMinutes] = useState(15);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [error, setError] = useState(null);

  // Use refs to avoid stale closures in intervals
  const monitorIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const binIdRef = useRef(binId);
  const isActiveRef = useRef(isActive);
  const sessionDeadlineRef = useRef(null); // ms timestamp when session should end

  // Keep refs in sync with props
  useEffect(() => {
    binIdRef.current = binId;
    isActiveRef.current = isActive;
  }, [binId, isActive]);

  /**
   * Stop monitoring the collection session
   */
  const stopMonitoring = useCallback(() => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  /**
   * Check the session status with the backend
   */
  const checkSession = useCallback(async () => {
    if (!binIdRef.current || !isActiveRef.current) return;

    try {
      const response = await checkCollectionSession(binIdRef.current);

      setSessionData(response.sessionData);

      // Set/refresh deadline from server-provided start time for stable countdown
      if (response?.sessionData?.startedAt) {
        const startedMs = new Date(response.sessionData.startedAt).getTime();
        const deadline = startedMs + 15 * 60 * 1000;
        sessionDeadlineRef.current = deadline;
      }

      if (response.sessionStatus === "completed") {
        setSessionStatus(SESSION_STATUS.COMPLETED);
        stopMonitoring();
      } else if (response.sessionStatus === "expired") {
        setSessionStatus(SESSION_STATUS.EXPIRED);
        stopMonitoring();
      } else if (response.sessionStatus === "active") {
        setSessionStatus(SESSION_STATUS.ACTIVE);
      }

      setError(null);
    } catch (err) {
      console.error("Error checking session:", err);
      setError(
        err?.response?.data?.message || "Failed to check session status"
      );

      // If no active session found, stop monitoring
      if (err?.response?.status === 400) {
        setSessionStatus(SESSION_STATUS.IDLE);
        stopMonitoring();
      }
    }
  }, [stopMonitoring]);

  /**
   * Start monitoring the collection session
   * Checks session status every 10 seconds
   */
  const startMonitoring = useCallback(() => {
    if (!binId) return;

    setSessionStatus(SESSION_STATUS.ACTIVE);
    // Optimistically set a 15-minute deadline; will be corrected by first check
    sessionDeadlineRef.current = Date.now() + 15 * 60 * 1000;
    // Initialize visible countdown
    setRemainingMinutes(15);
    setRemainingSeconds(0);
    setError(null);

    // Initial check
    checkSession();

    // Monitor session every 10 seconds
    monitorIntervalRef.current = setInterval(() => {
      checkSession();
    }, 10000); // 10 seconds

    // Update countdown timer every second for better UX
    timerIntervalRef.current = setInterval(() => {
      const deadline = sessionDeadlineRef.current;
      if (!deadline) return;
      const now = Date.now();
      const totalSecondsLeft = Math.max(0, Math.floor((deadline - now) / 1000));
      const mins = Math.floor(totalSecondsLeft / 60);
      const secs = totalSecondsLeft % 60;
      setRemainingMinutes(mins);
      setRemainingSeconds(secs);
    }, 1000); // 1 second
  }, [binId, checkSession]);

  /**
   * Reset the session to idle state
   */
  const resetSession = useCallback(() => {
    stopMonitoring();
    setSessionStatus(SESSION_STATUS.IDLE);
    setSessionData(null);
    setRemainingMinutes(15);
    setRemainingSeconds(0);
    setError(null);
    sessionDeadlineRef.current = null;
  }, [stopMonitoring]);

  /**
   * Start or restart the session monitoring
   */
  useEffect(() => {
    if (isActive && binId) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      stopMonitoring();
    };
  }, [isActive, binId, startMonitoring, stopMonitoring]);

  return {
    sessionStatus,
    sessionData,
    remainingTime: {
      minutes: remainingMinutes,
      seconds: remainingSeconds,
      formatted: `${remainingMinutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`,
    },
    error,
    isActive: sessionStatus === SESSION_STATUS.ACTIVE,
    isCompleted: sessionStatus === SESSION_STATUS.COMPLETED,
    isExpired: sessionStatus === SESSION_STATUS.EXPIRED,
    resetSession,
    checkSession,
  };
}

export default useCollectionSession;
