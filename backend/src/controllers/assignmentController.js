import prisma from '../prisma.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadBasePath = path.join(__dirname, '../../uploads')

export const createAssignment = async (req, res) => {
  try {
    const { title, description, deadline } = req.body
    const file = req.file

    if (!title || !description || !deadline) {
      if (file) {
        fs.unlinkSync(file.path)
      }
      return res.status(400).json({ message: '请填写完整信息' })
    }

    let fileName = null
    if (file) {
      try {
        fileName = Buffer.from(file.originalname, 'latin1').toString('utf8')
      } catch (e) {
        fileName = file.originalname
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        teacherId: req.user.id,
        fileName,
        filePath: file ? path.relative(path.join(__dirname, '../..'), file.path) : null,
        fileSize: file ? file.size : null
      },
      include: {
        teacher: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      message: '作业发布成功',
      assignment
    })
  } catch (error) {
    console.error('发布作业错误:', error)
    if (req.file) {
      try { fs.unlinkSync(req.file.path) } catch (e) {}
    }
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getAssignments = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    const skip = (page - 1) * pageSize

    let where = {}

    if (req.user.role === 'TEACHER') {
      where.teacherId = req.user.id
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true }
        },
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(pageSize)
    })

    const total = await prisma.assignment.count({ where })

    const now = new Date()
    const assignmentsWithStatus = assignments.map(assignment => {
      const isOverdue = now > new Date(assignment.deadline)
      return {
        ...assignment,
        isOverdue,
        status: isOverdue ? '已截止' : '进行中'
      }
    })

    res.json({
      assignments: assignmentsWithStatus,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    })
  } catch (error) {
    console.error('获取作业列表错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getAssignmentDetail = async (req, res) => {
  try {
    const { id } = req.params

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: {
          select: { id: true, name: true }
        },
        submissions: {
          include: {
            student: {
              select: { id: true, name: true, studentNo: true, className: true }
            }
          },
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' })
    }

    if (req.user.role === 'TEACHER' && assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: '无权访问' })
    }

    const now = new Date()
    const isOverdue = now > new Date(assignment.deadline)

    const mySubmission = req.user.role === 'STUDENT'
      ? assignment.submissions.find(s => s.studentId === req.user.id) || null
      : null

    res.json({
      assignment: {
        ...assignment,
        isOverdue,
        status: isOverdue ? '已截止' : '进行中'
      },
      mySubmission
    })
  } catch (error) {
    console.error('获取作业详情错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}

export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) }
    })

    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' })
    }

    if (assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: '无权删除' })
    }

    if (assignment.filePath) {
      const filePath = path.join(__dirname, '../..', assignment.filePath)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: parseInt(id) }
    })

    for (const sub of submissions) {
      const filePath = path.join(__dirname, '../..', sub.filePath)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await prisma.assignment.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: '作业删除成功' })
  } catch (error) {
    console.error('删除作业错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(assignmentId) }
    })

    if (!assignment) {
      return res.status(404).json({ message: '作业不存在' })
    }

    if (assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: '无权查看' })
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: parseInt(assignmentId) },
      include: {
        student: {
          select: { id: true, name: true, studentNo: true, className: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    res.json({ submissions })
  } catch (error) {
    console.error('获取提交列表错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}
