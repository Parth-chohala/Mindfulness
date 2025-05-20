const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const connectToDB = require("../db");

// Create Admin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, pass } = req.body;
    if (!name || !email || !pass) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    const db = await connectToDB();
    const existingAdmin = await db.collection("admin").findOne({ email });
    if (existingAdmin) {
      return res
        .status(409)
        .json({ message: "Admin with this email already exists." });
    }

    const hashedPass = await bcrypt.hash(pass, 10);
    const newAdmin = { name, email, pass: hashedPass };
    const result = await db.collection("admin").insertOne(newAdmin);
    res
      .status(201)
      .json({ insertedId: result.insertedId, ...newAdmin, pass: "hidden" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Admins
exports.getAllAdmins = async (req, res) => {
  try {
    const db = await connectToDB();
    const admins = await db.collection("admin").find().toArray();
    res.status(200).json(admins.map((a) => ({ ...a, pass: "hidden" })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);
    const admin = await db.collection("admin").findOne({ _id: id });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ ...admin, pass: "hidden" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);
    const update = { ...req.body };

    if (update.pass) {
      update.pass = await bcrypt.hash(update.pass, 10);
    }

    const result = await db
      .collection("admin")
      .findOneAndUpdate(
        { _id: id },
        { $set: update },
        { returnDocument: "after" }
      );

    if (!result) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ ...result, pass: "hidden" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Admin
exports.deleteAdmin = async (req, res) => {
  try {
    const db = await connectToDB();
    const id = new ObjectId(req.params.id);
    const result = await db.collection("admin").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login Admin
exports.loginAdmin = async (req, res) => {
  try {
    const { email, pass } = req.body;
    
    if (!email || !pass) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const db = await connectToDB();
    const admin = await db.collection("admin").findOne({ email });
    
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(pass, admin.pass);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Return admin info (excluding password)
    res.status(200).json({ 
      message: "Login successful", 
      adminId: admin._id.toString(),
      name: admin.name || email.split('@')[0]
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
