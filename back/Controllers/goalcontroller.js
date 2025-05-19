const { ObjectId } = require('mongodb');
const connectToDB = require("../db");

// Helper function to update goal progress
const updateGoalProgressInDB = async (db, goalId, progressValue) => {
  try {
    const goal = await findGoalById(db, goalId);
    
    if (!goal) {
      return { success: false, message: 'Goal not found' };
    }
    
    const updates = {
      progressValue,
      updatedAt: new Date()
    };
    
    // Check if goal is completed
    if (progressValue >= goal.targetValue) {
      updates.status = 'completed';
      updates.completedAt = new Date();
    } else {
      // Ensure goal is marked as active if it was previously completed
      // but progress is now below target
      if (goal.status === 'completed') {
        updates.status = 'active';
        updates.completedAt = null;
      }
    }
    
    const result = await db.collection('goals').findOneAndUpdate(
      { _id: new ObjectId(goalId) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    return { success: true, result };
  } catch (err) {
    console.error('Error updating goal progress:', err);
    return { success: false, message: err.message };
  }
};

// Create a new goal
exports.createGoal = async (req, res) => {
    const db = await connectToDB();
  const goal = {
    ...req.body,
    progressValue: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (goal.progressValue >= goal.targetValue) {
    goal.status = 'completed';
  }

  try {
    const result = await db.collection('goals').insertOne(goal);
    res.status(201).json(result.ops?.[0] || goal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all goals
exports.getAllGoals = async (req, res) => {
    const db = await connectToDB();

  try {
    const goals = await db.collection('goals').find({}).sort({ createdAt: -1 }).toArray();
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get goals by user ID
exports.getGoalById = async (req, res) => {
  const db = await connectToDB();

  try {
    const userId = req.params.id;
    
    const goals = await db.collection('goals')
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();
      
    res.json(goals);
  } catch (err) {
    console.error('Error fetching goals for user:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update a goal
exports.updateGoal = async (req, res) => {
    const db = await connectToDB();
  //("Updating goal:", req.params.id, req.body);
  const updates = {
    ...req.body,
    updatedAt: new Date()
  };

  updates.progressValue = updates.progressValue < 0 ? 0 : updates.progressValue;

  const prevgoal = await db.collection('goals').findOne({ _id: new ObjectId(req.params.id) });
  //('Previous goal:', prevgoal);

  if (updates.progressValue >= prevgoal.targetValue) {
    updates.status = 'completed';
    // //('Goal completed!');
  }else{
    updates.status = 'active';
  }

  try {
    const result = await db.collection('goals').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updates },
      { returnOriginal: false }
    );

    if (!result) return res.status(404).json({ message: 'Goal not found' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a goal
exports.deleteGoal = async (req, res) => {
    const db = await connectToDB();

  try {
    const result = await db.collection('goals').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get goals by user ID
exports.getGoalsByUserId = async (req, res) => {
  const db = await connectToDB();

  try {
    const userId = req.params.userId;
    
    // Check if it's a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const goals = await db.collection('goals')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
      
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a goal's progress
exports.updateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progressValue } = req.body;
    
    console.log(`Updating goal ${id} progress to ${progressValue}`);

    // Find the goal
    const goal = await Goal.findById(id);
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Update progress value
    goal.progressValue = progressValue;
    
    // Check if goal is completed
    if (progressValue >= goal.targetValue) {
      goal.status = 'completed';
      goal.progressValue = goal.targetValue; // Cap at target value
    }
    
    // Save the updated goal
    const updatedGoal = await goal.save();
    console.log('Updated goal:', updatedGoal);
    
    res.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Batch update goal progress for a specific type
exports.updateGoalProgressByType = async (req, res) => {
  const db = await connectToDB();
  const { goalType, incrementValue } = req.body;
  
  if (!goalType || incrementValue === undefined) {
    return res.status(400).json({ 
      message: 'goalType and incrementValue are required' 
    });
  }
  
  try {
    // Find all goals of the specified type
    // If incrementValue is positive, only update active goals
    // If incrementValue is negative, update all goals including completed ones
    const query = { 
      goalType: goalType
    };
    
    // Only filter by status if we're incrementing (not decrementing)
    if (incrementValue > 0) {
      query.status = 'active';
    }
    
    const goals = await db.collection('goals')
      .find(query)
      .toArray();
    
    const updateResults = [];
    
    // Update each goal's progress
    for (const goal of goals) {
      // Ensure progress doesn't go below 0
      const newProgressValue = Math.max(0, goal.progressValue + incrementValue);
      const { success, result } = await updateGoalProgressInDB(
        db, 
        goal._id, 
        newProgressValue
      );
      
      if (success) {
        updateResults.push(result);
      }
    }
    
    res.json({
      message: `Updated ${updateResults.length} goals of type ${goalType}`,
      updatedGoals: updateResults
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
