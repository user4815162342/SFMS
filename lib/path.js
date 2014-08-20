/**
 * The path module contains methods used for parsing and manipulating
 * file paths to get things like primary names and descriptors. The
 * file system is not consulted for validity or existance of files.
 * */
var nodePath = require('path');

// Intended for matching against a basename without extension already 
// provided by node's path.basename. This is done to avoid multi-platform code.
var descriptorMatch = /^([\s\S]*?)(\_[^_]*|)$/;

/**
 * Parses the packet name out of a path, removing dirname, descriptor
 * and extension.
 * 
 * @param p string 
 * @returns string 
 * */
var path_packetname = module.exports.packetname = function(p) {
    var result = nodePath.basename(p,nodePath.extname(p));
    var match = descriptorMatch.exec(result);
    return match[1];
}

/**
 * Takes a list of file paths, such as that retrieved from
 * readdir, and returns a list of base packet names represented in that list,
 * with duplicates removed. The order of the result is not
 * guaranteed. "Blank" packets are also removed, since those should
 * only be used as properties for the parent directory, and even then
 * only if the user specifically chooses to.
 * 
 * Note that if paths from multiple directories are passed, this will
 * count as the same those with the same base name that appear in 
 * different directories.
 * 
 * @params ps array of string
 * @return array of string
 * */
var path_packetnames = module.exports.packetnames = function(ps) {
    var result = [];
    ps.forEach(function(p) {
        var packet = path_packetname(p);
        // If we found a 'blank' packet, then the files for that 
        // apply to the directory, not any file *in* the directory,
        // so, it doesn't exist in the directory.
        if (packet !== "") {
            if (result.indexOf(packet) == -1) {
                result.push(packet);
            }
        }
        
    })
    return result;
}



/**
 * Parses the 'descriptor' out of a path, removing dirname, primary name
 * and extension.
 * 
 * @param p string
 * @returns string
 * */
var path_descname = module.exports.descname = function(p) {
    var result = nodePath.basename(p,nodePath.extname(p));
    var match = descriptorMatch.exec(result);
    return match[2];
}

/**
 * Parses the 'packet path' out of a path, removing the descriptor and
 * extension but leaving the dirname.
 * 
 * @param p string
 * @returns string
 * */
var path_packet = module.exports.packet = function(p) {
    var packetname = path_packetname(p);
    return nodePath.join(nodePath.dirname(p),packetname);
}

/**
 * Takes a list of full file paths, such as that retrieved from
 * readdir after they've been mapped back onto their dirname, and 
 * returns a list of full packet paths represented in that list,
 * with duplicates removed. The order of the result is not
 * guaranteed. "Blank" packets are also removed, since those should
 * only be used as properties for the parent directory, and even then
 * only if the user specifically chooses to.
 * 
 * @params ps array of string
 * @return array of string
 * */
var path_packets = module.exports.packets = function(ps) {
    var result = [];
    ps.forEach(function(p) {
        var packet = path_packetname(p);
        if (packet !== "") {
            packet = nodePath.join(nodePath.dirname(p),packet);
            if (result.indexOf(packet) == -1) {
                result.push(packet);
            }
        }
    })
    return result;
}


    /**
     * A little history and thoughts on special characters in names:
     * 
     * My first attempt at this just used encodeURIComponent. However,
     * that encoded a few characters (such as spaces) and left a few
     * characters unencoded (such as '*') which I didn't want to encode.
     * 
     * So I fixed a few of those characters.
     * 
     * And then I tried xdg-open on a .png file encoded in this manner.
     * Since I was running xfce4, xdg-open just called exo-open, and it
     * turns out that exo-open expects an encoded URL and automatically
     * decodes it, which means that, when I was trying to open up something
     * like "File %28parentheses%29.png", it tried to open "File (parentheses).png".
     * 
     * And so, I went back to the drawing board. 
     * 
     * I considered the possibility that it should be the file system that
     * should block invalid characters, throwing errors if someone tries to
     * use an invalid name. But, I thought about the usability of such
     * a system.
     * 
     * So, I searched for what characters were forbidden on different 
     * operating systems, and I came upon this essay: 
     * <http://www.dwheeler.com/essays/fixing-unix-linux-filenames.html>.
     * 
     * I came away from it slightly convinced, but not completely convinced about
     * all of the characters he suggested be escaped or forbidden. 
     * 
     * I can agree with forbidding things like control characters. But,
     * as far as I'm concerned, if someone wants to name their office document
     * "Accounts & Ledgers (2012-2014).docx", I see no reason why they
     * shouldn't be able too. If a program can not work with such filenames
     * in an environment where such names might appear, then that's a bug
     * that will need to be fixed someday. No, I can't help the fact that
     * bash and other batch scripting languages make these sorts of bugs 
     * incredibly easy to write (or rather, fairly difficult not to write). 
     * But, it's still a bug.
     * 
     * The other thought that occurred to me: even if I encode some of these
     * characters, it will make reading the file names in the directory
     * difficult without special tools, unless the characters that need
     * to be encoded are unusual. Therefore, I need to think carefully before
     * I decide to encode a character, and the fact that they might cause
     * problems with scripting simply may not be enough.
     * 
     * And so, I began looking through the lists of troublesome characters
     * in the essay. Some of them I absolutely agreed with. Some I agreed
     * with so vehemently that I wanted to just forbid them. Others I 
     * disagreed with for reasons explained above. Then there were the
     * characters that I didn't see a reason for forbidding, but agreed
     * that they should be escaped.
     * 
     * So, I started thinking about an encoding system again. I considered
     * using something like quoted-printable ('=' followed by hex digits).
     * 
     * So, I formulated my thoughts into a table of characters, whether
     * they should be encoded or forbidden and why. And I started thinking about
     * an encoding system. And as I was working out the algorithms, I noticed 
     * something in the table. A large number of the characters I thought to 'escape' 
     * were being escaped at least partially because they were "officially" forbidden
     * on Windows.
     * 
     * And then the thought occurred to me. If a character is forbidden
     * on Windows, of all things, then that means Microsoft considered it
     * not useful enough to allow. And, since I'm in line with their thinking
     * about being able to use readable filenames like "Documents and Settings",
     * and "Program Files", then who am I to argue with them about forbidding
     * *those* characters. So, I decided to forbid them as well.
     * 
     * And then, after removing those, I realized that there were only
     * five troubling characters left to encode, and one of those ("=") was 
     * only being encoded  because it was the escape character I was going to use.
     * 
     * And so, upon looking at the remaining list, I realized that they
     * weren't worth encoding, and I could just forbid them instead.
     * Which makes my life easier because I don't have to come up with
     * an encoding system.
     * 
     * So, instead, I decided to just have a function which checks if a given
     * name is 'valid' or not.
     * 
     * And then I found a few characters in my list of troubling but 
     * acceptable characters that were useless enough that I didn't need
     * to support them. Which means that it was easier to just forbid
     * those so that I didn't cause backwards compatibility issues
     * if I changed to forbid them in the future.
     * */

/**
 * The following characters are forbidden:
 * 
 * 1. I see absolutely no reason to use control characters and DEL in a 
 * filename.
 * 2. The characters "<>:"\/\\|?*" are "officially" forbidden on Windows, and
 * if MS thinks that they aren't useful enough to use in filenames,
 * then I can probably agree with that. (Forward slash is also forbidden
 * on linux).
 * 3. The characters "%[]~" are all that are left of the troubling characters
 * that I agree are troubling, which aren't enough to be worth encoding.
 *  a. '%' is used for escaping URLs, making finding a file with this character on an HTTP server confusing.
 *  b. '[' is used to start glob patterns on linux, so should have the same fate as '*' and '?'.
 *  c. ']' is pretty much useless without '[', so I'll ban it for consistency.
 *  d. '~' is used as an alias on Linux. It's usage is also fairly rare anyway.
 * 4. The characters '{};' are on the lists of troubling characters, and
 * although I disagree with their troublesomeness, their usefulness isn't
 * strong enough to put my support behind them, so it's easier to forbid
 * them now than later.
 * */
var forbiddenChars = /[\u0000-\u001F\u007F<>:"\/\\\|\?\*%[\]~{};]/
 /**
  * These characters are only forbidden under certain circumstances.
  * 
  * 5. Whitespace should be forbidden at the beginning and ending of a title,
  * it's annoying and I see no reason why it should be useful.
  * 6. The hyphen at the beginning of a file name could mess with command
  * line switches, and I again see no reason why it should be useful.
  * 7. Whitespace pairs should also be absolutely forbidden, as they 
  * can be confused with single whitespaces.
  * 
  * */
var positionallyForbidden = /(?:^[\s\-])|(?:\s$)|(?:\s\s)/

 /**
  * 8. The following characters have been marked as troubling for filenames. However, 
  * either I find their usefulness for names to be way too strong to disallow
  * them. (I'd also add '?' to the list if it wasn't already banned for
  * portability reasons).
  * 
  * "()&'!"
  * */
  
  
/**
 * Checks a packet name against a list of characters and patterns that
 * could be considered troublesome in filenames, and returns true if
 * those patterns appear. It is not for me to say whether you should
 * use these filenames, but if you do you may run into problems. Some
 * platforms may even forbid some of the characters, leading to errors
 * if you try to use them.
 * */  
var path_istroublesome = module.exports.isTroublesome = function(text) {
    return forbiddenChars.test(text) || positionallyForbidden.test(text);
}

var replaceForbiddenChars = /([\u0000-\u001F\u007F<>:"\/\\\|\?\*%[\]~{};])/g
var replacePositionallyForbidden = /(^\-\s+)|(^\-)|(^\s+)|(\s+$)|(\s+)/g

/**
 * Converts a 'troublesome' name into something that is not troublesome.
 * This is not meant for encoding and decoding, it's meant for automatic 
 * renaming when creating a new SFMS system out of some other data source.
 * Using this prevents the need to confirm with the user about how to
 * rename the data.
 */
var path_renameTroublesome = module.exports.renameTroublesome = function(text) {
    return text.replace(replaceForbiddenChars,function(match,p1,offset,string) {
        switch (true) {
            case p1 == "<":
                return " LESS-THAN ";
            case p1 == ">":
                return " GREATER-THAN ";
            case p1 == ":":
                return " COLON ";
            case p1 == "\"":
                return " QUOTATION ";
            case p1 == "\/":
                return " SLASH ";
            case p1 == "\\":
                return " BACKSLASH ";
            case p1 == "|":
                return " VERTICAL LINE ";
            case p1 == "?":
                return " QUESTION ";
            case p1 == "*":
                return " STAR ";
            case p1 == "%":
                return " PERCENT ";
            case p1 == "[":
                return " LEFT SQUARE BRACKET ";
            case p1 == "]":
                return " RIGHT SQUARE BRACKET ";
            case p1 == "~":
                return " TILDE ";
            case p1 == "{":
                return " LEFT CURLY BRACKET ";
            case p1 == "}":
                return " RIGHT CURLY BRACKET ";
            case p1 == ";":
                return " SEMICOLON ";
            case p1 < "\u0010":
                return "=0" + p1.charCodeAt(0).toString(16).toUpperCase()
            default:
                return "=" + p1.charCodeAt(0).toString(16).toUpperCase()
        }
    }).replace(replacePositionallyForbidden,function(match,p1,p2,p3,p4,p5,offset,string) {
        if (p1) {
            return "HYPHEN ";
        } else if (p2) {
            return "HYPHEN ";
        } else if (p3 || p4) {
            return "";
        } else if (p5) {
            return " ";
        }
    });
    
}
