import { useNavigate  } from 'react-router-dom';
import { useState, useContext } from 'react';
import styled from 'styled-components'
import { GameContext } from '../../../utils/context/GameContext/index.tsx';
import { SoundContext } from '../../../utils/context/SoundContext/index.tsx'
import { ProfileContext } from '../../../utils/context/ProfileContext/index.tsx';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-evenly;
	align-items: center;
	text-align: center;
	width: 100%;
	height: 100%;
`;

const MenuTitle = styled.h1`
	font-size: 3.7vh;
	margin: 1vh;
`;

const StyledLink = styled.a`
	width: 73.5%;
	padding: 1vh;
	margin: 0.2vh;
	font-size: 2.5vh;
	border: 1px solid rgb(75, 75, 75, 0.9);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`;

const MenuButton = styled.button`
	width: 75%;
	padding: 1vh;
	font-size: 2.5vh;
	border: 1px solid rgb(75, 75, 75, 0.9);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`;

const ButtonContainer = styled.div`
	width: 80%;
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
	align-items: center;
`;

const SpeedButton = styled.button`
	height: 100%;
	width: 29.3%;
	padding: 2vh;
	font-size: 2.7vh;
	border: 1px solid rgb(75, 75, 75, 0.9);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`;

const Description = styled.p`
	font-size: 2.1vh;
	margin: 0.5vh;
`;

const PrevLink = styled.button`
	height: auto;
	width: auto;
	font-size: 1.9vh;
	border: 1px solid dimgrey;
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`;

function ModeMenu()
{
	const [ online, setOnline ] = useState('Online Mode');
	const { setStatus, logged, setLogged, tfa } = useContext(ProfileContext);
	const { dataGame, setDataGame, showMode, setShowMode, setIsAmical } = useContext(GameContext);
	const { handleSFX, handleChangeMusic, gameMusic, battleMusic, currentSong, playlist} = useContext(SoundContext);
	const navigate = useNavigate();

	const handleModeClick = (modeParam: string) => {
		setDataGame({...dataGame, mode: modeParam});
		setShowMode(false);
		handleSFX("clic");
	};
	const handleOptionClick = (doubleParam?: boolean, speedParam?: number) => {
		if (doubleParam !== undefined && doubleParam !== dataGame.isDouble)
		{
			setDataGame({...dataGame, isDouble: doubleParam});
			handleSFX("clic");
		}
		if (speedParam !== undefined && speedParam !== dataGame.speed)
		{
			setDataGame({...dataGame, speed: speedParam});
			handleSFX("clic");
		}
	}
	const handleValidate = () => {
		handleSFX("clic");
		setShowMode(true);
		setIsAmical(false);
		setStatus(dataGame.mode === "Online" ? "In Matchmaking" : "In Game");
		if (gameMusic && battleMusic && currentSong !== playlist.findIndex((song) => song.title === 'Battle'))
			handleChangeMusic();
	}
	const handleGoBack = () => {
		setDataGame({mode: undefined, isDouble: undefined, speed: undefined, id: undefined, opponent: undefined});
		setShowMode(true);
		handleSFX("goBack");
	}
	const handleExit = () => {
		handleSFX("exit");
		navigate(-1);
	}
	const handleLogin = async () => {
		try {
			window.location.href = `${process.env.REACT_APP_URL_LOCAL_BACK}/authentification`;
			if (tfa !== "enable")
				setLogged(true);
		} catch (error) {
			console.log(error);
		}
	};
	return (<Container>
				<MenuTitle style={{ display: showMode ? 'block' : 'none' }}>Choose Your Game Mode</MenuTitle>
				{logged ? <MenuButton onClick={() => handleModeClick("Online")} style={{ display: showMode ? 'inline-block' : 'none' }}>Online Mode</MenuButton> :
				<StyledLink onClick={handleLogin} href='#' onMouseEnter={() => setOnline("Log In To Play")} onMouseLeave={() => setOnline("Online Mode")} style={{ display: showMode ? 'inline-block' : 'none' }}>{online}</StyledLink>}
				<Description style={{ display: showMode ? 'block' : 'none' }}>Play against opponents from around the world with a matchmaking system.<br />Show who is the best in exciting online Pong duels.</Description>
				<MenuButton onClick={() => handleModeClick("Bot")} style={{ display: showMode ? 'inline-block' : 'none' }}>Bot Mode</MenuButton>
				<Description style={{ display: showMode ? 'block' : 'none' }}>Challenge a computer-controlled opponent in Bot Mode.<br />Test your abilities in an exciting game of Pong against a challenging AI.</Description>
				<MenuButton onClick={() => handleModeClick("Local")} style={{ display: showMode ? 'inline-block' : 'none' }}>Local Mode</MenuButton>
				<Description style={{ display: showMode ? 'block' : 'none' }}>Share fun face-to-face moments with a friend on the same computer,<br />engaging in intense Pong battles where every move counts.</Description>
				<MenuButton onClick={() => handleModeClick("Training")} style={{ display: showMode ? 'inline-block' : 'none' }}>Training Mode</MenuButton>
				<Description style={{ display: showMode ? 'block' : 'none' }}>Enhance your Pong skills in a revamped training mode featuring targets.<br />Strive for precision in this enemy-free training mode for an optimal practice experience.</Description>
				<PrevLink style={{ display: showMode ? 'block' : 'none' }} onClick={handleExit}>Go Back</PrevLink>
				<MenuTitle style={{ display: !showMode ? 'block' : 'none' }}>Choose Your Game Option</MenuTitle>
				<MenuButton onClick={() => handleOptionClick(false, undefined)} style={{ display: !showMode ? 'inline-block' : 'none' }}>Simple{dataGame.isDouble === false && <span style={{fontSize: "2.1vh"}}> ✓</span>}</MenuButton>
				<Description style={{ display: !showMode && dataGame.mode !== "Training" ? 'block' : 'none' }}>Each player controls a paddle to bounce the ball back to their opponent.<br />The objective is to score points without letting the ball pass behind their own paddle.</Description>
				<Description style={{ display: !showMode && dataGame.mode === "Training" ? 'block' : 'none' }}>Hone your precision, your objective is clear, you must get the ball into the hole.<br />Focus on accuracy as you attempt to master the art of delivering the perfect hit.</Description>
				<MenuButton onClick={() => handleOptionClick(true, undefined)} style={{ display: !showMode ? 'inline-block' : 'none' }}>Double{dataGame.isDouble === true && <span style={{fontSize: "2.1vh"}}> ✓</span>}</MenuButton>
				<Description style={{ display: !showMode && dataGame.mode !== "Training"  ? 'block' : 'none' }}>Each player manages one paddle within their territory and one on their opponent's territory,<br />introducing a strategic gameplay dynamic where players must juggle between the two to score points.</Description>
				<Description style={{ display: !showMode && dataGame.mode == "Training"  ? 'block' : 'none' }}>With the double option, you must hit a target before putting the ball in the hole.<br />Precision and control are key as you navigate through the heightened difficulty of this mode.</Description>
				<MenuTitle style={{ display: !showMode ? 'block' : 'none' }}>Choose Your Game Difficulty</MenuTitle>
				<ButtonContainer style={{ display: !showMode ? 'flex' : 'none' }}>
					<SpeedButton onClick={() => handleOptionClick(undefined, 1)}>Easy{dataGame.speed === 1 && <span style={{fontSize: "2.3vh"}}> ✓</span>}</SpeedButton>
					<SpeedButton onClick={() => handleOptionClick(undefined, 1.5)}>Medium{dataGame.speed === 1.5 && <span style={{fontSize: "2.3vh"}}> ✓</span>}</SpeedButton>
					<SpeedButton onClick={() => handleOptionClick(undefined, 2)}>Hard{dataGame.speed === 2 && <span style={{fontSize: "2.3vh"}}> ✓</span>}</SpeedButton>
				</ButtonContainer>
				<MenuButton onClick={handleValidate} style={{ width: "55%", margin: "1.5vh", marginTop: "1.5vh", display: !showMode ? "inline-block" : "none", visibility: (dataGame.isDouble !== undefined && dataGame.speed !== undefined) ? 'visible' : 'hidden' }}>Play {dataGame.mode} Mode</MenuButton>
				<PrevLink style={{ display: !showMode ? 'block' : 'none', marginBottom: !showMode ? "-0.2vh" : ""}} onClick={handleGoBack}>Go Back</PrevLink>
			</Container>);
}

export default ModeMenu;
