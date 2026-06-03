import 'dotenv/config';

/**
 * Processes a collection of movie entities parsed out of TMDB responses, printing data uniformly.
 * @param {Array} movies - Collection of raw movie data objects.
 */
function displayMovies(movies) {
    if (!movies || movies.length === 0) {
        console.log('No movie tracking records matched your selected criteria.');
        return;
    }

    console.log(`\n=== TARGET MOVIE SELECTIONS RECIPES ===`);
    
    // Loop through items and print using the specified terminal output format
    movies.forEach(movie => {
        console.log(`Title: ${movie.title} (Release Date: ${movie.release_date || 'N/A'})`);
        console.log(`Rating: ⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : '0.0'} / 10`);
        console.log(`Overview: ${movie.overview || 'No synopsis summary available.'}`);
        console.log('------------------------------------------------------------------------');
    });
}

/**
 * Dispatches an authenticated request to the TMDB REST API gateway.
 * @param {string} endpointPath - Targeted API routing endpoint path snippet.
 * @param {string} queryParams - Optional query parameter addition strings.
 */
async function callTmdbApi(endpointPath, queryParams = '') {
    const TMDB_TOKEN = process.env.TMDB_API_KEY;

    if (!TMDB_TOKEN) {
        console.error('Error: Environment authorization key parameter "TMDB_API_KEY" is unassigned.');
        console.log('Please set it on your system using: set TMDB_API_KEY=your_token_string');
        process.exit(1);
    }

    const targetUrl = `https://api.themoviedb.org/3${endpointPath}${queryParams}`;

    try {
        // Fire network request via the global fetch utility
        // Append the 'Authorization': 'Bearer <token>' setup within headers configuration
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${TMDB_TOKEN}`
            }
        });

        // Handle response matrices cleanly: Check for 401 Unauthorized or 404 paths
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('401 Unauthorized: Your TMDB_API_KEY token is invalid or expired.');
            }
            if (response.status === 404) {
                throw new Error('404 Not Found: The requested TMDB resource route path does not exist.');
            }
            throw new Error(`API HTTP Connection Error returned code: ${response.status}`);
        }

        const data = await response.json();
        const results = data.results || [];
        
        displayMovies(results);

    } catch (error) {
        console.error('\n❌ Error: Failed to fetch movie metrics out of the TMDB proxy api hub.');
        console.error(`Reason: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Parses user input operational arguments and routes requests downstream.
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.error('Error: Command routing argument execution flag missing.');
        console.log('Usage: node index.js <playing | popular | search> [arguments]');
        process.exit(1);
    }

    switch (command) {
        case 'playing':
            console.log('Querying movies currently running in theaters...');
            callTmdbApi('/movie/now_playing');
            break;

        case 'popular':
            console.log('Querying trending popular movie collections metadata...');
            callTmdbApi('/movie/popular');
            break;

        case 'search':
            const searchTerms = args.slice(1).join(' ');
            if (!searchTerms.trim()) {
                console.error('Error: Search command requires an accompanying text query movie title argument.');
                process.exit(1);
            }
            console.log(`Executing text search index lookup for: "${searchTerms}"...`);
            
            // Safely invoke callTmdbApi with proper encodeURIComponent wrappers applied to searchTerms
            callTmdbApi('/search/movie', `?query=${encodeURIComponent(searchTerms.trim())}`);
            break;

        default:
            console.error(`Error: Unrecognized execution operation argument token parameter: "${command}"`);
            process.exit(1);
    }
}

// Global exception listener fallback
process.on('uncaughtException', (err) => {
    console.error('System encountered an unhandled execution failure:', err.message);
    process.exit(1);
});

main();