import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRecipes } from '../context/RecipeContext'

const SUGGESTIONS = [
  { emoji: '🍝', text: 'Quick pasta with chicken and tomatoes' },
  { emoji: '🥗', text: 'Healthy breakfast bowl with oats and berries' },
  { emoji: '🍜', text: 'Spicy Korean ramen from scratch' },
  { emoji: '🎂', text: 'Chocolate lava cake with berries' },
  { emoji: '🥘', text: 'Easy vegetarian curry with lentils' },
  { emoji: '🌮', text: 'Street-style tacos with avocado salsa' },
]

const FLOATING_FOODS = ['🍕', '🌮', '🍜', '🥗', '🍣', '🥩', '🍰', '🫐']

const SYSTEM_PROMPT = `You are an expert culinary AI chef. When providing recipes, always use this exact structured format:

**Recipe Name**
[name with a fun food emoji]

**Description**
[2-3 appetizing sentences about the dish]

**Ingredients**
- [quantity + ingredient]
(list all ingredients)

**Instructions**
1. [clear step]
(number all steps)

**Chef's Tips**
[1-2 pro tips for best results]

**Time & Servings**
Prep: X min | Cook: X min | Serves: X

Keep responses enthusiastic, practical, and delicious!`

const STORAGE_KEY = 'ai_chef_chats'
const GREETING = '👋 Hey there, future chef! I\'m your AI culinary assistant.\n\nTell me what you\'d like to cook, what ingredients you have, or ask anything about cooking! ✨\n\n*Try one of the suggestions below to get started!*'

function makeChat(id) {
  return {
    id,
    name: 'New Chat',
    messages: [{ role: 'assistant', content: GREETING }],
    savedIds: [],
    createdAt: Date.now(),
  }
}

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

function saveChats(chats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  } catch {}
}

export default function AIChefPage() {
  const { addRecipe } = useRecipes()

  const [chats, setChats] = useState(() => {
    const stored = loadChats()
    return stored || [makeChat(Date.now())]
  })
  const [activeChatId, setActiveChatId] = useState(() => {
    const stored = loadChats()
    return stored ? stored[0].id : chats?.[0]?.id ?? Date.now()
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0]
  const messages = activeChat?.messages || []
  const savedIds = activeChat?.savedIds || []

  // Persist on every change
  useEffect(() => {
    saveChats(chats)
  }, [chats])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const updateActiveChat = useCallback((updater) => {
    setChats(prev => prev.map(c => c.id === activeChatId ? updater(c) : c))
  }, [activeChatId])

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim()
    if (!userText || isLoading) return

    setInput('')

    const newUserMsg = { role: 'user', content: userText }
    const updatedMessages = [...messages, newUserMsg]

    // Auto-name the chat from first user message
    const isFirstUserMsg = messages.filter(m => m.role === 'user').length === 0
    updateActiveChat(c => ({
      ...c,
      messages: updatedMessages,
      name: isFirstUserMsg ? userText.slice(0, 40) : c.name,
    }))

    setIsLoading(true)

    try {
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
      ]

      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: apiMessages,
          max_tokens: 1200,
          temperature: 0.7,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content
      if (!reply) throw new Error('Empty response from AI')

      updateActiveChat(c => ({
        ...c,
        messages: [...updatedMessages, { role: 'assistant', content: reply }],
      }))
    } catch (err) {
      updateActiveChat(c => ({
        ...c,
        messages: [...updatedMessages, {
          role: 'assistant',
          content: `❌ **Ошибка:** ${err.message}`,
        }],
      }))
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, updateActiveChat])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  const newChat = useCallback(() => {
    const chat = makeChat(Date.now())
    setChats(prev => [chat, ...prev])
    setActiveChatId(chat.id)
    setShowSidebar(false)
    setInput('')
  }, [])

  const switchChat = useCallback((id) => {
    setActiveChatId(id)
    setShowSidebar(false)
    setInput('')
  }, [])

  const deleteChat = useCallback((id, e) => {
    e.stopPropagation()
    setChats(prev => {
      const next = prev.filter(c => c.id !== id)
      if (next.length === 0) {
        const fresh = makeChat(Date.now())
        setActiveChatId(fresh.id)
        return [fresh]
      }
      if (id === activeChatId) setActiveChatId(next[0].id)
      return next
    })
  }, [activeChatId])

  const saveRecipe = useCallback((content, msgIndex) => {
    const nameMatch = content.match(/\*\*Recipe Name\*\*\s*\n([^\n]+)/)
    const ingMatch = content.match(/\*\*Ingredients\*\*\s*\n([\s\S]*?)(?=\n\*\*|\n\d+\.|$)/)
    const descMatch = content.match(/\*\*Description\*\*\s*\n([\s\S]*?)(?=\n\*\*)/)

    const title = (nameMatch?.[1] ?? 'AI Recipe').replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim() || 'AI Recipe'
    const ingredients = ingMatch?.[1]?.replace(/^- /gm, '').trim() ?? ''
    const description = descMatch?.[1]?.trim() ?? ''

    addRecipe({ title, ingredients, description, category: 'dinner', tags: ['ai-generated'], rating: 5 })
    updateActiveChat(c => ({ ...c, savedIds: [...(c.savedIds || []), msgIndex] }))
  }, [addRecipe, updateActiveChat])

  const renderContent = (content) =>
    content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <p key={i} className="msg-section-title">{line.replace(/\*\*/g, '')}</p>
      if (line.match(/^\*\*(.+)\*\*/))
        return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
      if (line.startsWith('- '))
        return <li key={i}>{line.slice(2)}</li>
      if (line.match(/^\d+\. /))
        return <li key={i} className="numbered">{line.replace(/^\d+\. /, '')}</li>
      if (line.startsWith('*') && line.endsWith('*'))
        return <em key={i} className="msg-em">{line.slice(1, -1)}</em>
      if (!line.trim()) return <br key={i} />
      return <span key={i}>{line}<br /></span>
    })

  const hasRecipe = (content) => content.includes('**Ingredients**')

  const formatDate = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="ai-chef-page">

      {/* Hero */}
      <motion.div
        className="ai-hero"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="ai-hero-inner">
          <motion.div
            className="ai-chef-bot"
            animate={{ rotate: [0, -8, 8, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
          >
            🤖
          </motion.div>
          <div className="ai-hero-text">
            <h1 className="ai-hero-title">AI Chef Assistant</h1>
            <p className="ai-hero-sub">Powered by Llama 3 · Free · {chats.length} chat{chats.length !== 1 ? 's' : ''} saved</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <motion.button
              className="btn ai-clear-btn"
              onClick={() => setShowSidebar(s => !s)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
            >
              📚 Chats ({chats.length})
            </motion.button>
            <motion.button
              className="btn ai-clear-btn"
              onClick={newChat}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              title="New chat"
            >
              ✏️
            </motion.button>
            <div className="ai-hero-badge">FREE</div>
          </div>
        </div>

        {FLOATING_FOODS.map((emoji, i) => (
          <motion.span
            key={i}
            className="ai-float-food"
            style={{ left: `${5 + i * 12}%`, bottom: `${8 + (i % 3) * 6}px` }}
            animate={{ y: [0, -(10 + i * 2), 0], rotate: [0, 12, -8, 0] }}
            transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>

      {/* Chat sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            className="chat-sidebar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="sidebar-header">
              <h3>💬 Saved Chats</h3>
              <button className="btn sidebar-new-btn" onClick={newChat}>+ New Chat</button>
            </div>
            <div className="sidebar-list">
              {chats.map(chat => (
                <motion.div
                  key={chat.id}
                  className={`sidebar-item ${chat.id === activeChatId ? 'active' : ''}`}
                  onClick={() => switchChat(chat.id)}
                  whileHover={{ x: 3 }}
                  layout
                >
                  <div className="sidebar-item-icon">
                    {chat.id === activeChatId ? '💬' : '🗨️'}
                  </div>
                  <div className="sidebar-item-info">
                    <span className="sidebar-item-name">{chat.name}</span>
                    <span className="sidebar-item-date">{formatDate(chat.createdAt)}</span>
                  </div>
                  <motion.button
                    className="sidebar-delete"
                    onClick={(e) => deleteChat(chat.id, e)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    title="Delete chat"
                  >
                    🗑️
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      <AnimatePresence>
        {messages.length <= 1 && (
          <motion.div
            className="ai-suggestions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.3 }}
          >
            <p className="suggest-label">✨ Try asking:</p>
            <div className="suggest-grid">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  className="suggest-pill"
                  onClick={() => sendMessage(s.text)}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i + 0.4 }}
                >
                  <span className="pill-emoji">{s.emoji}</span>
                  {s.text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat messages */}
      <div className="ai-chat-area">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={`${activeChatId}-${i}`}
              className={`chat-msg ${msg.role}`}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            >
              <div className="msg-avatar">
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="msg-bubble">
                <div className="msg-content">
                  {renderContent(msg.content)}
                </div>
                {msg.role === 'assistant' && i > 0 && hasRecipe(msg.content) && (
                  <motion.button
                    className={`btn save-ai-btn ${savedIds.includes(i) ? 'saved' : ''}`}
                    onClick={() => !savedIds.includes(i) && saveRecipe(msg.content, i)}
                    whileHover={savedIds.includes(i) ? {} : { scale: 1.04 }}
                    whileTap={savedIds.includes(i) ? {} : { scale: 0.96 }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {savedIds.includes(i) ? '✅ Saved to Recipes!' : '💾 Save to My Recipes'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              className="chat-msg assistant"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key="loading"
            >
              <div className="msg-avatar">🤖</div>
              <div className="msg-bubble">
                <div className="typing-dots"><span /><span /><span /></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        className="ai-input-wrap"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="input-row">
          <textarea
            ref={inputRef}
            className="ai-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to create any recipe... (Enter to send)"
            rows={2}
            disabled={isLoading}
          />
          <motion.button
            className="btn ai-send"
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
          >
            {isLoading ? '⏳' : '🚀'}
          </motion.button>
        </div>
        <p className="input-hint">Enter to send · Shift+Enter for new line</p>
      </motion.div>
    </div>
  )
}
