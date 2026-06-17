import React, { useState, useEffect } from 'react'
import {
  Table,
  Tag,
  Button,
  Space,
  Spin,
  Empty,
  message,
  Typography,
  Form,
  Input,
  Select,
  InputNumber,
  Card,
  Row,
  Col
} from 'antd'
import {
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getMySubmissions } from '../../api/submission'

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

const SubmittedList = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [filters, setFilters] = useState({})
  const navigate = useNavigate()

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const res = await getMySubmissions(filters)
      setSubmissions(res.submissions || [])
    } catch (error) {
      message.error(error?.message || '获取已提交作业列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [filters])

  const handleViewDetail = (record) => {
    const assignmentId = record.assignmentId || record.assignment?.id
    if (assignmentId) {
      navigate(`/student/assignments/${assignmentId}`)
    }
  }

  const handleDownload = (record) => {
    window.open(`/api/files/submission/download/${record.id}`, '_blank')
  }

  const getStatusTag = (status, score) => {
    if (status === 'GRADED') {
      return (
        <Tag icon={<TrophyOutlined />} color="gold">
          已评分
        </Tag>
      )
    }
    if (status === 'OVERDUE') {
      return <Tag color="orange">逾期</Tag>
    }
    return <Tag color="success">已提交</Tag>
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

  const columns = [
    {
      title: '作业信息',
      key: 'assignmentInfo',
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.assignment?.title || '-'}</div>
          {(record.assignment?.courseName || record.assignment?.week) && (
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              {record.assignment?.courseName && <span>{record.assignment.courseName}</span>}
              {record.assignment?.week && (
                <span style={{ marginLeft: record.assignment?.courseName ? 8 : 0 }}>
                  第{record.assignment.week}周
                </span>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      title: '教师',
      key: 'teacherName',
      width: 100,
      render: (_, record) => record.assignment?.teacher?.name || '-'
    },
    {
      title: '截止时间',
      key: 'deadline',
      width: 160,
      render: (_, record) => record.assignment?.deadline
        ? dayjs(record.assignment.deadline).format('YYYY-MM-DD HH:mm')
        : '-'
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 160,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => getStatusTag(status, record.score)
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score, record) => {
        if (score === null || score === undefined) {
          return <span style={{ color: '#999' }}>未批改</span>
        }
        return (
          <span style={{ fontWeight: 'bold', color: '#d48806', fontSize: 16 }}>
            {score}
            <span style={{ fontSize: 12, color: '#999', marginLeft: 2 }}>分</span>
          </span>
        )
      }
    },
    {
      title: '教师评语',
      dataIndex: 'feedback',
      key: 'feedback',
      width: 200,
      ellipsis: true,
      render: (feedback) => {
        if (!feedback) return <span style={{ color: '#999' }}>无</span>
        return feedback
      }
    },
    {
      title: '提交文件',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 150,
      ellipsis: true,
      render: (fileName) => fileName || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
        </Space>
      )
    }
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>历史作业</Title>

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
                  <Option value="已提交">已提交（未批改）</Option>
                  <Option value="已评分">已评分</Option>
                  <Option value="已逾期">已逾期</Option>
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

      {submissions.length === 0 ? (
        <Empty description="暂无历史作业记录" />
      ) : (
        <Table
          dataSource={submissions}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      )}
    </div>
  )
}

export default SubmittedList
