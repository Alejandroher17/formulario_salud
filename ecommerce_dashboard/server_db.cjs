/**
 * Propósito: Servidor ligero para servir el Dashboard de Ecommerce.
 * Funcionalidad: Sirve archivos estáticos en el puerto 3005 para visualización de métricas.
 * Notas: Utiliza Express para gestionar el ruteo básico de la aplicación.
 */
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

app.listen(3005, () => {
    console.log('🚀 Dashboard en http://localhost:3005');
});
