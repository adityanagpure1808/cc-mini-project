import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Register() {
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const register = async () => {
    setError("");
    setSuccess("");
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/users/api/users", form);
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2>Register</h2>

      {error   && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <input
        placeholder="Full Name"
        value={form.name}
        onChange={update("name")}
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={update("email")}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={update("password")}
        onKeyDown={(e) => e.key === "Enter" && register()}
      />
      <button onClick={register} disabled={loading}>
        {loading ? "Creating account…" : "Register"}
      </button>

      <p className="switch-link">
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
}
