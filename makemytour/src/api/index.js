import axios from "axios";

const BACKEND_URL = "http://localhost:8080";

export const login = async (email, password) => {
  try {
    const url = `${BACKEND_URL}/user/login?email=${email}&password=${password}`;
    const res = await axios.post(url);
    const data = res.data;
    // console.log(data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const signup = async (
  firstName,
  lastName,
  email,
  phoneNumber,
  password
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/signup`, {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    });
    const data = res.data;
    // console.log(data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getuserbyemail = async (email) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/user/email?email=${email}`);
    const data = res.data;
    return data;
  } catch (error) {
    throw error;
  }
};

export const editprofile = async (
  id,
  firstName,
  lastName,
  email,
  phoneNumber
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/user/edit?id=${id}`, {
      firstName,
      lastName,
      email,
      phoneNumber,
    });
    const data = res.data;
    return data;
  } catch (error) { }
};
export const getflight = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight`);
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const addflight = async (
  flightName,
  from,
  to,
  departureTime,
  arrivalTime,
  price,
  availableSeats
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/flight`, {
      flightName,
      from,
      to,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const editflight = async (
  id,
  flightName,
  from,
  to,
  departureTime,
  arrivalTime,
  price,
  availableSeats
) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/flight/${id}`, {
      flightName,
      from,
      to,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const gethotel = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/hotel`);
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const addhotel = async (
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/admin/hotel`, {
      hotelName,
      location,
      pricePerNight,
      availableRooms,
      amenities,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const edithotel = async (
  id,
  hotelName,
  location,
  pricePerNight,
  availableRooms,
  amenities
) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/admin/hotel/${id}`, {
      hotelName,
      location,
      pricePerNight,
      availableRooms,
      amenities,
    });
    const data = res.data;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const handleflightbooking = async (
  userId,
  flightId,
  seats,
  price,
  seatNumbers
) => {
  try {
    const url = `${BACKEND_URL}/booking/flight`;

    const res = await axios.post(url, null, {
      params: {
        userId,
        flightId,
        seats,
        price,
        seatNumbers: (seatNumbers || []).join(","),
      },
    });

    return res.data;
  } catch (error) {
    console.log("Flight booking error:", error);
    throw error;
  }
};

export const handlehotelbooking = async (
  userId,
  hotelId,
  rooms,
  price,
  roomSelections = ""
) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/booking/hotel`, null, {
      params: { userId, hotelId, rooms, price, roomSelections },
    });
    return res.data;
  } catch (error) {
    console.log(error);
  }
};
export const getflightstatus = async (id) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/flight/status/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
export const getAllFlightStatuses = async () => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/flight/status/all`
    );

    return res.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};
export const getDynamicPrice = async (
  flightId,
  userId,
  basePrice,
  demand,
  peakSeason
) => {
  const res = await fetch(
    `http://localhost:8080/pricing/${encodeURIComponent(flightId)}?userId=${encodeURIComponent(userId)}&basePrice=${basePrice}&demand=${demand}&peakSeason=${peakSeason}`
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const freezePrice = async (
  flightId,
  userId,
  basePrice,
  demand,
  peakSeason
) => {
  const res = await fetch(
    `http://localhost:8080/pricing/${encodeURIComponent(flightId)}/freeze?userId=${encodeURIComponent(userId)}&basePrice=${basePrice}&demand=${demand}&peakSeason=${peakSeason}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getPriceHistory = async (flightId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/pricing/${flightId}/history`
    );

    return res.data;
  } catch (error) {
    console.log("Price history error:", error);
    return [];
  }
};
// ================================
// CANCELLATION & REFUND
// ================================

export const calculateRefund = async (
  bookingAmount,
  reservationTime,
  reason
) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/cancellation/calculate-refund`,
      null,
      {
        params: {
          bookingAmount,
          reservationTime,
          reason,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Refund calculation error:", error);
    return null;
  }
};

export const cancelBooking = async (userId, bookingId, reason) => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/cancellation/cancel/${userId}/${bookingId}`,
      null,
      {
        params: { reason },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Booking cancellation error:", error);
    throw error;
  }
};

export const getRefundStatus = async (refundId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/cancellation/status/${refundId}`
    );

    return res.data;
  } catch (error) {
    console.log("Refund status error:", error);
    throw error;
  }
};



// ================================
// SEAT SELECTION
// ================================

export const getSeats = async (flightId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/seats/${flightId}`
    );

    return res.data;
  } catch (error) {
    console.log("Seat loading error:", error);
    return [];
  }
};

export const selectSeat = async (
  flightId,
  seatNumber
) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/seats/${flightId}/${seatNumber}`
    );

    return res.data;
  } catch (error) {
    console.log("Seat selection error:", error);
    return null;
  }
};
export const searchFlights = async (
  from,
  to,
  date
) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/flight/search`,
      {
        params: {
          from,
          to,
          date,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Flight search error:", error);
    return [];
  }
};
export const getRooms = async (hotelId) => {
  try {
    const res = await axios.get(
      `${BACKEND_URL}/rooms/${hotelId}`
    );

    return res.data;
  } catch (error) {
    console.log("Room loading error:", error);
    return [];
  }
};

export const selectRoom = async (roomId) => {
  try {
    const res = await axios.put(
      `${BACKEND_URL}/rooms/${roomId}/select`
    );

    return res.data;
  } catch (error) {
    console.log("Room selection error:", error);
    return null;
  }
};
// ================================
// SAVED PREFERENCES
// ================================

export const getPreferences = async (userId) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/preferences/${userId}`);
    return res.data;
  } catch (error) {
    console.log("Preferences error:", error);
    return null;
  }
};

export const savePreferences = async (userId, { seatType, roomType }) => {
  try {
    const res = await axios.put(`${BACKEND_URL}/preferences/${userId}`, null, {
      params: { seatType, roomType },
    });
    return res.data;
  } catch (error) {
    console.log("Save preferences error:", error);
    return null;
  }
};

