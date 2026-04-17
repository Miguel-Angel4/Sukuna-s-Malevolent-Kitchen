export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        // Reenviamos la petición a Forminit preservando el body (que es un stream)
        const response = await fetch('https://forminit.com/f/b8sn8gw0v8z', {
            method: 'POST',
            headers: {
                'content-type': req.headers['content-type'],
                'accept': 'application/json'
            },
            duplex: 'half', // Necesario en Node.js para hacer stream del body en fetch
            body: req
        });

        // Si Forminit responde con una redirección (común en formularios HTML), la seguimos o informamos
        if (response.status === 302 || response.status === 301) {
            return res.redirect(response.headers.get('location'));
        }

        const data = await response.text();
        res.status(response.status).send(data);
    } catch (err) {
        console.error('Proxy Error:', err);
        res.status(500).send('Error en el servidor proxy: ' + err.message);
    }
}
