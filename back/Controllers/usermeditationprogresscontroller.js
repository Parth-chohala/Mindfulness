const { ObjectId } = require('mongodb');
const connectToDB = require('../db');

// Create a new user meditation progress
exports.createUserMeditationProgress = async (req, res) => {
  try {
    const { userId, sessionId, completionDate, duration } = req.body;
    
    console.log('Creating user meditation progress:', { userId, sessionId, completionDate, duration });

    const db = await connectToDB();
    const collection = db.collection('userMeditationProgress');
    
    // Check if this session is already completed by this user
    const existingProgress = await collection.findOne({
      userId: userId,
      sessionId: sessionId
    });

    if (existingProgress) {
      console.log('Session already completed by user');
      return res.status(400).json({ message: 'Session already completed by this user' });
    }

    // Create new progress record
    const newProgress = {
      userId: userId,
      sessionId: sessionId,
      completionDate: completionDate ? new Date(completionDate) : new Date(),
      duration: duration || 300, // Default to 5 minutes if not provided
      createdAt: new Date()
    };

    const result = await collection.insertOne(newProgress);
    console.log('Saved progress:', result);
    
    res.status(201).json({ ...newProgress, _id: result.insertedId });
  } catch (error) {
    console.error('Error creating user meditation progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all user meditation progress for a user
exports.getUserMeditationProgress = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Getting meditation progress for user:', userId);
    
    const db = await connectToDB();
    const collection = db.collection('userMeditationProgress');
    
    const progress = await collection.find({ userId: userId }).toArray();
    console.log('Found progress records:', progress.length);
    
    res.status(200).json(progress);
  } catch (error) {
    console.error('Error getting user meditation progress:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete user meditation progress by ID
exports.deleteUserMeditationProgress = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('Deleting meditation progress with ID:', id);
    
    const db = await connectToDB();
    const collection = db.collection('userMeditationProgress');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Meditation progress not found" });
    }

    res.status(200).json({ message: "Meditation progress deleted successfully" });
  } catch (error) {
    console.error('Error deleting user meditation progress:', error);
    res.status(500).json({ error: error.message });
  }
};
