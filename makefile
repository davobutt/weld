REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter $(REPORTER) --recursive --require blanket \

test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter $(REPORTER) --recursive \
	--growl \
	--watch

.PHONY: test test-w