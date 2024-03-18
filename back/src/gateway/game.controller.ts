// ranking.controller.ts
import { Controller, Post, Body, Req, UseGuards, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetUser } from '../auth/decorator/get-user.decorator'; 
import JwtAuthenticationGuard from "../jwt-guard/jwt-guard.guard";
import { UserService } from '../user/user.service';

@Controller('game')
export class GameController {
constructor(private readonly userService: UserService,
	private readonly prisma: PrismaService) {}

	private updatePlayerRank(rankRate: number) {
		if (rankRate < 10)
			return ('Rookie');
		else if (rankRate >= 10 && rankRate < 20)
			return ('Novice');
		else if (rankRate >= 20 && rankRate < 30)
			return ('Adept');
		else if (rankRate >= 30 && rankRate < 40)
			return ('Master');
		else if (rankRate >= 40)
			return ('Legend');
	}
	async updateAchievements(user: any, gameData: { isDouble: boolean, scorex: number, scorey: number}) {
		const currentAchievements = await this.prisma.achievement.findFirst({where: { id: user.id }});
		const currentGameInfo = gameData.isDouble ? 
			await this.prisma.doubleGame.findUnique({ where: { id: user.id } }) :
			await this.prisma.simpleGame.findUnique({ where: { id: user.id } });

		if (!gameData.isDouble && currentGameInfo.rank === 'Adept')
			await this.checkAndUnlockAchievement(user.id, currentAchievements.all_index, 1);
		if (gameData.isDouble && currentGameInfo.rank === 'Adept')
			await this.checkAndUnlockAchievement(user.id, currentAchievements.all_index, 2);
		if (!gameData.isDouble && currentGameInfo.win + currentGameInfo.lose === 11)
			await this.checkAndUnlockAchievement(user.id, currentAchievements.all_index, 3);
		if (gameData.isDouble && currentGameInfo.win + currentGameInfo.lose === 11)
			await this.checkAndUnlockAchievement(user.id, currentAchievements.all_index, 4);
		if (gameData.scorex === 11 && gameData.scorey === 0)
			await this.checkAndUnlockAchievement(user.id, currentAchievements.all_index, 5);
		return (await this.prisma.achievement.findFirst({
			where: { id: user.id }
		}));
	}

	async checkAndUnlockAchievement(id: number, allIndex: number[], achievementIndex: number) {
		const achievementExists = allIndex.includes(achievementIndex);
		if (!achievementExists)
		{
			await this.prisma.achievement.update({
				where: { id: id },
				data: { all_index: { push: achievementIndex } }
			});
		}
	}
	
	@Post('set-newGame')
	@UseGuards(JwtAuthenticationGuard)
	async setNewGame(@GetUser() user: any, @Body() data: { isDouble: boolean, currRankRate: number, currWin: number, currLose: number, points: number, hasWon: boolean, scorex: number, scorey: number }) {
		const newRankRate = data.currRankRate + data.points;
		if (data.isDouble)
		{
			await this.prisma.doubleGame.update({
				where: { id: user.id },
				data: {
					rank: this.updatePlayerRank(newRankRate),
					rankRate: newRankRate > 0 ? newRankRate : 0,
					win: (data.hasWon ? data.currWin + 1 : data.currWin),
					lose: (data.hasWon ? data.currLose : data.currLose + 1)
				}
			});
		}
		else {
			await this.prisma.simpleGame.update({
				where: { id: user.id },
				data: {
					rank: this.updatePlayerRank(newRankRate),
					rankRate: newRankRate > 0 ? newRankRate : 0,
					win: (data.hasWon ? data.currWin + 1 : data.currWin),
					lose: (data.hasWon ? data.currLose : data.currLose + 1)
				}
			});
		}
		const badges = await this.updateAchievements(user, {isDouble: data.isDouble, scorex: data.scorex, scorey: data.scorey})
		return (badges.all_index);
	}

	@Post('match-history')
	@UseGuards(JwtAuthenticationGuard)
	async matchHistory(@GetUser() user: any, @Body() body: { difficulty: string, rankRate: number, scorex: number, scorey: number, isDouble: boolean, date: string, opponentName: string, opponentRR: number})
	{
		const opponentData = await this.userService.getUserByName(body.opponentName);
		return (await this.prisma.matchHistory.create({
			data: {
				rankRate: body.rankRate,
				score_x: body.scorex,
				score_y: body.scorey,
				mode: body.isDouble ? "Double" : "Simple",
				difficulty: body.difficulty,
				date: body.date,
				winner: body.scorex > body.scorey,
				opponentId: opponentData.id,
				opponentRR: body.opponentRR,
				user: {
					connect: {
						id: user.id,
					},
				},
			},
		}));
	}

	@Get('get-match-history')
	@UseGuards(JwtAuthenticationGuard)
	async getMatchHistory(@Query('name') name: string) {
		const userData = await this.userService.getUserByName(name);
		const matchs = await this.prisma.matchHistory.findMany({
			where: { userId: userData.id }
		});
		const opponentIds = matchs.map(match => match.opponentId);
		const opponents = await this.prisma.user.findMany({
			where: {
				id: {
					in: opponentIds,
				},
			},
			select: {
				id: true,
				name: true,
				pfp_url: true,
			},
		});
		const matchsData = matchs.map((match: any) => {
			return ({...match, opponent: opponents.find((opponent: any) => opponent.id === match.opponentId)});
		});
		return (matchsData.reverse());
	}

	@Get('get-opponent')
	@UseGuards(JwtAuthenticationGuard)
	async getOpponentInfo(@Query('username') username: string, @Query('mode') mode: string) {
		const opponent = await this.prisma.user.findUnique({ 
			where: { name : username },
		});
		if (opponent)
		{
			const achievement = await this.prisma.achievement.findFirst({
				where: { id : opponent.id },
			});
			if (mode === "Double")
			{
				const doubleGame = await this.prisma.doubleGame.findFirst({
					where: { id: opponent.id },
				});
				if (doubleGame)
					return { pfp: opponent.pfp_url, rank: doubleGame.rank, rankRate: doubleGame.rankRate, badgeIdx: achievement.selected };
			}
			const simpleGame = await this.prisma.simpleGame.findFirst({
				where: { id: opponent.id },
			});
			if (simpleGame)
				return { pfp: opponent.pfp_url, rank: simpleGame.rank, rankRate: simpleGame.rankRate, badgeIdx: achievement.selected };
		}
		return (null);
	}


	@Get('leaderboard')
	@UseGuards(JwtAuthenticationGuard)
	async getLeaderboard(@Req() req: any) {
		const users = await this.prisma.user.findMany({
			select: {
				name: true,
				pfp_url: true,
				friendRequest: true,
				achievement: {
					select: {
						selected: true
					}
				},
				simpleGames: {
					select: {
						rank: true,
						win: true,
						lose: true
					}
				},
				doubleGames: {
					select: {
						rank: true,
						win: true,
						lose: true
					}
				}
			},
		});
		const leaderboardData = users.map((user) => ({
			name: user.name,
			pfp_url: user.pfp_url,
			simpleGameRank: user.simpleGames[0].rank,
			doubleGameRank: user.doubleGames[0].rank,
			simpleGameWin: user.simpleGames[0].win,
			simpleGameLose: user.simpleGames[0].lose,
			doubleGameWin: user.doubleGames[0].win,
			doubleGameLose: user.doubleGames[0].lose,
			badgeIdx: user.achievement[0].selected,
			isPending: user.friendRequest.includes(req.user.name)
		}));
		return (leaderboardData);
	}
}
