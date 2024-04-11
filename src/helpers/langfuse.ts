import { Langfuse } from 'langfuse'

// const langfuse = new Langfuse({
//   publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY,
//   secretKey: process.env.LANGFUSE_SECRET_KEY,
//   baseUrl: process.env.NEXT_PUBLIC_LANGFUSE_BASE_URL ?? undefined,
// })
const langfuse = new Langfuse({
  secretKey: 'sk-lf-5a5fe79d-caae-41b8-b513-e39471ae0257',
  publicKey: 'pk-lf-e486df6b-eed9-4680-924e-c92712ace07d',
  baseUrl: 'https://cloud.langfuse.com',
})
langfuse.debug()

export { langfuse }

export default langfuse
