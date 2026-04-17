import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Reenviamos el FormData completo a Forminit
    const response = await fetch('https://forminit.com/f/b8sn8gw0v8z', {
      method: 'POST',
      body: formData,
      // Importante: No ponemos headers manuales, fetch generará el boundary correcto para multipart/form-data
    });

    // Si Forminit intenta redirigir, seguimos la redirección
    if (response.redirected) {
      return NextResponse.redirect(response.url);
    }

    const resBody = await response.text();
    return new NextResponse(resBody, { 
      status: response.status,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error: any) {
    console.error('CV Proxy Error:', error);
    return NextResponse.json({ error: 'Error procesando el formulario', details: error.message }, { status: 500 });
  }
}
