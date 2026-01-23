const DAG = require('aabot/dag.js');
const conf = require('ocore/conf.js');
const network = require('ocore/network.js');
const eventBus = require('ocore/event_bus.js');
const lightWallet = require('ocore/light_wallet.js');
const walletGeneral = require('ocore/wallet_general.js');
const governanceEvents = require('./lib/governance_events.js');
const governanceDiscord = require('./lib/governance_discord.js');

const getSymbolByAsset = require('./utils/getSymbolByAsset');
const getDecimalsByAsset = require('./utils/getDecimalsByAsset');

const ignoreOldResponses = true; // if true, old responses will be ignored

var assocGovernanceAAs = {};
var assocFriendAAs = {};

lightWallet.setLightVendorHost(conf.hub);

eventBus.once('connected', function (ws) {
	network.initWitnessesIfNecessary(ws, start);
});


async function start() {
	await watchFriendAA(conf.friend_aa);
	lightWallet.refreshLightClientHistory();
}


eventBus.on('aa_response', async function (objResponse) {

	if (objResponse.response.error)
		return console.log('ignored response with error: ' + objResponse.response.error);
	if (ignoreOldResponses && ((Math.ceil(Date.now() / 1000) - objResponse.timestamp) > 24 * 3600))
		return console.log('ignored old response' + objResponse);
	if (assocGovernanceAAs[objResponse.aa_address]) {
		const { main_aa } = assocGovernanceAAs[objResponse.aa_address];
		const { asset, symbol, decimals } = assocFriendAAs[main_aa];

		const event = await governanceEvents.treatResponseFromGovernanceAA(objResponse, decimals, main_aa);
		if (!event.type) return console.log('ignored response with no type: ', event);

		governanceDiscord.announceEvent("Obyte Friends", `https://friends.obyte.org/governance`, event);
	} else {
		console.log('ignored response from unknown AA: ' + objResponse.aa_address);
	}
});



async function watchFriendAA(mainAAAddress) {
	const constants = await DAG.readAAStateVar(mainAAAddress, "constants");

	const { asset, governance_aa } = constants;

	walletGeneral.addWatchedAddress(governance_aa);

	const decimals = await getDecimalsByAsset(asset);
	const symbol = await getSymbolByAsset(asset);

	assocFriendAAs[mainAAAddress] = {
		aa_address: mainAAAddress,
		governance_aa: governance_aa,
		asset,
		decimals,
		symbol
	};
	assocGovernanceAAs[governance_aa] = {
		main_aa: mainAAAddress
	};
}

function handleJustsaying(ws, subject, body) {
	switch (subject) {
		case 'light/have_updates':
			lightWallet.refreshLightClientHistory();
			break;
	}
}

eventBus.on("message_for_light", handleJustsaying);

process.on('unhandledRejection', up => { throw up });
