// Variables globales
const API_ENDPOINT = '/api/submit-order';

// Cache DOM elements
let form, submitBtn, messageContainer, messageContent;

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
    
    // Agregar evento de submit al formulario
    form.addEventListener('submit', handleFormSubmit);
    
    // Agregar evento de reset para limpiar mensajes
    form.addEventListener('reset', handleFormReset);
    
    // Agregar validación en tiempo real
    addRealTimeValidation();
}

// Manejar el envío del formulario - Optimizado para velocidad
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validar formulario rápidamente
    if (!validateForm()) {
        showMessage('Por favor, complete todos los campos requeridos.', 'error');
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
                form.reset();
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

// Validar formulario - Optimizado
function validateForm() {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('invalid');
        } else {
            field.classList.remove('invalid');
        }
    });
    
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
    
    const quantity = document.getElementById('medicationQuantity');
    if (quantity?.value && parseInt(quantity.value) < 1) {
        isValid = false;
        quantity.classList.add('invalid');
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
    
    return data;
}

// Generar ID único para el pedido
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
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
    hideMessage();
    // Limpiar clases de validación
    const allFields = form.querySelectorAll('input, select, textarea');
    allFields.forEach(field => {
        field.classList.remove('invalid');
    });
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
        generateOrderId
    };
}
