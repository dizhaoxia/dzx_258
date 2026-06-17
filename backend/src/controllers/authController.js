import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma.js'

export const register = async (req, res) => {
  try {
    const { username, password, name, role, className, studentNo } = req.body

    if (!username || !password || !name || !role) {
      return res.status(400).json({ message: '请填写完整信息' })
    }

    if (!['STUDENT', 'TEACHER'].includes(role)) {
      return res.status(400).json({ message: '无效的角色类型' })
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role,
        className: role === 'STUDENT' ? className : null,
        studentNo: role === 'STUDENT' ? studentNo : null
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        className: true,
        studentNo: true,
        createdAt: true
      }
    })

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: '注册成功',
      token,
      user
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}

export const login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: '请输入用户名和密码' })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return res.status(400).json({ message: '用户名或密码错误' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(400).json({ message: '用户名或密码错误' })
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const userData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      className: user.className,
      studentNo: user.studentNo
    }

    res.json({
      message: '登录成功',
      token,
      user: userData
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getProfile = async (req, res) => {
  try {
    res.json({ user: req.user })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
}
