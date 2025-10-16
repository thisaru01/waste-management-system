import PageHeader from "../components/ui/PageHeader.jsx";
import { Card, CardHeader, CardContent } from "../components/ui/Card.jsx";
import { useEffect, useState } from "react";
import { listFlaggedBins } from "../services/bins";
import { transformAndSortBins } from "../utils/binHelpers";

export default function PendingCollection() {
  const THRESHOLD = 85;
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listFlaggedBins(THRESHOLD)
      .then((data) => {
        if (!mounted) return;
        setBins(transformAndSortBins(data, THRESHOLD));
      })
      .catch((err) => {
        console.error("listBins error", err);
        if (mounted) setError(err?.message || "Failed to load pending bins");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Pending collection" subtitle="Bins pending collection" />
      <Card>
        <CardHeader title="Pending Bins" subtitle="Bins flagged for collection" />
        <CardContent>
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl font-extrabold">{bins.length}</div>
              <div className="text-sm text-gray-600">Showing bins that require collection.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
