import {AIMessage, HumanMessage, SystemMessage} from 'langchain/schema';
// import { StreamingStdOutCallbackHandler } from 'langchain.callbacks.streaming_stdout';
import {ChatOpenAI} from 'langchain/chat_models/openai';
import {BaseChatModel} from 'langchain/chat_models';
import {encoding_for_model} from '@dqbd/tiktoken';
import {Configuration, OpenAIApi} from 'openai';
// import { State } from '../app.js';

export type Message = AIMessage | HumanMessage | SystemMessage;

class TokenUsage {
	step_name: string;
	in_step_prompt_tokens: number;
	in_step_completion_tokens: number;
	in_step_total_tokens: number;
	total_prompt_tokens: number;
	total_completion_tokens: number;
	total_tokens: number;

	constructor(
		step_name: string,
		in_step_prompt_tokens: number,
		in_step_completion_tokens: number,
		in_step_total_tokens: number,
		total_prompt_tokens: number,
		total_completion_tokens: number,
		total_tokens: number,
	) {
		this.step_name = step_name;
		this.in_step_prompt_tokens = in_step_prompt_tokens;
		this.in_step_completion_tokens = in_step_completion_tokens;
		this.in_step_total_tokens = in_step_total_tokens;
		this.total_prompt_tokens = total_prompt_tokens;
		this.total_completion_tokens = total_completion_tokens;
		this.total_tokens = total_tokens;
	}
}

export class AI {
	temperature: number;
	model_name: string;
	llm?: BaseChatModel;
	tokenizer: any; // Replace with correct type
	cumulative_prompt_tokens: number;
	cumulative_completion_tokens: number;
	cumulative_total_tokens: number;
	token_usage_log: TokenUsage[];

	async initAI() {
		this.model_name = await fallbackModel(this.model_name);
		this.llm = createChatModel(this.model_name, this.temperature);
		this.tokenizer = get_tokenizer(this.model_name);
	}

	constructor(model_name = 'gpt-4', temperature = 0.1) {
		if (!process.env['OPENAI_API_KEY']) {
			throw Error('Constructor assumes API access');
		}
		this.temperature = temperature;
		this.model_name = model_name;
		this.cumulative_prompt_tokens = 0;
		this.cumulative_completion_tokens = 0;
		this.cumulative_total_tokens = 0;
		this.token_usage_log = [];
	}

	async start(
		system: string,
		user: string,
		step_name: string,
	): Promise<Message[]> {
		let messages: Message[] = [
			new SystemMessage(system),
			new HumanMessage(user),
		];
		return await this.next(messages, step_name);
	}

	fsystem(msg: string): SystemMessage {
		return new SystemMessage(msg);
	}

	fuser(msg: string): HumanMessage {
		return new HumanMessage(msg);
	}

	fassistant(msg: string): AIMessage {
		return new AIMessage(msg);
	}

	async next(
		messages: Message[],
		step_name: string,
		prompt?: string,
	): Promise<Message[]> {
		if (prompt) {
			messages.push(this.fuser(prompt));
		}
		if (!this.llm) {
			console.log('LLM not initialised');
			return [];
		}
		try {
			let response = await this.llm.call(messages); // type: ignore
			messages.push(response);

			this.update_token_usage_log(messages, response.content, step_name);

			return messages;
		} catch (error) {
			console.log(error);
			return [];
		}
	}

	static serializeMessages(messages: Message[] | void): string {
		if (!messages) {
			return '[]';
		}
		return JSON.stringify(messages);
	}

	static deserializeMessages(jsondictstr: string): Message[] {
		const msgs = JSON.parse(jsondictstr).map((m: any) => {
			if (m.id.includes('SystemMessage')) {
				return new SystemMessage(m.kwargs.content);
			} else if (m.id.includes('AIMessage')) {
				return new AIMessage(m.kwargs.content);
			} else {
				return new SystemMessage(m.kwargs.content);
			}
		});
		return msgs; // type: ignore
	}

	update_token_usage_log(
		messages: Message[],
		answer: string,
		step_name: string,
	): void {
		let prompt_tokens = this.num_tokens_from_messages(messages);
		let completion_tokens = this.num_tokens(answer);
		let total_tokens = prompt_tokens + completion_tokens;

		this.cumulative_prompt_tokens += prompt_tokens;
		this.cumulative_completion_tokens += completion_tokens;
		this.cumulative_total_tokens += total_tokens;

		this.token_usage_log.push(
			new TokenUsage(
				step_name,
				prompt_tokens,
				completion_tokens,
				total_tokens,
				this.cumulative_prompt_tokens,
				this.cumulative_completion_tokens,
				this.cumulative_total_tokens,
			),
		);
	}

	formatTokenUsageLog(): string {
		let result = 'step_name,';
		result +=
			'prompt_tokens_in_step,completion_tokens_in_step,total_tokens_in_step';
		result += ',total_prompt_tokens,total_completion_tokens,total_tokens\n';
		for (let log of this.token_usage_log) {
			result += log.step_name + ',';
			result += log.in_step_prompt_tokens.toString() + ',';
			result += log.in_step_completion_tokens.toString() + ',';
			result += log.in_step_total_tokens.toString() + ',';
			result += log.total_prompt_tokens.toString() + ',';
			result += log.total_completion_tokens.toString() + ',';
			result += log.total_tokens.toString() + '\n';
		}
		return result;
	}

	num_tokens(txt: string): number {
		return this.tokenizer.encode(txt).length;
	}

	num_tokens_from_messages(messages: Message[]): number {
		let n_tokens = 0;
		for (let message of messages) {
			n_tokens += 4; // every message follows <im_start>{role/name}\n{content}<im_end>\n
			n_tokens += this.num_tokens(message.content);
		}
		n_tokens += 2; // every reply is primed with <im_start>assistant
		return n_tokens;
	}
}

export async function fallbackModel(model: string): Promise<string> {
	try {
		const configuration = new Configuration({
			apiKey: process.env['OPENAI_API_KEY'],
		});
		const openai = new OpenAIApi(configuration);
		const response = await openai.retrieveModel(model);
		if (response.status === 200) {
			return model;
		}
	} catch (error) {
		console.log('error with model ', model);
	}
	return 'gpt-3.5-turbo-16k';
}

function createChatModel(model: string, temperature: number): BaseChatModel {
	switch (model) {
		case 'gpt-4':
			return new ChatOpenAI({modelName: 'gpt-4', temperature});
		case 'gpt-3.5-turbo-16k':
			return new ChatOpenAI({modelName: 'gpt-3.5-turbo-16k', temperature});
		case 'gpt-3.5-turbo':
			return new ChatOpenAI({modelName: 'gpt-3.5-turbo', temperature});
		default:
			throw new Error(`Model ${model} is not supported.`);
	}
}

function get_tokenizer(model: string) {
	// Implementation here
	if (model === 'gpt-3.5-turbo-16k') {
		return encoding_for_model('gpt-3.5-turbo');
	}
	return encoding_for_model(model as any);
}

// function serialize_messages(messages: Message[]): string {
//     return AI.serializeMessages(messages);
// }
