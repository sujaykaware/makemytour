package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataInitializationService implements CommandLineRunner {

    private final HotelRepository hotelRepository;
    private final FlightRepository flightRepository;

    public DataInitializationService(
            HotelRepository hotelRepository,
            FlightRepository flightRepository) {

        this.hotelRepository = hotelRepository;
        this.flightRepository = flightRepository;
    }

    @Override
    public void run(String... args) {

        initializeHotels();
        initializeFlights();
    }

    private void initializeHotels() {

        if (hotelRepository.count() > 0) {
            System.out.println("Hotels already exist. Skipping hotel initialization.");
            return;
        }

        System.out.println("HOTEL DATA INITIALIZATION STARTED");

        Hotel paris = new Hotel();
        paris.setId("6ab00b2f4b51786a26a0cdd0");
        paris.sethotelName("Luxury Palace");
        paris.setLocation("Paris");
        paris.setPricePerNight(5000);
        paris.setAvailableRooms(10);
        paris.setamenities("WiFi, Pool, Breakfast");

        Hotel tokyo = new Hotel();
        tokyo.setId("6ab00b3d4b51786a26a0cdd2");
        tokyo.sethotelName("Hyatt Regency");
        tokyo.setLocation("Tokyo");
        tokyo.setPricePerNight(4000);
        tokyo.setAvailableRooms(8);
        tokyo.setamenities("WiFi, Gym, Breakfast");

        Hotel newYork = new Hotel();
        newYork.setId("6ab00b504b51786a26a0cdd4");
        newYork.sethotelName("The Oberoi");
        newYork.setLocation("New York");
        newYork.setPricePerNight(6000);
        newYork.setAvailableRooms(12);
        newYork.setamenities("WiFi, Pool, Restaurant");

        Hotel london = new Hotel();
        london.setId("6ab00ce84b51786a26a0cdd6");
        london.sethotelName("Hyatt Regency");
        london.setLocation("London");
        london.setPricePerNight(4000);
        london.setAvailableRooms(8);
        london.setamenities("WiFi, Gym, Breakfast");

        Hotel parisFrance = new Hotel();
        parisFrance.setId("6ab00cfb4b51786a26a0cdd7");
        parisFrance.sethotelName("Hyatt Regency");
        parisFrance.setLocation("Paris,France");
        parisFrance.setPricePerNight(4000);
        parisFrance.setAvailableRooms(8);
        parisFrance.setamenities("WiFi, Gym, Breakfast");

        Hotel bali = new Hotel();
        bali.setId("6ab00d494b51786a26a0cdd8");
        bali.sethotelName("Hyatt Regency");
        bali.setLocation("Bali,Indonesia");
        bali.setPricePerNight(4000);
        bali.setAvailableRooms(8);
        bali.setamenities("WiFi, Gym, Breakfast");

        hotelRepository.saveAll(Arrays.asList(
                paris,
                tokyo,
                newYork,
                london,
                parisFrance,
                bali
        ));

        System.out.println("Hotels initialized: " + hotelRepository.count());
        System.out.println("HOTEL DATA INITIALIZATION COMPLETED");
    }

    private void initializeFlights() {

        if (flightRepository.count() > 0) {
            System.out.println("Flights already exist. Skipping flight initialization.");
            return;
        }

        System.out.println("FLIGHT DATA INITIALIZATION STARTED");

        Flight flight1 = createFlight(
                "IndiGo 6E-101",
                "Mumbai",
                "Delhi",
                "08:00",
                "10:10",
                3500,
                120
        );

        Flight flight2 = createFlight(
                "Air India AI-202",
                "Delhi",
                "Mumbai",
                "11:30",
                "13:40",
                4200,
                110
        );

        Flight flight3 = createFlight(
                "IndiGo 6E-303",
                "Mumbai",
                "Bangalore",
                "14:00",
                "15:45",
                3800,
                100
        );

        Flight flight4 = createFlight(
                "Vistara UK-404",
                "Pune",
                "Delhi",
                "16:30",
                "18:40",
                4500,
                90
        );

        Flight flight5 = createFlight(
                "IndiGo 6E-505",
                "Delhi",
                "Bangalore",
                "19:00",
                "21:45",
                3900,
                105
        );

        Flight flight6 = createFlight(
                "Air India AI-606",
                "Mumbai",
                "Goa",
                "09:30",
                "10:45",
                2800,
                95
        );

        flightRepository.saveAll(Arrays.asList(
                flight1,
                flight2,
                flight3,
                flight4,
                flight5,
                flight6
        ));

        System.out.println("Flights initialized: " + flightRepository.count());
        System.out.println("FLIGHT DATA INITIALIZATION COMPLETED");
    }

    private Flight createFlight(
            String name,
            String from,
            String to,
            String departure,
            String arrival,
            double price,
            int seats) {

        Flight flight = new Flight();

        flight.setFlightName(name);
        flight.setFrom(from);
        flight.setTo(to);
        flight.setDepartureTime(departure);
        flight.setArrivalTime(arrival);
        flight.setPrice(price);
        flight.setAvailableSeats(seats);

        // Live flight status
        flight.setStatus("On Time");
        flight.setDelayReason("");
        flight.setRevisedDepartureTime(departure);
        flight.setRevisedArrivalTime(arrival);
        flight.setEstimatedArrivalTime(arrival);

        return flight;
    }
}