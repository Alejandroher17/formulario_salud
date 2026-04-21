/**
 * Propósito: Servidor principal del Sistema de Gestión de Contactos.
 * Funcionalidad: Gestión de API REST, autenticación JWT y servicio de archivos estáticos.
 * Arquitectura: Node.js con Express y SQL Server.
 */
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { sql, poolPromise } = require('./src/database/db');

const SECRET_KEY = 'clave_secreta_super_segura'; // En producción, usar variables de entorno

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Servir los HTML desde la raíz
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/views/index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'public/views/index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public/views/login.html')));
app.get('/panel.html', (req, res) => res.sendFile(path.join(__dirname, 'public/views/panel.html')));
app.get('/graficos.html', (req, res) => res.sendFile(path.join(__dirname, 'public/views/graficos.html')));

// Middleware para proteger rutas con JWT
/**
 * Middleware para proteger rutas con JWT.
 * Verifica que el token enviado en el header Authorization sea válido.
 */
const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ error: 'Acceso denegado. Inicia sesión.' });

    const token = authHeader.replace('Bearer ', '');
    try {
        const decodificado = jwt.verify(token, SECRET_KEY);
        req.usuario = decodificado;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado. Inicia sesión nuevamente.' });
    }
};

// --- ENDPOINTS DE AUTENTICACIÓN ---
app.post('/api/auth/registro', async (req, res) => {
    try {
        const { usuario, password } = req.body;
        if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });

        const pool = await poolPromise;
        const requestCheck = pool.request();
        requestCheck.input('usuario', sql.NVarChar(50), usuario);
        const resultCheck = await requestCheck.query('SELECT Id FROM usuarios WHERE Usuario = @usuario');
        
        if (resultCheck.recordset.length > 0) return res.status(400).json({ error: 'El usuario ya existe' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const requestInsert = pool.request();
        requestInsert.input('usuario', sql.NVarChar(50), usuario);
        requestInsert.input('hash', sql.NVarChar(255), hash);
        await requestInsert.query('INSERT INTO usuarios (Usuario, PasswordHash) VALUES (@usuario, @hash)');

        res.status(201).json({ success: true, message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;
        if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });

        const pool = await poolPromise;
        const request = pool.request();
        request.input('usuario', sql.NVarChar(50), usuario);
        const result = await request.query('SELECT * FROM usuarios WHERE Usuario = @usuario');

        if (result.recordset.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

        const user = result.recordset[0];
        const validPassword = await bcrypt.compare(password, user.PasswordHash);
        if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

        const token = jwt.sign({ id: user.Id, usuario: user.Usuario }, SECRET_KEY, { expiresIn: '2h' });
        res.status(200).json({ success: true, token, usuario: user.Usuario });
    } catch (error) {
        console.error('Error login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// --- ENDPOINTS DE CONTACTOS ---
app.post('/api/contacto', async (req, res) => {
    try {
        const { nombre, apellidos, email } = req.body;
        if (!nombre || !apellidos || !email) return res.status(400).json({ error: 'Todos los campos son requeridos' });

        const pool = await poolPromise;
        const request = pool.request();
        request.input('nombre', sql.NVarChar(100), nombre);
        request.input('apellidos', sql.NVarChar(150), apellidos);
        request.input('email', sql.NVarChar(255), email);

        await request.query(`
            INSERT INTO contacto (Nombre, Apellidos, Email)
            VALUES (@nombre, @apellidos, @email)
        `);

        res.status(200).json({ success: true, message: 'Datos guardados correctamente' });
    } catch (error) {
        console.error('Error al guardar en la BD:', error);
        res.status(500).json({ error: 'Error interno del servidor al guardar los datos' });
    }
});

app.get('/api/contactos', verificarToken, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query('SELECT Id, Nombre, Apellidos, Email, FechaCreacion FROM contacto ORDER BY FechaCreacion DESC');
        res.status(200).json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error al obtener datos:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener los datos' });
    }
});

app.put('/api/contactos/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellidos, email } = req.body;

        if (!nombre || !apellidos || !email) return res.status(400).json({ error: 'Todos los campos son requeridos' });

        const pool = await poolPromise;
        const request = pool.request();
        request.input('id', sql.Int, id);
        request.input('nombre', sql.NVarChar(100), nombre);
        request.input('apellidos', sql.NVarChar(150), apellidos);
        request.input('email', sql.NVarChar(255), email);

        await request.query(`
            UPDATE contacto 
            SET Nombre = @nombre, Apellidos = @apellidos, Email = @email 
            WHERE Id = @id
        `);

        res.status(200).json({ success: true, message: 'Contacto actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        res.status(500).json({ error: 'Error interno del servidor al actualizar los datos' });
    }
});

app.get('/api/estadisticas', verificarToken, async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultDias = await pool.request().query(`
            SELECT CONVERT(varchar, FechaCreacion, 23) as Fecha, COUNT(*) as Total 
            FROM contacto 
            GROUP BY CONVERT(varchar, FechaCreacion, 23) 
            ORDER BY Fecha
        `);

        const resultHoras = await pool.request().query(`
            SELECT DATEPART(hour, FechaCreacion) as Hora, COUNT(*) as Total 
            FROM contacto 
            GROUP BY DATEPART(hour, FechaCreacion) 
            ORDER BY Hora
        `);

        res.json({
            dias: resultDias.recordset,
            horas: resultHoras.recordset
        });
    } catch (err) {
        console.error('Error en estadísticas:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
});
