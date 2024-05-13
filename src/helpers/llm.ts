import { ChatOpenAI } from '@langchain/openai'
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling'
import { tools, mobyTools } from './tools'
import { fourOModel } from './constants'

export const llm = () =>
  new ChatOpenAI({
    model: fourOModel,
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.1,
  })

export const modelWithFunctions = llm().bind({
  functions: tools.map((tool) => convertToOpenAIFunction(tool)),
})

export const mobyModelWithFunctions = llm().bind({
  functions: mobyTools.map((tool) => convertToOpenAIFunction(tool)),
})
