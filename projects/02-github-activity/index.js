/**
 * Processes the raw stream arrays returned from the GitHub event endpoint.
 * Maps known event structures to matching terminal print lines.
 * * @param {Array} events - Collection array containing raw GitHub event objects.
 */
function displayActivity(events) {
    if (!events || events.length === 0) {
        console.log('No recent public activity trace records found for this user account.');
        return;
    }

    // Object to track aggregated events: { "repoName_eventType": { repo, type, count, extraData } }
    const aggregated = {};

    for (const event of events) {
        const { type, repo, payload = {} } = event;
        
        // Calculate commit count for PushEvents early
        let pushCommits = 0;
        if (type === 'PushEvent') {
            pushCommits = payload.distinct_size || payload.size;
            if (pushCommits === undefined && payload.head && payload.before) {
                pushCommits = payload.before !== '0000000000000000000000000000000000000000' ? 1 : 0;
            }
            if (pushCommits === undefined || pushCommits === 0) {
                pushCommits = 1;
            }
        }

        // Distinct key based on repo and action type
        const aggregationKey = `${repo.name}_${type}_${payload.action || ''}_${payload.ref_type || ''}`;

        if (!aggregated[aggregationKey]) {
            aggregated[aggregationKey] = {
                type,
                repo,
                payload,
                count: type === 'PushEvent' ? pushCommits : 1
            };
        } else {
            // Add counts together
            if (type === 'PushEvent') {
                aggregated[aggregationKey].count += pushCommits;
            } else {
                aggregated[aggregationKey].count += 1;
            }
        }
    }

    console.log('Output:');
    
    // Loop through aggregated object to print final grouped lines
    for (const key in aggregated) {
        const { type, repo, payload, count } = aggregated[key];
        let actionDetails = '';

        switch (type) {
            case 'PushEvent':
                actionDetails = count === 1
                    ? `Pushed 1 commit to ${repo.name}`
                    : `Pushed ${count} commits to ${repo.name}`;
                break;
            case 'IssuesEvent':
                if (payload.action === 'opened') {
                    actionDetails = count === 1 ? `Opened a new issue in ${repo.name}` : `Opened ${count} new issues in ${repo.name}`;
                } else if (payload.action === 'closed') {
                    actionDetails = count === 1 ? `Closed an issue in ${repo.name}` : `Closed ${count} issues in ${repo.name}`;
                } else {
                    const actionName = payload.action ? payload.action[0].toUpperCase() + payload.action.slice(1) : 'Updated';
                    actionDetails = `${actionName} ${count} ${count === 1 ? 'issue' : 'issues'} in ${repo.name}`;
                }
                break;
            case 'WatchEvent':
                actionDetails = count === 1 ? `Starred ${repo.name}` : `Starred ${repo.name} ${count} times`;
                break;
            case 'PullRequestEvent':
                if (payload.action === 'opened') {
                    actionDetails = count === 1 ? `Opened a new pull request in ${repo.name}` : `Opened ${count} new pull requests in ${repo.name}`;
                } else {
                    const actionName = payload.action ? payload.action[0].toUpperCase() + payload.action.slice(1) : 'Updated';
                    actionDetails = `${actionName} ${count} ${count === 1 ? 'pull request' : 'pull requests'} in ${repo.name}`;
                }
                break;
            case 'CreateEvent':
                const refType = payload.ref_type || 'something';
                actionDetails = count === 1
                    ? `Created a new ${refType} in ${repo.name}`
                    : `Created ${count} new ${refType}s in ${repo.name}`;
                break;
            case 'DeleteEvent':
                const delRefType = payload.ref_type || 'resource';
                actionDetails = count === 1
                    ? `Deleted a ${delRefType} in ${repo.name}`
                    : `Deleted ${count} ${delRefType}s in ${repo.name}`;
                break;
            case 'IssueCommentEvent':
                actionDetails = count === 1 
                    ? `Commented on an issue in ${repo.name}`
                    : `Added ${count} comments on issues in ${repo.name}`;
                break;
            case 'PublicEvent':
                actionDetails = `Made ${repo.name} public`;
                break;
            default:
                actionDetails = count === 1
                    ? `Performed ${type} in ${repo.name}`
                    : `Performed ${type} ${count} times in ${repo.name}`;
        }

        console.log(`- ${actionDetails}`);
    }
}



/**
 * Executes a network call to fetch payload streams from the public GitHub REST API.
 * Uses native runtime capabilities without pulling external library nodes.
 * * @param {string} username - Targeted account identity parameter identifier string.
 */
async function fetchGitHubActivity(username) {
    const targetUrl = `https://api.github.com/users/${encodeURIComponent(username)}/events`;

    try {
        // TODO: Initiate connection to target endpoint using the global fetch API wrapper framework.
        // CRITICAL: Ensure you append a custom structural 'User-Agent' property within your headers setup configuration.
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'GitHub-Activity-Fetcher'
            }
        });
        
        // TODO: Intercept potential response error matrices:
        // Handle 404 User Not Found distinctly.
        // Handle API rate limits, server blockages, or connection declines.
        if (response.status === 404) {
            console.error('Error: User not found.');
            process.exit(1);
        }

        if (!response.ok) {
            console.error(`Error: ${response.status} - ${response.statusText}`);
            process.exit(1);
        }
        
        const events = await response.json();

        if(response.status === 204) {
            events = [];
        }

        // TODO: Extract the body as JSON array strings and hand off execution flow downstream.
        displayActivity(events);

    } catch (error) {
        // TODO: Handle offline failures or systemic execution tracking errors.
        console.error('Network resolution lifecycle sequence failure:', error.message);
        process.exit(1);
    }
}

/**
 * Coordinates initial runtime verification checkpoints before delegating downstream executions.
 */
function main() {
    const args = process.argv.slice(2);
    const targetUser = args[0];

    // Validate that a positional username argument parameter is actively present
    if (!targetUser) {
        console.error('Error: Argument target parameter structural string sequence missing.');
        console.log('Usage: node index.js <github-username>');
        process.exit(1);
    }

    // Forward safe parameters out into network request orchestration threads
    fetchGitHubActivity(targetUser);
}

// Global exception handling
process.on('uncaughtException', (err) => {
    console.error('System run termination bypassed safely:', err.message);
    process.exit(1);
});

main();