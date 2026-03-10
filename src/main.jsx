import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RecipeProvider } from './context/RecipeContext'
import { FavoritesProvider } from './context/FavoritesContext'
import App from './App'
import './styles.css'

// ============================================
// LAB 5 REQUIREMENT (Задача 11): Split Context
// FavoritesProvider wraps the app INSIDE RecipeProvider.
// This means:
//   - Toggling a ♥ only re-renders components that
//     consume FavoritesContext (RecipeCard etc.)
//   - RecipeForm, CookingTimer are NOT re-rendered
//     because they only consume RecipeContext.
// ============================================

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <RecipeProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </RecipeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
