import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { completeMatchSchema, createMatchSchema } from '../validators/schemas';

const router = Router();

router.get('/', MatchController.list);
router.get('/:id', MatchController.getOne);
router.post('/', authenticate, validate(createMatchSchema), MatchController.create);
router.post('/:id/join', authenticate, MatchController.join);
router.post('/:id/complete', authenticate, validate(completeMatchSchema), MatchController.complete);
router.post('/:id/complete', authenticate, MatchController.complete);

export default router;