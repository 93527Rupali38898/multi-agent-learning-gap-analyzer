const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;

    // Check if user exists by uid or email
    let user = await User.findOne({ $or: [{ uid }, { email }] });

    if (!user) {
      // Create new user
      user = new User({
        uid,
        email,
        displayName,
        photoURL,
        rating: 1200,
        rank: 0,
        currentStreak: 0,
        longestStreak: 0,
        solvedProblems: [],
        badges: [],
        activityMap: []
      });

      await user.save();
    }

    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        rating: user.rating,
        rank: user.rank
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Login route for manual email/password (Firebase handles auth, we just sync user data)
router.post('/login', async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;

    // Find user by uid or email
    let user = await User.findOne({ $or: [{ uid }, { email }] });

    // If user doesn't exist, create them (handles cases where backend sync failed during registration)
    if (!user) {
      console.log('User not found in database, creating new user:', email);
      user = new User({
        uid,
        email,
        displayName: displayName || email.split('@')[0], // Use email prefix if no display name
        photoURL: '',
        rating: 1200,
        rank: 0,
        currentStreak: 0,
        longestStreak: 0,
        solvedProblems: [],
        badges: [],
        activityMap: []
      });

      await user.save();
      console.log('New user created successfully:', email);
    }

    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        rating: user.rating,
        rank: user.rank
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;