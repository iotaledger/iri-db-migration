var System = java.lang.System;
var LoggerFactory = org.slf4j.LoggerFactory;
var Thread = java.lang.Thread;
var Collectors = java.util.stream.Collectors;
var SimpleDateFormat = java.text.SimpleDateFormat;
var Date = java.util.Date;
var TimeUnit = java.util.concurrent.TimeUnit;
var StringBuilder = java.lang.StringBuilder;

var iri = com.iota.iri;
var TransactionViewModel = iri.controllers.TransactionViewModel;
var tangle = IOTA.tangle;
var SLEEP_SECS = 5;


var log = LoggerFactory.getLogger("DB-Migration");

var neighborRouter = IOTA.neighborRouter;
var tvm = TransactionViewModel.first(tangle);
var startTime = System.currentTimeMillis();
var totalTxsCount = TransactionViewModel.getNumberOfStoredTransactions(tangle);
var i = 0;

while (tvm != null) {
    var neighborList = neighborRouter.getConnectedNeighbors().values().stream().collect(Collectors.toList());
    if (neighborList.size() == 0) {
        //neighbor is not connected. Wait a bit
        log.info("Waiting for neighbor");
        Thread.sleep(SLEEP_SECS * 1000);
        continue;
    }
    if (neighborList.size > 1) {
        log.info("Broadcasting only to the first neighbor");
    }
    if (i % 100 == 0) {
        var now = System.currentTimeMillis();
        var elapsed = now - startTime;
        log.info("Gossiping tx " + i + " of " + totalTxsCount + ". Time elapsed: " + getDurationBreakdown(elapsed));
    }
    var neighbor = neighborList.get(0);
    neighborRouter.gossipTransactionTo(neighbor, tvm);
    tvm = tvm.next(tangle);
    i++;
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
