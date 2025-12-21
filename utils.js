
module.exports = {
    completeProtocol: function(targetUrl, sourceUrl) {
        // 如果地址不是以 // 开头，或者已经包含了协议，则直接返回原地址
        if (!targetUrl.startsWith('//')) {
            return targetUrl;
        }

        try {
            // 解析参考地址获取协议 (例如 "https:")
            const protocol = new URL(sourceUrl).protocol;
            return `${protocol}${targetUrl}`;
        } catch (e) {
            // 如果 sourceUrl 无效，默认补全 https:
            return `https:${targetUrl}`;
        }
    }
}