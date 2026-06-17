import React, { useState } from 'react'
import {
  Form,
  Input,
  DatePicker,
  Upload,
  Button,
  message,
  Typography,
  Card,
  Progress
} from 'antd'
import { UploadOutlined, ArrowLeftOutlined, InboxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { createAssignment } from '../../api/assignment'
import useUserStore from '../../store/userStore'

const { Title } = Typography
const { TextArea } = Input
const { Dragger } = Upload

const CreateAssignment = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const { user } = useUserStore()
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileList, setFileList] = useState([])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('description', values.description)
      formData.append('deadline', values.deadline.format('YYYY-MM-DD HH:mm:ss'))
      formData.append('type', 'assignment')
      formData.append('userId', user.id)

      if (fileList.length > 0) {
        formData.append('file', fileList[0].originFileObj)
      }

      await createAssignment(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percent)
        }
      })

      message.success('作业发布成功')
      navigate('/teacher/assignments')
    } catch (error) {
      message.error(error?.message || '发布失败，请重试')
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  const beforeUpload = (file) => {
    const isLt50M = file.size / 1024 / 1024 < 50
    if (!isLt50M) {
      message.error('文件大小不能超过 50MB')
      return false
    }
    setFileList([file])
    return false
  }

  const handleRemove = () => {
    setFileList([])
    return true
  }

  const uploadProps = {
    beforeUpload,
    fileList,
    onRemove: handleRemove,
    maxCount: 1,
    multiple: false
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
        <Title level={3} style={{ margin: 0 }}>发布作业</Title>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            deadline: dayjs().add(7, 'day')
          }}
        >
          <Form.Item
            label="作业标题"
            name="title"
            rules={[
              { required: true, message: '请输入作业标题' },
              { max: 100, message: '标题不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入作业标题" size="large" />
          </Form.Item>

          <Form.Item
            label="作业描述"
            name="description"
            rules={[
              { required: true, message: '请输入作业描述' },
              { max: 2000, message: '描述不能超过2000个字符' }
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请详细描述作业要求"
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item
            label="截止时间"
            name="deadline"
            rules={[{ required: true, message: '请选择截止时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择截止时间"
              size="large"
              format="YYYY-MM-DD HH:mm"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item label="附件上传">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">
                支持单个文件上传，文件大小不超过 50MB，支持 PDF、Word、图片、压缩包等格式
              </p>
            </Dragger>
          </Form.Item>

          {submitting && uploadProgress > 0 && (
            <Form.Item>
              <Progress percent={uploadProgress} status="active" />
            </Form.Item>
          )}

          <Form.Item style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                size="large"
                onClick={() => navigate('/teacher/assignments')}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={submitting}
              >
                发布作业
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default CreateAssignment
