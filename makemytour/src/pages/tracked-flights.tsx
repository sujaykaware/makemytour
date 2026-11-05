import { getAllFlightStatuses } from "@/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function TrackedFlights() {

  const router = useRouter();

  const [flights, setFlights] = useState<any[]>([]);
  const [trackedIds, setTrackedIds] = useState<string[]>([]);

  const loadFlights = async () => {

    const data = await getAllFlightStatuses();

    const stored =
      JSON.parse(
        localStorage.getItem("trackedFlights") || "[]"
      );

    setTrackedIds(stored);

    const tracked =
      data.filter((flight: any) =>
        stored.includes(flight.id || flight._id)
      );

    setFlights(tracked);
  };

  useEffect(() => {

    if (typeof window === "undefined") return;

    loadFlights();

    const timer =
      setInterval(loadFlights, 10000);

    return () => clearInterval(timer);

  }, []);

  const removeFlight = (id: string) => {

    const updated =
      trackedIds.filter(
        (flightId) => flightId !== id
      );

    localStorage.setItem(
      "trackedFlights",
      JSON.stringify(updated)
    );

    setTrackedIds(updated);

    loadFlights();
  };

  const getStatusClass = (status: string) => {

    if (status === "Delayed by 1h") {
      return "text-red-600";
    }

    if (status === "Boarding") {
      return "text-orange-500";
    }

    return "text-green-600";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-5xl mx-auto">

        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          ← Back
        </Button>

        <div className="flex justify-between items-center mb-6">

          <div>
            <h1 className="text-3xl font-bold">
              My Tracked Flights
            </h1>

            <p className="text-gray-500 mt-1">
              Monitor multiple flights in real time
            </p>
          </div>

        </div>

        {flights.length === 0 ? (

          <div className="bg-white rounded-xl shadow p-8 text-center">

            <h2 className="text-xl font-semibold">
              No flights being tracked
            </h2>

            <p className="text-gray-500 mt-2">
              Track a flight from the flight search results.
            </p>

            <Button
              className="mt-5"
              onClick={() => router.push("/")}
            >
              Search Flights
            </Button>

          </div>

        ) : (

          <div className="grid gap-5">

            {flights.map((flight) => {

              const id =
                flight.id || flight._id;

              return (

                <div
                  key={id}
                  className="bg-white rounded-xl shadow p-6"
                >

                  <div className="flex justify-between">

                    <div>

                      <h2 className="text-xl font-bold">
                        {flight.flightName}
                      </h2>

                      <p className="text-gray-500">
                        {flight.from} → {flight.to}
                      </p>

                    </div>

                    <p
                      className={`text-lg font-bold ${getStatusClass(
                        flight.status
                      )}`}
                    >
                      {flight.status || "On Time"}
                    </p>

                  </div>

                  {flight.status ===
                    "Delayed by 1h" && (

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">

                      <p className="font-semibold text-red-700">
                        Delay Information
                      </p>

                      <p className="text-red-600">
                        {flight.delayReason ||
                          "Reason not provided"}
                      </p>

                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mt-5">

                    <div className="border rounded-lg p-4">

                      <p className="text-sm text-gray-500">
                        Departure
                      </p>

                      <p className="font-semibold">
                        {flight.revisedDepartureTime ||
                          flight.departureTime ||
                          "Not available"}
                      </p>

                    </div>

                    <div className="border rounded-lg p-4">

                      <p className="text-sm text-gray-500">
                        Estimated Arrival
                      </p>

                      <p className="font-semibold">
                        {flight.estimatedArrivalTime ||
                          flight.arrivalTime ||
                          "Not available"}
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-3 mt-5">

                    <Button
                      className="flex-1"
                      onClick={() =>
                        router.push(
                          `/flight-status/${id}`
                        )
                      }
                    >
                      View Live Status
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        removeFlight(id)
                      }
                    >
                      Stop Tracking
                    </Button>

                  </div>

                </div>

              );
            })}

          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Flight information automatically refreshes every 10 seconds.
        </p>

      </div>

    </div>
  );
}