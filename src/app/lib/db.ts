import mysql from 'mysql2/promise';

// Criamos uma "Pool" (Piscina) de conexões
// Ela gerencia as conexões automaticamente para você
export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 13476,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10, // Limite de conexões simultâneas
    queueLimit: 0
});