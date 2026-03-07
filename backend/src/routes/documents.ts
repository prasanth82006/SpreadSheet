import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json([]);
});

router.post('/', (req, res) => {
  res.json({ _id: Date.now().toString(), title: req.body.title });
});

export default router;
