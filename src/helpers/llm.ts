import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { StringOutputParser } from '@langchain/core/output_parsers'

const outputParser = new StringOutputParser()

import { tools, prompt, mobyPrompt } from './tools'

export const model = 'gpt-3.5-turbo-1106'
export const llm = new ChatOpenAI({
  model,
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
})

const agent = await createOpenAIFunctionsAgent({
  llm,
  tools,
  prompt,
})

export const agentExecutor = new AgentExecutor({
  agent,
  tools,
})

// to stream
export const streamQuestion = async (input: string = 'Tell me about yourself') =>
  agentExecutor.stream({
    input,
  })

// to call
export const askAlan = async (input: string = 'Tell me about yourself') => {
  return await agentExecutor.invoke({
    input,
  })
}

export const askGpt = async (input: string = 'Tell me about yourself') => {
  const chain = llm.pipe(outputParser)
  return await chain.invoke(input)
}

export const askMoby = async (input: string = 'Tell me about yourself') => {
  const chain = mobyPrompt.pipe(llm).pipe(outputParser)
  return await chain.invoke({
    input,
  })
}
