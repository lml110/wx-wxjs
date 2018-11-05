const session       = require('./session');
const _showModalTip = require('./_ModalTip'); //内置提示对话框
const API           = require('./API');

const plugin = requirePlugin("myPlugin");
const { _paramsToString }     = plugin.utils;

const {
    showLoading, hideLoading, _showToast
} = require('./_loading');

let config        = require('../config');

/*jwt - 验证方式*/
function serializeJson(obj) {
    let str = '';
    for (let k in obj) {
        str += k + '=' + obj[k] + ';';
    }
    return str;
};

/*ss-tok 转换 token*/
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

/***
 * @class
 * 表示登录过程中发生的异常
 */
const RequestError = (() => {
    function RequestError(type, message) {
        Error.call(this, message);
        this.type = type;
        this.message = message;
    };

    RequestError.prototype = new Error();
    RequestError.prototype.constructor = RequestError;

    return RequestError;
})();

/**
 * @class  接口出错跳转页
 * @author liumouliang 2018-05-05
 *
 * @param  {String}    msg     底部错误信息
 * @param  {String}    title   描述
 * @param  {Boolean}   ishide  是否隐藏底部信息  true: 隐藏 || false：显示 (默认)
 * @return {[type]}
 */
const _JsonFailfn = (msg = '当前页面接口出现错误，请退出后重新登录', title = '',ishide = false) => {
    const pages = getCurrentPages();

    hideLoading();
    if (pages) {
        const page_lastVal = pages.length - 1;
        const params = pages[page_lastVal].options;
        const route = pages[page_lastVal].route;

        config.abnor_path = '/'+route+_paramsToString(params);
        //let params_str = '?route='+route+'&params='+JSON.stringify(params);

        /*for (let key in params) {
            params_str += '&' + key + '=' + params[key];
        };*/
        let params_str = '?route='+route;
        
        if(title) params_str += '&title=' + title;
        if(ishide) params_str += '&ishide=true';
        
        session.set('abnor_info', msg);
        return wx.redirectTo({
            url: '/pages/abnor/abnor' + params_str
        });

    };

    return _showModalTip(msg);
};

/***
 * @class 授权获取失败打开设置
 */

const auth_Fail = (authInfo = '', callback, isforce = false) => {
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

    //hideLoading();
    return _showModalTip('请授权' + scopeList[authInfo], openS_fn);
};

/**
 * @class  执行设备授权
 * @author liumouliang 2018-05-05
 *
 * @param  {String}    authInfo  选择授权的项目
 * @param  {[type]}    callback [description]
 * @param  {Boolean}   isforce   是否强制授权 默认为true
 * @return {[type]}    回调返回值没有增加 istrue 判断是否成功 ，或用 pormise
 */
const _AuthPress = (authInfo, callback, isforce = false) => {
    const scope_authInfo = 'scope.' + authInfo;

    return wx.getSetting({
        success(res) {
            if (!res.authSetting[scope_authInfo]) {
                console.log("开始进行设备授权", res);

                return wx.authorize({
                    scope: scope_authInfo,
                    success() {
                        return callback && callback(true);
                    },
                    fail(err) {
                        console.log("开始进行设备授权失败", err);
                        return auth_Fail(authInfo, callback, isforce);
                    }
                });
            };

            return callback && callback(true);
        },
        fail(err) {
            console.log('获取用户的当前设置失败', err);
        }
    });
};

/**
 * @class  执行获取用户信息  == 一次性
 * @author liumouliang 2018-05-05
 *
 * @param  {[type]}    callback [description]
 * @param  {Boolean}   isencry  是否要加密信息
 * @return {[type]}
 */
const _UserInfo1 = (callback, isencry = false) => {
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
};
const _UserInfo = (callback, isencry = false) => {
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

/**
 * @class  获取用户信息
 * 
 * @param  {Boolean}   isencry  是否要加密信息
 */
const GetUserInfo = (callback, isencry = false) => {
    const info = session.get('userInfo'); //登录时设置

    return wx.checkSession({
        success(res1) {
            if (info) return callback && callback(info);

            return _UserInfo(userInfo => callback && callback(userInfo.userInfo));
        },
        fail(err1) {
            session.clear('userInfo');

            return _LoginPress(userInfo => callback && callback(userInfo.userInfo));
        }
    });
};

/**
 * @class  获取sessionId
 */
const _SessionId = callback => {
    return _LoginPress(loginInfo => {
        if (loginInfo) {
            let userInfo = session.get('userInfo');

            return wx.request({
                url: getUrl('login'),
                data: loginInfo,
                method: 'POST',
                success(res) {
                    let data = res.data || {};
                    
                    if (data.isSuccess) {
                        //userInfo['memberId'] = data.memberId || '';
                        userInfo = Object.assign(userInfo, data.result);
                        //session.set('sessionId', data.result.sessionId);
                        session.set('userInfo', userInfo);
                        return callback && callback(data.result.sessionId);

                    } else return _showModalTip(data.message || '登录接口失败');
                    //session.set('sessionId',res.sessionId)

                },
                fail(err) {
                    return _showModalTip(err.errMsg || '登录接口出错');
                }
            });

        } else {
            return callback && callback();
        };

    });
};

const GetSessionId = callback => {
    const sessionId = session.get('sessionId');

    return wx.checkSession({
        success(res1) {
            if (sessionId) return callback && callback(sessionId);

            return _SessionId(callback);
        },
        fail(err1) {
            return _SessionId(callback);
        }
    });
};

/**
 * @class  登录执行
 */
const _LoginPress = (callback) => {
    return wx.login({
        success(loginResult) {
            return _UserInfo((userResult) => {

                if (userResult) return callback({
                    code: loginResult.code,
                    userInfo: userResult.userInfo,
                    encryptedData: userResult.encryptedData,
                    iv: userResult.iv
                });

                return callback && callback();

            }, true);
        },
        fail(err) {
            return callback && callback();
        }
    });
};

/**
 * @class  获取API地址
 */
const getUrl = route => {
    return config.apihost + '/' + API[route];
};

/**
 * @class  数据请求接口
 * @author liumouliang 2018-05-05
 *
 * @param  {String}    route        地址名
 * @param  {Object}    requedata    参数
 * @param  {String}    method       
 * @param  {Boolean}   hasSessionId 是否需要sessionId（登录状态）
 * @return {[type]}
 */
const _request = (route, requedata, hasSessionId = true, method = "POST", callback) => {
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
};

/**
 * @class  登录获取bug || 点击授权按钮后执行
 * @author liumouliang 2018-05-11
 *
 * @param  {Object}    users   
 * @param  {Function}  callback 
 * @return {[type]}
 */
const initAuthLogin = (users = {}, callback) => wx.login({
    success(loginResult) {
        //users.code = loginResult.code;
        //console.log(users);
        let requedata = {
            code: loginResult.code,
            encryptedData: users.encryptedData,
            iv: users.iv,
            mallId: users.mallId,
            brandId: users.brandId
        };
        
        return _request('login',requedata,false).then(data => {
            return callback && callback(data);
        }).catch(err=>{
            let msg = '';

            if(~err.indexOf('not in domain')){
                msg = '公众号合法域名未配置';
            }else if(~err.indexOf('timeout')){
                msg = '请求时间超时'
            };
            
            return _showModalTip(msg);
        });

    },
    fail(err) {
        return _showModalTip('微信登录失败');
    }
});

module.exports = {
    RequestError,   //请求失败后执行 （参考）
    session,        //缓存设置

    getUrl,         //获取api完整地址
    _request,       //异步请求  
    _JsonFailfn,    //异常错误后执行

    initAuthLogin,  //登录获取bug （接口）

    /*可能抛弃*/
    GetSessionId,   //获取登录状态 
    auth_Fail,      //授权获取失败打开设置
    _AuthPress,     //设备获取授权
    GetUserInfo,    //获取用户信息
    _LoginPress,    //执行登录

};
