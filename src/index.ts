import express, { Request, Response } from 'express'
import chalk from 'chalk'
import * as dotenv from 'dotenv'
import { askQuestion } from './helpers/ask'

// -----------------------
// data
// -----------------------
dotenv.config()
const { NODE_ENV } = process.env

// -----------------------
// express app
// -----------------------
const app = express()
const port = 9179
const appName = chalk.hex('#1877f2')('[🐳] ')
app.use(express.json())

app.post('/ask-gpt', async (req: Request, res: Response) => {
  const question = req.body?.question?.trim() ?? ''
  const conversationId = req.body?.conversationId?.toString().trim() ?? null

  if (question.length === 0)
    return res.json({
      code: 403,
      message: 'Please provide a question',
      error: true,
    })

  try {
    const answer = await askQuestion(question, 'gpt', conversationId)
    return res.json({
      answer: answer ?? 42,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).send(e)
  }
})

app.post('/ask-moby', async (req: Request, res: Response) => {
  const question = req.body?.question?.toString().trim() ?? ''
  const conversationId = req.body?.conversationId?.toString().trim() ?? null

  if (question.length === 0)
    return res.json({
      code: 403,
      message: 'Please provide a question',
      error: true,
    })

  try {
    const answer = await askQuestion(question, 'moby', conversationId)
    return res.json({
      answer: answer ?? 42,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).send(e)
  }
})

app.use(express.static('public'))

// -----------------------
// logger
// -----------------------
const loggy = () => {
  console.log(
    appName +
      chalk.green(
        `Langchain listening http://localhost:${NODE_ENV === 'production' ? '80' : port}`,
      ),
  )
}

NODE_ENV === 'production' ? app.listen('80', loggy) : app.listen(port, loggy)
