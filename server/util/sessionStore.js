"use strict";
/**
 * Session storage in mysql database
 */
/*!
 * Connect - Redis
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

let pool = require('./../db/pool')

module.exports = function (session) {
    const Store = session.Store

    // All callbacks should have a noop if none provided for compatibility
    // with the most Redis clients.
    const noop = () => {}

    class MyStore extends Store {
        constructor(options = {}) {
            super(options)
            if (!options.client) {
                throw new Error('A client must be directly provided to the MyStore')
            }

            // Options
            this.prefix = options.prefix == null ? 'sess:' : options.prefix
            this.scanCount = Number(options.scanCount) || 100
            this.serializer = options.serializer || JSON
            this.client = options.client
            this.ttl = options.ttl || 86400 // One day in seconds.
            this.disableTouch = options.disableTouch || false
        }

        get(sid, cb = noop) {
            let key = this.prefix + sid
            this.client.query("select session from sessions where sid = ?;", [key], (err, data, fields) => {
                if (err) return cb(err)
                if (data.length == 0) return cb()

                let result
                try {
                    result = this.serializer.parse(data[0].session)
                } catch (err) {
                    return cb(err)
                }
                return cb(null, result)
            })
        }

        set(sid, sess, cb = noop) {
            // Session id
            let args = [this.prefix + sid]

            //  Session serialisation
            let value
            try {
                value = this.serializer.stringify(sess)
            } catch (er) {
                return cb(er)
            }

            let userid
            try {
                if (sess.user && sess.user.id) {
                    userid = sess.user.id
                } else userid = null
            } catch (err) {
                return cb(er)
            }

            let expires = this._getTTL(sess);


            this.client.query(
                "REPLACE INTO sessions (sid, session, accountId, expires) VALUES (?,?,?,?);",
                [args, value, userid, expires], (err, data, fields) => {
                    if (err) cb(err)
                    else {
                        cb();
                    }
                })
        }

        touch(sid, sess, cb = noop) {
            if (this.disableTouch) return cb()

            let key = this.prefix + sid
            this.client.expire(key, this._getTTL(sess), (err, ret) => {
                if (err) return cb(err)
                if (ret !== 1) return cb(null, 'EXPIRED')
                cb(null, 'OK')
            })
        }

        destroy(sid, cb = noop) {
            let key = this.prefix + sid
            this.client.query("delete from sessions where sid=?; ", [sid])
        }

        // Removes everything from the store
        clear(cb = noop) {
            this.client.query("truncate table sessions;", [], (err) => {
                if (err) {
                    cb(err)
                } else {
                    cb()
                }
            })
        }

        length(cb = noop) {
            this.client.query("select")
            this._getAllKeys((err, keys) => {
                if (err) return cb(err)
                return cb(null, keys.length)
            })
        }

        ids(cb = noop) {
            let prefixLen = this.prefix.length

            this._getAllKeys((err, keys) => {
                if (err) return cb(err)
                keys = keys.map(key => key.substr(prefixLen))
                return cb(null, keys)
            })
        }

        all(cb = noop) {
            let prefixLen = this.prefix.length

            this._getAllKeys((err, keys) => {
                if (err) return cb(err)
                if (keys.length === 0) return cb(null, [])

                this.client.mget(keys, (err, sessions) => {
                    if (err) return cb(err)

                    let result
                    try {
                        result = sessions.map((data, index) => {
                            data = this.serializer.parse(data)
                            data.id = keys[index].substr(prefixLen)
                            return data
                        })
                    } catch (e) {
                        err = e
                    }
                    return cb(err, result)
                })
            })
        }

        // Get expiration date
        _getTTL(sess) {
            let ttl
            if (sess && sess.cookie && sess.cookie.expires) {
                expires = new Date((Date.now() + sess.cookie.expires))
            } else {
                ttl = new Date(Date.now() + this.ttl)
            }
            return ttl
        }

        _getAllKeys(cb = noop) {
            let pattern = this.prefix + '*'
            this._scanKeys({}, 0, pattern, this.scanCount, cb)
        }

        _scanKeys(keys = {}, cursor, pattern, count, cb = noop) {
            let args = [cursor, 'match', pattern, 'count', count]
            this.client.scan(args, (err, data) => {
                if (err) return cb(err)

                let [nextCursorId, scanKeys] = data
                for (let key of scanKeys) {
                    keys[key] = true
                }

                // This can be a string or a number. We check both.
                if (Number(nextCursorId) !== 0) {
                    return this._scanKeys(keys, nextCursorId, pattern, count, cb)
                }

                cb(null, Object.keys(keys))
            })
        }
    }

    return MyStore
}