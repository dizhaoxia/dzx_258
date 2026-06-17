import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Button, Spin, Empty, message, Typography } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getAssignments } from '../../api/assignment'
import { getMySubmissions } from '../../api/submission'

const { Title } = Typography

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        getAssignments(),
        getMySubmissions()
      ])

      const assignmentList = assignmentsRes.assignments || []
      const submissions = submissionsRes.submissions || []

      const submissionMap = {}
      submissions.forEach(sub => {
        submissionMap[sub.assignmentId] = sub
      })

      const listWithStatus = assignmentList.map(assignment => ({
        ...assignment,
        mySubmission: submissionMap[assignment.id] || null,
        submitted: !!submissionMap[assignment.id]
      }))

      setAssignments(listWithStatus)
    } catch (error) {
      message.error(error?.message || '获取作业列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const getStatusTag = (assignment) => {
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
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#666', fontSize: 13 }}>
                        <UserOutlined />
                        {assignment.teacher?.name || '未知教师'}
                      </span>
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
