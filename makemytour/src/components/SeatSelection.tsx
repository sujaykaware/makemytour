"use client";

import { useEffect, useState } from "react";
import { getSeats, selectSeat } from "@/api";

type Seat = {
  id: string;
  flightId: string;
  seatNumber: string;
  seatType: string;
  price: number;
  status: string;
};

export default function SeatSelection({
  flightId,
  travelers = 1,
  onPriceChange,
}: {
  flightId: string;
  travelers?: number;
  onPriceChange?: (price: number) => void;
}) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSeats = async () => {
    const data = await getSeats(flightId);

    if (Array.isArray(data)) {
      setSeats(data);

      const selected = data.filter(
        (seat: Seat) => seat.status === "Selected"
      );

      setSelectedSeats(selected);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadSeats();

    const timer = setInterval(loadSeats, 10000);

    return () => clearInterval(timer);
  }, [flightId]);

  const handleSeatClick = async (seat: Seat) => {
    if (seat.status === "Occupied") {
      return;
    }

    const alreadySelected = selectedSeats.some(
      (selected) =>
        selected.seatNumber === seat.seatNumber
    );

    if (alreadySelected) {
      return;
    }

    if (selectedSeats.length >= travelers) {
      alert(
        `You can select only ${travelers} seat${
          travelers > 1 ? "s" : ""
        } for ${travelers} traveler${
          travelers > 1 ? "s" : ""
        }.`
      );
      return;
    }

    const updatedSeat = await selectSeat(
      flightId,
      seat.seatNumber
    );

    if (updatedSeat) {
      setSelectedSeats((prev) => [
        ...prev,
        updatedSeat,
      ]);

      loadSeats();
    }
  };

  const totalSeatPrice = selectedSeats.reduce(
    (total, seat) => total + Number(seat.price || 0),
    0
  );

  // Send the selected seat price to the parent booking page
  useEffect(() => {
    if (onPriceChange) {
      onPriceChange(totalSeatPrice);
    }
  }, [totalSeatPrice, onPriceChange]);

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Loading seats...
      </p>
    );
  }

  return (
    <div className="mt-4 border rounded-lg p-4 bg-white">
      <h3 className="font-semibold text-lg mb-2">
        ✈️ Select Your Seats
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Select {travelers} seat
        {travelers > 1 ? "s" : ""} for{" "}
        {travelers} traveler
        {travelers > 1 ? "s" : ""}.
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs mb-5">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-200 border" />
          Available
        </div>

        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-blue-500" />
          Premium ₹800
        </div>

        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-gray-400" />
          Occupied
        </div>

        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-purple-500" />
          Selected
        </div>
      </div>

      {/* Seat Map */}
      <div className="grid grid-cols-4 gap-3 max-w-sm">
        {seats.map((seat) => {
          const isSelected = selectedSeats.some(
            (selected) =>
              selected.seatNumber === seat.seatNumber
          );

          const isOccupied =
            seat.status === "Occupied";

          const isPremium =
            seat.seatType === "Premium";

          let seatClass =
            "h-12 rounded-lg text-sm font-semibold border ";

          if (isOccupied) {
            seatClass +=
              "bg-gray-400 text-white cursor-not-allowed";
          } else if (isSelected) {
            seatClass +=
              "bg-purple-500 text-white";
          } else if (isPremium) {
            seatClass +=
              "bg-blue-500 text-white hover:bg-blue-600";
          } else {
            seatClass +=
              "bg-green-200 text-gray-800 hover:bg-green-300";
          }

          return (
            <button
              key={seat.id}
              disabled={isOccupied}
              onClick={() => handleSeatClick(seat)}
              className={seatClass}
            >
              {seat.seatNumber}

              {isPremium &&
                !isOccupied &&
                !isSelected && (
                  <span className="block text-[9px]">
                    +₹800
                  </span>
                )}
            </button>
          );
        })}
      </div>

      {/* Selected Seats */}
      {selectedSeats.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <p className="font-semibold">
            Selected Seats:{" "}
            {selectedSeats
              .map((seat) => seat.seatNumber)
              .join(", ")}
          </p>

          <p className="text-sm text-gray-600 mt-1">
            Seats Selected:{" "}
            {selectedSeats.length} / {travelers}
          </p>

          <p className="font-semibold mt-1">
            Total Seat Price: ₹
            {totalSeatPrice.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}