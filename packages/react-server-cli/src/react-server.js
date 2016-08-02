import callerDependency from "./callerDependency";

// We need react-server to be a singleton, and we want our caller's copy.
module.exports = require(callerDependency("react-server"));
