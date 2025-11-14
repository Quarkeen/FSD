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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      
      const opacity = Math.random() * 0.3 + 0.1;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      return setError("Username is required");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    try {
      await signup(email, password, username);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-linear-to-br from-green-50 to-teal-100 overflow-hidden">
      {/* Bubble container */}
      <div className="bubble-container absolute inset-0 pointer-events-none"></div>
      
      {/* Add Google Font and styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        
        .bubble {
          position: absolute;
          bottom: -150px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
          border-radius: 50%;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          animation: float linear infinite;
          box-shadow: 
            inset 0 0 20px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(100, 255, 150, 0.2);
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

        .logo-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'Dancing Script', cursive;
          font-weight: 700;
          font-size: 3.75rem;
          letter-spacing: 0.03em;
        }
      `}</style>

      {/* Signup form */}
      <form 
        onSubmit={handleSubmit} 
        className="relative z-10 bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition duration-300 hover:shadow-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="logo-text" style={{ lineHeight: '1.2', marginBottom: '0px' }}>
            Dynamic CSV
          </h1>
          <h1 className="logo-text" style={{ lineHeight: '1.2' }}>
            Processor
          </h1>
        </div>
        
        <p className="text-center text-gray-600 mb-6 text-sm">
          Create your account to get started
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Username
          </label>
          <input
            type="text"
            placeholder="Choose your username"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="abc@gmail.com"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4 relative">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        <div className="mb-6 relative">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Confirm Password
          </label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        <button className="w-full bg-linear-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transform transition duration-200 active:scale-95 shadow-lg">
          Create Account
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-green-600 font-semibold hover:text-green-800 hover:underline transition"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Terms*/}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            By signing up, you agree to our{" "}
            <Link 
              to="/terms" 
              className="text-gray-700 hover:text-green-600 hover:underline transition font-semibold"
            >
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link 
              to="/privacy" 
              className="text-gray-700 hover:text-green-600 hover:underline transition font-semibold"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
