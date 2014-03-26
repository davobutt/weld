# Weld

A proxy server service which can be used for integration testing written in [node.js][node]

Weld has a RESTful api which can be used to programmatically set up, interogate and tear down proxy servers. It comes with a middleware layer which parses and stores JSON. By default this cache is in redis. Different middleware applications can be written and added in the conventional way using [connect](http://www.senchalabs.org/connect/). 

  [node]: https://github.com/joyent/node

## Build Status

[![Build Status](https://travis-ci.org/gubber/weld.svg?branch=master)](https://travis-ci.org/gubber/weld) [![Coverage Status](https://coveralls.io/repos/gubber/weld/badge.png)](https://coveralls.io/r/gubber/weld)

## Integration testing with weld

### Install

```
git clone git@github.com:gubber/weld.git
cd weld
node app
```

From here on in everything can be done with the [API](#api), the admin interface, or client libraries

### API

#### Create a proxy server

```
POST weldserver.com:port/api/server/ServerName

{
	port: 49100,
	target: 'http://targetserver.com:1234'
}
```

#### Check status

```
GET weldserver.com:port/api/server/ServerName
```