import { Router } from 'express';
import { VenueController } from '../controllers/venue.controller';

const router = Router();
router.get('/', VenueController.list);
router.get('/:id', VenueController.getOne);
export default router;