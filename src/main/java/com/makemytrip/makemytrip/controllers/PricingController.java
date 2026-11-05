package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.models.Seat;
import com.makemytrip.makemytrip.repositories.SeatRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/pricing")
@CrossOrigin
public class PricingController {

    @Autowired
    private FlightRepository flightRepository;
    @Autowired
    private SeatRepository seatRepository;

    // Set pricing.peak-override=true in application.properties to force peak
    // pricing (demo)
    @Value("${pricing.peak-override:false}")
    private boolean peakOverride;

    private final Map<String, List<Map<String, Object>>> priceHistory = new ConcurrentHashMap<>();

    // key = flightId + ":" + userId
    private final Map<String, Map<String, Object>> frozenPrices = new ConcurrentHashMap<>();

    // Holiday / peak periods (start and end dates are inclusive). Edit these as
    // needed.
    private static final String[] PEAK_NAMES = {
            "Navratri-Dussehra", "Diwali", "Christmas and New Year"
    };

    private static final LocalDate[][] PEAK_PERIODS = {
            { LocalDate.of(2026, 10, 10), LocalDate.of(2026, 10, 21) },
            { LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 12) },
            { LocalDate.of(2026, 12, 20), LocalDate.of(2027, 1, 3) }
    };

    // ---------- helpers ----------

    private Flight loadFlight(String flightId) {
        return flightRepository.findById(flightId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found."));
    }

    // Demand = share of the seat map already occupied (10% to 100%)
    private int demandFor(Flight flight) {
        List<Seat> seats = seatRepository.findByFlightId(flight.getId());

        if (seats != null && !seats.isEmpty()) {
            long occupied = seats.stream()
                    .filter(s -> "Occupied".equalsIgnoreCase(s.getStatus()))
                    .count();
            int percent = (int) Math.round(occupied * 100.0 / seats.size());
            return Math.max(10, Math.min(100, percent));
        }

        int seatsLeft = Math.max(0, flight.getAvailableSeats());
        return Math.max(10, Math.min(100, 100 - seatsLeft * 2));
    }

    private double demandMultiplier(int demand) {
        if (demand >= 80)
            return 1.15;
        if (demand >= 50)
            return 1.10;
        return 1.0;
    }

    private LocalDate travelDate(Flight flight) {
        String text = flight.getDepartureTime();

        if (text != null && text.length() >= 10) {
            try {
                return LocalDate.parse(text.substring(0, 10));
            } catch (Exception ignored) {
            }
        }

        return LocalDate.now();
    }

    // Returns the holiday name if the flight travels in a peak period, otherwise
    // null
    private String peakPeriodName(Flight flight) {
        if (peakOverride)
            return "Holiday season";

        LocalDate day = travelDate(flight);

        for (int i = 0; i < PEAK_PERIODS.length; i++) {
            if (!day.isBefore(PEAK_PERIODS[i][0]) && !day.isAfter(PEAK_PERIODS[i][1])) {
                return PEAK_NAMES[i];
            }
        }

        return null;
    }

    private double marketPrice(double base, int demand, boolean peak) {
        double price = base * demandMultiplier(demand);
        if (peak)
            price *= 1.20;
        return roundPrice(price);
    }

    // ---------- endpoints ----------
    // Used by BookingService to check the price sent from the browser
    public double currentFarePerSeat(String flightId, String userId) {
        Flight flight = loadFlight(flightId);

        double market = marketPrice(
                flight.getPrice(),
                demandFor(flight),
                peakPeriodName(flight) != null);

        Map<String, Object> frozen = frozenPrices.get(flightId + ":" + userId);

        if (frozen != null
                && System.currentTimeMillis() < ((Number) frozen.get("expiresAt")).longValue()) {
            // A frozen fare is honoured, so use the lower of the two
            return Math.min(market, ((Number) frozen.get("price")).doubleValue());
        }

        return market;
    }

    @GetMapping("/{flightId}")
    public Map<String, Object> getDynamicPrice(
            @PathVariable String flightId,
            @RequestParam(defaultValue = "guest") String userId) {

        Flight flight = loadFlight(flightId);

        double base = flight.getPrice();
        int demand = demandFor(flight);
        String peakName = peakPeriodName(flight);
        boolean peak = peakName != null;

        double marketNow = marketPrice(base, demand, peak);

        // History records the market price, not a frozen one
        savePriceHistory(flightId, marketNow, base);

        String key = flightId + ":" + userId;
        Map<String, Object> frozen = frozenPrices.get(key);
        boolean isFrozen = false;
        long expiresAt = 0L;
        double currentPrice = marketNow;

        if (frozen != null) {
            expiresAt = ((Number) frozen.get("expiresAt")).longValue();

            if (System.currentTimeMillis() < expiresAt) {
                currentPrice = ((Number) frozen.get("price")).doubleValue();
                isFrozen = true;
            } else {
                frozenPrices.remove(key, frozen);
            }
        }

        String message = "Base fare adjusted by demand (x" + demandMultiplier(demand) + ")"
                + (peak ? " and 20% " + peakName + " peak-season increase." : ".");

        if (isFrozen) {
            message = "Your fare is frozen. The live fare is ₹"
                    + String.format("%,.0f", marketNow) + ".";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("flightId", flightId);
        response.put("basePrice", base);
        response.put("marketPrice", marketNow);
        response.put("currentPrice", roundPrice(currentPrice));
        response.put("finalPrice", roundPrice(currentPrice));
        response.put("seatsLeft", flight.getAvailableSeats());
        response.put("demand", demand);
        response.put("demandMultiplier", demandMultiplier(demand));
        response.put("peakSeason", peak);
        response.put("peakName", peakName);
        response.put("peakMultiplier", peak ? 1.20 : 1.0);
        response.put("frozen", isFrozen);
        response.put("expiresAt", isFrozen ? expiresAt : null);
        response.put("remainingSeconds",
                isFrozen ? Math.max(0, (expiresAt - System.currentTimeMillis()) / 1000) : 0);
        response.put("pricingMessage", message);

        return response;
    }

    @GetMapping("/{flightId}/history")
    public List<Map<String, Object>> getPriceHistory(@PathVariable String flightId) {
        List<Map<String, Object>> history = priceHistory.get(flightId);

        if (history == null)
            return Collections.emptyList();

        synchronized (history) {
            return new ArrayList<>(history);
        }
    }

    @PostMapping("/{flightId}/freeze")
    public Map<String, Object> freezePrice(
            @PathVariable String flightId,
            @RequestParam(defaultValue = "guest") String userId) {

        Flight flight = loadFlight(flightId);

        String key = flightId + ":" + userId;

        // Do not allow extending an active freeze
        Map<String, Object> existing = frozenPrices.get(key);
        if (existing != null
                && System.currentTimeMillis() < ((Number) existing.get("expiresAt")).longValue()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Price is already frozen.");
        }

        // The server decides the price that gets frozen
        double price = marketPrice(
                flight.getPrice(),
                demandFor(flight),
                peakPeriodName(flight) != null);

        int minutes = 15;
        long expiresAt = System.currentTimeMillis() + minutes * 60_000L;

        Map<String, Object> freeze = new HashMap<>();
        freeze.put("price", price);
        freeze.put("expiresAt", expiresAt);
        frozenPrices.put(key, freeze);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Price frozen successfully.");
        response.put("flightId", flightId);
        response.put("frozenPrice", price);
        response.put("durationMinutes", minutes);
        response.put("expiresAt", expiresAt);
        response.put("remainingSeconds", minutes * 60L);

        return response;
    }

    // ---------- history ----------

    private void savePriceHistory(String flightId, double price, double basePrice) {
        List<Map<String, Object>> history = priceHistory.computeIfAbsent(
                flightId, k -> Collections.synchronizedList(new ArrayList<>()));

        synchronized (history) {
            // DEMO ONLY: seed earlier points the first time so the graph is not a single
            // bar
            if (history.isEmpty()) {
                double[] factors = { 0.95, 0.97, 1.0, 1.03, 1.05, 1.02, 0.99, 1.04, 1.01 };

                for (int i = 0; i < factors.length; i++) {
                    Map<String, Object> old = new LinkedHashMap<>();
                    old.put("price", roundPrice(price * factors[i]));
                    old.put("time", LocalDateTime.now().minusHours(factors.length - i).toString());
                    history.add(old);
                }
            }

            double last = ((Number) history.get(history.size() - 1).get("price")).doubleValue();
            if (Double.compare(last, price) == 0)
                return;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("price", price);
            entry.put("time", LocalDateTime.now().toString());
            history.add(entry);

            while (history.size() > 20)
                history.remove(0);
        }
    }

    private double roundPrice(double price) {
        return Math.round(price * 100.0) / 100.0;
    }
}