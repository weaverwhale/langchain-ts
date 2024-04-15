import { ChatOpenAI } from '@langchain/openai'
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling'
import { tools } from './tools'
import { model } from './constants'

export const llm = new ChatOpenAI({
  model,
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
})

export const modelWithFunctions = llm.bind({
  functions: tools.map((tool) => convertToOpenAIFunction(tool)),
})
