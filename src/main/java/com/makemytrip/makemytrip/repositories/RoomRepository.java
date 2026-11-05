package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RoomRepository
        extends MongoRepository<Room, String> {

    List<Room> findByHotelId(String hotelId);
}