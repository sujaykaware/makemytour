"use client";

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";

const API_URL = "http://localhost:8080";

type Recommendation = {
  id: string;
  type: string;
  name: string;
  location: string;
  price: number;
  score: number;
  reason: string;
  algorithm?: string;
};

export default function Recommendations() {
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();
  const userId = user?.id || "guest";

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [preference, setPreference] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);
  const [rated, setRated] = useState<Record<string, boolean>>({});

  const load = useCallback(
    async (showLoader: boolean) => {
      if (showLoader) setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/recommendations/${encodeURIComponent(
            userId
          )}?preference=${encodeURIComponent(preference)}`
        );
        if (!response.ok) {
          throw new Error(`Failed to load recommendations: ${response.status}`);
        }
        const data = await response.json();
        setRecommendations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Recommendation error:", error);
        setMessage("Could not load recommendations. Please try again.");
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    },
    [userId, preference]
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  async function sendFeedback(recommendationId: string, helpful: boolean) {
    setFeedbackLoading(recommendationId);
    setMessage("");

    try {
      const params = new URLSearchParams({
        userId,
        recommendationId,
        helpful: String(helpful),
      });

      const response = await fetch(
        `${API_URL}/recommendations/feedback?${params.toString()}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Feedback failed: ${response.status}`);
      }

      if (helpful) {
        setRated((prev) => ({ ...prev, [recommendationId]: true }));
        setMessage("Thanks! We will show more suggestions like this.");
      } else {
        // Hide it right away; the server will also stop suggesting it
        setRecommendations((prev) =>
          prev.filter((item) => item.id !== recommendationId)
        );
        setMessage("Got it. We will show fewer suggestions like this.");
      }

      // Refresh quietly so the new feedback changes the ranking
      await load(false);
    } catch (error) {
      console.error("Feedback error:", error);
      setMessage("Feedback could not be saved. Please try again.");
    } finally {
      setFeedbackLoading(null);
    }
  }

  function openItem(item: Recommendation) {
    router.push(
      item.type === "HOTEL" ? `/book-hotel/${item.id}` : `/book-flight/${item.id}`
    );
  }

  const preferences = [
    { label: "For You", value: "" },
    { label: "Beach Destinations", value: "beach" },
    { label: "City Trips", value: "city" },
    { label: "Luxury Stays", value: "luxury" },
  ];

  return (
    <section className="mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Recommended For You</h2>
        <p className="mt-1 text-blue-700">
          Suggestions based on your bookings, travelers like you, and your
          feedback.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {preferences.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setPreference(item.value)}
            aria-pressed={preference === item.value}
            className={`cursor-pointer rounded-lg border px-4 py-2 transition ${
              preference === item.value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-800 hover:bg-blue-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800"
        >
          {message}
        </div>
      )}

      {loading && <p className="text-gray-600">Finding recommendations...</p>}

      {!loading && recommendations.length === 0 && (
        <p className="text-gray-600">No recommendations right now.</p>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                  {recommendation.type}
                </span>
                <h3 className="mt-3 text-lg font-bold">{recommendation.name}</h3>
                <p className="text-gray-500">{recommendation.location}</p>
              </div>

              <span className="text-sm font-semibold text-green-600">
                {recommendation.score}% match
              </span>
            </div>

            <p className="mt-4 text-lg font-semibold">
              ₹{Number(recommendation.price).toLocaleString("en-IN")}
              {recommendation.type === "HOTEL" && (
                <span className="text-sm text-gray-500"> / night</span>
              )}
            </p>

            {/* WHY THIS RECOMMENDATION? (tooltip) */}
            <div className="group relative mt-4 inline-block">
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-semibold text-blue-700"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-600 text-xs">
                  i
                </span>
                Why this recommendation?
              </button>

              <div className="invisible absolute left-0 top-full z-20 mt-2 w-72 rounded-lg bg-gray-900 p-3 text-sm text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <p>{recommendation.reason}</p>
                {recommendation.algorithm && (
                  <p className="mt-2 text-xs text-gray-400">
                    Method: {recommendation.algorithm}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => openItem(recommendation)}
              className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700"
            >
              View details
            </button>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={feedbackLoading === recommendation.id}
                onClick={() => sendFeedback(recommendation.id, true)}
                className={`flex-1 cursor-pointer rounded-lg border py-2 text-sm hover:bg-green-50 disabled:cursor-wait disabled:opacity-50 ${
                  rated[recommendation.id]
                    ? "border-green-600 bg-green-50 text-green-700"
                    : ""
                }`}
              >
                {rated[recommendation.id] ? "👍 Helpful ✓" : "👍 Helpful"}
              </button>

              <button
                type="button"
                disabled={feedbackLoading === recommendation.id}
                onClick={() => sendFeedback(recommendation.id, false)}
                className="flex-1 cursor-pointer rounded-lg border py-2 text-sm hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
              >
                👎 Not Relevant
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}