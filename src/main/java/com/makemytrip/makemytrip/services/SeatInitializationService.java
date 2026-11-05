package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Seat;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.SeatRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SeatInitializationService implements CommandLineRunner {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Override
    public void run(String... args) {

        List<Flight> flights = flightRepository.findAll();

        for (Flight flight : flights) {

            String flightId = flight.getId();

            if (flightId == null) {
                continue;
            }

            // Don't create duplicate seats
            if (!seatRepository.findByFlightId(flightId).isEmpty()) {
                continue;
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

                    // First two rows are premium
                    if (row.equals("A") || row.equals("B")) {

                        seat.setSeatType("Premium");
                        seat.setPrice(800);

                    } else {

                        seat.setSeatType("Standard");
                        seat.setPrice(0);
                    }

                    // Some seats are already occupied
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

        System.out.println(
                "================================="
        );
        System.out.println(
                "SEAT MAP INITIALIZATION COMPLETED"
        );
        System.out.println(
                "================================="
        );
    }
}