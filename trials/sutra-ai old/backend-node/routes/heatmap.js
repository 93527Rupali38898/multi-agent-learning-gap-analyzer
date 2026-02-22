const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Submission = require('../models/Submission');

// Get Heatmap Data (4 months)
router.get('/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Return activity map
    res.json({ 
      success: true, 
      activityMap: user.activityMap,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak
    });
  } catch (error) {
    console.error('Heatmap fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Dashboard Analytics
router.get('/analytics/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const submissions = await Submission.find({ userId: req.params.uid }).sort({ submittedAt: -1 });

    // Plagiarism trend (last 30 submissions)
    const plagiarismTrend = submissions.slice(0, 30).map(s => ({
      date: s.submittedAt,
      score: s.plagiarismScore
    }));

    // Weak topics analysis
    const weakTopicsMap = {};
    submissions.forEach(s => {
      s.weakTopics.forEach(topic => {
        weakTopicsMap[topic] = (weakTopicsMap[topic] || 0) + 1;
      });
    });

    const weakTopics = Object.entries(weakTopicsMap)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily activity (last 30 days)
    const last30Days = user.activityMap.slice(-30).map(a => ({
      date: a.date,
      count: a.count
    }));

    // Course completion
    const courseCompletion = user.courseProgress.map(c => ({
      course: c.courseName,
      completed: c.solvedCount,
      total: c.totalProblems,
      percentage: (c.solvedCount / c.totalProblems) * 100
    }));

    res.json({ 
      success: true, 
      analytics: {
        plagiarismTrend,
        weakTopics,
        dailyActivity: last30Days,
        courseCompletion,
        totalSolved: user.solvedProblems.length,
        rating: user.rating,
        rank: user.rank
      }
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
