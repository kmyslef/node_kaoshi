"use strict";

const express = require('express');
const router = express.Router();

const async = require('async');
const outlib = require('../lib/outlib');

const db = require('../lib/mysqldb');

class optioninfo{
    constructor(){
        this.context = '';
        this.uuid = '';
    }
}

class questinfo{
    constructor(){
        this.question = '';
        this.uuid = '';
        this.answerid = '';
        this.explain = '';
        this.type = '';
        this.optons = [];
        this.readcount = 0;
        this.rightcount = 0;
        this.errorcount = 0;
    }
}

class groupinfo{
    constructor(){
        this.pagenum = 0;
        this.pagesize = 0;
        this.showsize = 0;
        this.readcount = 0;
        this.rightcount = 0;
        this.errorcount = 0;
    }
}

//获取练习信息
function getReadInfo(questionid, accountid) {
    const  pre = new Promise((resolve, reject) =>{
        db.query(`SELECT readcount,rightcount,errorcount FROM questionread WHERE questionid = '${questionid}' AND accountid = '${accountid}';`, (error, results, fields) => {
            if (!error){
                resolve(results);
            }else {
                reject(error);
            }
        });
    });
    return pre;
}

//用户获取分页
function getQuestionUser(page, size, accountid) {
    const  pre = new Promise((resolve, reject) =>{
        getQuestionData(page, size).then((results)=>{
            let questionarr = [];
            let seriesarr = [];

            for (let i = 0; i < results.length; i++) {
                const temobj = results[i];
                let question = new  questinfo();
                question.uuid = temobj.uuid;
                question.answerid = temobj.answerid;
                question.explain = temobj.explain;
                question.type = temobj.type;
                question.question = temobj.question;
                question.optons = temobj.optons;
                questionarr.push(question);

                const callback = function (callback) {
                    db.query(`SELECT readcount,rightcount,errorcount FROM questionread WHERE questionid = '${question.uuid}' AND accountid = '${accountid}';`, function (error, rlts, fields){

                        callback(error, rlts);
                    });
                }

                seriesarr.push(callback);
            }
            async.series(seriesarr, (err, results) => {
                if (!err){
                    for (let i = 0; i < questionarr.length; i++){
                        let temquest = questionarr[i];
                        let temarr = results[i];
                        if (temarr.length > 0){
                            const tem = temarr[0];
                            temquest.readcount = tem.readcount;
                            temquest.rightcount = tem.rightcount;
                            temquest.errorcount = tem.errorcount;
                            console.log('');
                        }
                    }

                    resolve(questionarr);
                }else{
                    reject(err);
                }
            })
            console.log('');
        }).catch((error)=>{
            reject(err);
            console.log('');
        });
    });

    return pre;
}

//获取列表，分页
function getQuestionData(page, size) {
    const  pre = new Promise((resolve, reject) =>{
        db.query(`select * from questions limit ${page},${size};`, (error, results, fields) => {
            if (error) {
                reject(error);
            }else {

                let questionarr = [];
                let seriesarr = [];
                for (let i = 0; i < results.length; i++) {

                    const temobj = results[i];
                    let question = new  questinfo();
                    question.uuid = temobj.uuid;
                    question.answerid = temobj.answerid;
                    question.explain = temobj.explain;
                    question.type = temobj.type;
                    question.question = temobj.question;
                    question.optons = temobj.optons;
                    questionarr.push(question);

                    const callback = function (callback) {
                        db.query(`SELECT * FROM options WHERE questionid = '${temobj.uuid}';`, function (error, rlts, fields){

                            callback(error, rlts);
                        });
                    }

                    seriesarr.push(callback);

                }

                async.series(seriesarr, (err, results) => {

                    if (!err){
                        for (let i = 0; i < questionarr.length; i++){
                            let temquest = questionarr[i];
                            let temarr = results[i];

                            let optionarr = [];
                            for (let j = 0; j < temarr.length; j++){
                                const temoption = temarr[j];
                                let  option = new optioninfo();
                                option.context = temoption.context;
                                option.uuid = temoption.uuid;
                                optionarr.push(option);
                            }
                            temquest.optons = optionarr;

                        }

                        resolve(questionarr);
                    }
                    else{
                        reject(err);
                    }

                });

            }

        });
    });

    return pre;
}

//获取帐户是否存在
function getIsUser(token) {
    const  pre = new Promise((resolve, reject) =>{
        db.query(`SELECT * FROM user WHERE accountid = '${token}';`, (error, results, fields) => {
            if (!error){
                let isuser = false;
                if (results.length > 0){
                    isuser = true;
                }
                resolve(isuser);
            }else {
                reject(error);
            }
        });
    });

    return pre;
}

//获取组
function getGroup(token) {
    const  pre = new Promise((resolve, reject) =>{
        db.query(`SELECT COUNT(*) as count FROM questions;`, (error, results, fields) => {
            if (!error){
                const pagesize = 100;
                const totlenum = results[0].count;
                let groupnum = parseInt(totlenum / pagesize);
                const temadd = totlenum % pagesize;
                if (temadd > 0){
                    groupnum = groupnum + 1;
                }

                let grouparr = [];
                let seriesarr = [];
                for (let i = 0; i < groupnum; i++){
                    let teminfo = new groupinfo();
                    teminfo.pagenum = i;
                    teminfo.pagesize = pagesize;

                    if (i == (groupnum - 1) && temadd > 0) {
                        teminfo.showsize = temadd;
                    }else{
                        teminfo.showsize = pagesize;
                    }

                    grouparr.push(teminfo);

                }

                resolve(grouparr);
            }
            else {
                reject(error);
            }

        });
    });
    return pre;
}

//练习题
function readquestion(questionid, answerid, token) {
    const  pre = new Promise((resolve, reject) =>{
        db.query(`SELECT * FROM questions WHERE uuid = '${questionid}';`, (error, results, fields) => {

            if (!error){
                const questioninfo = results[0];
                let rightcount = 0;
                let errorcount = 0;

                if (questioninfo.answerid == answerid){
                    rightcount = rightcount + 1;
                }else {
                    errorcount = errorcount + 1;
                }

                db.query(`SELECT * FROM questionread WHERE questionid = '${questionid}' AND accountid = '${token}';`, (error, results, fields) =>{
                    if (!error){
                        let readinfo = results[0];
                        readinfo.readcount = readinfo.readcount + 1;
                        readinfo.rightcount = readinfo.rightcount + rightcount;
                        readinfo.errorcount = readinfo.errorcount + errorcount;
                        db.query(`UPDATE questionread SET readcount = ${readinfo.readcount},rightcount = ${readinfo.rightcount}, errorcount = ${readinfo.errorcount} WHERE questionid = '${questionid}' AND accountid = '${token}';`, (error, results, fields) =>{
                            if (!error){
                                resolve(questioninfo.answerid);
                            }else{
                                reject(error);
                            }
                        });

                    }else {
                        reject(error);
                    }
                });
            }else {
                reject(error);
            }


        });
    });
    return pre;
}


//练习题
router.post('/readquestion', (req, res, next) => {
    const token = req.header('token');
    if (req.body.questionid && req.body.answerid){
        readquestion(req.body.questionid, req.body.answerid, token).then((results)=>{
            const temout = outlib.outdata(results, '');
            res.statusCode = temout.state;
            res.send(temout.data);
        }).catch((error)=>{
            const temout = outlib.outerror(error);
            res.statusCode = temout.state;
            res.send(temout.data);
        });
    }else{
        const error = outlib.madeerror('参数错误');
        const temout = outlib.outerror(error);
        res.statusCode = temout.state;
        res.send(temout.data);
    }
});

//获取列表，分页
router.get('/alllist', (req, res, next) => {

     if (req.query.page && req.query.size){
         const pagenum = req.query.page * req.query.size;
         getQuestionData(pagenum, req.query.size).then((results)=>{
             const temout = outlib.outdata(results, '');
             res.statusCode = temout.state;
             res.send(temout.data);
         }).catch((error)=>{
             const temout = outlib.outerror(error);
             res.statusCode = temout.state;
             res.send(temout.data);
         });
     }else{
         const error = outlib.madeerror('参数错误');
         const temout = outlib.outerror(error);
         res.statusCode = temout.state;
         res.send(temout.data);
     }
});

//通过用户获取，分页
router.get('/alluserlist', (req, res, next) => {

    const token = req.header('token');
    if (req.query.page && req.query.size && token){
        const pagenum = req.query.page * req.query.size;
        getQuestionUser(pagenum, req.query.size, token).then((results)=>{
            const temout = outlib.outdata(results, '');
            res.statusCode = temout.state;
            res.send(temout.data);
        }).catch((error)=>{
            const temout = outlib.outerror(error);
            res.statusCode = temout.state;
            res.send(temout.data);
        });
    }else{
        const error = outlib.madeerror('参数错误');
        const temout = outlib.outerror(error);
        res.statusCode = temout.state;
        res.send(temout.data);
    }
});

//获取组
router.get('/group', (req, res, next) => {
    const token = req.header('token');
    getIsUser(token).then((isuser) => {
        if (isuser){
            getGroup(token).then((results) =>{

                const temout = outlib.outdata(results, '');
                res.statusCode = temout.state;
                res.send(temout.data);
            }).catch((error)=>{
                const temout = outlib.outerror(error);
                res.statusCode = temout.state;
                res.send(temout.data);
            });

        }else {
            const temout = outlib.madeaccountout();
            res.statusCode = temout.state;
            res.send(temout.data);
        }
    }).catch((error)=>{
        const temout = outlib.outerror(error);
        res.statusCode = temout.state;
        res.send(temout.data);
    });
});



module.exports = router;