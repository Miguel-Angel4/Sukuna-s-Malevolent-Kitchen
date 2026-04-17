/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/form-submit',
        destination: 'https://formsubmit.co/sukunaamalevolentkitchen@gmail.com',
      },
    ]
  },
}

export default nextConfig
