/**
 * YUZU.JS FRAMEWORK
 * A lightweight JavaScript framework for web applications
 * Author: INFDEVV
 * Repository: https://github.com/infdevv/yuzu
 */

// Array to hold request loader elements
let loaders = [];

class UnloadScript extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // Execute innerHTML on page unload
        window.addEventListener('beforeunload', () => {
            try {
                eval(this.innerHTML);
            } catch (error) {
                console.error('Error in unload script:', error);
            }
        });
    }
}

class Config extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // set global config from innerHTML
        window.config = JSON.parse(this.innerHTML);
    }
}

class WorkerScript extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // register service worker if supported
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register(this.src)
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }
}

class RequestLoader extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.style.display = "none";
        // add to loaders array for request tracking
        loaders.push(this);
    }
}

class FunctionLoader extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.style.display = "none";

        // get function name and implementation
        const functionName = this.getAttribute('function');
        if (functionName) {
            this.functionImpl = this[functionName] || eval(this.innerHTML);

            // create global function that shows/hides loader
            window[functionName] = async () => {
                this.style.display = "";
                try {
                    await this.functionImpl();
                } catch (error) {
                    console.error(`Error in ${functionName}:`, error);
                } finally {
                    this.style.display = "none";
                }
            };
        }
    }
}

// handle messages from service worker
window.addEventListener("message", (event) => {
    // check for yuzu origin messages
    if (event.data && event.data.origin === "yuzu") {
        const url = event.data.url;

        // toggle display for loaders matching the URL
        loaders.forEach(loader => {
            if (loader.url === url) {
                loader.style.display = loader.style.display === "" ? "none" : "";
            }
        });
    }
});

// define custom elements
window.customElements.define('unload-script', UnloadScript);
window.customElements.define('sw', WorkerScript);
window.customElements.define('config', Config);
window.customElements.define('request-loader', RequestLoader);
window.customElements.define('function-loader', FunctionLoader);

// initialize service worker
const swElement = document.createElement("sw");
swElement.src = "sw.js";
document.body.appendChild(swElement);

// general changes

String.prototype.replace = String.prototype.replaceAll; 
