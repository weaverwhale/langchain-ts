declare global {
  type HelpCenterLink = {
    title: string
    link: string
  }

  type HelpCenterLinks = Record<string, HelpCenterLink>

  type HelpCenterResponse = {
    links: HelpCenterLinks
    answer: string
  }

  type SourceType = 'moby' | 'gpt' | 'gist' | 'status'

  type Answer = {
    input: string
    chat_history: any[]
    output: string
    conversationId: string
    source: SourceType
  }
}

export {}
