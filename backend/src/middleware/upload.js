import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadBasePath = path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { assignmentId, userId, type } = req.body
    let targetPath = uploadBasePath

    if (type === 'assignment' && userId) {
      targetPath = path.join(uploadBasePath, `teacher_${userId}`)
    } else if (type === 'submission' && assignmentId && userId) {
      targetPath = path.join(uploadBasePath, `assignment_${assignmentId}`, `student_${userId}`)
    } else {
      targetPath = path.join(uploadBasePath, 'temp')
    }

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true })
    }

    cb(null, targetPath)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    let originalName = file.originalname
    try {
      originalName = Buffer.from(originalName, 'latin1').toString('utf8')
    } catch (e) {}
    const ext = path.extname(originalName)
    const nameWithoutExt = path.basename(originalName, ext)
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    cb(null, `${safeName}_${timestamp}${ext}`)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'text/plain'
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'), false)
    }
  }
})

export default upload
