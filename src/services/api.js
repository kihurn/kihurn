import { supabase } from '../lib/supabase'

/**
 * Service helpers for interacting with Supabase tables.
 * Customize these queries according to your database schema.
 */

export const portfolioService = {
  // Fetch projects from Supabase
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error.message)
      throw error
    }
    return data
  },

  // Save a contact message
  async submitContactMessage({ name, email, message }) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ name, email, message, created_at: new Date().toISOString() }])
      .select()

    if (error) {
      console.error('Error submitting message:', error.message)
      throw error
    }
    return data
  },

  // Profile data fetcher
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error.message)
      throw error
    }
    return data
  },
}
