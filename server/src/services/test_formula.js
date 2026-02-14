
// trustScore logic (copied for verification)
const ALPHA = 0.5;
const BETA = 0.3;
const GAMMA = 0.2;

const SIGMOID_MIDPOINT = 20;
const SIGMOID_STEEPNESS = 0.15;
const HALF_LIFE_DAYS = 30;

function normalizeSubmissions(count) {
    return 1 / (1 + Math.exp(-SIGMOID_STEEPNESS * (count - SIGMOID_MIDPOINT)));
}

function calculateErrorRate(totalVotes, positiveVotes) {
    if (totalVotes === 0) return 0;
    return 1 - (positiveVotes / totalVotes);
}

function calculateTimeDecay(lastActivityDate) {
    if (!lastActivityDate) return 0.5;
    const now = new Date();
    const daysSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
    const lambda = Math.LN2 / HALF_LIFE_DAYS;
    return Math.exp(-lambda * daysSinceActivity);
}

function calculateTrustScore(params) {
    const V = normalizeSubmissions(params.validatedSubmissionsCount);
    const E = calculateErrorRate(params.totalVotesReceived, params.positiveVotesReceived);
    const T = calculateTimeDecay(params.lastActivityDate);

    console.log(`Debug: V=${V.toFixed(2)}, E=${E.toFixed(2)}, T=${T.toFixed(2)}`);

    const score = ALPHA * V + BETA * (1 - E) + GAMMA * T;
    return Math.max(0, Math.min(1, score));
}

// Tests
console.log('--- Testing TrustScore Formula (Standalone) ---');

// Case 1: New user, no activity
const score1 = calculateTrustScore({
    validatedSubmissionsCount: 0,
    totalVotesReceived: 0,
    positiveVotesReceived: 0,
    lastActivityDate: null
});
console.log(`Case 1 (New User): Score = ${score1.toFixed(4)} (Expected low)`);

// Case 2: User with 50 validated submissions, all positive
const score2 = calculateTrustScore({
    validatedSubmissionsCount: 50,
    totalVotesReceived: 50,
    positiveVotesReceived: 50,
    lastActivityDate: new Date()
});
console.log(`Case 2 (Perfect User): Score = ${score2.toFixed(4)} (Expected ~1.0)`);
// V should be ~1
// E should be 0
// T should be 1
// 0.5*1 + 0.3*1 + 0.2*1 = 1.0

// Case 3: User with 50 validated submissions, but poor accuracy (0 positive votes)
const score3 = calculateTrustScore({
    validatedSubmissionsCount: 50,
    totalVotesReceived: 50,
    positiveVotesReceived: 0,
    lastActivityDate: new Date()
});
console.log(`Case 3 (Spammer?): Score = ${score3.toFixed(4)} (Expected ~0.7)`);
// V ~ 1
// E = 1
// T = 1
// 0.5*1 + 0.3*0 + 0.2*1 = 0.7

// Case 4: Inactive user (1 year ago)
const oldDate = new Date();
oldDate.setDate(oldDate.getDate() - 365);
const score4 = calculateTrustScore({
    validatedSubmissionsCount: 50,
    totalVotesReceived: 50,
    positiveVotesReceived: 50,
    lastActivityDate: oldDate
});
console.log(`Case 4 (Inactive Legend): Score = ${score4.toFixed(4)} (Expected ~0.8)`);
// V ~ 1
// E = 0
// T ~ 0
// 0.5*1 + 0.3*1 + 0 = 0.8
