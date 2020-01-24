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
            this.client.query("select expires,session from sessions where sid = ?;", [sid], (err, data, fields) => {
                if (err) return cb(err)
                if (data.length == 0) return cb(null, null)

                var now = Math.round(Date.now() / 1000);
                if (data[0].expires < now) {
                    // Session has expired.
                    return cb(null, null);
                }

                let result
                try {
                    result = this.serializer.parse(data[0].session)
                } catch (err) {
                    return cb(err)
                }

                if(data[0].expires)
                return cb(null, result)
            })
        }

        set(sid, sess, cb = noop) {

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
                [sid, value, userid, expires], (err, data, fields) => {
                    if (err) cb(err)
                    else {
                        cb();
                    }
                })
        }

        touch(sid, sess, cb = noop) {
            if (this.disableTouch) return cb()

            var expires = this._getTTL(sess);
            this.client.query("UPDATE sessions SET expires = ? WHERE sid = ?", [expires,sid], (err, data)=>{
                if (err) return cb(err);
                cb() // Success;
            })

        }

        destroy(sid, cb = noop) {
            this.client.query("delete from sessions where sid=?; ", [sid], (err, data)=>{
                if (err) return cb(err)
                cb()
            })
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
            this.client.query("SELECT COUNT(*) as count FROM sessions", (err, data) => {
                if (err) {
                    cb(err);
                } else {
                    cb(null, (data[0].count));
                }
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
            let now = new Date(Date.now());

            // Get all not expired sessions
            this.client.query("select sid,  from sessions where expires > ?", [now], (err, data, fields) => {
                if (err) return cb(err);

                let result;
                try {
                    result = data.map(function (row) {
                        return {
                            id: row.sid,
                            data: this.serializer.parse(row.session),
                        }
                    })

                } catch (e) {
                    err = e;
                }
                cb(err, result)
            })
        }

        // Get expiration date
        _getTTL(sess) {
            let expires;

            if (sess && sess.cookie && sess.cookie.expires) {
                expires = sess.cookie.expires
            } else {
                expires = new Date(Date.now() + this.ttl)
            }

            if (!(expires instanceof Date)) {
                expires = new Date(expires);
            }
    
            // Use whole seconds here; not milliseconds.
            expires = Math.round(expires.getTime() / 1000);

            return expires
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