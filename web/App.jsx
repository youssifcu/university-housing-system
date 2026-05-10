import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AIChatWidget from './components/AIChatWidget'
import { AIChatProvider } from './context/AIChatContext'

import './App.css'
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const MemberDashboard = lazy(() => import('./pages/MemberDashboard'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const HomePage = lazy(() => import('./pages/HomePage'))

function App() {

  return (
    <AIChatProvider>
      <Router>
        <div className="App">
          <Suspense fallback={<div className="loading-message">Loading page...</div>}>
            <Routes>
              <Route path="/home" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/member/dashboard" element={<MemberDashboard />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
          </Suspense>
          <AIChatWidget />
        </div>
      </Router>
    </AIChatProvider>
  )
}

export default App
