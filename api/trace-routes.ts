import express from 'express';

export default async function handler(req, res) {
  const status = {};
  
  try {
    status['express'] = 'OK';
    
    try {
      const { authRoutes } = await import('./routes/auth');
      status['authRoutes'] = 'OK';
    } catch (e) { status['authRoutes'] = 'CRASH: ' + e.message; }

    try {
      const { userRoutes } = await import('./routes/user');
      status['userRoutes'] = 'OK';
    } catch (e) { status['userRoutes'] = 'CRASH: ' + e.message; }

    try {
      const { incomeRoutes } = await import('./routes/income');
      status['incomeRoutes'] = 'OK';
    } catch (e) { status['incomeRoutes'] = 'CRASH: ' + e.message; }

    res.status(200).json({ 
      status: 'complete', 
      results: status 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'fatal_error', 
      message: err.message 
    });
  }
}
