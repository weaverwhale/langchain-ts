import { StringOutputParser } from '@langchain/core/output_parsers'
import langfuse from './helpers/langfuse'
import { model, llm } from './helpers/llm'
import random from './helpers/idGenerator'

export async function question(question: string, conversationId?: string): Promise<any> {
  const trace = langfuse.trace({
    name: 'ask-gpt',
    sessionId: 'gpt.conversation.' + (conversationId ?? random()),
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

  const chain = llm.pipe(new StringOutputParser())
  const response = await chain.invoke(question)

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
