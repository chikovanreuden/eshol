# eshol
eshol stands for "Electronic Shoppinglist".
Its mainly just a Project for me to learn Typescript, SQL (MariaDB/MySQl) and how to combine those 2 Things.

## TODO:
* Build: Finish the 'build' Script

## Why the internal() function in Classes and the not exported WeakMaps?
Turns out: Private Fields aren't private in Typescript. The Reason is that JavaScript does not properly support private Fields.
JavaScript treats any Class just like an Object. Marking a Class Field or Member in Typescript prevents accidental Access to thoses Fields while writing Code in Typescript, but the fields still exist in the Object and can be accessed in Vanila JavaScript... so it does when using Functions similiar to toJson or toString.
This behavior leads to leaking Information wich shouldn't be exposed in some Cases.