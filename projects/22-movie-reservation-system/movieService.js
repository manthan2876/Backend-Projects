import { Movie, Showtime } from './db.js';

async function createMovie({ title, description, genre }) {
    if (!title || !description || !genre) throw new Error('Missing movie property fields.');
    return await Movie.create({ title, description, genre });
}

async function createShowtime({ movieId, date, time, totalCapacity }) {
    if (!movieId || !date || !time) throw new Error('Missing showtime parameters.');
    
    const movieExists = await Movie.findById(movieId);
    if (!movieExists) throw new Error('Target movie does not exist.');

    return await Showtime.create({ movieId, date, time, totalCapacity });
}

async function getShowtimesByDate(dateString) {
    if (!dateString) throw new Error('Query parameter "date" is required.');
    
    // Find all scheduled showtimes for the target day and populate movie metadata
    return await Showtime.find({ date: dateString }).populate('movieId');
}

export { createMovie, createShowtime, getShowtimesByDate };