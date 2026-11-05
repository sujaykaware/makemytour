import { useEffect, useState } from "react";
import { getPriceHistory } from "@/api";

export default function PriceHistory({
  flightId,
}: {
  flightId: string;
}) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const data = await getPriceHistory(flightId);
      setHistory(Array.isArray(data) ? data : []);
    };

    loadHistory();

    const timer = setInterval(loadHistory, 15000);

    return () => clearInterval(timer);
  }, [flightId]);

  if (history.length === 0) {
    return (
      <p className="text-xs text-gray-500 mt-3">
        Price history will appear after a few updates.
      </p>
    );
  }

  const prices = history.map((item) => item.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  return (
    <div className="mt-4 border rounded-lg p-3 bg-white">
      <p className="font-semibold text-sm mb-3">
        Price History
      </p>

      <div className="flex items-end gap-1 h-32">
        {history.map((item, index) => {
          const height =
            maxPrice === minPrice
              ? 50
              : ((item.price - minPrice) /
                  (maxPrice - minPrice)) *
                  80 +
                20;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col justify-end items-center"
              title={`₹${item.price}`}
            >
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{
                  height: `${height}%`,
                  minHeight: "4px",
                }}
              />

              <span className="text-[8px] text-gray-400 mt-1">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Lowest: ₹{minPrice}</span>
        <span>Highest: ₹{maxPrice}</span>
      </div>
    </div>
  );
}