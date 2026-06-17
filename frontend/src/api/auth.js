import api from './request'

export const login = (data) => {
  return api.post('/auth/login', data)
}

export const register = (data) => {
  return api.post('/auth/register', data)
}

export const getProfile = () => {
  return api.get('/auth/profile')
}
