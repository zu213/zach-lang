console.log( 
 'test' )
// Automatic semicolon insertion (ASI) edge case
let x = 1
( 
 function( 
  )
{ 
 console.log( 
 'IIFE works even without semicolon!' ) } )
( 
  )
addEventListener( 
 'DOMContentLoaded', function( 
  )
{ 
 const titleElement = document.getElementById( 
 'title' )
titleElement.style.fontSize = '50px'
// Traditional function with nested block
function myFunc( 
  )
{ 
 console.log( 
 'hello' )
if ( 
 true &&
false )
{ 
 console.log( 
 'hi' ) }
else if ( 
 true )
console.log( 
 'else single-line' )
// ASI on single line }
// Arrow function with block body
const test = ( 
  )=> { 
 console.log( 
 'test' ) }

// Arrow function with implicit return
const getValue = ( 
  )
=> 'implicit return'
// Arrow returning object literal (wrapped in parentheses)
const getObj = ( 
  )=> ( 
 { 
 a: 1 } )

// Single-line for loop
for ( 
 let i = 0;i < 3;i++ )
console.log( 
 i )
// Multi-line for loop with empty block
for ( 
 let i = 0;i < 2;i++ )
{ 
  }
// While loop
let y = 0
while ( 
 y < 2 )
y++
// Do-while
let z = 0
do { 
 z++ }
while ( 
 z < 2 )
// Ternary operator returning function
const run = true ? ( 
  )=> console.log( 
 'yes' )

: ( 
  )=> console.log( 
 'no' )

run( 
  )
// Template literals and optional chaining
const name = 'Zach'
console.log( 
 `Hello ${name?.toUpperCase()}` )
// Try-catch-finally
try { 
 throw new Error( 
 'Oops' ) }
catch ( 
 e )
{ 
 console.warn( 
 'Caught error:', e.message ) }
finally { 
 console.log( 
 'Always runs' ) }
// Labeled block and break
outer: { 
 console.log( 
 'Before break' )
break outer
console.log( 
 'Never runs' ) }
// Destructuring and default parameters
const printUser = ( 
 { 
 name, age = 18 } )=> { 
 console.log( 
 `${name} is ${age} years old` ) }

printUser( 
 { 
 name: 'Alice' } )