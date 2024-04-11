import { ChatOpenAI } from '@langchain/openai'
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { AgentExecutor, type AgentStep } from 'langchain/agents'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'
import { tools, prompt } from './tools'

export const model = 'gpt-3.5-turbo-1106'
export const llm = new ChatOpenAI({
  model,
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
})

const outputParser = new StringOutputParser()

const modelWithFunctions = llm.bind({
  functions: tools.map((tool) => convertToOpenAIFunction(tool)),
})

const runnableAgent = RunnableSequence.from([
  {
    input: (i: { input: string; steps: AgentStep[] }) => i.input,
    agent_scratchpad: (i: { input: string; steps: AgentStep[] }) =>
      formatToOpenAIFunctionMessages(i.steps),
  },
  prompt,
  modelWithFunctions,
  new OpenAIFunctionsAgentOutputParser(),
])

const executor = AgentExecutor.fromAgentAndTools({
  agent: runnableAgent,
  tools,
})

export const askGpt = async (input: string = 'Tell me about yourself') => {
  const chain = llm.pipe(outputParser)
  return await chain.invoke(input)
}

export const askMoby = async (input: string = 'Tell me about yourself') => {
  return await executor.invoke({
    input,
  })
}
