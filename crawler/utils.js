var Mongo = require('./mongoose');

var self = {
    makeIterator: function(array) {
        var nextIndex = 0;
        return {
            next: function() {
                if (nextIndex < array.length) {
                    nextItem = {
                        value: array[nextIndex++],
                        done: false
                    };
                } else {
                    nextItem = {
                        done: true
                    };
                }
                return nextItem;
            }
        };
    },

    forSync: function(array, processFunction) {
        var cursor = self.makeIterator(array);
        var process = function(cursor) {
            var value = cursor.next();
            processFunction(value, function() {
                return process(cursor);
            });
        };
        process(cursor);
    },

    /*
            Return a Stream in order to make it iterable and reducing memory consumption.

            @param ModelObject - The model that will be searched on database.
            @param processFunction - the function that will receive the database document, the function should
                receive as a second parameter the `done` function that has to be called at the end. In case
                of exceptions you must have to pass it into the `done` function.

        */
    paginateDatabaseAsStream: function(ModelObject, processFunction) {
        Mongo.count(ModelObject, function(total) {
            var stream = Mongo.find(ModelObject);
            stream.on('data', function(doc) {
                stream.pause();
                var message = count + ' of ' + total;
                console.log(message.green);
                try {
                    processFunction(doc, function(err) {
                        if (err)
                            console.log(err);
                        stream.resume();
                        count++;
                    });
                } catch (e) {
                    console.log(e);
                    stream.resume();
                    count++;
                }
            });
        });
    },

    flatten: function(data) {
        var result = {};

        function recurse(cur, prop) {
            if (Object(cur) !== cur) {
                result[prop] = cur;
            } else if (Array.isArray(cur)) {
                for (var i = 0, l = cur.length; i < l; i++)
                    recurse(cur[i], prop + '[' + i + ']');
                if (l == 0)
                    result[prop] = [];
            } else {
                var isEmpty = true;
                for (var p in cur) {
                    isEmpty = false;
                    recurse(cur[p], prop ? prop + '.' + p : p);
                }
                if (isEmpty && prop) {
                    var splitProp = prop.split('.').pop();
                    //result[split_prop] = {};
                    result[prop] = {};
                }
            }
        }
        recurse(data, '');
        return result;
    }
}

module.exports = self;
