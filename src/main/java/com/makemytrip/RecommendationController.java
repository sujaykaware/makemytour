package com.makemytrip.makemytrip;

import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    // Stores feedback for the demo
    private final Map<String, Map<String, Integer>> feedback = new HashMap<>();

    // =========================
    // GUEST RECOMMENDATIONS
    // =========================

    @GetMapping("/guest")
    public List<Map<String, Object>> getGuestRecommendations(
            @RequestParam(defaultValue = "beach") String preference) {

        return getRecommendations("guest", preference);
    }

    // =========================
    // USER RECOMMENDATIONS
    // =========================

    @GetMapping("/{userId}")
    public List<Map<String, Object>> getRecommendations(
            @PathVariable String userId,
            @RequestParam(defaultValue = "beach") String preference) {

        List<Map<String, Object>> recommendations = new ArrayList<>();

        // =========================
        // BEACH DESTINATIONS
        // =========================

        if (preference.equalsIgnoreCase("beach")) {

            Map<String, Object> bali = new HashMap<>();

            bali.put("id", "6ab00d494b51786a26a0cdd8");
            bali.put("type", "HOTEL");
            bali.put("name", "Hyatt Regency");
            bali.put("location", "Bali, Indonesia");
            bali.put("price", 4000);
            bali.put("score", 90);
            bali.put(
                    "reason",
                    "You liked beach destinations! Try Bali."
            );

            recommendations.add(bali);
        }

        // =========================
        // CITY TRIPS
        // =========================

        else if (preference.equalsIgnoreCase("city")) {

            Map<String, Object> tokyo = new HashMap<>();

            tokyo.put("id", "6ab00b3d4b51786a26a0cdd2");
            tokyo.put("type", "HOTEL");
            tokyo.put("name", "Hyatt Regency");
            tokyo.put("location", "Tokyo");
            tokyo.put("price", 4000);
            tokyo.put("score", 88);
            tokyo.put(
                    "reason",
                    "Tokyo matches your interest in city destinations."
            );

            recommendations.add(tokyo);

            Map<String, Object> newYork = new HashMap<>();

            newYork.put("id", "6ab00b504b51786a26a0cdd4");
            newYork.put("type", "HOTEL");
            newYork.put("name", "The Oberoi");
            newYork.put("location", "New York");
            newYork.put("price", 6000);
            newYork.put("score", 85);
            newYork.put(
                    "reason",
                    "You frequently explore city destinations."
            );

            recommendations.add(newYork);

            Map<String, Object> london = new HashMap<>();

            london.put("id", "6ab00ce84b51786a26a0cdd6");
            london.put("type", "HOTEL");
            london.put("name", "Hyatt Regency");
            london.put("location", "London");
            london.put("price", 4000);
            london.put("score", 82);
            london.put(
                    "reason",
                    "London matches your city travel interests."
            );

            recommendations.add(london);
        }

        // =========================
        // LUXURY STAYS
        // =========================

        else if (preference.equalsIgnoreCase("luxury")) {

            Map<String, Object> paris = new HashMap<>();

            paris.put("id", "6ab00b2f4b51786a26a0cdd0");
            paris.put("type", "HOTEL");
            paris.put("name", "Luxury Palace");
            paris.put("location", "Paris");
            paris.put("price", 5000);
            paris.put("score", 90);
            paris.put(
                    "reason",
                    "You showed interest in premium stays."
            );

            recommendations.add(paris);

            Map<String, Object> newYork = new HashMap<>();

            newYork.put("id", "6ab00b504b51786a26a0cdd4");
            newYork.put("type", "HOTEL");
            newYork.put("name", "The Oberoi");
            newYork.put("location", "New York");
            newYork.put("price", 6000);
            newYork.put("score", 86);
            newYork.put(
                    "reason",
                    "The Oberoi offers a premium stay for your trip."
            );

            recommendations.add(newYork);
        }

        return recommendations;
    }

    // =========================
    // SAVE FEEDBACK
    // =========================

    @PostMapping("/feedback")
    public String saveFeedback(
            @RequestParam String userId,
            @RequestParam String recommendationId,
            @RequestParam boolean helpful) {

        feedback
                .computeIfAbsent(
                        userId,
                        key -> new HashMap<>()
                )
                .put(
                        recommendationId,
                        helpful ? 1 : -1
                );

        return helpful
                ? "Recommendation marked as helpful"
                : "Recommendation marked as irrelevant";
    }

    // =========================
    // VIEW FEEDBACK
    // =========================

    @GetMapping("/feedback/{userId}")
    public Map<String, Integer> getFeedback(
            @PathVariable String userId) {

        return feedback.getOrDefault(
                userId,
                new HashMap<>()
        );
    }
}


