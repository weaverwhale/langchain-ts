import { supabase } from './supabase'
import { FIVE_MINUTES } from './constants'

export const getCache = async (context: string, time: number, question?: any) => {
  if (context === 'status') {
    const { data } = await supabase
      .from('caches')
      .select('*')
      .eq('context', context)
      .gte('time', time - FIVE_MINUTES)
      .order('time', { ascending: false })
    return data
  } else {
    const { data } = await supabase
      .from('caches')
      .select('*')
      .eq('context', context)
      .eq('question', question)
      .order('time', { ascending: false })
    return data
  }
}

export const saveToCache = async (
  context: SourceType,
  time: number,
  question: string,
  answer: any,
) => {
  if (answer) {
    try {
      const { data, error } = await supabase.from('caches').upsert({
        context,
        time,
        question,
        answer,
      })

      if (error) {
        console.error(error)
      } else {
        console.log('Cached question/answer')
      }
    } catch {}
  }
}
