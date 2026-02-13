import React, { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const fallbackPackages = [
  {
    id: "economy",
    code: "ECONOMY",
    name: "Economy Umrah",
    nights: 7,
    price: 115000,
    highlights: ["3-star hotel", "Shared transport", "Guided ziyarat"]
  },
  {
    id: "premium",
    code: "PREMIUM",
    name: "Premium Umrah",
    nights: 10,
    price: 165000,
    highlights: ["4-star hotel", "Private transport", "Priority support"]
  }
];

const navItems = [
  { id: "home", label: "Home" },
  { id: "packages", label: "Packages" },
  { id: "booking", label: "Booking" },
  { id: "confirmdetails", label: "Confirm details" },
  { id: "payments", label: "Payments" },
  { id: "account", label: "Account" }
];

export default function App() {
  const storedTenant = localStorage.getItem("tenantId") || "public";
  const [page, setPage] = useState("home");
  const [packages, setPackages] = useState(fallbackPackages);
  const [selectedId, setSelectedId] = useState(fallbackPackages[0].id);
  const [booking, setBooking] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [paymentError, setPaymentError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountBookings, setAccountBookings] = useState([]);
  const [paymentAudit, setPaymentAudit] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [firstName, setFirstName] = useState(localStorage.getItem("firstName") || "");
  const [lastName, setLastName] = useState(localStorage.getItem("lastName") || "");
  const [mobileNumber, setMobileNumber] = useState(localStorage.getItem("mobileNumber") || "");
  const [tenantId, setTenantId] = useState(storedTenant);
  const [authMode, setAuthMode] = useState("signin");
  const [authError, setAuthError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    mobileNumber: "",
    otp: "",
    mobileVerificationToken: "",
    password: ""
  });
  const [bookingForm, setBookingForm] = useState({
    travelerName: "",
    travelDate: ""
  });

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedId) || packages[0],
    [packages, selectedId]
  );

  useEffect(() => {
    fetch(`${API}/catalog/packages`, {
      headers: { "X-Tenant-ID": tenantId }
    })
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const normalized = data.map((pkg) => ({
          id: pkg.id ?? pkg.code ?? pkg.name,
          code: pkg.code,
          name: pkg.name,
          nights: pkg.nights,
          price: pkg.price,
          highlights: pkg.description ? [pkg.description] : []
        }));
        setPackages(normalized);
        setSelectedId(normalized[0]?.id ?? fallbackPackages[0].id);
      })
      .catch(() => setPackages(fallbackPackages));
  }, [tenantId]);

  useEffect(() => {
    if (token || !GOOGLE_CLIENT_ID || page !== "account") return;

    const initGoogle = () => {
      const buttonRoot = document.getElementById("google-signin-btn");
      if (!buttonRoot || !window.google?.accounts?.id) return;
      buttonRoot.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const res = await fetch(`${API}/auth/google`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Tenant-ID": tenantId
              },
              body: JSON.stringify({ idToken: response.credential })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Google sign-in failed");
            setSession(data);
            setAuthError("");
          } catch (err) {
            setAuthError(err.message || "Google sign-in failed");
          }
        }
      });
      window.google.accounts.id.renderButton(buttonRoot, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 260
      });
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", initGoogle, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [token, page, tenantId]);

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const resolvePackageName = (packageId) => {
    const candidate = packages.find(
      (pkg) => pkg.code === packageId || String(pkg.id) === String(packageId)
    );
    return candidate?.name || packageId || "-";
  };

  const authHeaders = () =>
    token
      ? {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "Content-Type": "application/json"
        }
      : {
          "X-Tenant-ID": tenantId,
          "Content-Type": "application/json"
        };

  const publicHeaders = () => ({
    "X-Tenant-ID": tenantId,
    "Content-Type": "application/json"
  });

  const setSession = (data) => {
    const resolvedTenant = data.tenantId || tenantId || "public";
    setToken(data.token || "");
    setRole(data.role || "");
    setEmail(data.user || "");
    setFirstName(data.firstName || "");
    setLastName(data.lastName || "");
    setMobileNumber(data.mobileNumber || "");
    setTenantId(resolvedTenant);
    localStorage.setItem("tenantId", resolvedTenant);
    if (data.token) localStorage.setItem("token", data.token);
    if (data.role) localStorage.setItem("role", data.role);
    if (data.user) localStorage.setItem("email", data.user);
    localStorage.setItem("firstName", data.firstName || "");
    localStorage.setItem("lastName", data.lastName || "");
    localStorage.setItem("mobileNumber", data.mobileNumber || "");
  };

  const fullMobileNumber = () => {
    const rawMobile = (registerForm.mobileNumber || "").trim();
    if (rawMobile.startsWith("+")) {
      return rawMobile.replace(/\s+/g, "");
    }

    const countryDigits = (registerForm.countryCode || "").replace(/\D/g, "");
    let localDigits = rawMobile.replace(/\D/g, "");
    localDigits = localDigits.replace(/^0+/, "");
    if (!countryDigits || !localDigits) return "";
    return `+${countryDigits}${localDigits}`;
  };

  const isValidMobile = (mobile) => /^\+[1-9]\d{6,14}$/.test(mobile);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: publicHeaders(),
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setSession(data);
        setAuthError("");
      } else {
        setAuthError(data.error || "Unable to sign in");
      }
    } catch (err) {
      setAuthError(err.message || "Sign in request failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otpVerified || !registerForm.mobileVerificationToken) {
      setAuthError("Please verify mobile number with OTP before creating account");
      return;
    }
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: publicHeaders(),
        body: JSON.stringify({
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
          email: registerForm.email,
          mobileNumber: fullMobileNumber(),
          mobileVerificationToken: registerForm.mobileVerificationToken,
          password: registerForm.password
        })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setSession(data);
        setAuthError("");
        setOtpMessage("");
        setOtpVerified(false);
      } else {
        setAuthError(data.error || "Unable to create account");
      }
    } catch (err) {
      setAuthError(err.message || "Create account request failed");
    }
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setAuthError("");
    setOtpMessage("");
    const mobile = fullMobileNumber();
    if (!isValidMobile(mobile)) {
      setAuthError("Enter valid mobile with country code, e.g. +919876543210");
      return;
    }
    try {
      const res = await fetch(`${API}/auth/otp/request`, {
        method: "POST",
        headers: publicHeaders(),
        body: JSON.stringify({ mobileNumber: mobile })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Unable to send OTP");
        return;
      }
      setOtpVerified(false);
      setRegisterForm((prev) => ({ ...prev, mobileVerificationToken: "" }));
      setOtpMessage(
        data.demoOtp
          ? `OTP sent. Demo OTP: ${data.demoOtp}`
          : "OTP sent to your mobile number"
      );
    } catch (err) {
      setAuthError(err.message || "OTP request failed");
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setAuthError("");
    const mobile = fullMobileNumber();
    if (!isValidMobile(mobile)) {
      setAuthError("Enter valid mobile with country code before OTP verification");
      return;
    }
    try {
      const res = await fetch(`${API}/auth/otp/verify`, {
        method: "POST",
        headers: publicHeaders(),
        body: JSON.stringify({
          mobileNumber: mobile,
          otp: registerForm.otp
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpVerified(false);
        setRegisterForm((prev) => ({ ...prev, mobileVerificationToken: "" }));
        setAuthError(data.error || "Unable to verify OTP");
        return;
      }
      setOtpVerified(true);
      setOtpMessage("Mobile number verified");
      setRegisterForm((prev) => ({
        ...prev,
        mobileVerificationToken: data.mobileVerificationToken
      }));
    } catch (err) {
      setAuthError(err.message || "OTP verification failed");
    }
  };

  const handleLogout = () => {
    setToken("");
    setRole("");
    setEmail("");
    setFirstName("");
    setLastName("");
    setMobileNumber("");
    setBooking(null);
    setInstallments([]);
    setAuthError("");
    setPaymentError("");
    setPaymentMessage("");
    setAccountBookings([]);
    setPaymentAudit([]);
    setAccountLoading(false);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("mobileNumber");
  };

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setSession({ ...data, token, role });
        }
      })
      .catch(() => {});
  }, [token]);

  const createBooking = async (e) => {
    e.preventDefault();
    if (!selectedPackage) return;
    if (!token) {
      setPage("account");
      return;
    }
    try {
      const res = await fetch(`${API}/booking`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          packageId: selectedPackage.code || selectedPackage.id,
          travelerName: bookingForm.travelerName || "Traveler",
          travelDate: bookingForm.travelDate || "2026-03-15"
        })
      });
      const data = await res.json();
      setBooking(data);
      setPaymentError("");
      setPaymentMessage("");
      if (data?.id && selectedPackage?.price) {
        await ensureInstallmentPlan(
          String(data.id),
          selectedPackage.price,
          data.travelDate || bookingForm.travelDate
        );
      }
      setPage("confirmdetails");
    } catch (err) {
      setAuthError(err.message || "Booking request failed");
    }
  };

  const loadInstallments = async (bookingId) => {
    if (!bookingId || !token) return;
    try {
      const res = await fetch(`${API}/payment/installments/${bookingId}`, {
        headers: authHeaders()
      });
      if (!res.ok) return;
      const data = await res.json();
      setInstallments(Array.isArray(data) ? data : []);
    } catch (_) {
      // ignore
    }
  };

  const ensureInstallmentPlan = async (bookingId, totalAmount, travelDate) => {
    if (!bookingId || !token) return;
    setPaymentLoading(true);
    try {
      const res = await fetch(`${API}/payment/installments/plan`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ bookingId, totalAmount, travelDate })
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || "Unable to generate installment plan");
        return;
      }
      setInstallments(Array.isArray(data) ? data : []);
      setPaymentMessage("3-installment plan is ready");
    } catch (err) {
      setPaymentError(err.message || "Unable to generate installment plan");
    } finally {
      setPaymentLoading(false);
    }
  };

  const payInstallment = async (installmentNumber) => {
    if (!booking?.id) return;
    setPaymentError("");
    setPaymentMessage("");
    setPaymentLoading(true);
    try {
      const res = await fetch(`${API}/payment/installments/pay`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          bookingId: String(booking.id),
          installmentNumber
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || "Unable to process installment payment");
        return;
      }
      setPaymentMessage(`Installment ${installmentNumber} paid successfully`);
      await loadInstallments(String(booking.id));
    } catch (err) {
      setPaymentError(err.message || "Unable to process installment payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const totalInstallmentAmount = installments.reduce((sum, item) => sum + (item.amount || 0), 0);
  const paidInstallmentAmount = installments
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const dueInstallmentAmount = Math.max(totalInstallmentAmount - paidInstallmentAmount, 0);
  const accountTotalDue = paymentAudit
    .filter((item) => item.status !== "paid")
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const accountTotalPaid = paymentAudit
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  useEffect(() => {
    if (!booking?.id || !token) return;
    loadInstallments(String(booking.id));
  }, [booking?.id, token, tenantId]);

  useEffect(() => {
    if (!token || page !== "account") return;

    const loadAccountData = async () => {
      setAccountLoading(true);
      try {
        const bookingsRes = await fetch(`${API}/booking/my`, { headers: authHeaders() });
        const bookingsData = await bookingsRes.json();
        if (!bookingsRes.ok || !Array.isArray(bookingsData)) {
          setAccountBookings([]);
          setPaymentAudit([]);
          return;
        }
        setAccountBookings(bookingsData);

        const auditRows = await Promise.all(
          bookingsData.map(async (row) => {
            try {
              const installmentsRes = await fetch(`${API}/payment/installments/${row.id}`, {
                headers: authHeaders()
              });
              if (!installmentsRes.ok) {
                return [];
              }
              const installmentData = await installmentsRes.json();
              if (!Array.isArray(installmentData)) {
                return [];
              }
              return installmentData.map((item) => ({
                ...item,
                bookingId: row.id,
                travelDate: row.travelDate,
                packageId: row.packageId,
                travelerName: row.travelerName
              }));
            } catch (_) {
              return [];
            }
          })
        );
        setPaymentAudit(auditRows.flat());
      } finally {
        setAccountLoading(false);
      }
    };

    loadAccountData();
  }, [token, page, tenantId]);

  return (
    <div className="page">
      <header className="topbar">
        <div className="logo">
          <span className="logo-mark">AM</span>
          <div>
            <p className="brand">Al-Muhammad Travels</p>
            <p className="tagline">Umrah service portal</p>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="account-pill">
          {token ? (
            <>
              <span>Signed in as {email}</span>
              <button className="ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <button className="ghost" onClick={() => setPage("account")}>
              Sign in
            </button>
          )}
        </div>
      </header>

      {page === "home" && (
        <section className="hero reveal">
          <div className="hero-copy">
            <p className="eyebrow">Your journey, simplified</p>
            <h1>Plan a peaceful Umrah with trusted packages and clear pricing.</h1>
            <p className="sub">
              Choose the package that fits your family, confirm dates, and manage
              your booking from one friendly dashboard.
            </p>
            <div className="hero-actions">
              <button className="cta" onClick={() => setPage("packages")}>
                View packages
              </button>
              <button className="ghost" onClick={() => setPage("account")}>
                Create account
              </button>
            </div>
          </div>
          <div className="hero-card">
            <p className="label">Selected package</p>
            <h3>{selectedPackage?.name}</h3>
            <p className="muted">
              {selectedPackage?.nights} nights - {formatPrice(selectedPackage?.price || 0)}
            </p>
            <div className="pill-row">
              {selectedPackage?.highlights?.map((item) => (
                <span className="pill" key={item}>
                  {item}
                </span>
              ))}
            </div>
            {booking && (
              <div className="booking">
                <p>Booking ID: {booking.id}</p>
                <p>Status: {booking.status}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {page === "packages" && (
        <section className="section reveal">
          <div className="section-head">
            <h2>Umrah packages</h2>
            <p className="muted">Transparent pricing with options for every traveler.</p>
          </div>
          <div className="grid">
            {packages.map((pkg, index) => (
              <article
                key={pkg.id}
                className={`card ${selectedId === pkg.id ? "active" : ""} reveal-delay-${index + 1}`}
              >
                <div className="card-head">
                  <h3>{pkg.name}</h3>
                  <p className="price">{formatPrice(pkg.price)}</p>
                </div>
                <p className="muted">{pkg.nights} nights package</p>
                <ul className="list">
                  {(pkg.highlights?.length ? pkg.highlights : ["Guided support", "Daily assistance"]).map(
                    (item) => (
                      <li key={item}>{item}</li>
                    )
                  )}
                </ul>
                <button className="cta light" onClick={() => setSelectedId(pkg.id)}>
                  Choose {pkg.name}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {page === "booking" && (
        <section className="section reveal">
          <div className="section-head">
            <h2>Booking</h2>
            <p className="muted">Enter traveler details and create your booking.</p>
          </div>
          <div className="booking-grid">
            <div className="panel">
              <h3>Traveler details</h3>
              <form className="form" onSubmit={createBooking}>
                <label>
                  Package
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - {formatPrice(pkg.price)} - {pkg.nights} nights
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Full name
                  <input
                    type="text"
                    placeholder="Traveler name"
                    value={bookingForm.travelerName}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, travelerName: e.target.value })
                    }
                  />
                </label>
                <label>
                  Travel date
                  <input
                    type="date"
                    value={bookingForm.travelDate}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, travelDate: e.target.value })
                    }
                  />
                </label>
                <button className="cta" type="submit">
                  Confirm booking
                </button>
                {!token && <p className="muted">Sign in to complete your booking.</p>}
              </form>
            </div>
            <div className="panel summary">
              <h3>Selected package</h3>
              <p className="summary-title">{selectedPackage?.name}</p>
              <p className="muted">{selectedPackage?.nights} nights</p>
              <p className="price">{formatPrice(selectedPackage?.price || 0)}</p>
              <div className="pill-row">
                {selectedPackage?.highlights?.map((item) => (
                  <span className="pill" key={item}>
                  {item}
                </span>
              ))}
              </div>
              <button className="ghost" type="button" onClick={() => setPage("confirmdetails")}>
                Go to confirm details
              </button>
            </div>
          </div>
        </section>
      )}

      {page === "confirmdetails" && (
        <section className="section reveal">
          <div className="section-head">
            <h2>Confirm details</h2>
            <p className="muted">Review your booking before payment.</p>
          </div>
          <div className="panel">
            {booking ? (
              <div className="session">
                <p>Booking ID: {booking.id}</p>
                <p>Status: {booking.status}</p>
                <p>Traveler: {booking.travelerName || bookingForm.travelerName || "-"}</p>
                <p>Travel date: {formatDate(booking.travelDate || bookingForm.travelDate)}</p>
                <p>Package: {selectedPackage?.name || "-"}</p>
                <p>Total: {formatPrice(selectedPackage?.price || 0)}</p>
                <div className="hero-actions">
                  <button className="cta" type="button" onClick={() => setPage("payments")}>
                    Continue to payments
                  </button>
                  <button className="ghost" type="button" onClick={() => setPage("booking")}>
                    Edit booking
                  </button>
                </div>
              </div>
            ) : (
              <div className="session">
                <p>No booking found yet.</p>
                <button className="cta" type="button" onClick={() => setPage("booking")}>
                  Create booking
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {page === "payments" && (
        <section className="section reveal">
          <div className="section-head">
            <h2>Payments</h2>
            <p className="muted">All 3 installments must be paid before travel date.</p>
          </div>
          <div className="panel">
            {booking ? (
              <div className="installments">
                <div className="installments-head">
                  <h4>Pay in 3 installments</h4>
                  <p className="muted">
                    Paid: {formatPrice(paidInstallmentAmount)} | Due: {formatPrice(dueInstallmentAmount)}
                  </p>
                </div>
                {installments.length > 0 ? (
                  <div className="installment-list">
                    {installments.map((item) => (
                      <div className="installment-item" key={item.id}>
                        <div>
                          <p className="installment-title">
                            Installment {item.installmentNumber} of {item.totalInstallments}
                          </p>
                          <p className="muted">
                            Due: {formatDate(item.dueDate)} | Amount: {formatPrice(item.amount || 0)}
                          </p>
                        </div>
                        <button
                          className="cta light"
                          type="button"
                          disabled={paymentLoading || item.status === "paid"}
                          onClick={() => payInstallment(item.installmentNumber)}
                        >
                          {item.status === "paid" ? "Paid" : "Pay now"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">Installment plan will appear after booking confirmation.</p>
                )}
                {paymentMessage && <p className="payment-ok">{paymentMessage}</p>}
                {paymentError && <p className="payment-error">{paymentError}</p>}
              </div>
            ) : (
              <div className="session">
                <p>No booking available for payment.</p>
                <button className="cta" type="button" onClick={() => setPage("booking")}>
                  Create booking first
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {page === "account" && (
        <section className="section reveal">
          <div className="section-head">
            <h2>Account</h2>
            <p className="muted">Create your account or sign in to manage bookings.</p>
          </div>
          <div className="auth-card">
            {token ? (
              <div className="session">
                <h3>Welcome back</h3>
                <p>Signed in as {email}</p>
                <p>Name: {[firstName, lastName].filter(Boolean).join(" ") || "-"}</p>
                <p>Mobile: {mobileNumber || "-"}</p>
                <p>Tenant: {tenantId}</p>
                <p>Paid so far: {formatPrice(accountTotalPaid)}</p>
                <p>Payment due: {formatPrice(accountTotalDue)}</p>
                <div className="hero-actions">
                  <button className="ghost" onClick={handleLogout}>
                    Log out
                  </button>
                </div>

                <div className="account-block">
                  <h4>Confirmed packages</h4>
                  {accountLoading ? (
                    <p className="muted">Loading bookings...</p>
                  ) : accountBookings.length === 0 ? (
                    <p className="muted">No confirmed bookings yet.</p>
                  ) : (
                    <div className="installment-list">
                      {accountBookings.map((item) => (
                        <div className="installment-item" key={item.id}>
                          <div>
                            <p className="installment-title">{resolvePackageName(item.packageId)}</p>
                            <p className="muted">
                              Booking #{item.id} | Traveler: {item.travelerName || "-"}
                            </p>
                            <p className="muted">
                              Travel: {formatDate(item.travelDate)} | Status: {item.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="account-block">
                  <h4>Payment audit</h4>
                  {accountLoading ? (
                    <p className="muted">Loading payments...</p>
                  ) : paymentAudit.length === 0 ? (
                    <p className="muted">No payment records yet.</p>
                  ) : (
                    <div className="installment-list">
                      {paymentAudit.map((item) => (
                        <div className="installment-item" key={`${item.id}-${item.bookingId}`}>
                          <div>
                            <p className="installment-title">
                              Booking #{item.bookingId} | {resolvePackageName(item.packageId)}
                            </p>
                            <p className="muted">
                              Installment {item.installmentNumber}/{item.totalInstallments} | Due {formatDate(item.dueDate)}
                            </p>
                            <p className="muted">
                              Amount {formatPrice(item.amount || 0)} | Status: {item.status}
                              {item.paidAt ? ` | Paid at: ${formatDate(item.paidAt)}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <label className="tenant-field">
                  Tenant ID
                  <input
                    type="text"
                    placeholder="public"
                    value={tenantId}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().trim() || "public";
                      setTenantId(value);
                      localStorage.setItem("tenantId", value);
                    }}
                  />
                </label>
                <div className="tabs">
                  <button
                    className={`tab ${authMode === "signin" ? "active" : ""}`}
                    onClick={() => setAuthMode("signin")}
                  >
                    Sign in
                  </button>
                  <button
                    className={`tab ${authMode === "register" ? "active" : ""}`}
                    onClick={() => setAuthMode("register")}
                  >
                    Create account
                  </button>
                </div>
                {authMode === "signin" ? (
                  <form className="form" onSubmit={handleLogin}>
                    <label>
                      Email
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        placeholder="Your password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, password: e.target.value })
                        }
                        required
                      />
                    </label>
                    <button className="cta" type="submit">
                      Sign in
                    </button>
                  </form>
                ) : (
                  <form className="form" onSubmit={handleRegister}>
                    <label>
                      First name
                      <input
                        type="text"
                        placeholder="First name"
                        value={registerForm.firstName}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, firstName: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label>
                      Last name
                      <input
                        type="text"
                        placeholder="Last name"
                        value={registerForm.lastName}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, lastName: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, email: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label>
                      Mobile number
                      <div className="row-fields">
                        <input
                          type="text"
                          placeholder="+91"
                          value={registerForm.countryCode}
                          onChange={(e) => {
                            setOtpVerified(false);
                            setRegisterForm({
                              ...registerForm,
                              countryCode: e.target.value,
                              mobileVerificationToken: ""
                            });
                          }}
                          required
                        />
                        <input
                          type="text"
                          placeholder="9876543210"
                          value={registerForm.mobileNumber}
                          onChange={(e) => {
                            setOtpVerified(false);
                            setRegisterForm({
                              ...registerForm,
                              mobileNumber: e.target.value,
                              mobileVerificationToken: ""
                            });
                          }}
                          required
                        />
                      </div>
                    </label>
                    <div className="row-actions">
                      <button className="ghost" onClick={requestOtp} type="button">
                        Send OTP
                      </button>
                    </div>
                    <label>
                      OTP
                      <div className="row-fields">
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={registerForm.otp}
                          onChange={(e) =>
                            setRegisterForm({ ...registerForm, otp: e.target.value })
                          }
                        />
                        <button className="ghost" onClick={verifyOtp} type="button">
                          Verify OTP
                        </button>
                      </div>
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, password: e.target.value })
                        }
                        required
                      />
                    </label>
                    {otpMessage && (
                      <p className="muted">
                        {otpMessage}
                        {otpVerified ? " (verified)" : ""}
                      </p>
                    )}
                    <button className="cta" type="submit">
                      Create account
                    </button>
                  </form>
                )}
                {authError && <p className="muted">{authError}</p>}
                {GOOGLE_CLIENT_ID ? (
                  <div id="google-signin-btn" />
                ) : (
                  <p className="muted">
                    Google Sign-In is disabled. Set <code>VITE_GOOGLE_CLIENT_ID</code>.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      <section className="steps reveal">
        <div>
          <h3>1. Choose a package</h3>
          <p>Select the experience that fits your family and budget.</p>
        </div>
        <div>
          <h3>2. Confirm details</h3>
          <p>Add traveler details and travel dates in a few steps.</p>
        </div>
        <div>
          <h3>3. Complete payments</h3>
          <p>Pay in three installments and track status for each due date.</p>
        </div>
      </section>
    </div>
  );
}
