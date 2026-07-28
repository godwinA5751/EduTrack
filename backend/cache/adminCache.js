import NodeCache from "node-cache";

const adminCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // clean expired keys every minute
});

export default adminCache;