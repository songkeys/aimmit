// @ts-ignore
import { ChatGPTClient } from '@waylaidwanderer/chatgpt-api'
import consola from 'consola'
// @ts-ignore
import inquirer from 'inquirer'
import { getOptions } from './options'

export const getChatGptResponse = async (diff: string) => {
	const { conventionalCommits, lite } = getOptions()

	const prompt = `I want you to act like a git commit message writer.
I will input a git diff and your job is to convert it into a useful commit message.
Return nothing else but only the commit message without quotes.
Return a short, concise, present-tense, lowercased complete sentence, with fewer than 50 characters the better.
${
	conventionalCommits
		? 'The commit message should follow the conventional commits. E.g. feat: allow provided config object to extend other configs; fix: prevent racing of requests'
		: ''
}
The diffs are below:

\`\`\`diff
${diff}
\`\`\
`

	if (!lite) {
		consola.info('Generating commit message with AI...')
	}

	let breakLoop = false

	let message: string = ''
	while (!breakLoop) {
		message = await generateMessage(prompt)

		if (lite) {
			break
		}

		console.log('\n')
		consola.success(`AI commit message: \n\n${message}\n`)

		const confirmationMessage = await inquirer.prompt([
			{
				name: 'useCommitMessage',
				message: 'Use this commit message? ([Y]es / [n]o / [r]egenerate)',
				choices: ['Y', 'y', 'R', 'r', 'N', 'n'],
				default: 'y',
			},
		])

		switch (confirmationMessage.useCommitMessage) {
			case 'Y':
			case 'y':
				breakLoop = true
				break
			case 'R':
			case 'r':
				consola.info('Generating commit message with AI...')
				break
			case 'N':
			case 'n':
				process.exit(0)
			default:
				break
		}
	}

	if (lite) {
		console.log(message)
	}

	return message
}

const generateMessage = async (diff: string): Promise<string> => {
	const payload = {
		model: 'text-davinci-003',
		prompt: diff,
		temperature: 0.7,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0,
		max_tokens: 200,
		stream: false,
		n: 1,
	}

	const key = process.env.OPENAI_API_KEY

	const { reverseProxyUrl } = getOptions()
	const url = reverseProxyUrl ?? 'https://api.openai.com/v1/completions'
	if (!reverseProxyUrl && !key) {
		consola.error(
			'No OpenAI API key found. Please set the OPENAI_API_KEY environment variable.',
		)
		process.exit(1)
	}

	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${key ?? ''}`,
		},
		method: 'POST',
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		consola.error(
			'Error while communicating with the AI. Please report this issue on https://github.com/Songkeys/aimmit/issues',
		)
		process.exit(1)
	}

	const json: any = await response.json()
	const aiCommit = json.choices[0].text

	return aiCommit.replace(/(\r\n|\n|\r)/gm, '')
}
