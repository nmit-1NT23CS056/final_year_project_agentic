import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Assessment from './pages/Assessment'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <SignedOut>
          <Login />
        </SignedOut>
      } />
      <Route path="/register" element={
        <SignedOut>
          <Register />
        </SignedOut>
      } />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } 
      />
      
      <Route 
        path="/assessment" 
        element={
          <>
            <SignedIn>
              <Assessment />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } 
      />
      
      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
