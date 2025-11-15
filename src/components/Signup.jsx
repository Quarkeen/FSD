import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  // Create bubbles on component mount
  useEffect(() => {
    const createBubble = () => {
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      
      const size = Math.random() * 80 + 20;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      
      const startPosition = Math.random() * 100;
      bubble.style.left = `${startPosition}%`;
      
      const duration = Math.random() * 12 + 8;
      bubble.style.animationDuration = `${duration}s`;
      
      const drift = (Math.random() - 0.5) * 100;
      bubble.style.setProperty('--drift', `${drift}px`);
      
      const opacity = Math.random() * 0.5 + 0.3;
      bubble.style.opacity = opacity;
      
      document.querySelector('.bubble-container')?.appendChild(bubble);
      
      setTimeout(() => {
        bubble.remove();
      }, duration * 1000);
    };

    const intervalId = setInterval(() => {
      createBubble();
    }, 500);

    for (let i = 0; i < 15; i++) {
      createBubble();
    }

    return () => clearInterval(intervalId);
  }, []);

  // Password strength evaluator
  const evaluatePasswordStrength = (password) => {
    if (!password) return '';
    
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return 'Weak';
    if (score === 3 || score === 4) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username) {
      return setError("Username is required");
    }

    if (username.length < 3) {
      return setError("Username must be at least 3 characters");
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return setError("Username can only contain letters, numbers, and underscores");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    setLoading(true);

    try {
      await signup(email, password, username);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 'Weak') return 'text-red-500';
    if (passwordStrength === 'Medium') return 'text-orange-400';
    return 'text-green-500';
  };

  const getStrengthBarColor = () => {
    if (passwordStrength === 'Weak') return 'bg-red-500';
    if (passwordStrength === 'Medium') return 'bg-orange-400';
    return 'bg-green-500';
  };

  const getStrengthWidth = () => {
    if (passwordStrength === 'Weak') return 'w-1/3';
    if (passwordStrength === 'Medium') return 'w-2/3';
    return 'w-full';
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
      {/* Bubble container */}
      <div className="bubble-container absolute inset-0 pointer-events-none"></div>
      
      {/* Add Google Font and styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        .bubble {
          position: absolute;
          bottom: -150px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.6), rgba(118, 75, 162, 0.5), rgba(240, 147, 251, 0.5));
          border-radius: 50%;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(102, 126, 234, 0.7);
          animation: float linear infinite;
          box-shadow: 
            inset 0 0 30px rgba(102, 126, 234, 0.5),
            0 0 40px rgba(118, 75, 162, 0.4),
            0 0 50px rgba(240, 147, 251, 0.3),
            0 0 60px rgba(102, 126, 234, 0.2);
        }
        
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(var(--drift)) rotate(360deg);
            opacity: 0;
          }
        }

        .simple-logo {
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 26px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
          text-align: center;
          margin-bottom: 8px;
        }
      `}</style>

      {/* Signup form */}
      <form 
        onSubmit={handleSubmit}
        noValidate
        className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition duration-300 hover:shadow-3xl border border-gray-100"
      >
        {/* Simple Logo */}
        <h1 className="simple-logo">
          Dynamic CSV Processor
        </h1>
        
        <p className="text-center text-gray-600 mb-6 text-sm">
          Create your account to get started
        </p>
        
        {error && (
          <div 
            role="alert"
            aria-live="assertive"
            className="bg-gray-100 border border-gray-400 text-gray-900 px-4 py-3 rounded-lg mb-4 text-sm font-medium"
          >
            {error}
          </div>
        )}

        <div className="mb-4">
          <label 
            htmlFor="username-input"
            className="block text-gray-900 text-sm font-semibold mb-2"
          >
            Username
          </label>
          <input
            id="username-input"
            type="text"
            placeholder="Choose a unique username"
            autoComplete="username"
            aria-required="true"
            aria-describedby="username-hint"
            className="w-full border-2 border-gray-300 bg-white text-gray-900 p-3 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-300 transition placeholder-gray-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div id="username-hint" className="text-xs text-gray-600 mt-1">
            At least 3 characters, letters, numbers, and underscores only
          </div>
        </div>

        <div className="mb-4">
          <label 
            htmlFor="email-input"
            className="block text-gray-900 text-sm font-semibold mb-2"
          >
            Email Address
          </label>
          <input
            id="email-input"
            type="email"
            placeholder="abc@gmail.com"
            autoComplete="email"
            aria-required="true"
            className="w-full border-2 border-gray-300 bg-white text-gray-900 p-3 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-300 transition placeholder-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4 relative">
          <label 
            htmlFor="password-input"
            className="block text-gray-900 text-sm font-semibold mb-2"
          >
            Password
          </label>
          <input
            id="password-input"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            autoComplete="new-password"
            aria-required="true"
            aria-describedby="password-hint"
            className="w-full border-2 border-gray-300 bg-white text-gray-900 p-3 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-300 transition placeholder-gray-500"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordStrength(evaluatePasswordStrength(e.target.value));
            }}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-10 text-gray-600 hover:text-gray-900 focus:outline-none transition"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
          
          {/* Password hint */}
          <div id="password-hint" className="text-xs text-gray-600 mt-1">
            Password must be at least 8 characters long
          </div>

          {/* Password strength indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-semibold ${getStrengthColor()}`}>
                  Password strength: {passwordStrength}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthBarColor()} ${getStrengthWidth()}`}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 relative">
          <label 
            htmlFor="confirm-password-input"
            className="block text-gray-900 text-sm font-semibold mb-2"
          >
            Confirm Password
          </label>
          <input
            id="confirm-password-input"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            aria-required="true"
            className="w-full border-2 border-gray-300 bg-white text-gray-900 p-3 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-300 transition placeholder-gray-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-10 text-gray-600 hover:text-gray-900 focus:outline-none transition"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-gray-800 to-black text-white py-3 rounded-lg font-semibold hover:from-gray-900 hover:to-gray-800 transform transition duration-200 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-gray-900 font-semibold hover:text-gray-700 hover:underline transition"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Terms */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            By signing up, you agree to our{" "}
            <Link 
              to="/terms" 
              className="text-gray-800 hover:text-gray-600 hover:underline transition font-semibold"
            >
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link 
              to="/privacy" 
              className="text-gray-800 hover:text-gray-600 hover:underline transition font-semibold"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
