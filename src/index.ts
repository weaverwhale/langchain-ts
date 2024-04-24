import express, { Request, Response } from 'express'
import chalk from 'chalk'
import * as dotenv from 'dotenv'
import handler from './helpers/handler'
import { hydrateStatus } from './helpers/status'
import { FIVE_MINUTES } from './helpers/constants'

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

// -----------------------
// routes
// -----------------------
app.post('/ask-gpt', (req: Request, res: Response) => handler(req, res, 'gpt'))
app.post('/ask-moby', (req: Request, res: Response) => handler(req, res, 'moby'))
app.post('/get-gist', (req: Request, res: Response) => handler(req, res, 'gist'))
app.post('/get-status', (req: Request, res: Response) => handler(req, res, 'status'))

// -----------------------
// static
// -----------------------
app.use(express.static('public'))

// -----------------------
// CRONS
// -----------------------
setInterval(hydrateStatus, FIVE_MINUTES / 2)

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
