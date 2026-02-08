import React, { useEffect, useState } from "react";

const API = "http://localhost:8080";

export default function App() {
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [booking, setBooking] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [adminPackages, setAdminPackages] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminPayments, setAdminPayments] = useState([]);
  const [newPackage, setNewPackage] = useState({
    code: "",
    name: "",
    nights: 7,
    price: 1000,
    description: ""
  });

  useEffect(() => {
    fetch(`${API}/api/catalog/packages`)
      .then((r) => r.json())
      .then(setPackages)
      .catch(() => setPackages([]));
  }, []);

  useEffect(() => {
    if (role !== "ADMIN" || !token) return;
    const headers = authHeaders();
    fetch(`${API}/api/admin/catalog/packages`, { headers })
      .then((r) => r.json())
      .then(setAdminPackages)
      .catch(() => setAdminPackages([]));

    fetch(`${API}/api/admin/booking/bookings`, { headers })
      .then((r) => r.json())
      .then(setAdminBookings)
      .catch(() => setAdminBookings([]));

    fetch(`${API}/api/admin/payment/payments`, { headers })
      .then((r) => r.json())
      .then(setAdminPayments)
      .catch(() => setAdminPayments([]));
  }, [role, token]);

  const authHeaders = () =>
    token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      : { "Content-Type": "application/json" };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm)
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      setRole(data.role);
      setEmail(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("email", data.user);
    }
  };

  const handleLogout = () => {
    setToken("");
    setRole("");
    setEmail("");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
  };

  const createBooking = async () => {
    if (!selected) return;
    if (!token) {
      alert("Please log in to book.");
      return;
    }
    const res = await fetch(`${API}/api/booking`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        packageId: selected.code || selected.id,
        travelerName: "Ahmad Ali",
        travelDate: "2026-03-15"
      })
    });
    const data = await res.json();
    setBooking(data);
  };

  const createPackage = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/admin/catalog/packages`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(newPackage)
    });
    const data = await res.json();
    setAdminPackages((prev) => [...prev, data]);
    setNewPackage({ code: "", name: "", nights: 7, price: 1000, description: "" });
  };

  const deletePackage = async (id) => {
    await fetch(`${API}/api/admin/catalog/packages/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    setAdminPackages((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="brand">Al-Muhammad Travels</p>
          <h1>Umrah Service Portal</h1>
          <p className="sub">
            Book curated Umrah packages, manage your journey, and pay securely in one place.
          </p>
          <button className="cta" onClick={createBooking}>
            Reserve Selected Package
          </button>
        </div>
        <div className="hero-card">
          <p className="label">Selected Package</p>
          {selected ? (
            <>
              <h3>{selected.name}</h3>
              <p>{selected.nights} nights ? ${selected.price}</p>
            </>
          ) : (
            <p className="muted">Pick a package below</p>
          )}
          {booking && (
            <div className="booking">
              <p>Booking ID: {booking.id}</p>
              <p>Status: {booking.status}</p>
            </div>
          )}
        </div>
      </header>

      <section className="grid">
        {packages.map((p) => (
          <article
            key={p.id}
            className={`card ${selected?.id === p.id ? "active" : ""}`}
            onClick={() => setSelected(p)}
          >
            <h3>{p.name}</h3>
            <p>{p.nights} nights</p>
            <p className="price">${p.price}</p>
          </article>
        ))}
      </section>

      <section className="auth">
        <div>
          <h3>Traveler Login</h3>
          {token ? (
            <div className="session">
              <p>Signed in as {email}</p>
              <p className="muted">Role: {role}</p>
              <button className="ghost" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="login">
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              <button className="cta" type="submit">Sign in</button>
              <p className="muted hint">Admin: admin@almuhammad.com / admin123</p>
              <p className="muted hint">User: user@almuhammad.com / user123</p>
            </form>
          )}
        </div>
      </section>

      {role === "ADMIN" && (
        <section className="admin">
          <div className="admin-header">
            <h2>Admin Dashboard</h2>
            <p className="muted">Manage packages and bookings.</p>
          </div>

          <div className="admin-grid">
            <div className="panel">
              <h3>Create Package</h3>
              <form onSubmit={createPackage} className="stack">
                <input value={newPackage.code} onChange={(e) => setNewPackage({ ...newPackage, code: e.target.value })} placeholder="Code" required />
                <input value={newPackage.name} onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })} placeholder="Name" required />
                <input type="number" value={newPackage.nights} onChange={(e) => setNewPackage({ ...newPackage, nights: Number(e.target.value) })} placeholder="Nights" required />
                <input type="number" value={newPackage.price} onChange={(e) => setNewPackage({ ...newPackage, price: Number(e.target.value) })} placeholder="Price" required />
                <input value={newPackage.description} onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })} placeholder="Description" />
                <button className="cta" type="submit">Add Package</button>
              </form>
            </div>

            <div className="panel">
              <h3>Packages</h3>
              <div className="list">
                {adminPackages.map((p) => (
                  <div key={p.id} className="list-item">
                    <div>
                      <strong>{p.name}</strong>
                      <p className="muted">{p.code} ? {p.nights} nights ? ${p.price}</p>
                    </div>
                    <button className="ghost" onClick={() => deletePackage(p.id)}>Delete</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h3>Bookings</h3>
              <div className="list">
                {adminBookings.map((b) => (
                  <div key={b.id} className="list-item">
                    <div>
                      <strong>{b.travelerName}</strong>
                      <p className="muted">{b.packageId} ? {b.travelDate}</p>
                    </div>
                    <span className="badge">{b.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h3>Payments</h3>
              <div className="list">
                {adminPayments.map((p) => (
                  <div key={p.id} className="list-item">
                    <div>
                      <strong>{p.bookingId}</strong>
                      <p className="muted">${p.amount} ? {p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="steps">
        <div>
          <h3>1. Choose Package</h3>
          <p>Select from tailored Umrah packages with clear pricing.</p>
        </div>
        <div>
          <h3>2. Confirm Booking</h3>
          <p>Reserve your preferred dates and traveler details.</p>
        </div>
        <div>
          <h3>3. Secure Payment</h3>
          <p>Pay through trusted methods and receive instant confirmation.</p>
        </div>
      </section>
    </div>
  );
}
