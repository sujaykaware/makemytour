package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Seat;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.SeatRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/flight/search")
@CrossOrigin
public class FlightSearchController {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private SeatRepository seatRepository;

    @GetMapping
    public List<Flight> searchFlights(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam String date) {

        List<Flight> flights = new ArrayList<>();

        String departureCity = from.trim();
        String arrivalCity = to.trim();

        if (departureCity.equalsIgnoreCase(arrivalCity)) {
            return flights;
        }

        String[] flightNames = {
                "MakeMyTour Airways",
                "SkyConnect",
                "TravelAir"
        };

        String[] departureTimes = {
                "08:00",
                "14:30",
                "20:00"
        };

        String[] arrivalTimes = {
                "10:15",
                "16:45",
                "22:15"
        };

        double[] prices = {
                3500,
                4200,
                5100
        };

        LocalDate selectedDate = LocalDate.parse(date);

        for (int i = 0; i < 3; i++) {

            String flightId =
                    "MOCK-" +
                    departureCity.toUpperCase() +
                    "-" +
                    arrivalCity.toUpperCase() +
                    "-" +
                    date +
                    "-" +
                    i;

            Optional<Flight> existingFlight =
                    flightRepository.findById(flightId);

            Flight flight;

            if (existingFlight.isPresent()) {

                flight = existingFlight.get();

            } else {

                flight = new Flight();

                flight.setId(flightId);
                flight.setFlightName(flightNames[i]);
                flight.setFrom(departureCity);
                flight.setTo(arrivalCity);

                LocalDateTime departure =
                        LocalDateTime.of(
                                selectedDate,
                                LocalTime.parse(departureTimes[i])
                        );

                LocalDateTime arrival =
                        LocalDateTime.of(
                                selectedDate,
                                LocalTime.parse(arrivalTimes[i])
                        );

                flight.setDepartureTime(
                        departure.toString()
                );

                flight.setArrivalTime(
                        arrival.toString()
                );

                flight.setPrice(prices[i]);
                flight.setAvailableSeats(20 + i * 5);

                flight.setStatus("On Time");
                flight.setDelayReason(null);
                flight.setRevisedDepartureTime(
                        departure.toString()
                );
                flight.setRevisedArrivalTime(
                        arrival.toString()
                );
                flight.setEstimatedArrivalTime(
                        arrival.toString()
                );

                flight =
                        flightRepository.save(flight);

                createSeats(flightId);
            }

            flights.add(flight);
        }

        return flights;
    }

    private void createSeats(String flightId) {

        if (!seatRepository
                .findByFlightId(flightId)
                .isEmpty()) {
            return;
        }

        String[] rows = {
                "A", "B", "C",
                "D", "E", "F"
        };

        for (String row : rows) {

            for (int number = 1; number <= 4; number++) {

                Seat seat = new Seat();

                seat.setFlightId(flightId);
                seat.setSeatNumber(row + number);

                if (row.equals("A") ||
                        row.equals("B")) {

                    seat.setSeatType("Premium");
                    seat.setPrice(800);

                } else {

                    seat.setSeatType("Standard");
                    seat.setPrice(0);
                }

                if ((row.equals("A") && number == 2)
                        || (row.equals("C") && number == 3)
                        || (row.equals("E") && number == 1)
                        || (row.equals("F") && number == 4)) {

                    seat.setStatus("Occupied");

                } else {

                    seat.setStatus("Available");
                }

                seatRepository.save(seat);
            }
        }
    }
}