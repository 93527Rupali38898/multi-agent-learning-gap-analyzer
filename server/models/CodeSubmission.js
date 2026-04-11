const mongoose = require("mongoose");
 
const CodeSubmissionSchema = new mongoose.Schema({
  userId:       { type: String, required: true },
  problemId:    { type: String, required: true },
  code:         { type: String, required: true },
  language:     { type: String, default: "python" },
  submittedAt:  { type: Date, default: Date.now },
  status:       { type: String, default: "attempted" } // "attempted" | "solved"
});
 
// Index for fast lookup by problem
CodeSubmissionSchema.index({ problemId: 1 });
CodeSubmissionSchema.index({ userId: 1, problemId: 1 });
 
module.exports = mongoose.model("CodeSubmission", CodeSubmissionSchema);
 