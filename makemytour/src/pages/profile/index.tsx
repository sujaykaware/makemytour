import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Edit2,
  Calendar,
  CreditCard,
  X,
  Check,
  LogOut,
  Plane,
  Building2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { clearUser, setUser } from "@/store";
import { editprofile, cancelBooking, getRefundStatus } from "@/api";

// Shows Pending -> Processed -> Completed as a progress line
const RefundTracker = ({ status }: { status: string }) => {
  const stages = ["Pending", "Processed", "Completed"];
  const current = Math.max(0, stages.indexOf(status));

  return (
    <div className="flex items-center my-3">
      {stages.map((stage, index) => (
        <React.Fragment key={stage}>
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index <= current
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-500"
                }`}
            >
              {index <= current ? "✓" : index + 1}
            </div>

            <span
              className={`mt-1 text-xs ${index <= current
                  ? "text-green-700 font-semibold"
                  : "text-gray-400"
                }`}
            >
              {stage}
            </span>
          </div>

          {index < stages.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${index < current ? "bg-green-600" : "bg-gray-200"
                }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const index = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const [cancellationReasons, setCancellationReasons] = useState<
    Record<string, string>
  >({});

  const [cancellingBooking, setCancellingBooking] = useState<string | null>(
    null
  );

  const [cancellationMessage, setCancellationMessage] = useState("");
  const [refundDetails, setRefundDetails] = useState<Record<string, any>>({});
  const [checkingRefund, setCheckingRefund] = useState<string | null>(null);

  const [userData, setUserData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    bookings: [],
  });

  const [editForm, setEditForm] = useState({ ...userData });

  // Refunds that are not completed yet (used to refresh them automatically)
  const pendingRefundIds = (user?.bookings || [])
    .filter(
      (booking: any) =>
        booking.status === "Cancelled" &&
        booking.refundId &&
        refundDetails[booking.refundId]?.status !== "Completed"
    )
    .map((booking: any) => booking.refundId)
    .join(",");

  // Check refund status now, then every 5 seconds until it is Completed
  useEffect(() => {
    if (!pendingRefundIds) return;

    const ids = pendingRefundIds.split(",");

    const loadStatuses = async () => {
      for (const id of ids) {
        const result = await getRefundStatus(id);

        if (result && !result.error) {
          setRefundDetails((prev) => ({
            ...prev,
            [id]: result,
          }));
        }
      }
    };

    loadStatuses();

    const timer = setInterval(loadStatuses, 5000);

    return () => clearInterval(timer);
  }, [pendingRefundIds]);

  // Latest status: the server answer if we have it, otherwise the saved one
  const getLiveStatus = (booking: any): string =>
    refundDetails[booking.refundId]?.status ||
    booking.refundStatus ||
    "Pending";

  const getLiveTimeline = (booking: any): string =>
    refundDetails[booking.refundId]?.expectedTimeline ||
    booking.refundExpectedTimeline ||
    "";

  const getPolicyText = (percentage: number): string => {
    if (percentage === 50) {
      return "Cancelled within 24 hours of booking: 50% refund";
    }

    if (percentage === 25) {
      return "Cancelled after 24 hours of booking: 25% partial refund";
    }

    return "";
  };

  // Logout
  const logout = () => {
    dispatch(clearUser());
    router.push("/");
  };

  // Edit profile fields
  const handleEditFormChange = (field: string, value: string) => {
    setUserData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  // Save profile changes
  const handleSave = async () => {
    try {
      const data = await editprofile(
        user?.id,
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phoneNumber
      );

      dispatch(setUser(data));
      setIsEditing(false);
    } catch (error) {
      setUserData(editForm);
      setIsEditing(false);
      console.error("Profile update error:", error);
    }
  };

  // Format booking date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Manual refresh of one refund
  const handleCheckRefund = async (refundId: string) => {
    try {
      setCheckingRefund(refundId);

      const result = await getRefundStatus(refundId);

      if (!result || result.error) {
        setCancellationMessage(result?.error || "Unable to fetch refund status.");
        return;
      }

      setRefundDetails((prev) => ({
        ...prev,
        [refundId]: result,
      }));
    } catch (error) {
      console.error("Refund tracking error:", error);
      setCancellationMessage("Unable to fetch refund status.");
    } finally {
      setCheckingRefund(null);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    const reason = cancellationReasons[bookingId];

    if (!reason) {
      setCancellationMessage("Please select a cancellation reason.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      setCancellingBooking(bookingId);
      setCancellationMessage("");

      const result = await cancelBooking(user?.id || "", bookingId, reason);

      if (!result || result.error) {
        setCancellationMessage(
          result?.error || "Unable to cancel booking. Please try again."
        );
        return;
      }

      const updatedUser = {
        ...user,
        bookings: (user?.bookings || []).map((booking: any) =>
          booking.bookingId === bookingId
            ? {
              ...booking,
              status: "Cancelled",
              cancellationReason: reason,
              refundId: result.refundId,
              refundAmount: result.refundAmount,
              refundPercentage: result.refundPercentage,
              refundStatus: result.refundStatus,
              refundExpectedTimeline: result.expectedTimeline,
            }
            : booking
        ),
      };

      dispatch(setUser(updatedUser));

      setCancellationMessage(
        `Booking cancelled successfully. Refund amount: ₹${result.refundAmount}. ${result.policyMessage || ""
        }`
      );
    } catch (error) {
      console.error("Cancellation error:", error);
      setCancellationMessage("Unable to cancel booking. Please try again.");
    } finally {
      setCancellingBooking(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Profile</h2>

                {!isEditing && (
                  <button
                    onClick={() => {
                      setEditForm({
                        firstName: user?.firstName || "",
                        lastName: user?.lastName || "",
                        email: user?.email || "",
                        phoneNumber: user?.phoneNumber || "",
                        bookings: [],
                      });
                      setUserData({
                        firstName: user?.firstName || "",
                        lastName: user?.lastName || "",
                        email: user?.email || "",
                        phoneNumber: user?.phoneNumber || "",
                        bookings: [],
                      });
                      setIsEditing(true);
                    }}
                    className="text-red-600 flex items-center space-x-1 hover:text-red-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) =>
                        handleEditFormChange("firstName", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) =>
                        handleEditFormChange("lastName", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) =>
                        handleEditFormChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={userData.phoneNumber}
                      onChange={(e) =>
                        handleEditFormChange("phoneNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setUserData({
                          firstName: user?.firstName || "",
                          lastName: user?.lastName || "",
                          email: user?.email || "",
                          phoneNumber: user?.phoneNumber || "",
                          bookings: [],
                        });
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <p className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <p>{user?.email}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <p>{user?.phoneNumber}</p>
                  </div>

                  <button
                    className="w-full mt-4 flex items-center justify-center space-x-2 text-red-600 hover:text-red-700"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bookings Section */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">My Bookings</h2>

              {cancellationMessage && (
                <p className="mb-4 text-sm font-medium text-blue-600">
                  {cancellationMessage}
                </p>
              )}

              <div className="space-y-6">
                {user?.bookings?.length > 0 ? (
                  user.bookings.map((booking: any) => (
                    <div
                      key={booking.bookingId}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Booking Information */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {booking.type === "Flight" ? (
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Plane className="w-6 h-6 text-blue-600" />
                            </div>
                          ) : (
                            <div className="bg-green-100 p-2 rounded-lg">
                              <Building2 className="w-6 h-6 text-green-600" />
                            </div>
                          )}

                          <div>
                            <h3 className="font-semibold">{booking.type}</h3>
                            <p className="text-sm text-gray-500">
                              Booking ID: {booking.bookingId}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">
                            ₹ {(booking.totalPrice || 0).toLocaleString("en-IN")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {booking.status || "Confirmed"}
                          </p>
                        </div>
                      </div>

                      {/* Booking Date */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {booking.date
                              ? formatDate(booking.date)
                              : "Date unavailable"}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-4 h-4" />
                          <span>{booking.status || "Confirmed"}</span>
                        </div>
                      </div>

                      {/* Cancellation Section */}
                      {booking.status !== "Cancelled" ? (
                        <div className="mt-4 border-t pt-4">
                          <label className="block text-sm font-medium mb-2">
                            Cancellation Reason
                          </label>

                          <select
                            className="w-full border rounded-lg p-2 text-sm"
                            value={cancellationReasons[booking.bookingId] || ""}
                            onChange={(e) =>
                              setCancellationReasons((prev) => ({
                                ...prev,
                                [booking.bookingId]: e.target.value,
                              }))
                            }
                            disabled={cancellingBooking === booking.bookingId}
                          >
                            <option value="">Select cancellation reason</option>
                            <option value="Travel plan changed">
                              Travel plan changed
                            </option>
                            <option value="Found a better price">
                              Found a better price
                            </option>
                            <option value="Change in schedule">
                              Change in schedule
                            </option>
                            <option value="Booked by mistake">
                              Booked by mistake
                            </option>
                            <option value="Personal reasons">
                              Personal reasons
                            </option>
                            <option value="Other">Other</option>
                          </select>

                          <button
                            onClick={() =>
                              handleCancelBooking(booking.bookingId)
                            }
                            disabled={cancellingBooking === booking.bookingId}
                            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            {cancellingBooking === booking.bookingId
                              ? "Cancelling..."
                              : "Cancel Booking"}
                          </button>
                        </div>
                      ) : (
                        /* Refund Information */
                        <div className="mt-4 border-t pt-4 text-sm space-y-2">
                          <p className="font-semibold text-red-600">
                            Booking Cancelled
                          </p>

                          <p>
                            Cancellation Reason: {booking.cancellationReason}
                          </p>

                          <p>
                            Refund Amount: ₹{" "}
                            {(booking.refundAmount || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>

                          <p>
                            Refund Percentage: {booking.refundPercentage}%
                          </p>

                          {getPolicyText(booking.refundPercentage) && (
                            <p className="text-gray-500">
                              {getPolicyText(booking.refundPercentage)}
                            </p>
                          )}

                          {booking.refundId && (
                            <div className="mt-3">
                              <p className="font-medium text-gray-700">
                                Refund Status: {getLiveStatus(booking)}
                              </p>

                              <RefundTracker status={getLiveStatus(booking)} />

                              <p className="text-gray-500">
                                {getLiveTimeline(booking)}
                              </p>

                              <p className="mt-3 text-xs text-gray-500">
                                Refund ID: {booking.refundId}
                              </p>

                              <button
                                onClick={() => handleCheckRefund(booking.refundId)}
                                disabled={checkingRefund === booking.refundId}
                                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                              >
                                {checkingRefund === booking.refundId
                                  ? "Checking..."
                                  : "Refresh status"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    You have no bookings yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;