//Loads the playables that will be used by Nash. This is basically the controller list: if it's not in these lists,
// then it won't be available for us. 

//Playables
var {_Playable} 					= require('./playable');
var {_Choice, Choice} 				= require('./choice');
var {_Turn, Turn} 					= require('./turn');
var {_Game, Game}					= require('./game');
var {_Loop, Loop} 					= require('./loop');
var {_SLoop, StochasticLoop}		= require('./stochasticLoop');
var {_Halt, HaltIf}					= require('./halt-if');
var {_SHalt, StochasticHalt}		= require('./stochastic-halt');
var {_Lambda, Lambda}				= require('./lambda');
var {_RPChoice, RandomPlayerChoice} = require('./random-player-choice');

exports.playableClasses = {_Playable, _Choice, _Turn, _Game, _Loop, _SLoop, _Halt, _SHalt, _Lambda, _RPChoice};
exports.playableInterfaces = {Choice, Turn, Game, Loop, StochasticLoop, HaltIf, StochasticHalt, Lambda, RandomPlayerChoice};