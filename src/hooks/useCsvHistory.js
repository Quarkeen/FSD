import { useAuth } from '../context/AuthContext';

const BACKEND_URL = 'http://localhost:5000';

export const useCsvHistory = () => {
  const { user } = useAuth();

  const saveCsvToHistory = async (fileName, fileSize) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/csv-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileSize: fileSize || 0,
          downloadedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error('Failed to save CSV to history');
      }
    } catch (error) {
      console.error('Error saving CSV history:', error);
    }
  };

  return { saveCsvToHistory };
};
