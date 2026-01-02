const DAG = require('aabot/dag.js');
const crypto = require('crypto');

async function treatResponseFromGovernanceAA(objResponse, asset, main_aa) {
	const objTriggerJoint = await DAG.readJoint(objResponse.trigger_unit);
	if (!objTriggerJoint)
		throw Error('trigger unit not found ' + objResponse.trigger_unit);
	const objTriggerUnit = objTriggerJoint.unit;
	const data = getTriggerUnitData(objTriggerUnit);
	const governanceAAAddress = objResponse.aa_address;

	let event = {
		aa_address: governanceAAAddress,
		trigger_address: objResponse.trigger_address,
		trigger_unit: objResponse.trigger_unit,
		obj_response_unit: objResponse.objResponseUnit
	}

	if (data.name) {
		event.name = data.name;
		const full_name = data.deposit_asset ? (data.name + '_' + data.deposit_asset) : data.name;

		if (data.commit) {
			event.type = "commit";
			event.value = await DAG.readAAStateVar(governanceAAAddress, full_name);
		} else {
			event.leader_value = await DAG.readAAStateVar(governanceAAAddress, 'leader_' + full_name);
			event.leader_support = await DAG.readAAStateVar(governanceAAAddress, 'support_' + full_name + '_' + event.leader_value)
			if (data.value === undefined) {
				event.type = "removed_support";
			} else {
				event.type = "added_support";
				event.value = data.value;
				const user = await DAG.readAAStateVar(main_aa, 'user_' + objResponse.trigger_address);
				event.added_support = Math.sqrt(user.balances.frd + user.balances.base / await getCeilingPrice(main_aa));
				event.support = await DAG.readAAStateVar(governanceAAAddress, 'support_' + full_name + '_' + getValueKey(data.value));
			}
		}
	}

	return event;
}

let launch_ts;
async function getLaunchTs(main_aa) {
	if (!launch_ts) {
		const constants = await DAG.readAAStateVar(main_aa, 'constants');
		launch_ts = constants.launch_ts;
	}
	return launch_ts;
}

async function getCeilingPrice(main_aa) {
	return 2 ** ((Date.now() / 1000 - await getLaunchTs(main_aa)) / 3600 / 24 / 365);
}

function getValueKey(value) {
	return ('support_messaging_attestors_' + value).length > 128 ?
		'hash_' + crypto.createHash("sha256").update(value, "utf8").digest("base64") : value;
}

function getTriggerUnitData(objTriggerUnit) {
	for (var i = 0; i < objTriggerUnit.messages.length; i++)
		if (objTriggerUnit.messages[i].app === 'data') // AA considers only the first data message
			return objTriggerUnit.messages[i].payload;
	return {};
}

function getAmountFromUnit(objUnit, to_address, asset = 'base') {
	if (!objUnit)
		return 0;
	let amount = 0;
	objUnit.messages.forEach(function (message) {
		if (message.app !== 'payment')
			return;
		const payload = message.payload;
		if (asset == 'base' && payload.asset || asset != 'base' && asset !== payload.asset)
			return;
		payload.outputs.forEach(function (output) {
			if (output.address === to_address) {
				amount += output.amount; // in case there are several outputs
			}
		});
	});
	return amount;
}

exports.treatResponseFromGovernanceAA = treatResponseFromGovernanceAA;