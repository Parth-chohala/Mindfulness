const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userMeditationProgressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'MeditationSession'
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    default: 300 // Default to 5 minutes (300 seconds)
  }
}, {
  timestamps: true
});

// Create a compound index to ensure a user can only complete a session once
userMeditationProgressSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

const UserMeditationProgress = mongoose.model('UserMeditationProgress', userMeditationProgressSchema);

module.exports = UserMeditationProgress;
