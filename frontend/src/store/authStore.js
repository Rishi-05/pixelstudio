import { create } from 'zustand'
import { authApi } from '../api/client'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('ps_token') || null,
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authApi.login(username, password)
      localStorage.setItem('ps_token', data.access_token)
      const me = await authApi.me()
      set({ token: data.access_token, user: me.data, loading: false })
      return true
    } catch (err) {
      set({ loading: false, error: err.response?.data?.detail || 'Login failed' })
      return false
    }
  },

  register: async (username, email, password) => {
    set({ loading: true, error: null })
    try {
      await authApi.register({ username, email, password })
      return await get().login(username, password)
    } catch (err) {
      set({ loading: false, error: err.response?.data?.detail || 'Registration failed' })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('ps_token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    if (!get().token) return
    try {
      const { data } = await authApi.me()
      set({ user: data })
    } catch {
      get().logout()
    }
  },
}))
