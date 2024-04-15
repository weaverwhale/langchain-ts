import langfuse from './helpers/langfuse'
import { supabase } from './helpers/supabase'
import { tools, prompt } from './helpers/tools'
import { model, modelWithFunctions } from './helpers/llm'
import random from './helpers/idGenerator'

// langchain stuff
import { RunnableSequence } from '@langchain/core/runnables'
import { AgentExecutor, type AgentStep } from 'langchain/agents'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'

export const askMoby = async (
  input: string = 'Tell me about yourself',
  conversationId?: string,
) => {
  const { data } = await supabase.from('conversations').select('*').eq('id', conversationId)
  const messages = data?.[0]?.messages ?? []
  const chatHistory: BaseMessage[] = messages.map((message: { role: string; content: string }) => {
    if (message.role === 'ai') {
      return new AIMessage(JSON.stringify(message.content))
    } else {
      return new HumanMessage(JSON.stringify(message.content))
    }
  })

  const runnableAgent = RunnableSequence.from([
    {
      input: (i: { input: string; steps: AgentStep[] }) => i.input,
      agent_scratchpad: (i: { input: string; steps: AgentStep[] }) =>
        formatToOpenAIFunctionMessages(i.steps),
      chat_history: (i: any) => i.chat_history,
    },
    prompt,
    modelWithFunctions,
    new OpenAIFunctionsAgentOutputParser(),
  ])

  const executor = AgentExecutor.fromAgentAndTools({
    agent: runnableAgent,
    tools,
  })
  const invokee = await executor.invoke(
    {
      input,
      chat_history: chatHistory,
    },
    {
      configurable: { sessionId: conversationId },
    },
  )

  // save to supabase
  if (conversationId && messages.length > 0) {
    const { error } = await supabase
      .from('conversations')
      .update([
        {
          messages: [
            ...messages,
            { role: 'user', content: invokee.input },
            { role: 'ai', content: invokee.output },
          ],
        },
      ])
      .eq('id', conversationId)

    if (error) {
      console.error(error)
    }

    return {
      ...invokee,
      id: conversationId,
    }
  } else {
    const newId = random()
    const { error } = await supabase.from('conversations').insert([
      {
        id: newId,
        messages: [
          ...messages,
          { role: 'user', content: invokee.input },
          { role: 'ai', content: invokee.output },
        ],
      },
    ])

    if (error) {
      console.error(error)
    }

    return {
      ...invokee,
      id: newId,
    }
  }
}

export async function question(question: string, conversationId?: string): Promise<any> {
  const sessionId = conversationId ?? random()
  const trace = langfuse.trace({
    name: 'ask-moby',
    sessionId,
    input: JSON.stringify(question),
  })

  const generation = trace.generation({
    name: 'generation',
    input: JSON.stringify(question),
    model,
  })

  generation.update({
    completionStartTime: new Date(),
  })

  const response = await askMoby(question, sessionId)

  generation.end({
    output: JSON.stringify(response),
    level: 'DEFAULT',
  })

  trace.update({
    output: JSON.stringify(response),
  })

  await langfuse.shutdownAsync()

  return response
}

// question('What is my Facebook ad spend and clicks last 5 days broken down by day? order by day')

export default question
