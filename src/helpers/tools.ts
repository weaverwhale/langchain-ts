// import { TavilySearchResults } from '@langchain/community/tools/tavily_search'
import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { Calculator } from '@langchain/community/tools/calculator'
import { DynamicTool } from '@langchain/community/tools/dynamic'
import langfuse from './langfuse'
import {
  defaultShopId,
  genericSystemPrompt,
  mobySystemPrompt,
  helpCenterPrompt,
  mobyPrompt,
  wikipediaPrompt,
  gistSystemPrompt,
  statusSystemPrompt,
} from './constants'
import loggy from './loggy'

const generatePromptTemplate = (sentPrompt: string) =>
  ChatPromptTemplate.fromMessages([
    ['system', sentPrompt],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ])

const systemPrompt = await langfuse.getPrompt('Moby System Prompt')
const compiledSystemPrompt = systemPrompt.prompt
  ? systemPrompt.prompt
  : mobySystemPrompt(defaultShopId)
export const mobySystemPromptTemplate = generatePromptTemplate(compiledSystemPrompt)
export const gptSystemPromptTemplate = generatePromptTemplate(genericSystemPrompt)
export const gistSystemPromptTemplate = generatePromptTemplate(gistSystemPrompt)
export const statusSystemPromptTemplate = generatePromptTemplate(statusSystemPrompt)

const remoteHelpCenterPrompt = await (
  await langfuse.getPrompt('Help Center Prompt')
).compile({ shopId: defaultShopId })
const helpCenter = new DynamicTool({
  name: 'help_center',
  description: remoteHelpCenterPrompt ?? helpCenterPrompt,
  func: async (question: string, runManager, meta) => {
    const sessionId = meta?.configurable?.sessionId

    const trace = langfuse.trace({
      name: 'help-center',
      input: JSON.stringify(question),
      sessionId,
    })

    const generation = trace.generation({
      name: 'help-center',
      input: JSON.stringify(question),
      model: 'triple-whale-help-center',
    })

    generation.update({
      completionStartTime: new Date(),
    })

    try {
      const data = await fetch('http://ai-nlq-help-center.srv.whale3.io/get-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TW_IDENTITY_TOKEN}`,
        },
        body: JSON.stringify({
          question,
        }),
      }).then((res) => res.json())

      if (data && data.answer) {
        loggy('Help center answer', data.answer)
        generation.end({
          output: JSON.stringify(data.answer),
          level: 'DEFAULT',
        })

        trace.update({
          output: JSON.stringify(data.answer),
        })
        return data.answer
      } else {
        const output = "Didn't find requested data"
        generation.end({
          output,
          level: 'WARNING',
        })

        trace.update({
          output,
        })
        return output
      }
    } catch (error) {
      loggy('Error in helpCenter', true)

      generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })

      trace.update({
        output: JSON.stringify(error),
      })

      return 'Error in helpCenter'
    } finally {
      await langfuse.shutdownAsync()
    }
  },
})

const remoteMobyPrompt = await (
  await langfuse.getPrompt('Moby Prompt')
).compile({ shopId: defaultShopId })
const askMoby = new DynamicTool({
  name: 'ask_moby',
  description: remoteMobyPrompt ?? mobyPrompt,
  func: async (question: string, runManager, meta) => {
    const sessionId = meta?.configurable?.sessionId
    const shopId = meta?.configurable?.shopId

    const body = {
      question,
      userId: null,
      conversationId: sessionId,
      stream: false,
      source: 'chat',
      shopId: shopId,
      generateInsights: 'false',
    }

    const trace = langfuse.trace({
      name: 'ask-moby',
      input: JSON.stringify(question),
      sessionId,
    })

    const generation = trace.generation({
      name: 'ask-moby',
      input: JSON.stringify(question),
      model: 'moby',
    })

    try {
      generation.update({
        completionStartTime: new Date(),
      })

      const { data, text } = await fetch('http://willy.srv.whale3.io/answer-nlq-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TW_IDENTITY_TOKEN}`,
        },
        body: JSON.stringify(body),
      }).then((res) => res.json())

      if (data && data.data && data.data.length > 0) {
        loggy('Willy answer', data.data)

        let preparedData = ''
        for (const item of data.data) {
          preparedData += `${item.name} - ${item.value.slice(0, 50)}\n`
        }

        generation.end({
          output: JSON.stringify(data.data?.answer?.output ?? data.data),
          level: 'DEFAULT',
        })

        trace.update({
          output: JSON.stringify(data.data?.answer?.output ?? data.data),
        })

        return preparedData
      } else if (text && text.length > 0) {
        generation.end({
          output: JSON.stringify(text),
          level: 'DEFAULT',
        })

        trace.update({
          output: JSON.stringify(text),
        })
        return text
      } else {
        const output = "Didn't find requested data"
        generation.end({
          output,
          level: 'WARNING',
        })

        trace.update({
          output,
        })
        return output
      }
    } catch (error) {
      generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })

      trace.update({
        output: JSON.stringify(error),
      })

      return 'Error in askMoby'
    } finally {
      await langfuse.shutdownAsync()
    }
  },
})

const WikipediaQuery = new DynamicTool({
  name: 'wikipedia',
  description: wikipediaPrompt,
  func: async (question: string, runManager, meta) => {
    const sessionId = meta?.configurable?.sessionId

    const trace = langfuse.trace({
      name: 'wikipedia',
      input: JSON.stringify(question),
      sessionId,
    })

    const generation = trace.generation({
      name: 'wikipedia',
      input: JSON.stringify(question),
      model: 'wikipedia',
    })

    try {
      generation.update({
        completionStartTime: new Date(),
      })

      const wikipediaQuery = new WikipediaQueryRun({
        topKResults: 1,
        maxDocContentLength: 500,
      })

      const result = await wikipediaQuery.call(question)

      generation.end({
        output: JSON.stringify(result),
        level: 'DEFAULT',
      })

      trace.update({
        output: JSON.stringify(result),
      })

      return result
    } catch (error) {
      generation.end({
        output: JSON.stringify(error),
        level: 'ERROR',
      })

      trace.update({
        output: JSON.stringify(error),
      })

      return 'Error in wikipediaQuery'
    } finally {
      await langfuse.shutdownAsync()
    }
  },
})

export const tools = [
  WikipediaQuery,
  //new TavilySearchResults({}),
  new Calculator(),
]

export const mobyTools = [helpCenter, askMoby, ...tools]
