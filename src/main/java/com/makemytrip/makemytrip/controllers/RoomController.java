package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Room;
import com.makemytrip.makemytrip.repositories.RoomRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/rooms")
@CrossOrigin
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @GetMapping("/{hotelId}")
    public List<Room> getRooms(
            @PathVariable String hotelId) {

        return roomRepository.findByHotelId(hotelId);
    }

    @PutMapping("/{roomId}/select")
    public Room selectRoom(
            @PathVariable String roomId) {

        Optional<Room> existingRoom =
                roomRepository.findById(roomId);

        if (existingRoom.isEmpty()) {
            return null;
        }

        Room room = existingRoom.get();

        if (room.getAvailableRooms() <= 0) {
            return room;
        }

        room.setAvailableRooms(
                room.getAvailableRooms() - 1
        );

        return roomRepository.save(room);
    }
}