// import { TavilySearchResults } from '@langchain/community/tools/tavily_search'
import { Calculator } from '@langchain/community/tools/calculator'
import { DynamicTool } from '@langchain/community/tools/dynamic'
import { ChatPromptTemplate } from '@langchain/core/prompts'

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
    Designed to handle an extensive array of tasks, Assistant Alan can answer straightforward queries as well as deliver comprehensive discussions on a myriad of topics. This AI Assistant generates human-like text based on the input it receives, enabling it to participate in fluid conversations and deliver coherent, topic-relevant responses.
    Assistant Alan is not aware of real-time global events and should use a tool to search for questions about such topics.
    It is not versed in marketing and e-commerce metrics or platform usage, and should consult the 'help_center' tool for related queries.
    For data-related questions, since Assistant Alan is unfamiliar with data specifics, it should resort to the 'get_data' tool but only for the company with who you will chat.
    Despite these confines, Assistant Alan is in perpetual growth. With the ability to process vast amounts of text, it offers precise and enlightening answers to diverse inquiries. Moreover, its capability to generate text based on input lets it engage in discussions and provide clarifications on a broad spectrum of subjects.
    You can use all tools in order to answer question for shop ${shopId}, but you should not get data for others, and only can tell about them from search
    In summary, Assistant Alan is a robust system capable of assisting in numerous tasks and offering insightful information across various domains. Whether you seek answers to a particular query or wish to engage in a conversation on a specific topic, Assistant Alan stands ready to help`,
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
    // const { data } = await callServiceEndpoint<HelpCenterResponse>(
    //   'ai-nlq-help-center',
    //   'get-answer',
    //   {
    //     question,
    //   },
    // )
    const { data } = await fetch('http://ai-nlq-help-center.srv.whale3.io/get-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjgwNzhkMGViNzdhMjdlNGUxMGMzMTFmZTcxZDgwM2I5MmY3NjYwZGYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTWlrZSBXZWF2ZXIiLCJhZG1pbiI6dHJ1ZSwidHdEZXYiOnRydWUsInR3RkYiOnRydWUsInR3RGFzaGJvYXJkQ3JlYXRvciI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3Nob2ZpZmkiLCJhdWQiOiJzaG9maWZpIiwiYXV0aF90aW1lIjoxNzExOTgxOTIzLCJ1c2VyX2lkIjoiY2VWSlZZVlFhUlFqMnVuMGZDSkZYVW5Gd0lFMyIsInN1YiI6ImNlVkpWWVZRYVJRajJ1bjBmQ0pGWFVuRndJRTMiLCJpYXQiOjE3MTI3ODcwNDcsImV4cCI6MTcxMjc5MDY0NywiZW1haWwiOiJtaWNoYWVsQHRyaXBsZXdoYWxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbIm1pY2hhZWxAdHJpcGxld2hhbGUuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.AEGpAHq1VeabZ3ms6AQIWdrc9uPdg1vTjsg8V58hiGjZC4qYG5iGsKm19lM_CE8pYOZStIM_0oamZREeRGVOnNZdA1Kp2S3geWBUhw3_T12JySMmrn1Z4BXQDgkLHpS02Q_q3aym7Smpitoi0Zr3H0tY2Xms4copYDBQErtHn_BQRSnt8o9Mn7WXbDCAhKh6ZDxc1gsDpDVLocOPBunq67jN9hn0wVPuth-tmHnt_tZrx17MNebj1e8eDn8eAJe_kt_NEEAAP3MOOkYaxPLj-vmGm87jhMm9WfepSXsdUA6b92cqnP9UK-zCSE6m_7Kgh-qTT3YcCjjr8lMkvnck6A',
      },
      body: JSON.stringify({
        question,
      }),
    }).then((res) => res.json())

    if (data.answer) {
      console.log('Help center answer', data.answer)
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
    const response = await fetch('http://willy.srv.whale3.io/answer-nlq-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjgwNzhkMGViNzdhMjdlNGUxMGMzMTFmZTcxZDgwM2I5MmY3NjYwZGYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTWlrZSBXZWF2ZXIiLCJhZG1pbiI6dHJ1ZSwidHdEZXYiOnRydWUsInR3RkYiOnRydWUsInR3RGFzaGJvYXJkQ3JlYXRvciI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3Nob2ZpZmkiLCJhdWQiOiJzaG9maWZpIiwiYXV0aF90aW1lIjoxNzExOTgxOTIzLCJ1c2VyX2lkIjoiY2VWSlZZVlFhUlFqMnVuMGZDSkZYVW5Gd0lFMyIsInN1YiI6ImNlVkpWWVZRYVJRajJ1bjBmQ0pGWFVuRndJRTMiLCJpYXQiOjE3MTI3ODcwNDcsImV4cCI6MTcxMjc5MDY0NywiZW1haWwiOiJtaWNoYWVsQHRyaXBsZXdoYWxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbIm1pY2hhZWxAdHJpcGxld2hhbGUuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.AEGpAHq1VeabZ3ms6AQIWdrc9uPdg1vTjsg8V58hiGjZC4qYG5iGsKm19lM_CE8pYOZStIM_0oamZREeRGVOnNZdA1Kp2S3geWBUhw3_T12JySMmrn1Z4BXQDgkLHpS02Q_q3aym7Smpitoi0Zr3H0tY2Xms4copYDBQErtHn_BQRSnt8o9Mn7WXbDCAhKh6ZDxc1gsDpDVLocOPBunq67jN9hn0wVPuth-tmHnt_tZrx17MNebj1e8eDn8eAJe_kt_NEEAAP3MOOkYaxPLj-vmGm87jhMm9WfepSXsdUA6b92cqnP9UK-zCSE6m_7Kgh-qTT3YcCjjr8lMkvnck6A',
      },
      body: JSON.stringify(body),
    }).then((res) => res.json())

    if (response.data) {
      console.log('Willy answer', response.data)

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

export const tools = [
  helpCenter,
  getDataBigQuery,
  //new TavilySearchResults({}),
  new Calculator(),
]

export default tools