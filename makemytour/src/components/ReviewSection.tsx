"use client";

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Reply = {
  userName: string;
  text: string;
  createdAt?: string;
};

type Review = {
  id: string;
  userName: string;
  rating: number;
  reviewText: string;
  photoUrl?: string;
  helpfulCount: number;
  flagged: boolean;
  removed?: boolean;
  replies: Reply[];
  createdAt: string;
};

type Props = {
  itemId: string;
  itemType: "HOTEL" | "FLIGHT";
};

function RatingStars({
  value,
  interactive = false,
  onChange,
}: {
  value: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const safeRating = Math.max(0, Math.min(5, Number(value) || 0));

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Rating: ${safeRating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          aria-label={`Select ${star} star${star === 1 ? "" : "s"}`}
          aria-pressed={interactive ? safeRating === star : undefined}
          className={`text-2xl leading-none ${
            star <= safeRating ? "text-yellow-400" : "text-gray-300"
          } ${interactive ? "cursor-pointer" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ itemId, itemType }: Props) {
  const user = useSelector((state: any) => state.user.user);

  // Logged-in user's name, or "Guest User" if nobody is logged in
  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Guest User";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sort, setSort] = useState("newest");
  const [filterRating, setFilterRating] = useState("");

  const loadReviews = useCallback(async () => {
    if (!itemId) return;

    try {
      const params = new URLSearchParams({ sort });

      if (filterRating) {
        params.set("rating", filterRating);
      }

      const response = await fetch(
        `${API_URL}/reviews/${encodeURIComponent(itemId)}?${params.toString()}`
      );

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error("Reviews API error:", response.status, errorDetails);
        throw new Error(`Could not load reviews: ${response.status}`);
      }

      const data: unknown = await response.json();
      const list = Array.isArray(data) ? (data as Review[]) : [];

      // Reviews removed by a moderator are never shown
      setReviews(list.filter((review) => !review.removed));
    } catch (error) {
      console.error("Failed to load reviews:", error);
    }
  }, [itemId, sort, filterRating]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/reviews/upload-photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Photo upload failed.");
      }

      const uploadedUrl = (await response.text()).trim();
      setPhotoUrl(uploadedUrl);
      alert("Photo uploaded successfully.");
    } catch (error) {
      console.error("Photo upload failed:", error);
      alert("Photo upload failed. Check that the backend is running.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitReview = async () => {
    if (!text.trim()) {
      alert("Please write a review.");
      return;
    }

    if (rating < 1 || rating > 5) {
      alert("Please select a rating from 1 to 5 stars.");
      return;
    }

    if (submitting || uploadingPhoto) return;

    setSubmitting(true);

    try {
      const reviewToSubmit = {
        itemId,
        itemType,
        userName: displayName,
        rating: Number(rating),
        reviewText: text.trim(),
        photoUrl: photoUrl || null,
      };

      const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewToSubmit),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const savedReview: Review = await response.json();

      if (Number(savedReview.rating) !== rating) {
        alert(
          `The selected rating was ${rating}, but the backend returned ${savedReview.rating}.`
        );
        return;
      }

      alert("Review submitted successfully.");

      setText("");
      setPhotoUrl("");
      setRating(5);

      await loadReviews();
    } catch (error) {
      console.error("Review submission failed:", error);
      alert("Failed to submit review. Check the backend and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const helpful = async (id: string) => {
    try {
      const response = await fetch(
        `${API_URL}/reviews/${encodeURIComponent(id)}/helpful`,
        { method: "PUT" }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadReviews();
    } catch (error) {
      console.error("Helpful action failed:", error);
      alert("Could not mark the review as helpful.");
    }
  };

  const flagReview = async (id: string) => {
    try {
      const response = await fetch(
        `${API_URL}/reviews/${encodeURIComponent(id)}/flag`,
        { method: "PUT" }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      alert("Review flagged for moderation.");
      await loadReviews();
    } catch (error) {
      console.error("Flag action failed:", error);
      alert("Could not flag the review.");
    }
  };

  const reply = async (id: string) => {
    const replyText = prompt("Write your reply:");

    if (!replyText?.trim()) return;

    try {
      const response = await fetch(
        `${API_URL}/reviews/${encodeURIComponent(id)}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: displayName,
            text: replyText.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadReviews();
    } catch (error) {
      console.error("Reply failed:", error);
      alert("Failed to submit reply.");
    }
  };

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-2xl font-bold">Reviews &amp; Ratings</h2>

      <p className="mb-6 text-gray-600">
        See what other travelers have to say.
      </p>

      <div className="mb-8 rounded-xl border bg-white p-5">
        <h3 className="mb-1 text-lg font-semibold">Write a Review</h3>
        <p className="mb-4 text-sm text-gray-500">Posting as {displayName}</p>

        <RatingStars
          value={rating}
          interactive
          onChange={(selectedRating) => setRating(selectedRating)}
        />

        <p className="mb-3 mt-2 text-sm text-gray-600" aria-live="polite">
          Selected rating: {rating} / 5
        </p>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Share your experience..."
          className="min-h-28 w-full rounded-lg border p-3"
          rows={4}
        />

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">
            Upload Photo (optional)
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="w-full rounded-lg border p-3"
            disabled={uploadingPhoto || submitting}
          />

          {uploadingPhoto && (
            <p className="mt-2 text-sm text-blue-600">Uploading photo...</p>
          )}

          {photoUrl && (
            <div className="mt-3">
              <p className="mb-2 text-sm text-green-600">
                Photo uploaded successfully.
              </p>

              <img
                src={photoUrl}
                alt="Review upload"
                className="h-32 w-48 rounded-lg border object-cover"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={submitReview}
          disabled={submitting || uploadingPhoto}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-lg border p-2"
          aria-label="Sort reviews"
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest Rated</option>
          <option value="helpful">Most Helpful</option>
        </select>

        <select
          value={filterRating}
          onChange={(event) => setFilterRating(event.target.value)}
          className="rounded-lg border p-2"
          aria-label="Filter by rating"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      <div className="space-y-5">
        {reviews.length === 0 && (
          <div className="rounded-xl bg-gray-50 p-6">
            No reviews yet. Be the first to review!
          </div>
        )}

        {reviews.map((review) => {
          const reviewRating = Math.max(
            0,
            Math.min(5, Number(review.rating) || 0)
          );

          return (
            <div key={review.id} className="rounded-xl border bg-white p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {review.userName || "Guest User"}
                  </p>

                  <RatingStars value={reviewRating} />

                  <p className="text-sm text-gray-500">
                    Rating: {reviewRating} / 5
                  </p>
                </div>

                {review.flagged ? (
                  <span className="text-sm text-orange-600">
                    Flagged – under review
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => flagReview(review.id)}
                    className="text-sm text-red-500"
                  >
                    Flag
                  </button>
                )}
              </div>

              <p className="mt-3 text-gray-700">{review.reviewText}</p>

              {review.photoUrl && (
                <img
                  src={review.photoUrl}
                  alt="Review"
                  className="mt-4 h-32 w-48 rounded-lg object-cover"
                />
              )}

              <div className="mt-4 flex gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => helpful(review.id)}
                  className="text-blue-600"
                >
                  Helpful ({review.helpfulCount ?? 0})
                </button>

                <button
                  type="button"
                  onClick={() => reply(review.id)}
                  className="text-blue-600"
                >
                  Reply
                </button>
              </div>

              {review.replies?.length > 0 && (
                <div className="ml-6 mt-4 border-l-2 pl-4">
                  {review.replies.map((replyItem, index) => (
                    <div key={index} className="mb-3">
                      <p className="text-sm font-semibold">
                        {replyItem.userName}
                      </p>
                      <p className="text-sm text-gray-600">{replyItem.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}