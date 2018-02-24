"use strict";

function outdata(data, message) {
    return {'state':200, 'data':{"message":message, "data":data}};
}

function outerror(error) {
    const message = error.message;
    return {'state':508, 'data':{"message":message, "data":{}}};
}

function madeError(message) {
    const error = new Error(message);
    return error;
}

function madeAccountOut() {
    const message = '用户过期，请重新登录';
    return {'state':401, 'data':{"message":message, "data":{}}};
}

exports.outdata = outdata;
exports.outerror = outerror;
exports.madeerror = madeError;
exports.madeaccountout = madeAccountOut;