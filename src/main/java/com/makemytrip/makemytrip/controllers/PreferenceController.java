package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.repositories.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/preferences")
@CrossOrigin
public class PreferenceController {

    @Autowired
    private UserRepository userRepository;

    private Users findUser(String userId) {
        return userRepository.findById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private Map<String, Object> toMap(Users user) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("seatType", user.getPreferredSeatType());
        result.put("roomType", user.getPreferredRoomType());
        return result;
    }

    @GetMapping("/{userId}")
    public Map<String, Object> getPreferences(@PathVariable String userId) {
        return toMap(findUser(userId));
    }

    @PutMapping("/{userId}")
    public Map<String, Object> savePreferences(
            @PathVariable String userId,
            @RequestParam(required = false) String seatType,
            @RequestParam(required = false) String roomType) {

        Users user = findUser(userId);

        if (seatType != null)
            user.setPreferredSeatType(seatType);
        if (roomType != null)
            user.setPreferredRoomType(roomType);

        userRepository.save(user);
        return toMap(user);
    }
}