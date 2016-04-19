let _canCache;
export         function reset    () {        _canCache = false }
export default function optIn    () {        _canCache = true  }
export         function canCache () { return _canCache         }
