PROJECT_ROOT=$(dir $(realpath $(firstword $(MAKEFILE_LIST))))
GENERATOR_DIR=$(PROJECT_ROOT)generator
SCRAPER_DIR=$(PROJECT_ROOT)scraper
TRAINER_DIR=$(PROJECT_ROOT)trainer

.ONESHELL:
all: dependencies scrape generate train

dependencies:
	cd $(GENERATOR_DIR)
	@echo Installing generator dependencies..
	npm install
	cd $(SCRAPER_DIR)
	@echo Installing scraper dependencies..
	npm install
	cd $(TRAINER_DIR)
	@echo Installing trainer dependencies..
	virtualenv env
	source env/bin/activate
	pip install -r requirements.txt
	deactivate
	

scrape: 
	@echo Scraping fonts data from 1001fonts.com...
	cd $(SCRAPER_DIR)
	node ./scraper.js
	node ./analyzer.js
	node ./downloader.js

generate:
	@echo Generating font images...
	cd $(TRAINER_DIR)
	node ./index.js

train:
	@echo Training neural network models...
	cd $(TRAINER_DIR)
	source env/bin/activate
	python train.py
	deactivate
	
