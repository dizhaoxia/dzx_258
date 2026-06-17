import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import assignmentRoutes from './routes/assignments.js'
import submissionRoutes from './routes/submissions.js'
import fileRoutes from './routes/files.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 30222

app.use(cors({
  origin: ['http://localhost:4333', 'http://127.0.0.1:4333'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api', fileRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '班级作业提交系统后端服务运行中' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  if (err.message === 'File too large') {
    return res.status(400).json({ message: '文件大小超过限制（最大50MB）' })
  }
  if (err.message === '不支持的文件类型') {
    return res.status(400).json({ message: '不支持的文件类型' })
  }
  res.status(500).json({ message: err.message || '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
  console.log(`📁 文件上传目录: ${path.join(__dirname, '../uploads')}`)
})
