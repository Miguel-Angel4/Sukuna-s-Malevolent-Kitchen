export default async function handler(req, res) {
  // Configuración de CORS para permitir peticiones desde el APK (localhost)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Usamos la CLAVE (2e650c1465b4c924d1fab9db0900989a) en lugar del email para evitar el paso de activación.
    // Usamos el endpoint /ajax/ para recibir respuesta JSON.
    const response = await fetch('https://formsubmit.co/ajax/2e650c1465b4c924d1fab9db0900989a', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en el proxy:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
