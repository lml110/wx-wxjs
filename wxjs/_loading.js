/**
 * @class  兼容加载显示隐藏
 * @author liumouliang 2018-05-24
 *
 * @param  {String}    title [description]
 * @param  {Boolean}   mask  [description]
 * @return {[type]}
 */
const showLoading = (title = "加载中", mask = true) => {
    if (wx.showLoading) {
        //console.log('showLoading');
        return wx.showLoading({
            title: title,
            mask: mask
        });

    } else {
        //console.log('showToast');
        return wx.showToast({
            title: title,
            icon: "loading",
            duration: 30000,
            mask: mask
        });

    };
};

const hideLoading = () => {
    if (wx.showLoading) {
        //console.log('hideLoading');
        return wx.hideLoading();
    } else {
        //console.log('hideToast');
        return wx.hideToast();
    };
};

/**
 * @class  内置信息提示框
 */
const _showToast = (title, icon = 'none', time = 1500, mask = true) => wx.showToast({
    title: title,
    icon: icon,
    duration: time,
    mask: mask
});

module.exports = {
    showLoading,
    hideLoading,
    _showToast
};
