import langfuse from './langfuse'
import { supabase } from './supabase'
import {
  tools,
  mobyTools,
  mobySystemPromptTemplate,
  gptSystemPromptTemplate,
  gistSystemPromptTemplate,
} from './tools'
import { modelWithFunctions, mobyModelWithFunctions, newModelWithFunctions } from './llm'
import { defaultQuestion, defaultShopId } from './constants'
import random from './idGenerator'

// langchain stuff
import { RunnableSequence } from '@langchain/core/runnables'
import { AgentExecutor, type AgentStep } from 'langchain/agents'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'
import { statusSystemPromptTemplate } from './tools'

export const ask = async (
  input: string,
  source: SourceType,
  conversationId?: string,
): Promise<Answer> => {
  console.log(
    `[${conversationId ?? 'new convo'}] Asking ${source} question: ${JSON.stringify(
      input,
    ).substring(0, 100)}`,
  )

  const isMoby = source === 'moby'
  const isGist = source === 'gist'
  const isStatus = source === 'status'

  const currentPromptTemplate = isStatus
    ? statusSystemPromptTemplate
    : isGist
    ? gistSystemPromptTemplate
    : isMoby
    ? mobySystemPromptTemplate
    : gptSystemPromptTemplate
  const currentModelWithFunctions =
    isStatus || isGist
      ? newModelWithFunctions
      : isMoby
      ? mobyModelWithFunctions
      : modelWithFunctions

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
    currentPromptTemplate,
    currentModelWithFunctions,
    new OpenAIFunctionsAgentOutputParser(),
  ])

  const executor = AgentExecutor.fromAgentAndTools({
    agent: runnableAgent,
    tools: isMoby ? mobyTools : tools,
  })
  const invokee = await executor.invoke(
    {
      input,
      chat_history: chatHistory,
    },
    {
      configurable: { sessionId: conversationId, shopId: defaultShopId },
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
  } else {
    const { error } = await supabase.from('conversations').insert([
      {
        id: conversationId,
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
  }

  return {
    ...(invokee as any),
    conversationId,
    source,
  }
}

export async function askQuestion(
  input: string = defaultQuestion,
  source: SourceType,
  conversationId?: string,
): Promise<Answer> {
  const sessionId = conversationId || random()
  const trace = langfuse.trace({
    name: `ask-${source}`,
    input: JSON.stringify(input),
    sessionId,
  })

  const response = await ask(input, source, sessionId)

  trace.update({
    output: JSON.stringify(response?.output ?? response),
  })

  await langfuse.shutdownAsync()

  return response
}
