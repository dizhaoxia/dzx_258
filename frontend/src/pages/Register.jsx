import React from 'react'
import { Form, Input, Button, Card, message, Typography, Space, Radio } from 'antd'
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/auth'
import useUserStore from '../store/userStore'

const { Title, Text } = Typography

const Register = () => {
  const navigate = useNavigate()
  const { login: loginStore } = useUserStore()
  const [loading, setLoading] = React.useState(false)
  const [role, setRole] = React.useState('STUDENT')

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await registerApi({
        username: values.username,
        password: values.password,
        name: values.name,
        role: values.role,
        className: values.className,
        studentNo: values.studentNo
      })
      loginStore(res.user, res.token)
      message.success('注册成功')
      const redirectPath = res.user.role === 'TEACHER' ? '/teacher' : '/student'
      navigate(redirectPath, { replace: true })
    } catch (error) {
      message.error(error.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (e) => {
    setRole(e.target.value)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px 0'
    }}>
      <Card style={{ width: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>班级作业提交系统</Title>
          <Text type="secondary">用户注册</Text>
        </div>
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          initialValues={{ role: 'STUDENT' }}
        >
          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Radio.Group onChange={handleRoleChange} style={{ width: '100%' }}>
              <Radio.Button value="STUDENT" style={{ width: '50%', textAlign: 'center' }}>学生</Radio.Button>
              <Radio.Button value="TEACHER" style={{ width: '50%', textAlign: 'center' }}>教师</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="姓名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          {role === 'STUDENT' && (
            <>
              <Form.Item
                name="className"
                rules={[{ required: true, message: '请输入班级' }]}
              >
                <Input placeholder="班级" />
              </Form.Item>

              <Form.Item
                name="studentNo"
                rules={[{ required: true, message: '请输入学号' }]}
              >
                <Input placeholder="学号" />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Space>
              <Text type="secondary">已有账号？</Text>
              <Link to="/login">立即登录</Link>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Register
