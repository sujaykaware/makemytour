package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.repositories.FlightRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/flight/status")
@CrossOrigin
public class FlightStatusController {

    @Autowired
    private FlightRepository flightRepository;

    // Get status of one flight
    @GetMapping("/{id}")
    public Flight getFlightStatus(@PathVariable String id) {

        Optional<Flight> flight =
                flightRepository.findById(id);

        return flight.orElse(null);
    }

    // Get status of all flights
    // Used for tracking multiple flights
    @GetMapping("/all")
    public List<Flight> getAllFlightStatuses() {

        return flightRepository.findAll();
    }

    // Update flight status
    @PutMapping("/{id}")
    public Flight updateFlightStatus(
            @PathVariable String id,
            @RequestBody Flight statusUpdate) {

        Optional<Flight> existingFlight =
                flightRepository.findById(id);

        if (existingFlight.isPresent()) {

            Flight flight = existingFlight.get();

            if (statusUpdate.getStatus() != null) {
                flight.setStatus(statusUpdate.getStatus());
            }

            if (statusUpdate.getDelayReason() != null) {
                flight.setDelayReason(
                        statusUpdate.getDelayReason()
                );
            }

            if (statusUpdate.getRevisedDepartureTime() != null) {
                flight.setRevisedDepartureTime(
                        statusUpdate.getRevisedDepartureTime()
                );
            }

            if (statusUpdate.getRevisedArrivalTime() != null) {
                flight.setRevisedArrivalTime(
                        statusUpdate.getRevisedArrivalTime()
                );
            }

            if (statusUpdate.getEstimatedArrivalTime() != null) {
                flight.setEstimatedArrivalTime(
                        statusUpdate.getEstimatedArrivalTime()
                );
            }

            return flightRepository.save(flight);
        }

        return null;
    }
}