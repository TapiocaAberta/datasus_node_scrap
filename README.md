CNES web scraper
================

You have to use nodejs version 0.10.x

Download the dependencies:
	
	npm install

Install MongoDB: 

	sudo apt-get install mongodb

# How to debug:
	
	node-inspector
	node --debug-brk crawler.js

Then, go to http://localhost:8080/debug?port=5858

# How to run:
	
	node --max-old-space-size=8192 --expose-gc crawler.js

# Limitations:

The script consumes a lot of memory in order of their execution time. On the first minute of their execution, about 150 registers are downloaded, netherless, this measure is going down in order of the memory consumption.

A real fixes to this problem is to study how the V8 garbage collector works, and pay attention to remove the closure variables to improve less memory consumption.

So, an work around to this problem is to kill and reopen the script in determined cycle of time using CRON. To do that, run the follow instructions:

create a file with the following content on `/etc/cron.d/crawler` (without the extension '.sh')

	#!/bin/sh
	pkill node
	cd "<PATH_OF_SOURCE>/node_scrap/"
	<YOUR_NODE_PATH>/node --max-old-space-size=8192 --expose-gc crawler.js > /tmp/crawler.log &

run:

	crontab -e 

add this on the last line of the file:

	*/1 * * * * /bin/sh /etc/cron.d/crawler

This will run automatically the script `/etc/cron.d/crawler` on the interval of 1 in 1 minute, It would be kill and re-execute the crawler script.

# How to export

## To CSV: 

	cd output
	mongoexport --db cnes --collection entities --csv --fieldFile entities_fields.txt --out entities.csv

## To Database dump:

to generate the dump:

	mongodump -d cnes -o output

to restore:
	
	mongorestore cnes