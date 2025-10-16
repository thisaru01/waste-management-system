import { useState } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { getBinByCode, markBinAsCollected } from "../services/bins.js";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * CollectorScanBin
 * Simulated QR scanner for collectors to scan bins and mark them as collected.
 * Includes fallback manual bin ID input.
 */
export default function CollectorScanBin() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [binCode, setBinCode] = useState("");
  const [scannedBin, setScannedBin] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Simulates QR code scanning with random bin code generation
   */
  const handleSimulatedScan = async () => {
    setScanning(true);
    setError(null);
    setSuccess(null);
    setScannedBin(null);

    // Simulate scanning delay
    setTimeout(async () => {
      try {
        // Simulate scanning a random bin code (in production, this would come from actual QR scanner)
        const simulatedCode = `BIN-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`;

        setLoading(true);
        const bin = await getBinByCode(simulatedCode);
        setScannedBin(bin);
        setScanning(false);
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            "Bin not found. Try another scan or enter manually."
        );
        setScanning(false);
      } finally {
        setLoading(false);
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

    setError(null);
    setSuccess(null);
    setScannedBin(null);
    setLoading(true);

    try {
      const bin = await getBinByCode(binCode.trim());
      setScannedBin(bin);
      setError(null);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Bin not found. Please check the code and try again."
      );
      setScannedBin(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marks the scanned bin as collected
   */
  const handleMarkAsCollected = async () => {
    if (!scannedBin) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await markBinAsCollected(scannedBin._id);
      setSuccess(`Bin ${scannedBin.code} marked as collected successfully!`);

      // Reset after success
      setTimeout(() => {
        setScannedBin(null);
        setBinCode("");
        setSuccess(null);
      }, 2000);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Failed to mark bin as collected. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resets the scanner state
   */
  const handleReset = () => {
    setScannedBin(null);
    setBinCode("");
    setError(null);
    setSuccess(null);
    setScanning(false);
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
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">✓ {success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* QR Scanner and Manual Entry */}
          <div className="space-y-4">
            {/* Simulated Camera View */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-square max-w-sm mx-auto">
              {scanning ? (
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
              disabled={scanning || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
            >
              {scanning ? "Scanning..." : "Start Scan"}
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
                  disabled={loading || scanning}
                  className="w-full"
                />
                <Button
                  type="submit"
                  disabled={loading || scanning || !binCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {loading ? "Looking up..." : "Search Bin"}
                </Button>
              </form>
            </div>
          </div>

          {/* Scanned Bin Details */}
          {scannedBin && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border-2 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bin Found
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    scannedBin.status === "assigned"
                      ? "bg-blue-100 text-blue-800"
                      : scannedBin.status === "needs-collection"
                      ? "bg-yellow-100 text-yellow-800"
                      : scannedBin.status === "collected"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {scannedBin.status}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Code:</span>
                  <span className="font-semibold text-gray-900">
                    {scannedBin.code}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {scannedBin.type}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fill Level:</span>
                  <span className="font-medium text-gray-900">
                    {scannedBin.fillLevelPercent}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium text-gray-900">
                    {scannedBin.weightKg} kg
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium text-gray-900">
                    {scannedBin.capacityLiters}L
                  </span>
                </div>
                {scannedBin.location?.description && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-gray-900 text-right max-w-xs">
                      {scannedBin.location.description}
                    </span>
                  </div>
                )}
                {scannedBin.assignedCollector && (
                  <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Assigned To:</span>
                    <span className="font-medium text-gray-900">
                      {`${scannedBin.assignedCollector.firstName || ""} ${
                        scannedBin.assignedCollector.lastName || ""
                      }`.trim()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleMarkAsCollected}
                  disabled={loading || scannedBin.status === "collected"}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                >
                  {loading
                    ? "Processing..."
                    : scannedBin.status === "collected"
                    ? "✓ Already Collected"
                    : "✓ Mark as Collected"}
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          {/* Helper Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> QR scanner is simulated for demo purposes.
              In production, this would use device camera. Use manual entry as
              fallback.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add custom CSS for scanning animation */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(180px); }
          100% { transform: translateY(0); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
