const { ObjectId } = require('mongodb');
const connectToDB = require('../db');

// Create a new meditation session entry
exports.createMeditationSession = async (req, res) => {
  try {
    const { title, description, type, url } = req.body;

    if (!title || !type || !url) {
      return res.status(400).json({ message: 'Title, type, and URL are required.' });
    }

    const db = await connectToDB();
    const newSession = { title, description, type, url };

    const result = await db.collection('meditationsessions').insertOne(newSession);
    res.status(201).json({ insertedId: result.insertedId, ...newSession });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all meditation sessions
exports.getMeditationSessions = async (req, res) => {
  try {
    const db = await connectToDB();
    const sessions = await db.collection('meditationsessions').find().toArray();
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a meditation session by ID
exports.getMeditationSessionById = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const session = await db.collection('meditationsessions').findOne({ _id: id });
    if (!session) {
      return res.status(404).json({ message: 'Meditation session not found' });
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Update a meditation session by ID
exports.updateMeditationSession = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const updateFields = req.body;

    const result = await db.collection('meditationsessions').findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { returnOriginal: false }
    );

    if (!result) {
      return res.status(404).json({ message: 'Meditation session not found' });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
