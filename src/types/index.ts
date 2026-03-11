export interface Coordinates {
  lat: number
  lon: number
}

export interface FavoriteCity {
  id: string // "lat-lon" format
  city_name: string
  country?: string
  state?: string
  lat: number
  lon: number
  added_at: string
}

export interface SearchHistoryItem {
  id: string
  city_name: string
  country?: string
  state?: string
  lat: number
  lon: number
  searched_at: string
}

export type ActivityType = 'sedentary' | 'light' | 'active' | 'athletic'

export interface UserPreferences {
  temperature_unit: 'celsius' | 'fahrenheit'
  language: 'en' | 'de' | 'ua'
  first_name?: string
  age?: number
  activity_type?: ActivityType
  onboarding_completed: boolean
  updated_at: string
}

export interface WeatherSnapshot {
  temp: number
  feels_like: number
  description: string
  humidity: number
  wind_speed: number
  icon: string
}

export interface RecommendationResponse {
  content: string
  is_ai: boolean
  generated_at: string
  expires_at: string
  cached: boolean
}

export interface AuthUser {
  id: string
  email: string
}
