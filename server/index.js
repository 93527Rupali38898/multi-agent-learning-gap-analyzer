const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Problem = require('./models/Problem');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Connection Error:", err));

// API: Get all problems (Dynamic)
app.get('/api/problems', async (req, res) => {
  try {
    const problems = await Problem.find();
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API: Get problems by Course (C, Python, DSA)
app.get('/api/problems/course/:name', async (req, res) => {
  const name = req.params.name;
  let query = {};
  if(name === 'DSA') query = { problemId: { $regex: 'DSA' } };
  else query = { language: name };
  
  const problems = await Problem.find(query);
  res.json(problems);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));