import { askQuestion } from './ask'
import { saveToCache } from './cache'
import { statusUrls, defaultHeaders } from './constants'

const isUp = async (url: string, headers?: Record<string, string>, body?: any) => {
  const params: RequestInit = {
    headers: headers || defaultHeaders,
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : null,
  }

  const res = await fetch(url, params)
  if (res.status === 200 || res.ok) {
    return true
  }

  return false
}

export const getStatus = async () => {
  const results = await Promise.all(
    statusUrls.map(async ({ title, url, body }) => ({
      status: await isUp(url, defaultHeaders, body),
      title,
      url,
    })),
  )

  return {
    results,
  }
}

export const hydrateStatus = async () => {
  const question = await getStatus().then((res) => JSON.stringify(res))
  const answer = await askQuestion(question, 'status')
  await saveToCache('status', Date.now(), question, answer)
}
