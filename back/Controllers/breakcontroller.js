const { ObjectId } = require("mongodb");
const connectToDB = require("../db");

// Get break settings by user ID
exports.getBreakByUserId = async (req, res) => {
  try {
    const db = await connectToDB();
    const userId = req.params.id;

    //("Getting break settings for user:", userId);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Convert userId to ObjectId
    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error("Invalid ObjectId format:", error);
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const breaks = await db
      .collection("breaks")
      .find({ userId: userObjectId })
      .toArray();

    if (!breaks || breaks.length === 0) {
      // Return default settings if no settings found
      return res.status(200).json([
        {
          userId: userObjectId,
          intervalInMinutes: 25,
          breaktime: 5,
          createdAt: new Date(),
        },
      ]);
    }

    res.status(200).json(breaks);
  } catch (error) {
    console.error("Error getting break settings:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create new break settings
exports.createBreak = async (req, res) => {
  try {
    const db = await connectToDB();
    const { userId, intervalInMinutes = 25, breaktime = 5 } = req.body;

    //("Creating break settings:", req.body);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Convert userId to ObjectId
    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error("Invalid ObjectId format:", error);
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Check if settings already exist for this user
    const existingBreak = await db
      .collection("breaks")
      .findOne({ userId: userObjectId });

    if (existingBreak) {
      return res.status(409).json({
        error: "Break settings already exist for this user",
        existingId: existingBreak._id,
      });
    }

    const newBreak = {
      userId: userObjectId,
      intervalInMinutes: parseInt(intervalInMinutes) || 25,
      breaktime: parseInt(breaktime) || 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("breaks").insertOne(newBreak);

    res.status(201).json({
      _id: result.insertedId,
      ...newBreak,
    });
  } catch (error) {
    console.error("Error creating break settings:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update break settings
exports.updateBreak = async (req, res) => {
  try {
    const db = await connectToDB();
    const userId = req.params.id;

    //("Updating break settings for user:", userId, req.body);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Convert userId to ObjectId
    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error("Invalid ObjectId format:", error);
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Validate input
    const intervalInMinutes = parseInt(req.body.intervalInMinutes) || 25;
    const breaktime = parseInt(req.body.breaktime) || 5;

    if (intervalInMinutes < 1 || breaktime < 1) {
      return res.status(400).json({
        error:
          "Invalid values. Work and break durations must be at least 1 minute.",
      });
    }

    // Prepare update data
    const updateData = {
      intervalInMinutes,
      breaktime,
      updatedAt: new Date(),
    };

    // First check if a document exists for this user
    const existingBreak = await db
      .collection("breaks")
      .findOne({ userId: userObjectId });

    let result;

    if (existingBreak) {
      // Update existing document
      //("Updating existing break settings:", existingBreak._id);
      result = await db
        .collection("breaks")
        .findOneAndUpdate(
          { userId: userObjectId },
          { $set: updateData },
          { returnDocument: "after" }
        );

      if (!result) {
        return res
          .status(404)
          .json({ error: "Break settings not found after update" });
      }

      res.status(200).json(result);
    } else {
      // Create new document
      //("Creating new break settings for user:", userId);
      const newBreak = {
        userId: userObjectId,
        intervalInMinutes,
        breaktime,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await db.collection("breaks").insertOne(newBreak);

      res.status(201).json({
        _id: insertResult.insertedId,
        ...newBreak,
      });
    }
  } catch (error) {
    console.error("Error updating break settings:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete break
exports.deleteBreak = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const result = await db.collection("breaks").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Break not found" });
    }

    res.status(200).json({ message: "Break deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
