function timestamp() { return new Date().toISOString().replace('T', ' ').replace('Z', ' UTC'); }
function clockTime() { return timestamp().slice(11, 19); }
function elapsedMs(start) { return Number(process.hrtime.bigint() - start) / 1e6; }
module.exports = { timestamp, clockTime, elapsedMs };
