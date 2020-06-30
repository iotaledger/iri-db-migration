# Broadcast all txs from IRI to a specified neighbor

This is a tool to migrate IRI database history to another node. 
It reads all transactions from the database and broadcasts them to the connected neighbor.  

N.B `Hornet` will not accept transactions of which their timestamp is older than the milestone of the used local snapshot. If the hornet nodes starts from a global snapshot, the timestamp validation will always pass.

## Running
Copy thie script into your iris' `/ixi` directory such that you have `ixi/migration.ixi/{index.js, package.json}.`.  Your node may be running at this time, and it will hot-load the script. After you've looaded the script, and with a running iRI node, run the following command to start the migration.

N.B **Change these paramters below to suit your needs**

```
curl http://127.0.0.1:14265 -X POST \
-H 'X-IOTA-API-Version: 1' \
-H 'Content-Type: application/json' \
-d '{
    "command": "migration.start",
    "nodeAddress":"127.0.0.1",
    "nodeGossipPort":"15601",
    "nodeApiPort":"14266",
    "nodeApiURLScheme":"http"
}
```

### Request parameters

N.B All parameters are required.

- `nodeAddress`: The IP address of the node to migrate to: e.g `127.0.0.1`
- `nodeGossipPort`: The gossip port of the node to migrate to. e.g `15601`
- `nodeApiPort`: The api port of the node to migrate to. e.g `14266`
- `nodeApiURLScheme`: The url scheme of the node to migrate to. e.g `http`

You will receive response like: 
```
{
    "ixi": {
        "message": "Migrating DB... Follow logs on node"
    },
    "duration": 176
}
```

Now, following up on your IRI node, you should see logs such as 

```
06/30 15:52:40.168 [Thread-3] INFO  DB-Migration:89 - Gossiping tx RLCFNAJAHWUQCKMTOIONWLCWFPZGHKCDPZMMCTSVXFIMMRUMBMUVFPHOCWYATEWWW999GUBYIQPQZ9999. Time elapsed: 0 Days 0 Hours 0 Minutes 0 Seconds
06/30 15:52:40.171 [Thread-3] INFO  DB-Migration:89 - Gossiping tx RLGUNZARYVGLCWFZYFUNLZIF9JEHDDASHPSLXHEVADIQUPDW9IUXCCJIEPWSMYIAWULMHKPZGCBMA9999. Time elapsed: 0 Days 0 Hours 0 Minutes 0 Seconds
...
6/30 15:52:41.174 [Thread-3] INFO  DB-Migration:89 - Gossiping tx Z9GAFGIONBGCSFNVBFNISYPUBXMOJDZICUZNDA99HWFF99PCFVCZPZB9JQWKFMZQUKUQFPJXDMEK99999. Time elapsed: 0 Days 0 Hours 0 Minutes 1 Seconds
06/30 15:52:41.180 [Thread-3] INFO  DB-Migration:89 - Gossiping tx ZRZQT9DGRJVURWZLKWPTKPDNEHGHJEGNEIHQJC9EUTHFKHQW9UQIVIDRJTRRILYMGYJSAHMBSCWFZ9999. Time elapsed: 0 Days 0 Hours 0 Minutes 1 Seconds
06/30 15:52:41.183 [Thread-3] INFO  DB-Migration:89 - Gossiping tx ZRQLLQBJQAMESGRWXGTBKVMTNRKVORJIQBZRMYSSSDMFWTST9VBZYS9QHX9JRHXKKGYDDKSTLUIAUO999. Time elapsed: 0 Days 0 Hours 0 Minutes 1 Seconds
06/30 15:52:41.189 [Thread-3] INFO  DB-Migration:109 - Total txs gossiped: 428
06/30 15:52:41.200 [Thread-3] INFO  DB-Migration:114 - Rocks DB last tx: ZRQLLQBJQAMESGRWXGTBKVMTNRKVORJIQBZRMYSSSDMFWTST9VBZYS9QHX9JRHXKKGYDDKSTLUIAUO999
06/30 15:52:41.201 [Thread-3] INFO  DB-Migration:115 - Rocks DB tx count: 428
06/30 15:52:41.201 [Thread-3] INFO  DB-Migration:116 - done
```