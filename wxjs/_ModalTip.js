//内置提示对话框
const { hideLoading } = require('./_loading');

module.exports = (title = '接口出错', callback, showCancel = false) => {
	hideLoading();
	
	return wx.showModal({
	    title: '提示',
	    content: title,
	    showCancel: showCancel,
	    complete(res) {
	    	//(res.confirm == 1 || res.confirm == 'true')
	    	if(res.confirm) return callback && callback(res);
	    }
	});
}
