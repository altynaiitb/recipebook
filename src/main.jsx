import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext'
import { RecipeProvider }       from './context/RecipeContext'
import { FavoritesProvider }    from './context/FavoritesContext'
import { TimerProvider }        from './context/TimerContext'
import App from './App'
import './styles.css'

// Порядок провайдеров важен:
// NotificationProvider — снаружи, т.к. RecipeProvider вызывает useNotifications() внутри
// TimerProvider — независим, оборачивает App чтобы таймер жил глобально

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <RecipeProvider>
          <FavoritesProvider>
            <TimerProvider>
              <App />
            </TimerProvider>
          </FavoritesProvider>
        </RecipeProvider>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
)
