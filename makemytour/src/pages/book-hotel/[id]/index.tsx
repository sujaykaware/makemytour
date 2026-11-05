import ReviewSection from "@/components/ReviewSection";
import RoomSelection, { RoomChoice } from "@/components/RoomSelection";
import { useRouter } from "next/router";

import {
  Star,
  MapPin,
  School as Pool,
  UtensilsCrossed,
  Wine,
  Power,
  ChevronRight,
  Camera,
  Image,
  CreditCard,
  Ticket,
  Home,
} from "lucide-react";

import { useEffect, useState } from "react";
import { gethotel, handlehotelbooking } from "@/api";

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

import { useDispatch, useSelector } from "react-redux";
import SignupDialog from "@/components/ui/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";

interface Hotel {
  id: string;
  hotelName: string;
  location: string;
  pricePerNight: number;
  availableRooms: number;
  amenities: string;
}
const IMAGE_SETS = [
  [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800",
  ],
  [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800",
  ],
  [
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800",
  ],
  [
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800",
  ],
];

const BookHotelPage = () => {
  const [roomChoices, setRoomChoices] = useState<RoomChoice[]>([]);
  const [hotels, sethotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setopem] = useState(false);
  const [reviewStats, setReviewStats] = useState({ avg: 0, count: 0 });

  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);

  const id = typeof router.query.id === "string" ? router.query.id : "";

  // ==========================================
  // FETCH HOTEL
  // ==========================================
  useEffect(() => {
    if (!id) return;

    const fetchhotels = async () => {
      try {
        const data = await gethotel();
        const list = Array.isArray(data) ? data : [];
        const filteredData = list.filter(
          (h: any) => String(h.id).trim() === String(id).trim()
        );
        sethotels(filteredData);
      } catch (error) {
        console.error("Error fetching hotels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchhotels();
  }, [id]);
  useEffect(() => {
    if (!id) return;

    const loadStats = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(
          `${API_URL}/reviews/${encodeURIComponent(id)}`
        );
        if (!res.ok) return;
        const list = await res.json();

        if (Array.isArray(list) && list.length > 0) {
          const sum = list.reduce(
            (s: number, r: any) => s + (Number(r.rating) || 0),
            0
          );
          setReviewStats({
            avg: Math.round((sum / list.length) * 10) / 10,
            count: list.length,
          });
        } else {
          setReviewStats({ avg: 0, count: 0 });
        }
      } catch (e) {
        console.error("Review stats error:", e);
      }
    };

    loadStats();
    const timer = setInterval(loadStats, 15000);
    return () => clearInterval(timer);
  }, [id]);
  if (loading || !id) {
    return <Loader />;
  }

  const hotel = hotels[0];

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 text-lg">Hotel not found.</p>
        <p className="text-sm text-gray-400 mt-2">Hotel ID: {id}</p>
      </div>
    );
  }
  const setIndex =
    String(hotel.id)
      .split("")
      .reduce((s, ch) => s + ch.charCodeAt(0), 0) % IMAGE_SETS.length;
  const images = IMAGE_SETS[setIndex];

  // ==========================================
  // STATIC HOTEL UI DATA
  // ==========================================
  const hotelData = {
    rating: Math.round(reviewStats.avg),
    maxRating: 5,
    propertyPhotos: 91,
    guestPhotos: 386,
    description: `One of the best hotels in ${hotel.location}, offering comfortable stays, modern facilities, and a convenient location for both business and leisure travelers.`,
    amenities: [
      { icon: <Pool className="w-5 h-5" />, name: "Swimming Pool" },
      { icon: <UtensilsCrossed className="w-5 h-5" />, name: "Restaurant" },
      { icon: <Wine className="w-5 h-5" />, name: "Bar" },
      { icon: <Power className="w-5 h-5" />, name: "Power Backup" },
    ],
    room: {
      type: "Standard Room",
      capacity: "Fits 2 Adults",
      features: [
        "No meals included",
        "10% off on food & beverage services",
        "Complimentary welcome drinks on arrival",
        "Non-Refundable",
      ],
    },
    reviews: {
      rating: reviewStats.count > 0 ? reviewStats.avg : "–",
      count: reviewStats.count,
      text:
        reviewStats.count === 0
          ? "No reviews yet"
          : reviewStats.avg >= 4.5
            ? "Excellent"
            : reviewStats.avg >= 4
              ? "Very Good"
              : reviewStats.avg >= 3
                ? "Good"
                : reviewStats.avg >= 2
                  ? "Average"
                  : "Poor",
    },
  };

  // ==========================================
  // PRICE (only from the rooms the user picked)
  // ==========================================
  const totalRooms = roomChoices.reduce((sum, c) => sum + c.quantity, 0);

  const totalPrice = roomChoices.reduce(
    (sum, c) => sum + c.quantity * c.pricePerNight,
    0
  );

  const grandTotal = totalPrice;

  const roomsLabel = roomChoices
    .map((c) => `${c.roomType} × ${c.quantity}`)
    .join(", ");

  // ==========================================
  // HOTEL BOOKING
  // ==========================================
  const handlebooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      alert("Please log in first.");
      return;
    }

    if (totalRooms === 0) {
      alert("Please select at least one room.");
      return;
    }

    try {
      const data = await handlehotelbooking(
        user.id,
        hotel.id,
        totalRooms,
        grandTotal,
        roomChoices.map((c) => `${c.roomId}:${c.quantity}`).join(",")
      );

      console.log("HOTEL BOOKING RESPONSE:", data);

      if (!data || data.error) {
        alert(
          "Booking failed: " +
          (data?.error || data?.message || "server rejected the request")
        );
        return;
      }

      dispatch(
        setUser({
          ...user,
          bookings: [...(user?.bookings || []), data],
        })
      );

      setopem(false);
      router.push("/profile");
    } catch (error: any) {
      console.error("Hotel booking failed:", error);
      alert(
        "Hotel booking failed: " +
        (error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "unknown error")
      );
    }
  };

  // ==========================================
  // BOOKING DIALOG
  // ==========================================
  const HotelContent = () => (
    <DialogContent className="sm:max-w-[600px] bg-white">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Home className="w-6 h-6 mr-2" />
          Hotel Booking Details
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hotelName" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Hotel Name
            </Label>
            <Input id="hotelName" value={hotel.hotelName || ""} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </Label>
            <Input id="location" value={hotel.location || ""} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rooms" className="flex items-center">
              <Ticket className="w-4 h-4 mr-2" />
              Rooms Selected
            </Label>
            <Input id="rooms" value={roomsLabel} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalRooms" className="flex items-center">
              <Ticket className="w-4 h-4 mr-2" />
              Total Rooms
            </Label>
            <Input id="totalRooms" value={totalRooms} readOnly />
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Fare Summary
          </h3>

          <div className="space-y-2">
            {roomChoices.map((c) => (
              <div
                key={c.roomId}
                className="flex justify-between items-center"
              >
                <span className="text-gray-600">
                  {c.roomType} × {c.quantity}
                </span>
                <span className="font-medium">
                  ₹ {(c.quantity * c.pricePerNight).toLocaleString("en-IN")}
                </span>
              </div>
            ))}

            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-lg">
                  ₹ {grandTotal.toLocaleString("en-IN")}
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

  // ==========================================
  // PAGE
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <a href="/" className="text-blue-500">
              Home
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <a href="/" className="text-blue-500">
              {hotel.location}
            </a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{hotel.hotelName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{hotel.hotelName}</h1>

              <div className="flex items-center space-x-1">
                {[...Array(hotelData.rating)].map((_, i) => (
                  <Star
                    key={`f${i}`}
                    className="w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}
                {[...Array(hotelData.maxRating - hotelData.rating)].map(
                  (_, i) => (
                    <Star key={`e${i}`} className="w-5 h-5 text-gray-300" />
                  )
                )}
              </div>
            </div>

            {/* Image Gallery */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="col-span-2 relative group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800"
                  alt="Hotel Main"
                  className="w-full h-80 object-cover rounded-lg"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full flex items-center space-x-1">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">
                    +{hotelData.propertyPhotos} Property Photos
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative group cursor-pointer">
                  <img
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800"
                    alt="Hotel Room"
                    className="w-full h-[152px] object-cover rounded-lg"
                  />
                </div>

                <div className="relative group cursor-pointer">
                  <img
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800"
                    alt="Hotel Amenity"
                    className="w-full h-[152px] object-cover rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full flex items-center space-x-1">
                    <Image className="w-4 h-4" />
                    <span className="text-sm">
                      +{hotelData.guestPhotos} Guest Photos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              {hotelData.description}
              <button className="text-blue-500 ml-2">Read more</button>
            </p>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>

              <div className="flex flex-wrap gap-6">
                {hotelData.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-gray-600"
                  >
                    {amenity.icon}
                    <span>{amenity.name}</span>
                  </div>
                ))}
                <button className="text-blue-500">+ 31 Amenities</button>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                {roomChoices.length ? roomsLabel : hotelData.room.type}
              </h3>

              <p className="text-gray-600 mb-4">
                {roomChoices.length
                  ? `${totalRooms} room${totalRooms === 1 ? "" : "s"} selected`
                  : hotelData.room.capacity}
              </p>

              <ul className="space-y-3 mb-6">
                {hotelData.room.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-800 font-semibold">
                    Price Per Night:
                  </span>
                  <span className="text-lg font-medium text-gray-800">
                    ₹ {totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-800 font-semibold">
                    Available Rooms:
                  </span>
                  <span className="text-lg font-medium text-gray-800">
                    {hotel.availableRooms || 0}
                  </span>
                </div>

                <div>
                  <h4 className="text-gray-800 font-semibold mb-2">
                    Amenities:
                  </h4>
                  <p className="text-gray-600">
                    {hotel.amenities || "Not available"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between text-2xl font-bold">
                  <span>₹ {grandTotal.toLocaleString("en-IN")}</span>
                  <span className="text-sm text-gray-500 font-normal">
                    total
                  </span>
                </div>
              </div>

              <Dialog open={open} onOpenChange={setopem}>
                <DialogTrigger asChild>
                  <button
                    disabled={totalRooms === 0}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors mb-3 disabled:opacity-50"
                  >
                    BOOK THIS NOW
                  </button>
                </DialogTrigger>

                {user ? (
                  <HotelContent />
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

              {totalRooms === 0 && (
                <p className="text-xs text-gray-500 text-center mb-2">
                  Select at least one room below to continue.
                </p>
              )}
            </div>

            {/* Rating Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500 text-white text-2xl font-bold w-16 h-16 rounded-lg flex items-center justify-center">
                    {hotelData.reviews.rating}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {hotelData.reviews.text}
                    </div>
                    <div className="text-gray-500">
                      ({hotelData.reviews.count} ratings)
                    </div>
                  </div>
                </div>
                <a href="#" className="text-blue-500">
                  All Reviews
                </a>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg mb-1">
                  {hotel.location}
                </h3>
                <button className="text-blue-500">See on Map</button>
              </div>
            </div>
          </div>
        </div>

        {/* Room selection */}
        <RoomSelection hotelId={hotel.id} onRoomsChange={setRoomChoices} />

        <ReviewSection itemId={hotel.id} itemType="HOTEL" />
      </div>
    </div>
  );
};

export default BookHotelPage;