import { Router } from 'express';
import { memoryController } from '../controllers/memory.controller.js';

const router = Router();

router.get('/search', (req, res, next) => memoryController.searchMemory(req, res, next));
router.get('/recall', (req, res, next) => memoryController.searchMemory(req, res, next));
router.get('/activity', (req, res, next) => memoryController.getMemoryActivity(req, res, next));
router.get('/health', (req, res, next) => memoryController.getMemoryHealth(req, res, next));
router.post('/reflect', (req, res, next) => memoryController.reflect(req, res, next));

export default router;
