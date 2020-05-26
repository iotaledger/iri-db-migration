# Broadcast all txs from IRI to its neighbor

This is a tool to migrate IRI databasae to hornet. 

It reads all transactions from the database and broadcasts them to the connected neighbor.  
If you are peered with more than 1 neighbor, it'll broadcast only to the 1st one.

N.B Hornet will not accept transactions of which their timestamp is older than the milestone of the used local snapshot. If the hornet nodes starts from a global snapshot, the timestamp validation will always pass.

## Running
Copy thie script into your iris' `/ixi` directory such that you have `ixi/broadcast-db.ixi/{index.js, package.json}.`. The script will start automatically.

You should see logs such as 

```
05/26 11:34:01.080 [Thread-2] INFO  DB-Migration:38 - Gossiping tx 0 of 26751. Time elapsed: 0 Days 0 Hours 0 Minutes 0 Seconds
05/26 11:34:01.087 [Thread-2] INFO  DB-Migration:38 - Gossiping tx 100 of 26751. Time elapsed: 0 Days 0 Hours 0 Minutes 0 Seconds
05/26 11:34:01.092 [Thread-2] INFO  DB-Migration:38 - Gossiping tx 200 of 26751. Time elapsed: 0 Days 0 Hours 0 Minutes 0 Seconds
05/26 11:34:01.097 [Thread-2] INFO  DB-Migration:38 - Gossiping tx 300 of 26751. Time elapsed: 0 Days 0 Hours 0 Minutes 0 Seconds
05/26 11:34:01.110 [Thread-2] INFO  DB-Migration:38 - Gossiping tx 400 of 26751. Time elapsed: 0 Days 0 Hours 0 Minutes 0 Seconds
```
