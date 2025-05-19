const { ObjectId } = require('mongodb');
const connectToDB = require('../db');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    //('Received task data:', req.body);
    const { userId, title, description, category, priority, deadline, completed } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const db = await connectToDB();
    const newTask = {
      userId: new ObjectId(userId),
      title,
      description: description || '',
      category: category || 'Work',
      priority: priority !== undefined ? priority : 2,
      deadline: deadline ? new Date(deadline) : new Date(),
      completed: completed || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    //('Creating task:', newTask);
    const result = await db.collection('tasks').insertOne(newTask);
    res.status(201).json({ insertedId: result.insertedId, ...newTask });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
};
exports.getalltasks = async (req, res) => {
  try {
    const db = await connectToDB();
    const tasks = await db.collection('tasks').find().toArray();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get all tasks for a user
exports.getTasksByUser = async (req, res) => {
  try {
    const db = await connectToDB();
    const userId = new ObjectId(req.params.userId);

    const tasks = await db.collection('tasks').find({ userId }).toArray();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const db = await connectToDB();
    const taskId = new ObjectId(req.params.id);

    const task = await db.collection('tasks').findOne({ _id: taskId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    //('Updating task:', req.params.id, req.body);
    const db = await connectToDB();
    const taskId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.body.userId);
    // if(!userId) return res.status(400).json({ message: 'userId is required' });
    if(userId){
      req.body.userId = userId;
    }
    const updates = { ...req.body, updatedAt: new Date() };
    
    // If deadline is provided, convert it to a Date object
    if (updates.deadline) {
      updates.deadline = new Date(updates.deadline);
    }

    const result = await db.collection('tasks').findOneAndUpdate(
      { _id: taskId },
      { $set: updates },
      { returnOriginal: false }
    );

    if (!result) return res.status(404).json({ message: 'Task not found' });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const db = await connectToDB();
    const taskId = new ObjectId(req.params.id);

    const result = await db.collection('tasks').findOneAndDelete({ _id: taskId });

    if (!result) return res.status(404).json({ message: 'Task not found' });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
