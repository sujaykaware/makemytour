"use client";

import { useEffect, useState } from "react";
import { getRooms, getPreferences, savePreferences } from "@/api";
import { useSelector } from "react-redux";
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

export type RoomChoice = {
  roomId: string;
  roomType: string;
  quantity: number;
  pricePerNight: number;
};

type RoomSelectionProps = {
  hotelId: string;
  onRoomsChange?: (choices: RoomChoice[]) => void;
};

export default function RoomSelection({
  hotelId,
  onRoomsChange,
}: RoomSelectionProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [previewRoom, setPreviewRoom] = useState<Room | null>(null);
  const [preferredType, setPreferredType] = useState("");
  const user = useSelector((state: any) => state.user.user);
  const userId = user?.id;

  // Load the saved room preference (browser storage)
  useEffect(() => {
    const loadPreference = async () => {
      if (userId) {
        const prefs = await getPreferences(userId);
        if (prefs?.roomType) {
          setPreferredType(prefs.roomType);
          return;
        }
      }
      try {
        setPreferredType(localStorage.getItem("preferredRoomType") || "");
      } catch {
        /* ignore */
      }
    };
    loadPreference();
  }, [userId]);

  const loadRooms = async () => {
    try {
      const data = await getRooms(hotelId);
      if (Array.isArray(data)) {
        setRooms(data);
        // never keep more rooms selected than are available
        setQuantities((prev) => {
          const next: Record<string, number> = {};
          data.forEach((r: Room) => {
            const q = Math.min(prev[r.id] || 0, r.availableRooms);
            if (q > 0) next[r.id] = q;
          });
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to load rooms:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hotelId) return;
    loadRooms();
    const timer = setInterval(loadRooms, 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const choices: RoomChoice[] = rooms
    .filter((r) => (quantities[r.id] || 0) > 0)
    .map((r) => ({
      roomId: r.id,
      roomType: r.roomType,
      quantity: quantities[r.id],
      pricePerNight: r.pricePerNight,
    }));

  useEffect(() => {
    onRoomsChange?.(choices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(choices)]);

  const change = (room: Room, delta: number) => {
    // Save the preference when a room is added
    if (delta > 0) {
      try {
        localStorage.setItem("preferredRoomType", room.roomType);
      } catch {
        /* ignore */
      }

      if (userId) {
        void savePreferences(userId, { roomType: room.roomType } as any);
      }

      setPreferredType(room.roomType);
    }

    setQuantities((prev) => {
      const q = Math.max(
        0,
        Math.min(room.availableRooms, (prev[room.id] || 0) + delta)
      );
      return { ...prev, [room.id]: q };
    });
  };

  const totalPerNight = choices.reduce(
    (sum, c) => sum + c.quantity * c.pricePerNight,
    0
  );
  const applyPreferred = () => {
    const match = rooms.find(
      (r) => r.roomType === preferredType && r.availableRooms > 0
    );
    if (match) {
      setQuantities((prev) => ({ ...prev, [match.id]: 1 }));
    }
  };

  if (loading) {
    return <p className="mt-8 text-gray-500">Loading room options...</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-2">Select Your Room</h2>
      <p className="text-gray-600 mb-6">
        Choose how many rooms of each type you want.
      </p>
      {preferredType && (
        <button
          type="button"
          onClick={applyPreferred}
          className="mb-4 rounded-lg border border-blue-500 px-3 py-1 text-sm text-blue-700 hover:bg-blue-50"
        >
          Use my saved room type ({preferredType})
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((room) => {
          const qty = quantities[room.id] || 0;
          const isAvailable = room.availableRooms > 0;

          return (
            <div
              key={room.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm ${qty > 0
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200"
                }`}
            >
              <div className="relative">
                <img
                  src={room.imageUrl}
                  alt={room.roomType}
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPreviewRoom(room)}
                  className="absolute bottom-3 right-3 bg-white/95 px-3 py-2 rounded-lg text-sm font-medium shadow flex items-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  View Room
                </button>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-lg font-bold">{room.roomType}</h3>
                  <div className="flex flex-col items-end gap-1">
                    {room.roomType !== "Standard Room" && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Upgrade
                      </span>
                    )}
                    {preferredType === room.roomType && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Your preference
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-2">{room.description}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Fits {room.capacity} {room.capacity === 1 ? "Adult" : "Adults"}
                </p>
                <p className="text-sm text-gray-600 mt-2">{room.amenities}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">
                      ₹{room.pricePerNight.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500">per night</p>
                  </div>
                  <span
                    className={`text-xs font-medium ${isAvailable ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {isAvailable
                      ? `${room.availableRooms} available`
                      : "Sold out"}
                  </span>
                </div>

                {isAvailable ? (
                  <div className="mt-4 flex items-center justify-between border rounded-lg p-2">
                    <button
                      type="button"
                      onClick={() => change(room, -1)}
                      disabled={qty === 0}
                      className="w-9 h-9 rounded-lg border disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="font-semibold">
                      {qty} room{qty === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={() => change(room, 1)}
                      disabled={qty >= room.availableRooms}
                      className="w-9 h-9 rounded-lg bg-blue-500 text-white disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full mt-4 py-2 rounded-lg bg-gray-300 text-gray-500"
                  >
                    Unavailable
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {choices.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-lg">Your Rooms</h3>
          {choices.map((c) => (
            <p key={c.roomId} className="text-gray-700 mt-1">
              {c.roomType} × {c.quantity} — ₹
              {(c.quantity * c.pricePerNight).toLocaleString("en-IN")}/night
            </p>
          ))}
          <p className="font-semibold mt-2">
            Total per night: ₹{totalPerNight.toLocaleString("en-IN")}
          </p>
        </div>
      )}

      {previewRoom && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewRoom(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-bold">{previewRoom.roomType}</h2>
              <button
                type="button"
                onClick={() => setPreviewRoom(null)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewRoom.imageUrl}
              alt={previewRoom.roomType}
              className="w-full h-[420px] object-cover"
            />
            <div className="p-6">
              <p className="text-gray-600 mb-3">{previewRoom.description}</p>
              <p className="text-gray-600 mb-3">{previewRoom.amenities}</p>
              <p className="font-semibold">
                ₹{previewRoom.pricePerNight.toLocaleString("en-IN")}/night ·{" "}
                {previewRoom.availableRooms} available
              </p>
              <button
                type="button"
                disabled={previewRoom.availableRooms <= 0}
                onClick={() => {
                  change(previewRoom, 1);
                  setPreviewRoom(null);
                }}
                className="w-full mt-5 py-3 rounded-lg font-semibold bg-blue-500 text-white disabled:bg-gray-300"
              >
                Add This Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}