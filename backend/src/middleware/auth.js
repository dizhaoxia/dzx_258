import jwt from 'jsonwebtoken'
import prisma from '../prisma.js'

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: '请先登录' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, name: true, role: true, className: true, studentNo: true }
    })

    if (!user) {
      return res.status(401).json({ message: '用户不存在' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: '登录已过期，请重新登录' })
  }
}

export const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: '需要教师权限' })
  }
  next()
}

export const requireStudent = (req, res, next) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ message: '需要学生权限' })
  }
  next()
}
