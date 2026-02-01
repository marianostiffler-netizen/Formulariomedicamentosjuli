// Variables globales
const GOOGLE_SCRIPTS_URL = 'https://script.google.com/macros/s/TU_SCRIPT_ID_AQUI/exec'; // Reemplazar con tu URL
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGkcrXq1qz_W83RDzBZRB2dLgCBQ5eitedXZpAtSQblhCU4OG1WCNehilXhDy_QLjBlGcjBHH0u660/pub?output=csv';
const WHATSAPP_PHONE = '54911XXXXXXXXXX';

// Lista de medicamentos (se cargará dinámicamente)
let MEDICATIONS_WITH_PRICES = [];

// Cache DOM elements
let form, messageContainer, messageContent, whatsappButton;
let medicationQuantities = {};
let cartItems = [];

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
});

// Inicializar el formulario
async function initializeForm() {
    // Cache elements para mejor rendimiento
    form = document.getElementById('orderForm');
    messageContainer = document.getElementById('messageContainer');
    messageContent = document.getElementById('messageContent');
    whatsappButton = document.getElementById('whatsappButton');
    
    // Cargar medicamentos desde Google Sheets
    await loadMedicationsFromGoogleSheets();
    
    // Inicializar búsqueda
    initializeSearch();
    
    // Agregar evento de submit al formulario
    form.addEventListener('submit', handleFormSubmit);
    
    // Agregar evento de reset para limpiar mensajes
    form.addEventListener('reset', handleFormReset);
    
    // Agregar validación en tiempo real
    addRealTimeValidation();

    if (whatsappButton) {
        whatsappButton.addEventListener('click', openWhatsApp);
        whatsappButton.style.display = 'none';
    }
}

// Cargar medicamentos desde Google Sheets CSV
async function loadMedicationsFromGoogleSheets() {
    try {
        // Mostrar estado de carga
        showMessage('Cargando inventario...', 'loading');
        
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        // Parsear CSV
        const medications = parseCSV(csvText);
        
        if (medications.length === 0) {
            throw new Error('No se encontraron medicamentos en el inventario');
        }
        
        // Actualizar lista global
        MEDICATIONS_WITH_PRICES = medications;
        
        // Generar catálogo
        generateMedicationCatalog();
        
        // Ocultar mensaje de carga
        hideMessage();
        
        console.log(`Se cargaron ${medications.length} medicamentos exitosamente`);
        
    } catch (error) {
        console.error('Error al cargar medicamentos:', error);
        
        // Mostrar mensaje de error
        showMessage('Error al conectar con el inventario', 'error');
        
        // Cargar medicamentos de respaldo
        loadFallbackMedications();
    }
}

// Parsear CSV a array de objetos
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const medications = [];
    
    if (lines.length === 0) {
        return medications;
    }
    
    // Omitir header si existe
    const startIndex = lines[0].toLowerCase().includes('medicamento') || lines[0].toLowerCase().includes('producto') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parsear línea CSV (manejar comillas)
        const fields = parseCSVLine(line);
        
        if (fields.length >= 2) {
            const name = fields[0].trim();
            const priceStr = fields[1].trim();
            const price = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.'));
            
            if (name && !isNaN(price) && price > 0) {
                medications.push({
                    name: name,
                    price: price
                });
            }
        }
    }
    
    return medications;
}

// Parsear línea CSV individual (manejar comillas)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Cargar medicamentos de respaldo
function loadFallbackMedications() {
    MEDICATIONS_WITH_PRICES = [
        { name: "ACTRON 400 R.A", price: 3150 },
        { name: "ACTRON 600", price: 7290 },
        { name: "ACTRON MUJER", price: 3400 },
        { name: "AGUA OXIGENADA 10V", price: 450 },
        { name: "ALCOHOL 250cc", price: 680 },
        { name: "ALIKAL", price: 750 },
        { name: "ALIKAL LIMON", price: 750 },
        { name: "ALIKAL NARANJA", price: 750 },
        { name: "ANAFLEX PLUS", price: 2960 },
        { name: "ASPIRINETAS", price: 910 },
        { name: "AZUFRE", price: 320 },
        { name: "Amoxicilina FABOP", price: 1750 },
        { name: "BAYA C", price: 1040 },
        { name: "BAYA C Caliente", price: 1420 },
        { name: "BAYASPIRINA", price: 1820 },
        { name: "BAYASPIRINA FORTE", price: 2370 },
        { name: "BICARBONATO", price: 280 },
        { name: "BUSCAPINA COMPUESTA", price: 7870 },
        { name: "BUSCAPINA DUO", price: 7420 },
        { name: "BUSCAPINA FEM", price: 3290 },
        { name: "BUSCAPINA PERLAS", price: 5590 },
        { name: "BX7", price: 1250 },
        { name: "CAFIASPIRINA PLUS", price: 2580 },
        { name: "CAFIASPIRINA X 30", price: 2150 },
        { name: "CARBON", price: 630 },
        { name: "CURITAS", price: 450 },
        { name: "DICLO + PRIDINOL", price: 950 },
        { name: "DICLOFENAC 75 mg", price: 720 },
        { name: "DORIXINA", price: 2600 },
        { name: "FEEN A MINT", price: 3680 },
        { name: "FUEGOLANDIA", price: 890 },
        { name: "GASAS", price: 320 },
        { name: "GENIOL 1Gr", price: 1810 },
        { name: "GENIOL 500mg", price: 1350 },
        { name: "GENIOL PLUS Rap. Acc.", price: 2440 },
        { name: "HEPATALGINA", price: 4340 },
        { name: "HEPATALGINA GOTAS", price: 6310 },
        { name: "IBUEVANOL FORTE", price: 2830 },
        { name: "IBUEVANOL MAX", price: 3420 },
        { name: "IBUEVANOL PLUS", price: 2350 },
        { name: "IBUEVANOL RAP. ACC.", price: 2150 },
        { name: "IBUPIRAC", price: 2430 },
        { name: "IBUPIRAC 600", price: 6090 },
        { name: "IBUPIRAC MIGRA", price: 6610 },
        { name: "IBUPIRETA JR.", price: 4260 },
        { name: "IBUPROFENO 400 mg. TRB", price: 650 },
        { name: "IBUPROFENO 600 mg. TRB", price: 940 },
        { name: "KETEROLAC", price: 700 },
        { name: "KETEROLAC SUBLINGUAL", price: 600 },
        { name: "LORATADINA", price: 600 },
        { name: "MANTECA DE CACAO", price: 380 },
        { name: "MEJORAL P NIÑOS", price: 2690 },
        { name: "MIGRAL COMP.", price: 4420 },
        { name: "MYLANTA", price: 3320 },
        { name: "NEXT PLUS", price: 3470 },
        { name: "NOVALGINA", price: 6450 },
        { name: "OMEPRAZOL", price: 870 },
        { name: "PARACETAMOL", price: 650 },
        { name: "PARACETAMOL 1GR", price: 890 },
        { name: "PAÑUELOS DESCARTABLES", price: 280 },
        { name: "PAÑUELOS ELITE 6X10", price: 520 },
        { name: "PONSTIL FORTE", price: 3850 },
        { name: "QURA PLUS", price: 2180 },
        { name: "REFENAX GOTAS NASALES", price: 980 },
        { name: "REFRIANEX", price: 1240 },
        { name: "RENNIE", price: 1560 },
        { name: "RESAQUIT", price: 1820 },
        { name: "SERTAL CTO", price: 2890 },
        { name: "SERTAL PERLAS", price: 3240 },
        { name: "SUERO FISIOLOGICO", price: 420 },
        { name: "TAFIROL", price: 780 },
        { name: "TAFIROL 1 G", price: 1120 },
        { name: "TAFIROL DUO", price: 1450 },
        { name: "TAFIROL FORTE", price: 1680 },
        { name: "TAFIROL MIGRA", price: 2340 },
        { name: "TAFIROL PLUS", price: 1890 },
        { name: "TARROS", price: 350 },
        { name: "TE NEXT", price: 920 },
        { name: "TE NEXT PLUS", price: 1180 },
        { name: "TE VENT3", price: 850 },
        { name: "TE VENT3 PLUS", price: 1080 },
        { name: "TE VICK", price: 780 },
        { name: "TE VICK FORTE", price: 960 },
        { name: "TETRALGIN", price: 1420 },
        { name: "UVASAL", price: 680 },
        { name: "UVASAL LIM", price: 680 },
        { name: "UVASAL NJA", price: 680 }
    ];
    
    // Generar catálogo con datos de respaldo
    generateMedicationCatalog();
    
    // Ocultar mensaje de error después de 3 segundos
    setTimeout(() => {
        hideMessage();
    }, 3000);
}

// Inicializar búsqueda
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    // Evento de búsqueda
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // Mostrar/ocultar botón de limpiar
        clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
        
        // Filtrar medicamentos
        filterMedications(searchTerm);
    });
    
    // Evento de limpiar búsqueda
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        filterMedications('');
        searchInput.focus();
    });
}

// Filtrar medicamentos
function filterMedications(searchTerm) {
    const grid = document.getElementById('medicationsGrid');
    const cards = grid.querySelectorAll('.medication-card');
    let visibleCount = 0;
    
    cards.forEach((card, index) => {
        const medication = MEDICATIONS_WITH_PRICES[index];
        const isVisible = medication.name.toLowerCase().includes(searchTerm);
        
        if (isVisible) {
            card.classList.remove('hidden');
            visibleCount++;
        } else {
            card.classList.add('hidden');
        }
    });
    
    // Mostrar mensaje de no resultados
    showNoResultsMessage(visibleCount === 0);
}

// Mostrar mensaje de no resultados
function showNoResultsMessage(show) {
    const grid = document.getElementById('medicationsGrid');
    let noResultsMsg = grid.querySelector('.no-results');
    
    if (show && !noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results';
        noResultsMsg.textContent = 'No se encontraron medicamentos';
        grid.appendChild(noResultsMsg);
    } else if (!show && noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Generar catálogo de medicamentos con precios
function generateMedicationCatalog() {
    const grid = document.getElementById('medicationsGrid');
    
    // Evitar duplicados si se vuelve a cargar el inventario
    grid.innerHTML = '';
    medicationQuantities = {};
    
    MEDICATIONS_WITH_PRICES.forEach((medication, index) => {
        const card = createMedicationCard(medication, index);
        grid.appendChild(card);
        
        // Inicializar cantidad en 0
        medicationQuantities[medication.name] = 0;
    });

    updateCartSummary();
    updateOrderSummary();
}

// Crear tarjeta de medicamento con precio
function createMedicationCard(medication, index) {
    const card = document.createElement('div');
    card.className = 'medication-card';
    card.id = `med-${index}`;
    
    card.innerHTML = `
        <div class="medication-price">$${medication.price.toLocaleString('es-AR')}</div>
        <div class="quantity-badge" id="badge-${index}">0</div>
        <div class="medication-name">${medication.name}</div>
        <div class="medication-description">Medicamento de venta libre</div>
        <div class="quantity-selector">
            <button type="button" class="quantity-btn" onclick="decreaseQuantity('${medication.name}', ${index})" id="decrease-${index}" disabled>-</button>
            <div class="quantity-display" id="quantity-${index}">0</div>
            <button type="button" class="quantity-btn" onclick="increaseQuantity('${medication.name}', ${index})" id="increase-${index}">+</button>
        </div>
    `;
    
    // Agregar animación escalonada
    card.style.animationDelay = `${index * 0.01}s`;
    
    return card;
}

// Incrementar cantidad
function increaseQuantity(medicationName, index) {
    medicationQuantities[medicationName]++;
    updateQuantityDisplay(medicationName, index);
    updateCartSummary();
}

// Decrementar cantidad
function decreaseQuantity(medicationName, index) {
    if (medicationQuantities[medicationName] > 0) {
        medicationQuantities[medicationName]--;
        updateQuantityDisplay(medicationName, index);
        updateCartSummary();
    }
}

// Actualizar display de cantidad
function updateQuantityDisplay(medicationName, index) {
    const quantity = medicationQuantities[medicationName];
    const card = document.getElementById(`med-${index}`);
    const quantityDisplay = document.getElementById(`quantity-${index}`);
    const decreaseBtn = document.getElementById(`decrease-${index}`);
    const badge = document.getElementById(`badge-${index}`);
    const priceDisplay = card.querySelector('.medication-price');
    
    // Actualizar display
    quantityDisplay.textContent = quantity;
    badge.textContent = quantity;
    
    // Actualizar estado del botón decrease
    decreaseBtn.disabled = quantity === 0;
    
    // Actualizar estado visual de la tarjeta
    if (quantity > 0) {
        card.classList.add('has-quantity');
        // Ocultar precio y mostrar badge
        priceDisplay.style.display = 'none';
        badge.style.display = 'flex';
    } else {
        card.classList.remove('has-quantity');
        // Mostrar precio y ocultar badge
        priceDisplay.style.display = 'block';
        badge.style.display = 'none';
    }
    
    // Actualizar resumen
    updateOrderSummary();
}

// Actualizar resumen del pedido
function updateOrderSummary() {
    const floatingCart = document.getElementById('floatingCart');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    // Obtener medicamentos con cantidad > 0
    const selectedMedications = Object.entries(medicationQuantities)
        .filter(([_, quantity]) => quantity > 0);
    
    if (selectedMedications.length === 0) {
        floatingCart.style.display = 'none';
        if (whatsappButton) whatsappButton.style.display = 'none';
        return;
    }
    
    // Mostrar carrito flotante
    floatingCart.style.display = 'flex';
    
    // Calcular total de items y precio
    let totalItems = 0;
    let totalPrice = 0;
    
    selectedMedications.forEach(([medicationName, quantity]) => {
        totalItems += quantity;
        const medication = MEDICATIONS_WITH_PRICES.find(m => m.name === medicationName);
        if (medication) {
            totalPrice += medication.price * quantity;
        }
    });
    
    // Actualizar contador y total
    cartCount.textContent = totalItems;
    cartTotal.textContent = `$${totalPrice.toLocaleString('es-AR')}`;

    if (whatsappButton) whatsappButton.style.display = 'block';
}

// Actualizar carrito de compras detallado
function updateCartSummary() {
    const cartItemsContainer = document.getElementById('cartItems');
    const totalItemsCount = document.getElementById('totalItemsCount');
    const totalPriceElement = document.getElementById('totalPrice');
    
    // Obtener medicamentos con cantidad > 0
    const selectedMedications = Object.entries(medicationQuantities)
        .filter(([_, quantity]) => quantity > 0);
    
    // Limpiar carrito actual
    cartItemsContainer.innerHTML = '';
    
    if (selectedMedications.length === 0) {
        totalItemsCount.textContent = '0';
        totalPriceElement.textContent = '$0.00';
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Tu carrito está vacío</p>';
        if (whatsappButton) whatsappButton.style.display = 'none';
        return;
    }
    
    // Calcular totales
    let totalItems = 0;
    let totalPrice = 0;
    
    // Crear items del carrito
    selectedMedications.forEach(([medicationName, quantity]) => {
        const medication = MEDICATIONS_WITH_PRICES.find(m => m.name === medicationName);
        if (medication) {
            totalItems += quantity;
            totalPrice += medication.price * quantity;
            
            // Crear item del carrito
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-name">${medicationName}</div>
                <div class="cart-item-details">
                    <span class="cart-item-quantity">x${quantity}</span>
                    <span class="cart-item-price">$${(medication.price * quantity).toLocaleString('es-AR')}</span>
                    <button class="cart-item-remove" onclick="removeFromCart('${medicationName}')">✕</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        }
    });
    
    // Actualizar totales
    totalItemsCount.textContent = totalItems;
    totalPriceElement.textContent = `$${totalPrice.toLocaleString('es-AR')}`;

    if (whatsappButton) whatsappButton.style.display = 'block';
}

// Remover del carrito
function removeFromCart(medicationName) {
    const index = MEDICATIONS_WITH_PRICES.findIndex(m => m.name === medicationName);
    if (index !== -1) {
        medicationQuantities[medicationName] = 0;
        updateQuantityDisplay(medicationName, index);
        updateCartSummary();
    }
}

// Manejar el envío del formulario - Optimizado para Google Sheets
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
        showMessage('Por favor, complete todos los campos requeridos y seleccione al menos un medicamento.', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const formData = getFormData();
    
    // Mostrar estado de carga inmediato
    setLoadingState(true);
    showMessage('Enviando pedido a Google Sheets...', 'loading');
    
    try {
        // Enviar datos a Google Apps Script
        const response = await fetch(GOOGLE_SCRIPTS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            mode: 'no-cors' // Necesario para Google Apps Script
        });
        
        showMessage('✅ ¡Pedido enviado correctamente a Google Sheets! Nos contactaremos pronto.', 'success');
        
        // Resetear formulario después de 2 segundos
        setTimeout(() => {
            resetForm();
            hideMessage();
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        
        // Fallback: mostrar datos para copiar manualmente
        const fallbackData = {
            ...formData,
            timestamp: new Date().toLocaleString('es-AR'),
            status: 'manual_copy'
        };
        
        showMessage(`❌ Error de conexión. Por favor, copia estos datos y envialos manualmente:\n\n${JSON.stringify(fallbackData, null, 2)}`, 'error');
        
        // También guardar en localStorage como backup
        localStorage.setItem('pendingOrder', JSON.stringify(fallbackData));
        
    } finally {
        // Restaurar estado del botón
        setLoadingState(false);
    }
}

// Validar formulario - Optimizado
function validateForm() {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    // Validar campos requeridos
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('invalid');
        } else {
            field.classList.remove('invalid');
        }
    });
    
    // Validar que haya al menos un medicamento seleccionado
    const hasMedications = Object.values(medicationQuantities).some(qty => qty > 0);
    if (!hasMedications) {
        isValid = false;
    }
    
    // Validaciones específicas optimizadas
    const email = document.getElementById('patientEmail');
    if (email?.value && !isValidEmail(email.value)) {
        isValid = false;
        email.classList.add('invalid');
    }
    
    const phone = document.getElementById('patientPhone');
    if (phone?.value && !isValidPhone(phone.value)) {
        isValid = false;
        phone.classList.add('invalid');
    }
    
    return isValid;
}

// Obtener datos del formulario - Optimizado para Google Sheets
function getFormData() {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Agregar metadata
    data.timestamp = new Date().toISOString();
    data.orderId = generateOrderId();
    data.date = new Date().toLocaleDateString('es-AR');
    data.time = new Date().toLocaleTimeString('es-AR');
    
    // Agregar medicamentos seleccionados (solo los que tienen cantidad > 0)
    const selectedMedications = Object.entries(medicationQuantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([medication, quantity]) => `${medication} (x${quantity})`);
    
    data.medicamentos = selectedMedications.join(', ');
    data.totalItems = selectedMedications.length;
    data.totalQuantity = Object.values(medicationQuantities).reduce((sum, qty) => sum + qty, 0);
    
    // Formatear para Google Sheets (columnas específicas)
    return {
        orderId: data.orderId,
        fecha: data.date,
        hora: data.time,
        nombre: data.patientName || '',
        dni: data.patientDNI || '',
        telefono: data.patientPhone || '',
        email: data.patientEmail || '',
        medicamentos: data.medicamentos,
        totalItems: data.totalItems,
        totalUnidades: data.totalQuantity,
        timestamp: data.timestamp
    };
}

// Generar ID único para el pedido
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `NEUTRON-${timestamp}-${random}`;
}

// Resetear formulario completamente
function resetForm() {
    form.reset();
    
    // Resetear cantidades de medicamentos
    Object.keys(medicationQuantities).forEach(medication => {
        medicationQuantities[medication] = 0;
    });
    
    // Actualizar todos los displays
    MEDICATIONS_WITH_PRICES.forEach((medication, index) => {
        updateQuantityDisplay(medication.name, index);
    });
    
    // Ocultar carrito flotante
    document.getElementById('floatingCart').style.display = 'none';

    if (whatsappButton) whatsappButton.style.display = 'none';
    
    // Limpiar búsqueda
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').style.display = 'none';
    filterMedications('');
    
    // Limpiar validación
    const allFields = form.querySelectorAll('input, select, textarea');
    allFields.forEach(field => {
        field.classList.remove('invalid');
    });
}

function buildWhatsAppMessage() {
    const name = document.getElementById('patientName')?.value?.trim() || '';
    const dni = document.getElementById('patientDNI')?.value?.trim() || '';
    const phone = document.getElementById('patientPhone')?.value?.trim() || '';
    const email = document.getElementById('patientEmail')?.value?.trim() || '';

    const selected = Object.entries(medicationQuantities)
        .filter(([_, qty]) => qty > 0);

    let totalPrice = 0;
    const lines = selected.map(([medicationName, qty]) => {
        const medication = MEDICATIONS_WITH_PRICES.find(m => m.name === medicationName);
        const unit = medication?.price || 0;
        const subtotal = unit * qty;
        totalPrice += subtotal;
        return `- ${medicationName} x${qty} ($${subtotal.toLocaleString('es-AR')})`;
    });

    const header = 'Pedido FARMA RAYO';
    const customerLines = [
        name ? `Nombre: ${name}` : null,
        dni ? `DNI: ${dni}` : null,
        phone ? `Tel: ${phone}` : null,
        email ? `Email: ${email}` : null
    ].filter(Boolean);

    const body = [
        header,
        ...customerLines,
        '',
        'Productos:',
        ...lines,
        '',
        `Total: $${totalPrice.toLocaleString('es-AR')}`
    ].join('\n');

    return body;
}

function openWhatsApp() {
    const hasMedications = Object.values(medicationQuantities).some(qty => qty > 0);
    if (!hasMedications) {
        showMessage('Seleccioná al menos un medicamento para enviar por WhatsApp.', 'error');
        return;
    }

    const text = encodeURIComponent(buildWhatsAppMessage());
    const phone = String(WHATSAPP_PHONE || '').replace(/\D/g, '');

    if (!phone) {
        showMessage('Configurá el número de WhatsApp en WHATSAPP_PHONE.', 'error');
        return;
    }

    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

// Establecer estado de carga
function setLoadingState(isLoading) {
    const cartCheckoutBtn = document.querySelector('.cart-checkout-btn');
    
    if (isLoading) {
        cartCheckoutBtn.disabled = true;
        cartCheckoutBtn.classList.add('loading');
        cartCheckoutBtn.innerHTML = '<span class="loading"></span>Enviando...';
    } else {
        cartCheckoutBtn.disabled = false;
        cartCheckoutBtn.classList.remove('loading');
        cartCheckoutBtn.innerHTML = 'Enviar Pedido';
    }
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar teléfono
function isValidPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
}

// Validar DNI
function isValidDNI(dni) {
    const dniRegex = /^\d{7,8}$/;
    return dniRegex.test(dni);
}

// Mostrar mensaje - Optimizado
function showMessage(message, type) {
    // Limpiar clases anteriores
    messageContainer.className = 'message-container';
    messageContainer.classList.add(`message-${type}`);
    
    // Agregar contenido con spinner si es loading
    if (type === 'loading') {
        messageContent.innerHTML = `<span class="loading"></span>${message}`;
    } else {
        messageContent.textContent = message;
    }
    
    // Mostrar contenedor
    messageContainer.style.display = 'block';
    
    // Hacer scroll al mensaje solo si no es loading
    if (type !== 'loading') {
        setTimeout(() => {
            messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Ocultar mensaje
function hideMessage() {
    messageContainer.style.display = 'none';
}

// Manejar reset del formulario
function handleFormReset() {
    resetForm();
    hideMessage();
}

// Agregar validación en tiempo real - Optimizado
function addRealTimeValidation() {
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach(field => {
        // Validar al salir del campo (debounced)
        let timeout;
        field.addEventListener('blur', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => validateField(field), 100);
        });

        // Limpiar validación al empezar a editar
        field.addEventListener('input', function() {
            field.classList.remove('invalid');
            clearTimeout(timeout);
            validatePositiveNumber(field);  // Add positive number validation
        });
    });
}

// Validar campo individual
function validateField(field) {
    let isValid = true;
    
    // Validar campos requeridos
    if (field.hasAttribute('required') && !field.value.trim()) {
        isValid = false;
    }
    
    // Validaciones específicas por tipo
    switch (field.type) {
        case 'email':
            if (field.value && !isValidEmail(field.value)) {
                isValid = false;
            }
            break;
        case 'tel':
            if (field.value && !isValidPhone(field.value)) {
                isValid = false;
            }
            break;
        case 'number':
            if (field.value && parseInt(field.value) < 1) {
                isValid = false;
            }
            break;
    }
    
    // Agregar o quitar clase de inválido
    if (!isValid) {
        field.classList.add('invalid');
    } else {
        field.classList.remove('invalid');
    }
    
    return isValid;
}

// Add real-time validation for positive numbers in quantity fields
function validatePositiveNumber(field) {
    if (field.type === 'number' && parseInt(field.value) < 1) {
        field.setCustomValidity('Please enter a positive number.');
    } else {
        field.setCustomValidity('');
    }
}

// Utilidad para formatear teléfono mientras se escribe
document.getElementById('patientPhone')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        if (value.length <= 4) {
            e.target.value = value;
        } else if (value.length <= 7) {
            e.target.value = `${value.slice(0, 4)}-${value.slice(4)}`;
        } else {
            e.target.value = `${value.slice(0, 4)}-${value.slice(4, 7)}-${value.slice(7, 10)}`;
        }
    }
});

// Utilidad para formatear DNI
document.getElementById('patientDNI')?.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

// Exportar funciones para testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        getFormData,
        isValidEmail,
        isValidPhone,
        generateOrderId,
        medicationQuantities
    };
}
