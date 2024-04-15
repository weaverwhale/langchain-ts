import { Request, Response } from 'express'
import { askQuestion } from './ask'

export const handler = async (req: Request, res: Response, context: SourceType) => {
  const question = req.body?.question?.trim() ?? ''
  const conversationId = req.body?.conversationId?.toString().trim() ?? null

  if (question.length === 0)
    return res.json({
      code: 403,
      message: 'Please provide a question',
      error: true,
    })

  try {
    const answer = await askQuestion(question, context, conversationId)
    return res.json({
      answer: answer ?? 42,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).send(e)
  }
}

export default handler
