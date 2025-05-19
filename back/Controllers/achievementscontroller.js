const { ObjectId } = require("mongodb");
const connectToDB = require("../db");

// Create a new achievement
exports.createAchievement = async (req, res) => {
  try {
    const { image, title, description } = req.body;

    if (!image || !title) {
      return res
        .status(400)
        .json({ message: "Image and title are required." });
    }

    const db = await connectToDB();
    const newAchievement = { image, title, description };

    const result = await db
      .collection("achievements")
      .insertOne(newAchievement);
    res.status(201).json({ insertedId: result.insertedId, ...newAchievement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all achievements
exports.getAchievements = async (req, res) => {
  try {
    const db = await connectToDB();
    const achievements = await db.collection("achievements").find().toArray();
    res.status(200).json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get an achievement by ID
exports.getAchievementById = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const achievement = await db
      .collection("achievements")
      .findOne({ _id: id });

    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    res.status(200).json(achievement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update achievement by ID
exports.updateAchievement = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const result = await db
      .collection("achievements")
      .findOneAndUpdate(
        { _id: id },
        { $set: req.body },
        { returnOriginal: false }
      );

    if (!result) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete achievement by ID
exports.deleteAchievement = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const result = await db
      .collection("achievements")
      .findOneAndDelete({ _id: id });

    if (!result) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    res.status(200).json({ message: "Achievement deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
