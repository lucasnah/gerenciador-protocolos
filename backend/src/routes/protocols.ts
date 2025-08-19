import { Router } from 'express';
import { 
  getProtocols, 
  getProtocolById, 
  createProtocolInstance,
  saveProtocolData,
  getProtocolInstanceData,
  getUserProtocolInstances,
  getOpenProtocols,
  assignProtocolToUser,
  updateProtocolStatus
} from '../controllers/protocolController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Any request to this route must first pass through the 'protect' middleware.
router.get('/', protect, getProtocols);

// Open protocols management (deve vir ANTES de /:id para evitar conflito)
router.get('/open', protect, getOpenProtocols);

router.get('/:id', protect, getProtocolById);

// Protocol instances
router.post('/:id/instances', protect, createProtocolInstance);
router.get('/instances', protect, getUserProtocolInstances);
router.post('/instances/:instanceId/data', protect, saveProtocolData);
router.get('/instances/:instanceId/data', protect, getProtocolInstanceData);

// Protocol collaboration
router.post('/instances/:instanceId/assign', protect, assignProtocolToUser);
router.put('/instances/:instanceId/status', protect, updateProtocolStatus);

export default router;