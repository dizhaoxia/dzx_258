import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useUserStore from '../store/userStore'

const ProtectedRoute = ({ children, role }) => {
  const { isLoggedIn, user } = useUserStore()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user?.role !== role) {
    const redirectPath = user?.role === 'TEACHER' ? '/teacher' : '/student'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

export default ProtectedRoute
