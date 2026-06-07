"use strict";
const path = require('path');
require('dotenv').config({ path: path.dirname(process.mainModule.paths[0]) + '/.env' });

exports.bServeAsHub = false;
exports.bLight = true;

exports.bNoPassphrase = true;

exports.discord_token = process.env.discord_token;
exports.discord_channels = [process.env.channel];
exports.testnet = !!process.env.testnet;
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';

exports.explorer_base_url = process.env.testnet ? 'https://testnetexplorer.obyte.org/' : 'https://explorer.obyte.org/';

exports.friend_aa = process.env.testnet ? 'FRDOJAJVFY2WWMM4TZNUWEX5RU5FBBTG' : 'FRDOJX6EL3STQRKZVJ4V6E6L4TKBHAEA';

exports.token_registry_AA_address = process.env.TOKEN_REGISTRY_AA_ADDRESS;

console.log('finished friend gov conf');