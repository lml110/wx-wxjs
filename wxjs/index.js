const logins        = require('./login');
const _showModalTip = require('./_ModalTip'); //内置提示对话框
const _errMsg       = require('./_errMsg');   //内置错误弹窗
const config        = require('../config');    //配置信息
//console.log(_showModalTip);
//const config = { upimg_url:"https://file.xsmore.com/api/image/upload?PlatForm=zmws&Path=ImgPay" };
let wxjs = {};

//兼容加载显示隐藏
const {
    showLoading, hideLoading, _request, _showToast
} = require('./_loading');

const { auth_Fail } = logins;

/**
 * @class  内置导航
 */
const _navto = (flag, url) => {
    if (flag === 1) return wx.navigateTo({
        url
    });

    if (flag === 2) return wx.redirectTo({
        url
    });

    if (flag === 3) return wx.reLaunch({
        url,
        fail(){
            wx.redirectTo({
                url
            });
        }
    });

    if (flag === 4) return wx.switchTab({
        url
    });

    if (flag === 5) return wx.navigateBack({
        delta: url || 1
    });
};

/**
 * @class  预览图片
 * @author liumouliang 2018-05-07
 * _previewImage([],'')
 *
 * @param  {Array}    urls    
 * @param  {String}   current 
 * @return {[type]}      
 */
const _previewImage = (urls, current = urls[0]) => wx.previewImage({
    current: current,
    urls: urls,
    fail(err) {
        console.log("预览失败", err);
        return _showModalTip('预览失败，请更新微信版本');
    }
});

/**
 * @class  复制剪切板
 * @author liumouliang 2018-05-07
 *
 * @param  {Sting}      data     
 * @param  {Function}   callback
 * @return {[type]}
 */
const _ciipData = (data, callback) => wx.setClipboardData({
    data: data,
    success(res) {
        //console.log(res);
        return callback && callback();
    },
    fail(err) {
        console.log("复制失败", err);
        return _showModalTip('复制失败，请更新微信版本');
    }
});

/**
 * @class  百度定位
 * @author liumouliang 2018-05-07
 *
 * @param  {Function}  callback
 * @return {[type]}
 */
const BMap_getPostion = callback => {
    let BMap = new bmap.BMapWX({
        ak: 'EcnGLchYLhGiQFuGTEOohyqLIPjmpy3c'
    });

    return BMap.regeocoding({
        success(data) {
            return callback && callback(data);
        },
        fail(data) {
            return _showModalTip('定位失败');
        }
    });
};

/*拨打电话*/
const _makePhoneCall = phone => wx.makePhoneCall({
    phoneNumber: phone,
    fail(err) {
        console.log("拨打失败", err);
    }
});

/**
 * @class  下载文件
 * @author liumouliang 2018-05-07
 *
 * @param  {[type]}    url      下载地址
 * @param  {Function}  callback 
 * @return {[type]}
 */
const showModal_file = (cont,callback) => wx.showModal({
    title        : '提示',
    content      : cont,
    confirmColor : '#4d8ac9',
    confirmText  : '继续',
    cancelText   : '不用',
    showCancel   : true,
    complete(res){
        return callback && callback(res);
    }
});

const _downloadFile = (url, callback) => wx.downloadFile({
    url: url,
    success(files) {
        //console.log(files);
        if (files && files.tempFilePath) return callback && callback(files.tempFilePath);
        else return _showModalTip('下载失败，无路径返回');
    },
    fail(err) {
        let msg = '';
        console.log('_downloadFile',err);
        //hideLoading();
        if(err && ~err.errMsg.indexOf('max file size')){
            msg = '文件过大，下载失败';
        }else{
            msg = _errMsg(err,'下载失败');
        };

        return _showModalTip(msg);
    }
});
//多个文件下载
const all_downFile = (url,callback) => wx.downloadFile({
    url: url,
    complete(files){
        console.log('complete',files);
        if (files && files.statusCode==200 && files.tempFilePath) return callback && callback(files.tempFilePath);
        else return callback && callback();
    }
});

/**
 * @class  保存图片到相册
 * @author liumouliang 2018-05-07
 *
 * @param  {String}    path      储存地址
 * @param  {Function}  callback 
 * @return {[type]}
 */
const _saveImage = (path, callback) => wx.saveImageToPhotosAlbum({
    filePath: path,
    success(res) {
        return callback && callback(res);
    },
    fail(err) {
        if (err && ~err.errMsg.indexOf('fail auth deny')) {
            return auth_Fail('writePhotosAlbum', isSucess => {
                if (isSucess) return _saveImage(path, callback);
                else return callback && callback();
            });

        } else return callback && callback();
        /*return _showModalTip(_errMsg(err,'保存已取消'));*/
    }
});

/**
 * @class  保存视频到相册
 * @author liumouliang 2018-05-07
 *
 * @param  {String}    path      储存地址
 * @param  {Function}  callback 
 * @return {[type]}
 */
const _saveVideo = (path, callback) => wx.saveVideoToPhotosAlbum({
    filePath: path,
    success(res) {
        return callback && callback(res);
    },
    fail(err) {
        if (err && ~err.errMsg.indexOf('fail auth deny')) {  //授权问题
            return auth_Fail('writePhotosAlbum', isSucess => {
                if (isSucess) return _saveVideo(path, callback);
                else return callback && callback();
            });

        } else return callback && callback();
    }
});

/**
 * @class  全部保存
 * @author liumouliang 2018-05-07
 * 注意：curlist[curlen].BigPicUrl || curlist[curlen].PicUrl (字段更改)
 *
 * @param  {Array}     curlist  下载地址资源列表
 * @param  {Function}  callback 
 * @param  {Number}    type     0:图片 1:视频
 * @return {[type]}
 */
const _allSave = (curlist = [],callback,type = 0) => {
    let maxlen = curlist.length;    //总
    let curlen = 0;   //当前

    const typeFn = (type==1) ? _saveVideo : _saveImage;
    const save_success = () => {
        curlen++;
        if (curlen >= maxlen) {
            return callback && callback();
        }else{
            return saveFn();
        };
    };
    const save_fail = () => {
        hideLoading();
        return showModal_file('第'+(curlen+1)+'个资源下载失败，是否继续下载',res => {
            if (res.confirm) {
                showLoading('保存中');
                return save_success();
            }else {
                return callback && callback();
            };
        });
    };
    const saveFn = () => {
        let biurl = curlist[curlen].BigPicUrl || curlist[curlen].PicUrl;

        if (biurl) {
            return all_downFile(biurl, path => {
                if(path) {
                    typeFn(path, res => {
                        if(res) return save_success();
                        else return save_fail();
                    });
                } else return save_fail();
            });
        };
    };

    return saveFn();
};

/**
 * @class  上传图片
 * @author liumouliang 2018-05-09
 *
 * @param  {Function}  callback 
 * @param  {Number}    cont     上传数量限制
 * @return {[type]}
 */
const _chooseImage = (callback, cont = 1) => wx.chooseImage({
    count: cont,
    success(choose_res) {
        if(choose_res && choose_res.tempFilePaths) return callback && callback(choose_res.tempFilePaths);
        else return _showModalTip('相册选择失败，无路径返回');
    },
    fail(err) {
        let msg = _errMsg(err,'无法从相册选择');
        
        if(~msg.indexOf('fail cancel')) return false;
        return _showModalTip(_errMsg(err,'无法从相册选择'));
    }
});
const _uploadImage = (callback, cont = 1) => _chooseImage(tempFilePaths => {
    let len = tempFilePaths.length;
    let curi = 0;
    let urldata = []; //地址列表

    const upload_success = (res) => {
        curi++;
        //console.log(obj);
        if (res && res.data) {
            let obj = {};
            let data = (typeof res.data == 'string' && res.data.substr(0,1) == '[') ?  JSON.parse(res.data)[0] : res.data;

            obj.path = data;
            obj.bigpath = (~data.indexOf('_320.png')) ? data.replace(/_320.png$/, '') : data;
            urldata.push(obj);
        };

        if (curi >= len) {
            hideLoading();
            return callback && callback(urldata);
        } else return uploadFileFn(tempFilePaths[curi]);
    };
    const upload_fail = () => {
        hideLoading();
        return showModal_file('第'+(curlen+1)+'个资源上传失败，是否继续上传',res => {
            if (res.confirm) {
                showLoading('上传中');
                return upload_success();
            }else {
                return callback && callback(urldata);
            };
        });
    };

    const uploadFileFn = path => {
        showLoading("上传中", true);

        return wx.uploadFile({
            url: config.upimg_url,
            filePath: path,
            name: 'file',
            formData: {
                'user': 'test'
            },
            complete(res) {
                if (res.statusCode === 200) {
                    return upload_success(res);

                } else {
                    console.log("上传接口出错", res);
                    return upload_fail();
                };
            }
        });
    };

    return uploadFileFn(tempFilePaths[curi]);

}, cont);

/**
 * @class  获取分享配置
 * @author liumouliang 2017-11-23
 *
 * @param  {String}    title    分享标题
 * @param  {String}    path     分享路径
 * @param  {String}    img      分享图片
 * @param  {Function}  callback 
 * @return {[type]}
 *
 * onShareAppMessage
 * wx.hideShareMenu()
 * if (res.from === 'button') return app._shareObj(title,path,img);
    return app._shareObj(title,path,img);
 */
const _shareObj = (title = '',path = '',img = '',callback) => {
    return {
        title: title,
        path: path,
        imageUrl: img || '',
        success(res) {
            _showToast('分享成功','success');
            return callback && callback();
        },
        fail(err) {
            return _showToast('分享已取消','success');
        }
    }
};
/**
 * @class  获取用户信息
 * @author liumouliang 2018-05-09
 *     
 * @param  {Function}  callback 有值返回则成功 否失败
 * @return {[type]}
 */
const getusers = (callback) => {
    return _request('GetActivityMemberInfo', {}, data => {
        //console.log('GetActivityMemberInfo',data);
        if (data.isSuccess) return callback && callback(data.result)
        return callback && callback()
    });
};

/**
 * @class  微信支付
 * @author liumouliang 2017-11-23
 *
 * @param  {Object}    data     参数
 * @param  {[type]}    sucessFn 
 * @param  {[type]}    failFn   
 * @return {[type]}
 */
const _payment = (data = {} ,sucessFn,failFn) => wx.requestPayment({
    timeStamp: data.timeStamp,
    nonceStr: data.nonceStr,
    package: data.package,
    signType: 'MD5',
    paySign: data.paySign,
    success(res2) {
        return sucessFn && sucessFn(res2);
    },
    fail(err) {
        if(err && err.errMsg){
           if(~err.errMsg.indexOf("requestPayment:fail cancel")){
                return _showToast('支付已取消','none');
            };
        };
        
        return failFn && failFn(err);                 
    }
});

const go_path = (url='', params={}, state=1) => {
    let arr = [];

    for (let key in params) {
        arr.push(key+'='+params[key]);
    };
    return _navto(state, url + arr.join('&'));
};

wxjs = Object.assign({
    _showModalTip,  //内置提示对话框
    _showToast,     //内置信息提示框
    _navto,         //内置导航
    _shareObj,      //内置获取分享配置

    //兼容加载显示隐藏
    showLoading,
    hideLoading,

    /*上传下载 == 图片 || 视频 || 文字*/
    _uploadImage,   //上传图片
    _previewImage,  //预览图片
    _ciipData,      //复制剪切板

    _downloadFile,  //下载文件
    _saveImage,     //保存图片到相册
    _saveVideo,     //保存视频到相册
    _allSave,       //全部保存

    BMap_getPostion,    //百度定位
    _makePhoneCall,     //拨打电话

    _payment,   //微信支付

    /*新增*/
    getusers,   //获取用户信息（接口）

},logins);

module.exports = wxjs;
