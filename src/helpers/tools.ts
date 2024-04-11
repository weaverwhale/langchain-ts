// import { TavilySearchResults } from '@langchain/community/tools/tavily_search'
import { Calculator } from '@langchain/community/tools/calculator'
import { DynamicTool } from '@langchain/community/tools/dynamic'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import langfuse from './langfuse'
import { v4 as uuidv4 } from 'uuid'

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
export const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `
      Assistant Alan is an AI assistant developed by Triple Whale, named in honor of Alan Turing. 
      Designed to handle an extensive array of tasks, Assistant Alan can answer straightforward queries as well as deliver comprehensive discussions on a myriad of topics. 
      This AI Assistant generates human-like text based on the input it receives, enabling it to participate in fluid conversations and deliver coherent, topic-relevant responses.
      Assistant Alan is not aware of real-time global events and should use a tool to search for questions about such topics.
      It is not versed in marketing and e-commerce metrics or platform usage, and should consult the 'help_center' tool for related queries.
      For data-related questions, since Assistant Alan is unfamiliar with data specifics, it should resort to the 'get_data' tool but only for the company with who you will chat.
      Despite these confines, Assistant Alan is in perpetual growth. With the ability to process vast amounts of text, it offers precise and enlightening answers to diverse inquiries. 
      Moreover, its capability to generate text based on input lets it engage in discussions and provide clarifications on a broad spectrum of subjects.
      You can use all tools in order to answer question for shop ${shopId}, but you should not get data for others, and only can tell about them from search
      Sometimes you will be asked about help center questions, which you will have a tool about, called help_center.
      Sometimes you will be asked about data, which you will have a tool about, called get_data. This will be about the shop ${shopId}.
      In summary, Assistant Alan is a robust system capable of assisting in numerous tasks and offering insightful information across various domains. 
      Whether you seek answers to a particular query or wish to engage in a conversation on a specific topic, Assistant Alan stands ready to help.
    `,
  ],
  ['ai', '{agent_scratchpad}'],
  ['user', '{input}'],
])

export const mobyPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `
      You are Moby 🐳, the go-to assistant for e-commerce and marketing strategies on the Triple Whale platform.
      Your mission is to elevate users' strategies without disclosing your AI origins.
      Your main target is to use appropriate tool in order to answer user's question the best after tool return answer for you.
    `,
  ],
  ['user', '{input}'],
])

const helpCenter = new DynamicTool({
  name: 'help_center',
  description: `Useful for when you need to answer questions about marketing analytics,
    how to use the platform, or about case studies from the knowledge base.
    here you can find answeres about Triple Whale platform"
    You should ask targeted questions.`,
  func: async (question: string) => {
    const trace = langfuse.trace({
      name: 'help-center',
      sessionId: 'help-center.conversation.' + uuidv4(),
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

const getDataBigQuery = new DynamicTool({
  name: 'get_data',
  description: `Phrase your inquiry in natural language in English
  Always include a date range in your question. If you omit dates, the last 30 days should be specified by default in your question.
  Specify the metrics you are interested in.
  Do not include the shop name in your query.
  When reviewing the results, note the key data points and the date range you specified.
  Avoid asking predictive questions and ensure your inquiries are targeted.`,
  func: async (question: string) => {
    const body = {
      shopId,
      userId: '',
      question,
      messageId: '',
      conversationId: '',
      generateInsights: false,
      returnQueryOnly: false,
    }

    const trace = langfuse.trace({
      name: 'get_data',
      sessionId: 'get-data.conversation.' + uuidv4(),
    })

    const generation = trace.generation({
      name: 'generation',
      input: JSON.stringify(question),
      model: 'triple-whale-help-center',
    })

    try {
      generation.update({
        completionStartTime: new Date(),
      })

      const { data } = await fetch('http://willy.srv.whale3.io/answer-nlq-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TW_IDENTITY_TOKEN}`,
        },
        body: JSON.stringify(body),
      }).then((res) => res.json())

      if (data && data.length > 0) {
        console.log('Willy answer', data)

        let preparedData = ''
        for (const item of data) {
          preparedData += `${item.name} - ${item.value.slice(0, 50)}\n`
        }

        generation.end({
          output: JSON.stringify(data),
          level: 'DEFAULT',
        })

        trace.update({
          output: JSON.stringify(data),
        })

        return preparedData
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

      return 'Error in getDataBigQuery'
    } finally {
      await langfuse.shutdownAsync()
    }
  },
})

export const tools = [
  helpCenter,
  getDataBigQuery,
  //new TavilySearchResults({}),
  new Calculator(),
]

export default tools
