package com.makemytrip.makemytrip.models;

import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "users")
public class Users {
    @Id
    private String _id;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String role;
    private String phoneNumber;
    private List<Booking> bookings = new ArrayList<>();;
    private String preferredSeatType;
    private String preferredRoomType;

    public String getFirstName() {
        return firstName;
    }

    public String getId() {
        return _id;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getPassword() {
        return password;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public List<Booking> getBookings() {
        return bookings;
    }

    public void setBookings(List<Booking> bookings) {
        this.bookings = bookings;
    }

    public String getPreferredSeatType() {
        return preferredSeatType;
    }

    public void setPreferredSeatType(String preferredSeatType) {
        this.preferredSeatType = preferredSeatType;
    }

    public String getPreferredRoomType() {
        return preferredRoomType;
    }

    public void setPreferredRoomType(String preferredRoomType) {
        this.preferredRoomType = preferredRoomType;
    }

    public static class Booking {
        private String type;
        private String bookingId;
        private String itemId;
        private String date;
        private int quantity;
        private double totalPrice;

        // Seat and room details
        private List<String> seatNumbers = new ArrayList<>();
        private String roomType;
        private java.util.Map<String, Integer> roomQuantities = new java.util.HashMap<>();

        // Booking details
        private String status = "Confirmed";
        private LocalDateTime createdAt;

        // Cancellation details
        private String cancellationReason;
        private LocalDateTime cancelledAt;

        // Refund details
        private String refundId;
        private double refundAmount;
        private int refundPercentage;
        private String refundStatus = "Not Requested";
        private String refundExpectedTimeline;

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getBookingId() {
            return bookingId;
        }

        public void setBookingId(String bookingId) {
            this.bookingId = bookingId;
        }

        public String getItemId() {
            return itemId;
        }

        public void setItemId(String itemId) {
            this.itemId = itemId;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }

        public double getTotalPrice() {
            return totalPrice;
        }

        public void setTotalPrice(double totalPrice) {
            this.totalPrice = totalPrice;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public String getCancellationReason() {
            return cancellationReason;
        }

        public void setCancellationReason(String cancellationReason) {
            this.cancellationReason = cancellationReason;
        }

        public LocalDateTime getCancelledAt() {
            return cancelledAt;
        }

        public void setCancelledAt(LocalDateTime cancelledAt) {
            this.cancelledAt = cancelledAt;
        }

        public String getRefundId() {
            return refundId;
        }

        public void setRefundId(String refundId) {
            this.refundId = refundId;
        }

        public double getRefundAmount() {
            return refundAmount;
        }

        public void setRefundAmount(double refundAmount) {
            this.refundAmount = refundAmount;
        }

        public int getRefundPercentage() {
            return refundPercentage;
        }

        public void setRefundPercentage(int refundPercentage) {
            this.refundPercentage = refundPercentage;
        }

        public String getRefundStatus() {
            return refundStatus;
        }

        public void setRefundStatus(String refundStatus) {
            this.refundStatus = refundStatus;
        }

        public String getRefundExpectedTimeline() {
            return refundExpectedTimeline;
        }

        public void setRefundExpectedTimeline(String refundExpectedTimeline) {
            this.refundExpectedTimeline = refundExpectedTimeline;
        }

        public List<String> getSeatNumbers() {
            return seatNumbers;
        }

        public void setSeatNumbers(List<String> seatNumbers) {
            this.seatNumbers = seatNumbers;
        }

        public String getRoomType() {
            return roomType;
        }

        public void setRoomType(String roomType) {
            this.roomType = roomType;
        }

        public java.util.Map<String, Integer> getRoomQuantities() {
            return roomQuantities;
        }

        public void setRoomQuantities(java.util.Map<String, Integer> roomQuantities) {
            this.roomQuantities = roomQuantities;
        }
    }
}
