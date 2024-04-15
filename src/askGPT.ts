import langfuse from './helpers/langfuse'
import { model } from './helpers/llm'
import { ask } from './helpers/ask'
import random from './helpers/idGenerator'

export async function question(question: string, conversationId?: string): Promise<any> {
  const sessionId = conversationId ?? random()
  const trace = langfuse.trace({
    name: 'ask-gpt',
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

  const response = await ask(question, 'gpt', sessionId)

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
