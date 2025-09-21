import { Router } from 'express';
import * as handlers from './handlers';
import path from 'path';

import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/avatars');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const uploader = multer({
  storage: storage,
});

const router = Router();

router.post('/', handlers.updateProfileHandler);
router.post('/change-password', handlers.changePasswordHandler);
router.post('/avatar', uploader.single('avatar'), handlers.updateAvatarHandler);

export default router;
