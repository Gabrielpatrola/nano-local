const fs = require("fs");
const os = require("os");
const { nodeCache } = require("../client/cache");
const { Sentry } = require("../sentry");
const { NODE_STATUS, EXPIRE_1M } = require("../constants");

const getNodeStatus = async () => {
  let nodeStatus = nodeCache.get(NODE_STATUS);
  if (!nodeStatus) {
    try {
      const nodeFolder = process.env.NODE_FOLDER;
      if (!nodeFolder) return { nodeStatus: {} };
      const { size: ledgerSize } = fs.statSync(nodeFolder + "/data.ldb");
      nodeStatus = {
        memory: { free: os.freemem(), total: os.totalmem() },
        cpu: os.cpus(),
        ledgerSize,
        nodeStats: { cpu: 0, memory: 0, elapsed: 0 },
      };
      nodeCache.set(NODE_STATUS, nodeStatus, EXPIRE_1M / 2);
    } catch (err) {
      console.log("Error", err);
      Sentry.captureException(err);
    }
  }
  return { nodeStatus };
};

module.exports = { getNodeStatus, NODE_STATUS };
