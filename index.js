

/**
 * SMFS does not specify an API. This core library is simply a way of
 * making implementation of SMFS easier. It provides tools for querying 
 * and manipulating the properties of sets of related files all at once.
 * 
 * This API works against the local file system, however it is designed so
 * that it can be rewritten to run against other systems, such as a
 * remote filesystem over the network, or a system with a database back
 * end. It could also be re-written to use a different storage mechanism
 * for properties.
 * */


/*
 * FUTURE: Some day, I may want to go against an index or something.
 * This would require me to rewrite a lot of these methods to take
 * SQL queries, or something like that. That would be considered a new
 * feature to add if it becomes necessary. For now, I've got some 
 * rudimentary caching of properties available, and that should be enough.
 * */


module.exports = {
    path: require("./lib/path"),
    ps: require("./lib/ps"),
    sort: require("./lib/sort")
}



