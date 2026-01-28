// Variables globales
const API_ENDPOINT = '/api/submit-order';

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
    
    // Agregar evento de submit al formulario
    form.addEventListener('submit', handleFormSubmit);
    
    // Agregar evento de reset para limpiar mensajes
    form.addEventListener('reset', handleFormReset);
    
    // Agregar validación en tiempo real
    addRealTimeValidation();
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
    card.style.animationDelay = `${index * 0.02}s`;
    
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
    const summarySection = document.getElementById('orderSummary');
    const summaryContent = document.getElementById('summaryContent');
    
    // Obtener medicamentos con cantidad > 0
    const selectedMedications = Object.entries(medicationQuantities)
        .filter(([_, quantity]) => quantity > 0);
    
    if (selectedMedications.length === 0) {
        summarySection.style.display = 'none';
        return;
    }
    
    // Mostrar sección de resumen
    summarySection.style.display = 'block';
    
    // Generar HTML del resumen
    let summaryHTML = '';
    let totalItems = 0;
    
    selectedMedications.forEach(([medication, quantity]) => {
        summaryHTML += `
            <div class="summary-item">
                <div class="summary-medication">${medication}</div>
                <div class="summary-quantity">${quantity}</div>
            </div>
        `;
        totalItems += quantity;
    });
    
    summaryHTML += `
        <div class="summary-total">
            <span>Total de productos:</span>
            <span>${totalItems}</span>
        </div>
    `;
    
    summaryContent.innerHTML = summaryHTML;
}

// Manejar el envío del formulario - Optimizado para velocidad
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
    showMessage('Enviando pedido...', 'loading');
    
    // Timeout para evitar esperas infinitas
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tiempo de espera agotado')), 10000)
    );
    
    try {
        // Enviar datos a la API con timeout
        const response = await Promise.race([
            fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            }),
            timeoutPromise
        ]);
        
        const result = await response.json();
        
        if (response.ok) {
            // Éxito inmediato
            showMessage('¡Pedido enviado correctamente! Nos contactaremos pronto.', 'success');
            // Resetear formulario después de 2 segundos
            setTimeout(() => {
                resetForm();
                hideMessage();
            }, 2000);
        } else {
            // Error del servidor
            throw new Error(result.message || 'Error al enviar el pedido');
        }
        
    } catch (error) {
        console.error('Error:', error);
        let errorMessage = 'Error de conexión. Intente nuevamente.';
        
        if (error.message === 'Tiempo de espera agotado') {
            errorMessage = 'El servidor está tardando demasiado. Intente nuevamente.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showMessage(errorMessage, 'error');
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

// Obtener datos del formulario - Optimizado
function getFormData() {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Agregar metadata
    data.timestamp = new Date().toISOString();
    data.orderId = generateOrderId();
    
    // Agregar medicamentos seleccionados (solo los que tienen cantidad > 0)
    const selectedMedications = Object.entries(medicationQuantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([medication, quantity]) => `${medication} (x${quantity})`);
    
    data.medicamentos = selectedMedications.join(', ');
    data.totalItems = selectedMedications.length;
    
    return data;
}

// Generar ID único para el pedido
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
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
    
    // Ocultar resumen
    document.getElementById('orderSummary').style.display = 'none';
    
    // Limpiar validación
    const allFields = form.querySelectorAll('input, select, textarea');
    allFields.forEach(field => {
        field.classList.remove('invalid');
    });
}

// Establecer estado de carga
function setLoadingState(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<span class="loading"></span>Enviando...';
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = 'Enviar Pedido';
    }
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar teléfono
function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
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
