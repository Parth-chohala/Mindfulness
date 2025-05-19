const { ObjectId } = require('mongodb');
const connectToDB = require('../db');
const path = require('path');
const fs = require('fs');

// Create a new meditation session entry
exports.createMeditationSession = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { title, description, type } = req.body;
    
    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required.' });
    }
    
    // Handle file upload if present
    let url = '';
    if (req.file) {
      url = req.file.filename;
    } else if (req.body.url) {
      url = req.body.url;
    } else {
      return res.status(400).json({ message: 'Media file is required.' });
    }
    
    const db = await connectToDB();
    const newSession = { 
      title, 
      description: description || '', 
      type, 
      url,
      createdAt: new Date()
    };
    
    const result = await db.collection('meditationsessions').insertOne(newSession);
    
    // Add fileUrl for client convenience
    const responseData = {
      _id: result.insertedId,
      ...newSession,
      fileUrl: `/content/${url}`
    };
    
    console.log('Created meditation session:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating meditation session:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all meditation sessions
exports.getMeditationSessions = async (req, res) => {
  try {
    const db = await connectToDB();
    const sessions = await db.collection('meditationsessions').find().toArray();
    
    // Add fileUrl for client convenience
    const sessionsWithUrls = sessions.map(session => ({
      ...session,
      fileUrl: session.url ? `/content/${session.url}` : ''
    }));
    
    res.status(200).json(sessionsWithUrls);
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

    // Add fileUrl for client convenience
    session.fileUrl = session.url ? `/content/${session.url}` : '';
    
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

    const updateFields = { ...req.body, updatedAt: new Date() };
    
    // Handle file upload if present
    if (req.file) {
      updateFields.url = req.file.filename;
    }

    const result = await db.collection('meditationsessions').findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ message: 'Meditation session not found' });
    }

    // Add fileUrl for client convenience
    result.fileUrl = result.url ? `/content/${result.url}` : '';
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating meditation session:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a meditation session by ID
exports.deleteMeditationSession = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const result = await db.collection('meditationsessions').deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Meditation session not found' });
    }

    res.status(200).json({ message: 'Meditation session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
