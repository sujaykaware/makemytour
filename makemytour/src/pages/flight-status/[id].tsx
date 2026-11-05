import { getflightstatus } from "@/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function FlightStatusPage() {
  const router = useRouter();
  const { id } = router.query;

  const [flight, setFlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const loadStatus = async () => {
      const data = await getflightstatus(id);

      setFlight(data);
      setLoading(false);
    };

    loadStatus();

    // Refresh live status every 10 seconds
    const timer = setInterval(loadStatus, 10000);

    return () => clearInterval(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading flight status...</p>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Flight Not Found
          </h1>

          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">

        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          ← Back
        </Button>

        <div className="bg-white rounded-xl shadow-lg p-6">

          <h1 className="text-3xl font-bold mb-2">
            Live Flight Status
          </h1>

          <p className="text-gray-500 mb-6">
            {flight.flightName}
          </p>

          <div className="grid grid-cols-2 gap-6 mb-6">

            <div>
              <p className="text-sm text-gray-500">
                From
              </p>

              <p className="text-xl font-semibold">
                {flight.from}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                To
              </p>

              <p className="text-xl font-semibold">
                {flight.to}
              </p>
            </div>

          </div>

          <div className="border rounded-lg p-5 mb-6">

            <p className="text-sm text-gray-500 mb-1">
              Current Status
            </p>

            <p
              className={`text-2xl font-bold ${
                flight.status === "Delayed"
                  ? "text-red-600"
                  : flight.status === "Boarding"
                  ? "text-orange-500"
                  : "text-green-600"
              }`}
            >
              {flight.status || "On Time"}
            </p>

          </div>

          {flight.status === "Delayed" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">

              <p className="font-semibold text-red-700">
                Delay Information
              </p>

              <p className="text-red-600 mt-1">
                {flight.delayReason || "Reason not provided"}
              </p>

            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Departure
              </p>

              <p className="font-semibold mt-1">
                {flight.revisedDepartureTime ||
                  flight.departureTime ||
                  "Not available"}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Estimated Arrival
              </p>

              <p className="font-semibold mt-1">
                {flight.estimatedArrivalTime ||
                  flight.revisedArrivalTime ||
                  flight.arrivalTime ||
                  "Not available"}
              </p>
            </div>

          </div>

          <div className="mt-6 text-sm text-gray-500 text-center">
            Live status automatically refreshes every 10 seconds.
          </div>

        </div>
      </div>
    </div>
  );
}