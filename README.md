# 微信小程序-API封装

## 介绍

用于便捷方便使用


# 使用方法

- 授权失败后重新授权 （authFail）

```graph
	const scope_authInfo = 'scope.' + authInfo;
	const scopeList = {
	    userInfo: "用户信息",  //1
	    userLocation: "地理位置",   //1
	    address: "通讯地址",
	    record: "录音功能",
	    werun: "微信运动步数",
	    invoiceTitle: "发票抬头",
	    writePhotosAlbum: "保存到相册", //1
	    camera: "摄像头",  //1
	};

	const openS_fn = () => {
	    return wx.openSetting({
	        success(res) {
	            if (res.authSetting[scope_authInfo]) {
	                console.log("授权成功");
	                return callback && callback(true);

	            } else {
	                console.log("重新授权", scope_authInfo);

	                return wx.showModal({
	                    title: '提示',
	                    confirmText: '重新授权',
	                    cancelText: "我知道了",
	                    confirmColor: '#4d8ac9',
	                    content: '取消授权，可能会使部分服务无法使用，或页面信息显示不完整。',
	                    showCancel: !isforce,
	                    success(res) {
	                        if (isforce) return openS_fn();

	                        //不强制授权
	                        if (res.confirm) return openS_fn();
	                        if (res.cancel) return callback && callback(true);
	                    },
	                    fail(err) {
	                        console.log(err);
	                        return _showModalTip("授权弹窗失误");
	                    }
	                });

	            };
	        }
	    });
	};
```

- 获取用户信息 （getUserInfo）

```graph
	const auth_sucess = isSucess => {
	    if (isSucess) {
	        return wx.getUserInfo({
	            withCredentials: isencry,
	            success(userResult) {
	                session.set('userInfo', userResult.userInfo);

	                return callback && callback({
	                    userInfo: userResult.userInfo,
	                    encryptedData: userResult.encryptedData || null,
	                    iv: userResult.iv || null
	                });
	            },
	            fail(err) {
	                console.log("getAuthFail", err);
	                return callback && callback();
	                    //return _showModalTip('获取用户信息失败')
	            }
	        });
	    };

	    return callback && callback();
	};
	//return auth_sucess()
	return _AuthPress('userInfo', auth_sucess, false); //授权成功后执行
```

- 微信Promise使用 （wxPromisify）

```graph
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
```

- 请求处理 （_request）

```graph
	let requeUrl = getUrl(route);
	let header = {
	    PlatForm: 2
	};

	const logon_Fail = () => {
	    let pages = getCurrentPages();
	    let path = '';

	    if(pages.length){
	        const page_lastVal = pages.length - 1;
	        const params = pages[page_lastVal].options;
	        const route = pages[page_lastVal].route;

	        path = '/'+route+_paramsToString(params);
	    };

	    if(path) config.abnor_path = path;

	    console.log('welcome_path');
	    wx.reLaunch({ url: config.welcome_path,fail(){
	        wx.redirectTo({
	          url: config.welcome_path
	        })
	    }});
	    return false;
	};

	return new Promise((resolve, reject) => {
	    if (hasSessionId) {
	        const sessionId = session.get('sessionId');
	        if (sessionId) requeUrl += '?mappsessionid=' + sessionId;
	        else return logon_Fail();
	    };
	    
	    let options = {
	        url: requeUrl,
	        data: requedata,
	        header:header,
	        method: method,
	        success(result) {
	            if (result.statusCode === 200) {

	                if(result.data.ErrorCode){
	                    hideLoading();
	                    console.log('ErrorCode存在：',result.data);

	                    if (result.data.ErrorCode == 10000003){
	                        return logon_Fail();
	                    }else if (result.data.ErrorCode == 10000009||result.data.ErrorCode == 10000005||result.data.ErrorCode == 10000004) { //通用提示
	                        console.log('通用提示，跳转提示页');
	                        wx.redirectTo({ url: config.message_path+'?message='+result.data.Message });
	                        return false;

	                    }/*else if (result.data.ErrorCode == 10000006) { //代理未填写意向
	                        console.log('代理未填写意向，跳转意向资料填写');

	                        wx.redirectTo({ url: "/pages/welcome/authFail"});
	                        return false;
	                    }*/else if (result.data.ErrorCode == 10000007) { //进入下单页面下授权单 == 15636258885
	                        /*if(config.ErrorCode == 10000007) return false;
	                        config.ErrorCode = 10000007;*/
	                        console.log('进入下单页面下授权单');

	                        wx.redirectTo({ url: "/pages/order/place_order?ordertype=1"});
	                        return false;

	                    }else if (result.data.ErrorCode == 10000008) {  //升级单
	                        console.log('10000008是干嘛的?');

	                        wx.redirectTo({ url: "/pages/order/place_order?ordertype=7"});
	                        return false;_

	                    } else if (result.data.ErrorCode == 1000060) { //图片验证码出现错误
	                        return reject(result.data,'1000060');

	                    } else if (result.data.ErrorCode == 10000010) { //跳转到我要代理页面
	                        wx.redirectTo({ url: "/pages/welcome/authFail"});
	                        return false;
	                        
	                    } else return _showModalTip(result.data.Message || '状态200 接口出错');

	                }else if(hasSessionId){
	                    if(callback) return callback(result.data);

	                    /*待修改*/
	                    if(result.data.IsSuccess){
	                        return resolve(result.data.Result || result.data || {});
	                    }else{
	                        hideLoading();
	                        if(result.data.Message) {
	                            //console.log(result.data.Message.length);
	                            if(result.data.Message.length<40) _showToast(result.data.Message,'none');
	                            else _showModalTip(result.data.Message);
	                        };
	                        //return reject(result.data);
	                        return reject(result.data);
	                    }; 
	                   
	                }else {
	                    //if(result.data.IsSuccess) return resolve(result.data.Result || result.data || {});
	                    return resolve(result.data || {});
	                };

	            } else if (result.statusCode === 401) {
	                console.log('401',result.statusCode);
	                return logon_Fail();
	            } else {
	                //reject(result);
	                console.log(result);
	                let err = `接口出错：url= ${requeUrl}
	                    statusCode= ${result.statusCode}
	                    requedata= ${JSON.stringify(requedata)}`;

	                //if (typeof result.data !== 'string') err += JSON.stringify(result.data);

	                return _JsonFailfn(err);
	            };
	        },
	        fail(err) {
	            if(!hasSessionId) return reject(err.errMsg || err);

	            let errMsg = '';

	            if(err && err.errMsg) errMsg = err.errMsg;
	            else errMsg = JSON.stringify(err);

	            if(~errMsg.indexOf('abort')) return false;
	            else {
	                const ishide = (~errMsg.indexOf('连接') || ~errMsg.indexOf('超时')) ? true : false;
	                const msg = (ishide) ? errMsg.replace('request:fail ', '') : '';

	                return _JsonFailfn('当前接口请求失败: url= ' + requeUrl + '\n requedata=' + JSON.stringify(requedata) + "\n errMsg= " + errMsg, msg, ishide);
	            };
	            
	        },
	    };

	    return wx.request(options);
	});
```

- 缓存机制 （session）

```graph
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
```

- 登录机制（ss-tok转换）

```graph
	function mockSessionCookies(res) {
	    if (!res.header['Set-Cookie']) return;

	    let cookies = session.get('session-cookie');
	    
	    if (!cookies) cookies = {};
	    //解析Set-Cookie. wx.request会将多个Set-Cookie以','连接
	    //console.log(res.header['Set-Cookie']);
	    res.header['Set-Cookie'].split('httponly,').forEach(ck => {
	        //console.log('ck',ck);
	        let kv = ck.split(';')[0].split('=');
	        //console.log('kv',kv);
	        cookies[kv[0]] = kv[1];
	    });

	    session.set('session-cookie',cookies);
	};
```

- 下载文件 （downloadFile）

```graph
	- 单文件下载
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

	- 多文件下载

	const all_downFile = (url,callback) => wx.downloadFile({
	    url: url,
	    complete(files){
	        console.log('complete',files);
	        if (files && files.statusCode==200 && files.tempFilePath) return callback && callback(files.tempFilePath);
	        else return callback && callback();
	    }
	});

	-- 全部保存
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
```

- 上传图片 （_uploadImage）

```graph
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
```

- 分享配置 （_shareObj）

```graph
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
```

- 默认提示框**

```graph
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

	return wx.showModal({
	    title: '提示',
	    content: title,
	    showCancel: showCancel,
	    complete(res) {
	    	//(res.confirm == 1 || res.confirm == 'true')
	    	if(res.confirm) return callback && callback(res);
	    }
	});
```


- 微信支付 （_payment）
```graph
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
```