import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

function Meteor({ left, duration }) {
  return (
    <div
      className="meteor-streak"
      style={{
        left: `${left}px`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

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
  const [meteors, setMeteors] = useState([]);

  // Create bubbles
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
      bubble.style.setProperty("--drift", `${drift}px`);

      const opacity = Math.random() * 0.3 + 0.1;
      bubble.style.opacity = opacity;

      document.querySelector(".bubble-container")?.appendChild(bubble);

      setTimeout(() => bubble.remove(), duration * 1000);
    };

    const bubbleInterval = setInterval(createBubble, 500);
    for (let i = 0; i < 15; i++) createBubble();

    return () => {
      clearInterval(bubbleInterval);
    };
  }, []);

  // Create meteors using React state
  useEffect(() => {
    let active = true;

    const addMeteor = () => {
      if (!active) return;
      const left = Math.random() * (window.innerWidth - 90);
      const duration = Math.random() * 2 + 1.8;
      const id = Math.random() + Date.now();
      setMeteors((m) => [...m, { left, duration, id }]);
      setTimeout(() => {
        setMeteors((m) => m.filter((meteor) => meteor.id !== id));
      }, duration * 1000);
    };

    const interval = setInterval(addMeteor, Math.random() * 1000 + 1800);
    for (let i = 0; i < 3; i++) addMeteor();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) return setError("Username is required");
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    try {
      await signup(email, password, username);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gray-100 overflow-hidden">
      {/* Background Animation Container */}
      <div className="bubble-container absolute inset-0 pointer-events-none z-0">
        {meteors.map((meteor) => (
          <Meteor key={meteor.id} left={meteor.left} duration={meteor.duration} />
        ))}
      </div>

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@200;300;400;600;700&display=swap');

        /* BUBBLE CONTAINER */
        .bubble-container {
          position: absolute;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          z-index: 1;
          pointer-events: none;
        }

        /* BUBBLES */
        .bubble {
          position: absolute;
          bottom: -100px;
          border-radius: 50%;
          background: rgba(221, 246, 255, 0.65);
          box-shadow: 0 0 20px 6px rgba(173, 229, 255, 0.18);
          pointer-events: none;
          animation: rise linear forwards;
          opacity: 0.3;
        }
        @keyframes rise {
          to {
            transform: translateY(-120vh) translateX(var(--drift));
            opacity: 0.2;
          }
        }

        /* METEOR SHOOTING STAR */
        .meteor-streak {
          position: absolute;
          top: -100px;
          width: 2px;
          height: 90px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.8),
            rgba(255, 255, 255, 0)
          );
          transform: rotate(45deg);
          animation: meteor-fall linear forwards;
          pointer-events: none;
          z-index: 2;
        }
        @keyframes meteor-fall {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0) rotate(45deg);
          }
          10% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translateY(120vh) translateX(-60vh) rotate(45deg);
          }
        }

        /* LOGO TEXT */
        .logo-text {
          background: linear-gradient(135deg, #0d0d0d, #191919, #262626);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: 'Raleway';
        }
      `}</style>

      {/* Signup Card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transition hover:shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="logo-text text-4xl font-semibold leading-tight">
            Dynamic CSV
          </h1>
          <h1 className="logo-text text-4xl font-semibold leading-tight">
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

        {/* Username */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Username
          </label>
          <input
            type="text"
            autoComplete="username"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-gray-600 outline-none"
            placeholder="Choose your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Email Address
          </label>
          <input
            type="email"
            autoComplete="email"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-gray-600 outline-none"
            placeholder="abc@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-4 relative">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-gray-600 outline-none"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-10 text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="mb-6 relative">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Confirm Password
          </label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-gray-600 outline-none"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-10 text-gray-600"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        <button className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition active:scale-95">
          Create Account
        </button>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-black font-bold underline">
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center text-xs">
          <p>
            By signing up, you agree to our{" "}
            <Link className="text-black underline" to="/terms">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="text-black underline" to="/privacy">
              Privacy Policy
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
