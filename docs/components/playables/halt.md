# Halt

Use thie _playable_ to end the game early.
```js
var p1 = // some playable
var h = Halt()
var p3 = // some other playable

h(p1)   // play h after p1
p3(h)   // play p3 after h

p1.play() // p1 will play, then h, then the game will end. p3 will not get called.
```

`Halt` requires no parameters, but can use any of the optional parameters that all _playables_ support.

Of course, once the game runs out of _playables_, it halts on its own and there's no need to use `Halt`. The most likely use case then for `Halt` is for games which already have complex branching, but one branch needs to unconditionally halt all the others. In the example below, assume that all variables refer to _playables_
```js
// both p2a and p2b will get played after p1. 
var p1, p2b, p3, p4
var p2b = Choice(player, ["up","down"])
var h = Halt()

p2a(p1)
p2b(p1)

p3(p2a)     // p3 then p4 will happen in the p2a branch
p4(p3)

h(p2b.down) // if the player chooses "down", halt the game. 

p1.play()   // p1 will play, then both p2a, p2b. p2a will then call p3 and p2b will call h if the player chooses "down".  If h is called, then the game will halt so that p4 doesn't get called.
```