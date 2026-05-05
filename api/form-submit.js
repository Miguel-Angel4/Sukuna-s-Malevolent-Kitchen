export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Reenviamos la petición a FormSubmit desde el servidor de Vercel.
    // Usamos el endpoint /ajax/ para recibir una respuesta JSON y evitar redirecciones que bloqueen el navegador.
    const response = await fetch('https://formsubmit.co/ajax/sukunaamalevolentkitchen@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    // Devolvemos la respuesta al cliente (Web o APK)
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en el proxy de reservas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al procesar la reserva en el servidor.',
      error: error.message 
    });
  }
}
