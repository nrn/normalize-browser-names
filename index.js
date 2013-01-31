
/// user allowed string name -> normalized name
var names = {
    ie : 'iexplore',
    iexplore : 'iexplore',
    iexplorer : 'iexplore',
    explorer : 'iexplore',
    explore : 'iexplore',
    'internet explorer' : 'iexplore',
    internet_explorer : 'iexplore',
    internetexplorer : 'iexplore',
    safari : 'safari',
    chrome : 'chrome',
    firefox : 'firefox',
    ff : 'firefox',
    opera : 'opera',
    '*': [ 'chrome', 'firefox', 'opera', 'safari', 'iexplore' ]
};

/// normalize browser name from user input
function normalized_name(name) {
    return names[name.toLowerCase()];
};

/// return if str is a numeric value
function is_numeric(str) {
    return !isNaN(str - 0);
};

/// turn array of versions as strings into numbers
function numeric(versions) {
    return versions.map(function(val) {
        if (is_numeric(val)) {
            return val - 0;
        };

        return val;
    });
};

/// given an array of versions, return the latest numeric version
/// assumes array of versions is already sorted
function latest(versions) {
    if (!versions || versions.length === 0) {
        throw new Error('\'' + versions + '\' version requires suppored browsers argument');
    }

    return versions.reduce(function(prev, curr) {
        if (!is_numeric(curr)) {
            return prev;
        }

        return curr - 0;
    }, versions[0]);
};

module.exports = function normalize (browsers, supported) {
    if (Array.isArray(browsers)) {
        return normalize(browsers.reduce(function (acc, bv) {
            // { "ie/8", "ie8" } -> [ "ie", "8" ]
            var s = String(bv).split(/\/|(\.\.)|(\d+(?:\.\d+)*)/).filter(Boolean);
            var b = s[0], v = s[1];
            var end = s[3];

            var normb = normalized_name(b);

            if (Array.isArray(normb)) {
                normb.forEach(resolveV);
            } else {
                resolveV(normb);
            }

            function resolveV (b) {
                var version = v;

                // if user wants latest stable version
                if (version === 'latest') {
                    version = latest(supported[b]);
                }

                // no array yet, initialize empty
                if (!acc[b]) acc[b] = [];

                // user wanted a range of versions
                if (s[2] === '..') {
                    var versions = numeric(supported[b]);

                    if (end === 'latest') {
                        end = latest(versions);
                    }

                    version = is_numeric(version) ? version - 0 : version;
                    end = is_numeric(end) ? end - 0 : end;

                    var start_idx = versions.indexOf(version);
                    var end_idx = versions.indexOf(end);

                    if (end_idx < start_idx) {
                        throw new Error('range must be increasing order');
                    }
                    else if (start_idx < 0 || end_idx < 0) {
                        throw new Error('invalid range');
                    }

                    acc[b].push.apply(acc[b], versions.slice(start_idx, end_idx + 1));
                }
                else if (version) {
                    acc[b].push(version);
                }
            }

            return acc;
        }, {}));
    }
    
    return Object.keys(browsers).reduce(function (acc, key) {
        var vs = Array.isArray(browsers[key])
            ? browsers[key] : [ browsers[key] ]
        ;
        
        var b = normalized_name(key);

        if (Array.isArray(b)) {
            b.forEach(resolveV);
        } else {
            resolveV(b);
        }

        function resolveV (name) {
            if (!acc[name]) acc[name] = [];
            if (name) acc[name] = acc[name].concat(vs.map(function (v) {
                if (v === 'latest') v = latest(supported[name]);
                if (typeof v === 'number' || /^\d+(?:\.\d*)?/.test(v)) {
                    if (/\.$/.test(v)) return v + '0';
                    if (!/\./.test(v)) return v + '.0';
                    return String(v);
                } else return String(v);
            }));
        }
        return acc;
    }, {});
}
