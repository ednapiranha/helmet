/*
## Content-Security-Policy 

options are a dictionary that can include
{ 
    reportOnly: true, // Enable report only header
}

*/

var fs = require('fs');

module.exports = function (options) {
    var header = 'X-Content-Security-Policy';
    var header2 = 'X-WebKit-CSP';
    if (options) {
        if (options.reportOnly === true) {
            header = 'X-Content-Security-Policy-Report-Only';
            header2 = 'X-WebKit-CSP-Report-Only';
        }
    }

    return function (req, res, next)  {
        res.header(header, toString());
        res.header(header2, toString());
        next();
    };
};

var csp = {
        "default-src": ["'self'"]
};

/* Mass set one or more policies
Format should be something like
{
    default-src: ["'self'"],
    image-src: ["static.andyet.net"]
}

Will also eat the output of toJSON()
*/
module.exports.policy = function (policy) {
    if (policy) {
        csp = {};
            for (var src in policy) {
                if (policy.hasOwnProperty(src)) {
                    add(src, policy[src]);        
                }
            }
    }
};

// report-url helper function
module.exports.reportTo = function (url) {
    add('report-uri', url);
};

module.exports.reporter = function (app, username, password) {
    app.post('/csp-violation', function (req, res) {
        console.log(req.body);
        res.send("");
    });

    app.get('/csp-violation', express.basicAuth(username, password), function (req, res) {
        res.send("woot");
    });
};

var add = module.exports.add = function (sourceType, source) {
    if (!csp.hasOwnProperty(sourceType)) {
        csp[sourceType] = [];
    }
    if (typeof(source) == "string") {
        // Single Entry
        if (csp[sourceType].indexOf(source) === -1) {
            csp[sourceType].push(source);
        }
    } else if (Array.isArray(source)) {
        // Array?
        for (var i in source) {
            if (csp[sourceType].indexOf(source[i]) === -1) {
                csp[sourceType].push(source[i]);
            }
        }
    }
};

function toString() {
    var policy = csp;
    var policyHeader = "";
    for (var src in policy) {
        var srcStr = "";
        if (policy.hasOwnProperty(src)) {
            srcStr += src;
            for (var i in policy[src]) {
                srcStr += " " + policy[src][i];
            }
            policyHeader += srcStr + ";";
        }
    }
    return policyHeader;
}

exports.policyTool = function () {
};

var violations = {};
module.exports.violationServer = function (app, options) {
    var options = options || {};
    var max_length = options.max_length || 100;
    var username = options.username || '';
    var password = options.password || '';

    app.get('/helmet/policy', function (req, res) {
        res.render(__dirname + '/../views/policyTool.jade', {pretty: true});
    });

    app.get('/helmet/policy.json', function (req, res) {
        res.send(toJSON());
    });

    app.get('/helmet/js/helmet.js', function (req, res) {
        fs.readFile(__dirname + '/../js/helmet.js', function (err, data) {
            if (err) {
                res.send('ahhh', 500);
            } else {
                res.send(data);
            }
        });
    });

    app.post('/helmet/violation', function (req, res) {
        if (req.body) {
            var body = JSON.stringify(req.body);
            if (violations[body]) {
                // increase the counter for the event
                violations[body]++; 
            } else {
                if (Object.keys(violations).length < max_length) {
                    violations[body] = 1;
                } else {
                    console.log("Violation max length met, not pushing new events");
                }
            }
        }
        res.send('');
    });

    app.get('/helmet/violations', function (req, res) {
        console.log(violations);
        res.render(__dirname + '/../views/violations', {violations: violations});
    });
};



// Wonder what this function does. Feed the output of toJSON to policy() to re-inflate
var toJSON = module.exports.toJSON = function () {
    return JSON.stringify(csp);
};

module.exports.toJS = function () {
    return csp;
};
