import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets'; import { Server, Socket } from 'socket.io';

//LK Object pour la balle
interface BallObj {
	PosX: number;
	PosY: number;
	VecX: number;
	VecY: number;
	Speed: number;
	Bounce: number;
}
//LK Object pour le joueur
interface PlayerObj {
	Name: string;
	Client: Socket;
	PaddlePosition: number;
	Ball: BallObj | undefined;
	Score: number;
	Speed: number;
	Double: boolean;
	ScoredLastPoint: boolean;
	Lobby: number;
	Paused: boolean;
	Reconnected: boolean;
	Playable: boolean;
}

@WebSocketGateway({
	cors: {
		origin: process.env.URL_LOCAL_FRONT,
	  }
})

export class GameServer implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	//LK y a une seule balle la pour tous le serveur, faudra faire une balle par match

	//LK tous les joueurs co au serveur seront la dedans
	private Players: PlayerObj[] = [];
	private room: number = 0;
	private waitingList: Map <string, PlayerObj> = new Map();
	//LK maintenant cette map va prendre un tableau d'object au lieu d'un tableau de Socket, dedans il y a les 2 joueurs dans une partie
	private roomSocketMap: Map <number, PlayerObj[]> = new Map();
	private roundLock = Promise.resolve();


	removeFromRoom(client: Socket)
	{
		for (const [lobby, players] of this.roomSocketMap.entries())
		{
			const index = players.findIndex(player => player === this.findPlayerBySocket(client));
			if (index !== -1)
			{
				players.splice(index, 1)
				if (players.length === 0)
					this.roomSocketMap.delete(lobby);
			}
		}
	}

	touchedPaddle(player: PlayerObj, VecXdirection: number)
	{
		let relativePosition = player.Ball.PosY - player.PaddlePosition;
		if (relativePosition > 13)
			relativePosition = 13;
		else if (relativePosition < 0)
			relativePosition = 0;
		const angle = -65 + ((relativePosition) / 13) * 130;
		player.Ball.Bounce++;
		player.Ball.VecX = Math.cos((angle * Math.PI) / 180);
		player.Ball.VecY = Math.sin((angle * Math.PI) / 180);
		player.Ball.VecX = player.Ball.VecX * VecXdirection;
		player.Ball.Speed = (20 + player.Ball.Bounce) * player.Speed + (Math.abs(angle) / 2);
	}

	UpdateBallDouble(player1: PlayerObj, player2: PlayerObj, lobby: number) : Promise<number> { //LK la meme fonction que celle d'en dessous mais avec quelques conditions en plus pour le mode Double
		return (new Promise<number>((scorer) => {
			const update = () => {
				if (!this.roomSocketMap.get(lobby))
					return ;
				player1.Ball.PosX += player1.Ball.VecX * player1.Ball.Speed * (10 / 1000);
				player1.Ball.PosY += player1.Ball.VecY * player1.Ball.Speed * (10 / 1000);
				player1.Client.emit("ballMoved", player1.Ball.PosX, player1.Ball.PosY, (player1.Ball.Speed * (10 / 1000)));
				player2.Client.emit("ballMoved", 50.2 + (50.2 - player1.Ball.PosX), player1.Ball.PosY, (player1.Ball.Speed * (10 / 1000)));
				if (player1.Ball.PosY <= 0) //LK si ca touche le toit
					player1.Ball.VecY = Math.abs(player1.Ball.VecY);
				if (player1.Ball.PosY >= 97 && player1.Ball.VecY > 0) //LK si ca touche le sol
					player1.Ball.VecY = player1.Ball.VecY * -1;
				if ((player1.Ball.PosX > 24.5 && player1.Ball.PosX < 27.8 && player1.Ball.PosY > player2.PaddlePosition + 15 && player1.Ball.PosY < player2.PaddlePosition + 16) || (player1.Ball.PosX > 72.5 && player1.Ball.PosX < 75.8 && player1.Ball.PosY > player1.PaddlePosition + 15 && player1.Ball.PosY < player1.PaddlePosition + 16))
				{ //LK ce if check si la balle touche la partie horizontale du paddle
					player1.Ball.VecY = Math.abs(player1.Ball.VecY);
					setTimeout(update, 10);
				}
				else if (((player1.Ball.PosX > 24.5 && player1.Ball.PosX < 27.8 && player1.Ball.PosY > player2.PaddlePosition - 3 && player1.Ball.PosY < player2.PaddlePosition - 2) || (player1.Ball.PosX > 72.5 && player1.Ball.PosX < 75.8 && player1.Ball.PosY > player1.PaddlePosition - 3 && player1.Ball.PosY < player1.PaddlePosition - 2)) && player1.Ball.VecY > 0)
				{ //LK ce if check si la balle touche la partie horizontale du paddle
					player1.Ball.VecY = player1.Ball.VecY * -1;
					setTimeout(update, 10);
				}
				else if (player1.Ball.VecX > 0) //LK si la balle va de gauche a droite ca check tout ce que ca peut toucher
				{
					if (((player1.Ball.PosX >= 91.7 && player1.Ball.PosX < 92.7) || (player1.Ball.PosX >= 24.5 && player1.Ball.PosX < 25)) && (player2.PaddlePosition + 15 >= player1.Ball.PosY && player2.PaddlePosition - 2 < player1.Ball.PosY))
						this.touchedPaddle(player2, -1);
					else if (player1.Ball.PosX >= 72.5 && player1.Ball.PosX < 73 && player1.PaddlePosition + 15 >= player1.Ball.PosY && player1.PaddlePosition - 2 < player1.Ball.PosY)
						this.touchedPaddle(player1, -1);
					else if (player1.Ball.PosX >= 93.6 && (player1.Ball.PosY < 25.5 || player1.Ball.PosY > 72) && player1.Ball.VecX > 0) //LK si ca touche les poteaux
						player1.Ball.VecX = player1.Ball.VecX * -1;
					else if (player1.Ball.PosX >= 93.6)
					{
						player1.ScoredLastPoint = true;
						scorer(player1.Score++);
						return ;
					}
					setTimeout(update, 10);
				}
				else if (player1.Ball.VecX < 0) //LK la on check de droite a gauche
				{
					if (((player1.Ball.PosX <= 8.7 && player1.Ball.PosX > 7.7) || (player1.Ball.PosX <= 75.8 && player1.Ball.PosX > 75.3)) && (player1.PaddlePosition + 15 >= player1.Ball.PosY && player1.PaddlePosition - 2 < player1.Ball.PosY))
						this.touchedPaddle(player1, 1);
					else if (player1.Ball.PosX <= 27.8 && player1.Ball.PosX > 27.3 && player2.PaddlePosition + 15 >= player1.Ball.PosY && player2.PaddlePosition - 2 < player1.Ball.PosY)
						this.touchedPaddle(player2, 1);
					else if (player1.Ball.PosX <= 6.9 && (player1.Ball.PosY < 25.5 || player1.Ball.PosY > 72) && player1.Ball.VecX < 0)
						player1.Ball.VecX = player1.Ball.VecX * -1;
					else if (player1.Ball.PosX <= 6.9)
					{
						player1.ScoredLastPoint = false;
						scorer(player2.Score++);
						return ;
					}
					setTimeout(update, 10);
				}
			};
			setTimeout(update, 10);
		}));
	}

	UpdateBall(player1: PlayerObj, player2: PlayerObj, lobby: number) : Promise<number> {
		return (new Promise<number>((scorer) => {
			const update = () => {
				if (!this.roomSocketMap.get(lobby))
					return ;
				player1.Ball.PosX += player1.Ball.VecX * player1.Ball.Speed * (10 / 1000); //LK pour pas avoir 50 tableaux j'ai mis l'object Ball dans l'object du player, player 1 et player 2 ont la meme balle
				player1.Ball.PosY += player1.Ball.VecY * player1.Ball.Speed * (10 / 1000);
				player1.Client.emit("ballMoved", player1.Ball.PosX, player1.Ball.PosY, (player1.Ball.Speed * (10 / 1000)));
				player2.Client.emit("ballMoved", 50.2 + (50.2 - player1.Ball.PosX), player1.Ball.PosY, (player1.Ball.Speed * (10 / 1000)));
				
				if (player1.Ball.PosY <= 0) //LK si ca touche le toit
					player1.Ball.VecY = Math.abs(player1.Ball.VecY);
				if (player1.Ball.PosY >= 97 && player1.Ball.VecY > 0) //LK si ca touche le sol
					player1.Ball.VecY = player1.Ball.VecY * -1;
				if (player1.Ball.PosX < 91.7 && player1.Ball.PosX > 8.7) //LK ici la balle bouge sans changer de direction
					setTimeout(update, 10);
				else if (player1.Ball.PosX < 92.7 && player1.Ball.PosX >= 91.7 && (player2.PaddlePosition + 15 >= player1.Ball.PosY && player2.PaddlePosition - 2 < player1.Ball.PosY))
				{
					this.touchedPaddle(player2, -1);
					setTimeout(update, 10); //LK ici ca change de direction
				}
				else if (player1.Ball.PosX > 7.7 && player1.Ball.PosX <= 8.7 && (player1.PaddlePosition + 15 >= player1.Ball.PosY && player1.PaddlePosition - 2 < player1.Ball.PosY))
				{
					this.touchedPaddle(player1, 1);
					setTimeout(update, 10); //LK ici ca change de direction
				}
				else if ((player1.Ball.PosX > 91.7 && player1.Ball.PosX < 94.7) || (player1.Ball.PosX < 8.7 && player1.Ball.PosX > 5.7)) //LK ici ca avance un peu avant de compter le but
					setTimeout(update, 10);
				else if (player1.Ball.PosX >= 94.7)
				{
					player1.ScoredLastPoint = true;
					scorer(player1.Score++); //LK joueur de gauche a marquer
				}
				else if (player1.Ball.PosX <= 5.7)
				{
					player1.ScoredLastPoint = false;
					scorer(player2.Score++); //LK joueur de droite a marquer
				}
			};
			setTimeout(update, 10);
		}));
	}

	async gameLoop(player1: PlayerObj, player2: PlayerObj, lobby: number): Promise<void> {
		if (player1.Double)
			await this.UpdateBallDouble(player1, player2, lobby);
		else
			await this.UpdateBall(player1, player2, lobby);
		player1.Client.emit('playerScored', { x: player1.Score, y: player2.Score });
		player2.Client.emit('playerScored', { x: player2.Score, y: player1.Score });
		if (player1.Score >= 11 || player2.Score >= 11)
		{
			this.resetPlayer(player1);
			this.resetPlayer(player2);
			this.roomSocketMap.delete(lobby);
			return ;
		}
		player1.Playable = true;
		player2.Playable = true;
	}

	//LK on peut pas faire de vrai Timeout ni Interval dans un while loop, j'ai donc fais pareil qu'on haut du recursive, j'ai pas pu tester
	startRound(player1: PlayerObj, player2: PlayerObj, lobby: number) {
		if (player1.Paused || player2.Paused)
		{
			player1.Client.emit('pauseState', true, player1.Paused ? "header" : "waiting");
			player2.Client.emit('pauseState', true, player2.Paused ? "header" : "waiting");
			player1.Playable = true;
			player2.Playable = true;
			return ;
		}
		const tempRand = Math.random() * 130 - 65;
		player1.Ball = {
			PosX: player1.ScoredLastPoint ? 47.2 : 53.2,
			PosY: Math.random() * 97,
			VecX: Math.cos((tempRand * Math.PI) / 180),
			VecY: Math.sin((tempRand * Math.PI) / 180), //LK random direction de la balle au debut du round
			Speed: 20 * player1.Speed + (Math.abs(tempRand) / 2),
			Bounce: 0
		};
		if (!player1.ScoredLastPoint)//LK nouveau bool si le player1 a marquer le point la balle va vers l'autre au debut du prochain round
			player1.Ball.VecX = player1.Ball.VecX * -1;
		player2.Ball = player1.Ball;
		player1.Client.emit('roundStart', player1.Ball.PosX, player2.Ball.PosY);
		player2.Client.emit('roundStart',  50.2 + (50.2 - player1.Ball.PosX), player2.Ball.PosY);
		setTimeout(() => {
			this.gameLoop(player1, player2, lobby);
		}, 1250);
	}

	resetPlayer(player: PlayerObj) {
		player.PaddlePosition = 42;
		player.Score = 0;
		player.Playable = true;
	}

	//LK cette fonction pour trouver rapidement l'object dans this.Players par rapport au Socket, ATTENTION: au cas ou ca trouves pas le Socket ca retourne undefined
	findPlayerBySocket(SocketToFind: Socket): PlayerObj | undefined {
		return this.Players.find(player => player.Client === SocketToFind);
	}

	findPlayerByName(NameToFind: string): PlayerObj | undefined {
		return this.Players.find(player => player.Name === NameToFind);
	}

	makeLobby(player: PlayerObj, otherPlayer: PlayerObj, speed: number, mode: boolean) {
		this.room++;
		const PlayersInLobby : PlayerObj[] = [];

		player.Speed = speed;
		otherPlayer.Speed = speed;
		player.Double = mode;
		otherPlayer.Double = mode;
		player.Lobby = this.room;
		otherPlayer.Lobby = this.room;

		PlayersInLobby.push(player);
		PlayersInLobby.push(otherPlayer);
		this.roomSocketMap.set(this.room, PlayersInLobby);
		player.Client.join(this.room.toString());
		otherPlayer.Client.join(this.room.toString());

		this.server.to(this.room.toString()).emit("Match starts soon", this.room);
	}

	removeFromMap(player: PlayerObj, theMap: Map<string, PlayerObj>) {
		for (const [gameMode, playerWaiting] of theMap.entries()) {
		if (player === playerWaiting) {
			theMap.delete(gameMode);
			break;
		}}
	}

	handleConnection(client: Socket) {
		// Reconnexion
		client.once('gameReconnexion', (name: string, lobby: number) => {
			let player = this.findPlayerByName(name);
			if (!player)
				return ;
			const players = this.roomSocketMap.get(player.Lobby);
			if (!players || !players[0] || !players[1])
			{
				client.emit('notReconnected');
				this.removeFromMap(player, this.waitingList);
				player.Client = client;
				return ;
			}
			if (lobby)
			{
				const scores = {x: players[0].Reconnected ? players[1].Score : players[0].Score, y: players[0].Reconnected ? players[0].Score : players[1].Score};
				player.Reconnected = true;
				player.Client = client;
				client.join(player.Lobby.toString());
				client.emit('reconnected', scores);
			}
			else if (!lobby)
			{
				client.emit('notReconnected');
				player.Reconnected = true;
				this.removeFromRoom(player.Client);
				this.server.to(player.Lobby.toString()).emit('pauseState', false);
				this.server.to(player.Lobby.toString()).emit('gameResigned', player.Name, {x: 11, y: player.Score});
				player.Client = client;
			}
		});
		// Prematch
		client.on('gameMode', (token: string, speed: number, mode: boolean, name: string) => {
			console.log("gameMode", token, speed, mode, name);
			let player = this.findPlayerByName(name);
			if (player)
				player.Client = client;
			else
			{
				player = { Name: name, Client: client, PaddlePosition: 42, Ball: undefined, Score: 0, Speed: 1, ScoredLastPoint: false, Double: false, Lobby: 0, Paused: false, Reconnected: true, Playable: true};
				this.Players.push(player);
			}
			const otherPlayer = this.waitingList.get(token);
			if (otherPlayer && otherPlayer !== player)
			{
				this.makeLobby(player, otherPlayer, speed, mode);
				this.waitingList.delete(token);
			}
			else
				this.waitingList.set(token, player);
		});
		client.on('cancelQueue', () => {this.removeFromMap(this.findPlayerBySocket(client), this.waitingList)});
		client.on('acceptMatch', async (name: string, lobby: number) => {
			if (!this.roomSocketMap.get(lobby))
				return ;
			const players = this.roomSocketMap.get(lobby);
			if (!players[0] || !players[1])
				return ;
			if (players[0].Client != client)
			{
				players[0].Client.emit('countDown', name, lobby);
				players[1].Name = name;
			}
			else
			{
				players[1].Client.emit('countDown', name, lobby);
				players[0].Name = name;
			}
			await this.roundLock;
			if (players[0].Playable && players[1].Playable)
			{
				players[0].Playable = false;
				players[1].Playable = false;
				this.roundLock = Promise.resolve();
				setTimeout(() => {
					this.startRound(players[0], players[1], lobby);
				}, 5000);
			}
			this.roundLock = Promise.resolve();
		});

		// InGame
		client.on('nextRound', async (lobby: number) => {
			if (!this.roomSocketMap.get(lobby))
				return ;
			const players = this.roomSocketMap.get(lobby);
			if (!players[0] || !players[1])
				return ;
			await this.roundLock;
			if (players[0].Playable && players[1].Playable)
			{
				players[0].Playable = false;
				players[1].Playable = false;
				this.roundLock = Promise.resolve();
				this.startRound(players[0], players[1], lobby);
			}
			this.roundLock = Promise.resolve();
		});
		client.on('movePaddle', (y: number, playerName: string, lobby: number) => {
			if (!this.roomSocketMap.get(lobby))
				return ;
			this.server.to(lobby.toString()).emit('paddleMoved', y, playerName);
			this.findPlayerBySocket(client).PaddlePosition = y;
		});
		client.on('pauseGame', (lobby: number) => {
			if (!this.roomSocketMap.get(lobby))
				return ;
			const players = this.roomSocketMap.get(lobby);
			if (!players[0] || !players[1])
				return ;
			if (players[0].Client === client)
				players[0].Paused = true;
			else if (players[1].Client === client)
				players[1].Paused = true;
		});
		client.on('endPause', (lobby: number) =>{
			if (!this.roomSocketMap.get(lobby))
				return ;
			const players = this.roomSocketMap.get(lobby);
			if (!players[0] || !players[1])
				return ;
			if (players[0].Client === client)
				players[0].Paused = false;
			else if (players[1].Client === client)
				players[1].Paused = false;
			this.server.to(lobby.toString()).emit('pauseState', false);
			if (players[0].Playable && players[1].Playable)
				this.startRound(players[0], players[1], lobby);
		});
		client.on('resignGame', (lobby: number, resigner: string) => {
			if (!this.roomSocketMap.get(lobby))
				return ;
			const players = this.roomSocketMap.get(lobby);
			if (!players[0] || !players[1])
				return ;
			players[0].Paused = false;
			players[1].Paused = false;
			if (players[0].Score !== 11 && players[1].Score !== 11)
			{
				const scores = {x: 11, y: players[0].Name === resigner ? players[0].Score : players[1].Score};
				this.server.to(lobby.toString()).emit('gameResigned', resigner, scores);
			}
			this.resetPlayer(players[0]);
			this.resetPlayer(players[1]);
			this.roomSocketMap.delete(lobby);
		});
	}

	handleDisconnect(client: Socket): any {
		const player = this.findPlayerBySocket(client);
        this.removeFromMap(player, this.waitingList);
		if (!player)
		{
			this.removeFromRoom(client);
			this.Players = this.Players.filter((player) => player.Client !== client);
			return ;
		}
		player.Client.leave(player.Lobby.toString());
		player.Paused = true;
		player.Reconnected = false;
		//LK si le client qui s'est deco etait en pleine game on lui donne 60 secondes pour qu'il se reco sinon c'est forfait
		const reconnecting = new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve();
				}, 60000);
			});
			const checkIfReconnected = setInterval(() => {
				if (player.Reconnected)
					clearInterval(checkIfReconnected);
			}, 1000);
			reconnecting.then(() => {
				if (!player.Reconnected)
				{
					this.server.to(player.Lobby.toString()).emit('pauseState', false);
					this.server.to(player.Lobby.toString()).emit('gameResigned', player.Name, {x: 11, y: player.Score});
					this.removeFromRoom(client);
					this.Players = this.Players.filter((player) => player.Client !== client);
				}
		});
	}
}
