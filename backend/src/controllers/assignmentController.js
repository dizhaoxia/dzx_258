import prisma from '../prisma.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadBasePath = path.join(__dirname, '../../uploads')

export const createAssignment = async (req, res) => {
  try {
    const { title, description, deadline, courseName, semester, week } = req.body
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
        fileSize: file ? file.size : null,
        courseName: courseName || null,
        semester: semester || null,
        week: week ? parseInt(week) : null
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
    const {
      page = 1,
      pageSize = 10,
      status,
      title,
      courseName,
      semester,
      week,
      startDate,
      endDate,
      graded
    } = req.query
    const skip = (page - 1) * pageSize

    let where = {}

    if (req.user.role === 'TEACHER') {
      where.teacherId = req.user.id
      if (title) {
        where.title = { contains: title }
      }
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate)
      }
    }

    if (req.user.role === 'STUDENT') {
      if (courseName) {
        where.courseName = { contains: courseName }
      }
      if (semester) {
        where.semester = semester
      }
      if (week) {
        where.week = parseInt(week)
      }
    }

    const includeConfig = {
      teacher: {
        select: { id: true, name: true }
      },
      submissions: req.user.role === 'STUDENT' ? {
        where: { studentId: req.user.id },
        take: 1
      } : req.user.role === 'TEACHER' ? {
        select: { id: true, status: true, score: true, studentId: true }
      } : undefined,
      _count: {
        select: { submissions: true }
      }
    }

    let assignments = await prisma.assignment.findMany({
      where,
      include: includeConfig,
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(pageSize)
    })

    const total = await prisma.assignment.count({ where })

    let totalStudents = 0
    if (req.user.role === 'TEACHER') {
      totalStudents = await prisma.user.count({
        where: { role: 'STUDENT' }
      })
    }

    const now = new Date()
    let assignmentsWithStatus = assignments.map(assignment => {
      const isOverdue = now > new Date(assignment.deadline)
      const mySubmission = req.user.role === 'STUDENT'
        ? (assignment.submissions && assignment.submissions.length > 0 ? assignment.submissions[0] : null)
        : null
      const submitted = !!mySubmission
      const isGraded = mySubmission && mySubmission.status === 'GRADED'

      let derivedStatus = '进行中'
      if (isOverdue && !submitted) derivedStatus = '已截止'
      if (submitted && mySubmission?.status === 'OVERDUE') derivedStatus = '逾期提交'
      if (submitted && mySubmission?.status === 'SUBMITTED') derivedStatus = '已提交'
      if (submitted && isGraded) derivedStatus = '已评分'

      let stats = null
      if (req.user.role === 'TEACHER') {
        const submissions = assignment.submissions || []
        const submittedCount = submissions.length
        const gradedCount = submissions.filter(s => s.status === 'GRADED').length
        const pendingCount = submissions.filter(s => s.status !== 'GRADED').length
        stats = {
          totalStudents,
          submittedCount,
          gradedCount,
          pendingCount,
          submissionRate: totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0
        }
      }

      return {
        ...assignment,
        submissions: undefined,
        isOverdue,
        submitted,
        isGraded,
        mySubmission,
        status: isOverdue ? '已截止' : '进行中',
        derivedStatus,
        stats
      }
    })

    if (status && req.user.role === 'STUDENT') {
      assignmentsWithStatus = assignmentsWithStatus.filter(a => a.derivedStatus === status)
    }

    if (graded !== undefined && req.user.role === 'TEACHER') {
      const assignmentIds = assignmentsWithStatus.map(a => a.id)
      const submissions = await prisma.submission.findMany({
        where: { assignmentId: { in: assignmentIds } },
        select: { assignmentId: true, score: true }
      })

      const gradedMap = {}
      submissions.forEach(s => {
        if (!gradedMap[s.assignmentId]) {
          gradedMap[s.assignmentId] = { total: 0, graded: 0 }
        }
        gradedMap[s.assignmentId].total++
        if (s.score !== null) gradedMap[s.assignmentId].graded++
      })

      assignmentsWithStatus = assignmentsWithStatus.filter(a => {
        const info = gradedMap[a.id] || { total: 0, graded: 0 }
        if (graded === 'true') return info.graded > 0
        if (graded === 'false') return info.total === 0 || info.graded < info.total
        return true
      })
    }

    res.json({
      assignments: assignmentsWithStatus,
      total: assignmentsWithStatus.length,
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
