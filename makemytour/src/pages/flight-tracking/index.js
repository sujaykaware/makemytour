import { getAllFlightStatuses } from "@/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function FlightTracking() {
  const router = useRouter();

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFlights = async () => {
    const data = await getAllFlightStatuses();

    setFlights(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadFlights();

    const timer = setInterval(loadFlights, 10000);

    return () => clearInterval(timer);
  }, []);

  const getStatusClass = (status) => {
    if (status === "Delayed by 1h") {
      return "text-red-600";
    }

    if (status === "Boarding") {
      return "text-orange-500";
    }

    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading tracked flights...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">

        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          ← Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Flight Tracking
          </h1>

          <p className="text-gray-500 mt-2">
            Track multiple flights and view their latest status
            and estimated arrival time.
          </p>
        </div>

        {flights.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">
              No flights available
            </h2>

            <p className="text-gray-500">
              There are currently no flights to track.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {flights.map((flight) => (
              <div
                key={flight.id || flight._id}
                className="bg-white rounded-xl shadow-md p-6"
              >

                <div className="flex justify-between items-start mb-5">

                  <div>
                    <h2 className="text-xl font-bold">
                      {flight.flightName}
                    </h2>

                    <p className="text-gray-500">
                      {flight.from} → {flight.to}
                    </p>
                  </div>

                  <span
                    className={`font-bold ${getStatusClass(
                      flight.status
                    )}`}
                  >
                    {flight.status || "On Time"}
                  </span>

                </div>

                {flight.status === "Delayed by 1h" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">

                    <p className="font-semibold text-red-700">
                      Delay Information
                    </p>

                    <p className="text-red-600 mt-1">
                      {flight.delayReason ||
                        "Reason not provided"}
                    </p>

                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">

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

                <Button
                  className="w-full mt-5"
                  onClick={() =>
                    router.push(
                      `/flight-status/${
                        flight.id || flight._id
                      }`
                    )
                  }
                >
                  View Live Status
                </Button>

              </div>
            ))}

          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-8">
          Flight information automatically refreshes every
          10 seconds.
        </p>
      </div>
    </div>
  );
}