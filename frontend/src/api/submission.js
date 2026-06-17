import api from './request'

export const submitAssignment = (assignmentId, formData, onUploadProgress) => {
  return api.post(`/submissions/assignment/${assignmentId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  })
}

export const getMySubmissions = (params) => {
  return api.get('/submissions/mine', { params })
}

export const getSubmissionDetail = (id) => {
  return api.get(`/submissions/${id}`)
}

export const gradeSubmission = (id, data) => {
  return api.put(`/submissions/${id}/grade`, data)
}
