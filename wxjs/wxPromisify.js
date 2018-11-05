/**
 * @class  微信Promise使用
 * @author liumouliang 2017-11-23
 * https://www.cnblogs.com/till-the-end/p/8465970.html
 * https://www.cnblogs.com/wuhuacong/p/7442711.html
 *
 * 使用：
 * then、catch、finally(都执行)
 * all方法提供了并行执行异步操作的能力 「谁跑的慢，以谁为准执行回调」
 * race方法 「谁跑的快，以谁为准执行回调」
 * 
 * var getUserInfo = wxPromisify(wx.getUserInfo);//获取用户信息
 * getUserInfo().then(user => this.setData({userInfo:user})).catch(console.log);
 * 
 * @param  {Function}  callback 传入的函数，如wx.request、wx.download
 * @return {[type]}
 */
module.exports = (callback) => {
    return (obj = {}) => {
        return new Promise((resolve, reject) => {
            obj.success = function(res) {
                resolve(res)
            };

            obj.fail = function(res) {
                reject(res)
            };

            callback(obj); //执行函数，obj为传入函数的参数
        });
    };
};
