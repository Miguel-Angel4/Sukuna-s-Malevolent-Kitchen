const https = require('https');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const options = {
    hostname: 'forminit.com',
    port: 443,
    path: '/f/b8sn8gw0v8z',
    method: 'POST',
    headers: {
      'content-type': req.headers['content-type'],
      'accept': 'application/json'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on('error', (e) => {
    console.error('Proxy Error:', e);
    res.status(500).send(e.message);
  });

  // Pasamos el cuerpo de la petición original al proxy
  req.pipe(proxyReq);
};
