import * as dotenv from 'dotenv'
import { askGpt, model } from './helpers/llm'
import { langfuse } from './helpers/langfuse'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()
export async function question(question: string, conversationId?: string): Promise<any> {
  const trace = langfuse.trace({
    name: 'ask-moby',
    sessionId: 'moby.conversation.' + (conversationId ?? uuidv4()),
  })

  const generation = trace.generation({
    name: 'generation',
    input: JSON.stringify(question),
    model,
  })

  generation.update({
    completionStartTime: new Date(),
  })

  const response = await askGpt(question)

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

export default question
