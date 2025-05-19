const { ObjectId } = require('mongodb');
const connectToDB = require('../db');

// Create a new productivity status entry
exports.createProductivityStatus = async (req, res) => {
  try {
    const {
      userId,
      date,
      completedTasks,
      focusMinutes,
      meditationMinutes,
      breaksTaken,
    } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ message: 'userId and date are required.' });
    }

    const db = await connectToDB();

    const newStatus = {
      userId: new ObjectId(userId),
      date: new Date(date),
      completedTasks,
      focusMinutes,
      meditationMinutes,
      breaksTaken,
    };

    const result = await db.collection('productivitystatus').insertOne(newStatus);

    res.status(201).json({ insertedId: result.insertedId, ...newStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all productivity statuses
exports.getProductivityStatuses = async (req, res) => {
  const id = new ObjectId(req.params.id);
  try {
    const db = await connectToDB();
    const statuses = await db.collection('productivitystatus').find({userId : id}).toArray();
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update productivity status by ID
exports.updateProductivityStatus = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const result = await db.collection('productivitystatus').findOneAndUpdate(
      { _id: id },
      { $set: req.body },
      { returnOriginal: false }
    );

    if (!result) {
      return res.status(404).json({ message: 'Productivity status not found' });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Delete productivity status by ID
exports.deleteProductivityStatus = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const result = await db.collection('productivitystatus').findOneAndDelete({ _id: id });

    if (!result.value) {
      return res.status(404).json({ message: 'Productivity status not found' });
    }

    res.status(200).json({ message: 'Productivity status deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
