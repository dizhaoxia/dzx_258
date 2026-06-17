import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { auth } from '../middleware/auth.js'
import prisma from '../prisma.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const router = express.Router()

router.get('/assignment/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) }
    })

    if (!assignment || !assignment.filePath) {
      return res.status(404).json({ message: '文件不存在' })
    }

    if (req.user.role === 'TEACHER' && assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: '无权访问' })
    }

    const filePath = path.join(__dirname, '../..', assignment.filePath)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' })
    }

    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = req.headers.range

    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(assignment.fileName)}"`)
    res.setHeader('Content-Type', getContentType(assignment.fileName))
    res.setHeader('Accept-Ranges', 'bytes')

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1
      const file = fs.createReadStream(filePath, { start, end })
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize
      })
      file.pipe(res)
    } else {
      res.setHeader('Content-Length', fileSize)
      const file = fs.createReadStream(filePath)
      file.pipe(res)
    }
  } catch (error) {
    console.error('预览作业附件错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/submission/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id) },
      include: { assignment: true }
    })

    if (!submission) {
      return res.status(404).json({ message: '文件不存在' })
    }

    if (req.user.role === 'STUDENT' && submission.studentId !== req.user.id) {
      return res.status(403).json({ message: '无权访问' })
    }

    if (req.user.role === 'TEACHER' && submission.assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: '无权访问' })
    }

    const filePath = path.join(__dirname, '../..', submission.filePath)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' })
    }

    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = req.headers.range

    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(submission.fileName)}"`)
    res.setHeader('Content-Type', getContentType(submission.fileName))
    res.setHeader('Accept-Ranges', 'bytes')

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1
      const file = fs.createReadStream(filePath, { start, end })
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize
      })
      file.pipe(res)
    } else {
      res.setHeader('Content-Length', fileSize)
      const file = fs.createReadStream(filePath)
      file.pipe(res)
    }
  } catch (error) {
    console.error('预览提交文件错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/assignment/download/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) }
    })

    if (!assignment || !assignment.filePath) {
      return res.status(404).json({ message: '文件不存在' })
    }

    const filePath = path.join(__dirname, '../..', assignment.filePath)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' })
    }

    res.download(filePath, encodeURIComponent(assignment.fileName))
  } catch (error) {
    console.error('下载作业附件错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/submission/download/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id) },
      include: { assignment: true }
    })

    if (!submission) {
      return res.status(404).json({ message: '文件不存在' })
    }

    if (req.user.role === 'STUDENT' && submission.studentId !== req.user.id) {
      return res.status(403).json({ message: '无权下载' })
    }

    if (req.user.role === 'TEACHER' && submission.assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: '无权下载' })
    }

    const filePath = path.join(__dirname, '../..', submission.filePath)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' })
    }

    res.download(filePath, encodeURIComponent(submission.fileName))
  } catch (error) {
    console.error('下载提交文件错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase()
  const types = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.txt': 'text/plain'
  }
  return types[ext] || 'application/octet-stream'
}

export default router
