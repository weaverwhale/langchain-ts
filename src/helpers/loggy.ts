import chalk from 'chalk'

export const loggy = (text: string, error: boolean = false) => {
  console.log(error ? chalk.red(text) : chalk.green(text))
}

export default loggy
