export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Vercel API is alive',
    node_version: process.version,
    region: process.env.VERCEL_REGION || 'unknown'
  });
}
