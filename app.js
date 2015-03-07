var express = require('express');
var app = express();
app.set('view engine', 'jade');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var usuarios = {};

server.listen(3000);

app.get('/', function(req, resp) {
	resp.render(__dirname + '/public/index.jade');
});

io.sockets.on("connection", function(socket){
	socket.on("novo usuario", function(nickname, callback) {
		if(nickname in usuarios) {
			callback({retorno: false, msg: "O nickname já esta em uso. Escolha outro."});
		} else {
			console.log("Novo usuário no chat: " + nickname);
			callback({retorno : true, msg : ""});
			socket.nickname = nickname;
			usuarios[socket.nickname] = socket;
			atualizarUsuarios();
		}
	});

	socket.on("enviar mensagem", function(data){
		var mensagem = data.trim();

		var letra = mensagem.substring(0,1);
		if (letra === "/") {
			var nome = mensagem.substr(1, mensagem.indexOf(" ")).trim();
			if (nome in usuarios) {
				msg = mensagem.substr(mensagem.indexOf(" ")+1);
				usuarios[nome].emit("nova mensagem", {msg : "(mensagem privada de "+
					socket.nickname+"): <i>"+msg+"</i> ", nick : ""});

				socket.emit("nova mensagem", {msg : "(você enviou para "+
					nome+"): <i>"+msg+"</i> ", nick : ""});
			} else {
				socket.emit("nova mensagem", {msg : "(O usuário "+
					nome+" não foi encontrado.", nick : ""});
			}
		} else {
			io.sockets.emit("nova mensagem", {msg : mensagem, nick : socket.nickname + ": "});
		}
	});

	socket.on("disconect", function(){
		if (!socket.nickname) return;
		delete usuarios[socket.nickname];
		atualizarUsuarios();
	});

	function atualizarUsuarios() {
		io.sockets.emit("atualiza usuarios", Object.keys(usuarios));
	}
});