import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import SetupWizard from './pages/SetupWizard'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'

function App() {
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    // Check if user has completed setup
    const config = localStorage.getItem('aisdr_config')
    setIsConfigured(!!config)
  }, [])

  const handleSetupComplete = () => {
    setIsConfigured(true)
  }

  return (
    <Routes>
      <Route 
        path="/setup" 
        element={<SetupWizard onComplete={handleSetupComplete} />} 
      />
      <Route 
        path="/dashboard" 
        element={isConfigured ? <Dashboard /> : <Navigate to="/setup" />} 
      />
      <Route 
        path="/campaigns" 
        element={isConfigured ? <Campaigns /> : <Navigate to="/setup" />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={isConfigured ? "/dashboard" : "/setup" />} 
      />} />
    </Routes>
  )
}

export default App
