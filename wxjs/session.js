
const session = {
    get(session_key) {
        return wx.getStorageSync(session_key) || null;
    },

    set(session_key,sions) {
        return wx.setStorageSync(session_key, sions);
    },

    clear(session_key) {
        return wx.removeStorageSync(session_key);
    },

    info() {
        //本地数据存储的大小限制为 10MB || limitSize：10240KB || currentSize：KB
        return wx.getStorageInfoSync();
    },

    allclear() {
    	return wx.clearStorageSync();
    }
};

module.exports = session;