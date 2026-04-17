export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const response = await fetch('https://forminit.com/f/b8sn8gw0v8z', {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'],
        'accept': 'application/json'
      },
      body: req,
      duplex: 'half'
    });

    if (response.redirected) {
      return res.redirect(response.url);
    }

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
}
