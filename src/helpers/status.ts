import { statusUrls, defaultHeaders } from './constants'

const isUp = async (url: string, headers?: Record<string, string>, body?: any) => {
  const params: RequestInit = {
    headers: headers || defaultHeaders,
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : null,
  }

  const res = await fetch(url, params)
  if (res.status === 200 || res.ok) {
    return {
      status: true,
      info: null,
    }
  }

  return {
    status: false,
    info: res.statusText,
  }
}

export const getStatus = async () => {
  const results = await Promise.all(
    statusUrls.map(async ({ title, url, body }) => {
      const { status, info } = await isUp(url, defaultHeaders, body)

      return {
        status,
        info,
        title,
        url,
      }
    }),
  )

  return {
    results,
  }
}
