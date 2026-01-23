const getVPByBalance = (balanceInFrd = 0, decimals = 9) => {
  return Math.sqrt(balanceInFrd / 10 ** decimals);
}

exports.getVPByBalance = getVPByBalance;