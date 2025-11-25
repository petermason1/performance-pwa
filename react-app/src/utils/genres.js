// Genre management utility
// For now, using localStorage. Can sync to Supabase later.

const STORAGE_KEY = 'songGenres'
const DEFAULT_GENRES = [
  'Rock', 'Pop', 'Jazz', 'Blues', 'Country', 'Folk', 'R&B', 'Hip-Hop',
  'Metal', 'Punk', 'Reggae', 'Latin', 'Classical', 'Electronic', 'Other'
]

export function getGenres() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_GENRES
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GENRES
  } catch {
    return DEFAULT_GENRES
  }
}

export function addGenre(name) {
  const genres = getGenres()
  if (!genres.includes(name)) {
    genres.push(name)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(genres))
  }
  return genres
}

export function removeGenre(name) {
  const genres = getGenres().filter(g => g !== name)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(genres))
  return genres
}

