// Add validation to the schema
const mongoose = require("mongoose");

const workLogSchema = new mongoose.Schema({
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
  },
  duration: {
    type: String,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
});

const breakLogSchema = new mongoose.Schema({
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
  },
  duration: {
    type: String,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
});

const focusTimerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  worklogs: {
    type: [workLogSchema],
    default: [],
  },
  breaklogs: {
    type: [breakLogSchema],
    default: [],
  },
  workDuration: {
    type: Number,
    default: 0,
  },
  breakDuration: {
    type: Number,
    default: 0,
  },
  isOnBreak: {
    type: Boolean,
    default: false,
  },
  isRunning: {
    type: Boolean,
    default: false,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Add pre-save validation
focusTimerSchema.pre('save', function(next) {
  // Ensure worklogs is an array
  if (!Array.isArray(this.worklogs)) {
    this.worklogs = [];
  }
  
  // Ensure breaklogs is an array
  if (!Array.isArray(this.breaklogs)) {
    this.breaklogs = [];
  }
  
  // Validate workDuration
  if (typeof this.workDuration !== 'number' || isNaN(this.workDuration)) {
    this.workDuration = 0;
  }
  
  // Validate breakDuration
  if (typeof this.breakDuration !== 'number' || isNaN(this.breakDuration)) {
    this.breakDuration = 0;
  }
  
  // Update lastUpdated
  this.lastUpdated = new Date();
  
  next();
});

module.exports = mongoose.model("FocusTimer", focusTimerSchema);