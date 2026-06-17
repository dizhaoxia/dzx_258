import React, { useEffect, useState } from 'react'
import {
  Descriptions,
  Tag,
  Table,
  Button,
  Space,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Typography,
  Card,
  Spin
} from 'antd'
import {
  ArrowLeftOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileTextOutlined,
  TrophyOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { getAssignmentDetail } from '../../api/assignment'
import { gradeSubmission, getSubmissionDetail } from '../../api/submission'
import FilePreview from '../../components/FilePreview'

const { Title } = Typography
const { TextArea } = Input

const AssignmentDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentSubmission, setCurrentSubmission] = useState(null)
  const [grading, setGrading] = useState(false)
  const [form] = Form.useForm()
  const [previewFile, setPreviewFile] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [submissionLoading, setSubmissionLoading] = useState(false)

  const fetchAssignmentDetail = async () => {
    setLoading(true)
    try {
      const res = await getAssignmentDetail(id)
      setAssignment(res.assignment)
      setSubmissions(res.assignment?.submissions || [])
    } catch (error) {
      message.error(error?.message || '获取作业详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchAssignmentDetail()
    }
  }, [id])

  const getStatusTag = (isOverdue) => {
    if (isOverdue) {
      return <Tag color="red">已截止</Tag>
    }
    return <Tag color="green">进行中</Tag>
  }

  const getSubmissionStatusTag = (status, score) => {
    if (status === 'GRADED') {
      return (
        <Tag icon={<TrophyOutlined />} color="gold">
          已评分
          {score !== null && score !== undefined ? ` (${score}分)` : ''}
        </Tag>
      )
    }
    if (status === 'OVERDUE') {
      return <Tag color="orange">逾期</Tag>
    }
    return <Tag icon={<CheckCircleOutlined />} color="success">已提交</Tag>
  }

  const handleViewSubmission = async (submission) => {
    setSubmissionLoading(true)
    try {
      const res = await getSubmissionDetail(submission.id)
      setCurrentSubmission(res.submission)
      form.setFieldsValue({
        score: res.submission?.score,
        feedback: res.submission?.feedback
      })
      setDetailModalOpen(true)
    } catch (error) {
      message.error(error?.message || '获取提交详情失败')
    } finally {
      setSubmissionLoading(false)
    }
  }

  const handleGrade = async () => {
    try {
      const values = await form.validateFields()
      setGrading(true)
      await gradeSubmission(currentSubmission.id, values)
      message.success('打分成功')
      setDetailModalOpen(false)
      fetchAssignmentDetail()
    } catch (error) {
      if (error?.errorFields) {
        return
      }
      message.error(error?.message || '打分失败')
    } finally {
      setGrading(false)
    }
  }

  const handlePreviewSubmission = (submission) => {
    const file = {
      name: submission.fileName,
      url: `/api/files/submission/${submission.id}`
    }
    setPreviewFile(file)
    setPreviewOpen(true)
  }

  const handleDownloadSubmission = (submission) => {
    window.open(`/api/files/submission/download/${submission.id}`, '_blank')
  }

  const handlePreviewAssignmentFile = () => {
    const file = {
      name: assignment.fileName,
      url: `/api/files/assignment/${assignment.id}`
    }
    setPreviewFile(file)
    setPreviewOpen(true)
  }

  const handleDownloadAssignmentFile = () => {
    window.open(`/api/files/assignment/download/${assignment.id}`, '_blank')
  }

  const submissionColumns = [
    {
      title: '学生姓名',
      key: 'studentName',
      width: 120,
      render: (_, record) => record?.student?.name || '-'
    },
    {
      title: '学号',
      key: 'studentNo',
      width: 140,
      render: (_, record) => record?.student?.studentNo || '-'
    },
    {
      title: '班级',
      key: 'className',
      width: 140,
      render: (_, record) => record?.student?.className || '-'
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
      width: 120,
      render: (status, record) => getSubmissionStatusTag(status, record.score)
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score) => score !== null && score !== undefined ? score : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewSubmission(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreviewSubmission(record)}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadSubmission(record)}
          >
            下载
          </Button>
        </Space>
      )
    }
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!assignment) {
    return <div>作业不存在</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/teacher/assignments')}
          style={{ padding: 0, marginBottom: 16 }}
        >
          返回作业列表
        </Button>
        <Title level={3} style={{ margin: 0 }}>作业详情</Title>
      </div>

      <Card style={{ marginBottom: 24 }} title="作业基本信息">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="作业标题">
            {assignment.title}
          </Descriptions.Item>
          {(assignment.courseName || assignment.semester || assignment.week) && (
            <Descriptions.Item label="课程信息">
              <Space wrap>
                {assignment.courseName && <Tag color="blue">{assignment.courseName}</Tag>}
                {assignment.semester && <Tag color="purple">{assignment.semester.replace(/-(\d)$/, ' 第$1学期')}</Tag>}
                {assignment.week && <Tag color="cyan">第 {assignment.week} 周</Tag>}
              </Space>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="作业描述">
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {assignment.description}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="截止时间">
            <Space>
              {dayjs(assignment.deadline).format('YYYY-MM-DD HH:mm')}
              {getStatusTag(assignment.isOverdue)}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="发布时间">
            {dayjs(assignment.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="发布教师">
            {assignment.teacher?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="教师附件">
            {assignment.fileName ? (
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <span>{assignment.fileName}</span>
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={handlePreviewAssignmentFile}
                >
                  预览
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadAssignmentFile}
                >
                  下载
                </Button>
              </Space>
            ) : (
              <span style={{ color: '#999' }}>无附件</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`学生提交列表（${submissions.length}人）`}>
        <Table
          columns={submissionColumns}
          dataSource={submissions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="查看提交详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleGrade}
            loading={grading}
          >
            提交打分
          </Button>
        ]}
        width={700}
        destroyOnClose
      >
        {submissionLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin tip="加载中..." />
          </div>
        ) : (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="学生姓名">
                {currentSubmission?.student?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="学号">
                {currentSubmission?.student?.studentNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间" span={2}>
                {currentSubmission?.submittedAt
                  ? dayjs(currentSubmission.submittedAt).format('YYYY-MM-DD HH:mm')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="提交状态">
                {getSubmissionStatusTag(currentSubmission?.status, currentSubmission?.score)}
              </Descriptions.Item>
              <Descriptions.Item label="当前分数">
                {currentSubmission?.score !== null && currentSubmission?.score !== undefined
                  ? <span style={{ fontWeight: 'bold', color: '#d48806', fontSize: 16 }}>{currentSubmission.score} 分</span>
                  : '未打分'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 500, marginBottom: 8 }}>提交文件：</p>
              {currentSubmission?.fileName ? (
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  <Space>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <span>{currentSubmission.fileName}</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreviewSubmission(currentSubmission)}
                    >
                      预览
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadSubmission(currentSubmission)}
                    >
                      下载
                    </Button>
                  </Space>
                </div>
              ) : (
                <span style={{ color: '#999' }}>无提交文件</span>
              )}
            </div>

            {currentSubmission?.feedback && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 500, marginBottom: 8 }}>教师评语：</p>
                <p style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {currentSubmission.feedback}
                </p>
              </div>
            )}

            <Form form={form} layout="vertical">
              <Form.Item
                label="打分"
                name="score"
                rules={[{ required: true, message: '请输入分数' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="请输入分数（0-100）"
                />
              </Form.Item>
              <Form.Item label="评语" name="feedback">
                <TextArea
                  rows={3}
                  placeholder="请输入评语（选填）"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <FilePreview
        file={previewFile}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}

export default AssignmentDetail
