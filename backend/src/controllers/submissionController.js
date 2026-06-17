import prisma from '../prisma.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params
    const file = req.file

    if (!file) {
      return res.status(400).json({ message: '请上传作业文件' })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(assignmentId) }
    })

    if (!assignment) {
      fs.unlinkSync(file.path)
      return res.status(404).json({ message: '作业不存在' })
    }

    const now = new Date()
    const deadline = new Date(assignment.deadline)
    const isOverdue = now > deadline

    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: parseInt(assignmentId),
          studentId: req.user.id
        }
      }
    })

    if (existingSubmission) {
      const oldFilePath = path.join(__dirname, '../..', existingSubmission.filePath)
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath)
      }

      let fileName
      try {
        fileName = Buffer.from(file.originalname, 'latin1').toString('utf8')
      } catch (e) {
        fileName = file.originalname
      }

      const submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          fileName,
          filePath: path.relative(path.join(__dirname, '../..'), file.path),
          fileSize: file.size,
          submittedAt: now,
          status: isOverdue ? 'OVERDUE' : 'SUBMITTED'
        },
        include: {
          student: {
            select: { id: true, name: true, studentNo: true }
          }
        }
      })

      return res.json({
        message: '作业更新成功',
        submission
      })
    }

    let createFileName
    try {
      createFileName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    } catch (e) {
      createFileName = file.originalname
    }

    const submission = await prisma.submission.create({
      data: {
        assignmentId: parseInt(assignmentId),
        studentId: req.user.id,
        fileName: createFileName,
        filePath: path.relative(path.join(__dirname, '../..'), file.path),
        fileSize: file.size,
        status: isOverdue ? 'OVERDUE' : 'SUBMITTED'
      },
      include: {
        student: {
          select: { id: true, name: true, studentNo: true }
        }
      }
    })

    res.json({
      message: isOverdue ? '作业提交成功（逾期）' : '作业提交成功',
      submission
    })
  } catch (error) {
    console.error('提交作业错误:', error)
    if (req.file) {
      try { fs.unlinkSync(req.file.path) } catch (e) {}
    }
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getMySubmissions = async (req, res) => {
  try {
    const {
      courseName,
      semester,
      week,
      status
    } = req.query

    let submissionWhere = { studentId: req.user.id }
    let assignmentWhere = {}

    if (courseName) {
      assignmentWhere.courseName = { contains: courseName }
    }
    if (semester) {
      assignmentWhere.semester = semester
    }
    if (week) {
      assignmentWhere.week = parseInt(week)
    }

    const submissions = await prisma.submission.findMany({
      where: {
        ...submissionWhere,
        assignment: Object.keys(assignmentWhere).length > 0 ? assignmentWhere : undefined
      },
      include: {
        assignment: {
          include: {
            teacher: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    let filteredSubmissions = submissions
    if (status) {
      const now = new Date()
      filteredSubmissions = submissions.filter(sub => {
        const deadline = new Date(sub.assignment.deadline)
        if (status === '待提交') {
          return false
        }
        if (status === '已逾期') {
          return sub.status === 'OVERDUE'
        }
        if (status === '已提交') {
          return sub.status === 'SUBMITTED'
        }
        if (status === '已评分') {
          return sub.status === 'GRADED'
        }
        return true
      })
    }

    res.json({ submissions: filteredSubmissions })
  } catch (error) {
    console.error('获取我的提交错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getSubmissionDetail = async (req, res) => {
  try {
    const { id } = req.params

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignment: {
          include: {
            teacher: {
              select: { id: true, name: true }
            }
          }
        },
        student: {
          select: { id: true, name: true, studentNo: true, className: true }
        }
      }
    })

    if (!submission) {
      return res.status(404).json({ message: '提交记录不存在' })
    }

    if (req.user.role === 'STUDENT' && submission.studentId !== req.user.id) {
      return res.status(403).json({ message: '无权访问' })
    }

    if (req.user.role === 'TEACHER' && submission.assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: '无权访问' })
    }

    res.json({ submission })
  } catch (error) {
    console.error('获取提交详情错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}

export const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params
    const { score, feedback } = req.body

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignment: true
      }
    })

    if (!submission) {
      return res.status(404).json({ message: '提交记录不存在' })
    }

    if (submission.assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: '无权批改' })
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: parseInt(id) },
      data: {
        score: score ? parseInt(score) : null,
        feedback: feedback || null,
        status: 'GRADED'
      },
      include: {
        student: {
          select: { id: true, name: true, studentNo: true }
        }
      }
    })

    res.json({
      message: '批改成功',
      submission: updatedSubmission
    })
  } catch (error) {
    console.error('批改作业错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}
