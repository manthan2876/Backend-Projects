// dbDrivers.js
import mongoose from 'mongoose';
import mysql from 'mysql2/promise';
import pg from 'pg';

/**
 * Core interface routing connectivity tests and read/write loops natively.
 */
export const DbDrivers = {
    mongodb: {
        test: async (uri) => {
            const conn = await mongoose.connect(uri);
            await mongoose.disconnect();
            return true;
        },
        backup: async (uri) => {
            const conn = await mongoose.connect(uri);
            const collections = await conn.connection.db.listCollections().toArray();
            const dumpData = {};

            for (const col of collections) {
                dumpData[col.name] = await conn.connection.db.collection(col.name).find({}).toArray();
            }
            await mongoose.disconnect();
            return JSON.stringify(dumpData, null, 2);
        },
        restore: async (uri, rawData) => {
            const conn = await mongoose.connect(uri);
            const dumpData = JSON.parse(rawData);

            for (const [colName, docs] of Object.entries(dumpData)) {
                if (docs.length === 0) continue;
                await conn.connection.db.collection(colName).drop().catch(() => {});
                // Enforce BSON ID instantiation transformations
                const mapping = docs.map(d => {
                    if (d._id) d._id = new mongoose.Types.ObjectId(d._id);
                    return d;
                });
                await conn.connection.db.collection(colName).insertMany(mapping);
            }
            await mongoose.disconnect();
        }
    },

    mysql: {
        test: async (config) => {
            const connection = await mysql.createConnection(config);
            await connection.end();
            return true;
        },
        backup: async (config) => {
            const connection = await mysql.createConnection(config);
            const [tables] = await connection.query('SHOW TABLES;');
            const dumpData = {};

            for (const tableRow of tables) {
                const tableName = Object.values(tableRow)[0];
                const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
                dumpData[tableName] = rows;
            }
            await connection.end();
            return JSON.stringify(dumpData, null, 2);
        },
        restore: async (config, rawData) => {
            const connection = await mysql.createConnection(config);
            const dumpData = JSON.parse(rawData);

            await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
            for (const [tableName, rows] of Object.entries(dumpData)) {
                await connection.query(`TRUNCATE TABLE \`${tableName}\`;`);
                if (rows.length === 0) continue;

                const keys = Object.keys(rows[0]);
                const insertQuery = `INSERT INTO \`${tableName}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES ?`;
                const values = rows.map(row => keys.map(k => row[k]));
                await connection.query(insertQuery, [values]);
            }
            await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
            await connection.end();
        }
    },

    postgresql: {
        test: async (configString) => {
            const client = new pg.Client({ connectionString: configString });
            await client.connect();
            await client.end();
            return true;
        },
        backup: async (configString) => {
            const client = new pg.Client({ connectionString: configString });
            await client.connect();
            
            const tableQuery = `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`;
            const tableResult = await client.query(tableQuery);
            const dumpData = {};

            for (const row of tableResult.rows) {
                const tableName = row.table_name;
                const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
                dumpData[tableName] = dataResult.rows;
            }
            await client.connect();
            await client.end();
            return JSON.stringify(dumpData, null, 2);
        },
        restore: async (configString, rawData) => {
            const client = new pg.Client({ connectionString: configString });
            await client.connect();
            const dumpData = JSON.parse(rawData);

            for (const [tableName, rows] of Object.entries(dumpData)) {
                await client.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
                if (rows.length === 0) continue;

                const keys = Object.keys(rows[0]);
                const valuePlaceholders = rows.map((_, rIdx) => 
                    `(${keys.map((_, kIdx) => `$${rIdx * keys.length + kIdx + 1}`).join(', ')})`
                ).join(', ');

                const insertQuery = `INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES ${valuePlaceholders};`;
                const flattenedValues = rows.flatMap(row => keys.map(k => row[k]));
                
                await client.query(insertQuery, flattenedValues);
            }
            await client.end();
        }
    }
};