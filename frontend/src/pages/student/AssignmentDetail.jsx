import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Upload,
  Progress,
  Tag,
  Space,
  message,
  Spin,
  Divider,
  Alert,
  Typography
} from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  InboxOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getAssignmentDetail } from '../../api/assignment'
import { submitAssignment } from '../../api/submission'
import FilePreview from '../../components/FilePreview'
import useUserStore from '../../store/userStore'

const { Dragger } = Upload
const { Title } = Typography

const AssignmentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [mySubmission, setMySubmission] = useState(null)
  const [reuploadMode, setReuploadMode] = useState(false)

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await getAssignmentDetail(id)
      setAssignment(res.assignment)
      setMySubmission(res.mySubmission || null)
    } catch (error) {
      message.error(error?.message || '获取作业详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchDetail()
    }
  }, [id])

  const getRemainingTime = () => {
    if (!assignment?.deadline) return ''
    const deadline = dayjs(assignment.deadline)
    const now = dayjs()
    if (now.isAfter(deadline)) {
      return '已截止'
    }
    const diffDays = deadline.diff(now, 'day')
    const diffHours = deadline.diff(now, 'hour') % 24
    if (diffDays > 0) {
      return `剩余 ${diffDays} 天 ${diffHours} 小时`
    }
    const diffMinutes = deadline.diff(now, 'minute') % 60
    return `剩余 ${diffHours} 小时 ${diffMinutes} 分钟`
  }

  const beforeUpload = (file) => {
    const isLt50M = file.size / 1024 / 1024 < 50
    if (!isLt50M) {
      message.error('文件大小不能超过 50MB')
      return false
    }
    setSelectedFile(file)
    return false
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      message.warning('请选择要上传的文件')
      return
    }

    const formData = new FormData()
    const fileObj = selectedFile.originFileObj || selectedFile
    formData.append('file', fileObj)
    formData.append('type', 'submission')
    formData.append('assignmentId', id)
    formData.append('userId', user.id)

    setSubmitting(true)
    setUploadProgress(0)

    try {
      await submitAssignment(id, formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percent)
        }
      })
      message.success('提交成功')
      setSelectedFile(null)
      setUploadProgress(0)
      setReuploadMode(false)
      fetchDetail()
    } catch (error) {
      message.error(error?.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
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

  const handlePreviewSubmission = () => {
    const file = {
      name: mySubmission.fileName,
      url: `/api/files/submission/${mySubmission.id}`
    }
    setPreviewFile(file)
    setPreviewOpen(true)
  }

  const handleDownloadSubmission = () => {
    window.open(`/api/files/submission/download/${mySubmission.id}`, '_blank')
  }

  const handleReupload = () => {
    setReuploadMode(true)
    setSelectedFile(null)
  }

  const renderAttachment = () => {
    if (!assignment?.fileName) {
      return <span style={{ color: '#999' }}>无附件</span>
    }

    return (
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
    )
  }

  const renderSubmissionInfo = () => {
    if (!mySubmission) {
      return (
        <div>
          <Tag color="default">未提交</Tag>
        </div>
      )
    }

    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          {mySubmission.status === 'GRADED' ? (
            <Tag icon={<TrophyOutlined />} color="gold">已评分</Tag>
          ) : mySubmission.status === 'OVERDUE' ? (
            <Tag color="orange">逾期提交</Tag>
          ) : (
            <Tag color="success">已提交</Tag>
          )}
          {mySubmission.score !== null && mySubmission.score !== undefined && (
            <Tag color="gold" style={{ fontWeight: 'bold', fontSize: 14, padding: '2px 10px' }}>
              得分：{mySubmission.score} 分
            </Tag>
          )}
        </div>
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: '#666' }}>提交时间：</span>
          {dayjs(mySubmission.submittedAt).format('YYYY-MM-DD HH:mm')}
        </div>
        {mySubmission.fileName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined />
            <span>{mySubmission.fileName}</span>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={handlePreviewSubmission}
            >
              预览
            </Button>
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleDownloadSubmission}
            >
              下载
            </Button>
          </div>
        )}
        {mySubmission.feedback && (
          <div style={{ marginTop: 12, padding: 16, background: '#fffbe6', borderRadius: 6, border: '1px solid #ffe58f' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#d46b08' }}>
              <TrophyOutlined style={{ marginRight: 6 }} />
              教师评语与反馈：
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{mySubmission.feedback}</div>
          </div>
        )}
      </div>
    )
  }

  const renderUploadArea = () => {
    if (assignment?.isOverdue && !mySubmission) {
      return (
        <Alert
          type="warning"
          showIcon
          message="已截止提交"
          description="作业截止时间已过，无法再提交作业。"
        />
      )
    }

    if (mySubmission && !selectedFile && !reuploadMode) {
      return (
        <div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleReupload}
          >
            重新提交
          </Button>
          <span style={{ marginLeft: 12, color: '#999', fontSize: 12 }}>
            重新提交将覆盖之前的作业
          </span>
        </div>
      )
    }

    if (selectedFile) {
      return (
        <div>
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{selectedFile.name}</div>
                <div style={{ color: '#999', fontSize: 12 }}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
              <Button type="link" size="small" onClick={handleReupload}>
                重新选择
              </Button>
            </div>
            {submitting && (
              <Progress percent={uploadProgress} status="active" style={{ marginTop: 12 }} />
            )}
          </Card>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            block
          >
            {mySubmission ? '更新提交' : '提交作业'}
          </Button>
        </div>
      )
    }

    return (
      <Dragger
        beforeUpload={beforeUpload}
        showUploadList={false}
        maxCount={1}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持单个文件上传，文件大小不超过 50MB，支持 PDF、Word、图片、压缩包等格式
        </p>
      </Dragger>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!assignment) {
    return <div>作业不存在</div>
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>作业详情</Title>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="作业标题">{assignment.title}</Descriptions.Item>
          <Descriptions.Item label="教师">
            {assignment.teacher?.name || '未知'}
          </Descriptions.Item>
          <Descriptions.Item label="截止时间">
            <Space>
              <ClockCircleOutlined />
              {dayjs(assignment.deadline).format('YYYY-MM-DD HH:mm')}
              <Tag color={assignment.isOverdue ? 'error' : 'processing'}>
                {getRemainingTime()}
              </Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="教师附件">
            {renderAttachment()}
          </Descriptions.Item>
          <Descriptions.Item label="作业描述">
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {assignment.description || '暂无描述'}
            </div>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <h3 style={{ marginBottom: 16 }}>
          <CheckCircleOutlined style={{ marginRight: 8 }} />
          我的提交
        </h3>

        {renderSubmissionInfo()}

        <Divider />

        <h3 style={{ marginBottom: 16 }}>
          <UploadOutlined style={{ marginRight: 8 }} />
          {mySubmission ? '重新提交' : '提交作业'}
        </h3>

        {renderUploadArea()}
      </Card>

      <FilePreview
        file={previewFile}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}

export default AssignmentDetail
