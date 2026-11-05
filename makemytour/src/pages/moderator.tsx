import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Reply = { userName: string; text: string };

type Review = {
  id: string;
  itemId: string;
  itemType: string;
  userName: string;
  rating: number;
  reviewText: string;
  photoUrl?: string;
  helpfulCount: number;
  replies: Reply[];
};

export default function ModeratorPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/reviews/flagged`);
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
      setError("");
    } catch (e) {
      console.error("Failed to load flagged reviews:", e);
      setError("Could not load flagged reviews. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeReview = async (id: string) => {
    if (!window.confirm("Remove this review permanently from the site?")) {
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/reviews/${encodeURIComponent(id)}/moderate`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error(await response.text());
      await load();
    } catch (e) {
      console.error("Remove failed:", e);
      alert("Could not remove the review.");
    }
  };

  const keepReview = async (id: string) => {
    try {
      const response = await fetch(
        `${API_URL}/reviews/${encodeURIComponent(id)}/unflag`,
        { method: "PUT" }
      );
      if (!response.ok) throw new Error(await response.text());
      await load();
    } catch (e) {
      console.error("Keep failed:", e);
      alert("Could not keep the review.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">Moderator Dashboard</h1>
        <p className="mb-6 mt-1 text-gray-600">
          Reviews flagged as inappropriate. Remove a review to hide it from
          the site, or keep it to clear the flag.
        </p>

        {loading && <p className="text-gray-500">Loading...</p>}

        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && reviews.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            No flagged reviews. Everything is clean.
          </div>
        )}

        <div className="space-y-5">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{review.userName}</p>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {review.itemType} · {review.itemId}
                </span>
              </div>

              <p className="mt-1 text-yellow-500">
                {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
                <span className="text-gray-300">
                  {"★".repeat(5 - Math.max(0, Math.min(5, review.rating)))}
                </span>
              </p>

              <p className="mt-3 text-gray-700">{review.reviewText}</p>

              {review.photoUrl && (
                <img
                  src={review.photoUrl}
                  alt="Review"
                  className="mt-3 h-32 w-48 rounded-lg object-cover"
                />
              )}

              {review.replies?.length > 0 && (
                <div className="ml-4 mt-3 border-l-2 pl-3 text-sm text-gray-600">
                  {review.replies.map((r, i) => (
                    <p key={i}>
                      <span className="font-semibold">{r.userName}:</span>{" "}
                      {r.text}
                    </p>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => removeReview(review.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => keepReview(review.id)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Keep
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}