import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Spin,
  Empty,
  message,
  Typography,
  Form,
  Input,
  Select,
  InputNumber,
  Space
} from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  ReloadOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getAssignments } from '../../api/assignment'

const { Title } = Typography
const { Option } = Select

const generateSemesters = () => {
  const currentYear = new Date().getFullYear()
  const semesters = []
  for (let year = currentYear - 2; year <= currentYear + 1; year++) {
    semesters.push(`${year}-${year + 1}-1`)
    semesters.push(`${year}-${year + 1}-2`)
  }
  return semesters
}

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [filters, setFilters] = useState({})
  const navigate = useNavigate()

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const assignmentsRes = await getAssignments(filters)
      setAssignments(assignmentsRes.assignments || [])
    } catch (error) {
      message.error(error?.message || '获取作业列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [filters])

  const getStatusTag = (assignment) => {
    if (assignment.derivedStatus === '已评分') {
      return (
        <Tag icon={<TrophyOutlined />} color="gold">
          已评分
          {assignment.mySubmission?.score !== null && assignment.mySubmission?.score !== undefined && (
            <span style={{ marginLeft: 4 }}>
              {assignment.mySubmission.score}分
            </span>
          )}
        </Tag>
      )
    }
    if (assignment.submitted) {
      const status = assignment.mySubmission?.status
      if (status === 'OVERDUE') {
        return <Tag color="orange">逾期提交</Tag>
      }
      return <Tag icon={<CheckCircleOutlined />} color="success">已提交</Tag>
    }
    if (assignment.isOverdue) {
      return <Tag color="error">已截止</Tag>
    }
    return <Tag color="processing">进行中</Tag>
  }

  const getRemainingDays = (deadline) => {
    const diff = dayjs(deadline).diff(dayjs(), 'day')
    if (diff < 0) return 0
    return diff
  }

  const handleViewDetail = (id) => {
    navigate(`/student/assignments/${id}`)
  }

  const handleSearch = (values) => {
    const newFilters = {}
    if (values.courseName) {
      newFilters.courseName = values.courseName
    }
    if (values.semester) {
      newFilters.semester = values.semester
    }
    if (values.week) {
      newFilters.week = values.week
    }
    if (values.status) {
      newFilters.status = values.status
    }
    setFilters(newFilters)
  }

  const handleReset = () => {
    form.resetFields()
    setFilters({})
  }

  const semesters = generateSemesters()

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>待办作业</Title>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6} style={{ marginBottom: 12 }}>
              <Form.Item name="semester" label="学期" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="全部学期"
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
                >
                  {semesters.map(sem => (
                    <Option key={sem} value={sem}>{sem.replace(/-(\d)$/, ' 第$1学期')}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} style={{ marginBottom: 12 }}>
              <Form.Item name="week" label="周次" style={{ marginBottom: 0 }}>
                <InputNumber
                  min={1}
                  max={30}
                  placeholder="周次"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} style={{ marginBottom: 12 }}>
              <Form.Item name="courseName" label="课程" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="课程名称"
                  allowClear
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} style={{ marginBottom: 12 }}>
              <Form.Item name="status" label="状态" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="全部状态"
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="进行中">待提交（进行中）</Option>
                  <Option value="已提交">已提交</Option>
                  <Option value="已评分">已评分</Option>
                  <Option value="逾期提交">已逾期</Option>
                  <Option value="已截止">已截止（未提交）</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  htmlType="submit"
                >
                  筛选
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {assignments.length === 0 ? (
        <Empty description="暂无作业" />
      ) : (
        <Row gutter={[16, 16]}>
          {assignments.map((assignment) => (
            <Col xs={24} sm={12} md={8} lg={6} key={assignment.id}>
              <Card
                hoverable
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, paddingBottom: 8 }}
                actions={[
                  <Button
                    type="link"
                    icon={<ArrowRightOutlined />}
                    onClick={() => handleViewDetail(assignment.id)}
                    key="detail"
                  >
                    查看详情
                  </Button>
                ]}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Card.Meta
                    title={assignment.title}
                    description={
                      <div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#666', fontSize: 13 }}>
                          <UserOutlined />
                          {assignment.teacher?.name || '未知教师'}
                        </span>
                        {(assignment.courseName || assignment.semester || assignment.week) && (
                          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                            {assignment.courseName && <span>{assignment.courseName}</span>}
                            {assignment.week && <span style={{ marginLeft: assignment.courseName ? 8 : 0 }}>第{assignment.week}周</span>}
                          </div>
                        )}
                      </div>
                    }
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 80 }}>
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      {getStatusTag(assignment)}
                    </div>
                    <div style={{ color: '#666', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ClockCircleOutlined />
                      <span>
                        截止：{dayjs(assignment.deadline).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                  </div>
                  {!assignment.isOverdue && !assignment.submitted && (
                    <div style={{ marginTop: 8, color: '#faad14', fontSize: 12 }}>
                      剩余 {getRemainingDays(assignment.deadline)} 天
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default AssignmentList
