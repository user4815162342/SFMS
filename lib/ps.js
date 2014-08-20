
var mypath = require('./path');
var path = require('path');
var fs = require('fs');
var async = require('async');


/**
 * The ps module (for "packet system") contains methods used for directly manipulating single
 * sets of files with the same primary name. The methods here expect a
 * full absolute packet path. This means that 1) The path has been stripped
 * of the descriptor and extension using path.packet or something like
 * it and 2) relative paths have been resolved against process.cwd() or
 * something like that. If this is not done, unexpected results will
 * occur, and since this makes changes to the file system, that could
 * be dangerous.
 * 
 * Note that changes to several files is not an atomic operation, and
 * if an error occurs in the midst of the operation, the files may be
 * put into an unknown state. Therefore, it is recommended that, if an
 * error does occur, that the file system be requeried for it's actual
 * state before continuing operations.
 * 
 * NOTE: Missing functionality:
 * - ps.copy is not implemented, because 1) there is no standard way
 * of copying files in nodejs and 2) even if there were, supporting 
 * recursion would be even more complex (for example, recurse how many
 * steps?). It can be implemented by a programmer using their own file
 * copy function and a glance at the code for ps.rename.
 * - ps.delete is not implemented, simply because I don't want to
 * be the guy who wrote a function that unexpectedly deleted everything
 * on your hard drive.
 * */
var ps = module.exports;

/**
 * Attempts to change the primary name and location of all files in the
 * packet. Both paths should be packet paths, and the full primary name
 * must be included in the new path.
 * 
 * @param p string The packet path to rename
 * @param target string The new packet path
 * @param cb function(error) Called when the rename is completed.
 * */
var ps_rename = ps.rename = function(p,target,cb) {
    ps_readpacket(p,function(err,list) {
        if (err) {
            return cb(err);
        }
        async.eachSeries(list,function(oldName,cb) {
            // find the descriptor and extension.
            var desc = mypath.descname(oldName);
            var ext = path.extname(oldName);
            // Old name is just the base name, so we need the full name.
            oldName = path.join(path.dirname(p),oldName);
            var newName = path.join(path.dirname(target),path.basename(target) + desc + ext);
            fs.rename(oldName,newName,cb)
        },cb);
    });
    
}

/**
 * sync version of ps.rename.
 * 
 * @param p string The packet path to rename
 * @param target string The new packet path
 * */
var ps_renameSync = ps.renameSync = function(p,target) {
    var list = ps_readpacketSync(p);
    list.forEach(function(oldName) {
        // find the descriptor and extension.
        var desc = mypath.descname(oldName);
        var ext = path.extname(oldName);
        // Old name is just the base name, so we need the full name.
        oldName = path.join(path.dirname(p),oldName);
        var newName = path.join(path.dirname(target),path.basename(target) + desc + ext);
        fs.renameSync(oldName,newName)
    });
}

/**
 * retrieves the packet properties (stored in a "_properties.json" 
 * file in the packet). Also needs to handle the blankPacket option,
 * (see readpacket).
 * */
var ps_readProperties = ps.readProperties = function(p,blankPacket,cb) {
    if (typeof blankPacket === "function") {
        cb = blankPacket;
        blankPacket = false;
    }
    ps_readpacket(p,"_properties",".json",blankPacket,function(err,list) {
        if (err) {
            return cb(err);
        }
        switch (list.length) {
            case 0:
                return cb(null,{});
            case 1:
                return fs.readFile(path.join((blankPacket ? p : path.dirname(p)),list[0]),{ encoding: 'utf8' },function(err,data) {
                    cb(err,!err && JSON.parse(data));
                });
            default:
                return cb("Too many entries for properties file.");
        }
    });
}

/**
 * Sync version of ps.readProperties
 * */
var ps_readPropertiesSync = ps.readPropertiesSync = function(p,blankPacket) {
    var list = ps_readpacketSync(p,"_properties",".json",blankPacket);
    switch (list.length) {
        case 0:
            return {};
        case 1:
            return JSON.parse(fs.readFileSync(path.join((blankPacket ? p : path.dirname(p)),list[0]),{ encoding: 'utf8' }));
        default:
            throw new Error("Too many entries for properties file.");
    }
}

/**
 * Attempts to set the property or properties for the specified
 * packet. More than one property can be set at once.
 * */
var ps_saveProperties = ps.saveProperties = function(path,data,blankPacket,cb) {
    if (typeof blankPacket === "function") {
        cb = blankPacket;
        blankPacket = false;
    }
    var filename;
    if (blankPacket) {
        filename = path + "/_properties.json";
    } else {
        filename = path + "_properties.json";
    }
    fs.writeFile(filename,JSON.stringify(data,null,"  "),{ encoding: 'utf8' },cb);
}

/**
 * sync version of ps.saveProperties.
 * */
var ps_savePropertiesSync = ps.savePropertiesSync = function(path,data,blankPacket) {
    var filename;
    if (blankPacket) {
        filename = path + "/_properties.json";
    } else {
        filename = path + "_properties.json";
    }
    fs.writeFileSync(filename,JSON.stringify(data,null,"  "),{ encoding: 'utf8' });
}

/**
 * Returns an object that caches properties in-memory but is signature identical 
 * for read and saveProperties functions, allowing it to easily replace
 * ps in any given function and reduce reading.
 * */
var ps_propertiesCache = ps.PropertiesCache = function() {
    var cache = {};
    
    this.readProperties = function(p,blankPacket,cb) {
        if (!cache.hasOwnProperty(p)) {
            return ps_readProperties(p,blankPacket,function(err,data) {
                if (err) {
                    return cb(err);
                }
                
                cache[p] = data;
                return cb(null,cache[p]);                
            });
        }
        cb(null,cache[p]);
    }
    
    this.readPropertiesSync = function(p,blankPacket) {
        if (!cache.hasOwnProperty(p)) {
            cache[p] = ps_readPropertiesSync(p,blankPacket);
        } 
        return cache[p];
    }
    
     // FUTURE: Should do some validation checking on save, to ensure that the timestamp
     // of the file hasn't changed, raising an error if it has
    this.saveProperties = function(p,data,blankPacket,cb) {
        ps_saveProperties(p,data,blankPacket,function(err) {
            if (err) {
                return cb(err);
            }
            cache[p] = data;
            return cb();
        });
    }
    
    this.savePropertiesSync = function(p,data,blankPacket) {
        ps_savePropertiesSync(p,data,blankPacket);
        cache[p] = data;
    }
    
    this.clear = function() {
        cache = {};
    }
}

var listFilter = function(primaryName,descriptor,extension) {
    var descFilter;
    var extFilter;
    if (typeof descriptor === "function") {
        descFilter = descriptor;
    } else {
        if (typeof descriptor === "undefined") {
            descFilter = function() { return true; }
        } else if (descriptor.test) {
            descFilter = descriptor.test.bind(descriptor);
        } else if ((descriptor === "") || (descriptor === "_")) {
            descFilter = function(desc) { return (desc === "") || (desc === "_") };
        } else {
            descFilter = function(desc) { return desc === descriptor };
        }
    }
    if (typeof extension === "function") {
        extFilter = extension;
    } else {
        if (typeof extension === "undefined") {
            extFilter = function() { return true; }
        } else if (extension.test) {
            extFilter = extension.test.bind(extension);
        } else if ((descriptor === "") || (descriptor === ".")) {
            extFilter = function(ext) { return (ext === "") || (ext === ".") };
        } else {
            extFilter = function(ext) { return ext === extension };
        }
    }
    return function(item) {
        return (mypath.packetname(item) === primaryName) &&
                (descFilter(mypath.descname(item))) &&
                (extFilter(path.extname(item)));
    }
}



/**
 * Gets a list of all existing files in the packet, optionally filtering
 * by descriptor and extension, returning just the base names. Optionally,
 * look for an attachment on a blank packet within the given path,
 * which is expected to be a directory.
 * 
 * A blank descriptor will match both no descriptor
 * and a "_" descriptor, and a blank extension will match both no 
 * extension and a "." extension. However, if non-blank descriptors
 * and extensions are passed, the "_" or "." is required.
 * 
 * Optionally, you can pass functions to the descriptor and extension
 * parameters which return true or false when passed the descriptor or
 * extension for the file. Or, you can just pass RegExp's.
 * 
 * @param p string The packet path to check.
 * @param descriptor The descriptor to check against.
 * @param extension The optional extension to check against.
 * @cb function(error,array of string) Function called when the answer is known.
* */
// FUTURE: You know, this might be a lot simpler if we could just concat the
// extension to the descriptor if we're in need of that.
var ps_readpacket = ps.readpacket = function(p,descriptor,extension,blankPacket,cb) {
    // argument possiblities:
    switch (arguments.length) {
        case 2:
            // string, function => p, cb
            cb = descriptor;
            descriptor = void 0;
            extension = void 0;
            break;
        case 3:
            // string, string, function => p, descriptor, cb
            // string, boolean, function => p, blankPacket, cb
            cb = extension;
            extension = void 0;
            if (typeof descriptor !== "string") {
                blankPacket = descriptor;
                descriptor = void 0;
            }
            break;
        case 4:
            // string, string, string, function => p, descriptor, extension, cb
            // string, string, boolean, function => p, descriptor, blankPacket, cb
            cb = blankPacket;
            if (typeof extension !== "string") {
                blankPacket = extension;
                extension = void 0;
            } else {
                blankPacket = void 0;
            }
            break;
        default:
            break;
    }
    var dirToSearch;
    var primaryName;
    // Special case ... if you want to specifically look for the attachments
    // as blank packets *inside* the directory.
    if (blankPacket) {
        dirToSearch = p;
        primaryName = "";
    } else {
        dirToSearch = path.dirname(p);
        primaryName = mypath.packetname(p);
    }
    fs.readdir(dirToSearch,function(err,list) {
        if (err) {
            return cb(err);
        }
        return cb(null,list.filter(listFilter(primaryName,descriptor,extension)));
    });
}


/**
 * sync version of ps.readpacket
 * 
 * @param p string The packet path to check.
 * @param descriptor The descriptor to check against.
 * @param extension The optional extension to check against.
 * @returns array of string
 * */
var ps_readpacketSync = ps.readpacketSync = function(p,descriptor,extension,blankPacket) {
    var dirToSearch;
    var primaryName;
    // Special case ... if you want to specifically look for the attachments
    // as blank packets *inside* the directory.
    if (blankPacket) {
        dirToSearch = p;
        primaryName = "";
    } else {
        dirToSearch = path.dirname(p);
        primaryName = mypath.packetname(p);
    }
    var list = fs.readdirSync(dirToSearch);
    return list.filter(listFilter(primaryName,descriptor,extension));
}

