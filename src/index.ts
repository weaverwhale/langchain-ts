import * as dotenv from 'dotenv'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { HumanMessage } from 'langchain/schema'

dotenv.config()

const model = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  openAIApiKey: process.env.OPENAI_API_KEY,
})

const res = await model.predictMessages([
  new HumanMessage("What's a good idea for an application to build with GPT-3?"),
])

console.log(res)
