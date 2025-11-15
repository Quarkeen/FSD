import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [csvHistory, setCsvHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const BACKEND_URL = 'http://localhost:5000';

  // Fetch user profile
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchCsvHistory();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setError(null); // Clear previous errors
      const token = await user.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        console.error('Backend response error:', response.status);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchCsvHistory = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const token = await user.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/csv-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCsvHistory(data);
      } else {
        console.error('Backend response error:', response.status);
        setError('Backend is not running. Start it with: cd backend && npm start');
      }
    } catch (err) {
      console.error('Error fetching CSV history:', err);
      setError('Backend is not running. Start it with: cd backend && npm start');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to logout');
    }
  };

  const deleteCsvFromHistory = async (id) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/csv-history/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setCsvHistory(csvHistory.filter(csv => csv.id !== id));
      }
    } catch (err) {
      console.error('Error deleting CSV:', err);
      setError('Failed to delete CSV');
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all CSV history?')) {
      return;
    }
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/csv-history`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setCsvHistory([]);
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Failed to clear history');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.displayName || userProfile?.displayName || user?.email?.split('@')[0] || 'User';
  const userInitials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg"
        title={user?.email}
      >
        {userInitials}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-r from-purple-500 to-indigo-600 text-white font-semibold">
                {userInitials}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{displayName}</h3>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* CSV History Section */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Downloaded CSVs</h4>
                {csvHistory.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-red-600 hover:text-red-700 font-medium transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {loading ? (
                <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
              ) : csvHistory.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No downloads yet</p>
              ) : (
                <div className="space-y-2">
                  {csvHistory.map(csv => (
                    <div
                      key={csv.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {csv.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(csv.downloadedAt?.toDate?.() || csv.downloadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteCsvFromHistory(csv.id)}
                        className="ml-2 text-xs text-red-600 hover:text-red-700 font-medium transition"
                        title="Remove from history"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-6 py-2 bg-red-50 border-b border-red-200">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Footer with Logout Button */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-linear-to-r from-red-500 to-rose-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-rose-700 transition transform active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
