"use client";

import { useEffect, useState } from "react";

type Recommendation = {
    id: string;
    type: string;
    name: string;
    location: string;
    price: number;
    score: number;
    reason: string;
};

export default function Recommendations() {
    const [recommendations, setRecommendations] =
        useState<Recommendation[]>([]);

    const [preference, setPreference] =
        useState("beach");

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const loadRecommendations = async () => {
        setLoading(true);

        try {
            const response = await fetch(
                `http://localhost:8080/recommendations/guest?preference=${preference}`
            );

            if (!response.ok) {
                throw new Error("Failed to load recommendations");
            }

            const data = await response.json();

            setRecommendations(data);
        } catch (error) {
            console.error(
                "Recommendation error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecommendations();
    }, [preference]);

    const sendFeedback = async (
        recommendationId: string,
        helpful: boolean
    ) => {
        try {
            const response = await fetch(
                `http://localhost:8080/recommendations/feedback?userId=guest&recommendationId=${recommendationId}&helpful=${helpful}`,
                {
                    method: "POST",
                }
            );

            if (response.ok) {
                setMessage(
                    helpful
                        ? "Thanks! We'll show more like this."
                        : "Thanks! We'll improve your recommendations."
                );

                setTimeout(() => {
                    setMessage("");
                }, 3000);
            }
        } catch (error) {
            console.error(
                "Feedback error:",
                error
            );
        }
    };

    return (
        <section className="mt-10">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-blue-900 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
                    Recommended For You
                </h2>

                <p className="text-blue-700 mt-1 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
                    Personalized suggestions based on
                    your travel preferences and activity.
                </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={() => setPreference("beach")}
                    className={`px-4 py-2 rounded-lg border ${preference === "beach"
                            ? "bg-blue-600 text-white"
                            : "bg-white"
                        }`}
                >
                    Beach Destinations
                </button>

                <button
                    onClick={() => setPreference("city")}
                    className={`px-4 py-2 rounded-lg border ${preference === "city"
                            ? "bg-blue-600 text-white"
                            : "bg-white"
                        }`}
                >
                    City Trips
                </button>

                <button
                    onClick={() => setPreference("luxury")}
                    className={`px-4 py-2 rounded-lg border ${preference === "luxury"
                            ? "bg-blue-600 text-white"
                            : "bg-white"
                        }`}
                >
                    Luxury Stays
                </button>
            </div>

            {message && (
                <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 mb-5">
                    {message}
                </div>
            )}

            {loading && (
                <p className="text-gray-600">
                    Finding recommendations...
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {recommendations.map(
                    (recommendation) => (
                        <div
                            key={recommendation.id}
                            className="bg-white border rounded-xl p-5 shadow-sm"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {recommendation.type}
                                    </span>

                                    <h3 className="text-lg font-bold mt-3">
                                        {recommendation.name}
                                    </h3>

                                    <p className="text-gray-500">
                                        {recommendation.location}
                                    </p>
                                </div>

                                <span className="text-sm font-semibold text-green-600">
                                    {recommendation.score}% match
                                </span>
                            </div>

                            <p className="text-lg font-semibold mt-4">
                                ₹{recommendation.price}

                                {recommendation.type ===
                                    "HOTEL" && (
                                        <span className="text-sm text-gray-500">
                                            {" "}
                                            / night
                                        </span>
                                    )}
                            </p>

                            <div className="mt-4 bg-blue-50 rounded-lg p-3">
                                <p className="text-sm font-semibold text-blue-700">
                                    Why this recommendation?
                                </p>

                                <p className="text-sm text-gray-600 mt-1">
                                    {recommendation.reason}
                                </p>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() =>
                                        sendFeedback(
                                            recommendation.id,
                                            true
                                        )
                                    }
                                    className="flex-1 border rounded-lg py-2 text-sm hover:bg-green-50"
                                >
                                    Helpful
                                </button>

                                <button
                                    onClick={() =>
                                        sendFeedback(
                                            recommendation.id,
                                            false
                                        )
                                    }
                                    className="flex-1 border rounded-lg py-2 text-sm hover:bg-red-50"
                                >
                                    Not Relevant
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </section>
    );
}