import 'dotenv/config'
import { createClient } from 'redis';

// Initialize the Redis client. 
// If your Redis is running inside WSL2, localhost works out-of-the-box.
const redisClient = createClient({
    url: process.env.REDIS_URI
});

const LEADERBOARD_KEY = 'game:top_scores';

// Explicitly catch background socket errors to prevent unhandled process exit crashes
redisClient.on('error', (err) => {
    console.error('Redis Client Socket Error Trace:', err);
});

async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('Successfully connected to Redis high-performance in-memory cache matrix.');
    } catch (err) {
        console.error('\n======================================================');
        console.error('CRITICAL: Redis connection failed during app startup!');
        console.error('Reason:', err.message);
        console.error('======================================================\n');
        process.exit(1);
    }
}

async function submitScore(username, score) {
    if (!username || score === undefined || isNaN(score)) {
        throw new Error('Missing or invalid score parameter requirements.');
    }
    await redisClient.zAdd(LEADERBOARD_KEY, {
        score: parseFloat(score),
        value: username.trim()
    });
    return { username, score };
}

async function getTopLeaderboard() {
    const rawScores = await redisClient.zRangeWithScores(LEADERBOARD_KEY, 0, 9, {
        REV: true
    });
    return rawScores.map((item, index) => ({
        rank: index + 1,
        username: item.value,
        score: item.score
    }));
}

async function getPlayerRank(username) {
    const cleanUsername = username.trim();
    const score = await redisClient.zScore(LEADERBOARD_KEY, cleanUsername);
    if (score === null) throw new Error(`User '${cleanUsername}' has no recorded history.`);

    const zeroIndexedRank = await redisClient.zRevRank(LEADERBOARD_KEY, cleanUsername);
    return {
        username: cleanUsername,
        score: score,
        rank: zeroIndexedRank + 1
    };
}

async function removePlayerScore(username) {
    const cleanUsername = username.trim();
    const deleteCount = await redisClient.zRem(LEADERBOARD_KEY, cleanUsername);
    if (deleteCount === 0) throw new Error(`User '${cleanUsername}' does not exist.`);
    return { success: true, message: `Successfully removed user '${cleanUsername}' metrics.` };
}

export {
    connectRedis,
    submitScore,
    getTopLeaderboard,
    getPlayerRank,
    removePlayerScore
};