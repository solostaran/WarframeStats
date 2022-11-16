'use strict';

const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async function(req, res) {
    //StatsProcess.global(ret => res.render('statsGeneral', { title: 'General Stats', stats: ret.listStats, totalCount: ret.totalCount}));
    try {
        // const response = await axios.get('http://content.warframe.com/dynamic/worldState.php');
        // console.log(response.data.Events.length + ' events.');
        // const events = response.data.Events.filter( (n,i) => { return n.Messages[0].LanguageCode === 'en'; });

        const response = await axios.get('https://api.warframestat.us/pc/');
        res.render('worldEvents', {title: 'World Events', pc: response.data})
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
