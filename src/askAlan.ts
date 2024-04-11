import langfuse from './helpers/langfuse'
import { model, askAlan } from './helpers/llm'
import { v4 as uuidv4 } from 'uuid'

export async function question(question: string, conversationId?: string): Promise<any> {
  const trace = langfuse.trace({
    name: 'ask-alan',
    sessionId: 'alan.conversation.' + (conversationId ?? uuidv4()),
  })

  const generation = trace.generation({
    name: 'generation',
    input: JSON.stringify(question),
    model,
  })

  generation.update({
    completionStartTime: new Date(),
  })

  const response = await askAlan(question)

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
