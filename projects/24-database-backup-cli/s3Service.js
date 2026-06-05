// s3Service.js
import fs from 'fs';
import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export async function transmitBackupToS3(localFilePath, remoteFileKey) {
    const bucket = process.env.AWS_BUCKET_NAME;
    if (!bucket) throw new Error('S3 upload rejected: Environment parameter AWS_BUCKET_NAME missing.');

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: remoteFileKey,
        Body: fs.readFileSync(localFilePath),
        ContentType: 'application/gzip'
    });

    await s3Client.send(command);
    return `s3://${bucket}/${remoteFileKey}`;
}