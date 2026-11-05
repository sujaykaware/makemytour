package com.makemytrip.makemytrip.controllers;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/cancellation")
@CrossOrigin
public class CancellationController {

    // Stores refund status for each refund
    private final Map<String, Map<String, Object>> refundStatuses =
            new ConcurrentHashMap<>();

    @PostMapping("/calculate-refund")
    public Map<String, Object> calculateRefund(
            @RequestParam double bookingAmount,
            @RequestParam String reservationTime,
            @RequestParam String reason) {

        Map<String, Object> response = new HashMap<>();

        try {

            LocalDateTime reservationDateTime =
                    LocalDateTime.parse(reservationTime);

            LocalDateTime currentTime = LocalDateTime.now();

            long hoursSinceReservation =
                    Duration.between(
                            reservationDateTime,
                            currentTime
                    ).toHours();

            double refundPercentage;
            String policyMessage;

            if (hoursSinceReservation <= 24) {

                refundPercentage = 50;

                policyMessage =
                        "Cancellation within 24 hours: 50% refund";

            } else {

                refundPercentage = 25;

                policyMessage =
                        "Cancellation after 24 hours: 25% partial refund";
            }

            double refundAmount =
                    bookingAmount * refundPercentage / 100;

            // Create unique refund ID
            String refundId =
                    "REF-" + System.currentTimeMillis();

            // Create refund status information
            Map<String, Object> refundStatus =
                    new HashMap<>();

            refundStatus.put("status", "Pending");
            refundStatus.put(
                    "createdAt",
                    System.currentTimeMillis()
            );

            refundStatuses.put(
                    refundId,
                    refundStatus
            );

            response.put(
                    "refundId",
                    refundId
            );

            response.put(
                    "bookingAmount",
                    bookingAmount
            );

            response.put(
                    "refundPercentage",
                    refundPercentage
            );

            response.put(
                    "refundAmount",
                    refundAmount
            );

            response.put(
                    "reason",
                    reason
            );

            response.put(
                    "policyMessage",
                    policyMessage
            );

            response.put(
                    "status",
                    "Pending"
            );

            response.put(
                    "expectedTimeline",
                    "Refund expected within 5-7 business days"
            );

            return response;

        } catch (Exception e) {

            response.put(
                    "error",
                    "Invalid reservation time"
            );

            return response;
        }
    }

    // Check current refund status
    @GetMapping("/status/{refundId}")
    public Map<String, Object> getRefundStatus(
            @PathVariable String refundId) {

        Map<String, Object> refund =
                refundStatuses.get(refundId);

        if (refund == null) {

            Map<String, Object> error =
                    new HashMap<>();

            error.put(
                    "error",
                    "Refund not found"
            );

            return error;
        }

        long createdAt =
                (long) refund.get("createdAt");

        long elapsedSeconds =
                (System.currentTimeMillis() - createdAt)
                        / 1000;

        String status;

        /*
         * Demo refund progression:
         *
         * 0-10 seconds   → Pending
         * 10-20 seconds  → Processed
         * 20+ seconds    → Completed
         */

        if (elapsedSeconds < 10) {

            status = "Pending";

        } else if (elapsedSeconds < 20) {

            status = "Processed";

        } else {

            status = "Completed";
        }

        refund.put(
                "status",
                status
        );

        refund.put(
                "elapsedSeconds",
                elapsedSeconds
        );

        refund.put(
                "expectedTimeline",
                "Refund expected within 5-7 business days"
        );

        return refund;
    }
}