var assert = require('assert');
var path = require('path');
var cp = require('child_process');
var os = require('os');
var fs = require('fs');

var pkg = require("../index");
var e = require('../lib/expressions');

// Someday, I've got to release an NPM module for this code I keep rewriting.
var run = function(cmd, args, cb) {

    options = {
        stdio: 'inherit'
    }

    console.log("> " + cmd + " " + args.join(" "));
    var child = cp.spawn(cmd,args,options);
    child.on('error',cb);
    child.on('close',function(code, signal) {
        if ((code === 0) && (!signal)) {
            return cb(null);
        } 
        if (code !== 0) {
            return cb(new Error("Process exited with code " + code));
        }
        if (signal !== "") {
            return cb(new Error("Process killed with signal " + signal));
        }
    });
    return child;
}

module.exports.testPathPackage = function(t) {
    
    // NOTE: Much of this is taken from node's test of the path function itself,
    // especially the 'base' function from the 'basename' tests. So, if
    // it looks familiar, it is.

    var isWindows = process.platform === 'win32';
    
    var testPath = function(p,base,desc) {
        assert.equal(pkg.path.packetname(p),base);
        assert.equal(pkg.path.descname(p),desc);
    }
    
    // should handle extensions appropriately
    testPath('basename.ext','basename','');
    testPath('','','');
    testPath('/dir/basename.ext','basename','');
    testPath('/basename.ext','basename','');
    testPath('basename.ext/', 'basename','');
    testPath('basename.ext//','basename','');

    if (isWindows) {
      testPath('basename.ext','basename','');
      testPath('\\dir\\basename.ext','basename','');
      testPath('\\basename.ext','basename','');
      testPath('basename.ext\\','basename','');
      testPath('basename.ext\\\\','basename','');

    } else {
      // On unix a backslash is just treated as any other character.
      testPath('\\dir\\basename.ext','\\dir\\basename','');
      testPath('\\basename.ext', '\\basename','');
      testPath('basename.ext\\', 'basename','');
      testPath('basename.ext\\\\', 'basename','');
    }

    // POSIX filenames may include control characters
    // c.f. http://www.dwheeler.com/essays/fixing-unix-linux-filenames.html
    if (!isWindows) {
      var controlCharFilename = 'Icon' + String.fromCharCode(13);
      testPath('/a/b/' + controlCharFilename,controlCharFilename,'');
    }
    
    // but it should also work with descriptors.
    testPath('basename_desc.ext','basename','_desc');
    testPath('','','');
    testPath('/dir/basename_desc.ext','basename','_desc');
    testPath('/basename_desc.ext','basename','_desc');
    testPath('basename_desc.ext/', 'basename','_desc');
    testPath('basename_desc.ext//','basename','_desc');

    if (isWindows) {
      testPath('basename_desc.ext','basename','_desc');
      testPath('\\dir\\basename_desc.ext','basename','_desc');
      testPath('\\basename_desc.ext','basename','_desc');
      testPath('basename_desc.ext\\','basename','_desc');
      testPath('basename_desc.ext\\\\','basename','_desc');

    } else {
      // On unix a backslash is just treated as any other character.
      testPath('\\dir\\basename_desc.ext','\\dir\\basename','_desc');
      testPath('\\basename_desc.ext', '\\basename','_desc');
      testPath('basename_desc.ext\\', 'basename','_desc');
      testPath('basename_desc.ext\\\\', 'basename','_desc');
    }

    // POSIX filenames may include control characters
    // c.f. http://www.dwheeler.com/essays/fixing-unix-linux-filenames.html
    if (!isWindows) {
      var controlCharFilename = 'Icon' + String.fromCharCode(13);
      testPath('/a/b/' + controlCharFilename + "_desc",controlCharFilename,'_desc');
    }
    

    // Now, try some descriptor patterns

    testPath('/path/to/file', 'file','');
    testPath('/path/to/file_desc','file','_desc');
    testPath('/path_to/file_desc','file', '_desc');
    testPath('/path_to/file','file','');
    testPath('/path_to/_file','','_file');
    testPath('/path_to/.file_desc','.file','_desc');
    testPath('/path/to/f_desc','f','_desc');
    testPath('/path/to/._desc','.','_desc');
    testPath('file', 'file', '');
    testPath('file_desc', 'file', '_desc');
    testPath('.file', '.file', '');
    testPath('.file_desc','.file', '_desc');
    testPath('/file','file', '');
    testPath('/file_desc','file', '_desc');
    testPath('/.file','.file', '');
    testPath('/.file_desc','.file', '_desc');
    testPath('.path/file_desc','file', '_desc');
    testPath('file_desc_desc','file_desc', '_desc');
    testPath('file_','file', '_');
    testPath('.','.', '');
    testPath('./','.', '');
    testPath('.file_desc','.file', '_desc');
    testPath('.file','.file', '');
    testPath('.file_','.file', '_');
    testPath('.file__','.file_', '_');
    testPath('..','..', '');
    testPath('../','..', '');
    testPath('._file_desc','._file', '_desc');
    testPath('._file','.', '_file');
    testPath('._file_','._file', '_');
    testPath('._file__','._file_', '_');
    testPath('.__','._', '_');
    testPath('.__desc','._', '_desc');
    testPath('.___','.__', '_');
    testPath('file_desc/','file', '_desc');
    testPath('file_desc//','file', '_desc');
    testPath('file/','file', '');
    testPath('file//','file', '');
    testPath('file_/','file', '_');
    testPath('file_//','file', '_');

    if (isWindows) {
      // On windows, backspace is a path separator.
      testPath('.\\','.', '');
      testPath('..\\','..', '');
      testPath('file_desc\\','file', '_desc');
      testPath('file_desc\\\\','file', '_desc');
      testPath('file\\','file', '');
      testPath('file\\\\','file', '');
      testPath('file_\\','file', '_');
      testPath('file_\\\\','file', '_');

    } else {
      // On unix, backspace is a valid name component like any other character.
      testPath('.\\','.\\', '');
      testPath('._\\','.', '_\\');
      testPath('file_desc\\','file', '_desc\\');
      testPath('file_desc\\\\','file', '_desc\\\\');
      testPath('file\\','file\\', '');
      testPath('file\\\\','file\\\\', '');
      testPath('file_\\','file', '_\\');
      testPath('file_\\\\','file', '_\\\\');
    }

    // Try again with existing extensions.
    testPath('/path/to/file.ext', 'file','');
    testPath('/path/to/file_desc.ext','file','_desc');
    testPath('/path_to/file_desc.ext','file', '_desc');
    testPath('/path_to/file.ext','file','');
    testPath('/path_to/_file.ext','','_file');
    testPath('/path_to/.file_desc.ext','.file','_desc');
    testPath('/path/to/f_desc.ext','f','_desc');
    testPath('/path/to/._desc.ext','.','_desc');
    testPath('file.ext', 'file', '');
    testPath('file_desc.ext', 'file', '_desc');
    testPath('.file.ext', '.file', '');
    testPath('.file_desc.ext','.file', '_desc');
    testPath('/file.ext','file', '');
    testPath('/file_desc.ext','file', '_desc');
    testPath('/.file.ext','.file', '');
    testPath('/.file_desc.ext','.file', '_desc');
    testPath('.path/file_desc.ext','file', '_desc');
    testPath('file_desc_desc.ext','file_desc', '_desc');
    testPath('file_desc_desc.ext.ext','file_desc', '_desc.ext');
    testPath('file_.ext','file', '_');
    testPath('..ext','.', '');
    testPath('..ext/','.', '');
    testPath('.file_desc.ext','.file', '_desc');
    testPath('.file.ext','.file', '');
    testPath('.file_.ext','.file', '_');
    testPath('.file__.ext','.file_', '_');
    testPath('..ext','.', '');
    testPath('..ext/','.', '');
    testPath('._file_desc.ext','._file', '_desc');
    testPath('._file.ext','.', '_file');
    testPath('._file_.ext','._file', '_');
    testPath('._file__.ext','._file_', '_');
    testPath('.__.ext','._', '_');
    testPath('.__desc.ext','._', '_desc');
    testPath('.___.ext','.__', '_');
    testPath('file_desc.ext/','file', '_desc');
    testPath('file_desc.ext//','file', '_desc');
    testPath('file.ext/','file', '');
    testPath('file.ext//','file', '');
    testPath('file_.ext/','file', '_');
    testPath('file_.ext//','file', '_');

    if (isWindows) {
      // On windows, backspace is a path separator.
      testPath('..ext\\','.', '');
      testPath('...ext\\','..', '');
      testPath('file_desc.ext\\','file', '_desc');
      testPath('file_desc.ext\\\\','file', '_desc');
      testPath('file.ext\\','file', '');
      testPath('file.ext\\\\','file', '');
      testPath('file_.ext\\','file', '_');
      testPath('file_.ext\\\\','file', '_');

    } else {
      // On unix, backspace is a valid name component like any other character.
      testPath('..ext\\','.', '');
      testPath('._.ext\\','.', '_');
      testPath('file_desc.ext\\','file', '_desc');
      testPath('file_desc.ext\\\\','file', '_desc');
      testPath('file.ext\\','file', '');
      testPath('file.ext\\\\','file', '');
      testPath('file_.ext\\','file', '_');
      testPath('file_.ext\\\\','file', '_');
    }
    
    assert(pkg.path.isTroublesome('\u0002'),"Control characters should be troublesome");
    assert(pkg.path.isTroublesome('\u0000'),"Null character should be troublesome.");
    assert(pkg.path.isTroublesome('\u001F'),"1F should be troublesome.");
    assert(pkg.path.isTroublesome("/"),"Forward slash should be troublesome.");
    assert(pkg.path.isTroublesome("\\"),"Backslash should be troublesome.");
    assert(pkg.path.isTroublesome("|"),"Pipe should be troublesome.");
    assert(pkg.path.isTroublesome("?"),"Question should be troublesome.");
    assert(pkg.path.isTroublesome("*"),"Asterisk should be troublesome.");
    assert(pkg.path.isTroublesome("%"),"Percent should be troublesome.");
    assert(pkg.path.isTroublesome("["),"Bracket should be troublesome.");
    assert(pkg.path.isTroublesome("]"),"Close Bracket should be troublesome.");
    assert(pkg.path.isTroublesome("~"),"Tilde should be troublesome.");
    assert(pkg.path.isTroublesome("{"),"Braces should be troublesome.");
    assert(pkg.path.isTroublesome("}"),"Braces should be troublesome.");
    assert(pkg.path.isTroublesome(";"),"Semi-colon should be troublesome.");
    assert(pkg.path.isTroublesome(" filename"),"Leading whitespace should be troublesome.");
    assert(pkg.path.isTroublesome("-rf"),"Leading hyphen should be troublesome.");
    assert(pkg.path.isTroublesome("filename "),"Trailing whitespace should be troublesome.");
    assert(pkg.path.isTroublesome("file  name"),"Double whitespace should be troublesome.");
    assert(!pkg.path.isTroublesome("file-name"),"Medial hyphen should *not* be troublesome.");
    assert(!pkg.path.isTroublesome("filename-"),"Trailing hyphen should *not* be troublesome.");
    assert(!pkg.path.isTroublesome("file name"),"Medial single whitespace should *not* be troublesome.");
    assert(!pkg.path.isTroublesome("()&'!+=,`@#$^"),"Some other characters should *not* be troublesome.");

    assert.equal(pkg.path.renameTroublesome('\u0002'),"=02");
    assert.equal(pkg.path.renameTroublesome('\u0000'),"=00");
    assert.equal(pkg.path.renameTroublesome('\u001F'),"=1F");
    assert.equal(pkg.path.renameTroublesome("/"),"SLASH");
    assert.equal(pkg.path.renameTroublesome("\\"),"BACKSLASH");
    assert.equal(pkg.path.renameTroublesome("|"),"VERTICAL LINE");
    assert.equal(pkg.path.renameTroublesome("?"),"QUESTION");
    assert.equal(pkg.path.renameTroublesome("*"),"STAR");
    assert.equal(pkg.path.renameTroublesome("%"),"PERCENT");
    assert.equal(pkg.path.renameTroublesome("["),"LEFT SQUARE BRACKET");
    assert.equal(pkg.path.renameTroublesome("]"),"RIGHT SQUARE BRACKET");
    assert.equal(pkg.path.renameTroublesome("~"),"TILDE");
    assert.equal(pkg.path.renameTroublesome("{"),"LEFT CURLY BRACKET");
    assert.equal(pkg.path.renameTroublesome("}"),"RIGHT CURLY BRACKET");
    assert.equal(pkg.path.renameTroublesome(" ; "),"SEMICOLON");
    // expand spaces around it if not on ends...
    assert.equal(pkg.path.renameTroublesome("file;name"),"file SEMICOLON name");
    // unless there are already spaces.... (space replace is done after character replace)
    assert.equal(pkg.path.renameTroublesome("file ; name"),"file SEMICOLON name");
    assert.equal(pkg.path.renameTroublesome(" filename"),"filename");
    assert.equal(pkg.path.renameTroublesome("-rf"),"HYPHEN rf");
    assert.equal(pkg.path.renameTroublesome("-   rf"),"HYPHEN rf");
    assert.equal(pkg.path.renameTroublesome("filename "),"filename");
    assert.equal(pkg.path.renameTroublesome("file  name"),"file name");
    assert.equal(pkg.path.renameTroublesome("file-name"),"file-name");
    assert.equal(pkg.path.renameTroublesome("filename-"),"filename-");
    assert.equal(pkg.path.renameTroublesome("file name"),"file name");
    assert.equal(pkg.path.renameTroublesome("()&'!+=,`@#$^"),"()&'!+=,`@#$^");
    
};

var testDataDir = path.join(__dirname,"data");
var tmpDir = path.join(os.tmpdir(),"test_sfms");

var setupDirTests = function(cb) {
    switch (os.platform()) {
        case "linux":
            run("cp",["-r",testDataDir,tmpDir],cb);            
            break;
        default:
            return cb("Some work needs to be done to run this test on your platform (" + os.platform() + ")");
    }
}

var cleanupDirTests = function(cb) {
    switch (os.platform()) {
        case "linux":
            run("rm",["-rf",tmpDir],cb);            
            break;
        default:
            return cb("Some work needs to be done to run this test on your platform (" + os.platform() + ")");
    }
    
}

var dirTest = function(func) {
    return function(t) {
        setupDirTests(function(err) {
            t.intercept(err);
            
            var counter = 0;
            
            var oldAsync = t.async.bind(t);
            t.async = function(func) {
                counter += 1;
                return oldAsync(function() {
                    func.apply(null,Array.prototype.slice.call(arguments,0));
                    counter -= 1;
                    if (counter === 0) {
                        cleanupDirTests(oldAsync(function(err) {
                            t.intercept(err);
                        }));
                    }
                })
            }
            func(t);
        });

    }
    
}


var arrComp = function(arr1,arr2) {
    if (arr1.length == arr2.length) {
        for (var i = 0; i < arr1.length; i++) {
            if (arr1[i].join) {
                if (!arrComp(arr1[i],arr2[i])) {
                    return false;
                }
            } else {
                if (arr1[i] !== arr2[i]) {
                    return false;
                }
            }
        }
        return true;
    }
    return false;
}

module.exports.testPacketSystem = dirTest(function(t) {

    
    var document = path.join(tmpDir,"document");
    var renameTo = path.join(tmpDir,"newDocument");
    pkg.ps.rename(document,renameTo,t.async(function(err) {
        t.intercept(err);

        assert(fs.existsSync(renameTo + ".txt"),"New file must exist after ps.rename");
        assert(fs.existsSync(renameTo + "_.md"),"File with '_' descriptor must exist after ps.rename");
        assert(!fs.existsSync(path.join(tmpDir,"data")),"Strange data folder shouldn't exist.");
        // I think it occurred before due to an improperly cleaned up tmp directory. The 'cp'
        // command saw the tmp directory still there, so thought I was supposed to copy it *into*
        // it, not over it. I always hated that behavior in cp and mv.
        
        assert.doesNotThrow(pkg.ps.renameSync.bind(pkg.ps,renameTo,document),"ps.renameSync must not throw an error");
        assert(!fs.existsSync(path.join(tmpDir,"data")),"Strange data folder shouldn't exist.");
        
        assert(fs.existsSync(document + ".txt"),"New file must exist after ps.renameSync");
        assert(fs.existsSync(document + "_.md"),"File with '_' descriptor must exist after ps.rename");
        
        // The basic list is tested with the rename function.
        
        pkg.ps.readpacket(document,"_notes",t.async(function(err,list) {
            t.intercept(err);
            assert(list.length == 1,"ps.list with descriptor must return an array of length 1")
            
            assert(list[0] === path.basename(document) + "_notes.txt","ps.list with descriptor must return the correct item.");
            
            var syncList = pkg.ps.readpacketSync(document,"_notes");
            assert(list.length === syncList.length,"ps.listSync with descriptor must return the same number of values as non-sync");
            assert(list[0] === syncList[0],"ps.listSync with descriptor must return the same values as non-sync");


        }));
        
        pkg.ps.readpacket(document,"_properties",".json",t.async(function(err,list) {
            t.intercept(err);
            assert(list.length == 1,"ps.list with all params must return an array of length 1")
            assert(list[0] === path.basename(document) + "_properties.json","ps.list with all params must return the correct item.");
            
            var syncList = pkg.ps.readpacketSync(document,"_properties",".json");
            assert(list.length === syncList.length,"ps.listSync with all params must return the same number of values as non-sync");
            assert(list[0] === syncList[0],"ps.listSync with all params must return the same values as non-sync");
        }));
        
        pkg.ps.readpacket(tmpDir,"_properties",".json",true,t.async(function(err,list) {
            t.intercept(err);
            assert.equal(list.length,1)
            assert.equal(list[0],"_properties.json");
            
            var syncList = pkg.ps.readpacketSync(tmpDir,"_properties",".json",true);
            assert(list.length === syncList.length,"readpacket for blank packetname must return the same number of values as non-sync");
            assert(list[0] === syncList[0],"readpacket for blank packetname must return the same values as non-sync");
        }));
        
        pkg.ps.readProperties(document,t.async(function(err,props) {
            t.intercept(err);
            
            assert(props["object-value"].foo === "bar","ps.get should get the correct data.");

            var otherProps = pkg.ps.readPropertiesSync(document);
            assert(otherProps["object-value"].foo === "bar","ps.getSync should return the same values.");

        }));
        
        pkg.ps.readProperties(tmpDir,true,t.async(function(err,props) {
            t.intercept(err);
            
            assert(props["packet-blank"] === true,"ps.get should get the correct data.");

            var otherProps = pkg.ps.readPropertiesSync(tmpDir,true);
            assert(otherProps["packet-blank"] === true,"ps.getSync should return the same values.");

        }));
        
        pkg.ps.readProperties(path.join(tmpDir,"does-not-exist"),t.async(function(err,props) {
            t.intercept(err);
            
            assert(Object.keys(props).length === 0,"ps.get with a non-existing file should return an empty properties object.");
            
        }));
        
        var storeFile = path.join(tmpDir,"storingProps");
        var data = { "this": { "is": { "a": { "long": { "property": { "path": true }}}}}};
        pkg.ps.saveProperties(storeFile,data,t.async(function(err,props) {
            t.intercept(err);
            
            assert(pkg.ps.readPropertiesSync(storeFile).this.is.a.long.property.path,"ps.set should have saved the file.");
        }));
    }));
    
});

module.exports.testSort = function(t) {
    var sort = pkg.sort;
    
    var list = ["8","23","4","42","16","15"]
    sort.sortBy(list,function(value,cb) {
        cb(null,parseInt(value));
    },t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(result,["4", "8", "15", "16", "23", "42"],"sortAsync should sort appropriately.");
    }));

    // and a compare function
    sort.sortBy(list,function(value,cb) {
        cb(null,parseInt(value));
    },function(a,b) {
        // sorts in reverse.
        return a > b ? -1 : a < b ? 1 : 0;
    },t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(result,["42","23","16","15","8","4"],"sortAsync should sort appropriately.");
    }));

    // and try it in a struct.
    sort.sortBy(list,{
        sortBy: function(value,cb) {
            cb(null,parseInt(value));
        },
        compare: function(a,b) {
            // sorts in reverse.
            return a > b ? -1 : a < b ? 1 : 0;
        }
    },t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(result,["42","23","16","15","8","4"],"sortAsync should sort appropriately.");
    }));


    assert.deepEqual(sort.sortBySync(list,function(value) {
        return parseInt(value);
    }),["4", "8", "15", "16", "23", "42"])

    // and a compare function
    assert.deepEqual(sort.sortBySync(list,function(value) {
        return parseInt(value);
    },function(a,b) {
        // sorts in reverse.
        return a > b ? -1 : a < b ? 1 : 0;
    }),["42","23","16","15","8","4"],"sortSync should sort appropriately.")

    // and try it in a struct.
    assert.deepEqual(sort.sortBySync(list,{
        sortBy: function(value) {
            return parseInt(value);
        },
        compare: function(a,b) {
            // sorts in reverse.
            return a > b ? -1 : a < b ? 1 : 0;
        }
    }),["42","23","16","15","8","4"],"sortSync should sort appropriately.");

    var packetList = pkg.path.packets(fs.readdirSync(testDataDir).map(function(file) {
        return path.join(testDataDir,file);
    }));
    
    /*packetList = packetList.map(function(file) {
        return path.join(testDataDir,file);
    });*/
    
    sort.sortBy(packetList,sort.sortByProperty("order"),t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(pkg.path.packetnames(result),['document','sort4','sort3','sort2','sort1']);
    })); 
    
    sort.sortBy(packetList,sort.sortByProperty("order","numeric"),t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(pkg.path.packetnames(result),['document','sort4','sort3','sort2','sort1']);
    })); 

    sort.sortBy(packetList,sort.sortByProperty("order","numeric",false),t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(pkg.path.packetnames(result),['sort1','sort2','sort3','sort4','document']);
    })); 

    sort.sortBy(packetList,sort.sortByProperty("title","numeric"),t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(pkg.path.packetnames(result).slice(3),['sort2','sort4']);
    })); 
    
    sort.sortBy(packetList,sort.sortByProperty("title","lexical"),t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(pkg.path.packetnames(result).slice(2),['sort4','sort2','sort3']);
    })); 
    
    sort.sortBy(packetList,sort.sortByProperty("title","lexical",false),t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(pkg.path.packetnames(result).slice(0,3),['sort3','sort2','sort4']);
    })); 


    var s = sort.sortBySync(packetList,sort.sortByPropertySync("order"));
    assert.deepEqual(pkg.path.packetnames(s),['document','sort4','sort3','sort2','sort1']);
    
    assert.deepEqual(pkg.path.packetnames(sort.sortBySync(packetList,sort.sortByPropertySync("order","numeric"))),['document','sort4','sort3','sort2','sort1']);

    assert.deepEqual(pkg.path.packetnames(sort.sortBySync(packetList,sort.sortByPropertySync("order","numeric",false))).slice(0,4),['sort1','sort2','sort3','sort4']);

    assert.deepEqual(pkg.path.packetnames(sort.sortBySync(packetList,sort.sortByPropertySync("title","numeric"))).slice(3),['sort2','sort4']);
    
    assert.deepEqual(pkg.path.packetnames(sort.sortBySync(packetList,sort.sortByPropertySync("title","lexical"))).slice(2),['sort4','sort2','sort3']);
    
    assert.deepEqual(pkg.path.packetnames(sort.sortBySync(packetList,sort.sortByPropertySync("title","lexical",false))).slice(0,3),['sort3','sort2','sort4']);
    
    sort.sortBy(packetList,sort.sortByDirectoryProperty("index"),t.async(function(err,result) {
        t.intercept(err);
        assert.deepEqual(pkg.path.packetnames(result),['sort2','sort4','sort1','sort3','document']);
    })); 
    
    assert.deepEqual(pkg.path.packetnames(sort.sortBySync(packetList,sort.sortByDirectoryPropertySync("index",false))),['document','sort3','sort1','sort4','sort2']);
    

}
