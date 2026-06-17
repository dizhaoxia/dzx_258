import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Spin, Empty, message, Typography } from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getMySubmissions } from '../../api/submission'

const { Title } = Typography

const SubmittedList = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const res = await getMySubmissions()
      setSubmissions(res.submissions || [])
    } catch (error) {
      message.error(error?.message || '获取已提交作业列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleViewDetail = (record) => {
    const assignmentId = record.assignmentId || record.assignment?.id
    if (assignmentId) {
      navigate(`/student/assignments/${assignmentId}`)
    }
  }

  const handleDownload = (record) => {
    window.open(`/api/files/submission/download/${record.id}`, '_blank')
  }

  const getStatusTag = (status) => {
    if (status === 'OVERDUE') {
      return <Tag color="orange">逾期</Tag>
    }
    return <Tag color="success">已提交</Tag>
  }

  const columns = [
    {
      title: '作业标题',
      key: 'assignmentTitle',
      width: 200,
      render: (_, record) => record.assignment?.title || '-'
    },
    {
      title: '教师',
      key: 'teacherName',
      width: 120,
      render: (_, record) => record.assignment?.teacher?.name || '-'
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 180,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score) => {
        if (score === null || score === undefined) {
          return <span style={{ color: '#999' }}>未批改</span>
        }
        return <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{score} 分</span>
      }
    },
    {
      title: '提交文件',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 200,
      ellipsis: true,
      render: (fileName) => fileName || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
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
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>已提交作业</Title>
      {submissions.length === 0 ? (
        <Empty description="暂无已提交作业" />
      ) : (
        <Table
          dataSource={submissions}
          columns={columns}
          rowKey="id"
          scroll={{ x: 900 }}
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
