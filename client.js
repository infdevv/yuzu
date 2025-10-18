/**
 * YUZU.JS FRAMEWORK
 * AI FOR ALL
 * Author: AXIOM NETWORK / COMPOSITE / KIWI AI
 * Repository: https://github.com/infdevv/yuzu
*/

import { generateUserAgent } from './helpers/useragents.js';

class yuzu {
    constructor(endpoint, reasoning_endpoint, reasoning_on) {
        // <!CAN WE GET MUCH HIGHER!>
        // prefer provided endpoint, fall back to default
        this.endpoint = endpoint || "https://api.deepinfra.com/v1/openai/chat/completions"
        this.reasoning_endpoint = reasoning_endpoint || "https://charbot.ape3d.com/?prompt="
        this.reasoning_on = reasoning_on || true
        this.model = "deepseek-ai/DeepSeek-V3.2-Exp"
        this.generateUserAgent = generateUserAgent;
    }

    async generate(messages, ...args) {

        const extra = (args.length === 1 && typeof args[0] === 'object') ? args[0] : {}

        const res = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "User-Agent": this.generateUserAgent()
            },
            credentials: 'omit',
            body: JSON.stringify({ messages: messages, model: this.model, ...extra })
        })

        const data = await res.json()
        return data
    }


    async generateStreaming(messages, callback, ...args) {

        const extra = (args.length === 1 && typeof args[0] === 'object') ? args[0] : {}

        const res = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "User-Agent": this.generateUserAgent()
            },
            credentials: 'omit',
            body: JSON.stringify({ messages: messages, model: this.model, stream: true, ...extra })
        })

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Split by newlines to process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        callback(parsed);
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

    }

}

export default yuzu;