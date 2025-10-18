/**
 * YUZU.JS FRAMEWORK
 * AI FOR ALL
 * Author: AXIOM NETWORK / COMPOSITE / KIWI AI
 * Repository: https://github.com/infdevv/yuzu
*/

import { generateUserAgent } from './helpers/useragents.js';
import { BareClient } from 'https://esm.sh/@tomphttp/bare-client@latest';

class yuzu {
    constructor(endpoint, reasoning_endpoint, reasoning_on) {
        // <!CAN WE GET MUCH HIGHER!>
        // prefer provided endpoint, fall back to default
        this.endpoint = endpoint || "https://api.deepinfra.com/v1/openai/chat/completions"
        this.reasoning_endpoint = reasoning_endpoint || "https://charbot.ape3d.com/?prompt="
        this.reasoning_on = reasoning_on || true
        this.model = "google/gemma-2-9b-it"
        this.generateUserAgent = generateUserAgent;
        this.bareClient = null;
        this.bareUrl = null;
        this.initBareClient();
    }

    async initBareClient() {
        try {
            const configResponse = await fetch('./yuzu/config.json');
            const config = await configResponse.json();
            this.bareUrl = config.bare;
            this.bareClient = new BareClient(this.bareUrl);
            console.log("Bare client initialized with URL:", this.bareUrl);
        } catch (e) {
            console.error("Failed to initialize bare client:", e);
        }
    }

    async proxy(endpoint, options){
        //options['x-deepinfra-source'] = 'model-embed';
        try {
            console.log("Trying direct connection first for POST request...");
            let res = await fetch(endpoint, options);
            if (res.ok || (res.status !== 429 && res.status !== 401 && res.status !== 403 && res.status !== 500)) {
                console.log("Direct connection successful!");
                return res;
            }
        } catch (e) {
            console.log("Direct connection failed, trying bare server:", e.message);
        }

        // Try bare server as fallback
        if (this.bareClient) {
            try {
                console.log("Using bare server for request...");
                const bareResponse = await this.bareClient.fetch(endpoint, options);
                console.log("Bare server connection successful!");
                return bareResponse;
            } catch (e) {
                console.log("Bare server failed:", e.message);
            }
        } else {
            console.log("Bare client not initialized yet, waiting...");
            // Wait for bare client to initialize
            let retries = 0;
            while (!this.bareClient && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }
            if (this.bareClient) {
                try {
                    console.log("Using bare server for request (after wait)...");
                    const bareResponse = await this.bareClient.fetch(endpoint, options);
                    console.log("Bare server connection successful!");
                    return bareResponse;
                } catch (e) {
                    console.log("Bare server failed:", e.message);
                }
            }
        }

        console.log("Bare server not available, trying native as last resort...")
        return await fetch(endpoint, options) // try on our own
    }

    async generate(messages, model=this.model, ...args) {

        const extra = (args.length === 1 && typeof args[0] === 'object') ? args[0] : {}
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
    }


    async generateStreaming(messages, callback, model=this.model, ...args) {

        const extra = (args.length === 1 && typeof args[0] === 'object') ? args[0] : {}
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

    }

}

export default yuzu;