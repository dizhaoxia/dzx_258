import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useUserStore from './store/userStore'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import TeacherLayout from './pages/teacher/Layout'
import TeacherAssignmentList from './pages/teacher/AssignmentList'
import TeacherAssignmentDetail from './pages/teacher/AssignmentDetail'
import CreateAssignment from './pages/teacher/CreateAssignment'
import StudentLayout from './pages/student/Layout'
import StudentAssignmentList from './pages/student/AssignmentList'
import StudentAssignmentDetail from './pages/student/AssignmentDetail'
import SubmittedList from './pages/student/SubmittedList'

const App = () => {
  const { isLoggedIn, user } = useUserStore()

  const getRedirectPath = () => {
    if (isLoggedIn && user) {
      return user.role === 'TEACHER' ? '/teacher/assignments' : '/student/assignments'
    }
    return '/login'
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          isLoggedIn ? (
            <Navigate to={getRedirectPath()} replace />
          ) : (
            <Register />
          )
        }
      />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute role="TEACHER">
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route path="assignments" element={<TeacherAssignmentList />} />
        <Route path="assignment/:id" element={<TeacherAssignmentDetail />} />
        <Route path="create-assignment" element={<CreateAssignment />} />
        <Route path="" element={<Navigate to="/teacher/assignments" replace />} />
        <Route path="*" element={<Navigate to="/teacher/assignments" replace />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute role="STUDENT">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="assignments" element={<StudentAssignmentList />} />
        <Route path="assignments/:id" element={<StudentAssignmentDetail />} />
        <Route path="submitted" element={<SubmittedList />} />
        <Route path="" element={<Navigate to="/student/assignments" replace />} />
        <Route path="*" element={<Navigate to="/student/assignments" replace />} />
      </Route>

      <Route path="/" element={<Navigate to={getRedirectPath()} replace />} />
      <Route path="*" element={<Navigate to={getRedirectPath()} replace />} />
    </Routes>
  )
}

export default App
