import mysql from 'mysql2/promise';

// Criamos uma "Pool" (Piscina) de conexões
// Ela gerencia as conexões automaticamente para você
export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'thiagorf',
    password: process.env.DB_PASSWORD || 'teadoro123',
    database: process.env.DB_NAME || 'controle_validades',
    port: Number(process.env.DB_PORT),
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10, // Limite de conexões simultâneas
    queueLimit: 0
});