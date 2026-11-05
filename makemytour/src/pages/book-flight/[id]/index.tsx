import ReviewSection from "@/components/ReviewSection";
import { useRouter } from "next/router";
import {
  Plane,
  Luggage,
  Clock,
  Calendar,
  MapPin,
  Gift,
  CreditCard,
  AlertCircle,
  Star,
  Info,
  ArrowRight,
  TrendingUp,
  Lock,
  History,
  Ticket,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getflight,
  handleflightbooking,
  getDynamicPrice,
  freezePrice,
  getPriceHistory,
} from "@/api";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignupDialog from "@/components/ui/SignupDialog";
import SeatSelection from "@/components/SeatSelection";
import Loader from "@/components/Loader";
import { setUser } from "@/store";

interface Flight {
  id: string;
  flightName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
}

interface PriceHistoryItem {
  price: number;
  time?: string;
  timestamp?: string;
}

const BookFlightPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [seatPrice, setSeatPrice] = useState(0);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]);
  const [appliedPromo] = useState("");
  const [open, setopem] = useState(false);

  const user = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();
  const [pricing, setPricing] = useState<any>(null);
  const userId = user?.id ?? "guest";

  // Use the traveler count chosen on the home page
  useEffect(() => {
    if (!router.isReady) return;
    const travelers = Number(router.query.travelers);
    if (travelers >= 1) {
      setQuantity(Math.min(travelers, 9));
    }
  }, [router.isReady, router.query.travelers]);

  // =========================
  // DYNAMIC PRICING STATES
  // =========================
  const [demand, setDemand] = useState(50);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [priceFrozen, setPriceFrozen] = useState(false);
  const [freezeSeconds, setFreezeSeconds] = useState(0);
  const [freezeMessage, setFreezeMessage] = useState("");
  const [pricingLoading, setPricingLoading] = useState(false);

  // =========================
  // FETCH FLIGHT
  // =========================
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const data = await getflight();
        const filteredData = (Array.isArray(data) ? data : []).filter(
          (f: any) => f.id === id
        );
        setFlights(filteredData);
      } catch (error) {
        console.error("Error fetching flights:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFlights();
    }
  }, [id, user]);

  // =========================
  // DYNAMIC PRICING
  // =========================
  useEffect(() => {
    if (!id || flights.length === 0) return;

    const f = flights[0];
    let cancelled = false;

    const load = async () => {
      try {
        const p = await getDynamicPrice(f.id, userId, f.price, 80, true);
        const h = await getPriceHistory(f.id);

        if (cancelled) return;

        setPricing(p);
        setDemand(p.demand);
        setPriceHistory(Array.isArray(h) ? h : []);

        // restore the freeze after a page refresh
        if (p.frozen) {
          setPriceFrozen(true);
          setFreezeSeconds(Math.floor(p.remainingSeconds));
        } else {
          setPriceFrozen(false);
        }
      } catch (e) {
        console.error("Pricing error:", e);
      }
    };

    setPricingLoading(true);
    load().finally(() => setPricingLoading(false));

    const timer = setInterval(load, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id, flights, userId]);

  // =========================
  // PRICE HISTORY REFRESH
  // =========================
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!id || flights.length === 0) return;

      try {
        const history = await getPriceHistory(flights[0].id);
        if (Array.isArray(history)) {
          setPriceHistory(history);
        }
      } catch (error) {
        console.error("Price history refresh error:", error);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [id, flights]);

  // =========================
  // PRICE FREEZE
  // =========================
  const handleFreezePrice = async () => {
    if (!flights[0] || priceFrozen) return;

    try {
      const f = flights[0];
      const result = await freezePrice(f.id, userId, f.price, 80, true);

      setPriceFrozen(true);
      setFreezeSeconds(Number(result.remainingSeconds));
      setFreezeMessage(
        `Price of ₹${Number(result.frozenPrice).toLocaleString(
          "en-IN"
        )} frozen for 15 minutes.`
      );
    } catch (error) {
      console.error("Price freeze error:", error);
      setFreezeMessage("Unable to freeze the price. It may already be frozen.");
    }
  };
  useEffect(() => {
    if (!priceFrozen) return;
    const t = setInterval(() => {
      setFreezeSeconds((s) => {
        if (s <= 1) {
          setPriceFrozen(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [priceFrozen]);
  if (loading) {
    return <Loader />;
  }

  if (flights.length === 0) {
    return <div className="p-8">No flight data available for this ID.</div>;
  }

  const flight = flights[0];

  // =========================
  // FLIGHT DETAILS
  // =========================
  const flightDetails = {
    flightNo: "IX 2747",
    aircraft: "Airbus A320",
    duration: "3h 0m",
    cabinBaggage: "7 Kgs / Adult",
    checkInBaggage: "15 Kgs (1 piece only) / Adult",
  };

  const fareSummary = {
    taxes: 1374,
    otherServices: 249,
    discounts: -250,
  };

  // =========================
  // PROMO OFFERS
  // =========================
  const promoOffers = [
    {
      code: "MMTSECURE",
      description:
        "Get an instant discount of ₹299 on your flight booking and Trip Secure with this coupon!",
      amount: 299,
    },
    {
      code: "SPECIALUPI",
      description:
        "Use this code and get ₹362 instant discount on payments via UPI only!",
      amount: 362,
    },
  ];

  // =========================
  // HOTEL OFFERS
  // =========================
  const hotels = [
    {
      name: "Hotel Park Tree",
      rating: 4,
      price: 9000,
      image:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800",
      location: "Near Airport, New Delhi",
    },
    {
      name: "Lemon Tree Premier",
      rating: 4,
      price: 43875,
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800",
      location: "Connaught Place, New Delhi",
    },
    {
      name: "Hotel Kian",
      rating: 4,
      price: 1968,
      image:
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800",
      location: "Karol Bagh, New Delhi",
    },
  ];

  // =========================
  // DATE FORMAT
  // =========================
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    const date = new Date(dateString);
    return date.toLocaleString("en-US", options);
  };

  // =========================
  // QUANTITY
  // =========================
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const value = Number.parseInt(e.target.value);
    setQuantity(
      isNaN(value) ? 1 : Math.max(1, Math.min(value, flight.availableSeats))
    );
  };

  // =========================
  // FARE CALCULATION (based on the seats picked)
  // =========================
  const basePrice = pricing?.currentPrice ?? flight.price;
  const seatsPicked = selectedSeatNumbers.length;

  const totalPrice = basePrice * seatsPicked;
  const totalTaxes = fareSummary.taxes * seatsPicked;
  const totalOtherServices = fareSummary.otherServices * seatsPicked;
  const totalSeatPrice = seatPrice;

  const baseDiscount = Math.abs(fareSummary.discounts) * seatsPicked;
  const promoDiscount =
    appliedPromo === "MMTSECURE" && seatsPicked > 0 ? 299 : 0;
  const totalDiscounts = baseDiscount + promoDiscount;

  const grandTotal = Math.max(
    0,
    totalPrice + totalTaxes + totalOtherServices + totalSeatPrice - totalDiscounts
  );

  // =========================
  // BOOKING
  // =========================
  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      alert("Please log in first.");
      return;
    }

    try {
      const data = await handleflightbooking(
        user.id,
        flight?.id,
        quantity,
        grandTotal,
        selectedSeatNumbers
      );

      console.log("NEW BOOKING RESPONSE:", data);

      if (!data || data.error || data.status >= 400) {
        alert(
          "Booking failed: " +
          (data?.error || data?.message || "server rejected the request")
        );
        return;
      }

      const updateuser = {
        ...user,
        bookings: [...(user?.bookings || []), data],
      };

      dispatch(setUser(updateuser));
      setopem(false);
      setQuantity(1);
      setSelectedSeatNumbers([]);
      router.push("/profile");
    } catch (error: any) {
      console.error("Booking error:", error);
      alert(
        "Booking failed: " +
        (error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "unknown error")
      );
    }
  };

  // =========================
  // BOOKING DIALOG
  // =========================
  const BookingContent = () => (
    <DialogContent className="sm:max-w-[600px] bg-white">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Plane className="w-6 h-6 mr-2" />
          Flight Booking Details
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="flightName" className="flex items-center">
              <Plane className="w-4 h-4 mr-2" />
              Flight Name
            </Label>
            <Input id="flightName" value={flight?.flightName} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="from" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              From
            </Label>
            <Input id="from" value={flight?.from} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              To
            </Label>
            <Input id="to" value={flight?.to} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="departureTime" className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Departure Time
            </Label>
            <Input
              id="departureTime"
              value={new Date(flight.departureTime).toLocaleString()}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="arrivalTime" className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Arrival Time
            </Label>
            <Input
              id="arrivalTime"
              value={new Date(flight.arrivalTime).toLocaleString()}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="flex items-center">
              <Ticket className="w-4 h-4 mr-2" />
              Number of Tickets
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={flight.availableSeats}
              value={quantity}
              onChange={handleQuantityChange}
            />
          </div>
        </div>

        {/* BOOKING FARE SUMMARY */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Fare Summary
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Base Fare</span>
              <span className="font-medium">
                ₹ {totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taxes and Surcharges</span>
              <span className="font-medium">
                ₹ {totalTaxes.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Other Services</span>
              <span className="font-medium">
                ₹ {totalOtherServices.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Seat Charges</span>
              <span className="font-medium">
                ₹ {totalSeatPrice.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between items-center text-green-600">
              <span className="font-medium">Discounts</span>
              <span className="font-medium">
                - ₹ {Math.abs(totalDiscounts).toLocaleString()}
              </span>
            </div>

            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-lg">
                  ₹ {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button className="w-full mt-4" onClick={handlebooking}>
        Proceed to Payment
      </Button>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ========================= */}
          {/* MAIN CONTENT */}
          {/* ========================= */}
          <div className="lg:col-span-2 space-y-6">
            {/* FLIGHT DETAILS */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <div className="flex items-center flex-wrap gap-4 mb-2">
                    <h2 className="text-lg font-bold flex items-center">
                      <span>{flight?.from}</span>
                      <ArrowRight className="w-5 h-5 mx-2" />
                      <span>{flight?.to}</span>
                    </h2>
                    <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-medium">
                      CANCELLATION FEES APPLY
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(flight.departureTime)}</span>
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Non Stop - {flightDetails.duration}</span>
                  </div>
                </div>

                <button className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center">
                  <Info className="w-4 h-4 mr-1" />
                  View Fare Rules
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">{flight.flightName}</div>
                  <div className="text-sm text-gray-600">
                    {flightDetails.flightNo} • {flightDetails.aircraft}
                  </div>
                </div>
                <div className="ml-auto text-sm">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                    Economy
                  </span>
                  <span className="ml-2 text-gray-600">MMTSPECIAL</span>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-nowrap justify-between items-start gap-6 border-t pt-6">
                <div>
                  <div className="text-2xl font-bold">
                    {formatDate(flight.departureTime)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex items-start">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                    {flight.from} International Airport, Terminal T2
                  </div>
                </div>

                <div className="text-center flex-shrink-0">
                  <div className="text-sm text-gray-600 mb-1">
                    {flightDetails.duration}
                  </div>
                  <div className="w-32 h-0.5 bg-gray-300 relative my-2">
                    <div className="absolute -top-2 right-0 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                      <Plane className="w-3 h-3 text-gray-600" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Non-stop</div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatDate(flight.arrivalTime)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 flex items-start justify-end">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                    {flight.to} International Airport, Terminal T3
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Luggage className="w-5 h-5 mr-2 text-gray-500" />
                  <span>Cabin Baggage: {flightDetails.cabinBaggage}</span>
                </div>
                <div className="flex items-center">
                  <Luggage className="w-5 h-5 mr-2 text-gray-500" />
                  <span>Check-in Baggage: {flightDetails.checkInBaggage}</span>
                </div>
              </div>
            </div>

            {/* ========================= */}
            {/* SEAT SELECTION */}
            {/* ========================= */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold mb-4">Select Your Seat</h2>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-medium">Travelers</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </Button>
                <span className="w-6 text-center font-semibold">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setQuantity(Math.min(flight.availableSeats, quantity + 1))
                  }
                >
                  +
                </Button>
              </div>

              <SeatSelection
                flightId={flight.id}
                travelers={quantity}
                onPriceChange={setSeatPrice}
                onSeatsChange={setSelectedSeatNumbers}
              />
            </div>

            {/* ========================= */}
            {/* DYNAMIC PRICING */}
            {/* ========================= */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Dynamic Pricing
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Fare changes based on demand and peak-season pricing.
                  </p>
                </div>
                {pricingLoading && (
                  <span className="text-sm text-gray-500">Updating...</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Base Price</p>
                  <p className="text-xl font-bold mt-1">
                    ₹ {flight.price.toLocaleString()}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-600">Current Price</p>
                  {priceFrozen &&
                    pricing &&
                    pricing.marketPrice !== pricing.currentPrice && (
                      <p className="text-xs text-gray-500 mt-1">
                        Live fare: ₹{" "}
                        {Number(pricing.marketPrice).toLocaleString("en-IN")}
                      </p>
                    )}
                  <p className="text-xl font-bold text-blue-700 mt-1">
                    ₹ {basePrice.toLocaleString()}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-orange-600">Current Demand</p>
                  <p className="text-xl font-bold text-orange-700 mt-1">
                    {demand >= 80 ? "High" : demand >= 50 ? "Medium" : "Low"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Demand level: {demand}%
                  </p>
                </div>
              </div>

              {pricing?.peakSeason && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="font-semibold text-yellow-800">
                        Peak / Holiday Pricing
                      </p>
                      <p className="text-sm text-yellow-700">
                        {pricing.pricingMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PRICE HISTORY */}
              <div className="mt-6">
                <div className="flex items-center mb-3">
                  <History className="w-5 h-5 mr-2 text-gray-600" />
                  <h3 className="font-semibold">Price History</h3>
                </div>

                {priceHistory.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-500">
                    Price history will appear as the fare is updated.
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-end gap-2 h-44 overflow-x-auto">
                      {(() => {
                        const maxPrice = Math.max(
                          ...priceHistory.map((p) => Number(p.price) || 0),
                          basePrice
                        );

                        return priceHistory.map((item, index) => {
                          const price = Number(item.price) || 0;
                          const barHeight =
                            maxPrice > 0
                              ? Math.max(15, (price / maxPrice) * 100)
                              : 15;
                          const isLatest = index === priceHistory.length - 1;
                          const when = new Date(
                            item.time || item.timestamp || ""
                          );
                          const label = isLatest
                            ? "Now"
                            : isNaN(when.getTime())
                              ? ""
                              : when.toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                              });

                          return (
                            <div
                              key={index}
                              className="min-w-[44px] flex-1 flex flex-col items-center justify-end h-full"
                            >
                              <span className="text-[10px] text-gray-500 mb-1">
                                ₹{price.toLocaleString("en-IN")}
                              </span>
                              <div
                                className={`w-full max-w-[36px] rounded-t-md ${isLatest ? "bg-blue-700" : "bg-blue-500"
                                  }`}
                                style={{ height: `${barHeight}px` }}
                              />
                              <span className="text-[9px] text-gray-400 mt-1 h-6 text-center leading-3">
                                {label}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Latest fare updates are shown automatically.
                    </p>
                  </div>
                )}
              </div>

              {/* PRICE FREEZE */}
              <div className="mt-6 border-t pt-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-green-600" />
                      <h3 className="font-semibold">Price Freeze</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Lock the current fare for 15 minutes.
                    </p>
                  </div>

                  <Button
                    onClick={handleFreezePrice}
                    disabled={priceFrozen || pricingLoading || basePrice <= 0}
                    className={priceFrozen ? "bg-green-600" : "bg-blue-600"}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {priceFrozen ? "Price Frozen" : "Freeze Price"}
                  </Button>
                </div>

                {priceFrozen && freezeSeconds > 0 && (
                  <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
                    {freezeMessage}
                    <p className="mt-2 font-medium">
                      Time remaining: {Math.floor(freezeSeconds / 60)}:
                      {String(freezeSeconds % 60).padStart(2, "0")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ========================= */}
            {/* CANCELLATION POLICY */}
            {/* ========================= */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {(() => {
                const policyAmount =
                  grandTotal > 0 ? grandTotal : Math.round(basePrice * quantity);
                const refund50 = Math.round(policyAmount * 0.5);
                const refund25 = Math.round(policyAmount * 0.25);

                return (
                  <>
                    <h2 className="text-lg font-bold flex items-center mb-6">
                      <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                      Cancellation &amp; Refund Policy
                    </h2>

                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Plane className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-semibold">
                            {flight.from} → {flight.to}
                          </span>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {seatsPicked > 0
                              ? "Your booking total"
                              : `Fare for ${quantity} traveler${quantity === 1 ? "" : "s"}`}
                          </p>
                          <p className="font-bold text-lg">
                            ₹ {policyAmount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {/* Refund timeline bar */}
                      <div className="flex h-2.5 overflow-hidden rounded-full">
                        <div className="w-1/3 bg-green-500" />
                        <div className="w-2/3 bg-yellow-500" />
                      </div>

                      <div className="mt-2 flex text-xs text-gray-600">
                        <span className="w-1/3">Booking time</span>
                        <span className="w-2/3">After 24 hours</span>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                          <p className="text-sm font-semibold text-green-800">
                            Within 24 hours of booking
                          </p>
                          <p className="mt-1 text-2xl font-bold text-green-700">
                            50% refund
                          </p>
                          <p className="text-sm text-green-700">
                            ≈ ₹ {refund50.toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                          <p className="text-sm font-semibold text-yellow-800">
                            After 24 hours of booking
                          </p>
                          <p className="mt-1 text-2xl font-bold text-yellow-700">
                            25% partial refund
                          </p>
                          <p className="text-sm text-yellow-700">
                            ≈ ₹ {refund25.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <ul className="mt-5 space-y-1 text-sm text-gray-600">
                        <li>• The 24-hour window starts when you book, not at departure.</li>
                        <li>• Choose a cancellation reason from the dropdown in My Bookings.</li>
                        <li>
                          • Track your refund there: Pending → Processed → Completed.
                        </li>
                        <li>• Seats are released and the flight becomes available again.</li>
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ========================= */}
            {/* HOTEL OFFERS */}
            {/* ========================= */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-red-500" />
                  Book a Flight & unlock these offers
                </h2>
                <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full font-medium">
                  Flyer Exclusive Deal
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {hotels.map((hotel, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium">
                        Best Seller
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {hotel.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-yellow-400">
                          {[...Array(hotel.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            Starting from
                          </div>
                          <div className="font-bold text-lg">
                            ₹ {hotel.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================= */}
          {/* RIGHT COLUMN */}
          {/* ========================= */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-6 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                Fare Summary
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base Fare</span>
                  <span className="font-medium">
                    ₹ {totalPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxes and Surcharges</span>
                  <span className="font-medium">
                    ₹ {totalTaxes.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Other Services</span>
                  <span className="font-medium">
                    ₹ {totalOtherServices.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Seat Charges</span>
                  <span className="font-medium">
                    ₹ {totalSeatPrice.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between items-center text-green-600">
                  <span className="font-medium">Discounts</span>
                  <span className="font-medium">
                    - ₹ {Math.abs(totalDiscounts).toLocaleString()}
                  </span>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-lg">
                      ₹ {grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* BOOK NOW */}
              <Dialog open={open} onOpenChange={setopem}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-red-600 text-white mt-6 disabled:opacity-50"
                    disabled={selectedSeatNumbers.length !== quantity}
                  >
                    Book Now
                  </Button>
                </DialogTrigger>

                {user ? (
                  <BookingContent />
                ) : (
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Login Required</DialogTitle>
                    </DialogHeader>
                    <p>Please log in to continue with your booking.</p>
                    <SignupDialog
                      trigger={
                        <Button className="w-full">Log In / Sign Up</Button>
                      }
                    />
                  </DialogContent>
                )}
              </Dialog>

              {selectedSeatNumbers.length !== quantity && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Select {quantity - selectedSeatNumbers.length} more seat(s) to
                  continue.
                </p>
              )}

              {/* PROMO CODES */}
              <div className="mt-8">
                <div className="bg-[#FFF8E7] p-6 rounded-xl">
                  <h3 className="font-bold mb-4 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-yellow-600" />
                    PROMO CODES
                  </h3>

                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Enter promo code here"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    />
                  </div>

                  {promoOffers.map((offer, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg mb-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="promo"
                          className="mt-1.5 h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <div className="font-semibold text-red-600">
                            {offer.code}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {offer.description}
                          </p>
                          <button className="text-blue-600 text-sm font-medium mt-2 hover:text-blue-700">
                            Terms & Conditions
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* REVIEWS & RATINGS */}
        {/* ========================= */}
        <ReviewSection itemId={flight.id} itemType="FLIGHT" />
      </div>
    </div>
  );
};

export default BookFlightPage;