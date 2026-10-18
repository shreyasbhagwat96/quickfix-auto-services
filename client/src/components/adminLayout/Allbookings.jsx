import axios from "axios";
import { API_URL } from "../../api";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const Allbookings = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/user/booking/allhistory`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(res.data);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch booking history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <>
      <h1 style={{ marginTop: "150px", marginLeft: "250px" }}>All Bookings</h1>
      <div
        className="container mx-auto p-4"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {history.length === 0 ? (
          <p>No booking history found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className=" bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b">Vehicle</th>
                  <th className="py-2 px-4 border-b">Issue</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Towing Needed</th>
                  <th className="py-2 px-4 border-b">Commission</th>
                  <th className="py-2 px-4 border-b">Shop Earnings</th>
                  <th className="py-2 px-4 border-b">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">
                      {booking.vehicleName}
                    </td>
                    <td className="py-2 px-4 border-b">{booking.issue}</td>
                    <td className="py-2 px-4 border-b">
                      <span
                        style={{
                          padding: "5px 10px",
                          borderRadius: "15px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor:
                            booking.status === "Approved"
                              ? "#d4edda"
                              : booking.status === "Scheduled"
                                ? "#cce5ff"
                                : booking.status === "Pending"
                                  ? "#fff3cd"
                                  : booking.status === "Rejected"
                                    ? "#f8d7da"
                                    : booking.status === "Cancelled"
                                      ? "#e2e3e5"
                                      : "#f8f9fa",
                          color:
                            booking.status === "Approved"
                              ? "#155724"
                              : booking.status === "Scheduled"
                                ? "#004085"
                                : booking.status === "Pending"
                                  ? "#856404"
                                  : booking.status === "Rejected"
                                    ? "#721c24"
                                    : booking.status === "Cancelled"
                                      ? "#383d41"
                                      : "#212529",
                        }}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {booking.towingNeeded ? "Yes" : "No"}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {booking.status === "Approved" || booking.status === "Scheduled"
                        ? "₹" + Number(booking.adminCommission || 0)
                        : "₹0"}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {booking.status === "Approved" || booking.status === "Scheduled"
                        ? "₹" + Number(booking.shopOwnerEarning || 0)
                        : "₹0"}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Allbookings;
