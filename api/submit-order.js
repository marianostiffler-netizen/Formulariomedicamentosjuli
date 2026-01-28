// Función serverless para procesar pedidos y guardar en Google Sheets
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Configuración
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_ID = process.env.SHEET_ID || '0'; // Hoja por defecto

// Parsear el service account del environment
let SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY;
try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    SERVICE_ACCOUNT_EMAIL = serviceAccount.client_email;
    PRIVATE_KEY = serviceAccount.private_key;
} catch (error) {
    console.error('Error parsing GOOGLE_SERVICE_ACCOUNT:', error);
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT format');
}

// Headers para CORS
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Manejar solicitudes OPTIONS para CORS
exports.handler = async function(event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parsear el body
        const data = JSON.parse(event.body);
        
        // Validar datos requeridos
        const validationResult = validateOrderData(data);
        if (!validationResult.isValid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Validation failed', 
                    details: validationResult.errors 
                })
            };
        }

        // Conectar a Google Sheets
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        
        // Autenticar con service account
        await doc.useServiceAccountAuth({
            client_email: SERVICE_ACCOUNT_EMAIL,
            private_key: PRIVATE_KEY,
        });
        
        // Cargar el documento
        await doc.loadInfo();
        
        // Obtener la hoja
        const sheet = doc.sheetsById[SHEET_ID] || doc.sheetsByIndex[0];
        
        // Asegurar que la hoja tenga los headers correctos
        await ensureSheetHeaders(sheet);
        
        // Preparar la fila para insertar
        const row = prepareRowData(data);
        
        // Insertar la fila
        await sheet.addRow(row);
        
        // Respuesta exitosa
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Pedido guardado correctamente',
                orderId: data.orderId,
                timestamp: data.timestamp
            })
        };
        
    } catch (error) {
        console.error('Error processing order:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

// Validar datos del pedido
function validateOrderData(data) {
    const errors = [];
    const requiredFields = [
        'patientName',
        'patientDNI', 
        'patientPhone',
        'patientEmail',
        'medicationName',
        'medicationDosage',
        'medicationQuantity',
        'medicationFrequency',
        'doctorName'
    ];
    
    // Verificar campos requeridos
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors.push(`El campo ${field} es requerido`);
        }
    });
    
    // Validar email
    if (data.patientEmail && !isValidEmail(data.patientEmail)) {
        errors.push('El email del paciente no es válido');
    }
    
    // Validar teléfono
    if (data.patientPhone && !isValidPhone(data.patientPhone)) {
        errors.push('El teléfono del paciente no es válido');
    }
    
    // Validar cantidad
    if (data.medicationQuantity && parseInt(data.medicationQuantity) < 1) {
        errors.push('La cantidad de medicamento debe ser mayor a 0');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Asegurar que la hoja tenga los headers correctos
async function ensureSheetHeaders(sheet) {
    const expectedHeaders = [
        'ID Pedido',
        'Timestamp',
        'Nombre Paciente',
        'DNI Paciente',
        'Teléfono Paciente',
        'Email Paciente',
        'Nombre Medicamento',
        'Dosificación',
        'Cantidad',
        'Frecuencia',
        'Médico Recetante',
        'Observaciones',
        'Estado'
    ];
    
    // Cargar headers actuales
    await sheet.loadHeaderRow();
    const currentHeaders = sheet.headerValues;
    
    // Si no hay headers o no coinciden, agregarlos
    if (currentHeaders.length === 0 || !headersMatch(currentHeaders, expectedHeaders)) {
        // Si hay datos, agregar nueva fila de headers
        if (sheet.rowCount > 0) {
            await sheet.addRow(expectedHeaders);
        } else {
            // Si está vacía, establecer headers
            await sheet.setHeaderRow(expectedHeaders);
        }
    }
}

// Verificar si los headers coinciden
function headersMatch(current, expected) {
    if (current.length !== expected.length) return false;
    return expected.every(header => current.includes(header));
}

// Preparar datos para la fila
function prepareRowData(data) {
    return {
        'ID Pedido': data.orderId || '',
        'Timestamp': data.timestamp || new Date().toISOString(),
        'Nombre Paciente': data.patientName || '',
        'DNI Paciente': data.patientDNI || '',
        'Teléfono Paciente': data.patientPhone || '',
        'Email Paciente': data.patientEmail || '',
        'Nombre Medicamento': data.medicationName || '',
        'Dosificación': data.medicationDosage || '',
        'Cantidad': data.medicationQuantity || '',
        'Frecuencia': data.medicationFrequency || '',
        'Médico Recetante': data.doctorName || '',
        'Observaciones': data.observations || '',
        'Estado': 'Pendiente' // Estado inicial
    };
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
