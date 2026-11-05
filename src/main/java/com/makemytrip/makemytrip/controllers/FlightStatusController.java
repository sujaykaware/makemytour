package com.makemytrip.makemytrip.controllers;

import org.springframework.scheduling.annotation.Scheduled;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

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
    private final Random random = new Random();

    private final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // Get status of one flight
    @GetMapping("/{id}")
    public Flight getFlightStatus(@PathVariable String id) {

        Optional<Flight> flight = flightRepository.findById(id);

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

        Optional<Flight> existingFlight = flightRepository.findById(id);

        if (existingFlight.isPresent()) {

            Flight flight = existingFlight.get();

            if (statusUpdate.getStatus() != null) {
                flight.setStatus(statusUpdate.getStatus());
            }

            if (statusUpdate.getDelayReason() != null) {
                flight.setDelayReason(
                        statusUpdate.getDelayReason());
            }

            if (statusUpdate.getRevisedDepartureTime() != null) {
                flight.setRevisedDepartureTime(
                        statusUpdate.getRevisedDepartureTime());
            }

            if (statusUpdate.getRevisedArrivalTime() != null) {
                flight.setRevisedArrivalTime(
                        statusUpdate.getRevisedArrivalTime());
            }

            if (statusUpdate.getEstimatedArrivalTime() != null) {
                flight.setEstimatedArrivalTime(
                        statusUpdate.getEstimatedArrivalTime());
            }

            return flightRepository.save(flight);
        }

        return null;
    }

    @Scheduled(fixedRate = 30000)
    public void simulateFlightUpdates() {
        List<Flight> flights = flightRepository.findAll();
        String[] statuses = { "On Time", "Boarding", "Delayed by 1h" };

        for (Flight flight : flights) {
            try {
                // Only about 1 in 6 flights changes per cycle
                if (random.nextInt(6) != 0)
                    continue;

                String newStatus = statuses[random.nextInt(statuses.length)];
                // Skip if nothing actually changed
                if (newStatus.equals(flight.getStatus()))
                    continue;

                flight.setStatus(newStatus);

                if (newStatus.startsWith("Delayed")) {
                    flight.setDelayReason("Weather conditions at the airport");
                    flight.setRevisedDepartureTime(plusOneHour(flight.getDepartureTime()));
                    String revisedArrival = plusOneHour(flight.getArrivalTime());
                    flight.setRevisedArrivalTime(revisedArrival);
                    flight.setEstimatedArrivalTime(revisedArrival);
                } else {
                    flight.setDelayReason(null);
                    flight.setRevisedDepartureTime(null);
                    flight.setRevisedArrivalTime(null);
                    flight.setEstimatedArrivalTime(flight.getArrivalTime());
                }

                flightRepository.save(flight);
            } catch (Exception e) {
                // One bad flight must not stop the others
                System.out.println("Skipping flight " + flight.getId() + ": " + e.getMessage());
            }
        }
    }

    // Works for both "2026-11-06T08:00:00" and "08:00"
    private String plusOneHour(String value) {
        try {
            return LocalDateTime.parse(value, formatter).plusHours(1).format(formatter);
        } catch (Exception e) {
            return LocalTime.parse(value).plusHours(1).toString();
        }
    }
}