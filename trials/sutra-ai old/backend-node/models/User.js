const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase UID
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  photoURL: { type: String },
  
  // User Stats
  rating: { type: Number, default: 1200 },
  rank: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  
  // Progress Tracking
  solvedProblems: [{
    problemId: String,
    courseId: String,
    category: String,
    difficulty: String,
    solvedAt: Date,
    plagiarismScore: Number,
    hintsUsed: Number,
    weakTopics: [String]
  }],
  
  // Activity Heatmap Data (4 months)
  activityMap: [{
    date: { type: Date, required: true },
    count: { type: Number, default: 0 },
    solved: { type: Boolean, default: false }
  }],
  
  // Course Progress
  courseProgress: [{
    courseId: String,
    courseName: String,
    totalProblems: Number,
    solvedCount: Number,
    lastAccessed: Date
  }],
  
  // Achievements
  badges: [{
    badgeId: String,
    name: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
