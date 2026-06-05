// loggerService.js
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const LOG_FILE = path.resolve('./backup-activity.log');

/**
 * Appends diagnostic metrics to a localized execution file.
 */
export function logActivity({ operation, dbms, dbName, status, durationMs, error = null }) {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
        timestamp,
        operation,
        dbms,
        dbName,
        status,
        durationMs: `${durationMs}ms`,
        error: error ? error.message : null
    });

    fs.appendFileSync(LOG_FILE, logEntry + '\n', 'utf-8');
    console.log(`[Logger]: Metrics successfully appended to ${LOG_FILE}`);
}

/**
 * Dispatches optional slack webhook alerts notifying channels of system status changes.
 */
export async function sendSlackNotification(message) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log('[Slack Alert]: Skipped (SLACK_WEBHOOK_URL not configured).');
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `\`\`\`${message}\`\`\`` })
        });
        if (response.ok) console.log('🚀 [Slack Alert]: Status payload transmitted successfully.');
    } catch (err) {
        console.error(`[Slack Error]: Failed to dispatch alert pipeline: ${err.message}`);
    }
}