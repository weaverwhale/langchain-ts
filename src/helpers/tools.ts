// import { TavilySearchResults } from '@langchain/community/tools/tavily_search'
import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { Calculator } from '@langchain/community/tools/calculator'
import { DynamicTool } from '@langchain/community/tools/dynamic'
import langfuse from './langfuse'
import { mobySystemPrompt, helpCenterPrompt, mobyPrompt, wikipediaPrompt } from './constants'

export type HelpCenterLink = {
  title: string
  link: string
}

export type HelpCenterLinks = Record<string, HelpCenterLink>

export type HelpCenterResponse = {
  links: HelpCenterLinks
  answer: string
}

export const shopId = 'trueclassictees-com.myshopify.com'
const systemPrompt = await langfuse.getPrompt('Moby System Prompt')
const compiledSystemPrompt = systemPrompt.prompt ? systemPrompt.prompt : mobySystemPrompt(shopId)
export const prompt = ChatPromptTemplate.fromMessages([
  ['system', compiledSystemPrompt],
  new MessagesPlaceholder('chat_history'),
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
])

const remoteHelpCenterPrompt = await langfuse.getPrompt('Help Center Prompt')
const helpCenter = new DynamicTool({
  name: 'help_center',
  description: remoteHelpCenterPrompt.prompt ?? helpCenterPrompt,
  func: async (question: string) => {
    const trace = langfuse.trace({
      name: 'help-center',
      input: JSON.stringify(question),
    })

    const generation = trace.generation({
      name: 'generation',
      input: JSON.stringify(question),
      model: 'triple-whale-help-center',
    })

    generation.update({
      completionStartTime: new Date(),
    })

    try {
      const { data } = await fetch('http://ai-nlq-help-center.srv.whale3.io/get-answer', {
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
        console.log('Help center answer', data.answer)
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
      console.error('Error in helpCenter', error)

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

const remoteMobyPrompt = await langfuse.getPrompt('Moby Prompt')
const askMoby = new DynamicTool({
  name: 'ask_moby',
  description: remoteMobyPrompt.prompt ?? mobyPrompt,
  func: async (question: string) => {
    const body = {
      shopId,
      question,
      userId: null,
      messageId: null,
      stream: false,
      source: 'chat',
      generateInsights: 'false',
    }

    const trace = langfuse.trace({
      name: 'ask-moby',
      input: JSON.stringify(question),
    })

    const generation = trace.generation({
      name: 'generation',
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
        console.log('Willy answer', data.data)

        let preparedData = ''
        for (const item of data.data) {
          preparedData += `${item.name} - ${item.value.slice(0, 50)}\n`
        }

        generation.end({
          output: JSON.stringify(data.data),
          level: 'DEFAULT',
        })

        trace.update({
          output: JSON.stringify(data.data),
        })

        return preparedData
      } else if (text.length > 0) {
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
  func: async (question: string) => {
    const trace = langfuse.trace({
      name: 'wikipedia',
      input: JSON.stringify(question),
    })

    const generation = trace.generation({
      name: 'generation',
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
  helpCenter,
  askMoby,
  WikipediaQuery,
  //new TavilySearchResults({}),
  new Calculator(),
]

export default tools
