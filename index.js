var System = java.lang.System;

var URL = java.net.URL;
var DataOutputStream = java.io.DataOutputStream;
var BufferedReader = java.io.BufferedReader;
var InputStreamReader = java.io.InputStreamReader;
var ByteArrayInputStream = java.io.ByteArrayInputStream;
var StringBuilder = java.lang.StringBuilder;
var ObjectMapper = com.fasterxml.jackson.databind.ObjectMapper;


var LoggerFactory = org.slf4j.LoggerFactory;
var Thread = java.lang.Thread;
var Collectors = java.util.stream.Collectors;
var SimpleDateFormat = java.text.SimpleDateFormat;
var Date = java.util.Date;
var TimeUnit = java.util.concurrent.TimeUnit;
var StringBuilder = java.lang.StringBuilder;

var iri = com.iota.iri;
var TransactionViewModel = iri.controllers.TransactionViewModel;
var GetTrytesResponse = iri.service.dto.GetTrytesResponse;
var TransactionHash = iri.model.TransactionHash;
var Transaction = iri.model.persistables.Transaction;
var Callable = iri.service.CallableRequest;
var Response = iri.service.dto.IXIResponse;
var ErrorResponse = iri.service.dto.ErrorResponse;

var tangle = IOTA.tangle;
var neighborRouter = IOTA.neighborRouter;
var SLEEP_SECS = 5;
var MAX_ATTEMPTS = 10;
var log = LoggerFactory.getLogger("DB-Migration");

var requestKeys = {
    nodeAddress: '',
    nodeGossipPort: '',
    nodeApiPort: '',
    nodeApiURLScheme: '',
};

function migrateDB(request) {
    var keys = Object.keys(requestKeys);
    // get request body
    keys.forEach(function (key) {
        requestKeys[key] = request[key];
    });

    // validate params
    for(var i = 0; i < keys.length; i++){
        if(!requestKeys[keys[i]]){
            var err = "All properties are required: " + Object.keys(requestKeys);
            log.info(err);
            return ErrorResponse.create(err);
        }
    }

    // ping node api
    var apiUrl = requestKeys.nodeApiURLScheme + "://" + requestKeys.nodeAddress + ":" + requestKeys.nodeApiPort;
    try {
        testAPIConnection(apiUrl);
    } catch (e) {
        return ErrorResponse.create("Cannot connect to api: " + apiUrl);
    }

    // do work in background
    workerThread = new Thread(doWork);
    workerThread.start();

    // return
    return Response.create({
        message: 'Migrating DB... Follow logs on node'
    });
}

function doWork() {
    var tvm = TransactionViewModel.first(tangle);
    var startTime = System.currentTimeMillis();
    var totalTxsCount = TransactionViewModel.getNumberOfStoredTransactions(tangle);
    var i = 0;

    while (tvm != null) {
        var neighborList = neighborRouter.getConnectedNeighbors().values().stream().collect(Collectors.toList());
        if (!isNeighborConnected(neighborList)) {
            continue;
        }
        var now = System.currentTimeMillis();
        var elapsed = now - startTime;
        log.info("Gossiping tx " + tvm.getHash() + ". Time elapsed: " + getDurationBreakdown(elapsed));
        var neighbor = neighborList.get(0);
        neighborRouter.gossipTransactionTo(neighbor, tvm);

        var attempts = 0;
        var apiUrl = requestKeys.nodeApiURLScheme + "://" + requestKeys.nodeAddress + ":" + requestKeys.nodeApiPort;
        while (!isTxOnNeighbor(apiUrl, tvm.getHash()) && attempts < MAX_ATTEMPTS) {
            log.info("Tx " + tvm.getHash() + " not found on neighbor. Attempt " + (attempts++) + " of " + MAX_ATTEMPTS)
            neighborRouter.gossipTransactionTo(neighbor, tvm);
            //wait 1s
            Thread.sleep(1000);
        }
        if (attempts >= MAX_ATTEMPTS) {
            log.info("Timeout trying to gossip tx " + tvm.getHash());
            break;
        }
        i++;
        tvm = tvm.next(tangle);
    }

    log.info("Total txs gossiped: " + i);
    var tvm = TransactionViewModel.first(tangle);
    var transactionPair = tangle.getLatest(Transaction.class, TransactionHash.class);
    var rocksDbTVMHash = transactionPair.low;
    var totalTxsCount = TransactionViewModel.getNumberOfStoredTransactions(tangle);
    log.info("Rocks DB last tx: " + rocksDbTVMHash);
    log.info("Rocks DB tx count: " + totalTxsCount);
    log.info("done"); 
}

function isNeighborConnected(neighborList) {
    var neighborsStr = "";
    for (var i = 0; i < neighborList.size(); i++) {
        var n = neighborList.get(i);
        var address = n.hostAddress;
        var gossip = n.remoteServerSocketPort;
        neighborsStr += address + ":" + gossip;
        if (requestKeys.nodeAddress == address && requestKeys.nodeGossipPort == gossip) {
            return true;
        }
    }

    log.info("Waiting for specified neighbor");
    log.info("Connected neighbors: " + neighborsStr);
    Thread.sleep(SLEEP_SECS * 1000);
    return false;
}


function getDurationBreakdown(millis) {
    var days = TimeUnit.MILLISECONDS.toDays(millis);
    millis -= TimeUnit.DAYS.toMillis(days);
    var hours = TimeUnit.MILLISECONDS.toHours(millis);
    millis -= TimeUnit.HOURS.toMillis(hours);
    var minutes = TimeUnit.MILLISECONDS.toMinutes(millis);
    millis -= TimeUnit.MINUTES.toMillis(minutes);
    var seconds = TimeUnit.MILLISECONDS.toSeconds(millis);

    var sb = new StringBuilder(64);
    sb.append(days);
    sb.append(" Days ");
    sb.append(hours);
    sb.append(" Hours ");
    sb.append(minutes);
    sb.append(" Minutes ");
    sb.append(seconds);
    sb.append(" Seconds");

    return (sb.toString());
}

function testAPIConnection(url) {
    var httpClient = new URL(url).openConnection();

    //add reuqest header
    httpClient.setRequestMethod("POST");
    httpClient.setRequestProperty("Content-Type", "application/json");
    httpClient.setRequestProperty("X-IOTA-API-Version", "1");

    var urlParameters = "{\n\"command\": \"getNodeInfo\"\n}";
    // Send post request
    httpClient.setDoOutput(true);
    var wr = new DataOutputStream(httpClient.getOutputStream())
    wr.writeBytes(urlParameters);
    wr.flush();

    var responseCode = httpClient.getResponseCode();
    log.info("response code: " + responseCode);
    return responseCode == 200;
}

function isTxOnNeighbor(url, txHash) {
    var httpClient = new URL(url).openConnection();

    //add reuqest header
    httpClient.setRequestMethod("POST");
    httpClient.setRequestProperty("Content-Type", "application/json");
    httpClient.setRequestProperty("X-IOTA-API-Version", "1");

    var urlParameters = "{\n\"command\": \"getTrytes\",\n\"hashes\": [\"" + txHash + "\"]\n}";

    // Send post request
    httpClient.setDoOutput(true);
    var wr = new DataOutputStream(httpClient.getOutputStream())
    wr.writeBytes(urlParameters);
    wr.flush();

    var inBuf = new BufferedReader(new InputStreamReader(httpClient.getInputStream()))
    var line;
    var response = new StringBuilder();

    while ((line = inBuf.readLine()) != null) {
        response.append(line);
    }

    var mapper = new ObjectMapper();
    var res = mapper.readValue(response.toString(), GetTrytesResponse.class);
    return res.trytes.length > 0;
}

API.put("start", new Callable({ call: migrateDB }))