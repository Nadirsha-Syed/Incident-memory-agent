import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller.js';
import { investigationController } from '../controllers/investigation.controller.js';
import { validateBody, createIncidentSchema, resolveIncidentSchema } from '../middleware/validation.middleware.js';

const router = Router();

// Stats endpoint (placed before :id to prevent collision)
router.get('/stats', (req, res, next) => incidentController.getDashboardStats(req, res, next));

// Incident CRUD
router.post('/', validateBody(createIncidentSchema), (req, res, next) => incidentController.createIncident(req, res, next));
router.get('/', (req, res, next) => incidentController.getIncidents(req, res, next));
router.get('/:id', (req, res, next) => incidentController.getIncidentById(req, res, next));
router.patch('/:id', (req, res, next) => incidentController.updateIncident(req, res, next));

// AI Investigation & Resolution workflows
router.post('/:id/investigate', (req, res, next) => investigationController.investigate(req, res, next));
router.post('/:id/resolve', validateBody(resolveIncidentSchema), (req, res, next) => investigationController.resolveIncident(req, res, next));
router.get('/:id/investigations', (req, res, next) => investigationController.getIncidentInvestigations(req, res, next));

export default router;
