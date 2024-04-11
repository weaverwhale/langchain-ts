import express, { Request, Response } from 'express'
import chalk from 'chalk'
import * as dotenv from 'dotenv'

import askAlan from './askAlan'
import askGPT from './askGPT'
import askLangfuse from './askLangfuse'
import askMoby from './askMoby'

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

app.post('/ask-alan', async (req: Request, res: Response) => {
  console.log(req.body)
  const question = req.body?.question?.trim() ?? ''

  if (question.length === 0)
    return res.json({
      code: 403,
      message: 'Please provide a question',
      error: true,
    })

  try {
    const alanResponse = await askAlan(question)
    return res.json({
      answer: alanResponse ?? 42,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).send(e)
  }
})

app.post('/ask-gpt', async (req: Request, res: Response) => {
  const question = req.body?.question?.trim() ?? ''

  if (question.length === 0)
    return res.json({
      code: 403,
      message: 'Please provide a question',
      error: true,
    })

  try {
    const gptResponse = await askGPT(question)
    return res.json({
      answer: gptResponse ?? 42,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).send(e)
  }
})

app.post('/ask-langfuse', async (req: Request, res: Response) => {
  const question = req.body?.question?.trim() ?? ''
  const conversationId = req.body?.conversationId?.trim() ?? ''

  if (question.length === 0)
    return res.json({
      code: 403,
      message: 'Please provide a question',
      error: true,
    })

  try {
    const langfuseResponse = await askLangfuse(question, conversationId)
    return res.json({
      answer: langfuseResponse ?? 42,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).send(e)
  }
})

app.post('/ask-moby', async (req: Request, res: Response) => {
  const question = req.body?.question?.trim() ?? ''

  if (question.length === 0)
    return res.json({
      code: 403,
      message: 'Please provide a question',
      error: true,
    })

  try {
    const mobyResponse = await askMoby(question)
    return res.json({
      answer: mobyResponse ?? 42,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).send(e)
  }
})

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
