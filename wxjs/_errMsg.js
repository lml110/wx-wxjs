/**
 * @class  内置错误弹窗
 * @author liumouliang 2018-05-24
 *
 * @param  {Object}    err   
 * @param  {String}    title 替换文字
 * @return {[type]}
 */
module.exports = (err = {},title = '') => {
    let msg = title;

    if(err && err.errMsg) msg = err.errMsg;

    return msg;
};