
package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.models.Users.Booking;
import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.models.Seat;
import com.makemytrip.makemytrip.models.Room;
import com.makemytrip.makemytrip.controllers.PricingController;
import com.makemytrip.makemytrip.repositories.RoomRepository;
import java.util.Map;
import java.util.HashMap;

import com.makemytrip.makemytrip.repositories.UserRepository;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import com.makemytrip.makemytrip.repositories.SeatRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;
import java.util.HashSet;

@Service
public class BookingService {

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
    @Autowired
    private PricingController pricingController;

    public Booking bookFlight(
            String userId,
            String flightId,
            int seats,
            double price,
            List<String> seatNumbers) {

        Optional<Users> usersOptional = userRepository.findById(userId);

        Optional<Flight> flightOptional = flightRepository.findById(flightId);

        if (usersOptional.isEmpty() || flightOptional.isEmpty()) {
            throw new RuntimeException("User or flight not found");
        }

        Users user = usersOptional.get();
        Flight flight = flightOptional.get();

        // Validate selected seat count.
        if (seatNumbers == null || seatNumbers.size() != seats) {
            throw new RuntimeException(
                    "Please select the correct number of seats");
        }

        // Prevent duplicate seat numbers.
        if (new HashSet<>(seatNumbers).size() != seatNumbers.size()) {
            throw new RuntimeException("Duplicate seat selection");
        }

        if (flight.getAvailableSeats() < seats) {
            throw new RuntimeException("Not enough seats available");
        }
        // Reject a price lower than the real fare. The floor uses the server's fare
        // plus taxes and services, minus the largest discount, with a 5% margin
        // for price changes between page load and booking.
        double serverFare = pricingController.currentFarePerSeat(flightId, userId);
        double minimumTotal = ((serverFare + 1373) * seats - 299) * 0.95;

        if (price < minimumTotal) {
            throw new RuntimeException(
                    "Price mismatch. Please refresh the page and try again.");
        }

        // Verify every selected seat before updating anything.
        List<Seat> seatsToOccupy = new ArrayList<>();

        for (String seatNumber : seatNumbers) {

            Optional<Seat> seatOptional = seatRepository.findByFlightIdAndSeatNumber(
                    flightId,
                    seatNumber);

            if (seatOptional.isEmpty()) {
                throw new RuntimeException(
                        "Seat " + seatNumber + " not found");
            }

            Seat seat = seatOptional.get();

            if ("Occupied".equalsIgnoreCase(seat.getStatus())) {
                throw new RuntimeException(
                        "Seat " + seatNumber + " is already occupied");
            }

            seatsToOccupy.add(seat);
        }

        // Create booking.
        Booking booking = new Booking();

        booking.setType("Flight");
        booking.setBookingId(UUID.randomUUID().toString());
        booking.setItemId(flightId);
        booking.setDate(LocalDate.now().toString());
        booking.setCreatedAt(LocalDateTime.now());
        booking.setQuantity(seats);
        booking.setTotalPrice(price);
        booking.setStatus("Confirmed");

        // Save selected seat numbers in the booking.
        booking.setSeatNumbers(new ArrayList<>(seatNumbers));

        // Mark seats as occupied.
        for (Seat seat : seatsToOccupy) {
            seat.setStatus("Occupied");
        }

        seatRepository.saveAll(seatsToOccupy);

        // Update available flight seats.
        flight.setAvailableSeats(
                flight.getAvailableSeats() - seats);

        flightRepository.save(flight);

        // Save booking in user account.
        user.getBookings().add(booking);
        userRepository.save(user);

        return booking;
    }

    public Booking bookhotel(
            String userId,
            String hotelId,
            int rooms,
            double price,
            Map<String, Integer> roomSelections) {

        Optional<Users> usersOptional = userRepository.findById(userId);
        Optional<Hotel> hotelOptional = hotelRepository.findById(hotelId);

        if (usersOptional.isEmpty() || hotelOptional.isEmpty()) {
            throw new RuntimeException("User or hotel not found");
        }

        Users user = usersOptional.get();
        Hotel hotel = hotelOptional.get();

        if (hotel.getAvailableRooms() < rooms) {
            throw new RuntimeException("Not enough rooms available");
        }

        // Check every room type before changing anything
        List<Room> roomsToUpdate = new ArrayList<>();
        List<String> labels = new ArrayList<>();
        double expectedTotal = 0;

        if (roomSelections != null) {
            for (Map.Entry<String, Integer> entry : roomSelections.entrySet()) {
                Room room = roomRepository.findById(entry.getKey())
                        .orElseThrow(() -> new RuntimeException("Room type not found"));

                if (room.getAvailableRooms() < entry.getValue()) {
                    throw new RuntimeException(
                            "Not enough " + room.getRoomType() + " rooms available");
                }

                roomsToUpdate.add(room);
                labels.add(room.getRoomType() + " x " + entry.getValue());
                expectedTotal += room.getPricePerNight() * entry.getValue();
            }
        }
        if (roomSelections != null && !roomSelections.isEmpty()
                && price < expectedTotal - 1) {
            throw new RuntimeException(
                    "Price mismatch. Please refresh the page and try again.");
        }

        for (Room room : roomsToUpdate) {
            room.setAvailableRooms(
                    room.getAvailableRooms() - roomSelections.get(room.getId()));
        }
        roomRepository.saveAll(roomsToUpdate);

        hotel.setAvailableRooms(hotel.getAvailableRooms() - rooms);
        hotelRepository.save(hotel);

        Booking booking = new Booking();

        booking.setType("Hotel");
        booking.setBookingId(UUID.randomUUID().toString());
        booking.setItemId(hotelId);
        booking.setDate(LocalDate.now().toString());
        booking.setCreatedAt(LocalDateTime.now());
        booking.setQuantity(rooms);
        booking.setTotalPrice(price);
        booking.setStatus("Confirmed");
        booking.setRoomType(String.join(", ", labels));
        booking.setRoomQuantities(
                roomSelections == null ? new HashMap<>() : new HashMap<>(roomSelections));

        user.getBookings().add(booking);
        userRepository.save(user);

        return booking;
    }
}
