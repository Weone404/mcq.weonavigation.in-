import mongoose from 'mongoose';

// ─── User ─────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
});

// ─── Result ───────────────────────────────────────────────────────────────────
const resultSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  chapterId: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  answers: [{
    questionId: { type: String, required: true },
    selected: { type: Number, required: true },
    correct: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  }],
  date: { type: Date, default: Date.now },
});
// Keep only the 50 most recent results per user (enforced in API)
resultSchema.index({ userEmail: 1, date: -1 });

// ─── Leaderboard ──────────────────────────────────────────────────────────────
const leaderboardSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  totalScore: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  testsAttempted: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 }, // 0–100
});

// Prevent model re-registration during hot reload
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const ResultModel = mongoose.models.Result || mongoose.model('Result', resultSchema);
export const LeaderboardModel = mongoose.models.Leaderboard || mongoose.model('Leaderboard', leaderboardSchema);
