import express from 'express'
import {
  createAssignment,
  getAssignments,
  getAssignmentDetail,
  deleteAssignment,
  getSubmissionsByAssignment
} from '../controllers/assignmentController.js'
import { auth, requireTeacher } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = express.Router()

router.get('/', auth, getAssignments)
router.get('/:id', auth, getAssignmentDetail)
router.post('/', auth, requireTeacher, upload.single('file'), createAssignment)
router.delete('/:id', auth, requireTeacher, deleteAssignment)
router.get('/:assignmentId/submissions', auth, requireTeacher, getSubmissionsByAssignment)

export default router
