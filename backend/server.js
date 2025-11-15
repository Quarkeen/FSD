import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, auth } from './firebaseAdmin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Verify Firebase Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    req.userDisplayName = decodedToken.name || decodedToken.email.split('@')[0]; // Get displayName from token
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Get user profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();
    
    if (!userDoc.exists) {
      // Create new user profile if doesn't exist, using displayName from Firebase token
      const newUser = {
        email: req.userEmail,
        displayName: req.userDisplayName, // Use displayName from Firebase token
        createdAt: new Date(),
      };
      await db.collection('users').doc(req.userId).set(newUser);
      return res.json(newUser);
    }
    
    res.json(userDoc.data());
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
app.put('/api/profile', verifyToken, async (req, res) => {
  try {
    const { displayName } = req.body;
    
    await db.collection('users').doc(req.userId).update({
      displayName: displayName || req.userEmail.split('@')[0],
      updatedAt: new Date(),
    });
    
    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Save CSV to history
app.post('/api/csv-history', verifyToken, async (req, res) => {
  try {
    const { fileName, fileData, fileSize, downloadedAt } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const csvEntry = {
      fileName,
      fileSize: fileSize || 0,
      downloadedAt: downloadedAt || new Date(),
      userId: req.userId,
    };

    const docRef = await db
      .collection('users')
      .doc(req.userId)
      .collection('csvHistory')
      .add(csvEntry);

    res.json({ 
      success: true, 
      id: docRef.id, 
      message: 'CSV saved to history' 
    });
  } catch (error) {
    console.error('Error saving CSV history:', error);
    res.status(500).json({ error: 'Failed to save CSV history' });
  }
});

// Get user's CSV history
app.get('/api/csv-history', verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection('users')
      .doc(req.userId)
      .collection('csvHistory')
      .orderBy('downloadedAt', 'desc')
      .limit(50)
      .get();

    const csvHistory = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(csvHistory);
  } catch (error) {
    console.error('Error fetching CSV history:', error);
    res.status(500).json({ error: 'Failed to fetch CSV history' });
  }
});

// Delete CSV from history
app.delete('/api/csv-history/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db
      .collection('users')
      .doc(req.userId)
      .collection('csvHistory')
      .doc(id)
      .delete();

    res.json({ success: true, message: 'CSV removed from history' });
  } catch (error) {
    console.error('Error deleting CSV history:', error);
    res.status(500).json({ error: 'Failed to delete CSV history' });
  }
});

// Clear all CSV history
app.delete('/api/csv-history', verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection('users')
      .doc(req.userId)
      .collection('csvHistory')
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ success: true, message: 'All CSV history cleared' });
  } catch (error) {
    console.error('Error clearing CSV history:', error);
    res.status(500).json({ error: 'Failed to clear CSV history' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 CSV Processor Backend is ready`);
});
