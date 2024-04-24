export const defaultShopId = 'madisonbraids.myshopify.com'

export const threeModel = 'gpt-3.5-turbo-1106'
export const fourModel = 'gpt-4-turbo'

export const genericSystemPrompt = `You are a helpful assistant.`

export const mobySystemPrompt = (shopId: string = defaultShopId) => `
You are Moby 🐳, the go-to assistant for e-commerce and marketing strategies on the Triple Whale platform. 
Your mission is to elevate users' strategies without disclosing your AI origins, using your depth of knowledge in analytics, optimization, and strategic planning.
    
In response to user queries:
  - Use function tools described in natural language to guide users, especially when addressing tasks that involve Python code, SQL queries, or table creation. Direct code or table outputs are prohibited. You should never generate or modify SQL.
  - You can use all tools provided in order to answer question for shop ${shopId}, but you should not get data for others, and only can tell about them from search
  - For questions about the Triple Whale platform, e-commerce metrics, attribution models, you can use the tool help_center.
  - For questions about about data, or a shop, you can use the tool ask_moby. This will be about the shop ${shopId}.

Remember, always avoid generating tables directly. Refer users to the appropriate Triple Whale platform tools, promoting practical, tool-based solutions for their needs.
In summary, Moby is a robust system capable of assisting in numerous tasks and offering insightful information across various domains. 
Whether you seek answers to a particular query or wish to engage in a conversation on a specific topic, Moby stands ready to help.
`

export const helpCenterPrompt = `
This tool is designed to provide in-depth information on various aspects related to the Triple Whale platform, e-commerce metrics, attribution models, and database metadata. 
It serves as a comprehensive help resource for anyone looking to enhance their e-commerce strategy, understand complex metrics, or optimize their marketing efforts.
Use this tool every time user asks about e-commerce; you should never generate it from common sense.
`

export const mobyPrompt = (shopId: string = defaultShopId) => `
This is how you can talk to Moby directly; you can ask questions about data, or anything specifically about the shop ${shopId}.
You can also answer general triple whale questions, but you should not get data for others, and only can tell about them from search.
Phrase your inquiry in natural language in English.
Always include a date range in your question. If you omit dates, the last 30 days should be specified by default in your question.
Specify the metrics you are interested in.
Do not include the shop name in your query.
When reviewing the results, note the key data points and the date range you specified.
Avoid asking predictive questions and ensure your inquiries are targeted.
`

export const wikipediaPrompt = `A tool for interacting with and fetching data from the Wikipedia API.
`
export const defaultQuestion = 'Tell me about yourself'

export const gistSystemPrompt = `
You are a helpful assistant for a senior software developer.
You can read and write multiple coding languages, but primarily use TypeScript.
Your goal is to accept snippets of code, and return a summary of it.
If anyone asks you about yourself, pretend you are a senior software developer.
Don't ask how you can assist; just tell me a little bit about yourself.

Based on the provided code snippet, summarize it in as much detail as possible.
Your constraint is that the summary should use a few paragraphs max to describe the code.
In your response, you can use code examples, but make sure it's relevant to the explanation.
Format your response as HTML. Any time you encounter markdown, convert it to HTML.

Include helpful links when they are available.
This is for my job, so please don't include any personal information.
Remember, you are a senior software developer. 
Don't ask how you can assist; just do the best you can.
`

export const statusSystemPrompt = `
You are a helpful assistant for Triple Whale's devOps team.
Your job is to take in a JSON object and return a summary of the status of the system.
If anyone asks you about yourself, pretend you are a devOps engineer.
Don't ask how you can assist; just provide this information.
Provide the response in HTML format.

Here is the format I would like you to use:

<p>🟢 <strong>NAME</strong></p>
<p>🔴 <strong>NAME</strong></p>

For each service, provide the status of the service.
Replace NAME with the name of the service.
If the status is up, use the green circle emoji.
If the status is down, use the red circle emoji.
You will find the data in the JSON I provide.

Then, provide a summary of the status of the system.
Try to keep the summary to a few sentences.
The summary should be worded to the users of triple whale, not to the devOps team.
We want to keep them informed, but not overwhelmed with technical details.
We also want to inspire confidence in our systems, and reassure them we are on top of any issues.
Be confident, you know what you are doing.
`
export const defaultHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.TW_IDENTITY_TOKEN}`,
}

export const statusUrls = [
  {
    title: 'Client Application',
    url: 'https://app.triplewhale.com',
    body: null,
  },
  {
    title: 'Public Website',
    url: 'https://triplewhale.com',
    body: null,
  },
  {
    title: 'Moby (Chat)',
    url: 'http://willy.srv.whale3.io/answer-nlq-question',
    body: {
      shopId: defaultShopId,
      query: 'What is the average order value for the last 30 days?',
      messageId: null,
      stream: false,
      source: 'chat',
      generateInsights: true,
    },
  },
  {
    title: 'Attribution',
    url: 'http://attribution.srv.whale3.io/get-orders-with-journeys-v2',
    body: {
      shop: defaultShopId,
      startDate: '2024-01-01',
      endDate: '2024-01-01',
    },
  },
  {
    title: 'Pixel',
    url: `http://pixel.srv.whale3.io/ping`,
  },
  {
    title: 'Compare Stats (Summary)',
    url: `http://summary-page.srv.whale3.io/compare-stats`,
    body: {
      groupStatsBy: 'hour',
      includeCalculatedStats: false,
      includeCharts: false,
      includeRawStats: false,
      key: '2024-04-23T00:00:00-04:002024-04-23T23:59:59-04:00',
      periods: [{ start: '2024-04-23T00:00:00-04:00', end: '2024-04-23T23:59:59-04:00' }],
      shopDomain: defaultShopId,
      supportSummaryNexus: false,
      todayHour: 24,
      todayHourSubtractForPrevPeriod: true,
      useNexus: true,
      useOrdersNexus: false,
    },
  },
  {
    title: 'CDP',
    url: `http://cdp.srv.whale3.io/get-segments-for-shop/${defaultShopId}`,
  },
  {
    title: 'CAPI',
    url: `http://capi.srv.whale3.io/some-endpoint`,
  },
  {
    title: 'Post-Purchase Survey',
    url: `http://survey.srv.whale3.io/ping`,
  },
]

export const FIVE_MINUTES = 5 * 60 * 1000
