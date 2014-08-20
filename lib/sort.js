var async = require('async');
var ps = require('./ps');
var path = require('path');
var mypath = require('./path');

/**
 * This modules contain some methods which can be used for sorting
 * packets. This isn't completely part of the SFMS specs, but sort
 * order is an attribute mentioned in the specs that should be available
 * in file metadata. And so, these methods will make that easier.
 * 
 * */

/**
 * Takes a list of values, and sorts them asynchronously according to 
 * sortBy and an optional compare functions. This can be used to sort
 * packet names according to their properties. See sortByProperty and
 * sortByDirectoryProperty for more information.
 * 
 * See Array.prototype.sort for an understanding of how array sorts work,
 * and what the compare function does. Unfortunately, that sorting process
 * relies on an asynchronous compare function, which makes it difficult
 * when the criteria you want to sort by must be retrieved asynchronously.
 * This function basically works around that without trying to re-implement
 * the native sort function.
 * 
 * The sortBy function asynchronously takes the value and returns the value
 * of the criteria to sort by in the callback. The compare function 
 * compares the results and returns a value used to sort the list.
 * 
 * Alternatively, the sortBy parameter can be an object containing 
 * 'sortBy' and 'compare' members. 
 * 
 * If no compare function is provided, values will be sorted based on
 * the JavaScript greater than or lesser than operators.
 *  
 * @param list array of string The items to sort
 * @param sort function(packet,cb) A function called to return the value to sort by.
 * @param cb function(err,array of string) A function called with the result once completed.
 * */
var ps_sort = module.exports.sortBy = function(list,sortBy,compare,cb) {
    // NOTE: async.sortBy won't work because we can't control the compare.
    if (arguments.length == 3) {
        // only compare is optional.
        cb = compare;
        compare = void 0;
    }
    if (typeof sortBy === "object") {
        compare = sortBy.compare;
        sortBy = sortBy.sortBy;
    }
    if (typeof compare === "undefined") {
        compare = function(a,b) {
            return a < b ? -1 : a > b ? 1 : 0;
        }
    }
    async.mapSeries(list,function(value,cb) {
        sortBy(value,function(err,criteria) {
            cb(err, {
                value: value,
                criteria: criteria
            });
        });
    },
    function(err,list) {
        if (err) {
            cb(err);
        } else {
            try {
                list.sort(function(a,b) {
                    return compare(a.criteria,b.criteria);
                });
            } catch (e) {
                cb(e);
            }
            cb(null,list.map(function(sorted) {
                return sorted.value;
            }));
        }
    });
}

/**
 * This really isn't much more than the normal Array.prototype.sort,
 * however it's included for consistency with sortAsync, since it
 * allows specifying the sort criteria separately from the compare
 * function. It also forces the default compare to be based on greater
 * than and lesser than operators, instead of a string sort.
 * 
 * Naturally, the sort function here must be a sync version as well.
 * */
var ps_sortBySync = module.exports.sortBySync = function(list,sortBy,compare) {
    if (typeof sortBy === "object") {
        compare = sortBy.compare;
        sortBy = sortBy.sortBy;
    }
    if (typeof compare === "undefined") {
        compare = function(a,b) {
            return a < b ? -1 : a > b ? 1 : 0;
        }
    }

    
    // Doing the map thing here means we only call 'sortBy' 
    // once per item. If we were to call sortBy in the compare
    // function, then it would be called every time the compare
    // needs to compare the item, which could be huge in large lists.
    return list.map(function(value) {
        return {
            value: value,
            criteria: sortBy(value)
        }
    }).sort(function(left,right) {
        return compare(left.criteria,right.criteria);
    }).map(function(sorted) {
        return sorted.value;
    });
}

var getConverter = function(type) {
    switch (type) {
        case "numeric":
            return function(value) {
                switch (typeof value) {
                    case "number":
                        return value;
                    case "string":
                        var result = parseFloat(value);
                        if (isNaN(result)) {
                            return -Infinity;
                        }
                        return result;
                    case "boolean":
                        return value ? 1 : 0;
                    default:
                        return -Infinity;
                }
            }
        case "lexical":
        case "locale":
            return function(value) {
                switch (typeof value) {
                    case "number":
                        return value.toString();
                    case "string":
                        return value;
                    case "boolean":
                        return value ? "true" : "false";
                    default:
                        return "";
                }
            }
        case "date":
            return function() {
                var value = props[propName];
                switch (typeof value) {
                    case "number":
                        return value;;
                    case "string":
                        var result = Date.parse(value);
                        if (isNaN(result)) {
                            return -Infinity;
                        }
                        return result;
                    case "boolean":
                        return value ? 1 : 0;
                    default:
                        return -Infinity;
                }
            }
        default:
            return function(value) {
                return value;
            }
    }
}

var getComparer = function(type,ascending) {
    switch (type) {
        case "locale":
            if (ascending) {
                return function(a,b) {
                    return a.localeCompare(b);
                }
            } else {
                return function(a,b) {
                    return b.localeCompare(a);
                }
            }
            break;
        // Relying on the fact that a default compare for the sort
        // algorithm will compare ascending by '>' and '<', and
        // I've already converted the values appropriately.
        case "numeric":
        case "lexical":
        case "date":
        default:
            if (!ascending) {
                return function(a,b) {
                    return a > b ? -1 : a < b ? 1 : 0;
                }
            } else {
                return function(a,b) {
                    return a < b ? -1 : a > b ? 1 : 0;
                }
            }
            break;
    }
}

/**
 * Creates a sorting function usable in sortBy which expects
 * the list to contain packet paths, such as those returned by path.packets,
 * and sorts them according to a field value in each packet's properties.
 * 
 * The type is an optional parameter used as a hint as to which type of
 * value is expected. This is used for determining how to sort values of
 * another type into the list. Only three values are supported right now.
 * 
 * "numeric": An attempt will be made to convert values to numbers. Strings
 * will be parsed as floats, booleans will become 1 or 0. Objects and 
 * arrays will become NaN. If a value is not a number, the value 
 * Negative Infinity, causing it to be sorted lower than all other 
 * values (to the top if sort is ascending).
 * 
 * "lexical": An attempt will be made to convert values to a string, and
 * will be sorted based on the resulting values. Values which can not
 * be converted to strings (Objects and arrays, for example, despite
 * JavaScript converting them easily) will be given the value "", to
 * cause them to be sorted as lower than all other values (to the top
 * if sort is ascending).
 * 
 * "locale": Similar to "lexical", except String.prototype.localeCompare
 * is used for comparisons.
 * 
 * "date": Basically the same as number, except strings are parsed as
 * Dates instead of floats, and the value of 'getTime' is returned.
 * 
 * If nothing is passed to 'type', values returned will be compared
 * based on the greater than or lesser than operators.
 * 
 * The property cache allows you to do more complex sorting, and reduce
 * the amount of disk reads that need to be made. Just pass an empty object
 * to this parameter, and re-use the same object for further calls to
 * this (or sortByDirectoryProperty). (You can pass the 'ps' object here
 * to avoid caching, but why would you want to?)
 * 
 * @param propName string the property to sort by
 * @param type string a hint as to how to sort the value
 * @param ascending boolean indicate whether to sort ascending (true, default) or sort descending (false).
 * @returns function(packetPath,cb) A struct that can be passed to sortAsync.
 * */
var ps_sortByProperty = module.exports.sortByProperty = function(propName,type,ascending,cache) {
    cache = cache || new ps.PropertiesCache();
    if (typeof ascending === "undefined") {
        ascending = true;
    }
    var result = {};
    
    var convert = getConverter(type);
    
    result.sortBy = function(packet,cb) {
        cache.readProperties(packet,function(err,props) {
            if (err) {
                return cb(err);
            }
            cb(null,convert(props[propName]));
        })
    }
    
    result.compare = getComparer(type,ascending);
    return result;
    
}

/**
 * Creates a sortByAsync version of the results of sortByProperty
 * */
var ps_sortByPropertySync = module.exports.sortByPropertySync = function(propName,type,ascending,cache) {
    cache = cache || new ps.PropertiesCache();
    if (typeof ascending === "undefined") {
        ascending = true;
    }
    var result = {};
    
    var convert = getConverter(type);
    
    result.sortBy = function(packet) {
        return convert(cache.readPropertiesSync(packet)[propName]);
    }
    
    result.compare = getComparer(type,ascending);
    return result;
    
}

var indexOf = function(prop,packet) {
    var result = prop && prop.indexOf && prop.indexOf(mypath.packetname(packet));
    if ((result === -1) || (typeof result === "undefined")) {
        // if it's not in the list, put it at the end.
        return Infinity;
    }
    return result;
}


/**
 * Creates a sortBy function for ps.sortPackets, which sorts the packets
 * according to their position in an index property in the packet's 
 * directory.
 * 
 * The actual value returned is basically just the result of calling
 * indexOf on the specified property. If the value isn't found in the index,
 * or if the property doesn't exist, or doesn't have a function indexOf, 
 * Positive Infinity will be returned, forcing the values to sort to the
 * end of the list when sorting ascending.
 * 
 * @param propName string the property on the directory to use as an index
 * @param ascending boolean Whether the sort should be ascending or descending.
 * @propCache object See sortByProperty for more information.
 * @returns function(packetPath,cb) A function that can be used in ps.sortPackets
 * */
var ps_sortByDirectoryProperty = module.exports.sortByDirectoryProperty = function(propName,ascending,cache) {
    cache = cache || new ps.PropertiesCache();
    if (typeof ascending === "undefined") {
        ascending = true;
    }
    var result = {};
    
    result.sortBy = function(packet,cb) {
        // Have to make sure we get the packet path of the directory,
        // in case the data is stored in a directory with an extension
        // or a descriptor.
        var dirname = mypath.packet(path.dirname(packet));
        packet = mypath.packetname(packet);
        cache.readProperties(dirname,function(err,props) {
            cb(null,indexOf(props[propName],packet));
        });
    }
    
    result.compare = getComparer("numeric",ascending);
    return result;
    
}



/**
 * A function which creates a sync version of the function created by ps.sortByDirectoryProperty
 * */
var ps_sortByDirectoryPropertySync = module.exports.sortByDirectoryPropertySync = function(propName,ascending,cache) {
    cache = cache || new ps.PropertiesCache();
    if (typeof ascending === "undefined") {
        ascending = true;
    }
    var result = {};
    
    result.sortBy = function(packet) {
        // Have to make sure we get the packet name of the directory,
        // in case the data is stored in a directory with an extension
        // or a descriptor.
        var dirname = mypath.packet(path.dirname(packet));
        packet = mypath.packetname(packet);
        return indexOf(cache.readPropertiesSync(dirname)[propName],packet);
    }
    
    result.compare = getComparer("numeric",ascending);
    return result;
}


