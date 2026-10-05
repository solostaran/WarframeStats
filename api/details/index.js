'use strict';

// Read-only details of a record, for the "More info" modal
// (views/mixins/detailsModal.pug, public/javascripts/detailsModal.js).
// Everything is converted to display strings here : the browser only shows them, as text.
// Block : { label, value } or { label, list: [{ text, items: [string] }] }
const { date2string } = require('../utils/convertDates'),
	RewardProcess = require('../business/rewardProcess'),
	RivenProcess = require('../business/rivenProcess'),
	NetracellRewardProcess = require('../business/netracellRewardProcess');

const NONE = '-';

const day = date => (date ? date2string(new Date(date)) : NONE);
const timestamp = date => (date ? new Date(date).toISOString() : NONE);
// createdBy/modifiedBy are already reduced to a semi-obfuscated email (api/utils/publicUser.js)
const email = user => (user && user.email ? user.email : NONE);
const field = (label, value) => ({
	label,
	value: value === undefined || value === null || value === '' ? NONE : String(value)
});

// ID, creation and modification, common to every kind of record
function recordInfo(doc) {
	return [
		field('ID', doc._id),
		field('Created by', email(doc.createdBy)),
		field('Created in database', timestamp(doc.Created_date)),
		field('Modified by', email(doc.modifiedBy)),
		field('Modification date', timestamp(doc.Modified_date))
	];
}

async function reward(id) {
	const doc = await RewardProcess.findById(id);
	if (!doc) return null;
	const blocks = [
		field('Date', day(doc.date)),
		field('Reward type', doc.type && doc.type.name),
		field('Source', doc.source && doc.source.name)
	];
	if (doc.booster) blocks.push(field('Booster type', doc.booster.name));
	if (doc.rivenType) blocks.push(field('Riven type', doc.rivenType.name));
	return { title: 'Reward', blocks: blocks.concat(recordInfo(doc)) };
}

async function riven(id) {
	const doc = await RivenProcess.byId(id).catch(() => null); // byId rejects an unknown id
	if (!doc) return null;
	// "{N}" of the mandatory (first) condition replaced by N
	const challenges = (doc.conditions || []).filter(Boolean).map((condition, index) => ({
		text: index === 0 && doc.N ? condition.description.replace('{N}', doc.N) : condition.description,
		items: (condition.advices || []).map((advice, n) => 'advice ' + (n + 1) + ' : ' + advice)
	}));
	const blocks = [
		field('Type', doc.type && doc.type.name),
		field('Riven source', doc.source && doc.source.name)
	];
	if (doc.reward) blocks.push(field('Reward ID', doc.reward._id || doc.reward));
	blocks.push(field('Weapon name', doc.weaponName));
	blocks.push(challenges.length > 0 ? { label: 'Challenges', list: challenges } : field('Challenges', NONE));
	return { title: 'Riven', blocks: blocks.concat(recordInfo(doc)) };
}

async function netracell(id) {
	const doc = await NetracellRewardProcess.findById(id);
	if (!doc) return null;
	const blocks = [
		field('Date', day(doc.date)),
		field('Reward', typeof doc.reward === 'string' ? doc.reward : doc.reward && doc.reward.type)
	];
	if (doc.tauforged) blocks.push(field('Tauforged', 'Yes'));
	return { title: 'Netracell', blocks: blocks.concat(recordInfo(doc)) };
}

// undefined for an unknown kind (a Map has no inherited keys such as "__proto__")
const builders = new Map([['reward', reward], ['riven', riven], ['netracell', netracell]]);

exports.get = kind => builders.get(kind);
