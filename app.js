// Variables globales
const API_ENDPOINT = '/api/submit-order';

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
});

// Inicializar el formulario
function initializeForm() {
    const form = document.getElementById('orderForm');
    
    // Agregar evento de submit al formulario
    form.addEventListener('submit', handleFormSubmit);
    
    // Agregar evento de reset para limpiar mensajes
    form.addEventListener('reset', handleFormReset);
    
    // Agregar validación en tiempo real
    addRealTimeValidation();
}

// Manejar el envío del formulario
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
        showMessage('Por favor, complete todos los campos requeridos correctamente.', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const formData = getFormData();
    
    // Mostrar mensaje de carga
    showMessage('Enviando pedido...', 'loading');
    
    try {
        // Enviar datos a la API
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Éxito
            showMessage('¡Pedido enviado correctamente! Nos contactaremos pronto.', 'success');
            // Resetear formulario después de 2 segundos
            setTimeout(() => {
                document.getElementById('orderForm').reset();
                hideMessage();
            }, 3000);
        } else {
            // Error del servidor
            throw new Error(result.message || 'Error al enviar el pedido');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage(`Error: ${error.message}`, 'error');
    }
}

// Validar formulario
function validateForm() {
    const form = document.getElementById('orderForm');
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
    
    // Validaciones específicas
    const email = document.getElementById('patientEmail');
    if (email.value && !isValidEmail(email.value)) {
        isValid = false;
        email.classList.add('invalid');
    }
    
    const phone = document.getElementById('patientPhone');
    if (phone.value && !isValidPhone(phone.value)) {
        isValid = false;
        phone.classList.add('invalid');
    }
    
    const quantity = document.getElementById('medicationQuantity');
    if (quantity.value && parseInt(quantity.value) < 1) {
        isValid = false;
        quantity.classList.add('invalid');
    }
    
    return isValid;
}

// Obtener datos del formulario
function getFormData() {
    const form = document.getElementById('orderForm');
    const formData = new FormData(form);
    
    // Convertir FormData a objeto y agregar timestamp
    const data = Object.fromEntries(formData.entries());
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

// Mostrar mensaje
function showMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    const messageContent = document.getElementById('messageContent');
    
    // Limpiar clases anteriores
    messageContainer.className = 'message-container';
    
    // Agregar clase según el tipo
    messageContainer.classList.add(`message-${type}`);
    
    // Agregar spinner si es loading
    if (type === 'loading') {
        messageContent.innerHTML = `<span class="loading"></span>${message}`;
    } else {
        messageContent.textContent = message;
    }
    
    // Mostrar contenedor
    messageContainer.style.display = 'block';
    
    // Hacer scroll al mensaje
    messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Ocultar mensaje
function hideMessage() {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.style.display = 'none';
}

// Manejar reset del formulario
function handleFormReset() {
    hideMessage();
    // Limpiar clases de validación
    const form = document.getElementById('orderForm');
    const allFields = form.querySelectorAll('input, select, textarea');
    allFields.forEach(field => {
        field.classList.remove('invalid');
    });
}

// Agregar validación en tiempo real
function addRealTimeValidation() {
    const form = document.getElementById('orderForm');
    const fields = form.querySelectorAll('input, select, textarea');
    
    fields.forEach(field => {
        // Validar al salir del campo
        field.addEventListener('blur', function() {
            validateField(field);
        });
        
        // Limpiar validación al empezar a editar
        field.addEventListener('input', function() {
            field.classList.remove('invalid');
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
