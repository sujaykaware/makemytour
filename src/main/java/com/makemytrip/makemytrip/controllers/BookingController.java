
package com.makemytrip.makemytrip.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.services.BookingService;

import java.util.Arrays;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/booking")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping("/flight")
    public Users.Booking bookFlight(
            @RequestParam String userId,
            @RequestParam String flightId,
            @RequestParam int seats,
            @RequestParam double price,
            @RequestParam String seatNumbers) {

        List<String> selectedSeats = Arrays.asList(seatNumbers.split(","));

        return bookingService.bookFlight(
                userId,
                flightId,
                seats,
                price,
                selectedSeats);
    }

    @PostMapping("/hotel")
   public Users.Booking bookhotel(
           @RequestParam String userId,
           @RequestParam String hotelId,
           @RequestParam int rooms,
           @RequestParam double price,
           @RequestParam(required = false, defaultValue = "") String roomSelections) {

       // Format: roomId:quantity,roomId:quantity
       Map<String, Integer> selections = new HashMap<>();

       if (!roomSelections.isBlank()) {
           for (String part : roomSelections.split(",")) {
               String[] pair = part.split(":");
               if (pair.length == 2) {
                   selections.merge(
                           pair[0].trim(),
                           Integer.parseInt(pair[1].trim()),
                           Integer::sum);
               }
           }
       }

       return bookingService.bookhotel(userId, hotelId, rooms, price, selections);
   }
}
