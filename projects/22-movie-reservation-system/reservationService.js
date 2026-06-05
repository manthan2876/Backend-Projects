import { Showtime, Reservation } from './db.js';

async function reserveSeats(userId, { showtimeId, seats }) {
    if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
        throw new Error('Invalid booking payload selection.');
    }

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) throw new Error('Showtime record could not be found.');

    // Enforce atomic locking check routines to verify no requested seat is already booked
    const overlap = seats.filter(seat => showtime.bookedSeats.includes(seat));
    if (overlap.length > 0) {
        throw new Error(`Transaction conflict: Seats [${overlap.join(', ')}] are already reserved.`);
    }

    // Atomic update query prevents race condition overbooking events across concurrent processes
    const updatedShowtime = await Showtime.findOneAndUpdate(
        { _id: showtimeId, bookedSeats: { $nin: seats } },
        { $push: { bookedSeats: { $each: seats } } },
        { new: true }
    );

    if (!updatedShowtime) {
        throw new Error('Booking conflict: One or more requested seats were reserved by another session.');
    }

    // Document transaction history records
    return await Reservation.create({
        userId,
        showtimeId,
        seats
    });
}

async function cancelReservation(userId, reservationId) {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) throw new Error('Reservation record not found.');

    // Restrict access permissions to ensure customers can only remove their own records
    if (reservation.userId.toString() !== userId.toString()) {
        throw new Error('Permission denied: Unauthorized action context.');
    }

    // Release previously locked seats back into the available pool for the showtime
    await Showtime.findByIdAndUpdate(reservation.showtimeId, {
        $pull: { bookedSeats: { $in: reservation.seats } }
    });

    await Reservation.findByIdAndDelete(reservationId);
    return { success: true };
}

export { reserveSeats, cancelReservation };