import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 overflow-hidden">
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
            0 0 20px rgba(100, 150, 255, 0.2);
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

      {/* Login form */}
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
          Sign in to continue to your account
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="abc@gmail.com"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6 relative">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
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

        <button className="w-full bg-linear-to-r from-purple-600 via-violet-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 transform transition duration-200 active:scale-95 shadow-lg">
          Sign In
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link 
              to="/signup" 
              className="text-purple-600 font-semibold hover:text-purple-800 hover:underline transition"
            >
              Create Account
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link 
            to="/forgot-password" 
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      </form>
    </div>
  );
}
