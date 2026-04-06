import React, { createContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

export const AppContext = createContext()

const AppContextProvider = (props) => {

  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [credit, setCredit] = useState(0)
  const [showLogin, setShowLogin] = useState(false)

  const loadCreditsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/credits', { headers: { token } })
      if (data.success) {
        setCredit(data.credits)
        setUser(data.user)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const generateImage = async (prompt) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/image/generate-image', { prompt }, { headers: { token } })
      if (data.success) {
        await loadCreditsData()
        return data.img || data.resultImage
      } else {
        toast.error(data.message)
        if (data.creditBalance === 0) {
          navigate('/buy')
        }
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (token) {
      loadCreditsData()
    } else {
      setUser(null)
      setCredit(0)
    }
  }, [token])

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    setUser(null)
    setCredit(0)
  }

  const value = {
    backendUrl,
    user, setUser,
    token, setToken,
    credit, setCredit,
    showLogin, setShowLogin,
    loadCreditsData,
    generateImage,
    logout
  }

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  )
}

export default AppContextProvider     