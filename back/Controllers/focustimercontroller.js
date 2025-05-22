const { ObjectId } = require("mongodb");
const connectToDB = require("../db");

exports.createFocusTimer = async (req, res) => {
  try {
    const {
      userid,
      startedAt = null,
      workDuration = 0,
      breakDuration = 0,
      worklogs = [],
      breaklogs = [],
      date,
    } = req.body;

    if (!userid || !date) {
      return res.status(400).json({ message: "userid and date are required" });
    }

    const db = await connectToDB();
    const newEntry = {
      userid: new ObjectId(userid),
      loggedAt: new Date().toISOString(), // Store as ISO string
      workDuration,
      breakDuration,
      worklogs,
      breaklogs,
      date: new Date(date),
    };

    const result = await db.collection("focustimer").insertOne(newEntry);
    res.status(201).json({ insertedId: result.insertedId, ...newEntry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all focus timers
exports.getFocusTimers = async (req, res) => {
  try {
    const db = await connectToDB();
    const timers = await db.collection("focustimer").find().toArray();
    res.status(200).json(timers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const formattedDate = () => {
  const today = new Date();
  return (
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0")
  );
};
const createnewtimer = async (id) => {
  const db = await connectToDB();

  // If not found, create a new one
  const newTimer = {
    userid: id,
    loggedAt: getFormattedDateTime(),
    workDuration: 0,
    breakDuration: 0,
    worklogs: [],
    breaklogs: [],
    date: formattedDate(),
    isRunning: false,
    isOnBreak: false,
  };

  const result = await db.collection("focustimer").insertOne(newTimer);
  const createdTimer = {
    _id: result.insertedId,
    ...newTimer,
  };
  return createdTimer;
};
// Get or create a focus timer for a user for today
exports.getFocusTimerById = async (req, res) => {
  try {
    const db = await connectToDB();

    const todayTimer = await db.collection("focustimer").findOne({
      userid: req.params.id,
      date: formattedDate(),
    });

    // If found, return it
    if (todayTimer) {
      return res.status(200).json(todayTimer);
    }
    const createdTimer = await createnewtimer(req.params.id);
    res.status(201).json(createdTimer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getallFocusTimer = async (req, res) => {
  try {
    const db = await connectToDB();
    const timers = await db
      .collection("focustimer")
      .find({
        userid: req.params.id,
      })
      .toArray();
    res.status(200).json(timers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
function getFormattedDateTime() {
  const now = new Date();

  const date =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");

  const time =
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0") +
    ":" +
    String(now.getSeconds()).padStart(2, "0");

  return `${date} ${time}`;
}
// Update focus timer by user ID and today's date
exports.updateFocusTimer = async (req, res) => {
  try {
    // console.log("Focustimer")
    const db = await connectToDB();

    const updateData = { ...req.body };

    console.log("Updating the focus timer with :",req.body.workDuration);

    const result = await db.collection("focustimer").findOneAndUpdate(
      {
        userid: req.params.id,
        date: formattedDate(),
      },
      { $set: updateData }
    );

    if (!result) {
      const newTimer = await createnewtimer(req.params.id);
      return res
        .status(201)
        .json({ _id: insertResult.insertedId, ...newTimer });
    }

    return res.status(200).json(result);
  } catch (error) {
    //("Catch executed ...",error)
    return res.status(500).json({ error: error.message });
  }
};

// Delete focus timer by ID
exports.deleteFocusTimer = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);

    const result = await db.collection("focustimer").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Focus timer not found" });
    }

    res.status(200).json({ message: "Focus timer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
