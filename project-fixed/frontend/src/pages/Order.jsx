import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Order() {
  const [form, setForm]     = useState({ product: "", amount: "" });
  const [orders, setOrders] = useState([]);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // user_id is stored at login — no manual typing needed
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/api/orders");
      setOrders(res.data);
    } catch {
      // silently ignore on first load if service is slow
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const createOrder = async () => {
    setError("");
    setSuccess("");
    if (!form.product || !form.amount) {
      setError("Product and amount are required.");
      return;
    }
    if (isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      setError("Amount must be a positive number.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/orders/api/orders", {
        user_id: userId,
        product: form.product,
        amount: parseFloat(form.amount),
      });
      setSuccess("Order created successfully!");
      setForm({ product: "", amount: "" });
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    navigate("/");
  };

  return (
    <div className="form-card">
      <div className="order-header">
        <h2>Create Order</h2>
        <button className="btn-outline" onClick={logout}>Logout</button>
      </div>

      {error   && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <input
        placeholder="Product name"
        value={form.product}
        onChange={update("product")}
      />
      <input
        type="number"
        placeholder="Amount (₹)"
        value={form.amount}
        onChange={update("amount")}
        onKeyDown={(e) => e.key === "Enter" && createOrder()}
      />
      <button onClick={createOrder} disabled={loading}>
        {loading ? "Placing order…" : "Place Order"}
      </button>

      {orders.length > 0 && (
        <div className="order-list">
          <h3>Your Orders</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Amount</th>
                <th>Order ID</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.product}</td>
                  <td>₹{o.amount.toFixed(2)}</td>
                  <td className="order-id">{o.id.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
