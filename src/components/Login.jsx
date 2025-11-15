import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import GoogleSvg from "../assets/google.svg";
import Img1 from "../assets/image.png";
import Img2 from "../assets/image2.png";
import Img3 from "../assets/image3.png";


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const slides = [
    { image: Img1, caption: "Process CSV Files Effortlessly" },
    { image: Img2, caption: "Analyze Data with Precision" },
    { image: Img3, caption: "Automate Workflows Easily" },
  ];

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (isPaused) return;

    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(id);
  }, [isPaused]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;

    if (diff > 50) {
      setCurrent((prev) => (prev + 1) % slides.length);
    } else if (diff < -50) {
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

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
    <div className="flex min-h-screen relative overflow-hidden bg-gray-50">

      {/* LEFT SLIDER SECTION */}
      <div
        className="w-2/3 relative hidden md:flex overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        ref={sliderRef}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out
             ${index === current ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}
            `}
          >
            <img src={slide.image} className="w-full h-full object-cover" alt="" />

            {index === current && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-30 -mt-60 pointer-events-auto">
                <h2 className=  "Bebas Neue text-white  text-8xl font-normal px-20 py-7">
                  {slide.caption}
                </h2>
              </div>
            )}

          </div>
        ))}
        
          <Link
            to="/signup"
            className=" mt-150 absolute left-1/2 top-150px -translate-x-1/2
            z-30
            flex justify-center
            bg-white/5 backdrop-blur-md 
            px-10 py-5
            text-white font-bold text-lg 
            rounded-xl border border-white/30 shadow-lg
            hover:scale-105 hover:bg-black hover:text-white
            hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]
            transition-all duration-300"
          >
            GET STARTED
          </Link>

        {/* DOTS */}
        <div className="absolute bottom-6 w-full flex justify-center z-30 pointer-events-auto">
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${current === index 
                    ? "bg-white scale-125 shadow-[0_0_6px_rgba(255,255,255,0.7)]" 
                    : "bg-white/40 hover:bg-white/70"}
                `}
              />
            ))}
          </div>
        </div>

        {/* THUMBNAILS */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-4 z-30 pointer-events-auto">
          {slides.map((slide, index) => (
            <img
              key={index}
              src={slide.image}
              onClick={() => setCurrent(index)}
              className={`w-20 h-14 object-cover rounded-xl border-2 cursor-pointer 
                transition-all duration-300
                ${current === index ? "border-white scale-105" : "border-transparent opacity-70"}
              `}
            />
          ))}
        </div>

        {/* FIX: overlay no longer blocks clicks */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      </div>

      {/* RIGHT LOGIN */}
      <div className="w-full md:w-1/3 flex justify-center items-center p-6 relative">

        <form
          onSubmit={handleSubmit}
          className="relative z-10 bg-white/70 backdrop-blur-xl p-10 shadow-2xl w-full max-w-md text-black"
        >
          <h1 className="text-4xl font-bold text-gray-200">
            <span className="block text-black">Hello</span>
            <span className="block text-black">Welcome Back</span>
          </h1>

          <p className="flex items-center justify-center text-black">
            Please enter your details
          </p>

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-black font-semibold mb-2">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="abc@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-6 relative">
            <label className="block text-black font-semibold mb-2">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border border-gray-300 p-3 rounded-xl text-black"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-11 text-black"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          <button className="w-full py-3 rounded-xl bg-black text-white font-semibold">
            Sign In
          </button>

          <div className="login-center-buttons flex items-center justify-center my-4">
         
            <button className="flex items-center justify-center p-5" type="button">
                 <span> or </span>
              <img className="px-4" src={GoogleSvg} alt="" />Log In with Google
            </button>
          </div>

          <div className="text-center mt-4 text-sm text-black">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-black underline">
              Create Account
            </Link>
          </div>

          <div className="text-center mt-2">
            <Link to="/forgot-password" className="text-black text-sm underline">
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
