import { supabase } from './supabase'
import { tools, mobySystemPromptTemplate, gptSystemPromptTemplate } from './tools'
import { modelWithFunctions } from './llm'
import random from './idGenerator'

// langchain stuff
import { RunnableSequence } from '@langchain/core/runnables'
import { AgentExecutor, type AgentStep } from 'langchain/agents'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'

export const ask = async (
  input: string = 'Tell me about yourself',
  source: 'moby' | 'gpt',
  conversationId?: string,
) => {
  const isMoby = source === 'moby'
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('source', source)
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
    isMoby ? mobySystemPromptTemplate : gptSystemPromptTemplate,
    modelWithFunctions,
    new OpenAIFunctionsAgentOutputParser(),
  ])

  const executor = AgentExecutor.fromAgentAndTools({
    agent: runnableAgent,
    tools: isMoby ? [] : tools,
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
      conversationId,
      source,
    }
  } else {
    const newId = random()
    const { error } = await supabase.from('conversations').insert([
      {
        id: newId,
        source,
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
      conversationId: newId,
      source,
    }
  }
}