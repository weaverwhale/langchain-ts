import { askQuestion } from './ask'
import { saveToCache } from './cache'
import { FIVE_MINUTES, defaultQuestion } from './constants'
import { getStatus } from './status'

export const crons = () => {
  // status
  setInterval(async () => {
    const question = await getStatus().then((res) => JSON.stringify(res))
    const answer = await askQuestion(question, 'status')
    await saveToCache('status', Date.now(), question, answer)
  }, FIVE_MINUTES)
  // moby
  setInterval(async () => {
    const answer = await askQuestion(defaultQuestion, 'moby')
    await saveToCache('moby', Date.now(), defaultQuestion, answer)
  }, FIVE_MINUTES)
}

export default crons
