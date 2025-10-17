/**
 * YUZU.JS FRAMEWORK
 * AI FOR ALL
 * Author: AXIOM NETWORK / COMPOSITE / KIWI AI
 * Repository: https://github.com/infdevv/yuzu
*/

import { generateUserAgent } from './helpers/useragents.js';
import { reasoningManager } from './helpers/reasoningmanager.js';

class yuzu {
    constructor(endpoint, reasoning_endpoint, reasoning_on) {
        // <!CAN WE GET MUCH HIGHER!>
        // prefer provided endpoint, fall back to default
        this.endpoint = endpoint || "https://api.deepinfra.com/v1/openai"
        this.reasoning_endpoint = reasoning_endpoint || "https://charbot.ape3d.com/?prompt="
        this.reasoning_on = reasoning_on || true
        this.model = "deepseek-v3-0324"
        this.reasoningManager = new reasoningManager(this.reasoning_endpoint, this.reasoning_on);
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
            body: JSON.stringify({ messages: messages, model: this.model, ...extra })
        })

        for (chunk of res.body) {
            //  return chunk
            callback(chunk)
        }

    }

}

export { yuzu };

