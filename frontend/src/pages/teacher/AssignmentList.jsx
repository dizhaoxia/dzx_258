import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  message,
  Typography,
  Form,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Card
} from 'antd'
import { PlusOutlined, EyeOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getAssignments, deleteAssignment } from '../../api/assignment'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const AssignmentList = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [dataSource, setDataSource] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({})

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        pageSize,
        ...filters
      }
      const res = await getAssignments(params)
      setDataSource(res.assignments || [])
      setTotal(res.total || 0)
    } catch (error) {
      message.error(error?.message || '获取作业列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [page, pageSize, filters])

  const getStatusTag = (isOverdue) => {
    if (isOverdue) {
      return <Tag color="red">已截止</Tag>
    }
    return <Tag color="green">进行中</Tag>
  }

  const handleViewDetail = (id) => {
    navigate(`/teacher/assignment/${id}`)
  }

  const handleDelete = async (id) => {
    try {
      await deleteAssignment(id)
      message.success('删除成功')
      fetchAssignments()
    } catch (error) {
      message.error(error?.message || '删除失败')
    }
  }

  const handlePageChange = (page, pageSize) => {
    setPage(page)
    setPageSize(pageSize)
  }

  const handleSearch = (values) => {
    const newFilters = {}
    if (values.title) {
      newFilters.title = values.title
    }
    if (values.dateRange && values.dateRange.length === 2) {
      newFilters.startDate = values.dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss')
      newFilters.endDate = values.dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss')
    }
    if (values.graded !== undefined && values.graded !== '') {
      newFilters.graded = values.graded
    }
    setPage(1)
    setFilters(newFilters)
  }

  const handleReset = () => {
    form.resetFields()
    setFilters({})
    setPage(1)
  }

  const columns = [
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {(record.courseName || record.semester || record.week) && (
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              {record.courseName && <span>{record.courseName}</span>}
              {record.semester && <span style={{ marginLeft: 8 }}>{record.semester}</span>}
              {record.week && <span style={{ marginLeft: 8 }}>第{record.week}周</span>}
            </div>
          )}
        </div>
      )
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 180,
      render: (deadline) => dayjs(deadline).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '状态',
      dataIndex: 'isOverdue',
      key: 'status',
      width: 100,
      render: (isOverdue) => getStatusTag(isOverdue)
    },
    {
      title: '提交概览',
      key: 'submissionStats',
      width: 180,
      render: (_, record) => {
        const stats = record.stats
        if (!stats) return null
        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: '#52c41a', fontWeight: 500 }}>{stats.submittedCount}</span>
              <span style={{ color: '#999' }}>/{stats.totalStudents} 人已提交</span>
            </div>
            <div>
              <span style={{ color: '#faad14', fontWeight: 500 }}>{stats.pendingCount}</span>
              <span style={{ color: '#999' }}> 人待批改</span>
            </div>
          </div>
        )
      }
    },
    {
      title: '提交率',
      key: 'submissionRate',
      width: 120,
      render: (_, record) => {
        const stats = record.stats
        if (!stats) return null
        const rate = stats.submissionRate
        let color = '#52c41a'
        if (rate < 60) color = '#ff4d4f'
        else if (rate < 80) color = '#faad14'
        return (
          <div>
            <div style={{ color, fontWeight: 500, marginBottom: 4 }}>{rate}%</div>
            <div style={{ width: '100%', height: 6, background: '#f0f0f0', borderRadius: 3 }}>
              <div
                style={{
                  width: `${rate}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 3,
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>
        )
      }
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            查看详情
          </Button>
          <Popconfirm
            title="确定要删除这个作业吗？"
            description="删除后无法恢复，相关的学生提交也会被删除。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>作业管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/teacher/create-assignment')}
        >
          发布作业
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          initialValues={{ graded: '' }}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={8} style={{ marginBottom: 12 }}>
              <Form.Item name="title" label="作业名称" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="请输入作业名称"
                  allowClear
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={10} style={{ marginBottom: 12 }}>
              <Form.Item name="dateRange" label="发布时间" style={{ marginBottom: 0 }}>
                <RangePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} style={{ marginBottom: 12 }}>
              <Form.Item name="graded" label="批改状态" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="全部"
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="true">已批改</Option>
                  <Option value="false">未批改/部分批改</Option>
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
                  搜索
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: handlePageChange
        }}
      />
    </div>
  )
}

export default AssignmentList
