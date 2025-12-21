
class FetchResponse {
    constructor(data) {
        data = data.toJSON()
        this.data = data
        this.status = data.status
    }
    
    text() {
        return this.data.text
    }
}

class FetchClient {
    constructor() {
        this.webview = new HeadlessWebView();
    }

    async _fetch(url) {
        return new Promise(async (resolve, reject) => {
            let tiemr = setTimeout(() => {
                reject(new Error('Timeout'));
            }, 10000)
            let res = new FetchResponse(await this.webview.request(url));
            clearTimeout(tiemr)
            resolve(res)
        })
    }

    async fetch(url) {
        var response = await this._fetch(url);
        
        if (response.status >= 300) {
            await this._processCloudflare(url);
            return this._fetch(url)
        }
        return response;
    }

    _processCloudflare(url) {
        return new Promise((resolve, reject) => {
            let completed = false;
            this.webview.load(url);
            let timer = setTimeout(() => {
                this.webview.onloadend = null
                completed = true;
                reject(new Error('Timeout'));
            }, 30000);
            this.webview.onloadend = async () => {
                if (completed) return;
                let title = await this.webview.eval('document.title');
                if (title.startsWith("nhentai:")) {
                    this.webview.onloadend = null
                    this.webview.display(false);
                    resolve({
                        'user-agent': userAgent,
                    });
                    clearTimeout(timer)
                }
            };
            if (this.webview.display) {
                this.webview.display(true);
            }
        });
    }

    
}

module.exports = FetchClient;