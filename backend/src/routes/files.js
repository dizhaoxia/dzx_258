import express from 'express'
import fileController from '../controllers/fileController.js'

const router = express.Router()

router.use('/files', fileController)

export default router
