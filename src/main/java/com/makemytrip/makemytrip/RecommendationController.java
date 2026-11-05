package com.makemytrip.makemytrip;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import com.makemytrip.makemytrip.repositories.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    private static final List<String> BEACH_CITIES =
            Arrays.asList("bali", "goa", "maldives", "phuket");

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final FlightRepository flightRepository;
    private final RecommendationFeedbackRepository feedbackRepository;

    public RecommendationController(
            UserRepository userRepository,
            HotelRepository hotelRepository,
            FlightRepository flightRepository,
            RecommendationFeedbackRepository feedbackRepository) {
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.flightRepository = flightRepository;
        this.feedbackRepository = feedbackRepository;
    }

    // ---------------------------------------------------------
    // Simple holder for a hotel or flight destination
    // ---------------------------------------------------------
    private static class Item {
        String id;
        String type;      // HOTEL or FLIGHT
        String name;
        String city;
        String theme;     // beach or city
        double price;
        boolean luxury;
    }

    private static class Reason {
        final double points;
        final String text;
        Reason(double points, String text) {
            this.points = points;
            this.text = text;
        }
    }

    private static class Scored {
        Item item;
        double score;
        List<Reason> reasons = new ArrayList<>();
    }

    private static String themeOf(String city) {
        String c = city == null ? "" : city.toLowerCase();
        for (String beach : BEACH_CITIES) {
            if (c.contains(beach)) return "beach";
        }
        return "city";
    }

    private static String cleanCity(String city) {
        if (city == null) return "";
        int comma = city.indexOf(',');
        return (comma > 0 ? city.substring(0, comma) : city).trim();
    }

    private static Item fromHotel(Hotel h) {
        Item item = new Item();
        item.id = h.getId();
        item.type = "HOTEL";
        item.name = h.gethotelName();
        item.city = cleanCity(h.getLocation());
        item.theme = themeOf(item.city);
        item.price = h.getPricePerNight();
        item.luxury = h.getPricePerNight() >= 10000;
        return item;
    }

    private static Item fromFlight(Flight f) {
        Item item = new Item();
        item.id = f.getId();
        item.type = "FLIGHT";
        item.name = f.getFlightName() + ": " + f.getFrom() + " to " + f.getTo();
        item.city = cleanCity(f.getTo());
        item.theme = themeOf(item.city);
        item.price = f.getPrice();
        item.luxury = false;
        return item;
    }

    private static String themeLabel(String theme) {
        return "beach".equals(theme) ? "beaches" : "city trips";
    }

    private static String prefLabel(String preference) {
        if ("beach".equalsIgnoreCase(preference)) return "Beach Destinations";
        if ("city".equalsIgnoreCase(preference)) return "City Trips";
        if ("luxury".equalsIgnoreCase(preference)) return "Luxury Stays";
        return "";
    }

    private static boolean matchesPreference(Item item, String preference) {
        if ("beach".equalsIgnoreCase(preference)) return "beach".equals(item.theme);
        if ("city".equalsIgnoreCase(preference)) return "city".equals(item.theme);
        if ("luxury".equalsIgnoreCase(preference)) return item.luxury;
        return false;
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    // ---------------------------------------------------------
    // GET /recommendations/{userId}?preference=beach
    // ---------------------------------------------------------
    @GetMapping("/{userId}")
    public List<Map<String, Object>> getRecommendations(
            @PathVariable String userId,
            @RequestParam(defaultValue = "") String preference) {

        // 1. Collect every hotel and flight
        Map<String, Item> lookup = new HashMap<>();
        List<Item> candidates = new ArrayList<>();

        for (Hotel h : hotelRepository.findAll()) {
            if (h.getId() == null) continue;
            Item item = fromHotel(h);
            lookup.put(item.id, item);
            candidates.add(item);
        }

        // Flights: one candidate per destination (the cheapest one)
        Map<String, Flight> cheapestPerDestination = new HashMap<>();
        for (Flight f : flightRepository.findAll()) {
            if (f.getId() == null || f.getTo() == null) continue;
            lookup.put(f.getId(), fromFlight(f));
            String key = cleanCity(f.getTo()).toLowerCase();
            Flight current = cheapestPerDestination.get(key);
            if (current == null || f.getPrice() < current.getPrice()) {
                cheapestPerDestination.put(key, f);
            }
        }
        for (Flight f : cheapestPerDestination.values()) {
            candidates.add(lookup.get(f.getId()));
        }

        // 2. Booking history of every user (cancelled bookings ignored)
        Map<String, Set<String>> itemsByUser = new HashMap<>();
        for (Users u : userRepository.findAll()) {
            Set<String> items = new HashSet<>();
            if (u.getBookings() != null) {
                for (Users.Booking b : u.getBookings()) {
                    if (b.getItemId() == null) continue;
                    if ("Cancelled".equalsIgnoreCase(b.getStatus())) continue;
                    items.add(b.getItemId());
                }
            }
            itemsByUser.put(u.getId(), items);
        }

        Set<String> mine = itemsByUser.getOrDefault(userId, new HashSet<>());

        // 3. This user's profile
        Map<String, Integer> themeCount = new HashMap<>();
        Map<String, Integer> typeCount = new HashMap<>();
        double priceSum = 0;
        int known = 0;
        for (String id : mine) {
            Item item = lookup.get(id);
            if (item == null) continue;
            themeCount.merge(item.theme, 1, Integer::sum);
            typeCount.merge(item.type, 1, Integer::sum);
            priceSum += item.price;
            known++;
        }
        double avgPrice = known > 0 ? priceSum / known : 0;
        String favouriteType = null;
        int best = 0;
        for (Map.Entry<String, Integer> e : typeCount.entrySet()) {
            if (e.getValue() > best) {
                best = e.getValue();
                favouriteType = e.getKey();
            }
        }

        // 4. Collaborative filtering: users with overlapping bookings
        Map<String, Double> similarity = new HashMap<>();
        for (Map.Entry<String, Set<String>> e : itemsByUser.entrySet()) {
            if (e.getKey().equals(userId) || mine.isEmpty()) continue;
            Set<String> other = e.getValue();
            int shared = 0;
            for (String id : mine) {
                if (other.contains(id)) shared++;
            }
            if (shared == 0) continue;
            int union = mine.size() + other.size() - shared;
            similarity.put(e.getKey(), (double) shared / union);
        }

        // 5. Feedback (this user's, and everyone's)
        List<RecommendationFeedback> allFeedback = feedbackRepository.findAll();
        Set<String> irrelevantIds = new HashSet<>();
        Set<String> helpfulIds = new HashSet<>();
        Map<String, Integer> cityNet = new HashMap<>();
        Map<String, Integer> themeNet = new HashMap<>();
        Map<String, Integer> globalNet = new HashMap<>();
        for (RecommendationFeedback fb : allFeedback) {
            int vote = fb.isHelpful() ? 1 : -1;
            globalNet.merge(fb.getRecommendationId(), vote, Integer::sum);
            if (!userId.equals(fb.getUserId())) continue;
            if (fb.isHelpful()) helpfulIds.add(fb.getRecommendationId());
            else irrelevantIds.add(fb.getRecommendationId());
            if (fb.getCity() != null) cityNet.merge(fb.getCity().toLowerCase(), vote, Integer::sum);
            if (fb.getTheme() != null) themeNet.merge(fb.getTheme(), vote, Integer::sum);
        }

        // 6. Score every candidate
        List<Scored> scoredList = new ArrayList<>();
        for (Item item : candidates) {
            if (mine.contains(item.id)) continue;           // already booked
            if (irrelevantIds.contains(item.id)) continue;  // user said not relevant

            Scored s = new Scored();
            s.item = item;
            s.score = 20; // base score

            // Popularity among all users
            int bookedBy = 0;
            for (Set<String> items : itemsByUser.values()) {
                if (items.contains(item.id)) bookedBy++;
            }
            double popularity = Math.min(10, bookedBy * 3);
            s.score += popularity;
            if (popularity > 0) {
                s.reasons.add(new Reason(popularity,
                        "Popular with other travelers."));
            }

            // The interest chip the user picked
            if (matchesPreference(item, preference)) {
                s.score += 20;
                s.reasons.add(new Reason(20, "You chose "
                        + prefLabel(preference) + ", and " + item.city
                        + " fits it."));
            }

            // Content-based: what the user's own bookings show
            if (known > 0) {
                int sameTheme = themeCount.getOrDefault(item.theme, 0);
                if (sameTheme > 0) {
                    double points = 30.0 * sameTheme / known;
                    s.score += points;
                    String text = "beach".equals(item.theme)
                            ? "You liked beaches! Try " + item.city + "."
                            : "You like " + themeLabel(item.theme) + " ("
                                + sameTheme + " of your " + known
                                + " bookings). Try " + item.city + ".";
                    s.reasons.add(new Reason(points, text));
                }
                if (item.type.equals(favouriteType)) {
                    s.score += 5;
                    s.reasons.add(new Reason(5, "You mostly book "
                            + item.type.toLowerCase() + "s."));
                }
                if (avgPrice > 0 && item.price > 0) {
                    double ratio = Math.min(item.price, avgPrice)
                            / Math.max(item.price, avgPrice);
                    double points = 10 * ratio;
                    s.score += points;
                    if (ratio >= 0.6) {
                        s.reasons.add(new Reason(points,
                                "Priced close to what you usually spend."));
                    }
                }
            }

            // Collaborative filtering
            double collab = 0;
            int similarCount = 0;
            for (Map.Entry<String, Double> e : similarity.entrySet()) {
                if (itemsByUser.get(e.getKey()).contains(item.id)) {
                    collab += e.getValue();
                    similarCount++;
                }
            }
            if (collab > 0) {
                double points = Math.min(25, collab * 40);
                s.score += points;
                s.reasons.add(new Reason(points,
                        similarCount + " traveler"
                        + (similarCount == 1 ? "" : "s")
                        + " with bookings like yours also booked this."));
            }

            // Feedback loop
            double fbPoints = clamp(
                    cityNet.getOrDefault(item.city.toLowerCase(), 0) * 8
                            + themeNet.getOrDefault(item.theme, 0) * 3,
                    -20, 15);
            if (helpfulIds.contains(item.id)) fbPoints += 10;
            fbPoints += clamp(globalNet.getOrDefault(item.id, 0) * 2, -8, 8);
            s.score += fbPoints;
            if (fbPoints > 0) {
                s.reasons.add(new Reason(fbPoints,
                        "You and other users marked similar suggestions as helpful."));
            }

            scoredList.add(s);
        }

        scoredList.sort((a, b) -> Double.compare(b.score, a.score));

        // 7. Build the response (top 6)
        List<Map<String, Object>> result = new ArrayList<>();
        for (Scored s : scoredList) {
            if (result.size() >= 6) break;

            s.reasons.sort((a, b) -> Double.compare(b.points, a.points));
            StringBuilder reason = new StringBuilder();
            int shown = 0;
            for (Reason r : s.reasons) {
                if (shown >= 3) break;
                if (reason.length() > 0) reason.append(" ");
                reason.append(r.text);
                shown++;
            }
            if (reason.length() == 0) {
                reason.append("A popular pick to get you started.");
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", s.item.id);
            map.put("type", s.item.type);
            map.put("name", s.item.name);
            map.put("location", s.item.city);
            map.put("price", Math.round(s.item.price));
            map.put("score", (int) Math.min(99, Math.round(s.score)));
            map.put("reason", reason.toString());
            map.put("algorithm", known > 0
                    ? "Content-based + collaborative filtering"
                    : "Popularity + your chosen interest");
            result.add(map);
        }

        return result;
    }

    // ---------------------------------------------------------
    // POST /recommendations/feedback
    // ---------------------------------------------------------
    @PostMapping("/feedback")
    public Map<String, Object> saveFeedback(
            @RequestParam String userId,
            @RequestParam String recommendationId,
            @RequestParam boolean helpful) {

        String city = null;
        String type = null;

        Optional<Hotel> hotel = hotelRepository.findById(recommendationId);
        if (hotel.isPresent()) {
            type = "HOTEL";
            city = cleanCity(hotel.get().getLocation());
        } else {
            Optional<Flight> flight = flightRepository.findById(recommendationId);
            if (flight.isPresent()) {
                type = "FLIGHT";
                city = cleanCity(flight.get().getTo());
            }
        }

        RecommendationFeedback fb = feedbackRepository
                .findFirstByUserIdAndRecommendationId(userId, recommendationId)
                .orElseGet(RecommendationFeedback::new);

        fb.setUserId(userId);
        fb.setRecommendationId(recommendationId);
        fb.setItemType(type);
        fb.setCity(city);
        fb.setTheme(city == null ? null : themeOf(city));
        fb.setHelpful(helpful);
        fb.setCreatedAt(java.time.LocalDateTime.now());
        feedbackRepository.save(fb);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("helpful", helpful);
        result.put("message", "Feedback saved. Your recommendations will adapt.");
        return result;
    }
}