"use client";

import { useEffect, useState } from "react";

type Reply = {
  userName: string;
  text: string;
};

type Review = {
  id: string;
  userName: string;
  rating: number;
  reviewText: string;
  photoUrl?: string;
  helpfulCount: number;
  flagged: boolean;
  replies: Reply[];
  createdAt: string;
};

type Props = {
  itemId: string;
  itemType: "HOTEL" | "FLIGHT";
};

export default function ReviewSection({
  itemId,
  itemType,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sort, setSort] = useState("newest");
  const [filterRating, setFilterRating] = useState("");

  // =========================
  // LOAD REVIEWS
  // =========================
  const loadReviews = async () => {
    try {
      let url = `http://localhost:8080/reviews/${itemId}?sort=${sort}`;

      if (filterRating) {
        url += `&rating=${filterRating}`;
      }

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        console.error(
          "Failed to load reviews:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  useEffect(() => {
    if (itemId) {
      loadReviews();
    }
  }, [itemId, sort, filterRating]);

  // =========================
  // PHOTO UPLOAD
  // =========================
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://localhost:8080/reviews/upload-photo",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const uploadedPhotoUrl = await response.text();

        setPhotoUrl(uploadedPhotoUrl);

        console.log("Photo uploaded successfully");
      } else {
        const errorText = await response.text();

        console.error(
          "Photo upload failed:",
          errorText
        );

        alert("Failed to upload photo.");
      }
    } catch (error) {
      console.error(
        "Photo upload error:",
        error
      );

      alert(
        "Something went wrong while uploading the photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // =========================
  // SUBMIT REVIEW
  // =========================
  const submitReview = async () => {
    if (!text.trim()) {
      alert("Please write a review.");
      return;
    }

    // Store the selected rating before submitting.
    // This makes sure the exact selected value is sent.
    const submittedRating = rating;

    console.log(
      "Submitting rating:",
      submittedRating
    );

    try {
      const response = await fetch(
        "http://localhost:8080/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: itemId,
            itemType: itemType,
            userName: "Guest User",
            rating: submittedRating,
            reviewText: text,
            photoUrl: photoUrl,
          }),
        }
      );

      if (response.ok) {
        const savedReview = await response.json();

        console.log(
          "Submitted rating:",
          submittedRating
        );

        console.log(
          "Saved review:",
          savedReview
        );

        alert("Review submitted successfully!");

        setText("");
        setPhotoUrl("");

        // Reload reviews while the selected rating
        // is still available.
        await loadReviews();

        // Reset the form to 5 stars after submission.
        setRating(5);
      } else {
        const errorText = await response.text();

        console.error(
          "Review submission failed:",
          errorText
        );

        alert("Failed to submit review.");
      }
    } catch (error) {
      console.error(
        "Error submitting review:",
        error
      );

      alert(
        "Something went wrong while submitting the review."
      );
    }
  };

  // =========================
  // HELPFUL
  // =========================
  const helpful = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8080/reviews/${id}/helpful`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        await loadReviews();
      }
    } catch (error) {
      console.error(
        "Helpful error:",
        error
      );
    }
  };

  // =========================
  // FLAG REVIEW
  // =========================
  const flagReview = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8080/reviews/${id}/flag`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        alert(
          "Review has been flagged for moderation."
        );

        await loadReviews();
      }
    } catch (error) {
      console.error(
        "Flag error:",
        error
      );
    }
  };

  // =========================
  // REPLY
  // =========================
  const reply = async (id: string) => {
    const replyText = prompt(
      "Write your reply:"
    );

    if (!replyText || !replyText.trim()) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/reviews/${id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: "Guest User",
            text: replyText,
          }),
        }
      );

      if (response.ok) {
        await loadReviews();
      } else {
        console.error(
          "Reply failed:",
          await response.text()
        );
      }
    } catch (error) {
      console.error(
        "Reply error:",
        error
      );
    }
  };

  return (
    <section className="mt-10">

      {/* HEADER */}
      <h2 className="text-2xl font-bold mb-2">
        Reviews & Ratings
      </h2>

      <p className="text-gray-600 mb-6">
        See what other travelers have to say.
      </p>

      {/* =========================
          WRITE REVIEW
      ========================= */}
      <div className="bg-white border rounded-xl p-5 mb-8">

        <h3 className="text-lg font-semibold mb-4">
          Write a Review
        </h3>

        {/* STAR RATING */}
        <div className="flex gap-1 mb-4">

          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                console.log(
                  "Selected star:",
                  star
                );

                setRating(star);
              }}
              className={`text-3xl ${
                star <= rating
                  ? "text-yellow-400"
                  : "text-gray-300"
              }`}
              aria-label={`${star} star rating`}
            >
              ★
            </button>
          ))}

        </div>

        {/* CURRENT RATING */}
        <p className="text-sm text-gray-600 mb-3">
          Selected rating: {rating} / 5
        </p>

        {/* REVIEW TEXT */}
        <textarea
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          placeholder="Share your experience..."
          className="w-full border rounded-lg p-3 min-h-28"
          rows={4}
        />

        {/* PHOTO UPLOAD */}
        <div className="mt-4">

          <label className="block text-sm font-medium mb-2">
            Upload Photo (optional)
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="w-full border rounded-lg p-3"
          />

          {uploadingPhoto && (
            <p className="text-sm text-blue-600 mt-2">
              Uploading photo...
            </p>
          )}

          {photoUrl && (
            <div className="mt-3">

              <p className="text-sm text-green-600 mb-2">
                ✓ Photo uploaded
              </p>

              <img
                src={photoUrl}
                alt="Selected review photo"
                className="w-48 h-32 object-cover rounded-lg border"
              />

            </div>
          )}

        </div>

        {/* SUBMIT REVIEW */}
        <button
          type="button"
          onClick={submitReview}
          className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Submit Review
        </button>

      </div>

      {/* =========================
          SORT AND FILTER
      ========================= */}
      <div className="flex flex-wrap gap-3 mb-5">

        {/* SORT */}
        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value)
          }
          className="border rounded-lg p-2"
        >
          <option value="newest">
            Newest
          </option>

          <option value="highest">
            Highest Rated
          </option>

          <option value="helpful">
            Most Helpful
          </option>
        </select>

        {/* RATING FILTER */}
        <select
          value={filterRating}
          onChange={(e) =>
            setFilterRating(e.target.value)
          }
          className="border rounded-lg p-2"
        >
          <option value="">
            All Ratings
          </option>

          <option value="5">
            5 Stars
          </option>

          <option value="4">
            4 Stars
          </option>

          <option value="3">
            3 Stars
          </option>

          <option value="2">
            2 Stars
          </option>

          <option value="1">
            1 Star
          </option>
        </select>

      </div>

      {/* =========================
          REVIEWS
      ========================= */}
      <div className="space-y-5">

        {reviews.length === 0 && (
          <div className="bg-gray-50 p-6 rounded-xl">
            No reviews yet. Be the first to review!
          </div>
        )}

        {reviews.map((review) => (

          <div
            key={review.id}
            className="border rounded-xl p-5 bg-white"
          >

            {/* USER + RATING */}
            <div className="flex justify-between">

              <div>

                <p className="font-semibold">
                  {review.userName}
                </p>

                {/* DISPLAY RATING */}
                <div className="text-yellow-400">

                  {"★".repeat(
                    Math.max(
                      0,
                      Math.min(
                        5,
                        Number(review.rating)
                      )
                    )
                  )}

                  <span className="text-gray-300">

                    {"★".repeat(
                      Math.max(
                        0,
                        5 -
                          Math.max(
                            0,
                            Math.min(
                              5,
                              Number(review.rating)
                            )
                          )
                      )
                    )}

                  </span>

                </div>

                <p className="text-sm text-gray-500">
                  Rating: {review.rating} / 5
                </p>

              </div>

              {/* FLAG */}
              <button
                type="button"
                onClick={() =>
                  flagReview(review.id)
                }
                className="text-sm text-red-500"
              >
                🚩 Flag
              </button>

            </div>

            {/* REVIEW TEXT */}
            <p className="mt-3 text-gray-700">
              {review.reviewText}
            </p>

            {/* PHOTO */}
            {review.photoUrl && (
              <img
                src={review.photoUrl}
                alt="Review"
                className="mt-4 w-48 h-32 object-cover rounded-lg"
              />
            )}

            {/* ACTIONS */}
            <div className="flex gap-4 mt-4 text-sm">

              <button
                type="button"
                onClick={() =>
                  helpful(review.id)
                }
                className="text-blue-600"
              >
                👍 Helpful (
                {review.helpfulCount}
                )
              </button>

              <button
                type="button"
                onClick={() =>
                  reply(review.id)
                }
                className="text-blue-600"
              >
                💬 Reply
              </button>

            </div>

            {/* REPLIES */}
            {review.replies &&
              review.replies.length > 0 && (

                <div className="mt-4 ml-6 border-l-2 pl-4">

                  {review.replies.map(
                    (replyItem, index) => (

                      <div
                        key={index}
                        className="mb-3"
                      >

                        <p className="font-semibold text-sm">
                          {replyItem.userName}
                        </p>

                        <p className="text-sm text-gray-600">
                          {replyItem.text}
                        </p>

                      </div>

                    )
                  )}

                </div>

              )}

          </div>

        ))}

      </div>

    </section>
  );
}