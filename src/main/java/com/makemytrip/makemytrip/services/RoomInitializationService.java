package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.models.Room;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import com.makemytrip.makemytrip.repositories.RoomRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomInitializationService implements CommandLineRunner {

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Override
    public void run(String... args) {

        System.out.println("=================================");
        System.out.println("ROOM INITIALIZATION STARTED");
        System.out.println("=================================");

        List<Hotel> hotels = hotelRepository.findAll();

        System.out.println(
                "Hotels found: " + hotels.size());

        for (Hotel hotel : hotels) {

            String hotelId = hotel.getId();

            System.out.println(
                    "Checking hotel ID: " + hotelId);

            if (hotelId == null) {
                continue;
            }

            if (!roomRepository
                    .findByHotelId(hotelId)
                    .isEmpty()) {

                System.out.println(
                        "Rooms already exist for hotel ID: " + hotelId);

                continue;
            }

            createRoom(
                    hotelId,
                    "Standard Room",
                    "Comfortable room suitable for 2 adults",
                    2,
                    4000,
                    8,
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800",
                    "WiFi, Gym, Breakfast");

            createRoom(
                    hotelId,
                    "Deluxe Room",
                    "Spacious upgraded room with premium facilities",
                    2,
                    5500,
                    4,
                    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800",
                    "WiFi, Gym, Breakfast, Room Service");

            createRoom(
                    hotelId,
                    "Premium Suite",
                    "Luxury suite with extra space and premium amenities",
                    3,
                    8000,
                    2,
                    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800",
                    "WiFi, Gym, Breakfast, Room Service, Swimming Pool");
        }

        System.out.println("=================================");
        System.out.println("ROOM INITIALIZATION COMPLETED");
        System.out.println("=================================");
    }

    private void createRoom(
            String hotelId,
            String roomType,
            String description,
            int capacity,
            double price,
            int availableRooms,
            String imageUrl,
            String amenities) {

        Room room = new Room();

        room.setHotelId(hotelId);
        room.setRoomType(roomType);
        room.setDescription(description);
        room.setCapacity(capacity);
        room.setPricePerNight(price);
        room.setAvailableRooms(availableRooms);
        room.setImageUrl(imageUrl);
        room.setAmenities(amenities);

        roomRepository.save(room);

        System.out.println(
                "Created room: " + roomType +
                        " for hotel: " + hotelId);
    }
}