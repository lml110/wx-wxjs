
module.exports = (options,method = 'POST') => {
    return new Promise((resolve, reject) => {
        options = Object.assign(options, {
            method: method,
            success(result) {
                if (result.statusCode === 200) {
                    resolve(result.data);
                } else {
                    reject(result);
                }
            },

            fail: reject,
        });

        wx.request(options);
    });
};