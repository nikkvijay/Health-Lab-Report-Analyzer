import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  toISOString,
  toLocalDateString,
  formatDisplayDate,
  formatDisplayDateTime,
  calculateAge,
  getRelativeTime,
} from '../dateUtils'

describe('dateUtils', () => {
  const mockDate = new Date('2024-01-15T10:30:00.000Z')
  
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('toISOString', () => {
    it('converts Date object to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      expect(toISOString(date)).toBe('2024-01-15T10:30:00.000Z')
    })

    it('converts string date to ISO string', () => {
      expect(toISOString('2024-01-15')).toBe('2024-01-15T00:00:00.000Z')
    })

    it('converts timestamp to ISO string', () => {
      const timestamp = mockDate.getTime()
      expect(toISOString(timestamp)).toBe('2024-01-15T10:30:00.000Z')
    })

    it('returns null for null/undefined input', () => {
      expect(toISOString(null)).toBe(null)
      expect(toISOString(undefined)).toBe(null)
    })

    it('returns null for invalid date', () => {
      expect(toISOString('invalid-date')).toBe(null)
    })
  })

  describe('toLocalDateString', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      expect(toLocalDateString(date)).toBe('2024-01-15')
    })

    it('handles single digit months and days', () => {
      const date = new Date('2024-02-05T10:30:00.000Z')
      expect(toLocalDateString(date)).toBe('2024-02-05')
    })

    it('returns empty string for null/undefined input', () => {
      expect(toLocalDateString(null)).toBe('')
      expect(toLocalDateString(undefined)).toBe('')
    })

    it('returns empty string for invalid date', () => {
      expect(toLocalDateString('invalid-date')).toBe('')
    })
  })

  describe('formatDisplayDate', () => {
    it('formats date with default options', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const result = formatDisplayDate(date)
      expect(result).toMatch(/Jan\s+15,\s+2024|15\s+Jan\s+2024/)
    })

    it('formats date with custom options', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const options = { year: 'numeric', month: 'long', day: 'numeric' } as const
      const result = formatDisplayDate(date, options)
      expect(result).toMatch(/January\s+15,\s+2024|15\s+January\s+2024/)
    })

    it('returns empty string for invalid input', () => {
      expect(formatDisplayDate(null)).toBe('')
      expect(formatDisplayDate('invalid-date')).toBe('')
    })
  })

  describe('formatDisplayDateTime', () => {
    it('formats datetime with default options', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const result = formatDisplayDateTime(date)
      // Result should include date and time components
      expect(result).toMatch(/Jan.*15.*2024.*10|15.*Jan.*2024.*10/)
    })

    it('returns empty string for invalid input', () => {
      expect(formatDisplayDateTime(null)).toBe('')
      expect(formatDisplayDateTime('invalid-date')).toBe('')
    })
  })

  describe('calculateAge', () => {
    it('calculates age correctly for birthday this year', () => {
      const birthDate = new Date('1990-01-15')
      expect(calculateAge(birthDate)).toBe(34)
    })

    it('calculates age correctly for birthday not yet this year', () => {
      const birthDate = new Date('1990-12-15')
      expect(calculateAge(birthDate)).toBe(33)
    })

    it('calculates age correctly for birthday already passed this year', () => {
      const birthDate = new Date('1990-01-10')
      expect(calculateAge(birthDate)).toBe(34)
    })

    it('returns 0 for future birth dates', () => {
      const futureDate = new Date('2025-01-01')
      expect(calculateAge(futureDate)).toBe(0)
    })

    it('returns null for invalid input', () => {
      expect(calculateAge(null)).toBe(null)
      expect(calculateAge('invalid-date')).toBe(null)
    })
  })

  describe('getRelativeTime', () => {
    it('returns "just now" for recent dates', () => {
      const recentDate = new Date(mockDate.getTime() - 30 * 1000) // 30 seconds ago
      expect(getRelativeTime(recentDate)).toBe('just now')
    })

    it('returns minutes ago', () => {
      const minutesAgo = new Date(mockDate.getTime() - 5 * 60 * 1000) // 5 minutes ago
      expect(getRelativeTime(minutesAgo)).toBe('5 minutes ago')
    })

    it('returns singular minute ago', () => {
      const minuteAgo = new Date(mockDate.getTime() - 1 * 60 * 1000) // 1 minute ago
      expect(getRelativeTime(minuteAgo)).toBe('1 minute ago')
    })

    it('returns hours ago', () => {
      const hoursAgo = new Date(mockDate.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
      expect(getRelativeTime(hoursAgo)).toBe('3 hours ago')
    })

    it('returns singular hour ago', () => {
      const hourAgo = new Date(mockDate.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
      expect(getRelativeTime(hourAgo)).toBe('1 hour ago')
    })

    it('returns days ago', () => {
      const daysAgo = new Date(mockDate.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      expect(getRelativeTime(daysAgo)).toBe('2 days ago')
    })

    it('returns weeks ago', () => {
      const weeksAgo = new Date(mockDate.getTime() - 2 * 7 * 24 * 60 * 60 * 1000) // 2 weeks ago
      expect(getRelativeTime(weeksAgo)).toBe('2 weeks ago')
    })

    it('returns months ago', () => {
      const monthsAgo = new Date(mockDate.getTime() - 3 * 30 * 24 * 60 * 60 * 1000) // ~3 months ago
      expect(getRelativeTime(monthsAgo)).toBe('3 months ago')
    })

    it('returns empty string for invalid input', () => {
      expect(getRelativeTime(null)).toBe('')
      expect(getRelativeTime('invalid-date')).toBe('')
    })
  })
})