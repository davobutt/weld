REPORTER = spec

test:
	@NODE_ENV=test WELD_COVERAGE=1 ./node_modules/.bin/mocha \
	--recursive --require blanket \
	--reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js \

test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter $(REPORTER) --recursive \
	--growl \
	--watch

.PHONY: test test-w