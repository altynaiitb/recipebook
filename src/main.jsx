import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RecipeProvider } from './context/RecipeContext'
import App from './App'
import './styles.css'

// ============================================
// LAB 4 REQUIREMENT: React Router Setup
// BrowserRouter wraps the entire application
// RecipeProvider provides global state via Context
// ============================================

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <RecipeProvider>
        <App />
      </RecipeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
