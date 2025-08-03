// src/api/vendor/vendor.routes.js
import express from 'express';
import { getVendorProfile, updateVendorProfile, getComplianceStatus, getVendorReport } from './vendor.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All vendor routes require authentication
router.use(authMiddleware);

router.get('/profile', getVendorProfile);
router.put('/profile', updateVendorProfile);
router.get('/compliance-status', getComplianceStatus);
router.get('/report', getVendorReport); // New report endpoint

export default router;
