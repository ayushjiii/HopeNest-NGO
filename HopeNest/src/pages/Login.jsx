import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

// Simple Google and Facebook icons
const GoogleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// Simple eye icons as fallback
const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeSlashIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M18.036 5.964L9.878 9.878M21.542 12c-1.274 4.057-5.064 7-9.542 7-.906 0-1.79-.131-2.625-.375" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
  </svg>
);

// Password strength validation
const validatePasswordStrength = (password) => {
  try {
    if (!password) {
      return { score: 0, isValid: false, feedback: {} };
    }
    
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    return {
      score,
      isValid: score >= 3 && minLength,
      feedback: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  } catch (error) {
    console.error("Password validation error:", error);
    return { score: 0, isValid: false, feedback: {} };
  }
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Name validation
const validateName = (name) => {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
};

export default function Login() {
  // State variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // New state for improved UX
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, isValid: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle OAuth errors only (success handled by Home page)
  useEffect(() => {
    const error = searchParams.get('error');
    
    if (error) {
      // Handle OAuth errors
      const errorMessages = {
        oauth_failed: 'OAuth authentication failed. Please try again.',
        token_generation_failed: 'Failed to generate access token. Please try again.',
      };
      setError(errorMessages[error] || 'Authentication failed. Please try again.');
    }
  }, [searchParams]);

  // Real-time validation effects
  useEffect(() => {
    if (!isLogin && password) {
      try {
        console.log("Validating password strength for:", password);
        // Simplified validation for testing
        const strength = {
          score: Math.min(5, password.length),
          isValid: password.length >= 8,
          feedback: {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
          }
        };
        console.log("Password strength result:", strength);
        setPasswordStrength(strength);
      } catch (error) {
        console.error("Password strength validation error:", error);
      }
    }
  }, [password, isLogin]);

  // Validate fields on blur
  const validateField = (fieldName, value) => {
    try {
      console.log(`Validating field ${fieldName} with value:`, value);
      const errors = { ...fieldErrors };
      
      switch (fieldName) {
        case 'email':
          if (!validateEmail(value)) {
            errors.email = 'Please enter a valid email address';
          } else {
            delete errors.email;
          }
          break;
        case 'name':
          if (!isLogin && !validateName(value)) {
            errors.name = 'Name must be at least 2 characters and contain only letters';
          } else {
            delete errors.name;
          }
          break;
        case 'password':
          if (!isLogin && !validatePasswordStrength(value).isValid) {
            errors.password = 'Password must be at least 8 characters with mix of letters, numbers, and symbols';
          } else if (isLogin && value.length < 1) {
            errors.password = 'Password is required';
          } else {
            delete errors.password;
          }
          break;
        case 'confirmPassword':
          if (!isLogin && value !== password) {
            errors.confirmPassword = 'Passwords do not match';
          } else {
            delete errors.confirmPassword;
          }
          break;
      }
      
      console.log("Field errors after validation:", errors);
      setFieldErrors(errors);
    } catch (error) {
      console.error("Field validation error:", error);
    }
  };

  const handleFieldBlur = (fieldName, value) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, value);
  };

  // OAuth login handlers
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/test-google';
  };

  const handleFacebookLogin = () => {
    window.location.href = 'http://localhost:5000/test-facebook';
  };

  // Handle form submission with enhanced validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Validate all fields before submission
      const errors = {};
      
      if (!validateEmail(email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (!isLogin && !validateName(name)) {
        errors.name = 'Name must be at least 2 characters and contain only letters';
      }
      
      if (!isLogin && !validatePasswordStrength(password).isValid) {
        errors.password = 'Password must meet strength requirements';
      }
      
      if (!isLogin && password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setTouchedFields({ email: true, name: true, password: true, confirmPassword: true });
        setError('Please fix the errors below');
        setIsLoading(false);
        return;
      }

      if (showResetForm && resetToken) {
        // Handle password reset
        if (!validatePasswordStrength(newPassword).isValid) {
          setError('New password must meet strength requirements');
          setIsLoading(false);
          return;
        }
        
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: resetEmail,
            token: resetToken,
            newPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to reset password");
        }

        setSuccess("Password reset successfully! You can now login.");
        setShowResetForm(false);
        setResetToken("");
        setNewPassword("");
        return;
      }

      // Handle login/signup
      const result = isLogin
        ? await login(email, password)
        : await signup(name, email, password);

      if (result?.success) {
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        
        const redirect = searchParams.get("redirect");
        navigate(redirect || "/");
      } else {
        setError(result?.message || "Authentication failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Reset form when switching between login/signup
  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setSuccess("");
    setFieldErrors({});
    setTouchedFields({});
    setPassword("");
    setConfirmPassword("");
    if (!isLogin) {
      setName("");
    }
  };

  // Password strength indicator component
  const PasswordStrengthIndicator = ({ strength }) => {
    try {
      if (!password) return null;
      
      const getStrengthColor = (score) => {
        if (score < 2) return 'bg-red-500';
        if (score < 4) return 'bg-yellow-500';
        return 'bg-green-500';
      };
      
      const getStrengthText = (score) => {
        if (score < 2) return 'Weak';
        if (score < 4) return 'Medium';
        return 'Strong';
      };
      
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Password strength:</span>
            <span className={`font-medium ${
              strength.score < 2 ? 'text-red-600' :
              strength.score < 4 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {getStrengthText(strength.score)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getStrengthColor(strength.score)
              }`}
              style={{ width: `${(strength.score / 5) * 100}%` }}
            ></div>
          </div>
          {strength.score < 3 && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Password should have:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li className={strength.feedback?.minLength ? 'text-green-600' : 'text-red-600'}>
                  At least 8 characters
                </li>
                <li className={strength.feedback?.hasUpperCase ? 'text-green-600' : 'text-red-600'}>
                  One uppercase letter
                </li>
                <li className={strength.feedback?.hasLowerCase ? 'text-green-600' : 'text-red-600'}>
                  One lowercase letter
                </li>
                <li className={strength.feedback?.hasNumbers ? 'text-green-600' : 'text-red-600'}>
                  One number
                </li>
                <li className={strength.feedback?.hasSpecialChar ? 'text-green-600' : 'text-red-600'}>
                  One special character
                </li>
              </ul>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error in PasswordStrengthIndicator:", error);
      return null; // Return null instead of crashing the app
    }
  };
  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset instructions");
      }

      setSuccess(
        `Reset token has been sent to ${resetEmail}. Check your email and enter the token below.`
      );

      // In development, show the token for testing
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setSuccess((prev) => `${prev} Token: ${data.resetToken}`);
      }
    } catch (err) {
      setError(err.message || "Failed to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render function
  return (
    <div className="min-h-screen flex md:mx-[115px] rounded-[12px]">
      {/* Left Column - Image */}
      <div className="hidden lg:block w-full lg:w-1/2 p-8 md:p-12 lg:p-20 flex items-center justify-center">
        <img
          src="/eje.png" onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600.png?text=Login+Image'; }}
          alt="Login illustration"
          className="w-full h-full object-cover rounded-[12px]"
        />
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-20 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          {showResetForm ? (
            <>
              <div className="text-center">
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  Reset Your Password
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {!success
                    ? "Enter your email to get a reset token"
                    : "Enter the token and new password"}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <form
                className="mt-8 space-y-6"
                onSubmit={success ? handleSubmit : handleRequestReset}
              >
                <div className="rounded-md space-y-4">
                  <div>
                    <label
                      htmlFor="resetEmail"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email address
                    </label>
                    <input
                      id="resetEmail"
                      name="resetEmail"
                      type="email"
                      required
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="your@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={!!success}
                    />
                  </div>

                  {success && (
                    <>
                      <div>
                        <label
                          htmlFor="resetToken"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Reset Token
                        </label>
                        <input
                          id="resetToken"
                          name="resetToken"
                          type="text"
                          required
                          className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter token from email"
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          required
                          className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Create a new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                      isLoading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
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
                        {success ? "Resetting..." : "Sending..."}
                      </>
                    ) : success ? (
                      "Reset Password"
                    ) : (
                      "Get Reset Token"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetForm(false);
                      setError("");
                      setSuccess("");
                      setResetToken("");
                      setResetEmail("");
                    }}
                    className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to {isLogin ? "Login" : "Signup"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="text-center">
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  {isLogin ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {isLogin
                    ? "Sign in to continue"
                    : "Get started with your account"}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md space-y-4">
                  {!isLogin && (
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Full Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                          touchedFields.name && fieldErrors.name
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500'
                        }`}
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (touchedFields.name) {
                            validateField('name', e.target.value);
                          }
                        }}
                        onBlur={(e) => handleFieldBlur('name', e.target.value)}
                      />
                      {touchedFields.name && fieldErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                        touchedFields.email && fieldErrors.email
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:border-indigo-500'
                      }`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touchedFields.email) {
                          validateField('email', e.target.value);
                        }
                      }}
                      onBlur={(e) => handleFieldBlur('email', e.target.value)}
                    />
                    {touchedFields.email && fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={
                          isLogin ? "current-password" : "new-password"
                        }
                        required
                        className={`appearance-none block w-full px-4 py-3 pr-12 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                          touchedFields.password && fieldErrors.password
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:border-indigo-500'
                        }`}
                        placeholder={
                          isLogin ? "Enter your password" : "Create a password"
                        }
                        value={password}
                        onChange={(e) => {
                          try {
                            console.log("Password input changed to:", e.target.value);
                            setPassword(e.target.value);
                            if (touchedFields.password) {
                              validateField('password', e.target.value);
                            }
                          } catch (error) {
                            console.error("Password input error:", error);
                          }
                        }}
                        onBlur={(e) => handleFieldBlur('password', e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {touchedFields.password && fieldErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                    )}
                    {!isLogin && <PasswordStrengthIndicator strength={passwordStrength} />}
                  </div>

                  {!isLogin && (
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          className={`appearance-none block w-full px-4 py-3 pr-12 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                            touchedFields.confirmPassword && fieldErrors.confirmPassword
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-300 focus:border-indigo-500'
                          }`}
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => {
                            try {
                              setConfirmPassword(e.target.value);
                              if (touchedFields.confirmPassword) {
                                validateField('confirmPassword', e.target.value);
                              }
                            } catch (error) {
                              console.error("Confirm password input error:", error);
                            }
                          }}
                          onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {touchedFields.confirmPassword && fieldErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                  )}
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                        Remember me
                      </label>
                    </div>
                    <div className="text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetForm(true);
                          setResetEmail(email);
                          setError("");
                          setSuccess("");
                        }}
                        className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                      isLoading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
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
                    ) : isLogin ? (
                      "Sign in"
                    ) : (
                      "Sign up"
                    )}
                  </button>
                </div>

                {/* OAuth Buttons */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {/* Google Login Button */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <GoogleIcon className="h-5 w-5" />
                      <span className="ml-2">Google</span>
                    </button>

                    {/* Facebook Login Button */}
                    <button
                      type="button"
                      onClick={handleFacebookLogin}
                      disabled={isLoading}
                      className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FacebookIcon className="h-5 w-5" />
                      <span className="ml-2">Facebook</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="text-center text-sm text-gray-600">
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  {isLogin
                    ? "New here? Create an account"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
