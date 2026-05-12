import mongoose from 'mongoose';

const DeductionSchema = new mongoose.Schema({
    reason: String,
    points: Number,
}, { _id: false });

const PhaseResultSchema = new mongoose.Schema({
    phaseId: String,
    phaseLabel: String,
    pilotTranscript: { type: String, default: '' },
    expectedReadback: String,
    score: { type: Number, default: 0 },
    maxScore: Number,
    deductions: [DeductionSchema],
    missingKeywords: [String],
    criticalMistake: { type: Boolean, default: false },
    timeTaken: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
}, { _id: false });

const RtrAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    mode: {
        type: String,
        enum: ['practice', 'mock'],
        default: 'practice',
    },
    scenarioId: { type: String, required: true },
    callsign: String,
    departure: String,
    destination: String,
    phases: [PhaseResultSchema],
    totalScore: { type: Number, default: 0 },
    maxTotalScore: { type: Number, default: 100 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    duration: { type: Number, default: 0 },
    examinerRemarks: { type: String, default: '' },
}, { timestamps: true });

RtrAttemptSchema.index({ userId: 1, createdAt: -1 });
RtrAttemptSchema.index({ userId: 1, mode: 1 });

export default mongoose.models.RtrAttempt ||
    mongoose.model('RtrAttempt', RtrAttemptSchema);