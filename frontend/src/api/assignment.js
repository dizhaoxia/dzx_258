import api from './request'

export const getAssignments = (params) => {
  return api.get('/assignments', { params })
}

export const getAssignmentDetail = (id) => {
  return api.get(`/assignments/${id}`)
}

export const createAssignment = (formData, onUploadProgress) => {
  return api.post('/assignments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  })
}

export const deleteAssignment = (id) => {
  return api.delete(`/assignments/${id}`)
}

export const getSubmissions = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}/submissions`)
}

export const batchDownloadSubmissions = async (assignmentId, filename) => {
  try {
    const response = await api.get(`/files/assignment/${assignmentId}/batch-download`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename || `assignment_${assignmentId}_submissions.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return { success: true }
  } catch (error) {
    if (error instanceof Blob) {
      const text = await error.text()
      try {
        const data = JSON.parse(text)
        return { success: false, message: data.message }
      } catch {
        return { success: false, message: '下载失败' }
      }
    }
    return { success: false, message: error.message || '下载失败' }
  }
}

export const searchStudents = (name) => {
  return api.get('/files/students/search', { params: { name } })
}

export const downloadStudentSubmissions = async (studentId, filename) => {
  try {
    const response = await api.get(`/files/student/${studentId}/submissions/download`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename || `student_${studentId}_submissions.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    return { success: true }
  } catch (error) {
    if (error instanceof Blob) {
      const text = await error.text()
      try {
        const data = JSON.parse(text)
        return { success: false, message: data.message }
      } catch {
        return { success: false, message: '下载失败' }
      }
    }
    return { success: false, message: error.message || '下载失败' }
  }
}
