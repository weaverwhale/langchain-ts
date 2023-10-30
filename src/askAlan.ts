import { DynamicTool } from 'langchain/tools'
import { initializeAgentExecutorWithOptions } from 'langchain/agents'
import { ChatOpenAI } from 'langchain/chat_models/openai'
// import { callServiceEndpoint } from '@tw/utils/module/callServiceEndpoint.js'
import { logger } from '@tw/utils/module/logger.js'
// import { getSecret } from '@tw/utils/module/secrets'

export type HelpCenterLink = {
  title: string
  link: string
}

export type HelpCenterLinks = Record<string, HelpCenterLink>

export type HelpCenterResponse = {
  links: HelpCenterLinks
  answer: string
}

const shopId = 'trueclassictees-com.myshopify.com'
const prompt = `Assistant Alan is an AI assistant developed by Triple Whale, named in honor of Alan Turing. 
Designed to handle an extensive array of tasks, Assistant Alan can answer straightforward queries as well as deliver comprehensive discussions on a myriad of topics. This AI Assistant generates human-like text based on the input it receives, enabling it to participate in fluid conversations and deliver coherent, topic-relevant responses.
Assistant Alan is not aware of real-time global events and should use a tool to search for questions about such topics.
It is not versed in marketing and e-commerce metrics or platform usage, and should consult the 'help_center' tool for related queries.
For data-related questions, since Assistant Alan is unfamiliar with data specifics, it should resort to the 'get_data' tool but only for the company with who you will chat.
Despite these confines, Assistant Alan is in perpetual growth. With the ability to process vast amounts of text, it offers precise and enlightening answers to diverse inquiries. Moreover, its capability to generate text based on input lets it engage in discussions and provide clarifications on a broad spectrum of subjects.
You can use all tools in order to answer question for shop ${shopId}, but you should not get data for others, and only can tell about them from search
In summary, Assistant Alan is a robust system capable of assisting in numerous tasks and offering insightful information across various domains. Whether you seek answers to a particular query or wish to engage in a conversation on a specific topic, Assistant Alan stands ready to help`

const helpCenter = new DynamicTool({
  name: 'help_center',
  description: `Useful for when you need to answer questions about marketing analytics,
    how to use the platform, or about case studies from the knowledge base.
    here you can find answeres about Triple Whale platform"
    You should ask targeted questions.`,
  func: async (question: string) => {
    // const { data } = await callServiceEndpoint<HelpCenterResponse>(
    //   'ai-nlq-help-center',
    //   'get-answer',
    //   {
    //     question,
    //   },
    // )
    const { data } = await fetch('http://localhost/api/v2/ai-nlq-help-center/get-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjBkMGU4NmJkNjQ3NDBjYWQyNDc1NjI4ZGEyZWM0OTZkZjUyYWRiNWQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTWlrZSBXZWF2ZXIiLCJhZG1pbiI6dHJ1ZSwidHdEZXYiOnRydWUsInR3RkYiOnRydWUsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zaG9maWZpIiwiYXVkIjoic2hvZmlmaSIsImF1dGhfdGltZSI6MTY5NTk0MjE2OCwidXNlcl9pZCI6ImNlVkpWWVZRYVJRajJ1bjBmQ0pGWFVuRndJRTMiLCJzdWIiOiJjZVZKVllWUWFSUWoydW4wZkNKRlhVbkZ3SUUzIiwiaWF0IjoxNjk4NjI2NTg2LCJleHAiOjE2OTg2MzAxODYsImVtYWlsIjoibWljaGFlbEB0cmlwbGV3aGFsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJtaWNoYWVsQHRyaXBsZXdoYWxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.NmGoFnv1HSDyOW3dOqtCzquABcMF-Z2AhIjWzgJWzaxFFPiYIIG0ibRoybU2RvGewHZ3vEsII7vk33miCRx094zhUVOPvPxVwZQ6mp1vS3QKTE9qm3ot08Y_vVurtUMIC53biDPWodslf2jDqHzTZcmBYlhOTvqk_6I-EB3SvPJ2zkor7chsErk4y29ca7a3v1vRg2VgKWzs4TxSq0KPTvPMrNB6m3mxmarN9hBmuyP1xuW2ifdtD-CdgbxiKgcUV24XaN1r0tGF9YoIo2C-445KUnIF_cOkpq2vep6NED_maIWe3ioo3bjLOdEImXmhPMZzNLfpbZol1QqsHtONkQ',
      },
      body: JSON.stringify({
        question,
      }),
    }).then((res) => res.json())
    if (data.answer) {
      logger.info('Help center answer', data.answer)
      return data.answer
    } else {
      return "Didn't find requested data"
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
    // const response = await callServiceEndpoint('willy', 'answer-nlq-question', body)
    const response = await fetch('http://localhost/api/v2/willy/answer-nlq-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjBkMGU4NmJkNjQ3NDBjYWQyNDc1NjI4ZGEyZWM0OTZkZjUyYWRiNWQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTWlrZSBXZWF2ZXIiLCJhZG1pbiI6dHJ1ZSwidHdEZXYiOnRydWUsInR3RkYiOnRydWUsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9zaG9maWZpIiwiYXVkIjoic2hvZmlmaSIsImF1dGhfdGltZSI6MTY5NTk0MjE2OCwidXNlcl9pZCI6ImNlVkpWWVZRYVJRajJ1bjBmQ0pGWFVuRndJRTMiLCJzdWIiOiJjZVZKVllWUWFSUWoydW4wZkNKRlhVbkZ3SUUzIiwiaWF0IjoxNjk4NjI2NTg2LCJleHAiOjE2OTg2MzAxODYsImVtYWlsIjoibWljaGFlbEB0cmlwbGV3aGFsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJtaWNoYWVsQHRyaXBsZXdoYWxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.NmGoFnv1HSDyOW3dOqtCzquABcMF-Z2AhIjWzgJWzaxFFPiYIIG0ibRoybU2RvGewHZ3vEsII7vk33miCRx094zhUVOPvPxVwZQ6mp1vS3QKTE9qm3ot08Y_vVurtUMIC53biDPWodslf2jDqHzTZcmBYlhOTvqk_6I-EB3SvPJ2zkor7chsErk4y29ca7a3v1vRg2VgKWzs4TxSq0KPTvPMrNB6m3mxmarN9hBmuyP1xuW2ifdtD-CdgbxiKgcUV24XaN1r0tGF9YoIo2C-445KUnIF_cOkpq2vep6NED_maIWe3ioo3bjLOdEImXmhPMZzNLfpbZol1QqsHtONkQ',
      },
      body: JSON.stringify(body),
    }).then((res) => res.json())

    if (response.data) {
      logger.info('Willy answer', response.data)

      let preparedData = ''
      for (const item of response.data) {
        preparedData += `${item.name} - ${item.value.slice(0, 50)}\n`
      }
      return preparedData
    } else {
      return "Didn't find requested data"
    }
  },
})

// Set up the LLM
const llm = new ChatOpenAI({
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-3.5-turbo-16k-0613',
  // modelName: 'gpt-4-0613',
  maxTokens: 300,
})

// Instantiate tools
const tools = [helpCenter, getDataBigQuery]

export async function question(question: string): Promise<any> {
  // Create conversational agent
  const conversationalAgent = await initializeAgentExecutorWithOptions(tools, llm, {
    agentType: 'chat-conversational-react-description',
    verbose: true,
  })
  const chainValues = await conversationalAgent.call({
    input: question,
    // input: 'What is my Facebook ad spend and clicks last 5 days broken down by day? order by day',
    chat_history: [prompt],
  })
  return chainValues
}

// question('What is my Facebook ad spend and clicks last 5 days broken down by day? order by day')

export default question
