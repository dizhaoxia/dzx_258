import React, { useEffect, useState } from 'react'
import { Table, Button, Tag, Space, Popconfirm, message, Typography } from 'antd'
import { PlusOutlined, EyeOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getAssignments, deleteAssignment } from '../../api/assignment'

const { Title } = Typography

const AssignmentList = () => {
  const navigate = useNavigate()
  const [dataSource, setDataSource] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const res = await getAssignments({ page, pageSize })
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
  }, [page, pageSize])

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

  const columns = [
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '附件',
      key: 'attachment',
      width: 80,
      render: (_, record) => record.fileName ? (
        <Tag color="blue" icon={<FileTextOutlined />}>有附件</Tag>
      ) : (
        <Tag color="default">无附件</Tag>
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
      title: '提交人数',
      key: 'submissionCount',
      width: 100,
      render: (_, record) => record._count?.submissions || 0
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
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
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
