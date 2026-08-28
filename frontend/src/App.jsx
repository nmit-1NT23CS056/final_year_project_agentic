import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Assessment from './pages/Assessment'
import Roadmap from './pages/Roadmap'

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
        path="/jobs" 
        element={
          <>
            <SignedIn>
              <Jobs />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
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
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        } 
      />
      
      <Route 
        path="/roadmap" 
        element={
          <>
            <SignedIn>
              <Roadmap />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
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
