package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Seat;
import com.makemytrip.makemytrip.repositories.SeatRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/seats")
@CrossOrigin
public class SeatController {

    @Autowired
    private SeatRepository seatRepository;

    // Get all seats for a flight
    @GetMapping("/{flightId}")
    public List<Seat> getSeats(
            @PathVariable String flightId) {

        return seatRepository.findByFlightId(flightId);
    }

    // Select a seat
    @PutMapping("/{flightId}/{seatNumber}")
    public Seat selectSeat(
            @PathVariable String flightId,
            @PathVariable String seatNumber) {

        Optional<Seat> existingSeat =
                seatRepository.findByFlightIdAndSeatNumber(
                        flightId,
                        seatNumber
                );

        if (existingSeat.isEmpty()) {
            return null;
        }

        Seat seat = existingSeat.get();

        // Occupied seats cannot be selected
        if ("Occupied".equals(seat.getStatus())) {
            return seat;
        }

        // Select this seat
        seat.setStatus("Selected");

        return seatRepository.save(seat);
    }
}