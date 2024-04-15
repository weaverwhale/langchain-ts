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

  type SourceType = 'moby' | 'gpt'
}

export {}
