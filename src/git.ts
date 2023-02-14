import { execSync } from 'node:child_process'
import consola from 'consola'
import { getOptions } from './options'

export const checkIsGitRepo = () => {
	try {
		execSync('git rev-parse --is-inside-work-tree', {
			encoding: 'utf8',
			stdio: 'ignore',
		})
	} catch (e) {
		consola.error('This is not a git repository')
		process.exit(1)
	}
}

export const getDiff = () => {
	const { autoAddAll } = getOptions()
	if (autoAddAll) {
		execSync('git add .', { encoding: 'utf8' })
	}

	const diff = execSync(
		"git diff --cached . ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)pnpm-lock.yaml'",
		{ encoding: 'utf8' },
	)

	if (!diff) {
		consola.error(
			'No staged changes found. Make sure there are changes and run `git add .` or use the `--auto-add-all`, `-a` option.',
		)
		process.exit(1)
	}

	if (diff.length > 8000) {
		consola.error(
			`The diff is too large (${diff.length} > 8000 chars) to write a commit message. Please consider splitting your changes into multiple commits.`,
		)
		process.exit(1)
	}

	return diff
}

export const commit = (message: string) => {
	const { lite } = getOptions()
	execSync(`git commit -m "${message}"`, {
		stdio: lite ? 'ignore' : 'inherit',
		encoding: 'utf8',
	})
}

export const push = () => {
	const { autoPush, lite } = getOptions()
	if (!autoPush) return
	execSync('git push', { stdio: lite ? 'ignore' : 'inherit', encoding: 'utf8' })
}
