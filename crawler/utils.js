var utils = {
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
        var cursor = utils.makeIterator(array);
        var process = function(cursor) {
            var value = cursor.next();
            processFunction(value, function() {
                return process(cursor);
            });
        };
        process(cursor);
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

module.exports = utils;
