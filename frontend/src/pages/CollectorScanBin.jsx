import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import {
  getBinByCode,
  startCollectionSession,
  checkCollectionSession,
} from "../services/bins.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  useCollectionSession,
  SESSION_STATUS,
} from "../hooks/useCollectionSession.js";

/**
 * Bin scanning states
 */
const SCAN_STATE = {
  IDLE: "idle",
  SCANNING: "scanning",
  BIN_FOUND: "bin_found",
  SESSION_ACTIVE: "session_active",
  ASSIGNMENT_ERROR: "assignment_error",
};

/**
 * CollectorScanBin Component
 *
 * Implements a comprehensive bin collection workflow:
 * 1. Collector scans/enters bin ID
 * 2. Validates bin exists and is assigned to the collector
 * 3. Shows bin details and visual feedback
 * 4. Starts a 15-minute collection session
 * 5. Monitors bin level reduction
 * 6. Automatically marks as collected when level reduces
 * 7. Prompts to rescan if session expires without collection
 *
 * Features SOLID principles:
 * - Single Responsibility: Each function has one clear purpose
 * - Separation of Concerns: Business logic in hooks, UI logic in component
 * - Clear state management with explicit states
 */
export default function CollectorScanBin() {
  const { user } = useAuth();

  const ACTIVE_SESSION_STORAGE_KEY = "activeBinSession";

  // Scanning state management
  const [scanState, setScanState] = useState(SCAN_STATE.IDLE);
  const [binCode, setBinCode] = useState("");
  const [scannedBin, setScannedBin] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState(null);

  // Collection session management via custom hook
  const {
    sessionData,
    remainingTime,
    isActive: sessionIsActive,
    isCompleted: sessionIsCompleted,
    isExpired: sessionIsExpired,
    resetSession,
  } = useCollectionSession(
    scannedBin?._id,
    scanState === SCAN_STATE.SESSION_ACTIVE
  );

  // Restore active session on mount (if user navigated away and returned)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed?.binId) return;

        // Verify with backend whether session is still active
        try {
          const res = await checkCollectionSession(parsed.binId);
          if (res?.hasActiveSession) {
            // Fetch the full bin by code is not needed; we can synthesize minimal bin
            setScannedBin({ _id: parsed.binId, code: res?.bin?.code });
            setScanState(SCAN_STATE.SESSION_ACTIVE);
          } else {
            localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
          }
        } catch (err) {
          // If backend says no session or 400, clear stored session
          localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        }
      } catch (_) {
        // ignore
      }
    };
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Simulates QR code scanning with random bin code generation
   * In production, this would interface with device camera
   */
  const handleSimulatedScan = async () => {
    setScanState(SCAN_STATE.SCANNING);
    resetError();

    // Simulate scanning delay
    setTimeout(async () => {
      try {
        // Simulate scanning a random bin code
        const simulatedCode = `BIN-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`;

        await performBinLookup(simulatedCode);
      } catch (e) {
        handleScanError(e);
      }
    }, 1500);
  };

  /**
   * Handles manual bin code lookup
   */
  const handleManualLookup = async (e) => {
    e.preventDefault();

    if (!binCode.trim()) {
      setError("Please enter a bin code");
      return;
    }

    resetError();
    setLoading(true);

    try {
      await performBinLookup(binCode.trim());
    } catch (e) {
      handleScanError(e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Core bin lookup logic with assignment validation
   * Implements the business rule: bin must be assigned to current collector
   */
  const performBinLookup = async (code) => {
    setLoading(true);

    try {
      const bin = await getBinByCode(code);

      // Bin found and assigned to this collector
      setScannedBin(bin);
      setError(null);
      setAssignmentError(null);

      // Automatically start collection session after successful scan
      await startCollectionSession(bin._id);
      // Persist active session so it survives navigation
      try {
        localStorage.setItem(
          ACTIVE_SESSION_STORAGE_KEY,
          JSON.stringify({ binId: bin._id, startedAt: Date.now() })
        );
      } catch (_) {}
      setScanState(SCAN_STATE.SESSION_ACTIVE);
    } catch (e) {
      if (e?.response?.status === 403) {
        // Assignment error - bin not assigned to this collector
        handleAssignmentError(e);
      } else if (e?.response?.status === 404) {
        setError("Bin not found. Please check the code and try again.");
        setScanState(SCAN_STATE.IDLE);
      } else {
        setError(
          e?.response?.data?.message ||
            "Failed to lookup bin. Please try again."
        );
        setScanState(SCAN_STATE.IDLE);
      }
      setScannedBin(null);
    } finally {
      setLoading(false);
      setScanState((prev) =>
        prev === SCAN_STATE.SCANNING ? SCAN_STATE.IDLE : prev
      );
    }
  };

  /**
   * Handles the case where a collector scans a bin not assigned to them
   */
  const handleAssignmentError = (e) => {
    const errorData = e?.response?.data;
    setAssignmentError({
      message: errorData?.message || "This bin is not assigned to you.",
      binCode: errorData?.bin?.code,
      assignedTo: errorData?.bin?.assignedTo,
    });
    setScanState(SCAN_STATE.ASSIGNMENT_ERROR);
    setScannedBin(null);
  };

  /**
   * Handles scan errors
   */
  const handleScanError = (e) => {
    setError(
      e?.response?.data?.message ||
        "Failed to scan bin. Please try again or enter manually."
    );
    setScanState(SCAN_STATE.IDLE);
    setScannedBin(null);
    setLoading(false);
  };

  /**
   * Resets the scanner to initial state
   */
  const handleReset = () => {
    setScannedBin(null);
    setBinCode("");
    resetError();
    setScanState(SCAN_STATE.IDLE);
    resetSession();
    try {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch (_) {}
  };

  /**
   * Clears all error states
   */
  const resetError = () => {
    setError(null);
    setAssignmentError(null);
  };

  /**
   * Renders the appropriate visual feedback based on session status
   */
  const renderSessionFeedback = () => {
    if (sessionIsCompleted) {
      return (
        <div className="mb-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg animate-pulse-slow">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-green-800 text-center mb-2">
            Collection Completed! ✓
          </h3>
          <p className="text-green-700 text-center">
            Waste collected successfully. Bin level has been reduced.
          </p>
          <Button
            onClick={handleReset}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
          >
            Scan Next Bin
          </Button>
        </div>
      );
    }

    if (sessionIsExpired) {
      return (
        <div className="mb-6 p-6 bg-orange-50 border-2 border-orange-500 rounded-lg">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-orange-800 text-center mb-2">
            Session Expired
          </h3>
          <p className="text-orange-700 text-center mb-4">
            Bin level was not reduced within 15 minutes. Please scan the bin
            again to restart the collection session.
          </p>
          <Button
            onClick={handleReset}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            Scan Again
          </Button>
        </div>
      );
    }

    return null;
  };

  /**
   * Renders the session timer and monitoring information
   */
  const renderActiveSession = () => {
    if (!sessionIsActive) return null;

    return (
      <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-500 rounded-lg">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Collection Session Active
          </h3>
          <div className="text-4xl font-bold text-blue-600 mb-2 font-mono">
            {remainingTime.formatted}
          </div>
          <p className="text-sm text-blue-700">
            Time remaining to collect waste
          </p>
        </div>

        {sessionData && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-white rounded">
              <span className="text-gray-600">Initial Fill Level:</span>
              <span className="font-semibold text-gray-900">
                {sessionData.initialFillLevel}%
              </span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded">
              <span className="text-gray-600">Current Fill Level:</span>
              <span
                className={`font-semibold ${
                  sessionData.thresholdMet ? "text-green-600" : "text-gray-900"
                }`}
              >
                {sessionData.currentFillLevel}%
                {sessionData.thresholdMet && " ✓"}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            <strong>Monitoring:</strong> Collecting waste from this bin. The
            system will automatically mark it as collected when the bin level
            reaches 5% or below.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader
          title="Scan Bin QR Code"
          subtitle={`Collector: ${user?.firstName || ""} ${
            user?.lastName || ""
          }`}
        />
        <CardContent>
          {/* Session Status Feedback */}
          {renderSessionFeedback()}
          {/* Assigned Bin Confirmation (shown above session view) */}
          {scanState === SCAN_STATE.SESSION_ACTIVE && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-900 font-semibold">
                    Assigned bin confirmed
                  </p>
                  <p className="text-xs text-green-800">
                    {scannedBin?.code ? (
                      <>
                        Bin <span className="font-mono font-semibold">{scannedBin.code}</span> is assigned to you. Please proceed to collect the waste.
                      </>
                    ) : (
                      <>This bin is assigned to you. Please proceed to collect the waste.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          {renderActiveSession()}

          {/* Error Message */}
          {error && scanState !== SCAN_STATE.ASSIGNMENT_ERROR && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* QR Scanner and Manual Entry */}
          {scanState !== SCAN_STATE.SESSION_ACTIVE && (
            <div className="space-y-4">
              {/* Simulated Camera View */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-square max-w-sm mx-auto">
                {scanState === SCAN_STATE.SCANNING ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Scanning Animation */}
                      <div className="w-48 h-48 border-4 border-green-500 rounded-lg relative">
                        <div className="absolute inset-0 animate-pulse">
                          <div className="h-1 bg-green-500 shadow-lg shadow-green-500/50 animate-scan"></div>
                        </div>
                      </div>
                      <p className="text-white text-center mt-4 text-sm">
                        Scanning...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="w-48 h-48 border-4 border-dashed border-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-24 h-24"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm">Position QR code within frame</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan Button */}
              <Button
                onClick={handleSimulatedScan}
                disabled={scanState === SCAN_STATE.SCANNING || loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              >
                {scanState === SCAN_STATE.SCANNING
                  ? "Scanning..."
                  : "Start Scan"}
              </Button>

              {/* Quick Manual Entry Below Scanner */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center mb-3">
                  Or enter manually:
                </p>
                <form onSubmit={handleManualLookup} className="space-y-2">
                  <Input
                    id="quickBinCode"
                    type="text"
                    placeholder="Enter bin code (e.g., BIN-001)"
                    value={binCode}
                    onChange={(e) => setBinCode(e.target.value)}
                    disabled={loading || scanState === SCAN_STATE.SCANNING}
                    className="w-full"
                  />
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      scanState === SCAN_STATE.SCANNING ||
                      !binCode.trim()
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    {loading ? "Looking up..." : "Search Bin"}
                  </Button>
                </form>

                {/* Assignment Error Message - Below Search Button */}
                {scanState === SCAN_STATE.ASSIGNMENT_ERROR &&
                  assignmentError && (
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                      <div className="flex items-center mb-3">
                        <svg
                          className="w-6 h-6 text-red-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <h3 className="font-semibold text-red-800">
                          Assignment Error
                        </h3>
                      </div>
                      <p className="text-sm text-red-700 mb-2">
                        {assignmentError.message}
                      </p>
                      {assignmentError.binCode && (
                        <div className="text-sm text-red-600 bg-red-100 p-2 rounded">
                          <strong>Bin Code:</strong> {assignmentError.binCode}
                          {assignmentError.assignedTo &&
                            assignmentError.assignedTo !== "Unassigned" && (
                              <span>
                                {" "}
                                | <strong>Assigned to:</strong>{" "}
                                {assignmentError.assignedTo}
                              </span>
                            )}
                        </div>
                      )}
                      <p className="text-xs text-red-600 mt-3 font-medium">
                        ⚠️ Please scan a bin that is assigned to you.
                      </p>
                      <Button
                        onClick={handleReset}
                        className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Helper Text */}
          {scanState !== SCAN_STATE.SESSION_ACTIVE && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>How it works:</strong> Scan or enter a bin ID. If the
                bin is assigned to you, a 15-minute collection session will
                start automatically. The system will automatically detect when
                the bin reaches 5% or below and mark it as collected.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add custom CSS for animations */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(180px); }
          100% { transform: translateY(0); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-in-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
