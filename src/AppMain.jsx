import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import App from "./App"; // your CSV processor main app
import SignOut from "./components/SignOut";

// PrivateRoute component
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// PublicRoute component (redirect logged-in users to main app)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return !user ? children : <Navigate to="/" replace />;
}

function AppMain() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes - only accessible when logged out */}
        {!user && (
          <>
            <Route
              path="/login"
              element={<Login />}
            />
            <Route
              path="/signup"
              element={<Signup />}
            />
          </>
        )}

        {/* Protected main app - only accessible when logged in */}
        {user && (
          <>
            <Route
              path="/"
              element={<App />}
            />
            <Route
              path="/signout"
              element={<SignOut />}
            />
          </>
        )}

        {/* Redirect based on auth state */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default AppMain;
