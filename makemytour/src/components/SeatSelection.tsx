
"use client";

import { useCallback, useEffect, useState } from "react";
import { getSeats, getPreferences, savePreferences } from "@/api";
import { useSelector } from "react-redux";

type Seat = {
  id: string;
  flightId: string;
  seatNumber: string;
  seatType: string;
  price: number;
  status: string;
};

type SeatSelectionProps = {
  flightId: string;
  travelers?: number;
  onPriceChange?: (price: number) => void;
  onSeatsChange?: (seatNumbers: string[]) => void;
};

export default function SeatSelection({
  flightId,
  travelers = 1,
  onPriceChange,
  onSeatsChange,
}: SeatSelectionProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: any) => state.user.user);
  const userId = user?.id;
  const [error, setError] = useState("");
  const [preferredType, setPreferredType] = useState("");

  useEffect(() => {
    const loadPreference = async () => {
      if (userId) {
        const prefs = await getPreferences(userId);
        if (prefs?.seatType) {
          setPreferredType(prefs.seatType);
          return;
        }
      }
      try {
        setPreferredType(localStorage.getItem("preferredSeatType") || "");
      } catch {
        /* ignore */
      }
    };
    loadPreference();
  }, [userId]);
  // If travelers are reduced, drop the extra selected seats
  useEffect(() => {
    setSelectedSeats((previous) =>
      previous.length > travelers ? previous.slice(0, travelers) : previous
    );
  }, [travelers]);

  const loadSeats = useCallback(async () => {
    try {
      const data = await getSeats(flightId);

      if (Array.isArray(data)) {
        setSeats(data);

        // Preserve local selections unless a seat becomes occupied.
        setSelectedSeats((previous) =>
          previous
            .map((selected) => {
              const latestSeat = data.find(
                (seat: Seat) =>
                  seat.seatNumber === selected.seatNumber
              );

              return latestSeat ? latestSeat : selected;
            })
            .filter((selected) => {
              const latestSeat = data.find(
                (seat: Seat) =>
                  seat.seatNumber === selected.seatNumber
              );

              return latestSeat && latestSeat.status !== "Occupied";
            })
        );
      }
    } catch (err) {
      console.error("Failed to load seats:", err);
      setError("Could not load seats. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [flightId]);

  useEffect(() => {
    void loadSeats();

    const timer = setInterval(() => {
      void loadSeats();
    }, 10000);

    return () => clearInterval(timer);
  }, [loadSeats]);

  const getSeatPrice = (seat: Seat) =>
    seat.seatType.toLowerCase() === "premium" ? 800 : 0;
  const totalSeatPrice = selectedSeats.reduce(
    (total, seat) => total + getSeatPrice(seat),
    0
  );

  useEffect(() => {
    onPriceChange?.(totalSeatPrice);
  }, [totalSeatPrice, onPriceChange]);

  useEffect(() => {
    onSeatsChange?.(
      selectedSeats.map((seat) => seat.seatNumber)
    );
  }, [selectedSeats, onSeatsChange]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "Occupied") return;

    const alreadySelected = selectedSeats.some(
      (selected) => selected.seatNumber === seat.seatNumber
    );

    // Click again to unselect.
    if (alreadySelected) {
      const type = seat.seatType.toLowerCase();

      try {
        localStorage.setItem("preferredSeatType", type);
      } catch {
        /* ignore */
      }

      if (userId) {
        void savePreferences(userId, { seatType: something } as any);
      }

      setPreferredType(type);
      setSelectedSeats((previous) =>
        previous.filter(
          (item) => item.seatNumber !== seat.seatNumber
        )
      );
      setError("");
      return;
    }

    // Limit selection to the number of travelers.
    if (selectedSeats.length >= travelers) {
      alert(
        `You can select only ${travelers} seat${travelers > 1 ? "s" : ""
        } for ${travelers} traveler${travelers > 1 ? "s" : ""
        }.`
      );
      return;
    }

    setSelectedSeats((previous) => [...previous, seat]);
    setError("");
  };
  const pickPreferred = () => {
    if (!preferredType) return;

    const matches = seats
      .filter(
        (s) =>
          s.status !== "Occupied" &&
          s.seatType.toLowerCase() === preferredType
      )
      .slice(0, travelers);

    setSelectedSeats(matches);

    setError(
      matches.length < travelers
        ? `Only ${matches.length} ${preferredType} seat(s) available.`
        : ""
    );
  };
  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Loading seats...
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border bg-white p-4">
      <h3 className="mb-2 text-lg font-semibold">
        ✈️ Select Your Seats
      </h3>

      <p className="mb-4 text-sm text-gray-600">
        Select {travelers} seat{travelers > 1 ? "s" : ""} for{" "}
        {travelers} traveler{travelers > 1 ? "s" : ""}.
      </p>

      <div className="mb-5 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 rounded border bg-green-200" />
          Available
        </div>

        <div className="flex items-center gap-1">
          <span className="h-4 w-4 rounded bg-blue-500" />
          Premium ₹800
        </div>

        <div className="flex items-center gap-1">
          <span className="h-4 w-4 rounded bg-gray-400" />
          Occupied
        </div>

        <div className="flex items-center gap-1">
          <span className="h-4 w-4 rounded bg-purple-500" />
          Selected
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}
      {preferredType && (
        <button
          type="button"
          onClick={pickPreferred}
          className="mb-4 rounded-lg border border-purple-500 px-3 py-1 text-sm text-purple-700 hover:bg-purple-50"
        >
          Use my saved preference ({preferredType} seats)
        </button>
      )}

      <div className="grid max-w-sm grid-cols-4 gap-3">
        {seats.map((seat) => {
          const isSelected = selectedSeats.some(
            (selected) =>
              selected.seatNumber === seat.seatNumber
          );

          const isOccupied = seat.status === "Occupied";
          const isPremium =
            seat.seatType.toLowerCase() === "premium";

          let seatClass =
            "h-12 rounded-lg border text-sm font-semibold ";

          if (isOccupied) {
            seatClass +=
              "cursor-not-allowed bg-gray-400 text-white";
          } else if (isSelected) {
            seatClass += "bg-purple-500 text-white";
          } else if (isPremium) {
            seatClass +=
              "bg-blue-500 text-white hover:bg-blue-600";
          } else {
            seatClass +=
              "bg-green-200 text-gray-800 hover:bg-green-300";
          }

          return (
            <button
              key={seat.id || seat.seatNumber}
              type="button"
              disabled={isOccupied}
              onClick={() => handleSeatClick(seat)}
              className={`${seatClass} ${isOccupied
                ? "cursor-not-allowed"
                : "cursor-pointer"
                }`}
            >
              {seat.seatNumber}

              {isPremium && !isOccupied && !isSelected && (
                <span className="block text-[9px]">
                  +₹800
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedSeats.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <p className="font-semibold">
            Selected Seats:{" "}
            {selectedSeats
              .map((seat) => seat.seatNumber)
              .join(", ")}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Seats Selected: {selectedSeats.length} / {travelers}
          </p>


        </div>
      )}
    </div>
  );
}
