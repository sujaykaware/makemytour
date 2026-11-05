import SeatSelection from "@/components/SeatSelection";
import PriceHistory from "@/components/PriceHistory";
import Recommendations from "@/components/Recommendations";
import {
  getflight,
  gethotel,
  searchFlights,
  getAllFlightStatuses,
  getDynamicPrice,
  freezePrice,
  calculateRefund,
  getRefundStatus,
} from "@/api";

import Loader from "@/components/Loader";

import { SearchSelect } from "@/components/SearchSelect";

import { Button } from "@/components/ui/button";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Bus,
  Calendar,
  Car,
  CreditCard,
  HomeIcon,
  Hotel,
  MapPin,
  Plane,
  QrCode,
  Shield,
  Train,
  Umbrella,
  Users,
} from "lucide-react";

import { useRouter } from "next/router";
import { useSelector } from "react-redux";

export default function Home() {
  const [bookingtype, setbookingtype] = useState("flights");
  const [from, setfrom] = useState("");
  const [to, setto] = useState("");
  const [date, setdate] = useState("");
  const [travelers, settravelers] = useState(1);
  const [searchresults, setsearchresult] = useState<any[]>([]);
  const [hotel, sethotel] = useState<any[]>([]);
  const [flight, setflight] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  const [liveFlights, setLiveFlights] = useState<any[]>([]);
  const previousFlightStatuses = useRef<Record<string, string>>({});
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, any>>({});
  const [frozenFlights, setFrozenFlights] = useState<Record<string, boolean>>({});
  const [showCancellation, setShowCancellation] = useState<Record<string, boolean>>({});
  const [cancellationReason, setCancellationReason] = useState<Record<string, string>>({});
  const [refundDetails, setRefundDetails] = useState<Record<string, any>>({});
  const [refundStatuses, setRefundStatuses] = useState<Record<string, string>>({});
  const [cancelledBookings, setCancelledBookings] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const refundIds = Object.values(refundDetails)
      .map((refund: any) => refund?.refundId)
      .filter(Boolean);

    if (refundIds.length === 0) return;

    const checkRefundStatuses = async () => {
      for (const refundId of refundIds) {
        const statusData = await getRefundStatus(refundId);

        if (statusData?.status) {
          setRefundStatuses((prev) => {
            const updated = { ...prev };

            for (const bookingId of Object.keys(refundDetails)) {
              if (refundDetails[bookingId]?.refundId === refundId) {
                updated[bookingId] = statusData.status;
              }
            }

            return updated;
          });
        }
      }
    };

    checkRefundStatuses();

    const timer = setInterval(checkRefundStatuses, 3000);

    return () => clearInterval(timer);
  }, [refundDetails]);
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  const offers = [
    {
      title: "Domestic Flights",
      description: "Get up to 20% off on domestic flights",
      imageUrl:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800",
    },
    {
      title: "International Hotels",
      description: "Book luxury hotels worldwide",
      imageUrl:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800",
    },
    {
      title: "Holiday Packages",
      description: "Exclusive deals on holiday packages",
      imageUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800",
    },
  ];

  const collections = [
    {
      title: "Stays in & Around Delhi",
      imageUrl:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800",
      tag: "TOP 8",
    },
    {
      title: "Stays in & Around Mumbai",
      imageUrl:
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800",
      tag: "TOP 8",
    },
    {
      title: "Stays in & Around Bangalore",
      imageUrl:
        "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800",
      tag: "TOP 9",
    },
    {
      title: "Beach Destinations",
      imageUrl:
        "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?auto=format&fit=crop&w=800",
      tag: "TOP 11",
    },
  ];

  const wonders = [
    {
      title: "Shimla's Best Kept Secret",
      imageUrl:
        "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800",
    },
    {
      title: "Tamil Nadu's Charming Hill Town",
      imageUrl:
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800",
    },
    {
      title: "Quaint Little Hill Station in Gujarat",
      imageUrl:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800",
    },
    {
      title: "A pleasant summer retreat",
      imageUrl:
        "https://images.unsplash.com/photo-1593181629936-11c609b8db9b?auto=format&fit=crop&w=800",
    },
  ];

  // ================================
  // FETCH HOTELS AND FLIGHTS
  // ================================

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const hoteldata = await gethotel();
        console.log("HOTELS FROM BACKEND:", hoteldata);
        sethotel(Array.isArray(hoteldata) ? hoteldata : []);

        const flightdata = await getflight();
        console.log("FLIGHTS FROM BACKEND:", flightdata);
        setflight(Array.isArray(flightdata) ? flightdata : []);
      } catch (error) {
        console.error("FETCH ERROR:", error);
        sethotel([]);
        setflight([]);
      } finally {
        setloading(false);
      }
    };

    fetchdata();
  }, [user]);

  // ================================
  // LIVE FLIGHT STATUS
  // ================================

  useEffect(() => {
    const loadLiveFlights = async () => {
      const data = await getAllFlightStatuses();
      setLiveFlights(Array.isArray(data) ? data : []);
    };

    loadLiveFlights();

    const timer = setInterval(loadLiveFlights, 10000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    liveFlights.forEach((flight) => {
      const id = flight.id || flight._id;
      const currentStatus = flight.status || "On Time";

      const previousStatus =
        previousFlightStatuses.current[id];

      if (
        previousStatus &&
        previousStatus !== currentStatus &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(
          `Flight ${flight.flightName} Update`,
          {
            body:
              `${flight.from} → ${flight.to}\n` +
              `Status: ${currentStatus}` +
              (flight.delayReason
                ? `\nReason: ${flight.delayReason}`
                : ""),
          }
        );
      }

      previousFlightStatuses.current[id] = currentStatus;
    });
  }, [liveFlights]);

  // ================================
  // DYNAMIC PRICING
  // ================================
  useEffect(() => {
    const updatePrices = async () => {
      if (flight.length === 0) return;

      const prices: Record<string, any> = {};

      for (const item of flight) {
        const id = item.id || item._id;

        // Calculate demand from available seats
        const demand = Math.max(
          10,
          Math.min(100, 100 - (item.availableSeats || 0) * 2)
        );

        // Demo: peak season pricing enabled
        const peakSeason = true;

        const result = await getDynamicPrice(
          id,
          item.price,
          demand,
          peakSeason
        );

        if (result) {
          prices[id] = result;
        }
      }

      setDynamicPrices(prices);
    };

    updatePrices();

    const timer = setInterval(updatePrices, 15000);

    return () => clearInterval(timer);
  }, [flight]);

  // ================================
  // CITY OPTIONS
  // ================================

  const cityOptions = useMemo(() => {
    const cities = new Set<string>();

    if (bookingtype === "flights") {
      flight.forEach((item) => {
        if (item?.from) {
          cities.add(String(item.from).trim());
        }

        if (item?.to) {
          cities.add(String(item.to).trim());
        }
      });
    }

    if (bookingtype === "hotels") {
      hotel.forEach((item) => {
        if (item?.location) {
          cities.add(String(item.location).trim());
        }
      });
    }

    return Array.from(cities)
      .filter(Boolean)
      .sort()
      .map((city) => ({
        value: city,
        label: city,
      }));
  }, [flight, hotel, bookingtype]);

  // ================================
  // SEARCH
  // ================================

  const handleSearch = async () => {
    if (bookingtype === "flights") {

      if (!from || !to || !date) {
        alert("Please enter From, To and Date.");
        return;
      }

      const results = await searchFlights(
        from,
        to,
        date
      );

      setsearchresult(
        Array.isArray(results) ? results : []
      );

    } else {

      const results = hotel.filter((item: any) => {
        const matchesFrom =
          !from ||
          item.city
            ?.toLowerCase()
            .includes(from.toLowerCase());

        return matchesFrom;
      });

      setsearchresult(results);
    }
  };
  // ================================
  // DATE FORMAT
  // ================================

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Not available";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ================================
  // BOOK NOW
  // ================================

  const handlebooknow = (id: any) => {
    if (!id) {
      console.error("Missing booking ID");
      return;
    }

    if (bookingtype === "flights") {
      router.push(`/book-flight/${id}`);
    } else {
      router.push(`/book-hotel/${id}`);
    }
  };

  // ================================
  // LOADING
  // ================================

  if (loading) {
    return <Loader />;
  }

  return (
    <div
      className="min-h-screen bg-center bg-no-repeat"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=2940&q=80")',
        backgroundSize: "100% auto",
        backgroundPosition: "top center",
      }}
    >
      <main className="container mx-auto px-4 py-6">

        {/* ================= NAVIGATION ================= */}
        <nav className="bg-white rounded-xl shadow-lg mx-auto max-w-5xl mb-6 p-4 overflow-x-auto">
          <div className="flex justify-between items-center min-w-max space-x-8">

            <NavItem
              icon={<Plane />}
              text="Flights"
              active={bookingtype === "flights"}
              onClick={() => {
                setbookingtype("flights");
                setto("");
                setfrom("");
                setsearchresult([]);
              }}
            />

            <NavItem
              icon={<Hotel />}
              text="Hotels"
              active={bookingtype === "hotels"}
              onClick={() => {
                setbookingtype("hotels");
                setto("");
                setfrom("");
                setsearchresult([]);
              }}
            />

            <NavItem icon={<HomeIcon />} text="Homestays" />
            <NavItem icon={<Umbrella />} text="Holiday Packages" />
            <NavItem icon={<Train />} text="Trains" />
            <NavItem icon={<Bus />} text="Buses" />
            <NavItem icon={<Car />} text="Cabs" />
            <NavItem icon={<CreditCard />} text="Forex" />
            <NavItem icon={<Shield />} text="Insurance" />

          </div>
        </nav>

        {/* ================= SEARCH BOX ================= */}
        <div className="bg-white rounded-xl shadow-lg mx-auto max-w-5xl p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* FROM */}
            {bookingtype === "flights" && (
              <div className="col-span-1">
                <SearchSelect
                  options={cityOptions}
                  placeholder="From"
                  value={from}
                  onChange={setfrom}
                  icon={<MapPin className="text-gray-400" />}
                  subtitle="Enter city or airport"
                />
              </div>
            )}

            {/* TO / CITY */}
            <div className="col-span-1">
              <SearchSelect
                options={cityOptions}
                placeholder={
                  bookingtype === "flights" ? "To" : "City"
                }
                value={to}
                onChange={setto}
                icon={<MapPin className="text-gray-400" />}
                subtitle={
                  bookingtype === "flights"
                    ? "Enter city or airport"
                    : "Enter city"
                }
              />
            </div>

            {/* DATE */}
            <div className="col-span-1">
              <SearchInput
                icon={<Calendar className="text-gray-400" />}
                placeholder="Date"
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setdate(e.target.value)
                }
                subtitle="Select a date"
                type="date"
              />
            </div>

            {/* TRAVELERS */}
            <div className="col-span-1">
              <SearchInput
                icon={<Users className="text-gray-400" />}
                placeholder="Travelers"
                value={travelers.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  settravelers(parseInt(e.target.value) || 1)
                }
                subtitle="Number of travelers"
                type="number"
              />
            </div>

            {/* SEARCH BUTTON */}
            <Button
              className="col-span-1 h-full"
              onClick={handleSearch}
            >
              SEARCH
            </Button>

          </div>

          {/* ================= SEARCH RESULTS ================= */}
          <div className="mt-6">

            <h2 className="text-xl font-semibold mb-4 text-white">
              Search Results
            </h2>

            {searchresults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {searchresults.map((result) => (
                  <div
                    key={result.id || result._id}
                    className="bg-white rounded-lg shadow p-4 border border-gray-200"
                  >

                    {bookingtype === "flights" ? (
                      <>
                        <p className="font-semibold text-lg">
                          Flight Name:{" "}
                          {result.flightName || "Flight"}
                        </p>

                        <h3 className="font-semibold text-lg">
                          {result.from} → {result.to}
                        </h3>

                        <p className="text-gray-600">
                          Departure Time:{" "}
                          {formatDate(result.departureTime)}
                        </p>

                        <p className="text-gray-600">
                          Arrival Time:{" "}
                          {formatDate(result.arrivalTime)}
                        </p>
                        {(() => {
                          const flightId = result.id || result._id;
                          const pricing = dynamicPrices[flightId];

                          return (
                            <div className="mt-3 border rounded-lg p-3 bg-gray-50">
                              <p className="text-sm text-gray-500">
                                Base Price
                              </p>

                              <p className="text-lg font-semibold">
                                ₹{result.price}
                              </p>

                              {pricing && (
                                <>
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                      Current Dynamic Price
                                    </p>

                                    <p className="text-2xl font-bold text-blue-600">
                                      ₹{pricing.currentPrice}
                                    </p>
                                  </div>

                                  <p className="text-sm text-orange-600 mt-1">
                                    {pricing.pricingMessage}
                                  </p>

                                  <p className="text-xs text-gray-500 mt-1">
                                    Demand: {pricing.demand}%
                                  </p>

                                  <Button
                                    className="w-full mt-3"
                                    variant="outline"
                                    onClick={async () => {
                                      const response = await freezePrice(
                                        flightId,
                                        pricing.currentPrice,
                                        15
                                      );

                                      if (response) {
                                        setFrozenFlights((prev) => ({
                                          ...prev,
                                          [flightId]: true,
                                        }));

                                        alert(
                                          `Price frozen at ₹${pricing.currentPrice} for 15 minutes`
                                        );
                                      }
                                    }}
                                  >
                                    {frozenFlights[flightId]
                                      ? "Price Frozen ✓"
                                      : "Freeze Price for 15 Minutes"}
                                  </Button>
                                  <PriceHistory flightId={result.id || result._id} />
                                </>
                              )}
                            </div>
                          );
                        })()}
                        {cancelledBookings[result.id || result._id] && (
                          <p className="text-red-600 font-semibold mb-2">
                            Booking Status: Cancelled
                          </p>
                        )}



                        <div className="flex gap-2 mt-4">

                          <Button
                            className="flex-1"
                            onClick={() =>
                              handlebooknow(
                                result.id || result._id
                              )
                            }
                          >
                            Book Now
                          </Button>

                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/flight-status/${result.id || result._id}`
                              )
                            }
                          >
                            Live Status

                          </Button>

                        </div>
                        <SeatSelection
                          flightId={result.id || result._id}
                          travelers={travelers}
                        />

                        <Button
                          className="w-full mt-2"
                          variant="outline"
                          onClick={() =>
                            setShowCancellation((prev) => ({
                              ...prev,
                              [result.id || result._id]:
                                !prev[result.id || result._id],
                            }))
                          }
                        >
                          Cancel Booking
                        </Button>

                        {showCancellation[result.id || result._id] && (
                          <div className="mt-4 border rounded-lg p-4 bg-gray-50">

                            <p className="font-semibold mb-3">
                              Cancel Booking
                            </p>

                            <select
                              className="w-full border rounded-md p-2"
                              value={
                                cancellationReason[result.id || result._id] || ""
                              }
                              onChange={(e) =>
                                setCancellationReason((prev) => ({
                                  ...prev,
                                  [result.id || result._id]: e.target.value,
                                }))
                              }
                            >
                              <option value="">
                                Select cancellation reason
                              </option>

                              <option value="Change of plans">
                                Change of plans
                              </option>

                              <option value="Found a better option">
                                Found a better option
                              </option>

                              <option value="Personal reasons">
                                Personal reasons
                              </option>

                              <option value="Travel plan changed">
                                Travel plan changed
                              </option>

                              <option value="Other">
                                Other
                              </option>
                            </select>

                            <Button
                              className="w-full mt-3"
                              onClick={async () => {
                                const reason =
                                  cancellationReason[
                                  result.id || result._id
                                  ];

                                if (!reason) {
                                  alert(
                                    "Please select a cancellation reason."
                                  );
                                  return;
                                }

                                const refund = await calculateRefund(
                                  result.price,
                                  new Date().toISOString().slice(0, 19),
                                  reason
                                );

                                if (refund) {
                                  const bookingId =
                                    result.id || result._id;

                                  setRefundDetails((prev) => ({
                                    ...prev,
                                    [bookingId]: refund,
                                  }));

                                  setRefundStatuses((prev) => ({
                                    ...prev,
                                    [bookingId]: "Pending",
                                  }));

                                  setCancelledBookings((prev) => ({
                                    ...prev,
                                    [bookingId]: true,
                                  }));
                                }
                              }}
                            >
                              Calculate Refund
                            </Button>

                            {refundDetails[result.id || result._id] && (
                              <div className="mt-4 p-3 bg-white border rounded-lg">

                                <p>
                                  Booking Amount: ₹
                                  {
                                    refundDetails[
                                      result.id || result._id
                                    ].bookingAmount
                                  }
                                </p>

                                <p>
                                  Refund Percentage:{" "}
                                  {
                                    refundDetails[
                                      result.id || result._id
                                    ].refundPercentage
                                  }%
                                </p>

                                <p className="font-bold mt-1">
                                  Refund Amount: ₹
                                  {
                                    refundDetails[
                                      result.id || result._id
                                    ].refundAmount
                                  }
                                </p>

                                <p className="text-sm text-gray-600 mt-2">
                                  {
                                    refundDetails[
                                      result.id || result._id
                                    ].policyMessage
                                  }
                                </p>

                                <p className="text-sm mt-2">
                                  Refund Status:{" "}
                                  <span className="font-semibold text-green-600">
                                    {
                                      refundStatuses[
                                      result.id || result._id
                                      ] || "Pending"
                                    }
                                  </span>
                                </p>

                                <div className="mt-3">

                                  <p className="text-sm font-semibold mb-2">
                                    Refund Status Tracker
                                  </p>

                                  {(() => {
                                    const bookingId =
                                      result.id || result._id;

                                    const currentStatus =
                                      refundStatuses[bookingId] ||
                                      "Pending";

                                    const isProcessed =
                                      currentStatus === "Processed" ||
                                      currentStatus === "Completed";

                                    const isCompleted =
                                      currentStatus === "Completed";

                                    return (
                                      <div className="flex justify-between text-xs">

                                        <span className="font-semibold text-blue-600">
                                          ✓ Pending
                                        </span>

                                        <span
                                          className={
                                            isProcessed
                                              ? "font-semibold text-blue-600"
                                              : "text-gray-400"
                                          }
                                        >
                                          →{" "}
                                          {isProcessed
                                            ? "✓ Processed"
                                            : "Processed"}
                                        </span>

                                        <span
                                          className={
                                            isCompleted
                                              ? "font-semibold text-blue-600"
                                              : "text-gray-400"
                                          }
                                        >
                                          →{" "}
                                          {isCompleted
                                            ? "✓ Completed"
                                            : "Completed"}
                                        </span>

                                      </div>
                                    );
                                  })()}

                                </div>

                                <p className="text-sm text-gray-500 mt-2">
                                  {
                                    refundDetails[
                                      result.id || result._id
                                    ].expectedTimeline
                                  }
                                </p>

                              </div>
                            )}

                          </div>
                        )}

                      </>
                    ) : (

                      <>

                        <h3 className="font-semibold text-lg">
                          {result.hotelName}
                        </h3>

                        <p className="text-gray-600">
                          City: {result.location}
                        </p>

                        <p className="text-lg font-bold mt-2">
                          ₹{result.pricePerNight} per night
                        </p>


                        <Button
                          className="w-full mt-4"
                          onClick={() =>
                            handlebooknow(
                              result.id || result._id
                            )
                          }
                        >
                          Book Now
                        </Button>
                      </>
                    )}

                  </div>
                ))}

              </div>
            ) : (
              <p className="text-gray-600">
                No {bookingtype} available for the selected criteria.
              </p>
            )}

          </div>
        </div >

        {/* ================= LIVE FLIGHT STATUS ================= */}
        < div className="max-w-7xl mx-auto px-4 mt-8" >

          <div className="bg-white rounded-xl shadow-lg p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-2xl font-bold">
                  Live Flight Status
                </h2>

                <p className="text-gray-500 mt-1">
                  Track multiple flights with live status and updated arrival times.
                </p>
              </div>

              <Plane className="w-8 h-8 text-blue-600" />

            </div>

            {liveFlights.length === 0 ? (
              <p className="text-gray-500">
                No flights available for live tracking.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                {liveFlights.map((liveFlight) => {

                  const status = liveFlight.status || "On Time";

                  const statusClass =
                    status === "Delayed by 1h"
                      ? "text-red-600 bg-red-50"
                      : status === "Boarding"
                        ? "text-orange-600 bg-orange-50"
                        : "text-green-600 bg-green-50";

                  return (
                    <div
                      key={liveFlight.id || liveFlight._id}
                      className="border rounded-xl p-5"
                    >

                      <div className="flex justify-between items-start mb-4">

                        <div>
                          <h3 className="font-bold text-lg">
                            {liveFlight.flightName || "Flight"}
                          </h3>

                          <p className="text-gray-500">
                            {liveFlight.from} → {liveFlight.to}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${statusClass}`}
                        >
                          {status}
                        </span>

                      </div>

                      {status === "Delayed by 1h" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">

                          <p className="font-semibold text-red-700">
                            Delay Reason
                          </p>

                          <p className="text-sm text-red-600 mt-1">
                            {liveFlight.delayReason || "Reason not provided"}
                          </p>

                        </div>
                      )}

                      <div className="space-y-3">

                        <div>
                          <p className="text-xs text-gray-500">
                            Departure
                          </p>

                          <p className="font-semibold">
                            {formatDate(
                              liveFlight.revisedDepartureTime ||
                              liveFlight.departureTime
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Estimated Arrival
                          </p>

                          <p className="font-semibold">
                            {formatDate(
                              liveFlight.estimatedArrivalTime ||
                              liveFlight.revisedArrivalTime ||
                              liveFlight.arrivalTime
                            )}
                          </p>
                        </div>

                      </div>

                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/flight-status/${liveFlight.id || liveFlight._id
                            }`
                          )
                        }
                      >
                        View Details
                      </Button>

                    </div>
                  );
                })}

              </div>
            )}

            <p className="text-xs text-gray-400 text-center mt-5">
              Live information refreshes automatically every 10 seconds.
            </p>

          </div>
        </div >

        {/* ================= CONTENT ================= */}
        < div className="max-w-7xl mx-auto px-4" >

          {/* OFFERS */}
          < section className="my-16" >

            <h2 className="text-2xl font-bold mb-8 text-white">
              Best Offers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {offers.map((offer, index) => (
                <OfferCard
                  key={index}
                  {...offer}
                />
              ))}

            </div>
          </section >

          {/* COLLECTIONS */}
          < section className="my-16" >

            <div className="flex justify-between items-center mb-8">

              <h2 className="text-2xl font-bold text-white">
                Handpicked Collections for You
              </h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {collections.map((collection, index) => (
                <CollectionCard
                  key={index}
                  {...collection}
                />
              ))}

            </div>
          </section >
          {/* PERSONALIZED RECOMMENDATIONS */}
          <Recommendations />

          {/* WONDERS */}
          < section className="my-16" >

            <div className="flex justify-between items-center mb-8">

              <h2 className="text-2xl font-bold text-white">
                Unlock Lesser-Known Wonders of India
              </h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {wonders.map((wonder, index) => (
                <WonderCard
                  key={index}
                  {...wonder}
                />
              ))}

            </div>
          </section >

          {/* DOWNLOAD APP */}
          < DownloadApp />

        </div >
      </main >
    </div >
  );
}

/* ================= OFFER CARD ================= */

const OfferCard = ({
  title,
  description,
  imageUrl,
}: any) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">

      <img
        src={imageUrl}
        alt={title}
        className="w-full h-48 object-cover"
      />

      <div className="p-4">

        <h3 className="font-semibold text-lg mb-2">
          {title}
        </h3>

        <p className="text-gray-600 text-sm">
          {description}
        </p>

        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Book Now
        </button>

      </div>
    </div>
  );
};

/* ================= COLLECTION CARD ================= */

const CollectionCard = ({
  title,
  imageUrl,
  tag,
}: any) => {
  return (
    <div className="relative group cursor-pointer overflow-hidden rounded-lg">

      <img
        src={imageUrl}
        alt={title}
        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70">

        <div className="absolute top-4 left-4">

          <span className="bg-white text-black text-sm font-semibold px-2 py-1 rounded">
            {tag}
          </span>

        </div>

        <div className="absolute bottom-4 left-4 right-4">

          <h3 className="text-white text-lg font-semibold">
            {title}
          </h3>

        </div>

      </div>
    </div>
  );
};

/* ================= DOWNLOAD APP ================= */

const DownloadApp = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto my-12">

      <div className="flex flex-col md:flex-row items-center justify-between">

        <div className="mb-6 md:mb-0">

          <h3 className="text-xl font-bold mb-2">
            Download App Now!
          </h3>

          <p className="text-gray-600 mb-4">
            Get India's #1 travel super app with best deals on flights
          </p>

          <div className="flex space-x-4">

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
              alt="App Store"
              className="h-10"
            />

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
              alt="Play Store"
              className="h-10"
            />

          </div>
        </div>

        <div className="flex items-center space-x-4">

          <QrCode className="w-24 h-24" />

          <p className="text-sm text-gray-600">
            Scan QR code to download the app
          </p>

        </div>

      </div>
    </div>
  );
};

/* ================= WONDER CARD ================= */

const WonderCard = ({
  title,
  imageUrl,
}: any) => {
  return (
    <div className="relative group cursor-pointer overflow-hidden rounded-lg">

      <img
        src={imageUrl}
        alt={title}
        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70">

        <div className="absolute bottom-4 left-4 right-4">

          <h3 className="text-white text-lg font-semibold">
            {title}
          </h3>

        </div>

      </div>
    </div>
  );
};

/* ================= NAV ITEM ================= */

function NavItem({
  icon,
  text,
  active = false,
  onClick,
}: any) {
  return (
    <button
      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${active
        ? "text-blue-500"
        : "text-gray-600 hover:text-blue-500"
        }`}
      onClick={onClick}
    >
      {icon}

      <span className="text-sm mt-1 whitespace-nowrap">
        {text}
      </span>
    </button>
  );
}

/* ================= SEARCH INPUT ================= */

function SearchInput({
  icon,
  placeholder,
  value,
  onChange,
  subtitle,
  type = "text",
}: any) {
  return (
    <div className="border rounded-lg p-3 hover:border-blue-500 cursor-pointer h-full">

      <div className="flex items-center space-x-2">

        {icon}

        <div className="flex-1 min-w-0">

          <div className="text-sm text-gray-500 truncate">
            {placeholder}
          </div>

          <input
            type={type}
            value={value}
            onChange={onChange}
            className="font-semibold w-full bg-transparent outline-none"
            placeholder={placeholder}
          />

          <div className="text-xs text-gray-400 truncate">
            {subtitle}
          </div>

        </div>
      </div>
    </div>
  );
}