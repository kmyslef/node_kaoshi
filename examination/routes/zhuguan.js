"use strict";

const express = require('express');
const router = express.Router();

const db = require('../lib/mysqldb');

function getQuestionData(page, size) {
    const  pre = new Promise((resolve, reject) =>{
        db.query(`select * from questions limit ${page},${size};`, function (error, results, fields) {
            if (error) {
                reject(error);
            }else {
                for (let i = 0; i < results.length; i++){
                    const temobj = results[i];

                }
                resolve(results);
            }

        });
    });

    return pre;
}

/* GET home page. */
router.get('/', function(req, res, next) {

    getQuestionData(0,5).then((results)=>{
        console.log("dfdfdfdf");
    }).catch((error)=>{
        console.log("dfdfdfdf");
    });
    const data = db.query("select * from `questions`;");
    res.render('index', { title: 'Express' });
});

module.exports = router;