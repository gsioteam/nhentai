
class FetchClient {
    async fetch(url) {
        let headers = localStorage.getItem('headers');
        if (typeof headers === 'string') {
            headers = JSON.parse(headers);
        }
        if (!headers) {
            headers = await this._getHeaders(url);
            localStorage.setItem('headers', JSON.stringify(headers));
        }
        let res;
        try {
            res = await fetch(url, {
                headers: headers,
            });
        } catch (e) {
            if (e.message.match(/http status/i) && e.message.indexOf('503') > 0) {
                headers = await this._getHeaders(url);
                localStorage.setItem('headers', JSON.stringify(headers));
                res = await fetch(url, {
                    headers: headers,
                });
            } else {
                throw e;
            }
        }
        return res;
    }

    _getHeaders(url) {
        return new Promise((resolve, reject) => {
            let webview = new HeadlessWebView();
            this.webview = webview;
            let completed = false;
            webview.load(url);
            webview.onloadend = async () => {
                if (completed) return;
                let title = await webview.eval('document.title');
                if (title.startsWith("nhentai:")) {
                    completed = true;
                    let userAgent = await webview.eval('navigator.userAgent');
                    try {
                        let cookies = (await HeadlessWebView.getCookies(url)).toJSON();
                        let obj = {};
                        for (let key in cookies) {
                            obj[key.trim()] = cookies[key];
                        }
                        cookies = obj;
                        if (cookies.cf_clearance[0] && cookies.csrftoken[0]) {
                            resolve({
                                cookie: `cf_clearance=${cookies['cf_clearance'][0]}; csrftoken=${cookies['csrftoken'][0]}`,
                                'user-agent': userAgent,
                            });
                            if (webview.display) {
                                webview.display(false);
                            }
                            return
                        }
                    } catch (e) {
                        console.log(e.message);
                    }
                    resolve({
                        'user-agent': userAgent,
                    });
                }
            };
            if (webview.display) {
                webview.display(true);
            } else {
                setTimeout(function() {
                    if (!completed) {
                        completed = true;
                        reject(new Error('Timeout'));
                    }
                }, 10000);
            }
        });
    }
}

module.exports = async function (url) {
    let client = new FetchClient();
    return await client.fetch(url);
};