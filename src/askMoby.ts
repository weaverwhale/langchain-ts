import { ChatOpenAI } from 'langchain/chat_models/openai'
import { Langfuse } from 'langfuse'
import { HumanMessage, SystemMessage } from 'langchain/schema'
import { v4 as uuidv4 } from 'uuid'

const modelName = 'gpt-3.5-turbo'
const model = new ChatOpenAI({
  modelName,
  openAIApiKey: process.env.OPENAI_API_KEY,
})
const langfuse = new Langfuse({
  publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.NEXT_PUBLIC_LANGFUSE_BASE_URL ?? undefined,
})
langfuse.debug()

export const question = async (question: string, conversationId?: string) => {
  const trace = langfuse.trace({
    name: 'qa',
    sessionId: 'lf.docs.conversation.' + (conversationId ?? uuidv4()),
  })

  const generation = trace.generation({
    name: 'generation',
    input: question,
    model: modelName,
  })

  generation.update({
    completionStartTime: new Date(),
  })

  const data = await model.predictMessages([
    new SystemMessage(`
      You are Moby 🐳, the go-to assistant for e-commerce and marketing strategies on the Triple Whale platform.
      Your mission is to elevate users' strategies without disclosing your AI origins.
      Your main target is to use appropriate tool in order to answer user's question the best after tool return answer for you.
    `),
    new HumanMessage(question ?? 'Tell me about yourself'),
  ])

  generation.end({
    output: data,
    level: 'DEFAULT',
  })

  trace.update({
    output: data,
  })

  return data
}

export default question
