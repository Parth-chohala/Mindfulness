const express = require('express');
const router = express.Router();
const productivityStatusController = require('../Controllers/productivitystatuscontroller');

router.get('/productivityStatus/:id', productivityStatusController.getProductivityStatuses);
router.post('/productivityStatus', productivityStatusController.createProductivityStatus);
router.put('/productivityStatus/:id', productivityStatusController.updateProductivityStatus);

module.exports = router;
