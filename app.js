// Variables globales
const GOOGLE_SCRIPTS_URL = 'https://script.google.com/macros/s/TU_SCRIPT_ID_AQUI/exec'; // Reemplazar con tu URL

// Lista completa de medicamentos
const MEDICATIONS = [
    "ACTRON 400 R.A","ACTRON 600","ACTRON MUJER","AGUA OXIGENADA 10V","ALCOHOL 250cc","ALIKAL","ALIKAL LIMON","ALIKAL NARANJA","ANAFLEX PLUS","ASPIRINETAS","AZUFRE","Amoxicilina FABOP","BAYA C","BAYA C Caliente","BAYASPIRINA","BAYASPIRINA FORTE","BICARBONATO","BUSCAPINA COMPUESTA","BUSCAPINA DUO","BUSCAPINA FEM","BUSCAPINA PERLAS","BX7","CAFIASPIRINA PLUS","CAFIASPIRINA X 30","CARBON","CURITAS","DICLO + PRIDINOL","DICLOFENAC 75 mg","DORIXINA","FEEN A MINT","FUEGOLANDIA","GASAS","GENIOL 1Gr","GENIOL 500mg","GENIOL PLUS Rap. Acc.","HEPATALGINA","HEPATALGINA GOTAS","IBUEVANOL FORTE","IBUEVANOL MAX","IBUEVANOL PLUS","IBUEVANOL RAP. ACC.","IBUPIRAC","IBUPIRAC 600","IBUPIRAC MIGRA","IBUPIRETA JR.","IBUPROFENO 400 mg. TRB","IBUPROFENO 600 mg. TRB","KETEROLAC","KETEROLAC SUBLINGUAL","LORATADINA","MANTECA DE CACAO","MEJORAL P NIÑOS","MIGRAL COMP.","MYLANTA","NEXT PLUS","NOVALGINA","OMEPRAZOL","PARACETAMOL","PARACETAMOL 1GR","PAÑUELOS DESCARTABLES","PAÑUELOS ELITE 6X10","PONSTIL FORTE","QURA PLUS","REFENAX GOTAS NASALES","REFRIANEX","RENNIE","RESAQUIT","SERTAL CTO","SERTAL PERLAS","SUERO FISIOLOGICO","TAFIROL","TAFIROL 1 G","TAFIROL DUO","TAFIROL FORTE","TAFIROL MIGRA","TAFIROL PLUS","TARROS","TE NEXT","TE NEXT PLUS","TE VENT3","TE VENT3 PLUS","TE VICK","TE VICK FORTE","TETRALGIN","UVASAL","UVASAL LIM","UVASAL NJA"
];

// Cache DOM elements
let form, submitBtn, messageContainer, messageContent;
let medicationQuantities = {};

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
});

// Inicializar el formulario
function initializeForm() {
    // Cache elements para mejor rendimiento
    form = document.getElementById('orderForm');
    submitBtn = form.querySelector('[type="submit"]');
    messageContainer = document.getElementById('messageContainer');
    messageContent = document.getElementById('messageContent');
    
    // Generar catálogo de medicamentos
    generateMedicationCatalog();
    
    // Inicializar búsqueda
    initializeSearch();
    
    // Agregar evento de submit al formulario
    form.addEventListener('submit', handleFormSubmit);
    
    // Agregar evento de reset para limpiar mensajes
    form.addEventListener('reset', handleFormReset);
    
    // Agregar validación en tiempo real
    addRealTimeValidation();
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
        const medication = MEDICATIONS[index];
        const isVisible = medication.toLowerCase().includes(searchTerm);
        
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

// Generar catálogo de medicamentos
function generateMedicationCatalog() {
    const grid = document.getElementById('medicationsGrid');
    
    MEDICATIONS.forEach((medication, index) => {
        const card = createMedicationCard(medication, index);
        grid.appendChild(card);
        
        // Inicializar cantidad en 0
        medicationQuantities[medication] = 0;
    });
}

// Crear tarjeta de medicamento
function createMedicationCard(medication, index) {
    const card = document.createElement('div');
    card.className = 'medication-card';
    card.id = `med-${index}`;
    
    card.innerHTML = `
        <div class="quantity-badge" id="badge-${index}">0</div>
        <div class="medication-name">${medication}</div>
        <div class="quantity-selector">
            <button type="button" class="quantity-btn" onclick="decreaseQuantity('${medication}', ${index})" id="decrease-${index}" disabled>-</button>
            <div class="quantity-display" id="quantity-${index}">0</div>
            <button type="button" class="quantity-btn" onclick="increaseQuantity('${medication}', ${index})" id="increase-${index}">+</button>
        </div>
    `;
    
    // Agregar animación escalonada
    card.style.animationDelay = `${index * 0.01}s`;
    
    return card;
}

// Incrementar cantidad
function increaseQuantity(medication, index) {
    medicationQuantities[medication]++;
    updateQuantityDisplay(medication, index);
}

// Decrementar cantidad
function decreaseQuantity(medication, index) {
    if (medicationQuantities[medication] > 0) {
        medicationQuantities[medication]--;
        updateQuantityDisplay(medication, index);
    }
}

// Actualizar display de cantidad
function updateQuantityDisplay(medication, index) {
    const quantity = medicationQuantities[medication];
    const card = document.getElementById(`med-${index}`);
    const quantityDisplay = document.getElementById(`quantity-${index}`);
    const decreaseBtn = document.getElementById(`decrease-${index}`);
    const badge = document.getElementById(`badge-${index}`);
    
    // Actualizar display
    quantityDisplay.textContent = quantity;
    badge.textContent = quantity;
    
    // Actualizar estado del botón decrease
    decreaseBtn.disabled = quantity === 0;
    
    // Actualizar estado visual de la tarjeta
    if (quantity > 0) {
        card.classList.add('has-quantity');
    } else {
        card.classList.remove('has-quantity');
    }
    
    // Actualizar resumen
    updateOrderSummary();
}

// Actualizar resumen del pedido
function updateOrderSummary() {
    const floatingCart = document.getElementById('floatingCart');
    const cartCount = document.getElementById('cartCount');
    
    // Obtener medicamentos con cantidad > 0
    const selectedMedications = Object.entries(medicationQuantities)
        .filter(([_, quantity]) => quantity > 0);
    
    if (selectedMedications.length === 0) {
        floatingCart.style.display = 'none';
        return;
    }
    
    // Mostrar carrito flotante
    floatingCart.style.display = 'flex';
    
    // Calcular total de items
    const totalItems = selectedMedications.reduce((sum, [_, quantity]) => sum + quantity, 0);
    
    // Actualizar contador
    cartCount.textContent = totalItems;
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
    MEDICATIONS.forEach((medication, index) => {
        updateQuantityDisplay(medication, index);
    });
    
    // Ocultar carrito flotante
    document.getElementById('floatingCart').style.display = 'none';
    
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
