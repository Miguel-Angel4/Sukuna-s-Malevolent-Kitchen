module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Keep old form submissions working by forwarding the browser directly to Forminit.
  res.writeHead(307, {
    Location: 'https://forminit.com/f/b8sn8gw0v8z',
    'Cache-Control': 'no-store'
  });
  res.end();
};
