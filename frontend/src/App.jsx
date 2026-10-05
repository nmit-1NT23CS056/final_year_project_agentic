import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Assessment from './pages/Assessment'
import Roadmap from './pages/Roadmap'
import Profile from './pages/Profile'
import Interview from './pages/Interview'

import Landing from './pages/Landing'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <>
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
          <SignedOut>
            <Landing />
          </SignedOut>
        </>
      } />
      
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
      
      <Route 
        path="/profile" 
        element={
          <>
            <SignedIn>
              <Profile />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        } 
      />

      <Route 
        path="/interview" 
        element={
          <>
            <SignedIn>
              <Interview />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        } 
      />
      
      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
