'use strict'

const express = require('express');
const app = express();

const mongoose = require('mongoose'),
	BoosterType = require('../api/models/boosterTypeModel'),
	RivenType = require('../api/models/rivenTypeModel'),
	RivenOrigin = require('../api/models/rivenSourceModel'),
	RivenCondition = require('../api/models/rivenConditionModel'),
	Riven = require('../api/models/rivenModel'),
	RewardType = require('../api/models/rewardTypeModel'),
	Reward = require('../api/models/sortieRewardModel'),
	RivSrcProcess = require('../api/business/rivenSourceProcess'),
	RivenProcess = require('../api/business/rivenProcess'),
	convertDates = require('../api/utils/convertDates'),
	bodyParser = require('body-parser'),
	logger = require('morgan');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
}));
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/WarframeStatsDB', { useUnifiedTopology: true, useNewUrlParser: true })
	.then(() => console.log("Mongo connected."))
	.catch(err => {
		console.error("Connexion aborted ! "+err);
		process.exit(5);
	});

// created using the getInfoForCorrelationTable below
const correlationTable = new Map([
	['Transmutation','Transmutation'],
	['Wolf of Saturn VI event', 'Event'],
	['Arbitrations Vendor', 'Arbitration'],
	['Cephalon Simaris', 'Simaris'],
	['Event', 'Event'],
	['Steel path', 'Steel Path'],
	['Leveling', 'Daily'],
	['Requiem', 'Slivers'],
	['Misc', 'Unknown'],
	['Steel Path', 'Steel Path']
]);

function getInfoForCorrelationTable() {
	RivenProcess.list()
		.then(list => {
			console.log("Number of rivens = "+list.length);
			const uniqueNotes = new Map();
			list.forEach(riven => {
				if (uniqueNotes.has(riven.note))
					uniqueNotes.set(riven.note, uniqueNotes.get(riven.note) + 1)
				else
					uniqueNotes.set(riven.note, 1);
			});
			console.log(uniqueNotes);

			RivSrcProcess.list()
				.then(list => {
					const sources = [];
					list.forEach(l2 => sources.push(l2.source));
					console.log(sources);
				})
				.finally(()=> mongoose.disconnect());
		})
		.catch(err => console.error(err))
}
const delay = ms => new Promise(res => setTimeout(res, ms));

// needs a modified riven model with the following field
// note: { type: String, required: false },
function modifyRivensByCorrelation() {
	RivenProcess.list()
		.then(async function(list) {
			let i = 0;
			console.log("Number of rivens = "+list.length);
			for (const riv of list) {
				const src = correlationTable.get(riv.note);
				const source = await RivSrcProcess.findByIdOrOrigin(src);
				if (source != null) {
					riv.source = source._id;
					riv.markModified('source');
					await riv.save();
					i++;
				}
			}
			console.log(i + " riven sources updated.")
			await delay(2000);
			if (i == list.length) {
				console.log("Unset the 'note' field.");
				await Riven.updateMany({ $unset: { note: 1 } });
			}
			await mongoose.disconnect();
			console.log("Mongo disconnected.");
		})
		.catch(err => console.error(err))
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//getInfoForCorrelationTable();
//modifyRivensByCorrelation();
