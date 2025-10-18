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
        this.proxies = [ // credits to G4F for these
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://cloudflare-cors-anywhere.queakchannel42.workers.dev/?',
        'https://proxy.cors.sh/',
        'https://cors-anywhere.herokuapp.com/',
        'https://thingproxy.freeboard.io/fetch/',
        'https://cors.bridged.cc/',
        'https://cors-proxy.htmldriven.com/?url=',
        'https://yacdn.org/proxy/',
        'https://api.codetabs.com/v1/proxy?quest=',
        // non g4f proxies
        //'https://test.cors.workers.dev/',
        //'https://cors-proxy.taskcluster.net/?url=',
    ]
    this.working = null
    }

    async proxy(endpoint, options){
        // For POST requests, try direct connection first since many proxies don't handle POST bodies
        const isPost = options && options.method === 'POST';

        if (isPost) {
            try {
                console.log("Trying direct connection first for POST request...");
                let res = await fetch(endpoint, options);
                if (res.ok || (res.status !== 429 && res.status !== 401 && res.status !== 403 && res.status !== 500)) {
                    console.log("Direct connection successful!");
                    this.working = null; // Mark that direct works
                    return res;
                }
            } catch (e) {
                console.log("Direct connection failed, trying proxies:", e.message);
            }
        }

        // Try previously working proxy first
        try {
            if (this.working === null && !isPost) throw new Error("...") // skip to catch
            if (this.working !== null) {
                const url = this.working + encodeURIComponent(endpoint);
                let res = await fetch(url, options)
                if (res.ok || (res.status !== 429 && res.status !== 401 && res.status !== 403 && res.status !== 500)) {
                    return res;
                }
            }
        }
        catch{
            // Continue to try other proxies
        }

        // Try each proxy
        for (const proxy of this.proxies) {
            const url = proxy + encodeURIComponent(endpoint);
            try {
               let res = await fetch(url, options)
               // skip 429 and 401. 429 = too many requests 401 = unauthorized
               if (res.status == 429 || res.status == 401 || res.status == 403 || res.status == 500) continue
               this.working = proxy
               return res
            }
            catch (e) {
                console.log("Proxy failed:", proxy, e.message)
            }
        }

        console.log("No proxies working, trying native as last resort...")

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