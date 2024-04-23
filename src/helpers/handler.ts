import { Request, Response } from 'express'
import { askQuestion } from './ask'
import { getStatus } from './status'

let statusCache: any = null
let cacheTime: number = 0
const FIVE_MINUTES = 5 * 60 * 1000

export const handler = async (req: Request, res: Response, context: SourceType) => {
  const conversationId = req.body?.conversationId?.toString().trim() ?? null
  const url = req.body?.url?.trim() ?? null
  const data = req.body?.data ?? null
  let input = req.body?.question?.trim() ?? null

  const isStatus = context === 'status'
  const currentTime = Date.now()

  if (input?.length <= 0 && url?.length <= 0 && data?.length <= 0 && context !== 'status')
    return res.json({
      code: 403,
      message: 'Please provide a question, data, or a url to fetch',
      error: true,
    })

  if (url) {
    try {
      input = await fetch(url).then((res) => res.text())
    } catch (e) {
      console.error(e)
      return res.status(500).send(e)
    }
  } else if (isStatus) {
    if (statusCache && currentTime - cacheTime < FIVE_MINUTES) {
      return res.json({
        answer: statusCache,
        isCached: true,
        cacheTime,
      })
    } else {
      try {
        input = await getStatus().then((res) => JSON.stringify(res))
      } catch (e) {
        console.error(e)
        return res.status(500).send(e)
      }
    }
  } else if (data.length > 0) {
    input = JSON.stringify(data)
  }

  try {
    const answer = await askQuestion(input, context, conversationId)

    if (isStatus && answer) {
      statusCache = answer
      cacheTime = currentTime
    }

    return res.json({
      answer: answer ?? 42,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).send(e)
  }
}

export default handler
