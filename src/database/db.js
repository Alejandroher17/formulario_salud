/**
 * Propósito: Módulo de gestión de conexión a la base de datos SQL Server.
 * Funcionalidad: Configura un pool de conexiones persistente para el servidor.
 * Uso: Exporta 'sql' para tipos de datos y 'poolPromise' para ejecutar consultas.
 */
const sql = require('mssql');

const dbConfig = {
    user: 'sa',
    password: '123456',
    server: 'localhost',
    port: 1433,
    database: 'registro',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('✅ Conexión exitosa a SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error en la conexión a la base de datos:', err);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};
