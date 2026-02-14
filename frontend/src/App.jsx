import React, { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const HERO_COVER_IMAGE =
  "https://res.cloudinary.com/djzjta6h3/image/upload/v1771031352/web-cover_r4n0eq.jpg";
const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "packages", label: "Packages" },
  { id: "booking", label: "Booking" },
  { id: "confirmdetails", label: "Confirm details" },
  { id: "payments", label: "Payments" },
  { id: "admin", label: "Admin" },
  { id: "account", label: "Account" }
];
const PACKAGE_IMAGE_MAP = {
  ECONOMY:
    "https://res.cloudinary.com/djzjta6h3/image/upload/v1771032514/umrah-basic_lmk9ma.jpg",
  "UMRAH-BASIC":
    "https://res.cloudinary.com/djzjta6h3/image/upload/v1771032514/umrah-basic_lmk9ma.jpg",
  PREMIUM:
    "https://res.cloudinary.com/djzjta6h3/image/upload/v1771032670/umrahPremium_pcpkxr.jpg",
  "UMRAH-PREMIUM":
    "https://res.cloudinary.com/djzjta6h3/image/upload/v1771032670/umrahPremium_pcpkxr.jpg",
  UMRAH_PREMIUM:
    "https://res.cloudinary.com/djzjta6h3/image/upload/v1771032670/umrahPremium_pcpkxr.jpg",
  "UMRAH-PLUS":
    "https://res.cloudinary.com/djzjta6h3/image/upload/v1771032671/UmrahEconomy_bfh9os.jpg",
  DEFAULT:
    "https://res.cloudinary.com/djzjta6h3/image/upload/v1771031352/web-cover_r4n0eq.jpg"
};

const fallbackPackages = [
  {
    id: "economy",
    code: "ECONOMY",
    name: "Economy Umrah",
    nights: 7,
    price: 115000,
    imageUrl: PACKAGE_IMAGE_MAP.ECONOMY,
    highlights: ["3-star hotel", "Shared transport", "Guided ziyarat"]
  },
  {
    id: "premium",
    code: "PREMIUM",
    name: "Premium Umrah",
    nights: 10,
    price: 165000,
    imageUrl: PACKAGE_IMAGE_MAP.PREMIUM,
    highlights: ["4-star hotel", "Private transport", "Priority support"]
  },
  {
    id: "deluxe",
    code: "DELUXE",
    name: "Deluxe Umrah",
    nights: 14,
    price: 225000,
    imageUrl: PACKAGE_IMAGE_MAP.DEFAULT,
    highlights: ["5-star hotel", "Private guided support", "VIP transfer"]
  }
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
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminPackages, setAdminPackages] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminPayments, setAdminPayments] = useState([]);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [editingPackageForm, setEditingPackageForm] = useState({
    code: "",
    name: "",
    nights: "",
    price: "",
    description: ""
  });
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingPaymentForm, setEditingPaymentForm] = useState({
    amount: "",
    status: "due",
    dueDate: "",
    paidAt: ""
  });
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
        if (!Array.isArray(data) || data.length === 0) {
          setPackages((prev) => (Array.isArray(prev) && prev.length > 0 ? prev : fallbackPackages));
          return;
        }
        const normalized = data.map((pkg) => ({
          id: pkg.id ?? pkg.code ?? pkg.name,
          code: pkg.code,
          name: pkg.name,
          nights: pkg.nights,
          price: pkg.price,
          imageUrl:
            pkg.imageUrl ||
            PACKAGE_IMAGE_MAP[(pkg.code || "").toUpperCase()] ||
            ((pkg.name || "").toLowerCase().includes("premium") ? PACKAGE_IMAGE_MAP.PREMIUM : null) ||
            ((pkg.name || "").toLowerCase().includes("plus") ? PACKAGE_IMAGE_MAP["UMRAH-PLUS"] : null) ||
            ((pkg.name || "").toLowerCase().includes("basic") ||
            (pkg.name || "").toLowerCase().includes("economy")
              ? PACKAGE_IMAGE_MAP["UMRAH-BASIC"]
              : null) ||
            PACKAGE_IMAGE_MAP.DEFAULT,
          highlights: pkg.description ? [pkg.description] : []
        }));
        setPackages(normalized);
        setSelectedId(normalized[0]?.id ?? fallbackPackages[0].id);
      })
      .catch(() =>
        setPackages((prev) => (Array.isArray(prev) && prev.length > 0 ? prev : fallbackPackages))
      );
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

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
    setAdminLoading(false);
    setAdminError("");
    setAdminMessage("");
    setAdminPackages([]);
    setAdminBookings([]);
    setAdminPayments([]);
    setEditingPackageId(null);
    setEditingPaymentId(null);
    setProfileMenuOpen(false);
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
      if (!res.ok || !data?.id) {
        setAuthError(data?.error || "Unable to create booking");
        return;
      }
      setBooking(data);
      setAuthError("");
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
  const cartCount = booking ? 1 : 0;

  useEffect(() => {
    if (!booking?.id || !token) return;
    loadInstallments(String(booking.id));
  }, [booking?.id, token, tenantId]);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [page, token]);

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

  const loadAdminData = async () => {
    if (!token || role !== "ADMIN") return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const [packagesRes, bookingsRes, paymentsRes] = await Promise.all([
        fetch(`${API}/admin/catalog/packages`, { headers: authHeaders() }),
        fetch(`${API}/admin/booking/bookings`, { headers: authHeaders() }),
        fetch(`${API}/admin/payment/payments`, { headers: authHeaders() })
      ]);

      const packagesData = await packagesRes.json();
      const bookingsData = await bookingsRes.json();
      const paymentsData = await paymentsRes.json();

      if (!packagesRes.ok) {
        throw new Error(packagesData?.error || "Unable to load packages");
      }
      if (!bookingsRes.ok) {
        throw new Error(bookingsData?.error || "Unable to load bookings");
      }
      if (!paymentsRes.ok) {
        throw new Error(paymentsData?.error || "Unable to load payments");
      }

      setAdminPackages(Array.isArray(packagesData) ? packagesData : []);
      setAdminBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setAdminPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err) {
      setAdminError(err.message || "Unable to load admin data");
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (page !== "admin" || !token || role !== "ADMIN") return;
    loadAdminData();
  }, [page, token, role, tenantId]);

  const startPackageEdit = (pkg) => {
    setEditingPackageId(pkg.id);
    setEditingPackageForm({
      code: pkg.code || "",
      name: pkg.name || "",
      nights: String(pkg.nights ?? ""),
      price: String(pkg.price ?? ""),
      description: pkg.description || ""
    });
  };

  const savePackageEdit = async () => {
    if (!editingPackageId) return;
    setAdminError("");
    setAdminMessage("");
    try {
      const res = await fetch(`${API}/admin/catalog/packages/${editingPackageId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          code: editingPackageForm.code,
          name: editingPackageForm.name,
          nights: Number(editingPackageForm.nights),
          price: Number(editingPackageForm.price),
          description: editingPackageForm.description
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to update package");
      setAdminMessage("Package updated");
      setEditingPackageId(null);
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Unable to update package");
    }
  };

  const startPaymentEdit = (payment) => {
    setEditingPaymentId(payment.id);
    setEditingPaymentForm({
      amount: String(payment.amount ?? ""),
      status: payment.status || "due",
      dueDate: payment.dueDate || "",
      paidAt: payment.paidAt || ""
    });
  };

  const savePaymentEdit = async () => {
    if (!editingPaymentId) return;
    setAdminError("");
    setAdminMessage("");
    try {
      const res = await fetch(`${API}/admin/payment/payments/${editingPaymentId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          amount: Number(editingPaymentForm.amount),
          status: editingPaymentForm.status,
          dueDate: editingPaymentForm.dueDate || null,
          paidAt: editingPaymentForm.paidAt || ""
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to update payment");
      setAdminMessage("Payment updated");
      setEditingPaymentId(null);
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Unable to update payment");
    }
  };

  const deleteBookingAsAdmin = async (bookingId) => {
    const reason = window.prompt("Enter reason for deleting this booking:");
    if (!reason || !reason.trim()) return;
    setAdminError("");
    setAdminMessage("");
    try {
      const res = await fetch(`${API}/admin/booking/bookings/${bookingId}`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ reason: reason.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to delete booking");
      setAdminMessage("Booking deleted");
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Unable to delete booking");
    }
  };

  const deletePaymentAsAdmin = async (paymentId) => {
    const reason = window.prompt("Enter reason for deleting this payment:");
    if (!reason || !reason.trim()) return;
    setAdminError("");
    setAdminMessage("");
    try {
      const res = await fetch(`${API}/admin/payment/payments/${paymentId}`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ reason: reason.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to delete payment");
      setAdminMessage("Payment deleted");
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Unable to delete payment");
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="logo">
          <img
            className="brand-logo"
            src="https://res.cloudinary.com/djzjta6h3/image/upload/v1771030169/LOGO_ytc1mc.png"
            alt="Al-Muhammad logo"
          />
          <div>
            <p className="brand">Al-Muhammad Travels</p>
            <p className="tagline">Umrah service portal</p>
          </div>
        </div>
        <nav className="nav">
          {navItems
            .filter((item) => item.id !== "admin" || role === "ADMIN")
            .map((item) => (
              <button
                key={item.id}
                className={`nav-link ${page === item.id ? "active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
        </nav>
        <div className="header-search">
          <input type="text" placeholder="Search" />
          <button type="button">Go</button>
        </div>
        <div className="header-links">
          <button type="button" onClick={() => setPage("account")}>Account</button>
          <button type="button" onClick={() => setPage("booking")}>My Bookings</button>
        </div>
        <div className="account-pill">
          {token ? (
            <div className="profile-menu">
              <button
                className="profile-trigger"
                type="button"
                aria-label="Open profile menu"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
              >
                {(firstName || email || "U").trim().charAt(0).toUpperCase()}
              </button>
              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <button
                    type="button"
                    onClick={() => {
                      setPage("account");
                      setProfileMenuOpen(false);
                    }}
                  >
                    Profile settings
                  </button>
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="ghost" onClick={() => setPage("account")}>
              Sign in
            </button>
          )}
          <button className="cart-chip" type="button" onClick={() => setPage("payments")}>
            Cart <span>{cartCount}</span>
          </button>
        </div>
      </header>

      {page === "home" && (
        <>
          <section className="hero-showcase reveal">
            <img
              className="hero-showcase-image"
              src={HERO_COVER_IMAGE}
              alt="Umrah service cover"
              loading="eager"
            />
            <div className="hero-showcase-overlay">
              <p className="hero-kicker">AL-MUHAMMAD TRAVELS UMRAH SERVICES</p>
              <h1>Peaceful Umrah plans for journeys that matter.</h1>
              <p>
                Each package is curated with trusted hotels, guided support, and clear
                payment options for a smooth pilgrimage experience.
              </p>
              <div className="hero-actions">
                <button className="cta light" onClick={() => setPage("packages")}>
                  View Packages
                </button>
                <button className="ghost invert" onClick={() => setPage("booking")}>
                  Plan My Journey
                </button>
              </div>
            </div>
          </section>

          <section className="section reveal">
            <div className="section-head">
              <div>
                <p className="label">Packages</p>
                <h2>Curated Umrah packages</h2>
              </div>
              <button className="text-link" type="button" onClick={() => setPage("packages")}>
                View all packages
              </button>
            </div>
            <div className="collection-grid">
              {packages.slice(0, 4).map((pkg, index) => (
                <article className="collection-card" key={pkg.id}>
                  <img src={pkg.imageUrl || PACKAGE_IMAGE_MAP.DEFAULT} alt={pkg.name} loading="lazy" />
                  <div className="collection-meta">
                    <h3>{pkg.name}</h3>
                    <p>
                      {pkg.nights} nights | {formatPrice(pkg.price || 0)}
                    </p>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => {
                        setSelectedId(pkg.id);
                        setPage("booking");
                      }}
                    >
                      Select package
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
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
                <img
                  className="package-image"
                  src={pkg.imageUrl || PACKAGE_IMAGE_MAP.DEFAULT}
                  alt={pkg.name}
                  loading="lazy"
                />
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
                <button
                  className="cta light"
                  onClick={() => {
                    setSelectedId(pkg.id);
                    setPage("booking");
                  }}
                >
                  Choose {pkg.name}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {page === "about" && (
        <section className="section reveal">
          <div className="section-head">
            <h2>About Al-Muhammad Travels</h2>
            <p className="muted">Trusted Umrah journeys with comfort, clarity, and care.</p>
          </div>
          <div className="booking-grid">
            <div className="panel">
              <h3>Who we are</h3>
              <p className="muted">
                We are a dedicated Umrah travel service helping families plan smooth journeys
                with transparent pricing, guided support, and reliable coordination from booking
                to return.
              </p>
              <p className="muted">
                Our focus is service quality, timely communication, and respectful hospitality
                throughout your pilgrimage.
              </p>
            </div>
            <div className="panel">
              <h3>What you get</h3>
              <ul className="list">
                <li>Curated Umrah packages for different budgets</li>
                <li>Step-by-step booking confirmation</li>
                <li>Three-installment payment support</li>
                <li>Account dashboard with payment audit and due tracking</li>
                <li>Multi-tenant ready platform for scalable operations</li>
              </ul>
              <div className="hero-actions">
                <button className="cta" type="button" onClick={() => setPage("packages")}>
                  Explore packages
                </button>
                <button className="ghost" type="button" onClick={() => setPage("account")}>
                  Contact via account
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {page === "booking" && (
        <section className="section reveal">
          <div className="section-head">
            <h2>Booking</h2>
            <p className="muted">
              Enter traveler details and create your booking for {selectedPackage?.name || "selected package"}.
            </p>
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

      {page === "admin" && role === "ADMIN" && (
        <section className="section reveal">
          <div className="section-head">
            <h2>Admin Access</h2>
            <p className="muted">Manage user payments and update packages.</p>
          </div>
          {adminError && <p className="payment-error">{adminError}</p>}
          {adminMessage && <p className="payment-ok">{adminMessage}</p>}
          {adminLoading && <p className="muted">Loading admin data...</p>}

          <div className="booking-grid">
            <div className="panel">
              <h3>Update Packages</h3>
              <div className="installment-list">
                {adminPackages.map((pkg) => (
                  <div className="installment-item" key={pkg.id}>
                    {editingPackageId === pkg.id ? (
                      <div className="admin-edit-grid">
                        <input
                          type="text"
                          placeholder="Code"
                          value={editingPackageForm.code}
                          onChange={(e) =>
                            setEditingPackageForm({ ...editingPackageForm, code: e.target.value })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Name"
                          value={editingPackageForm.name}
                          onChange={(e) =>
                            setEditingPackageForm({ ...editingPackageForm, name: e.target.value })
                          }
                        />
                        <input
                          type="number"
                          placeholder="Nights"
                          value={editingPackageForm.nights}
                          onChange={(e) =>
                            setEditingPackageForm({ ...editingPackageForm, nights: e.target.value })
                          }
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={editingPackageForm.price}
                          onChange={(e) =>
                            setEditingPackageForm({ ...editingPackageForm, price: e.target.value })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={editingPackageForm.description}
                          onChange={(e) =>
                            setEditingPackageForm({
                              ...editingPackageForm,
                              description: e.target.value
                            })
                          }
                        />
                        <div className="admin-actions">
                          <button className="cta light" type="button" onClick={savePackageEdit}>
                            Save
                          </button>
                          <button className="ghost" type="button" onClick={() => setEditingPackageId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="installment-title">{pkg.name}</p>
                          <p className="muted">
                            {pkg.code} | {pkg.nights} nights | {formatPrice(pkg.price || 0)}
                          </p>
                        </div>
                        <button className="ghost" type="button" onClick={() => startPackageEdit(pkg)}>
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h3>Delete Bookings (with reason)</h3>
              <div className="installment-list">
                {adminBookings.map((bookingRow) => (
                  <div className="installment-item" key={bookingRow.id}>
                    <div>
                      <p className="installment-title">
                        Booking #{bookingRow.id} | {resolvePackageName(bookingRow.packageId)}
                      </p>
                      <p className="muted">
                        Traveler: {bookingRow.travelerName} | Travel: {formatDate(bookingRow.travelDate)}
                      </p>
                      <p className="muted">User: {bookingRow.userEmail} | Status: {bookingRow.status}</p>
                    </div>
                    <button
                      className="ghost danger"
                      type="button"
                      onClick={() => deleteBookingAsAdmin(bookingRow.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h3>Edit/Delete User Payments</h3>
              <div className="installment-list">
                {adminPayments.map((payment) => (
                  <div className="installment-item" key={payment.id}>
                    {editingPaymentId === payment.id ? (
                      <div className="admin-edit-grid">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={editingPaymentForm.amount}
                          onChange={(e) =>
                            setEditingPaymentForm({ ...editingPaymentForm, amount: e.target.value })
                          }
                        />
                        <select
                          value={editingPaymentForm.status}
                          onChange={(e) =>
                            setEditingPaymentForm({ ...editingPaymentForm, status: e.target.value })
                          }
                        >
                          <option value="due">due</option>
                          <option value="paid">paid</option>
                          <option value="failed">failed</option>
                        </select>
                        <input
                          type="date"
                          value={editingPaymentForm.dueDate}
                          onChange={(e) =>
                            setEditingPaymentForm({ ...editingPaymentForm, dueDate: e.target.value })
                          }
                        />
                        <input
                          type="datetime-local"
                          value={editingPaymentForm.paidAt ? editingPaymentForm.paidAt.slice(0, 16) : ""}
                          onChange={(e) =>
                            setEditingPaymentForm({
                              ...editingPaymentForm,
                              paidAt: e.target.value ? `${e.target.value}:00Z` : ""
                            })
                          }
                        />
                        <div className="admin-actions">
                          <button className="cta light" type="button" onClick={savePaymentEdit}>
                            Save
                          </button>
                          <button className="ghost" type="button" onClick={() => setEditingPaymentId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="installment-title">
                            Booking #{payment.bookingId} | Installment {payment.installmentNumber}/
                            {payment.totalInstallments}
                          </p>
                          <p className="muted">
                            {formatPrice(payment.amount || 0)} | Status: {payment.status}
                          </p>
                          <p className="muted">
                            Due: {formatDate(payment.dueDate)} | Paid: {formatDateTime(payment.paidAt)}
                          </p>
                        </div>
                        <div className="admin-actions">
                          <button className="ghost" type="button" onClick={() => startPaymentEdit(payment)}>
                            Edit
                          </button>
                          <button
                            className="ghost danger"
                            type="button"
                            onClick={() => deletePaymentAsAdmin(payment.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
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

    </div>
  );
}
