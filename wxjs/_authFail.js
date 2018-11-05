module.exports = (authInfo = '', callback, isforce = false) => {
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
