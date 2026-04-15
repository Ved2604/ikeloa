import { v4 as uuidv4 } from 'uuid'

export const generateId = (): string => uuidv4()

export const generateSessionCode = (): string => {
  // Short human-readable session code — like XKCD-4521
  const adjectives = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'SIGMA', 'OMEGA']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${adj}-${num}`
}