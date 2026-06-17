import express from 'express'
import {
  submitAssignment,
  getMySubmissions,
  getSubmissionDetail,
  gradeSubmission
} from '../controllers/submissionController.js'
import { auth, requireStudent, requireTeacher } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = express.Router()

router.get('/mine', auth, getMySubmissions)
router.get('/:id', auth, getSubmissionDetail)
router.post('/assignment/:assignmentId', auth, requireStudent, upload.single('file'), submitAssignment)
router.put('/:id/grade', auth, requireTeacher, gradeSubmission)

export default router
