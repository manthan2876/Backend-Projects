// workoutService.js
import { pool } from './db.js';

/**
 * Computes cumulative stats loops using fast database aggregation processing functions.
 */
export async function getWorkoutStats() {
    const query = `
        SELECT 
            COUNT(*) as totalWorkouts, 
            IFNULL(SUM(durationMinutes), 0) as totalMinutes, 
            IFNULL(SUM(totalCaloriesBurned), 0) as totalCalories 
        FROM workouts;
    `;
    const [rows] = await pool.query(query);
    return rows[0];
}

/**
 * Accesses logs matching target interval parameters if provided.
 */
export async function getAllWorkouts(rangeFilter = null) {
    let query = `SELECT * FROM workouts`;
    const params = [];

    if (rangeFilter) {
        if (rangeFilter === 'week') {
            query += ` WHERE createdAt >= NOW() - INTERVAL 7 DAY`;
        } else if (rangeFilter === 'month') {
            query += ` WHERE createdAt >= NOW() - INTERVAL 1 MONTH`;
        }
    }
    
    query += ` ORDER BY createdAt DESC;`;
    const [workoutRows] = await pool.query(query, params);

    // Hydrate parent records with their downstream exercises child nodes array matrix
    for (let workout of workoutRows) {
        const [exerciseRows] = await pool.query(
            `SELECT exerciseName, sets, reps FROM exercises WHERE workoutId = ?`, 
            [workout.id]
        );
        workout.exercises = exerciseRows;
    }

    return workoutRows;
}

/**
 * Runs a transactional sequence to insert parent workouts and children exercises.
 */
export async function createWorkoutSession({ name, durationMinutes, totalCaloriesBurned, exercises }) {
    const connection = await pool.getConnection();
    
    try {
        // Atomic Transaction Boundary Lock Initializer
        await connection.beginTransaction();

        // 1. Append record inside parent tracking sheet
        const workoutQuery = `INSERT INTO workouts (name, durationMinutes, totalCaloriesBurned) VALUES (?, ?, ?);`;
        const [workoutResult] = await connection.query(workoutQuery, [name, durationMinutes, totalCaloriesBurned]);
        const generatedWorkoutId = workoutResult.insertId;

        // 2. Map downstream dependent exercise collection lines safely
        const exerciseQuery = `INSERT INTO exercises (workoutId, exerciseName, sets, reps) VALUES ?;`;
        const exerciseValuesArray = exercises.map(ex => [generatedWorkoutId, ex.exerciseName, ex.sets, ex.reps]);
        
        await connection.query(exerciseQuery, [exerciseValuesArray]);

        // Commit transaction operations across all indices
        await connection.commit();

        return {
            id: generatedWorkoutId,
            name,
            durationMinutes,
            totalCaloriesBurned,
            exercises
        };
    } catch (err) {
        await connection.rollback();
        throw new Error(`Database Transaction Processing Aborted: ${err.message}`);
    } finally {
        connection.release();
    }
}

/**
 * Executes a structural database row deletion using relational schema cascading.
 */
export async function deleteWorkoutSession(workoutId) {
    const checkQuery = `SELECT id FROM workouts WHERE id = ?;`;
    const [rows] = await pool.query(checkQuery, [workoutId]);
    
    if (rows.length === 0) return false;

    // Relational ON DELETE CASCADE constraint automatically wipes child records from the exercises table
    const deleteQuery = `DELETE FROM workouts WHERE id = ?;`;
    await pool.query(deleteQuery, [workoutId]);
    return true;
}