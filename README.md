Simple File Metadata System 
============================

*This is essentially a work-in-progress. There may be better ways to do this
than what is described.*

The Problem:
------------

The hierarchical file system is a great concept. It's simple and elegant in
execution and easy to understand. It's about fifty years old now, and while file
systems in general have seen untold advancements since then, the basic idea
hasn't changed.

But, the limitations of the hierarchical file system are well known among
software developers and system administrators. Without going into details, a
large amount of these limitations can be boiled down to a lack of
user-customizable metadata. Sure, there are many other things that would help as
well, but with user metadata, the majority of those limitations can be removed.

But, the lack of this metadata isn't the problem. This is a problem that has
indeed been solved.

User-customizable metadata exists in most modern file systems available in the
most popular operating systems — but not in all cases. Many file formats provide
customizable fields for their specific type of data. It's also possible to make
use of document storage systems which also provide this capability.

The problem is that there are too many solutions, sometimes only weakly
implemented, and nothing cross-platform.

Obviously, when there are too many incompatible solutions, the thing we need the
least  is... another solution.

But, even so, if we're going to do it, let's do it right. The number one thing
to do is address the problems with these solutions.

Rather than discuss the specific systems and software themselves, I'm going to
discuss why solutions might fail:

-   If the metadata is stored in any format besides plain-text, or at least look
    like plain-text to the user, the user will need special software to read or
    edit it. Anytime you need special software to read a file, you risk being
    unable to access it at some point in the future.

-   If the metadata is not obvious to the user, it will be forgotten and remain
    unused. This is a major problem with some file and operating systems which
    implement metadata themselves. In these systems, most people are not given
    any user interface indication that it exists, or that it's possible to make
    use of it, therefore they don't even know it's there.

-   Even if the user remembers to use the metadata, if the metadata is not
    actively maintained by the system, it will eventually disappear. If the
    operating system's method of copying a file does not preserve this data by
    default, then a poor man's backup system (file copy) will not preserve it,
    and the data will disappear, often without the user even realizing it until
    years later. This is a major problem with extended attributes in many file
    systems, where the default action of 'copy' is *not* to copy the attributes.

-   If the metadata is not stored along with the file it pertains to (as opposed
    to a separate location somewhere else in the system), the user is very
    likely to forget that it is even there. Once again, a poor man's backup
    system is likely to forget it, but even more importantly, a poor man's
    restore system will also forget it.

-   Sometimes, metadata is more than just a key-value pair, sometimes you need
    to store an entire document alongside another. And, if this happens, you
    must be able to edit that document in its appropriate editor without jumping
    through hoops.

-   Metadata stored in the file itself means that each specific file has a
    different way of editing it, not to mention that in-file metadata often has
    limitations on what *can* be stored there, and may not allow arbitrary data.

-   Metadata stored in the path to the file, beyond identifying names, leads to
    complex, difficult to remember path-naming systems that will easily be
    forgotten, as well as extremely long names. It also makes the simple
    operation of changing just the name of the file difficult.

So, the key things which this system must provide seem to be:

1.  The metadata must be obvious to the user.

2.  The metadata must be stored in plain-text.

3.  The metadata must support document-sized data.

4.  The metadata must be stored outside of the file itself, but alongside it.

Simple File Metadata System:
----------------------------

SFMS is not a file system, nor a file browser, nor any sort of software to
manipulate and organize the file system. It is a human behavior pattern of
naming and organizing files in a way to allow for metadata, that will work with
any hierarchical file system that supports long filenames. With some minor
adjustments left as an exercise for the reader, it could work with some systems
that support short filenames as well.

It's inspired by the concept of the file extension. Only in some really old file
systems was the file extension stored as a separate unit from the filename. In
almost all modern file systems, the extension is just a convention that has
remained from those days, as a way of tracking the type of file in the filename
itself.

### Packets

The hierarchical file system uses the terms 'folder' and 'file', taken from
traditional hard-copy filing systems, where a folder contains a bunch of files.
SFMS invokes a new virtual entity which I will refer to as a "packets". The term
"packet name", or "packetname", indicates the name of a file, minus any
extension and descriptor (which is described below). The term "packet" refers to
a set of files in the same directory sharing the same packet name.

The closest equivalent in the hard-copy file systems is a set of files attached
together with paperclips, staples, binder clips or more exotic mechanisms, and
then possibly placed inside another folder with some other similarly attached
files. If I were to name a set of papers attached together in this way, I'd
either call it a bundle or a packet. Both of these terms have other uses in
computer technology, but bundle makes me think more of sticks than sheets of
paper.

### Descriptor

A file descriptor is a part of a file name that indicates it's relationship with
other files in the same packet. It works similarly to the file extension. Where
the file extension consists of the text in a filename after the last dot, the
file descriptor consists of the text in the filename after the last underscore
(and before the last dot). The descriptor is used to indicate that the file
contains metadata for another file, and is not a primary document.

Thus:

-   `document.doc`

-   `document_metadata.txt`

-   `Joe's Letter.doc`

-   `Joe's Letter_metadata.txt`

I chose the underscore simply because there aren't a lot of choices of usable
punctuation in filenames. I think a dash would look better, and be far easier to
type, but it has more useful functionality in the filename itself, being a
standard punctuation character in English. I've also seen the underscore in use
in other systems (such as saving a "full web page" from a browser, where the
content files are stored in a directory ending in "_files"). Underscores are
really unnecessary in filenames.[^1]

[^1]: the days of operating systems which can't handle spaces are behind us,
even if some programs today are still broken. If you disagree with me on this,
then we're getting into a religious war that's been raging since at least the
1980's, and the contents of this document make it very clear which side I'm on.
However, this system makes it possible to use underscores in file names, so if
you prefer to replace your spaces with underscores, and still use this system,
then go ahead.

If you do need an underscore in a filename without creating a descriptor, the
solution would be the same as using a period in a filename without changing the
extension. We're only worried about the last underscore, so if you want a
filename that contains no descriptor, but does contain an underscore, just end
the base name with an underscore. A blank descriptor should generally be treated
the same as no descriptor, just as a blank extension is treated the same as no
extension (although the filenames are usually still considered different in the
operating system).

### Other Terms

-   *Primary File*, *Primary Document* or *Primary *means a file in a file
    packet that contains no, or a blank descriptor. This usually refers to the
    file that contains the main content in the packet, but occasionally there
    may be more than one of these, or none at all.

-   *Metadata File* or *Metadata *means a file in a packet which includes a
    descriptor. This usually refers to a file which contains data that is
    related to the primary file that should be stored as a separate file to make
    editing its content easier. But, the properties file is technically a
    Metadata file as well.

-   *Properties File* or *Properties *means a metadata file that specifically
    contains structured metadata consisting of properties and atomic values.
    This means it contains metadata about the packet that does not need to be
    stored in a separate file.

-   *Attachment File *or *Attachment* means a metadata file that is not the
    properties file.

Rules
-----

Starting with this descriptor, we can come up with the following rules, which
describe the system and how to store metadata.

### Naming

1) A packet name that contains an underscore must end with another underscore to
indicate that the prior underscore does not indicate a descriptor. A packet name
that contains a period must end in a period to indicate that the first period
does not indicate an extension.

2) It is recommended that packet names avoid the following characters and
patterns, except for their use in defining file paths. Some of these characters
are illegal for use in file names on some platforms. Others cause more trouble
than they are worth because they conflict with command-line conventions.

-   All "control" characters (unicode code points 1-1F), as well as `NULL`
    (unicode 0) and `DELETE` (unicode 7F).

-   Characters officially forbidden on one of the big three operating systems:
    "`<>:"\/|?*`".

-   Additional characters that may be confused with file name pattern-matching
    characters on certain operating systems: "`[]~`"

-   A few characters which may cause trouble in certain scripting situations,
    and could easily be escaped, but whose usefulness is not strong enough for
    me to back: "`{};`"

-   Any whitespace character (as defined by unicode) not already mentioned
    above, when it appears at the beginning or end of the name, or when it
    appears next to another such whitespace character in the filename. In these
    situations, file names can be misread.

-   A hyphen "`-`" when it appears at the beginning of the name.

3) It is recommended that packet names be able to use the following characters,
unless the file system itself forbids it: "`()&'!`". All of these characters
have use in providing meaningful and concise names to documents, and without
them, the names could be less readable. There are a few characters forbidden by
operating systems, as mentioned above, which I feel should be allowed here as
well, but I can't allow them if they're going to create platform
incompatibilities.

4) Scripts which are meant to deal with packet names should be able to accept
all possibilities mentioned above.

### Primary vs. Metadata Files:

5) A primary file or primary document is a file with a name that does not have a
descriptor.

6) A file that contains a descriptor contains metadata for a packet.

### Properties vs. Attachments:

7) A file with the descriptor "properties" should contain structured data in
some sort of plain-text format (such as JSON or YAML) which allows the data to
contain properties with values. The values do not need to be limited to scalar
data. It's extension should indicate the format and structure of the data, and
does not need to be the same as the primary file. These files contain values for
Properties for the primary file they are associated with. I do not specify the
format for this document, but it should remain consistent at least within an
application.

8) A file with any other descriptor should contain an actual document (which
could be structured data document, of course), and have an extension indicating
the format and type of content in the document. These files contain Attachments
to the primary file they are associated with.

### Duplicates and Missing Files:

File systems generally only guarantee unique filenames based on the entire
filename. Two filenames with the same basename and different extensions are not
illegal, therefore I can not expect them to be illegal in this system. For
similar reasons, I can't expect the file system to *require* a primary file
before a metadata file can be created.

9) It is possible for two or more primary files to exist in a packet with
different extensions, or a "" vs. "_" descriptor. In this case, these files are
considered to be related, generally as two separate parts of the same primary
document. Any metadata files with the same basename are considered to be
metadata for both, or all of these primary files.

10) It is possible for two or more metadata files to exist in a packet with the
same descriptor, but different extensions. In this case, again, these files are
considered to be related, generally as two separate parts of the same metadata
relationship.

11) It is possible for a metadata file to exist without a matching primary file.
This might be used, especially with the properties file, as a placeholder for a
packet whose primary content is unknown or can't be determined.

### Folders/Directories:

It is conventional for folders to not have extensions, but this does not change
anything about how the above rules are applied to them. They may still have
metadata files with file descriptors associated with them. These files will
exist as siblings to the folder, not as children, but no rules need be made
about that, as the above rules cover it.

There are a few additional rules which do relate to folders, however:

12) Metadata which applies to a folder can be stored in one of two ways,
depending on the application. The application should know where it expects the
files to be stored, it should not have to attempt to guess, or fall back if not
found in one place.

12a) In most cases, metadata files should be stored in the same parent directory
as the folder, as attachments to the folder's packet. This way, metadata files
do not exist alone, without a primary document, inside the folder. (This is just
a clarification of the whole system as it applies to folders.)

If the metadata file were enclosed inside the folder, it's packet name might
conflict with the packet name of a file a user might want to put in there some
day. For example, if the metadata were stored in dir/folder.json, then the user
would not be able to store an e-mail file called folder.eml, which contains a
request for the user to pass a folder to the sender.

12b) There are some applications which might require the metadata for a folder
to be stored inside that folder. In this case, the metadata should be stored in
a packet with *no* packet name, and a leading underscore, thus:
`folder/_properties.json`.

This is necessary, if the application is required to store all of it's data
inside a folder, because the parent folder contents are reserved by another
system for other uses (for example, a folder of scripts which expects only
scripts to be stored inside it), or if another system would be unable to find
this metadata if it were stored outside (for example, if the folder were the
root of a version control repository).

13) It is possible for two primary files to exist with the same basename, where
one is a regular file and the other is a file directory. This is a clarification
of rule #9 as it applies to folders, and this rule offers no additional
indications of what this would mean. But, in general, this might allow a primary
document to look like it is also a folder, a common pattern in other nested
hierarchical data structures. In fact, this is the recommended way to deal with
this sort of situation.

14) It is possible for a metadata file to be a directory. In this case, the
contents of the directory are contents of the metadata for the packet, they are
not part of the packet.

### Metadata on Metadata:

15) It may sometimes be necessary for a metadata file to have it's own metadata.
Rather than use a separate descriptor for this, which would essentially create a
new packet, this metadata should be stored in a file with the same name and
descriptor, but a different extension. So, for example: `document.doc,
document_properties.json, document_notes.txt, document_notes.json`, not
`document.doc, document_notes.txt, document_notes_properties.json`. The latter
would create a new packet called "document_notes" which is in a completely
different packet from "document".

### Packet Order:

Another bit of metadata which is not provided by a hierarchical file system is
the position of a file within a directory -- files are assumed to be in no
particular order. But, the position of a packet is a kind of metadata, therefore
SFMS should be capable of handling it. To maintain a packet order, the following
mechanisms are suggested.

16) A file can be positioned in a directory based on the value of a property in
its properties file. Thus, for example, there might be a property called
"order", which contains a numeric value indicating where the packet appears.
Packets which don't have this property should be sorted to the beginning of the
list when sorting in order. Packets which have the same value should be sorted
next to each other, but in no known order.

17) A file can be positioned in a directory based on the value of a property in
the directory's properties file. In this case, the property would contain a
list, or array, value listing off the packet names in the order they should
appear. If a packet is not mentioned in the list, it should be sorted to the end
of the list when sorting in order.

The first mechanism is easiest to process, and it keeps the metadata with the
packet, which is one of the requirements of this system. But, it, makes moving
items within the sort more difficult, since you need to change the property on
multiple packets just to move one packet further up or down the list.

The second mechanism is a little more difficult to process, but makes moving
items much easier, since you only need to change one property in one place. As
to whether it breaks the requirements, that depends on whether you would
consider the order of the packet within a folder to be a metadata of the packet,
or a metadata of the folder. The latter could easily be argued. If the packet is
moved or copied to a new location, it's order in it's original folder is
meaningless.

### Symbolic or Hard Links:

Some operating systems and file systems support links or aliases which allow you
to access files via different paths. As these entities are not available on all
Hierarchical File Systems, SFMS can not do anything special with them. However,
as they do exist on a subset of such file systems, the specification must
account for them.

The following rules use the term link to refer to a file system entity which
references another file system entity in a way that the operating system will
automatically follow the link to the target without requiring the application to
do anything special. A Windows Shortcut would not be a link, since the
application has to make separate operating system calls to follow it.

18) All links are treated as if they are real files existing in the location of
the link, with the content of the target file.

19) The metadata files for a link that is also a primary file consist only and
entirely of metadata files found in the location of the link itself, metadata
files for the target of the link are not seen by SFMS.

If SFMS were to support metadata applied to linked files, then it would break
the requirement that metadata be obvious. However, by not disallowing links,
SFMS can be much more interesting on systems that support them.

### Hidden Files:

20) Files should only be marked as hidden if they contain data that can be
easily recreated from other data, or at least if the data they contain does not
need to be preserved. Some examples of this usage: symlinks to index files
stored several levels above, so that attempts to retrieve the index can be done
with a single system call, or files containing temporary viewing state for a
file explorer.

21) However, hidden files should otherwise behave the same as primary files,
even if the file system requires files to begin with a dot in order to hide
them. Dots appearing at the start of a basename should not be counted when
parsing out extensions, and instead should always appear as part of the base
name.
