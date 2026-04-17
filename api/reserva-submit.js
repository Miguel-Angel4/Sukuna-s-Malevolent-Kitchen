// api/reserva-submit.js
// Función serverless de Vercel: actúa como proxy para Forminit (evita CORS)

export default async function handler(req, res) {
    // Solo aceptar POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const data = req.body;

        // Construir los datos en formato URL-encoded (que Forminit acepta)
        const params = new URLSearchParams();
        Object.entries(data).forEach(([k, v]) => {
            if (v !== null && v !== undefined) params.append(k, String(v));
        });

        // Enviar a Forminit desde el servidor (sin CORS)
        const response = await fetch('https://app.forminit.com/f/b8sn8gw0v8z', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params.toString()
        });

        const text = await response.text();
        console.log('Forminit response:', response.status, text);

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(response.status).send(text);

    } catch (error) {
        console.error('Error en proxy Forminit:', error);
        return res.status(500).json({ error: error.message });
    }
}
