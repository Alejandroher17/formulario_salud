/**
 * Propósito: Lógica de visualización de datos para el Dashboard de Ecommerce.
 * Funcionalidad: Inicializa KPIs y renderiza gráficos interactivos usando Chart.js.
 * Dependencias: Chart.js (vía CDN), data.js (datos locales).
 */

import { kpis, dailySales, salesByCategory, topProducts } from './data.js';

/**
 * Inicializa los indicadores clave de rendimiento (KPIs) en la interfaz.
 * Ejemplo: actualiza el texto de ingresos totales con formato de moneda.
 */
function initKPIs() {
    document.getElementById('revenue-kpi').textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.totalRevenue);
    document.getElementById('orders-kpi').textContent = kpis.totalOrders.toLocaleString();
    document.getElementById('avg-ticket-kpi').textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.avgTicket);
}

initKPIs();

// Global Chart Config
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Outfit', sans-serif";

// 1. Sales Evolution Chart
const salesCtx = document.getElementById('salesChart').getContext('2d');
new Chart(salesCtx, {
    type: 'line',
    data: {
        labels: dailySales.map(d => d.fecha),
        datasets: [{
            label: 'Facturación ($)',
            data: dailySales.map(d => d.facturacion),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        }
    }
});

// 2. Category Distribution
const categoryCtx = document.getElementById('categoryChart').getContext('2d');
new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
        labels: salesByCategory.slice(0, 5).map(c => c.categoria),
        datasets: [{
            data: salesByCategory.slice(0, 5).map(c => c.facturacion),
            backgroundColor: [
                '#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'
            ],
            borderWidth: 0,
            hoverOffset: 20
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 20, usePointStyle: true }
            }
        },
        cutout: '70%'
    }
});

// 3. Top Products
const productsCtx = document.getElementById('productsChart').getContext('2d');
new Chart(productsCtx, {
    type: 'bar',
    data: {
        labels: topProducts.map(p => p.nombre),
        datasets: [{
            label: 'Facturado ($)',
            data: topProducts.map(p => p.facturado),
            backgroundColor: 'rgba(168, 85, 247, 0.6)',
            borderRadius: 8,
            hoverBackgroundColor: '#a855f7'
        }]
    },
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { display: false } }
        }
    }
});
