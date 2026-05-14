import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import hh2 from "../assets/img/erg.png";
import { useAuth } from "../context/AuthContext";

const DonationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const campaignId = searchParams.get('campaign');
  
  const { user } = useAuth();
  // State management
  const [selectedAmount, setSelectedAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donationType, setDonationType] = useState("monthly");
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [submitted, setSubmitted] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({
    amount: "",
    phone: "",
    email: "",
    name: "",
  });
  // Volunteer state
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [volunteerForm, setVolunteerForm] = useState({
    availability: "any",
    skills: "",
    message: "",
  });
  const [volunteerSubmitting, setVolunteerSubmitting] = useState(false);
  const [volunteerSubmitted, setVolunteerSubmitted] = useState(false);
  const [volunteerError, setVolunteerError] = useState(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showVolunteerSuccess, setShowVolunteerSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authContext, setAuthContext] = useState('donation'); // 'donation' | 'volunteer'

  // Constants
  const amounts = ["75", "150", "200", "500", "1000", "2000"];
  const isMonthly = donationType === "monthly";

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Autofill user name/email into Step 2 when logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  // Handlers
  const handleNext = () => {
    if (step === 1) {
      if (!selectedAmount && !customAmount) {
        setErrors({ ...errors, amount: "Please select or enter an amount" });
        return;
      }
      if (customAmount && (isNaN(customAmount) || customAmount < 10)) {
        setErrors({ ...errors, amount: "Minimum donation is ₹10" });
        return;
      }
    }
    if (step === 2) {
      if (!formData.name.trim()) {
        setErrors({ ...errors, name: "Name is required" });
        return;
      }
      if (!formData.email.trim()) {
        setErrors({ ...errors, email: "Email is required" });
        return;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setErrors({ ...errors, email: "Please enter a valid email" });
        return;
      }
      if (!validatePhone(formData.phone)) {
        setErrors({
          ...errors,
          phone: "Please enter a valid 10-digit phone number",
        });
        return;
      }
    }
    setErrors({ amount: "", phone: "", email: "", name: "" });
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVolunteerInputChange = (e) => {
    const { name, value } = e.target;
    setVolunteerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVolunteerSubmit = async () => {
    try {
      setVolunteerError(null);
      setVolunteerSubmitting(true);

      if (!formData.name || !formData.email || !formData.phone) {
        setVolunteerError("Please fill your name, email and phone above first");
        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        campaignId: campaignId || null,
        availability: volunteerForm.availability,
        skills: volunteerForm.skills
          ? volunteerForm.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        message: volunteerForm.message,
      };

      // Require login for volunteer registration
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthContext('volunteer');
        setShowAuthModal(true);
        return;
      }

      const res = await fetch("http://localhost:5000/api/volunteers", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to register as volunteer");
      }
      setVolunteerSubmitted(true);
      setIsVolunteer(true);
      setShowVolunteerModal(false);
      setShowVolunteerSuccess(true);
    } catch (err) {
      setVolunteerError(err.message || "Failed to register as volunteer");
    } finally {
      setVolunteerSubmitting(false);
    }
  };

  const validatePhone = (phone) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone.replace(/\D/g, ""));
  };


  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFetchError(null);

    try {
      // Require login for donation submission
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthContext('donation');
        setShowAuthModal(true);
        setIsLoading(false);
        return;
      }

      const donationData = {
        amount: Number(getActualAmount()),
        type: donationType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        paymentMethod,
        reminder: reminder && isMonthly,
        status: "completed",
        date: new Date(),
        campaignId: campaignId || null, // Add campaign ID if available
      };

      console.log('Submitting donation:', donationData);

      // Submit donation to backend
      const response = await fetch('http://localhost:5000/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(donationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Donation submitted successfully:', data);

      // Show success message
      setSubmitted(true);
      setPaymentSummary((prev) => ({
        ...prev,
        transactionId: data.donation?._id || 
          `TXN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      }));

    } catch (error) {
      console.error("Error submitting donation:", error);
      setFetchError(
        error.message || "Failed to process donation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  

  // Get the actual amount (selected or custom)
  const getActualAmount = () => customAmount || selectedAmount;

  // Payment summary state
  const [paymentSummary, setPaymentSummary] = useState({
    amount: getActualAmount(),
    type: donationType,
    ...formData,
    paymentMethod,
    date: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    transactionId: `TXN${Math.random()
      .toString(36)
      .substr(2, 8)
      .toUpperCase()}`,
  });

  // Update payment summary when relevant data changes
  useEffect(() => {
    setPaymentSummary((prev) => ({
      ...prev,
      amount: getActualAmount(),
      type: donationType,
      ...formData,
      paymentMethod,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }));
  }, [selectedAmount, customAmount, donationType, formData, paymentMethod]);

  // Rest of your component remains the same...
  // (The JSX part of your component doesn't need changes for the API integration)

  return (
    <div className="min-h-screen bg-[#e9f3ef] px-4 py-10 flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-64 h-64 rounded-full bg-[#05496c] opacity-10"></div>
        <div className="absolute bottom-10 -right-10 w-80 h-80 rounded-full bg-[#05496c] opacity-10"></div>
      </div>

      <div className="relative w-full max-w-6xl h-full flex flex-col lg:flex-row">
        {/* Left content - form steps */}
        <div className="w-full lg:w-1/2 lg:pr-8">
          {/* Progress indicator for mobile */}
          {isMobile && (
            <div className="flex justify-center mb-6">
              <div className="flex items-center">
                {[1, 2, 3].map((stepNumber) => (
                  <React.Fragment key={stepNumber}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= stepNumber
                          ? "bg-[#05496c] text-white"
                          : "bg-[#dfe5e3] text-[#0b3e5e]"
                      }`}
                    >
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div
                        className={`w-12 h-1 ${
                          step > stepNumber ? "bg-[#05496c]" : "bg-[#dfe5e3]"
                        }`}
                      ></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Error message for fetch errors */}
          {fetchError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg flex items-start" aria-live="polite">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500 mr-2 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-700">{fetchError}</p>
            </div>
          )}

          {/* Step 1: Donation Amount */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              step === 1
                ? "block opacity-100 translate-y-0"
                : "hidden opacity-0 -translate-y-4"
            }`}
          >
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg w-full max-w-lg mx-auto">
              <h2 className="text-3xl font-bold text-[#0b3e5e] mb-3">
                The Impact of a{" "}
                <span className="text-[#05496c]">Monthly Donation</span>
              </h2>
              <p className="text-[#0b3e5e] mb-6 text-sm md:text-base">
                Steady {isMonthly ? "monthly" : "one-time"} donations create
                lasting change by helping us plan long-term projects and respond
                to emergencies.
              </p>

              {isMonthly && (
                <div className="bg-[#e9f3ef] border-l-4 border-[#05496c] p-3 mb-6 rounded-lg flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#05496c] mr-2 mt-0.5 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-[#0b3e5e]">
                    <strong>Tax Benefit:</strong> 50% tax deduction under 80G
                    for monthly donations
                  </p>
                </div>
              )}

              {/* Toggle */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setDonationType("once")}
                  className={`flex-1 py-3 rounded-lg font-semibold border transition-all ${
                    donationType === "once"
                      ? "bg-[#05496c] text-white border-[#0b3e5e] shadow-md"
                      : "bg-[#dfe5e3] text-[#0b3e5e] border-[#dfe5e3] hover:bg-[#e9f3ef]"
                  }`}
                >
                  DONATE ONCE
                </button>
                <button
                  onClick={() => setDonationType("monthly")}
                  className={`flex-1 py-3 rounded-lg font-semibold border transition-all ${
                    donationType === "monthly"
                      ? "bg-[#05496c] text-white border-[#0b3e5e] shadow-md"
                      : "bg-[#dfe5e3] text-[#0b3e5e] border-[#dfe5e3] hover:bg-[#e9f3ef]"
                  }`}
                >
                  DONATE MONTHLY
                </button>
              </div>

              {/* Preset Amounts */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-[#0b3e5e] mb-3">
                  Select an amount (₹)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {amounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount("");
                        setErrors({ ...errors, amount: "" });
                      }}
                      className={`py-3 rounded-lg font-medium border-2 transition-all transform hover:scale-[1.02] ${
                        selectedAmount === amt && !customAmount
                          ? "bg-[#05496c] text-white border-[#0b3e5e] scale-[1.02] shadow-md"
                          : "bg-white text-[#0b3e5e] border-[#dfe5e3] hover:bg-[#e9f3ef] hover:border-[#05496c]"
                      }`}
                    >
                      ₹{amt}
                      {isMonthly && "/mo"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#0b3e5e] mb-2">
                  Or enter a custom amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0b3e5e]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    placeholder="Enter amount"
                    min="10"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount("");
                      setErrors({ ...errors, amount: "" });
                    }}
                    className="w-full pl-10 p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] focus:border-[#05496c] hover:border-[#0b3e5e] transition"
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
                <p className="text-xs text-[#0b3e5e] mt-1">
                  Minimum donation: ₹10
                </p>
              </div>

              <button
                onClick={handleNext}
                disabled={!selectedAmount && !customAmount}
                className={`w-full py-3.5 bg-[#05496c] text-white rounded-lg font-semibold hover:bg-[#0b3e5e] transition-all ${
                  !selectedAmount && !customAmount
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                Continue
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 inline-block ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Step 2: Basic Details */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              step === 2
                ? "block opacity-100 translate-y-0"
                : "hidden opacity-0 -translate-y-4"
            }`}
          >
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg w-full max-w-lg mx-auto">
              <button
                onClick={handleBack}
                className="flex items-center text-sm text-[#05496c] hover:text-[#0b3e5e] mb-5 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Amount
              </button>
              <h2 className="text-2xl font-bold text-[#0b3e5e] mb-6">
                Tell us about yourself
              </h2>
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#0b3e5e] mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Your Name"
                    autoComplete="name"
                    className="w-full p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#05496c]"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0b3e5e] mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your@email.com"
                    autoComplete="email"
                    className="w-full p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#05496c]"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0b3e5e] mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="9876543210"
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    className="w-full p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#05496c]"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {isMonthly && (
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="reminder"
                      checked={reminder}
                      onChange={() => setReminder(!reminder)}
                      className="h-4 w-4 text-[#05496c] focus:ring-[#05496c] border-[#dfe5e3] rounded mt-1"
                    />
                    <label
                      htmlFor="reminder"
                      className="ml-2 block text-sm text-[#0b3e5e]"
                    >
                      Send me a reminder before each monthly donation
                    </label>
                  </div>
                )}

                {/* Volunteer Opt-in */}
                <div className="mt-4 p-4 rounded-xl border border-[#dfe5e3] bg-[#f6faf9]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#0b3e5e] font-medium">I want to join as a volunteer for this campaign</p>
                      <p className="text-xs text-[#0b3e5e] opacity-80 mt-1">Help with field support, distribution, guidance and more.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowVolunteerModal(true)}
                      className="px-4 py-2 rounded-lg bg-[#0b3e5e] text-white text-sm hover:bg-[#05496c]"
                    >
                      {volunteerSubmitted ? 'Registered ✔' : 'Fill Form'}
                    </button>
                  </div>
                  {volunteerSubmitted && (
                    <p className="text-green-700 text-xs mt-2">Thanks! You have been registered as a volunteer.</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3.5 bg-[#05496c] text-white rounded-lg font-semibold hover:bg-[#0b3e5e] transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Continue to Payment
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 inline-block ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </form>
              <p className="text-[11px] text-[#0b3e5e] opacity-70 mt-3">We never store your card data. All payments are processed securely.</p>
            </div>
          </div>

          {/* Step 3: Payment */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              step === 3
                ? "block opacity-100 translate-y-0"
                : "hidden opacity-0 -translate-y-4"
            }`}
          >
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg w-full max-w-lg mx-auto">
              <button
                onClick={handleBack}
                className="flex items-center text-sm text-[#05496c] hover:text-[#0b3e5e] mb-5 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Details
              </button>
              <h2 className="text-2xl font-bold text-[#0b3e5e] mb-5">
                Payment Method
              </h2>

              {/* Donation Summary */}
              <div className="bg-[#e9f3ef] p-5 rounded-xl mb-7 border border-[#dfe5e3]">
                <h3 className="text-sm font-medium text-[#0b3e5e] mb-3">
                  DONATION SUMMARY
                </h3>
                <div className="flex justify-between mb-2">
                  <span className="text-[#0b3e5e]">Amount:</span>
                  <span className="font-medium">
                    ₹{getActualAmount()} {isMonthly ? "/month" : ""}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-[#0b3e5e]">Type:</span>
                  <span className="font-medium">
                    {isMonthly ? "Monthly" : "One-time"} donation
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0b3e5e]">Payment Method:</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-3 mb-7">
                {["UPI", "Card", "Net Banking"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPaymentMethod(tab)}
                    className={`flex-1 py-3 rounded-lg font-semibold border transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#05496c] ${
                      paymentMethod === tab
                        ? "bg-[#05496c] text-white border-[#0b3e5e] shadow-md"
                        : "bg-[#dfe5e3] text-[#0b3e5e] border-[#dfe5e3] hover:bg-[#e9f3ef]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                {paymentMethod === "UPI" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#0b3e5e] mb-1">
                        UPI ID
                      </label>
                      <div className="flex border border-[#dfe5e3] rounded-lg overflow-hidden transition hover:border-[#0b3e5e]">
                        <input
                          type="text"
                          required
                          placeholder="yourname@upi"
                          className="flex-1 p-3 outline-none"
                        />
                        <button
                          type="button"
                          className="bg-[#e9f3ef] text-[#05496c] px-4 hover:bg-[#dfe5e3] transition"
                          onClick={() => setPaymentMethod("QR")}
                        >
                          QR Code
                        </button>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[#0b3e5e] mb-3">OR</p>
                      <button
                        type="button"
                        className="w-full py-2.5 bg-[#05496c] text-white rounded-lg font-medium hover:bg-[#0b3e5e] transition flex items-center justify-center"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 0a12 12 0 100 24 12 12 0 000-24zm1.14 5h1.71v2.86h-1.71zm-2.57 2.86h1.72V7.86h-1.72zm0-1.72h1.72V5h-1.72zm5.72 1.72h1.71V7.86h-1.71zm0-1.72h1.71V5h-1.71zM8.57 7.86h1.72V5H8.57zm0 1.72h1.72v1.71H8.57zm5.72 1.71h1.71v-1.71h-1.71zm-2.57 0h1.72v-1.71h-1.72zm-3.43 0H8.57v-1.71h1.72zm-1.72 1.72h1.72v1.71H8.57zm1.72 1.71h1.72v1.72h-1.72zm1.71 1.72h1.72v1.71h-1.72zm1.72-1.72h1.71v1.72h-1.71zm0-1.71h1.71v1.71h-1.71zm1.71-1.72h1.72v1.72h-1.72zm0-1.72h1.72v1.72h-1.72z" />
                        </svg>
                        Pay with Google Pay
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === "QR" && (
                  <div className="text-center space-y-5">
                    <div className="bg-white p-4 rounded-xl border border-[#dfe5e3] inline-block">
                      <img
                        src="/qr-code-placeholder.png"
                        alt="UPI QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-sm text-[#0b3e5e]">
                      Open your UPI app and scan the QR code to complete payment
                    </p>
                    <button
                      type="button"
                      className="text-[#05496c] text-sm hover:underline flex items-center justify-center mx-auto"
                      onClick={() => setPaymentMethod("UPI")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Back to UPI ID
                    </button>
                  </div>
                )}

                {paymentMethod === "Card" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#0b3e5e] mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        required
                        maxLength={19}
                        autocomplete="cc-number"
                        className="w-full p-3 border border-[#dfe5e3] rounded-lg hover:border-[#0b3e5e] transition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#0b3e5e] mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          placeholder="MM/YY"
                          required
                          autocomplete="cc-exp"
                          className="w-full p-3 border border-[#dfe5e3] rounded-lg hover:border-[#0b3e5e] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0b3e5e] mb-1">
                          CVV
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            name="cvv"
                            placeholder="123"
                            required
                            maxLength={4}
                            autocomplete="cc-csc"
                            className="w-full p-3 border border-[#dfe5e3] rounded-lg hover:border-[#0b3e5e] transition"
                          />
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0b3e5e]"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="saveCard"
                        className="h-4 w-4 text-[#05496c] focus:ring-[#05496c] border-[#dfe5e3] rounded mt-1"
                      />
                      <label
                        htmlFor="saveCard"
                        className="ml-2 block text-sm text-[#0b3e5e]"
                      >
                        Save card for future donations (Securely encrypted)
                      </label>
                    </div>
                  </div>
                )}

                {paymentMethod === "Net Banking" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#0b3e5e] mb-1">
                        Select Bank
                      </label>
                      <select
                        required
                        className="w-full p-3 border border-[#dfe5e3] rounded-lg hover:border-[#0b3e5e] transition appearance-none"
                      >
                        <option value="">Choose your bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                    <div className="bg-[#e9f3ef] border-l-4 border-[#ffcf00] p-4 rounded-lg flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-[#ffcf00] mr-2 mt-0.5 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-[#0b3e5e]">
                        You will be redirected to your bank's secure payment
                        page
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-lg font-semibold text-white transition-all hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center ${
                    paymentMethod === "Net Banking"
                      ? "bg-[#ffcf00] hover:bg-[#e6b800]"
                      : paymentMethod === "UPI" || paymentMethod === "QR"
                      ? "bg-[#05496c] hover:bg-[#0b3e5e]"
                      : "bg-[#05496c] hover:bg-[#0b3e5e]"
                  } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "Net Banking"
                        ? "Proceed to Net Banking"
                        : `Pay ₹${getActualAmount()}${
                            isMonthly ? "/month" : ""
                          }`}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Volunteer Modal */}
        {showVolunteerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={() => setShowVolunteerModal(false)}></div>
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-[#0b3e5e]">Join as Volunteer</h3>
                  <p className="text-sm text-[#0b3e5e] opacity-80">We'll contact you with next steps</p>
                </div>
                <button className="text-[#0b3e5e] hover:text-black" onClick={() => setShowVolunteerModal(false)}>✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#0b3e5e] mb-1">Full Name</label>
                  <input disabled value={formData.name} className="w-full p-2.5 border border-[#dfe5e3] rounded-lg bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0b3e5e] mb-1">Phone</label>
                  <input disabled value={formData.phone} className="w-full p-2.5 border border-[#dfe5e3] rounded-lg bg-gray-50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#0b3e5e] mb-1">Email</label>
                  <input disabled value={formData.email} className="w-full p-2.5 border border-[#dfe5e3] rounded-lg bg-gray-50" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0b3e5e] mb-1">Availability</label>
                  <select
                    name="availability"
                    value={volunteerForm.availability}
                    onChange={handleVolunteerInputChange}
                    className="w-full p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition"
                  >
                    <option value="any">Any</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0b3e5e] mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={volunteerForm.skills}
                    onChange={handleVolunteerInputChange}
                    placeholder="E.g. First Aid, Distribution, Teaching"
                    className="w-full p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0b3e5e] mb-1">Message (optional)</label>
                  <textarea
                    name="message"
                    rows={3}
                    value={volunteerForm.message}
                    onChange={handleVolunteerInputChange}
                    placeholder="Tell us why you want to volunteer"
                    className="w-full p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition"
                  />
                </div>
                {volunteerError && (
                  <p className="text-red-600 text-sm">{volunteerError}</p>
                )}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVolunteerModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVolunteerSubmit}
                    disabled={volunteerSubmitting}
                    className={`px-5 py-2 rounded-lg text-white ${volunteerSubmitting ? 'bg-[#0b3e5e] opacity-70' : 'bg-[#0b3e5e] hover:bg-[#05496c]'}`}
                  >
                    {volunteerSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Volunteer Success Modal */}
        {showVolunteerSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
            <div className="bg-white p-6 md:p-8 rounded-xl max-w-md w-full mx-4 text-center shadow-2xl transform transition-all duration-300 scale-100">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0b3e5e] mb-2">
                Volunteer Registration Successful
              </h3>
              <p className="text-[#0b3e5e] mb-5">
                Thanks for joining as a volunteer{campaignId ? ' for this campaign' : ''}! We'll reach out soon with next steps.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowVolunteerSuccess(false)}
                  className="flex-1 py-2.5 bg-[#05496c] text-white rounded-lg font-medium hover:bg-[#0b3e5e] transition"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setShowVolunteerSuccess(false);
                    navigate('/account?tab=volunteer');
                  }}
                  className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition"
                >
                  View Volunteer Activity
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Image - always visible on desktop */}
        <div className="hidden lg:block w-1/2 pl-8">
          <div className="relative h-full">
            <img
              src={hh2}
              alt="Happy children benefiting from donations"
              className="w-full h-full object-cover rounded-3xl border-4 border-white shadow-xl"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8 rounded-b-3xl">
              <h3 className="text-white text-2xl font-bold mb-3">
                {step === 1
                  ? "Your Donation Makes a Difference"
                  : step === 2
                  ? "Help Us Make a Lasting Impact"
                  : "Complete Your Generous Donation"}
              </h3>
              <p className="text-white text-opacity-90 text-base">
                {step === 1
                  ? isMonthly
                    ? "Monthly donations provide consistent support for our sustainable projects"
                    : "One-time donations help us respond to immediate needs and emergencies"
                  : step === 2
                  ? "Your support enables us to continue our mission and help those in need"
                  : "Thank you for choosing to make a difference through your generosity"}
              </p>
              <div className="mt-4 flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-white border-2 border-white"
                    ></div>
                  ))}
                </div>
                <p className="text-white text-opacity-80 text-sm ml-2">
                  Joined by 5,000+ donors
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {submitted && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
            <div className="bg-white p-6 md:p-8 rounded-xl max-w-md w-full mx-4 text-center shadow-2xl transform transition-all duration-300 scale-100">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0b3e5e] mb-2">
                Payment Successful! 🎉
              </h3>
              <p className="text-[#0b3e5e] mb-5">
                Your donation of ₹{getActualAmount()}{" "}
                {isMonthly ? "monthly" : ""} has been processed successfully.
                {campaignId && " Thank you for supporting our campaign!"}
              </p>

              <div className="bg-[#e9f3ef] p-4 rounded-lg text-left mb-6 border border-[#dfe5e3]">
                <h4 className="text-sm font-medium text-[#0b3e5e] mb-3">
                  TRANSACTION DETAILS
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#0b3e5e]">Transaction ID:</span>
                    <span className="font-medium text-[#05496c]">
                      {paymentSummary.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#0b3e5e]">Date:</span>
                    <span className="font-medium text-[#05496c]">
                      {paymentSummary.date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#0b3e5e]">Payment Method:</span>
                    <span className="font-medium text-[#05496c]">
                      {paymentSummary.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#0b3e5e]">Donor Name:</span>
                    <span className="font-medium text-[#05496c]">
                      {paymentSummary.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setStep(1);
                    setSelectedAmount("");
                    setCustomAmount("");
                    setFormData({ name: "", email: "", phone: "" });
                  }}
                  className="flex-1 py-2.5 bg-[#05496c] text-white rounded-lg font-medium hover:bg-[#0b3e5e] transition"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    navigate('/account?tab=activity');
                  }}
                  className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition"
                >
                  View Donation Activity
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-[#dfe5e3] text-[#0b3e5e] rounded-lg font-medium hover:bg-[#e9f3ef] transition flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Required Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-7">
              <div className="mb-4">
                <h3 className="text-xl md:text-2xl font-bold text-[#0b3e5e]">Login required</h3>
                <p className="text-sm text-[#0b3e5e] opacity-80 mt-1">
                  {authContext === 'volunteer'
                    ? 'You need to login first to take part as a volunteer.'
                    : 'You need to login first to give a donation.'}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const redirect = encodeURIComponent(location.pathname + location.search);
                    navigate(`/login?redirect=${redirect}`);
                  }}
                  className="px-5 py-2 rounded-lg text-white bg-[#0b3e5e] hover:bg-[#05496c]"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationPage;
