
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api";

const ShopOwnerHome = () => {
  const { token } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [bookingsRes, shopRes] = await Promise.all([
          axios.get(`${API_URL}/api/shop/mybookings`, config),
          axios.get(`${API_URL}/api/shop/my`, config),
        ]);
        setBookings(
          Array.isArray(bookingsRes.data)
            ? bookingsRes.data
            : []
        );

        if (shopRes.data) {
          setShop(shopRes.data);
        } else {
          setShop(null);
        }
      } catch (error) {
        console.error(
          "Failed to fetch dashboard data:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load dashboard data."
        );

        setBookings([]);
        setShop(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // ==========================================
  // TOKEN LOADING
  // ==========================================

  if (!token && loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f6fa",
          fontSize: "18px",
          color: "#555",
        }}
      >
        Loading...
      </div>
    );
  }

  // ==========================================
  // DASHBOARD LOADING
  // ==========================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f6fa",
          fontSize: "18px",
          color: "#555",
        }}
      >
        Loading Dashboard...
      </div>
    );
  }

  // ==========================================
  // BOOKING COUNTS
  // ==========================================

  const totalBookings = bookings.length;

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "Pending"
  ).length;

  const approvedBookings = bookings.filter(
    (booking) => booking.status === "Approved"
  ).length;

  const scheduledBookings = bookings.filter(
    (booking) => booking.status === "Scheduled"
  ).length;

  const rejectedBookings = bookings.filter(
    (booking) => booking.status === "Rejected"
  ).length;

  // ==========================================
  // TOTAL EARNINGS
  // Only Approved + Scheduled bookings
  // ==========================================

  const totalEarnings = bookings
    .filter(
      (booking) =>
        booking.status === "Approved" ||
        booking.status === "Scheduled"
    )
    .reduce(
      (total, booking) =>
        total + (Number(booking.shopOwnerEarning) || 0),
      0
    );

  // ==========================================
  // RECENT BOOKINGS
  // ==========================================

  const recentBookings = bookings.slice(0, 5);

  // ==========================================
  // MAIN DASHBOARD
  // ==========================================

  return (
    <div
      style={{
        padding: "25px",
        background: "#f5f6fa",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}

      <div style={{ marginBottom: "25px" }}>
        <h2 style={{ margin: "0 0 5px 0" }}>
          🏪 Shop Owner Dashboard
        </h2>

        <p
          style={{
            color: "#666",
            margin: 0,
          }}
        >
          Welcome to your shop dashboard
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            background: "#ffe6e6",
            color: "#b00020",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #ffcccc",
          }}
        >
          {error}
        </div>
      )}

      {/* SHOP INFORMATION */}

      {shop && (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "25px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "15px",
            }}
          >
            🏪 {shop.name || "My Shop"}
          </h3>

          {shop.location && (
            <p
              style={{
                margin: "8px 0",
                color: "#555",
              }}
            >
              📍 Location:{" "}
              {typeof shop.location === "string"
                ? shop.location
                : shop.location.address ||
                "Location available"}
            </p>
          )}

          {shop.contact && (
            <p
              style={{
                margin: "8px 0",
                color: "#555",
              }}
            >
              📞 Contact: {shop.contact}
            </p>
          )}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* TOTAL BOOKINGS */}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Total Bookings
          </h4>

          <h1
            style={{
              margin: 0,
              fontSize: "32px",
            }}
          >
            {totalBookings}
          </h1>
        </div>

        {/* PENDING */}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Pending
          </h4>

          <h1
            style={{
              margin: 0,
              fontSize: "32px",
            }}
          >
            {pendingBookings}
          </h1>
        </div>

        {/* APPROVED */}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Approved
          </h4>

          <h1
            style={{
              margin: 0,
              fontSize: "32px",
            }}
          >
            {approvedBookings}
          </h1>
        </div>

        {/* SCHEDULED */}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Scheduled
          </h4>

          <h1
            style={{
              margin: 0,
              fontSize: "32px",
            }}
          >
            {scheduledBookings}
          </h1>
        </div>

        {/* REJECTED */}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Rejected
          </h4>

          <h1
            style={{
              margin: 0,
              fontSize: "32px",
            }}
          >
            {rejectedBookings}
          </h1>
        </div>

        {/* TOTAL EARNINGS */}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Total Earnings
          </h4>

          <h1
            style={{
              margin: 0,
              fontSize: "32px",
            }}
          >
            ₹{totalEarnings}
          </h1>
        </div>
      </div>

      {/* RECENT BOOKINGS */}

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          📋 Recent Bookings
        </h3>

        {recentBookings.length === 0 ? (
          <p style={{ color: "#666" }}>
            No bookings found.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    Vehicle
                  </th>

                  <th
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    Issue
                  </th>

                  <th
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    Earnings
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      {booking.vehicleName || "N/A"}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      {booking.issue || "N/A"}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      {booking.status || "N/A"}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      {booking.status === "Approved" ||
                        booking.status === "Scheduled"
                        ? "₹" +
                        (Number(
                          booking.shopOwnerEarning || 0
                        ))
                        : "₹0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopOwnerHome;

