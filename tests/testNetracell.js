'use strict'

const mongoose = require('mongoose')
const _ = require('lodash')
const netracellModel = require('../api/models/netracellModel')
const { netracellRewardTypes } = netracellModel;
const NetracellRewards = mongoose.model('NetracellRewards')
// const debug = require('debug')('warframestats:tests')

mongoose.Promise = global.Promise
mongoose.set('debug', true)
mongoose.connect('mongodb://localhost/WarframeStatsDB', {family:4})

let timer = 100;
const getTimer = function () {
	let ret = timer;
	timer += 100;
	return ret;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const list_netra_types = async function() {
	return Promise.resolve(netracellRewardTypes);
}
list_netra_types().then(list => {
	console.log("Types of Netracell Rewards:"+JSON.stringify(list));
});

const add = async function(rew) {
	await sleep(getTimer());
	const newObj = new NetracellRewards(rew);
	return newObj.save();
}
add({reward: {type:"Crimson Truc Shard"}, tauforged: true,  date: "2024-12-16"})
	.then((ret) => {
	console.log("Add netracell reward :"+ret)
	})
	.catch((reason) => {
		console.log("Netracell reward rejected :"+reason)
	})

const count = async function() {
	await sleep(getTimer());
	return NetracellRewards.countDocuments({}).exec()
}
count().then((nb) => {
	console.log("Number of netracell rewards = "+nb)
})

const list_raw = async function() {
	await sleep(getTimer());
	return NetracellRewards
		.find({})
		.sort({date: -1})
		.exec()
}
list_raw().then((list) => {
	if (_.isNil(list) || _.isEmpty(list)) console.log("Found no netracell rewards.")
	else {
		console.log("Netracell Rewards:")
		console.log(JSON.stringify(list).substring(0, 64)+"...")
	}
	mongoose.disconnect()
})



