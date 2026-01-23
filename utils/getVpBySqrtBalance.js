const getVPBySqrtBalance = (sqrtFrdBalance = 0, decimals = 9) => {
  return sqrtFrdBalance / (10 ** (decimals / 2));
}

exports.getVPBySqrtBalance = getVPBySqrtBalance;