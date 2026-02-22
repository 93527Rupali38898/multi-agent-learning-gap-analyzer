const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  problemId: { type: String, required: true },
  courseId: { type: String, required: true },
  
  // Submission Details
  code: { type: String, required: true },
  language: { type: String, required: true },
  difficulty: { type: String, required: true }, // easy, medium, hard
  
  // AI Analysis Results
  plagiarismScore: { type: Number, default: 0 },
  isPlagiarized: { type: Boolean, default: false },
  optimalSolution: { type: String },
  
  // Analytics Data
  syntaxAccuracy: { type: Number, default: 0 },
  logicalEfficiency: { type: Number, default: 0 },
  conceptMastery: { type: Number, default: 0 },
  
  // Hints Used
  hintsUsed: [{
    level: Number,
    timestamp: Date,
    content: String
  }],
  
  // Weak Topics Identified
  weakTopics: [String],
  
  // Test Results
  testsPassed: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  isPassed: { type: Boolean, default: false },
  
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);
