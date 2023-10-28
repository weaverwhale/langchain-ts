import { OpenAI } from 'langchain/llms'
import { DynamicTool } from 'langchain/tools'
import { initializeAgentExecutor } from 'langchain/agents'
import { callServiceEndpoint } from '@tw/utils/module/callServiceEndpoint.js'

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
    const { data } = await callServiceEndpoint<HelpCenterResponse>(
      'ai-nlq-help-center',
      'get-answer',
      {
        question,
      },
    )

    if (data.answer) {
      return data.answer
    } else {
      return "Didn't find requested data"
    }
  },
})

const getDataBigQuery = new DynamicTool({
  name: 'get_data',
  description: `Useful for when you need to retrieve data from BigQuery to answer questions."
  It takes natural language as input, automatically translates it into SQL, and returns the requested data.
  Always specify a date range. If a user asks without specifying dates, use the last 30 days as the default.
  Tool waiting that you also specifing metrics
  You should not write shop name in your question to this tool
  When describing results you should specify keys point about data and what was date range which you used
  It can only return data and cannot make predictions. You should ask only targeted questions.`,
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

    const response = await callServiceEndpoint('willy', 'answer-nlq-question', body)

    if (response.data) {
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
const llm = new OpenAI({
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4-0613',
  maxTokens: 300,
})

console.log('llm', llm)

// Instantiate tools
const tools = [helpCenter, getDataBigQuery]

// Create conversational agent
const conversationalAgent = await initializeAgentExecutor(
  tools,
  llm,
  'chat-conversational-react-description',
  true,
)

console.log('Agent initialized', conversationalAgent)

const question = await conversationalAgent.call({
  input: 'What is my Facebook ad spend and clicks last 5 days broken down by day? order by day',
  chat_history: [prompt],
})

console.log('question', question)
