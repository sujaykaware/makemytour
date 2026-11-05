package com.makemytrip.makemytrip.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.makemytrip.makemytrip.models.Flight;

public interface FlightRepository extends MongoRepository<Flight, String> {

}