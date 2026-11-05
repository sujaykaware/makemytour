"use client";

import { useEffect, useState } from "react";
import { getRooms, selectRoom } from "@/api";
import { X, Maximize2 } from "lucide-react";

type Room = {
  id: string;
  hotelId: string;
  roomType: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  availableRooms: number;
  imageUrl: string;
  amenities: string;
};

type RoomSelectionProps = {
  hotelId: string;
  onRoomChange?: (room: Room) => void;
};

export default function RoomSelection({
  hotelId,
  onRoomChange,
}: RoomSelectionProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] =
    useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  // Room preview state
  const [previewRoom, setPreviewRoom] =
    useState<Room | null>(null);

  const loadRooms = async () => {
    const data = await getRooms(hotelId);

    if (Array.isArray(data)) {
      setRooms(data);

      const savedRoomId =
        localStorage.getItem("preferredRoom");

      if (savedRoomId) {
        const savedRoom = data.find(
          (room: Room) => room.id === savedRoomId
        );

        if (savedRoom) {
          setSelectedRoom(savedRoom);
          onRoomChange?.(savedRoom);
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!hotelId) return;

    loadRooms();

    const timer = setInterval(loadRooms, 10000);

    return () => clearInterval(timer);
  }, [hotelId]);

  const handleRoomSelect = async (room: Room) => {
    if (room.availableRooms <= 0) {
      alert("This room type is currently unavailable.");
      return;
    }

    const updatedRoom = await selectRoom(room.id);

    if (updatedRoom) {
      setSelectedRoom(updatedRoom);

      localStorage.setItem(
        "preferredRoom",
        updatedRoom.id
      );

      onRoomChange?.(updatedRoom);

      await loadRooms();
    }
  };

  if (loading) {
    return (
      <div className="mt-8">
        <p className="text-gray-500">
          Loading room options...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">

      <h2 className="text-2xl font-bold mb-2">
        Select Your Room
      </h2>

      <p className="text-gray-600 mb-6">
        Choose a room type based on your preference and
        budget.
      </p>

      {/* ROOM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {rooms.map((room) => {
          const isSelected =
            selectedRoom?.id === room.id;

          const isAvailable =
            room.availableRooms > 0;

          return (
            <div
              key={room.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm transition ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200"
              }`}
            >

              {/* ROOM IMAGE */}
              <div className="relative">

                <img
                  src={room.imageUrl}
                  alt={room.roomType}
                  className="w-full h-44 object-cover"
                />

                {/* VIEW ROOM BUTTON */}
                <button
                  type="button"
                  onClick={() => setPreviewRoom(room)}
                  className="absolute bottom-3 right-3 bg-white/95 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium shadow hover:bg-white transition flex items-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  View Room
                </button>

              </div>

              <div className="p-4">

                <div className="flex justify-between items-start gap-2">

                  <h3 className="text-lg font-bold">
                    {room.roomType}
                  </h3>

                  {room.roomType !==
                    "Standard Room" && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Upgrade
                    </span>
                  )}

                </div>

                <p className="text-sm text-gray-600 mt-2">
                  {room.description}
                </p>

                <p className="text-sm text-gray-600 mt-2">
                  Fits {room.capacity}{" "}
                  {room.capacity === 1
                    ? "Adult"
                    : "Adults"}
                </p>

                <p className="text-sm text-gray-600 mt-2">
                  {room.amenities}
                </p>

                <div className="mt-4 flex items-center justify-between">

                  <div>
                    <p className="text-lg font-bold">
                      ₹
                      {room.pricePerNight.toLocaleString()}
                    </p>

                    <p className="text-xs text-gray-500">
                      per night
                    </p>
                  </div>

                  <span
                    className={`text-xs font-medium ${
                      isAvailable
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {isAvailable
                      ? `${room.availableRooms} available`
                      : "Sold out"}
                  </span>

                </div>

                {/* SELECT ROOM */}
                <button
                  disabled={!isAvailable}
                  onClick={() =>
                    handleRoomSelect(room)
                  }
                  className={`w-full mt-4 py-2 rounded-lg font-medium ${
                    !isAvailable
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : isSelected
                      ? "bg-green-600 text-white"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {!isAvailable
                    ? "Unavailable"
                    : isSelected
                    ? "Selected"
                    : "Select Room"}
                </button>

              </div>
            </div>
          );
        })}

      </div>

      {/* SELECTED ROOM */}
      {selectedRoom && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">

          <h3 className="font-semibold text-lg">
            Selected Room
          </h3>

          <p className="text-gray-700 mt-1">
            {selectedRoom.roomType} — ₹
            {selectedRoom.pricePerNight.toLocaleString()}
            /night
          </p>

          <p className="text-sm text-gray-600 mt-1">
            Your room preference has been saved for
            future bookings.
          </p>

        </div>
      )}

      {/* ==========================================
          ROOM PREVIEW MODAL
          ========================================== */}

      {previewRoom && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewRoom(null)}
        >

          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b">

              <div>
                <h2 className="text-xl font-bold">
                  {previewRoom.roomType}
                </h2>

                <p className="text-sm text-gray-500">
                  Interactive Room Preview
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewRoom(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* PREVIEW IMAGE */}
            <div className="relative bg-gray-100">

              <img
                src={previewRoom.imageUrl}
                alt={`${previewRoom.roomType} preview`}
                className="w-full h-[420px] object-cover"
              />

              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                Room Preview
              </div>

            </div>

            {/* ROOM DETAILS */}
            <div className="p-6">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Capacity
                  </p>

                  <p className="font-semibold mt-1">
                    {previewRoom.capacity}{" "}
                    {previewRoom.capacity === 1
                      ? "Adult"
                      : "Adults"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Price
                  </p>

                  <p className="font-semibold mt-1">
                    ₹
                    {previewRoom.pricePerNight.toLocaleString()}
                    /night
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Availability
                  </p>

                  <p className="font-semibold mt-1 text-green-600">
                    {previewRoom.availableRooms} available
                  </p>
                </div>

              </div>

              <h3 className="font-semibold text-lg mb-2">
                About this room
              </h3>

              <p className="text-gray-600 mb-4">
                {previewRoom.description}
              </p>

              <h3 className="font-semibold text-lg mb-2">
                Amenities
              </h3>

              <p className="text-gray-600">
                {previewRoom.amenities}
              </p>

              <button
                type="button"
                onClick={() => {
                  setPreviewRoom(null);
                  handleRoomSelect(previewRoom);
                }}
                disabled={previewRoom.availableRooms <= 0}
                className={`w-full mt-6 py-3 rounded-lg font-semibold ${
                  previewRoom.availableRooms <= 0
                    ? "bg-gray-300 text-gray-500"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {previewRoom.availableRooms <= 0
                  ? "Room Unavailable"
                  : "Select This Room"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}