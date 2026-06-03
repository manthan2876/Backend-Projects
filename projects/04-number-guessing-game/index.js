import { createInterface } from 'readline';

// Difficulty mapping parameters containing attempt counts
const DIFFICULTY_LEVELS = {
    1: { name: 'Easy', attempts: 10 },
    2: { name: 'Medium', attempts: 5 },
    3: { name: 'Hard', attempts: 3 }
};

/**
 * Generates a bounded pseudo-random integer between a min and max value inclusive.
 * @param {number} min - Lower numerical bounds checkpoint.
 * @param {number} max - Upper numerical bounds checkpoint.
 * @returns {number} The target solution integer.
 */
function generateRandomNumber(min = 1, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Initializes the interactive terminal stream using native readline structures.
 * @returns {Object} Readline interface context engine instance.
 */
function createTerminalInterface() {
    return createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Recursively orchestrates game turn inputs until a terminal win or loss condition triggers.
 * @param {Object} rl - Active readline interface instance tracking input streams.
 * @param {number} targetNumber - The secret integer the user is attempting to find.
 * @param {number} remainingAttempts - Total remaining guess attempts tracking metrics.
 * @param {number} totalAttemptsMade - Incremental count tracking total turns taken.
 * @param {number} startTime - Epoch timestamp indicating precisely when the match started.
 */
function executeGuessLoop(rl, targetNumber, remainingAttempts, totalAttemptsMade, startTime) {
    // Check if player has exhausted all attempts before prompting for the next guess
    if (remainingAttempts === 0) {
        console.log(`\n❌ Game Over! You've run out of attempts. The secret number was ${targetNumber}.`);
        rl.close();
        return;
    }

    rl.question(`\nEnter your guess (Attempt ${totalAttemptsMade + 1}, ${remainingAttempts} left): `, (input) => {
        // Sanitize string inputs (trim whitespace, apply parseInt)
        const guess = parseInt(input.trim(), 10);

        // Validate that the input is a valid number within bounds
        if (isNaN(guess) || guess < 1 || guess > 100) {
            console.log('⚠️ Please enter a valid integer between 1 and 100.');
            // Re-run the loop with the same parameters without consuming an attempt
            executeGuessLoop(rl, targetNumber, remainingAttempts, totalAttemptsMade, startTime);
            return;
        }

        const newTotalAttempts = totalAttemptsMade + 1;
        const newRemainingAttempts = remainingAttempts - 1;

        // Evaluate guess against the target number
        if (guess === targetNumber) {
            const endTime = Date.now();
            const durationInSeconds = ((endTime - startTime) / 1000).toFixed(1);
            
            console.log(`\n🎉 Congratulations! You guessed the correct number in ${newTotalAttempts} attempts!`);
            console.log(`⏱️ It took you ${durationInSeconds} seconds.`);
            rl.close();
        } else {
            if (guess > targetNumber) {
                console.log(`📉 Incorrect! The secret number is lower than ${guess}.`);
            } else {
                console.log(`📈 Incorrect! The secret number is higher than ${guess}.`);
            }
            
            // Call executeGuessLoop recursively with updated counters
            executeGuessLoop(rl, targetNumber, newRemainingAttempts, newTotalAttempts, startTime);
        }
    });
}

/**
 * Captures user difficulty choice parameters and bootstraps the core game dependencies.
 * @param {Object} rl - Active standard input/output stream engine instance.
 */
function chooseDifficulty(rl) {
    console.log('\nPlease select a difficulty setting option level:');
    console.log('1. Easy (10 attempts)');
    console.log('2. Medium (5 attempts)');
    console.log('3. Hard (3 attempts)');

    rl.question('\nEnter your choice (1, 2, or 3): ', (input) => {
        const choice = input.trim();

        // Validate if the input matches a key inside the DIFFICULTY_LEVELS object map
        if (DIFFICULTY_LEVELS[choice]) {
            const selectedLevel = DIFFICULTY_LEVELS[choice];
            console.log(`\nGreat! You have selected the ${selectedLevel.name} difficulty level.`);
            console.log(`Let's start the game!`);

            const targetNumber = generateRandomNumber(1, 100);
            const startTime = Date.now();

            // Bootstrap the guess loop engine
            executeGuessLoop(rl, targetNumber, selectedLevel.attempts, 0, startTime);
        } else {
            console.log('⚠️ Invalid option choice. Please pick 1, 2, or 3.');
            chooseDifficulty(rl); // Ask again recursively
        }
    });
}

/**
 * Welcome screen display layout and entry workflow router.
 */
function main() {
    console.log('============================================');
    console.log('Welcome to the Number Guessing Game CLI!    ');
    console.log('I am thinking of a number between 1 and 100.');
    console.log('============================================');

    const rl = createTerminalInterface();
    chooseDifficulty(rl);
}

// Intercept unhandled exceptions safely
process.on('uncaughtException', (err) => {
    console.error('An unexpected application exception occurred:', err.message);
    process.exit(1);
});

main();