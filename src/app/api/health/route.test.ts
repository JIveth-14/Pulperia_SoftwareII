const mockJson = jest.fn((body: unknown, init?: { status?: number }) => ({
  status: init?.status ?? 200,
  json: async () => body,
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => mockJson(body, init),
  },
}))

import { GET } from './route'

describe('GET /api/health', () => {
  it('returns status ok with a valid ISO timestamp', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.timestamp).toEqual(expect.any(String))
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false)
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
  })
})
