var http = require("http");

var options = {
    "method": "POST",
    "hostname": "127.0.0.1",
    "port": "8081",
    "path": "/debug/eval/file",
    "headers": {
        "content-type": "multipart/form-data; boundary=5483E4810A17204CBFB7A908FF9BA0CB",
        "accept": "application/json",
        //"cookie": "WASID=B26BB747E619C3488A47DD98FF59CD10",
        "user-agent": "wakanda-shell",
        "wakanda-shell": "1"

    }
};

function getWASID(res) {
    var rawHeaders = res.rawHeaders;
    let j = -1;
    for (let i = 0; i < rawHeaders.length; i++)
        if (rawHeaders[i] == "WASID") {
            j = i;
            break;
        }

    if (j != -1) return rawHeaders[j + 1];
    return "";
}


exports.evalOnServer = function (script, cb) {
    console.log(options.headers)
    var body = '--5483E4810A17204CBFB7A908FF9BA0CB\r\n'
    body += 'Content-Disposition: form-data; name="url"\r\n'
    body += 'Content-Type: text/plain;charset=utf-8\r\n'
    body += '\r\n'
    body += 'mem://scratchpad\r\n'
    body += '\r\n'
    body += '--5483E4810A17204CBFB7A908FF9BA0CB\r\n'
    body += 'Content-Disposition: form-data; name="options"\r\n'
    body += 'Content-Type: text/plain;charset=utf-8\r\n'
    body += '\r\n'
    body += '{"persistantContext": true, "disallowDebugging": false}\r\n'
    body += '\r\n'
    body += '--5483E4810A17204CBFB7A908FF9BA0CB\r\n'
    body += 'Content-Disposition: form-data; name="script"\r\n'
    body += 'Content-Type: text/plain;charset=utf-8\r\n'
    body += '\r\n'
    body += script
    body += '\r\n\r\n'
    body += '--5483E4810A17204CBFB7A908FF9BA0CB--'
    var req = http.request(options, function (res) {
        var chunks = [];


        var WASID = getWASID(res);
        if (WASID !== "") {
            options.headers["cookie"] = "WASID=" + WASID;
        }
        res.on("data", function (chunk) {
            chunks.push(chunk);


        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            cb(null, body);
        });
        res.on("error", function (err) {
            cb(err);
        })
    });

    req.write(body);

    req.end();
}