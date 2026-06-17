import React, { useState, useEffect } from 'react'
import { Modal, Button, Spin, message } from 'antd'
import { EyeOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons'

const FilePreview = ({ file, onClose, open }) => {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (open && file) {
      loadFile()
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [open, file])

  const loadFile = async () => {
    if (!file?.url) return
    setLoading(true)
    setPreviewUrl('')
    try {
      const response = await fetch(file.url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      if (!response.ok) {
        throw new Error('文件加载失败')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (error) {
      message.error('文件加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!file?.url) return
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isImage = (name) => {
    if (!name) return false
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(name)
  }

  const isPdf = (name) => {
    if (!name) return false
    return /\.pdf$/i.test(name)
  }

  const isText = (name) => {
    if (!name) return false
    return /\.(txt|md|json|csv)$/i.test(name)
  }

  const renderPreview = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      )
    }

    if (!previewUrl) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>暂无预览</p>
          <p style={{ color: '#999', fontSize: 14 }}>
            {file?.name ? `文件名：${file.name}` : ''}
          </p>
          <Button type="primary" onClick={handleDownload} icon={<DownloadOutlined />}>
            下载文件
          </Button>
        </div>
      )
    }

    if (isImage(file.name)) {
      return (
        <div style={{ textAlign: 'center' }}>
          <img src={previewUrl} alt={file.name} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
        </div>
      )
    }

    if (isPdf(file.name)) {
      return (
        <iframe
          src={previewUrl}
          title={file.name}
          style={{ width: '100%', height: '70vh', border: 'none' }}
        />
      )
    }

    if (isText(file.name)) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>文本文件请下载后查看</p>
          <Button type="primary" onClick={handleDownload} icon={<DownloadOutlined />}>
            下载文件
          </Button>
        </div>
      )
    }

    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p>该文件类型暂不支持在线预览</p>
        <p style={{ color: '#999', fontSize: 14 }}>文件名：{file.name}</p>
        <Button type="primary" onClick={handleDownload} icon={<DownloadOutlined />}>
          下载文件
        </Button>
      </div>
    )
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            <EyeOutlined style={{ marginRight: 8 }} />
            {file?.name || '文件预览'}
          </span>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
          下载
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={800}
      destroyOnClose
    >
      {renderPreview()}
    </Modal>
  )
}

export default FilePreview
