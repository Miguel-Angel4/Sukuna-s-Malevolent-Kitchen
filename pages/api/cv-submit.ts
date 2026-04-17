import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // Reenviamos la petición a Forminit usando el stream bruto
    const response = await fetch('https://forminit.com/f/b8sn8gw0v8z', {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'] as string,
        'accept': 'application/json'
      },
      // @ts-ignore
      body: req,
      duplex: 'half'
    })

    if (response.redirected) {
      return res.redirect(response.url)
    }

    const data = await response.text()
    res.status(response.status).send(data)
  } catch (error: any) {
    console.error('Proxy Error:', error)
    res.status(500).json({ error: error.message })
  }
}
