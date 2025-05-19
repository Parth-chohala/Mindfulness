const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const connectToDB = require('../db');

// Register (create) a new user
exports.createUser = async (req, res) => {
  //('Creating user');
  try {
    const { name, email, pass } = req.body;

    if (!name || !email || !pass) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const db = await connectToDB();
    const existingUser = await db.collection('user').findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const newUser = {
      name,
      email,
      pass: hashedPassword,
      createdAt: new Date(),
      achievements: [],
    };

    const result = await db.collection('user').insertOne(newUser);
    res.status(201).json({ insertedId: result.insertedId, ...newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// User login
exports.loginUser = async (req, res) => {
  //('Logging in user');
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = await connectToDB();
    const user = await db.collection('user').findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    //('User found:', user);
    const isPasswordValid = await bcrypt.compare(pass, user.pass);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const db = await connectToDB();
    const users = await db.collection('user').find().toArray();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user by ID

exports.getUserById = async (req, res) => {
  //('Fetching user by ID');
  try {
    const id = req.params.id;

    // Check if it's a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const db = await connectToDB();
    const user = await db.collection('user').findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user by ID
exports.updateUser = async (req, res) => {
  //('Updating user by ID');
  try {
    const db = await connectToDB();
    const result = await db.collection('user').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body } },
      { returnOriginal: false}
    );

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
  //('Deleting user by ID');
  try {
    const db = await connectToDB();
    const result = await db.collection('user').findOneAndDelete({ _id: new ObjectId(req.params.id) });

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};
