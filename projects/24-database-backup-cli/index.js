// index.js
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import mongoose from 'mongoose';
import { DbDrivers } from './dbDrivers.js';
import { transmitBackupToS3 } from './s3Service.js';
import { logActivity, sendSlackNotification } from './loggerService.js';

const PORT = process.env.PORT || 3000;

function displayHelp() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║          UNIVERSAL DATABASE CLI BACKUP & RESTORE UTILITY   ║
╚═══════════════════════════════════════════════════════════╝
Usage Commands:
  node index.js --action <backup|restore> --type <mongodb|mysql|postgresql> --uri <conn_string> [flags]

Options Matrix:
  --action   Required. target execution path choice: 'backup' or 'restore'.
  --type     Required. Database driver context engine: 'mongodb', 'mysql', or 'postgresql'.
  --uri      Required. Connection string or encoded metadata JSON payload matching configuration details.
  --output   Optional. Output folder path destination for local archive tracking. (Default: './backups')
  --file     Required for Restore paths. Local source archive compression path context string.
  --upload   Optional Flag. Automates cloud replication out to configured Amazon S3 targets.
    `);
    process.exit(0);
}

function parseCliArguments() {
    const args = process.argv.slice(2);
    const flags = { action: null, type: null, uri: null, output: './backups', file: null, upload: false };

    if (args.includes('--help') || args.length === 0) displayHelp();

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--action') flags.action = args[i + 1];
        if (args[i] === '--type') flags.type = args[i + 1];
        if (args[i] === '--uri') flags.uri = args[i + 1];
        if (args[i] === '--output') flags.output = args[i + 1];
        if (args[i] === '--file') flags.file = args[i + 1];
        if (args[i] === '--upload') flags.upload = true;
    }
    return flags;
}

async function runCliEngine() {
    const flags = parseCliArguments();
    if (!flags.action || !flags.type || !flags.uri) {
        console.error('❌ Validation Mismatch: Arguments missing. Run with --help for explicit documentation structure.');
        process.exit(1);
    }

    const driver = DbDrivers[flags.type.toLowerCase()];
    if (!driver) {
        console.error(`❌ Unsupported target database engine layout type choice: "${flags.type}"`);
        process.exit(1);
    }

    // Standard Connection URI Extraction Parameters for relational connections
    let parsedConnectionConfig = flags.uri;
    let dbName = 'TargetDatabase';
    try {
        if (flags.uri.startsWith('{')) {
            parsedConnectionConfig = JSON.parse(flags.uri);
            dbName = parsedConnectionConfig.database || 'RelationalMatrix';
        } else {
            const urlMetadata = new URL(flags.uri);
            dbName = urlMetadata.pathname.replace('/', '') || 'NoSQLSnapshot';
        }
    } catch {}

    const startTime = Date.now();

    // ==========================================
    // BACKUP PIPELINE OPERATIONS
    // ==========================================
    if (flags.action.toLowerCase() === 'backup') {
        console.log(`\n[Initialization]: Validating connection metrics targeting: ${flags.type}...`);
        
        try {
            await driver.test(parsedConnectionConfig);
            console.log(' -> Connection test successful! Extracting collections payload catalog records... ');

            const rawJsonString = await driver.backup(parsedConnectionConfig);
            const compressedArchiveBuffer = zlib.gzipSync(Buffer.from(rawJsonString));

            // Structure local file system organization paths
            const outDir = path.resolve(flags.output);
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

            const baseTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `backup-${flags.type}-${baseTimestamp}.json.gz`;
            const localFileDest = path.join(outDir, fileName);

            fs.writeFileSync(localFileDest, compressedArchiveBuffer);
            const durationMs = Date.now() - startTime;
            
            console.log(`[Success]: File compressed and safely saved on local storage: ${localFileDest}`);
            logActivity({ operation: 'BACKUP', dbms: flags.type, dbName, status: 'SUCCESS', durationMs });

            let s3AlertInfo = '';
            if (flags.upload) {
                const s3TargetKey = `db-backups/${flags.type}/${fileName}`;
                const cloudPath = await transmitBackupToS3(localFileDest, s3TargetKey);
                console.log(`[Cloud Success]: Archive streamed out to S3: ${cloudPath}`);
                s3AlertInfo = `\n☁️ S3 Destination: ${cloudPath}`;
            }

            // Trigger Slack Notification alerts metrics
            await sendSlackNotification(`✅ BACKUP OPERATION COMPLETED SUCCESSFULLY\nDatabase: ${dbName} (${flags.type})\nDuration: ${durationMs}ms\nSize: ${(compressedArchiveBuffer.length / 1024).toFixed(2)} KB${s3AlertInfo}`);
            
            console.log('\n=== BACKUP LIFECYCLE SEQUENCE TERMINATED CLEANLY ===');
            // Swap setImmediate for a small timeout to allow AWS S3 keep-alive sockets to drop cleanly on Windows
            setTimeout(() => {
                process.exit(0);
            }, 100);
            return; 

        } catch (error) {
            const durationMs = Date.now() - startTime;
            console.error(`\n[Execution Failure]: Operation script aborted. Reason: ${error.message}`);
            
            logActivity({ operation: 'BACKUP', dbms: flags.type, dbName, status: 'FAILED', durationMs, error });
            
            // Await the asynchronous Slack call fully
            await sendSlackNotification(`❌ BACKUP OPERATION CRASHED\nDatabase: ${dbName}\nError Log: ${error.message}`);
            
            // Cleanly disconnect Mongoose if it was partially initialized
            try { await mongoose.disconnect(); } catch {}
            
            // Small grace timeout delay rule also applied here for runtime edge failures stability
            setTimeout(() => {
                process.exit(1);
            }, 100);
            return;
        }
    }

    // ==========================================
    // RESTORE PIPELINE OPERATIONS
    // ==========================================
    if (flags.action.toLowerCase() === 'restore') {
        if (!flags.file || !fs.existsSync(flags.file)) {
            console.error(`❌ Restoration Aborted: Target source recovery file path missing or invalid: "${flags.file}"`);
            process.exit(1);
        }

        console.log(`\n[Initialization]: Unpacking source archive data stream from: ${flags.file}...`);
        try {
            const compressedBuffer = fs.readFileSync(flags.file);
            const decompressedJsonString = zlib.gunzipSync(compressedBuffer).toString('utf-8');

            console.log(`[Connecting]: Directing injection sequence into target database pool...`);
            await driver.restore(parsedConnectionConfig, decompressedJsonString);
            
            const durationMs = Date.now() - startTime;
            console.log('[Success]: Restoration completed. Tables and data grids refilled successfully.');
            logActivity({ operation: 'RESTORE', dbms: flags.type, dbName, status: 'SUCCESS', durationMs });
            
            await sendSlackNotification(`🔄 RESTORATION COMPLETED SUCCESSFULLY\nTarget Database: ${dbName} (${flags.type})\nFile Applied: ${path.basename(flags.file)}\nDuration: ${durationMs}ms`);
            
            // Swap setImmediate for a small timeout to allow AWS S3 keep-alive sockets to drop cleanly on Windows
            setTimeout(() => {
                process.exit(0);
            }, 100);
            return; 

        } catch (error) {
            const durationMs = Date.now() - startTime;
            console.error(`\n[Restoration Failure]: Data insertion loop aborted. Reason: ${error.message}`);
            
            logActivity({ operation: 'RESTORE', dbms: flags.type, dbName, status: 'FAILED', durationMs, error });
            
            setTimeout(() => {
                process.exit(1);
            }, 500);
            return;
        }
    }

    // Catch-all fallthrough error safety block
    console.error('❌ Mismatch: Action parameter must be explicitly defined as "backup" or "restore".');
}

runCliEngine();