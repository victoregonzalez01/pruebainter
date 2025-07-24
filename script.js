// Variable global para almacenar los productos
let productos = [];

// Elementos del DOM
const calculateBtn = document.getElementById('calculateBtn');
const resultadosDiv = document.getElementById('resultados');
const errorDiv = document.getElementById('errorMessage');
const productosContainer = document.getElementById('productosContainer');

// Cargar productos desde JSON
async function cargarProductos() {
    try {
        const response = await fetch('productos.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar la base de productos');
        }
        const data = await response.json();
        productos = data.productos;
        mostrarProductosDisponibles();
    } catch (error) {
        console.error('Error:', error);
        mostrarError(`Error al cargar productos: ${error.message}`);
    }
}

// Mostrar productos disponibles
function mostrarProductosDisponibles() {
    productosContainer.innerHTML = '';

    productos.forEach(producto => {
        const productCard = document.createElement('div');
        productCard.className = 'col-md-6 mb-3';
        productCard.innerHTML = `
            <div class="product-card" data-sku="${producto.sku}">
                <h4>${producto.nombre}</h4>
                <p><strong>SKU:</strong> ${producto.sku}</p>
                <p><strong>Tamaño:</strong> ${producto.tamaño}</p>
                <p>
                    <strong>Color:</strong>
                    <span class="color-preview" style="background-color:${producto.color}"></span>
                </p>
            </div>
        `;
        productosContainer.appendChild(productCard);
    });

    // Agregar event listeners a las tarjetas de productos
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function() {
            const sku = this.getAttribute('data-sku');
            document.getElementById('sku').value = sku;
        });
    });
}

// Función para calcular sacos de cemento
function calcularSacosCemento(tamanoStr, metros) {
    const dimensiones = tamanoStr.match(/\d+(\.\d+)?/g);
    if (!dimensiones || dimensiones.length < 2) return 0;

    const ancho = parseFloat(dimensiones[0]);
    const alto = parseFloat(dimensiones[1]);

    let rendimientoCemento;

    if (ancho > 60 || alto > 60) {
        rendimientoCemento = 1.5;
    }
    else if (ancho === 60 && alto === 60) {
        rendimientoCemento = 2;
    }
    else {
        rendimientoCemento = 3;
    }

    return Math.ceil(metros / rendimientoCemento);
}

// Función para mostrar mensajes de error
function mostrarError(mensaje) {
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${mensaje}`;
    errorDiv.style.display = "block";
    resultadosDiv.style.display = "none";
}

// Función principal para mostrar resultados
function mostrarResultados() {
    const sku = document.getElementById("sku").value.trim();
    const metrosInput = document.getElementById("metros").value.trim();
    const metros = parseFloat(metrosInput);

    // Resetear mensajes
    resultadosDiv.style.display = "none";
    errorDiv.style.display = "none";
    errorDiv.innerHTML = "";

    // Validación
    if (!sku) {
        mostrarError("Debes ingresar un SKU válido");
        return;
    }

    if (!metrosInput || isNaN(metros) || metros <= 0) {
        mostrarError("Ingresa metros cuadrados válidos (mayores a cero)");
        return;
    }

    // Buscar producto
    const producto = productos.find(p => p.sku === sku);

    if (!producto) {
        mostrarError(`SKU ${sku} no encontrado en nuestra base de datos`);
        return;
    }

    // Cálculos
    const cajasNecesarias = Math.ceil(metros / producto.rendimiento);
    const sacosCemento = calcularSacosCemento(producto.tamaño, metros);

    const dimensiones = producto.tamaño.match(/\d+(\.\d+)?/g);
    const ancho = dimensiones ? parseFloat(dimensiones[0]) : 0;
    const alto = dimensiones ? parseFloat(dimensiones[1]) : 0;

    let tipoCemento = "";
    if (ancho > 60 || alto > 60) {
        tipoCemento = "Formato grande: 1 saco rinde para 1.5 m²";
    } else if (ancho === 60 && alto === 60) {
        tipoCemento = "Rapido: 1 saco rinde para 2 m²";
    } else {
        tipoCemento = "Rapido: 1 saco rinde para 3 m²";
    }

    // Mostrar resultados detallados
    resultadosDiv.innerHTML = `
        <div class="product-header">
            <h3 class="product-name">${producto.nombre}</h3>
            <div class="color-box" style="background-color:${producto.color}"></div>
        </div>

        <div class="product-info">
            <div class="info-grid">
                <div class="info-item">
                    <strong>SKU</strong>
                    <span>${sku}</span>
                </div>
                <div class="info-item">
                    <strong>Tamaño</strong>
                    <span>${producto.tamaño}</span>
                </div>
                <div class="info-item">
                    <strong>Rendimiento</strong>
                    <span>${producto.rendimiento} m²/caja</span>
                </div>
            </div>
        </div>

        <div class="calculations">
            <div class="calculation-item">
                <span>Metros requeridos:</span>
                <span><strong>${metros} m²</strong></span>
            </div>
            <div class="calculation-item">
                <span>Cajas necesarias:</span>
                <span><strong>${cajasNecesarias}</strong></span>
            </div>
            <div class="calculation-item">
                <span>Tipo de cemento:</span>
                <span>${tipoCemento}</span>
            </div>
            <div class="calculation-item">
                <span>Sacos de cemento:</span>
                <span><strong>${sacosCemento}</strong></span>
            </div>
        </div>

        ${producto.imagen ? `<img src="${producto.imagen}" alt="${producto.nombre}" class="product-image">` : ''}
    `;

    resultadosDiv.style.display = "block";

    // Desplazarse suavemente a los resultados
    resultadosDiv.scrollIntoView({ behavior: 'smooth' });
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();

    // Asignar evento al botón de cálculo
    calculateBtn.addEventListener('click', mostrarResultados);

    // Permitir calcular con la tecla Enter
    document.getElementById('metros').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            mostrarResultados();
        }
    });
    // Código para el recomendador de boquillas
    const superficieSelect = document.getElementById('superficie');
    const sep5Radio = document.getElementById('sep5');
    const sep6Radio = document.getElementById('sep6');
    const boquillaWarning = document.getElementById('boquillaWarning');
    const boquillaResultados = document.getElementById('boquillaResultados');

    function updateBoquillaOptions() {
        const superficie = superficieSelect.value;

        if (superficie === 'bañera') {
            // Deshabilitar las opciones de 5mm y 6mm
            sep5Radio.disabled = true;
            sep6Radio.disabled = true;
            boquillaWarning.style.display = 'flex';

            // Si están seleccionadas, deseleccionar
            if (sep5Radio.checked) {
                sep5Radio.checked = false;
            }
            if (sep6Radio.checked) {
                sep6Radio.checked = false;
            }
        } else {
            // Habilitar las opciones
            sep5Radio.disabled = false;
            sep6Radio.disabled = false;
            boquillaWarning.style.display = 'none';
        }
    }

    superficieSelect.addEventListener('change', updateBoquillaOptions);

    // Inicializar las opciones
    updateBoquillaOptions();
});

// Actualizar la función mostrarResultados
function mostrarResultados() {
    // ... código existente ...

    // Cálculo para la boquilla
    const superficie = document.getElementById('superficie').value;
    const separacion = parseFloat(document.querySelector('input[name="separacion"]:checked').value);
    const metros = parseFloat(metrosInput);

    // Calcular sacos de boquilla (metros / 14)
    const sacosBoquilla = Math.ceil(metros / 14);

    // Determinar el tipo de boquilla
    let tipoBoquilla = '';
    let boquillaClass = '';

    if (superficie === 'bañera') {
        tipoBoquilla = 'SIN ARENA (Bañera)';
    } else if (separacion >= 1.2 && separacion <= 3) {
        tipoBoquilla = 'SIN ARENA (Separación 1.2-3mm)';
    } else if (separacion > 3) {
        tipoBoquilla = 'CON ARENA (Separación >3mm)';
        boquillaClass = 'with-sand';
    }

    // Mostrar resultados de boquilla
    document.getElementById('tipoBoquilla').textContent = tipoBoquilla;
    document.getElementById('sacosBoquilla').textContent = sacosBoquilla;
    document.getElementById('calculoBoquilla').textContent = `${metros} m² ÷ 14 = ${sacosBoquilla} sacos`;

    boquillaResultados.className = 'boquilla-results ' + boquillaClass;
    boquillaResultados.style.display = 'block';
});
