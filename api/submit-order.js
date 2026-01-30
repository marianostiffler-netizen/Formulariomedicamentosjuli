const express = require('express');
const router = express.Router();

// Endpoint para recibir pedidos
router.post('/submit-order', (req, res) => {
    const { clientName, clientPhone, clientEmail, medicines, timestamp, totalItems } = req.body;

    // Aquí puedes agregar la lógica para procesar el pedido, como guardarlo en una base de datos
    console.log(`Pedido recibido: ${JSON.stringify(req.body)}`);

    // Responder al cliente
    res.status(200).json({ message: 'Pedido recibido exitosamente' });
});

module.exports = router;
