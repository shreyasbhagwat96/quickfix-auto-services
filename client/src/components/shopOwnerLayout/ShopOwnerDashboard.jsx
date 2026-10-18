import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { API_URL } from "../../api";
import { Button, Table } from "react-bootstrap";
import BookingMap from "./BookingMap";

const ShopOwnerDashboard = () => {
  const { token } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");

  // ==============================
  // FETCH SHOP OWNER BOOKINGS
  // ==============================
  const fetchBookings = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/shop/mybookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("BOOKINGS FROM BACKEND:", res.data);

      setBookings(res.data);
    } catch (err) {
      console.error(
        "Error fetching bookings:",
        err.response?.data || err.message
      );
    }
  };

  // ==============================
  // INITIAL LOAD + AUTO REFRESH
  // ==============================
  useEffect(() => {
    if (token) {
      fetchBookings();
    }

    const interval = setInterval(() => {
      if (token) {
        fetchBookings();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  // ==============================
  // UPDATE BOOKING STATUS
  // ==============================
  const handleStatusUpdate = async (
    bookingId,
    status,
    data = {}
  ) => {
    try {
      console.log("Updating booking:", {
        bookingId,
        status,
        data,
      });

      const res = await axios.patch(
        `${API_URL}/api/shop/booking/${bookingId}/status`,
        {
          status,
          ...data,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("STATUS UPDATE RESPONSE:", res.data);

      alert(`Booking ${status} successfully!`);

      await fetchBookings();
    } catch (err) {
      console.error(
        "Failed to update status:",
        err.response?.data || err.message
      );

      alert(
        err.response?.data?.message ||
        "Failed to update booking status."
      );
    }
  };

  // ==============================
  // SCHEDULE BOOKING
  // ==============================
  const promptScheduled = (bookingId) => {
    const time = prompt(
      "Enter scheduled time (e.g. 4:00 PM)"
    );

    if (time) {
      handleStatusUpdate(
        bookingId,
        "Scheduled",
        {
          scheduledTime: time,
        }
      );
    }
  };

  // ==============================
  // REJECT BOOKING
  // ==============================
  const promptRejection = (bookingId) => {
    const msg = prompt(
      "Enter reason for rejection"
    );

    if (msg) {
      handleStatusUpdate(
        bookingId,
        "Rejected",
        {
          rejectionMessage: msg,
        }
      );
    }
  };

  // ==============================
  // STATUS MESSAGE
  // ==============================
  const getStatusMessage = (booking) => {
    if (!booking.seenByShop) {
      return "⏳ Not yet seen";
    }

    if (booking.status === "Pending") {
      return "👀 Seen";
    }

    if (booking.status === "Approved") {
      return "✅ Approved";
    }

    if (booking.status === "Scheduled") {
      return `⏰ ${booking.scheduledTime || "Scheduled"
        }`;
    }

    if (booking.status === "Rejected") {
      return `❌ ${booking.rejectionMessage || "Rejected"
        }`;
    }

    if (booking.status === "Cancelled") {
      return "🚫 Cancelled";
    }

    if (booking.status === "Replaced") {
      return "🔄 Replaced";
    }

    return "❓ Unknown";
  };

  // ==============================
  // OPEN IMAGE MODAL
  // ==============================
  const openImageModal = (imageSrc) => {
    setModalImageSrc(imageSrc);
    setShowImageModal(true);
  };

  // ==============================
  // CLOSE IMAGE MODAL
  // ==============================
  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageSrc("");
  };

  return (
    <div
      style={{
        background: "rgba(248, 248, 248, 1)",
        minHeight: "80vh",
        padding: "20px",
      }}
    >
      <h2>📋 Booking Dashboard</h2>

      {/* ==============================
          BOOKING MAP
      ============================== */}

      {selectedBooking &&
        selectedBooking.userLocation?.coordinates &&
        selectedBooking.shopId?.coordinates?.coordinates &&
        selectedBooking.userLocation.coordinates.length === 2 &&
        selectedBooking.shopId.coordinates.coordinates.length === 2 &&
        !selectedBooking.userLocation.coordinates.includes(
          undefined
        ) &&
        !selectedBooking.shopId.coordinates.coordinates.includes(
          undefined
        ) && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                marginTop: "20px",
                width: "90vw",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow:
                  "0 0 25px rgb(1,1,1,0.5)",
              }}
            >
              <BookingMap
                userCoords={{
                  lat:
                    selectedBooking.userLocation
                      .coordinates[1],
                  lng:
                    selectedBooking.userLocation
                      .coordinates[0],
                }}
                shopCoords={{
                  lat:
                    selectedBooking.shopId
                      .coordinates.coordinates[1],
                  lng:
                    selectedBooking.shopId
                      .coordinates.coordinates[0],
                }}
              />
            </div>
          </div>
        )}

      {/* ==============================
          BOOKINGS TABLE
      ============================== */}

      {bookings.length !== 0 && (
        <Table
          striped
          bordered
          hover
          responsive
        >
          <thead>
            <tr
              style={{
                textAlign: "center",
              }}
            >
              <th>#</th>
              <th>Photo</th>
              <th>Vehicle</th>
              <th>Contact</th>
              <th>Issue</th>
              <th>Towing</th>
              <th>User</th>
              <th>Email</th>
              <th>Time</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map(
              (booking, idx) => (
                <tr key={booking._id}>
                  {/* NUMBER */}
                  <td>{idx + 1}</td>

                  {/* USER PROFILE PHOTO */}
                  <td>
                    {booking.user?.profilePicture ? (
                      <img
                        style={{
                          height: "50px",
                          width: "50px",
                          objectFit: "cover",
                          cursor: "pointer",
                          border:
                            "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                        src={`${API_URL}/${booking.user.profilePicture}`}
                        alt="user profile"
                        onClick={() =>
                          openImageModal(
                            `${API_URL}/${booking.user.profilePicture}`
                          )
                        }
                      />
                    ) : (
                      "No Photo"
                    )}
                  </td>

                  {/* VEHICLE */}
                  <td>
                    {booking.vehicleName}
                  </td>

                  {/* CONTACT */}
                  <td>
                    {booking.user?.phoneNumber ||
                      "N/A"}
                  </td>

                  {/* ISSUE */}
                  <td>
                    {booking.issue || "N/A"}
                  </td>

                  {/* TOWING */}
                  <td>
                    {booking.towingNeeded
                      ? "Yes"
                      : "No"}
                  </td>

                  {/* USER */}
                  <td>
                    {booking.user?.firstName}{" "}
                    {booking.user?.lastName}
                  </td>

                  {/* EMAIL */}
                  <td>
                    {booking.user?.email ||
                      "N/A"}
                  </td>

                  {/* TIME */}
                  <td>
                    {booking.createdAt
                      ? new Date(
                        booking.createdAt
                      ).toLocaleString()
                      : "N/A"}
                  </td>

                  {/* STATUS */}
                  <td
                    style={{
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {getStatusMessage(
                      booking
                    )}
                  </td>

                  {/* PAYMENT IMAGE */}
                  <td>
                    {booking.paymentImage ? (
                      <img
                        style={{
                          height: "50px",
                          width: "50px",
                          objectFit: "cover",
                          cursor: "pointer",
                          border:
                            "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                        src={`${API_URL}/${booking.paymentImage}`}
                        alt="payment"
                        onClick={() =>
                          openImageModal(
                            `${API_URL}/${booking.paymentImage}`
                          )
                        }
                      />
                    ) : (
                      "No Payment"
                    )}
                  </td>

                  {/* ==============================
                      ACTION BUTTONS
                  ============================== */}
                  <td
                    style={{
                      textAlign: "center",
                      minWidth: "300px",
                    }}
                  >
                    {/* APPROVE */}
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() =>
                        handleStatusUpdate(
                          booking._id,
                          "Approved"
                        )
                      }
                    >
                      Approve
                    </Button>{" "}

                    {/* SCHEDULE */}
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() =>
                        promptScheduled(
                          booking._id
                        )
                      }
                    >
                      Schedule
                    </Button>{" "}

                    {/* REJECT */}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        promptRejection(
                          booking._id
                        )
                      }
                    >
                      Reject
                    </Button>{" "}

                    {/* VIEW MAP */}
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => {
                        console.log(
                          "User coords:",
                          booking.userLocation
                            ?.coordinates
                        );

                        console.log(
                          "Shop coords:",
                          booking.shopId
                            ?.coordinates
                            ?.coordinates
                        );

                        setSelectedBooking(
                          booking
                        );
                      }}
                    >
                      View Map
                    </Button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </Table>
      )}

      {/* ==============================
          IMAGE MODAL
      ============================== */}

      {showImageModal && (
        <div
          className="modal show fade"
          style={{
            display: "block",
            backgroundColor:
              "rgba(0,0,0,0.8)",
          }}
          onClick={closeImageModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Payment / User Image
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeImageModal}
                ></button>
              </div>

              <div className="modal-body text-center">
                <img
                  src={modalImageSrc}
                  alt="Payment or user"
                  style={{
                    width: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================
          NO BOOKINGS
      ============================== */}

      {bookings.length === 0 && (
        <div
          style={{
            minHeight: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "grey",
            fontSize: "20px",
            flexDirection: "column",
          }}
        >
          <div>
            Currently there are No Bookings
          </div>

          <img
            src="./cargif.gif"
            height="100px"
            alt=""
          />
        </div>
      )}
    </div>
  );
};

export default ShopOwnerDashboard;