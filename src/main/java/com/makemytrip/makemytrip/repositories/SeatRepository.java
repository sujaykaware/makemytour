package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.Seat;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SeatRepository extends MongoRepository<Seat, String> {

    List<Seat> findByFlightId(String flightId);

    Optional<Seat> findByFlightIdAndSeatNumber(
            String flightId,
            String seatNumber
    );
}