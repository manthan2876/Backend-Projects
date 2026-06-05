// models.js
import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

const ImageSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    originalUrl: { type: String, required: true },
    s3Key: { type: String, required: true },
    cachedTransforms: [{
        hashKey: { type: String, required: true }, // Map criteria fingerprints uniquely
        transformedUrl: { type: String, required: true },
        s3Key: { type: String, required: true }
    }]
}, { timestamps: true });

export const User = model('User', UserSchema);
export const Image = model('Image', ImageSchema);