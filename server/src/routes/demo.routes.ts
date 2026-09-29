import { Router } from 'express';
import { demoController } from '../controllers/demo.controller.js';

const router = Router();

router.post('/seed', (req, res, next) => demoController.seed(req, res, next));
router.post('/reset', (req, res, next) => demoController.reset(req, res, next));
router.post('/compare', (req, res, next) => demoController.compare(req, res, next));
router.get('/compare', (req, res, next) => demoController.compare(req, res, next));

export default router;
