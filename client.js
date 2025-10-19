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
        this.model = "google/gemma-2-9b-it"
        this.generateUserAgent = generateUserAgent;
        this.lastTime = null;

    }

    async proxy(endpoint, options){
        return await fetch(endpoint, options);
    }

    async generate(messages, model=this.model, ...args) {
        const extra = (args.length === 1 && typeof args[0] === 'object') ? args[0] : {}

        // Check if we should use fallback based on lastTime
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        if (this.lastTime && (now - this.lastTime) < fiveMinutes) {
            console.log("Using Pollinations AI fallback (within 5-minute window)");
            const fallbackRes = await fetch("https://text.pollinations.ai/text", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "User-Agent": this.generateUserAgent()
                },
                credentials: 'omit',
                body: JSON.stringify({ messages: messages, model: "mistral", ...extra })
            });
            const fallbackData = await fallbackRes.json();
            return fallbackData;
        }

        try {
            const res = await this.proxy(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "User-Agent": this.generateUserAgent()
                },
                credentials: 'omit',
                body: JSON.stringify({ messages: messages, model: model, ...extra })
            })

            const data = await res.json()
            return data
        } catch (error) {
            console.warn("Primary endpoint failed, falling back to Pollinations AI (mistral):", error.message);
            this.lastTime = Date.now();

            try {
                const fallbackRes = await fetch("https://text.pollinations.ai/text", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "User-Agent": this.generateUserAgent()
                    },
                    credentials: 'omit',
                    body: JSON.stringify({ messages: messages, model: "mistral", ...extra })
                });

                const fallbackData = await fallbackRes.json();
                return fallbackData;
            } catch (fallbackError) {
                console.error("Fallback endpoint also failed:", fallbackError.message);
                throw fallbackError;
            }
        }
    }


    async generateStreaming(messages, callback, model=this.model, ...args) {
        const extra = (args.length === 1 && typeof args[0] === 'object') ? args[0] : {}

        // Check if we should use fallback based on lastTime
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        if (this.lastTime && (now - this.lastTime) < fiveMinutes) {
            console.log("Using Pollinations AI fallback (within 5-minute window)");
            const fallbackRes = await fetch("https://text.pollinations.ai/text", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "User-Agent": this.generateUserAgent()
                },
                credentials: 'omit',
                body: JSON.stringify({ messages: messages, model: "mistral", stream: true, ...extra })
            });

            const reader = fallbackRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

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
            return;
        }

        try {
            const res = await this.proxy(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "User-Agent": this.generateUserAgent()
                },
                credentials: 'omit',
                body: JSON.stringify({ messages: messages, model: model, stream: true, ...extra })
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
        } catch (error) {
            console.warn("Primary endpoint failed, falling back to Pollinations AI (mistral):", error.message);
            this.lastTime = Date.now();

            try {
                const fallbackRes = await fetch("https://text.pollinations.ai/text", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "User-Agent": this.generateUserAgent()
                    },
                    credentials: 'omit',
                    body: JSON.stringify({ messages: messages, model: "mistral", stream: true, ...extra })
                });

                const reader = fallbackRes.body.getReader();
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
            } catch (fallbackError) {
                console.error("Fallback endpoint also failed:", fallbackError.message);
                throw fallbackError;
            }
        }

    }

}

export default yuzu;