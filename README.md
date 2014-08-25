CNES web scraper
================

You have to use nodejs version 0.10.x

Download the dependencies:
	
	npm install

# How to debug:
	
	node-inspector
	node --debug-brk crawler.js

Then, go to http://localhost:8080/debug?port=5858

# How to run:
	
	node --max-old-space-size=8192 --expose-gc crawler.js