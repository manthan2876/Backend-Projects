import 'dotenv/config';
import { connect, Schema, model } from 'mongoose';

async function connectDatabase() {
    const MONGO_URI = process.env.MONGO_URI;
    try {
        await connect(MONGO_URI);
        console.log('Successfully connected to Cinema Database via local instance.');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
}

// User Profile Schema Definition
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' }
});
const User = model('User', UserSchema);

// Movie Catalog Schema Definition
const MovieSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    genre: { type: String, required: true }
});
const Movie = model('Movie', MovieSchema);

// Showtime Operational Schema Definition
const ShowtimeSchema = new Schema({
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    time: { type: String, required: true }, // Format: HH:MM
    totalCapacity: { type: Number, required: true, default: 50 },
    bookedSeats: { type: [String], default: [] } // Array of booked seat identifiers e.g. ["A1", "A2"]
});
const Showtime = model('Showtime', ShowtimeSchema);

// Booking Transaction Schema Definition
const ReservationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    showtimeId: { type: Schema.Types.ObjectId, ref: 'Showtime', required: true },
    seats: { type: [String], required: true },
    createdAt: { type: Date, default: Date.now }
});
const Reservation = model('Reservation', ReservationSchema);

export {
    connectDatabase,
    User,
    Movie,
    Showtime,
    Reservation
};