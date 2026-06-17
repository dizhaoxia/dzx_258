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

export const batchDownloadSubmissions = (assignmentId) => {
  window.open(`/api/files/assignment/${assignmentId}/batch-download`, '_blank')
}

export const searchStudents = (name) => {
  return api.get('/files/students/search', { params: { name } })
}

export const downloadStudentSubmissions = (studentId) => {
  window.open(`/api/files/student/${studentId}/submissions/download`, '_blank')
}
