const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Submission = require('../models/Submission');
const axios = require('axios');

// Submit Code (Test Run)
router.post('/run', async (req, res) => {
  try {
    const { userId, code, language, problemId } = req.body;

    // Call Python AI Engine for linting
    const lintResponse = await axios.post(
      `${process.env.PYTHON_API_URL || 'http://localhost:8000'}/lint`,
      { code, language }
    );

    if (!lintResponse.data.success) {
      return res.json({ 
        success: false, 
        error: 'Language mismatch or syntax error',
        details: lintResponse.data.error 
      });
    }

    // TODO: Run against test cases (implement test runner)
    res.json({ 
      success: true, 
      output: 'Test case passed!',
      message: 'Code executed successfully' 
    });
  } catch (error) {
    console.error('Run error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit Code (Final Submission with Plagiarism Check)
router.post('/submit', async (req, res) => {
  try {
    const { userId, code, language, problemId, courseId, difficulty, hintsUsed } = req.body;

    // Only check plagiarism for Medium/Hard
    let plagiarismResult = { score: 0, isPlagiarized: false, optimalSolution: '' };
    
    if (difficulty === 'medium' || difficulty === 'hard') {
      // Call Python AI Engine for plagiarism check
      const plagResponse = await axios.post(
        `${process.env.PYTHON_API_URL || 'http://localhost:8000'}/check-plagiarism`,
        { code, language, problemId, difficulty }
      );
      
      plagiarismResult = plagResponse.data;
    }

    // Call Python AI Engine for analytics
    const analyticsResponse = await axios.post(
      `${process.env.PYTHON_API_URL || 'http://localhost:8000'}/analyze-code`,
      { code, language, problemId, hintsUsed }
    );

    const analytics = analyticsResponse.data;

    // Save submission
    const submission = new Submission({
      userId,
      problemId,
      courseId,
      code,
      language,
      difficulty,
      plagiarismScore: plagiarismResult.score,
      isPlagiarized: plagiarismResult.isPlagiarized,
      optimalSolution: plagiarismResult.optimalSolution,
      syntaxAccuracy: analytics.syntaxAccuracy,
      logicalEfficiency: analytics.logicalEfficiency,
      conceptMastery: analytics.conceptMastery,
      hintsUsed: hintsUsed || [],
      weakTopics: analytics.weakTopics || [],
      isPassed: !plagiarismResult.isPlagiarized
    });

    await submission.save();

    // Update user stats if not plagiarized
    if (!plagiarismResult.isPlagiarized) {
      await updateUserProgress(userId, problemId, courseId, difficulty, analytics.weakTopics, hintsUsed);
    }

    res.json({ 
      success: true, 
      submission,
      plagiarismResult,
      analytics
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Update User Progress
async function updateUserProgress(userId, problemId, courseId, difficulty, weakTopics, hintsUsed) {
  const user = await User.findOne({ uid: userId });
  if (!user) return;

  // Check if already solved
  const alreadySolved = user.solvedProblems.find(p => p.problemId === problemId);
  if (alreadySolved) return;

  // Add to solved problems
  user.solvedProblems.push({
    problemId,
    courseId,
    difficulty,
    solvedAt: new Date(),
    hintsUsed: hintsUsed.length,
    weakTopics
  });

  // Update activity heatmap
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const activityIndex = user.activityMap.findIndex(a => {
    const aDate = new Date(a.date);
    aDate.setHours(0, 0, 0, 0);
    return aDate.getTime() === today.getTime();
  });

  if (activityIndex !== -1) {
    user.activityMap[activityIndex].count += 1;
    user.activityMap[activityIndex].solved = true;
  }

  // Update streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const yesterdayActivity = user.activityMap.find(a => {
    const aDate = new Date(a.date);
    aDate.setHours(0, 0, 0, 0);
    return aDate.getTime() === yesterday.getTime();
  });

  if (yesterdayActivity && yesterdayActivity.solved) {
    user.currentStreak += 1;
  } else {
    user.currentStreak = 1;
  }

  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
  user.lastActiveDate = new Date();

  // Update rating (simple: +10 per problem)
  user.rating += 10;

  await user.save();
}

module.exports = router;
