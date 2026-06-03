/**
 * Processes a collection of repository models, sorting by stars and printing a formatted output grid.
 * @param {Array} repositories - Collection of raw parsed repository elements.
 * @param {number} limit - Maximum number of elements to display.
 */
function displayTrendingRepositories(repositories, limit) {
    if (!repositories || repositories.length === 0) {
        console.log('No trending repositories matched your selected query parameters.');
        return;
    }

    // Sort the collection array explicitly by star counts in descending order
    const sortedRepositories = [...repositories].sort((a, b) => b.stargazers_count - a.stargazers_count);
    
    // Slice the array to truncate results at the requested limit boundary threshold
    const truncatedRepositories = sortedRepositories.slice(0, limit);
    
    console.log(`\n=== TOP ${truncatedRepositories.length} TRENDING REPOSITORIES ===`);
    
    // Loop items and print using the specified format
    truncatedRepositories.forEach((repo, index) => {
        console.log(`${index + 1}. Name: ${repo.name} (⭐ ${repo.stargazers_count})`);
        console.log(`   Language: ${repo.language || 'Not Specified'}`);
        console.log(`   Description: ${repo.description || 'No description available.'}`);
        console.log('--------------------------------------------------');
    });
}

/**
 * Computes the relative historical query date based on the input duration configuration.
 * @param {string} duration - The target date range segment string ('day', 'week', 'month', 'year').
 * @returns {string} Clean ISO formatted YYYY-MM-DD baseline tracking date.
 */
function calculateTargetDate(duration) {
    const targetDate = new Date();
    
    // Implement date manipulation switches to shift targetDate backwards contextually
    switch (duration.toLowerCase()) {
        case 'day':
            targetDate.setDate(targetDate.getDate() - 1);
            break;
        case 'week':
            targetDate.setDate(targetDate.getDate() - 7);
            break;
        case 'month':
            targetDate.setMonth(targetDate.getMonth() - 1);
            break;
        case 'year':
            targetDate.setFullYear(targetDate.getFullYear() - 1);
            break;
        default:
            // Fallback default boundary safety configuration
            targetDate.setDate(targetDate.getDate() - 7);
    }
    
    return targetDate.toISOString().split('T')[0];
}

/**
 * Dispatches an asynchronous request to the GitHub search REST endpoint to fetch trending repositories.
 * @param {string} duration - Historical range window calculation term.
 * @param {number} limit - Absolute display truncation limit parameter.
 */
async function fetchTrendingRepositories(duration, limit) {
    const baseDate = calculateTargetDate(duration);
    
    // Construct the GitHub search API string targeting items created after our calculated date boundary
    const targetUrl = `https://api.github.com/search/repositories?q=created:>${baseDate}&sort=stars&order=desc`;

    try {
        // Fire network request via the global fetch utility.
        // Include a required 'User-Agent' header mapping to prevent GitHub API proxy rejections.
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Node-GitHub-Trending-CLI-App'
            }
        });

        // Handle network connection failures or API rate limit errors cleanly
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded. Please wait a few moments before retrying.');
            }
            throw new Error(`GitHub API request failed with status code: ${response.status}`);
        }

        const data = await response.json();
        const items = data.items || [];
        
        displayTrendingRepositories(items, limit);

    } catch (error) {
        console.error('\n❌ Error: Failed to fetch trending repositories from the GitHub API.');
        console.error(`Reason: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Parses user input options out of positional arguments and bootstraps the tool execution.
 */
function main() {
    const args = process.argv.slice(2);

    // Default configuration assignments matching instructions parameters
    let duration = 'week';
    let limit = 10;

    const validDurations = ['day', 'week', 'month', 'year'];

    // Iterate through args to extract customized parameters for '--duration' and '--limit' safely
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--duration' && i + 1 < args.length) {
            const inputDuration = args[i + 1].toLowerCase();
            
            // Parameter validation checking values
            if (!validDurations.includes(inputDuration)) {
                console.error(`⚠️ Error: Invalid duration option "${args[i + 1]}". Valid choices are: ${validDurations.join(', ')}`);
                process.exit(1);
            }
            duration = inputDuration;
            i++; // Skip next arg since it was consumed as the value
        } else if (args[i] === '--limit' && i + 1 < args.length) {
            const inputLimit = parseInt(args[i + 1], 10);
            
            if (isNaN(inputLimit) || inputLimit <= 0) {
                console.error(`⚠️ Error: Invalid limit option "${args[i + 1]}". It must be a positive integer.`);
                process.exit(1);
            }
            limit = inputLimit;
            i++; // Skip next arg since it was consumed as the value
        }
    }

    console.log(`🔍 Searching for trending repositories across the past: ${duration}...`);
    console.log(`⏱️ Filter baseline tracking date boundary calculation: >= ${calculateTargetDate(duration)}`);
    console.log(`📊 Display limit configuration set to: ${limit} items.`);

    fetchTrendingRepositories(duration, limit);
}

// Global exception listener fallback
process.on('uncaughtException', (err) => {
    console.error('System encountered an unhandled execution failure:', err.message);
    process.exit(1);
});

main();