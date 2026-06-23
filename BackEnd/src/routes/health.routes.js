import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/db-health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: "ok",
      database: "connected"
    })
  } catch(e){
      return res.status(500).json({ 
        status: "error", 
        database: "disconnected" 
      });
  }
});

export default router;