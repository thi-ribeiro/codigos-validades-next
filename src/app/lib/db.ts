import mysql from 'mysql2/promise';

// Criamos uma "Pool" (Piscina) de conexões
// Ela gerencia as conexões automaticamente para você
export const pool = mysql.createPool({
    host: 'localhost',
    user: 'thiagorf',
    password: 'teadoro123',
    database: 'controle_validades',
    waitForConnections: true,
    connectionLimit: 10, // Limite de conexões simultâneas
    queueLimit: 0
});