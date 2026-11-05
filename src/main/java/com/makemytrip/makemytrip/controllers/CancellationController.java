package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Seat;
import com.makemytrip.makemytrip.repositories.SeatRepository;
import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.models.Users.Booking;
import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.repositories.UserRepository;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import com.makemytrip.makemytrip.repositories.RoomRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/cancellation")
@CrossOrigin
public class CancellationController {

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private FlightRepository flightRepository;

        @Autowired
        private HotelRepository hotelRepository;

        @Autowired
        private SeatRepository seatRepository;
        @Autowired
        private RoomRepository roomRepository;

        // Demo timings for the refund tracker
        private static final long PROCESSED_AFTER_SECONDS = 60;
        private static final long COMPLETED_AFTER_SECONDS = 180;

        private static final List<String> VALID_REASONS = Arrays.asList(
                        "Travel plan changed",
                        "Found a better price",
                        "Change in schedule",
                        "Booked by mistake",
                        "Personal reasons",
                        "Other");

        // Works out the refund stage from the time since cancellation
        private String statusFor(Booking booking) {

                if (booking.getCancelledAt() == null) {
                        return booking.getRefundStatus();
                }

                long seconds = Duration.between(
                                booking.getCancelledAt(), LocalDateTime.now()).getSeconds();

                if (seconds >= COMPLETED_AFTER_SECONDS) {
                        return "Completed";
                }

                if (seconds >= PROCESSED_AFTER_SECONDS) {
                        return "Processed";
                }

                return "Pending";
        }

        private String timelineFor(String status) {

                if ("Completed".equals(status)) {
                        return "Refund completed. The amount has been credited to your original payment method";
                }

                if ("Processed".equals(status)) {
                        return "Refund processed. It will reach your account within 2-3 business days";
                }

                return "Refund expected within 5-7 business days";
        }

        // Cancel booking and calculate refund
        @PostMapping("/cancel/{userId}/{bookingId}")
        public Map<String, Object> cancelBooking(
                        @PathVariable String userId,
                        @PathVariable String bookingId,
                        @RequestParam String reason) {

                Map<String, Object> response = new HashMap<>();

                Optional<Users> usersOptional = userRepository.findById(userId);

                if (!usersOptional.isPresent()) {
                        response.put("error", "User not found");
                        return response;
                }

                Users user = usersOptional.get();

                Booking booking = user.getBookings().stream()
                                .filter(b -> bookingId.equals(b.getBookingId()))
                                .findFirst()
                                .orElse(null);

                if (booking == null) {
                        response.put("error", "Booking not found");
                        return response;
                }

                if ("Cancelled".equalsIgnoreCase(booking.getStatus())) {
                        response.put("error", "This booking is already cancelled");
                        return response;
                }

                if (!VALID_REASONS.contains(reason)) {
                        response.put("error", "Please select a valid cancellation reason");
                        return response;
                }

                if (booking.getCreatedAt() == null) {
                        response.put("error",
                                        "This older booking has no creation timestamp. Refund cannot be calculated accurately.");
                        return response;
                }

                LocalDateTime now = LocalDateTime.now();

                if (booking.getCreatedAt().isAfter(now)) {
                        response.put("error", "Invalid booking creation time");
                        return response;
                }

                // Calculate refund according to cancellation policy
                long hoursSinceBooking = Duration.between(
                                booking.getCreatedAt(), now).toHours();

                int refundPercentage;
                String policyMessage;

                if (hoursSinceBooking <= 24) {
                        refundPercentage = 50;
                        policyMessage = "Cancellation within 24 hours: 50% refund";
                } else {
                        refundPercentage = 25;
                        policyMessage = "Cancellation after 24 hours: 25% partial refund";
                }

                double refundAmount = Math.round(
                                booking.getTotalPrice() * refundPercentage) / 100.0;

                // Restore flight seats or hotel rooms
                if ("Flight".equalsIgnoreCase(booking.getType())) {

                        Optional<Flight> flightOptional = flightRepository.findById(booking.getItemId());

                        if (!flightOptional.isPresent()) {
                                response.put("error", "Flight not found. Booking was not cancelled.");
                                return response;
                        }

                        Flight flight = flightOptional.get();

                        flight.setAvailableSeats(
                                        flight.getAvailableSeats() + booking.getQuantity());

                        flightRepository.save(flight);

                        // Restore previously booked seats
                        if (booking.getSeatNumbers() != null
                                        && !booking.getSeatNumbers().isEmpty()) {

                                List<Seat> seatsToRestore = new ArrayList<>();

                                for (String seatNumber : booking.getSeatNumbers()) {

                                        Optional<Seat> seatOptional = seatRepository.findByFlightIdAndSeatNumber(
                                                        booking.getItemId(),
                                                        seatNumber);

                                        if (seatOptional.isPresent()) {
                                                Seat seat = seatOptional.get();

                                                seat.setStatus("Available");

                                                seatsToRestore.add(seat);
                                        }
                                }

                                seatRepository.saveAll(seatsToRestore);
                        }
                        ;

                } else if ("Hotel".equalsIgnoreCase(booking.getType())) {

                        Optional<Hotel> hotelOptional = hotelRepository.findById(booking.getItemId());

                        if (!hotelOptional.isPresent()) {
                                response.put("error", "Hotel not found. Booking was not cancelled.");
                                return response;
                        }

                        Hotel hotel = hotelOptional.get();

                        hotel.setAvailableRooms(
                                        hotel.getAvailableRooms() + booking.getQuantity());

                        hotelRepository.save(hotel);
                        // Give the booked room types back
                        if (booking.getRoomQuantities() != null) {
                                for (Map.Entry<String, Integer> e : booking.getRoomQuantities().entrySet()) {
                                        roomRepository.findById(e.getKey()).ifPresent(room -> {
                                                room.setAvailableRooms(room.getAvailableRooms() + e.getValue());
                                                roomRepository.save(room);
                                        });
                                }
                        }

                } else {
                        response.put("error", "Unsupported booking type");
                        return response;
                }

                // Generate unique refund ID
                String refundId = "REF-" + UUID.randomUUID();

                // Update booking details
                booking.setStatus("Cancelled");
                booking.setCancellationReason(reason);
                booking.setCancelledAt(now);

                booking.setRefundId(refundId);
                booking.setRefundAmount(refundAmount);
                booking.setRefundPercentage(refundPercentage);
                booking.setRefundStatus("Pending");
                booking.setRefundExpectedTimeline(timelineFor("Pending"));

                // Save updated booking and refund information in MongoDB
                userRepository.save(user);

                response.put("message", "Booking cancelled successfully");
                response.put("bookingId", bookingId);
                response.put("refundId", refundId);
                response.put("bookingAmount", booking.getTotalPrice());
                response.put("refundPercentage", refundPercentage);
                response.put("refundAmount", refundAmount);
                response.put("reason", reason);
                response.put("policyMessage", policyMessage);
                response.put("status", "Cancelled");
                response.put("refundStatus", "Pending");
                response.put("expectedTimeline", timelineFor("Pending"));

                return response;
        }

        // Get refund status (moves Pending -> Processed -> Completed over time)
        @GetMapping("/status/{refundId}")
        public Map<String, Object> getRefundStatus(
                        @PathVariable String refundId) {

                Map<String, Object> response = new HashMap<>();

                for (Users user : userRepository.findAll()) {

                        if (user.getBookings() == null) {
                                continue;
                        }

                        for (Booking booking : user.getBookings()) {

                                if (refundId.equals(booking.getRefundId())) {

                                        String currentStatus = statusFor(booking);

                                        // Save the new stage when it changes
                                        if (currentStatus != null
                                                        && !currentStatus.equals(booking.getRefundStatus())) {

                                                booking.setRefundStatus(currentStatus);
                                                booking.setRefundExpectedTimeline(
                                                                timelineFor(currentStatus));

                                                userRepository.save(user);
                                        }

                                        response.put("refundId", refundId);
                                        response.put("bookingId", booking.getBookingId());
                                        response.put("refundAmount", booking.getRefundAmount());
                                        response.put("refundPercentage", booking.getRefundPercentage());
                                        response.put("reason", booking.getCancellationReason());
                                        response.put("status", booking.getRefundStatus());
                                        response.put("expectedTimeline",
                                                        booking.getRefundExpectedTimeline());

                                        return response;
                                }
                        }
                }

                response.put("error", "Refund not found");
                return response;
        }
}