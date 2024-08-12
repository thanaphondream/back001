const express = require('express')
const router = express.Router()
const multer = require('multer');
const authenticate = require('../middlewares/authenticate')
const authController = require('../controller/auth-controller')
const authproductscontroller = require('../controller/products-controller')
const authcontrollerTableReservation = require('../controller/TableReservation-controller')
const PurchaseController = require('../controller/purchase-controller');
const { updateProfile } = require('../controller/auth-controller');
const Upload = require('../middlewares/upload')


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', authenticate, authController.getme) 
router.get('/getUser', authenticate, authController.getUser) 
router.get('/getUser01/:userId', authenticate, authController.getUser01) 
router.put('/updateProfile', authenticate, authController.updateProfile) 
router.put('/updateUser/:userId', authenticate, authController.updateUser) 
router.get('/product', authenticate, authproductscontroller.getProduct) 
router.post('/TableReservation', authenticate, authcontrollerTableReservation.createTableReservation) 
router.post('/purchase',Upload.array("image",1) , authenticate, PurchaseController.purchaseProduct);
router.post('/postproduct', authenticate, authproductscontroller.postProduct);
router.get('/getpurchase', authenticate, PurchaseController.getpurchase);
router.get('/tableReser', authenticate, authcontrollerTableReservation.getTableReservation);
router.delete('/deletePurchase', authenticate, PurchaseController.deletePurchase);
router.post('/purchaseFinish', authenticate, PurchaseController.purchaseFinish);
router.put('/Finish2', authenticate, PurchaseController.Finish2);
router.post('/update-profile', upload.single('imgprofile'), updateProfile);



module.exports = router