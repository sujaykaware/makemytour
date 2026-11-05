package com.makemytrip.makemytrip.controllers;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/pricing")
@CrossOrigin
public class PricingController {

    private final Map<String, Double> basePrices = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> priceHistory =
            new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> frozenPrices =
            new ConcurrentHashMap<>();

    @GetMapping("/{flightId}")
    public Map<String, Object> getDynamicPrice(
            @PathVariable String flightId,
            @RequestParam(defaultValue = "5500") double basePrice,
            @RequestParam(defaultValue = "10") int demand,
            @RequestParam(defaultValue = "false") boolean peakSeason) {

        basePrices.putIfAbsent(flightId, basePrice);

        double price = basePrices.get(flightId);

        // Demand-based pricing
        if (demand >= 80) {
            price = price * 1.15;
        } else if (demand >= 50) {
            price = price * 1.10;
        }

        // 20% peak/holiday increase
        if (peakSeason) {
            price = price * 1.20;
        }

        // Check price freeze
        Map<String, Object> frozen = frozenPrices.get(flightId);

        if (frozen != null) {
            long expiry =
                    (long) frozen.get("expiresAt");

            if (System.currentTimeMillis() < expiry) {
                price = (double) frozen.get("price");
            } else {
                frozenPrices.remove(flightId);
            }
        }

        price = Math.round(price * 100.0) / 100.0;

        savePriceHistory(flightId, price);

        Map<String, Object> response = new HashMap<>();

        response.put("flightId", flightId);
        response.put("basePrice", basePrices.get(flightId));
        response.put("currentPrice", price);
        response.put("demand", demand);
        response.put("peakSeason", peakSeason);
        response.put(
                "pricingMessage",
                peakSeason
                        ? "20% peak season pricing applied"
                        : "Price updated based on current demand"
        );

        response.put(
                "frozen",
                frozenPrices.containsKey(flightId)
        );

        return response;
    }

    @GetMapping("/{flightId}/history")
    public List<Map<String, Object>> getPriceHistory(
            @PathVariable String flightId) {

        return priceHistory.getOrDefault(
                flightId,
                new ArrayList<>()
        );
    }

    @PostMapping("/{flightId}/freeze")
    public Map<String, Object> freezePrice(
            @PathVariable String flightId,
            @RequestParam double price,
            @RequestParam(defaultValue = "15") int minutes) {

        long expiresAt =
                System.currentTimeMillis()
                        + (minutes * 60L * 1000L);

        Map<String, Object> freeze = new HashMap<>();

        freeze.put("price", price);
        freeze.put("expiresAt", expiresAt);
        freeze.put("durationMinutes", minutes);

        frozenPrices.put(flightId, freeze);

        Map<String, Object> response = new HashMap<>();

        response.put("message", "Price frozen successfully");
        response.put("flightId", flightId);
        response.put("frozenPrice", price);
        response.put("durationMinutes", minutes);

        return response;
    }

    private void savePriceHistory(
            String flightId,
            double price) {

        List<Map<String, Object>> history =
                priceHistory.computeIfAbsent(
                        flightId,
                        key -> new ArrayList<>()
                );

        Map<String, Object> entry = new HashMap<>();

        entry.put("price", price);
        entry.put(
                "time",
                LocalDateTime.now().toString()
        );

        history.add(entry);

        // Keep last 20 prices
        if (history.size() > 20) {
            history.remove(0);
        }
    }
}